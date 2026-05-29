# 🧊 NeuroNesh 3D — AI-Powered 3D Model Generator

<p align="center">
  <strong>A premium, full-stack web application for generating production-grade 3D models from images, text prompts, and multi-view photographs using the Tripo AI API.</strong>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Troubleshooting](#-troubleshooting)
- [API Endpoints](#-api-endpoints)
- [Credits & Billing](#-credits--billing)
- [License](#-license)

---

## 🌐 Overview

NeuroNesh 3D is a comprehensive web-based platform that leverages the **Tripo AI v2 API** to transform 2D images and text descriptions into high-fidelity 3D models. The application features a cyberpunk-inspired premium UI with a real-time WebGL viewport, an asynchronous task pipeline, and support for the full suite of Tripo's AI capabilities — including mesh refinement, stylization, animation rigging, and cross-format conversion.

---

## ✨ Features

### 🎨 Generation Modes
| Mode | Description |
|------|-------------|
| **Image to 3D** | Upload a single image to generate a 3D model |
| **Text to 3D** | Describe your object with a text prompt |
| **Multi-View to 3D** | Upload up to 6 angles (front, back, side, etc.) for precise reconstruction |

### 🔧 Enhancement Studio
| Feature | Description |
|---------|-------------|
| **Refine Model** | Upgrade draft meshes to high-resolution, production-ready topology |
| **AI Retexture** | Apply new textures to a model via text prompt |
| **Stylization** | Convert models to LEGO, Voxel (Minecraft), or Voronoi styles |
| **Low-Poly Optimization** | Automatically reduce polygon count |

### 🎬 Animation & Rigging
| Feature | Description |
|---------|-------------|
| **Auto-Rigging** | Automatically generate skeleton for humanoid/quadruped characters |
| **Retargeting** | Apply motion capture data (BVH/FBX) to your generated models |

### 📦 Export & Conversion
Supports all industry-standard 3D formats:
- **GLB/GLTF** — Web-ready, default output
- **OBJ** — Universal compatibility
- **FBX** — Game engines (Unity, Unreal)
- **STL** — 3D printing
- **USDZ** — Apple AR Quick Look

### 🖥️ Real-Time WebGL Viewport
- Interactive 3D model preview with orbit controls
- Multiple render modes: **Solid**, **Wireframe**, **Clay**, **Normal**, **Blend**
- Adjustable lighting presets (Studio, Night, Outdoor, Neutral)
- Live mesh statistics (vertices, triangles, materials, FPS)

### 📊 Task History
- Track all generation tasks during your session
- Click any previous task to reload its model
- Visual status indicators (queued, running, success, failed)

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js, Express.js |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **3D Rendering** | Three.js (r128) with OrbitControls & GLTFLoader |
| **File Handling** | Multer (memory storage) |
| **HTTP Client** | Native Fetch API + Axios (for streaming proxy) |
| **API** | Tripo AI v2 OpenAPI |

---

## 📁 Project Structure

```
tripo-generator/
├── server.js                  # Express backend — API proxy, file uploads, task management
├── package.json               # Node.js dependencies and scripts
├── README.md                  # This file
├── public/
│   ├── index.html             # Main application UI (premium cyberpunk dashboard)
│   ├── style.css              # Complete CSS design system
│   └── app.js                 # Frontend JavaScript — Three.js, API calls, task polling
└── node_modules/              # Installed dependencies (auto-generated)
```

---

## 📝 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **A Tripo AI API Key** — [Get one here](https://platform.tripo3d.ai/)

To verify your installations:
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

---

## 🚀 Installation

### 1. Clone or navigate to the project directory

```bash
cd /home/bits/ABINESH_Packages/tripo-generator
```

### 2. Install dependencies

```bash
npm install
```

This will install:
- `express` — Web server framework
- `cors` — Cross-origin resource sharing
- `multer` — File upload handling
- `axios` — HTTP client (used for streaming proxy)

### 3. Configure your API key

Open `server.js` and replace the API key on **Line 10**:

```javascript
const TRIPO_API_KEY = 'your_tripo_api_key_here';
```

> ⚠️ **Important:** Never share your API key publicly. For production use, store it in an environment variable instead.

### 4. Start the server

```bash
npm start
```

You should see:
```
  ╔═══════════════════════════════════════════════╗
  ║   NeuroNesh 3D — Tripo AI Generator           ║
  ║   Server running on http://localhost:3000      ║
  ╚═══════════════════════════════════════════════╝
```

### 5. Open the application

Open your browser and navigate to:

```
http://localhost:3000
```

---

## ⚙️ Configuration

### API Key

The Tripo API key is stored in `server.js` on Line 10:

```javascript
const TRIPO_API_KEY = 'tsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

You can get a new API key from the [Tripo Developer Dashboard](https://platform.tripo3d.ai/).

### Port

The default port is `3000`. To change it, modify Line 9 in `server.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

Or set it via environment variable:

```bash
PORT=8080 npm start
```

### Model Version

The default model version is `v2.5-20250123` (Best Quality). Available options in the UI dropdown:
- **v2.5** — Highest quality geometry and textures (recommended)
- **v2.0** — Standard reconstruction, balanced credits
- **v1.4** — Fast draft, quick shape generation

---

## 📖 Usage

### Generating a 3D Model from an Image

1. Open the app at `http://localhost:3000`
2. Make sure the **IMAGE** tab is selected in the left panel
3. Click the upload zone or drag-and-drop your image
4. Select your preferred **Model Version** (v2.5 recommended)
5. Toggle options: **Generate Texture**, **PBR Materials**, **Auto-fix Input**
6. Click **🔄 GENERATE 3D MODEL**
7. Wait 2-5 minutes for the model to generate (progress is shown in real-time)
8. Once complete, the 3D model loads in the viewport automatically

### Generating from Text Prompt

1. Click the **TEXT** tab in the left panel
2. Type your description (e.g., "a futuristic robot with glowing eyes")
3. Or click one of the hint chips for quick prompts
4. Click **🔄 GENERATE 3D MODEL**

### Multi-View Generation

1. Click the **MULTI-VIEW** tab
2. Upload 2-6 images of your object from different angles
3. Click **🔄 GENERATE 3D MODEL**

### Exporting Models

After generation, use the **Output & Export** panel on the right:
- Click **DOWNLOAD ORIGINAL GLTF** for the default GLB file
- Use **CONVERT TO OBJ/FBX/STL/USDZ** buttons for other formats

### Enhancement & Animation

1. Generate a model first
2. Navigate to the **ENHANCE** tab to access refinement, stylization, or retexturing
3. Navigate to the **ANIMATE** tab for auto-rigging or motion retargeting

---

## 🔧 Troubleshooting

### ❌ Error: `EADDRINUSE: address already in use :::3000`

This means port 3000 is already occupied by another process (usually a previous server instance).

**Solution — Kill the process using port 3000:**

```bash
kill $(lsof -t -i:3000)
```

Then start the server again:

```bash
npm start
```

> 💡 **Tip:** Always use `Ctrl + C` in the terminal to properly stop the server before closing the terminal window.

---

### ❌ Error: `Authentication failed`

Your API key is invalid, expired, or doesn't have the right permissions.

**Solution:**
1. Log into the [Tripo Developer Dashboard](https://platform.tripo3d.ai/)
2. Generate a new API key
3. Replace the key in `server.js` on Line 10
4. Restart the server (`Ctrl + C`, then `npm start`)

---

### ❌ Error: `You don't have enough credit to create this task`

Your Tripo account has run out of generation credits.

**Solution:**
1. Log into the [Tripo Developer Dashboard](https://platform.tripo3d.ai/)
2. Navigate to Billing → Purchase more credits
3. Or create a new account to get free trial credits

---

### ❌ Error: `One or more of your parameter is invalid`

The API request payload contains an invalid parameter.

**Solution:**
- Make sure you have uploaded an image (for Image-to-3D mode)
- Make sure you have entered a text prompt (for Text-to-3D mode)
- Check the Pipeline Log in the bottom-right corner for the exact error message

---

### ❌ Model is stuck at "Mesh Gen" for a long time

This is **normal behavior**. Tripo's v2.5 quality pipeline takes 2-5 minutes to process on their cloud GPUs. The progress bar will update automatically.

**If you want faster results:**
- Switch the Model Version dropdown to **v1.4 — Fast Draft** (generates in under 1 minute)

---

### ❌ 3D model doesn't appear in the viewport

The model URL from Tripo may have expired or been invalid.

**Solution:**
- Check the Pipeline Log for any error messages
- Try generating the model again
- Check your terminal for server-side error logs

---

## 🔌 API Endpoints

The Express backend exposes the following API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/balance` | Check Tripo API credit balance |
| `POST` | `/api/task` | Create a new generation/enhancement/animation task |
| `GET` | `/api/task/:task_id` | Poll task status and get results |
| `POST` | `/api/upload` | Upload a single image file to Tripo |
| `POST` | `/api/upload-multi` | Upload multiple images (for multi-view) |
| `GET` | `/api/proxy-file?url=...` | Proxy binary files from Tripo's S3 (CORS bypass) |

### Supported Task Types

| Task Type | Description |
|-----------|-------------|
| `text_to_model` | Generate 3D from text prompt |
| `image_to_model` | Generate 3D from a single image |
| `multiview_to_model` | Generate 3D from multiple angle images |
| `refine_model` | Upgrade mesh quality |
| `texture_model` | Re-texture an existing model |
| `stylize_model` | Apply artistic styles (lego, voxel, voronoi) |
| `animate_rig` | Auto-rig a character model |
| `animate_retarget` | Apply animation to a rigged model |
| `convert_model` | Convert between 3D file formats |
| `highpoly_to_lowpoly` | Reduce polygon count |

---

## 💰 Credits & Billing

Tripo AI uses a credit-based system. Each generation costs credits based on the model version:

| Model Version | Approximate Cost |
|---------------|-----------------|
| v2.5 (Best Quality) | ~30 credits |
| v2.0 (Standard) | ~20 credits |
| v1.4 (Fast Draft) | ~10 credits |

Your current balance is shown in the top-right corner of the application header.

> 💡 New Tripo accounts typically come with free trial credits. Check your [Tripo Dashboard](https://platform.tripo3d.ai/) for details.

---

## 📜 License

This project is for personal and educational use. The Tripo AI API is subject to Tripo's [Terms of Service](https://www.tripo3d.ai/).

---

<p align="center">
  Built with ❤️ by <strong>Abinesh</strong> — Powered by <strong>Tripo AI</strong>
</p>
