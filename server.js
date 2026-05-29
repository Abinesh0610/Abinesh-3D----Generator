const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const TRIPO_API_KEY = 'tsk_9409Qn2RnmSzlMtdHfVCA1VTGVxDmt75sBBfIKj3475';
const TRIPO_BASE_URL = 'https://api.tripo3d.ai/v2/openapi';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for file uploads (memory storage for proxying)
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  storage: multer.memoryStorage()
});

// =============================================
// Proxy File Endpoint (CORS bypass for S3 URLs)
// =============================================
app.get('/api/proxy-file', async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl || fileUrl === 'undefined' || fileUrl === 'null') {
    return res.status(400).json({ error: 'Missing or invalid url parameter' });
  }

  // Validate it's a proper URL
  try {
    new URL(fileUrl);
  } catch (e) {
    console.error('Invalid proxy URL:', fileUrl);
    return res.status(400).json({ error: 'Invalid URL format', url: fileUrl });
  }

  try {
    const response = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'stream',
      timeout: 120000
    });

    // Copy essential content headers
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    if (response.headers['content-disposition']) {
      res.setHeader('Content-Disposition', response.headers['content-disposition']);
    }

    // Add CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'public, max-age=300');

    response.data.pipe(res);
  } catch (error) {
    console.error('Error proxying file:', error.message);
    res.status(500).json({ error: 'Failed to proxy file', message: error.message });
  }
});

// =============================================
// Check Tripo API Balance
// =============================================
app.get('/api/balance', async (req, res) => {
  try {
    const response = await fetch(`${TRIPO_BASE_URL}/user/balance`, {
      headers: {
        'Authorization': `Bearer ${TRIPO_API_KEY}`
      }
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch balance');
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching balance:', error.message);
    res.status(500).json({
      error: 'Failed to fetch balance',
      details: error.message
    });
  }
});

// =============================================
// Create Task Endpoint (All task types)
// Supports: text_to_model, image_to_model, multiview_to_model,
//           refine_model, texture_model, stylize_model,
//           animate_rig, animate_retarget, convert_model,
//           mesh_segmentation, highpoly_to_lowpoly
// =============================================
app.post('/api/task', async (req, res) => {
  try {
    console.log('Creating task:', JSON.stringify(req.body, null, 2));
    const response = await fetch(`${TRIPO_BASE_URL}/task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIPO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error('Tripo task creation error:', data);
      return res.status(response.status).json({
        error: 'Failed to create task in Tripo API',
        details: data
      });
    }
    res.json(data);
  } catch (error) {
    console.error('Error creating task:', error.message);
    res.status(500).json({
      error: 'Failed to create task in Tripo API',
      details: error.message
    });
  }
});

// =============================================
// Task Status Endpoint
// =============================================
app.get('/api/task/:task_id', async (req, res) => {
  try {
    const response = await fetch(`${TRIPO_BASE_URL}/task/${req.params.task_id}`, {
      headers: {
        'Authorization': `Bearer ${TRIPO_API_KEY}`
      }
    });
    
    const data = await response.json();
    // Log task status for debugging
    if (data.data?.status === 'success') {
      console.log('Task succeeded! Output:', JSON.stringify(data.data.output, null, 2));
    } else if (data.data?.status === 'failed') {
      console.log('Task failed:', JSON.stringify(data.data, null, 2));
    }
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to fetch task status',
        details: data
      });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching task status:', error.message);
    res.status(500).json({
      error: 'Failed to fetch task status',
      details: error.message
    });
  }
});

// =============================================
// File Upload Endpoint (Multi-part proxy)
// =============================================
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    console.log(`Uploading file: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Send file to Tripo API
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname);

    const response = await fetch(`${TRIPO_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIPO_API_KEY}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok || (data.code && data.code !== 0)) {
      throw new Error(data.message || `Tripo upload failed`);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error uploading file to Tripo:', error.response ? JSON.stringify(error.response.data) : error.message);
    res.status(error.response ? error.response.status : 500).json({
      error: 'Failed to upload file to Tripo API',
      details: error.response ? error.response.data : error.message
    });
  }
});

// =============================================
// Multi-file Upload Endpoint (for multiview)
// =============================================
app.post('/api/upload-multi', upload.array('files', 6), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    const tokens = [];
    for (const file of req.files) {
      console.log(`Uploading file: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      const formData = new FormData();
      const blob = new Blob([file.buffer], { type: file.mimetype });
      formData.append('file', blob, file.originalname);

      const response = await fetch(`${TRIPO_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TRIPO_API_KEY}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || (data.code && data.code !== 0)) {
        throw new Error(data.message || `Tripo upload failed`);
      }
      
      tokens.push(data.data?.image_token || data.data?.file_token);
    }

    res.json({ data: { file_tokens: tokens } });
  } catch (error) {
    console.error('Error uploading files:', error.response ? JSON.stringify(error.response.data) : error.message);
    res.status(error.response ? error.response.status : 500).json({
      error: 'Failed to upload files to Tripo API',
      details: error.response ? error.response.data : error.message
    });
  }
});

// =============================================
// Fallback to serving public/index.html
// =============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ╔═══════════════════════════════════════════════╗`);
  console.log(`  ║   NeuroNesh 3D — Tripo AI Generator           ║`);
  console.log(`  ║   Server running on http://localhost:${PORT}      ║`);
  console.log(`  ╚═══════════════════════════════════════════════╝\n`);
});
