// --- Three.js Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
camera.position.set(2.5, 1.5, 2.5);

const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('three-canvas'), antialias: true, alpha: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const vp = document.getElementById('viewport');
function resizeRenderer() {
  const w = vp.clientWidth, h = vp.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resizeRenderer();
new ResizeObserver(resizeRenderer).observe(vp);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 1.8;
controls.minDistance = 0.5;
controls.maxDistance = 10;
controls.target.set(0, 0.2, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 8, 5);
dirLight.castShadow = true;
scene.add(dirLight);
const fillLight = new THREE.DirectionalLight(0x00d4ff, 0.6);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);
const rimLight = new THREE.DirectionalLight(0x7b2fff, 0.5);
rimLight.position.set(0, -4, 3);
scene.add(rimLight);
const gridHelper = new THREE.GridHelper(6, 12, 0x0f2a4a, 0x0a1525);
gridHelper.position.y = -0.01;
scene.add(gridHelper);

let currentModelGroup = null;
let currentGLBMaterials = [];
let renderMode = 'solid';
let frameCount = 0, lastFpsTime = 0, fpsDisplay = 0;

function animate(timestamp) {
  requestAnimationFrame(animate);
  if (currentModelGroup && document.getElementById('rb-solid').classList.contains('active') && !controls.state === -1) {
    currentModelGroup.rotation.y += 0.002;
  }
  controls.update();
  frameCount++;
  if (timestamp - lastFpsTime > 1000) {
    fpsDisplay = Math.round(frameCount * 1000 / (timestamp - lastFpsTime));
    frameCount = 0; lastFpsTime = timestamp;
    document.getElementById('stat-fps').querySelector('span').textContent = fpsDisplay;
  }
  renderer.render(scene, camera);
}
animate(0);

// --- App State ---
let activeMainTab = 'generate';
let genMode = 'image';
let selectedFiles = []; // Array of files
let taskHistory = [];
let currentTask = null;
let pollInterval = null;

// --- Initialization ---
async function initApp() {
  try {
    const res = await fetch('/api/balance');
    if (res.ok) {
      const data = await res.json();
      const bal = data.data?.balance || 0;
      document.getElementById('balance-chip').textContent = bal + ' credits';
      document.getElementById('sys-status').textContent = 'TRIPO API: CONNECTED';
      document.getElementById('status-dot').classList.add('connected');
    }
  } catch (e) {
    console.error('Balance error', e);
  }
}
initApp();

function setMainTab(tabId) {
  activeMainTab = tabId;
  document.querySelectorAll('.nav-pill').forEach(el => el.classList.remove('active'));
  document.querySelector(`.nav-pill[data-tab="${tabId}"]`).classList.add('active');
  
  ['generate', 'enhance', 'animate', 'history'].forEach(t => {
    document.getElementById(`tab-${t}`).style.display = (t === tabId) ? '' : 'none';
  });
  
  if (tabId === 'history') updateHistoryUI();
}

function switchGenMode(mode) {
  genMode = mode;
  document.querySelectorAll('#gen-mode-tabs .mode-tab').forEach(el => el.classList.remove('active'));
  event.target.classList.add('active');
  
  ['image', 'text', 'multiview'].forEach(m => {
    document.getElementById(`gen-mode-${m}`).style.display = (m === mode) ? '' : 'none';
  });
}

function addLog(msg, cls='') {
  const logArea = document.getElementById('log-area');
  const now = new Date();
  const t = `${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const line = document.createElement('div');
  line.className = 'log-line';
  line.innerHTML = `<span class="log-time">${t}</span><span class="log-msg ${cls}">${msg}</span>`;
  logArea.appendChild(line);
  logArea.scrollTop = logArea.scrollHeight;
}

function setPipeStep(stepIdx, status) {
  const pd = document.getElementById(`pd-${stepIdx}`);
  const pn = document.getElementById(`pn-${stepIdx}`);
  if (pd && pn) {
    pd.className = `pipe-dot ${status}`;
    pn.className = `pipe-name ${status}`;
  }
}

// --- File Handling ---
function handleSingleFile(files) {
  if (!files || !files.length) return;
  selectedFiles = [files[0]];
  renderImgGrid('img-grid-single');
  document.getElementById('source-no-img').style.display = 'none';
  document.getElementById('source-image').src = URL.createObjectURL(files[0]);
  document.getElementById('source-image').style.display = 'block';
}

function handleMultiFiles(files) {
  if (!files || !files.length) return;
  selectedFiles = Array.from(files).slice(0, 6);
  renderImgGrid('img-grid-multi');
}

function renderImgGrid(gridId) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = '';
  selectedFiles.forEach((file, idx) => {
    const el = document.createElement('div');
    el.className = 'img-thumb';
    el.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="view"><div class="remove-btn" onclick="removeFile(${idx}, '${gridId}')">✕</div>`;
    grid.appendChild(el);
  });
}

function removeFile(idx, gridId) {
  selectedFiles.splice(idx, 1);
  renderImgGrid(gridId);
  if (selectedFiles.length === 0 && gridId === 'img-grid-single') {
    document.getElementById('source-image').style.display = 'none';
    document.getElementById('source-no-img').style.display = 'block';
  }
}

function fillPrompt(el) {
  document.getElementById('text-prompt').value = el.textContent.substring(3);
}

function updateModelInfo() {
  const v = document.getElementById('model-version').value;
  const box = document.getElementById('model-info');
  if (v.includes('v2.5')) box.textContent = 'v2.5: Highest quality geometry and textures. Balanced speed.';
  if (v.includes('v2.0')) box.textContent = 'v2.0: Standard model reconstruction, optimized credit usage.';
  if (v.includes('v1.4')) box.textContent = 'v1.4: Fast draft pipeline, creates shape quickly.';
}

// --- Generation Flow ---
async function uploadFiles(files) {
  if (files.length === 1) {
    const formData = new FormData();
    formData.append('file', files[0]);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok || data.code !== 0) throw new Error(data.details || data.message || 'Upload failed');
    return data.data?.image_token || data.data?.file_token;
  } else {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const res = await fetch('/api/upload-multi', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok || data.code !== 0) throw new Error(data.details || data.message || 'Multi-upload failed');
    return data.data?.image_tokens || data.data?.file_tokens;
  }
}

async function startGeneration() {
  if (pollInterval) clearInterval(pollInterval);
  const genBtn = document.getElementById('gen-btn');
  genBtn.classList.add('processing');
  genBtn.disabled = true;
  document.getElementById('progress-area').style.display = 'block';
  for(let i=0; i<7; i++) setPipeStep(i, 'pending');
  
  try {
    setPipeStep(0, 'done');
    let payload = {
      model_version: document.getElementById('model-version').value,
      texture: document.getElementById('opt-texture').classList.contains('on'),
      pbr: document.getElementById('opt-pbr').classList.contains('on')
    };

    if (genMode === 'image') {
      if (!selectedFiles.length) throw new Error('Select an image');
      setPipeStep(1, 'running');
      payload.type = 'image_to_model';
      payload.enable_image_autofix = document.getElementById('opt-autofix').classList.contains('on');
      const token = await uploadFiles(selectedFiles);
      payload.file = { type: 'jpg', file_token: token };
      setPipeStep(1, 'done');
    } else if (genMode === 'multiview') {
      if (selectedFiles.length < 2) throw new Error('Select at least 2 images');
      setPipeStep(1, 'running');
      payload.type = 'multiview_to_model';
      const tokens = await uploadFiles(selectedFiles);
      payload.files = tokens.map(t => ({ type: 'jpg', file_token: t }));
      payload.mode = "left_right_front_back_top_bottom".substring(0, tokens.length * 5); // simplified mode
      setPipeStep(1, 'done');
    } else if (genMode === 'text') {
      const p = document.getElementById('text-prompt').value.trim();
      if (!p) throw new Error('Enter a prompt');
      payload.type = 'text_to_model';
      payload.prompt = p;
      setPipeStep(1, 'done');
    }

    setPipeStep(2, 'running');
    addLog('Creating task...', 'info');
    const taskRes = await fetch('/api/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const taskData = await taskRes.json();
    if (!taskRes.ok || taskData.code !== 0) {
      const errMsg = taskData.details?.message || taskData.message || taskData.error || 'Task creation failed';
      throw new Error(`API Error: ${errMsg}`);
    }
    currentTask = { id: taskData.data.task_id, type: payload.type, url: null, status: 'queued' };
    taskHistory.unshift(currentTask);
    
    setPipeStep(2, 'done');
    pollTask(currentTask.id);
  } catch (err) {
    addLog(err.message, 'err');
    genBtn.classList.remove('processing');
    genBtn.disabled = false;
  }
}

function pollTask(taskId) {
  setPipeStep(3, 'running');
  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/task/${taskId}`);
      const data = await res.json();
      const t = data.data;
      
      const prog = t.progress || 0;
      document.getElementById('progress-pct').textContent = prog + '%';
      document.getElementById('prog-fill').style.width = prog + '%';
      
      if (t.status === 'running') {
        if (prog > 80) { setPipeStep(3, 'done'); setPipeStep(4, 'running'); }
      } else if (t.status === 'success') {
        clearInterval(pollInterval);
        setPipeStep(4, 'done');
        
        // Log full output to see what Tripo returns
        console.log('Task output:', JSON.stringify(t.output));
        addLog('Task completed!', 'ok');
        
        // Try to find the model URL from various possible fields
        const modelUrl = t.output?.model || t.output?.pbr_model || t.output?.base_model;
        
        if (modelUrl) {
          currentTask.url = modelUrl;
          currentTask.status = 'success';
          updateHistoryUI();
          loadModel(modelUrl);
        } else {
          addLog('Task succeeded but no model URL found. Output: ' + JSON.stringify(t.output), 'warn');
          currentTask.status = 'success';
          updateHistoryUI();
          document.getElementById('gen-btn').classList.remove('processing');
          document.getElementById('gen-btn').disabled = false;
        }
        
        // Only try to load rendered image if URL exists and is valid
        if (t.output?.rendered_image && t.output.rendered_image.startsWith('http')) {
          document.getElementById('preview-no-img').style.display = 'none';
          document.getElementById('preview-image').src = `/api/proxy-file?url=${encodeURIComponent(t.output.rendered_image)}`;
          document.getElementById('preview-image').style.display = 'block';
        }
      } else if (t.status === 'failed') {
        throw new Error('Task failed');
      }
    } catch(err) {
      clearInterval(pollInterval);
      addLog(err.message, 'err');
      currentTask.status = 'failed';
      updateHistoryUI();
      document.getElementById('gen-btn').classList.remove('processing');
      document.getElementById('gen-btn').disabled = false;
    }
  }, 2500);
}

// --- Loading Model to Viewport ---
function loadModel(url) {
  setPipeStep(5, 'done');
  setPipeStep(6, 'running');
  const loader = new THREE.GLTFLoader();
  const proxyUrl = `/api/proxy-file?url=${encodeURIComponent(url)}`;
  
  loader.load(proxyUrl, (gltf) => {
    if (currentModelGroup) scene.remove(currentModelGroup);
    currentModelGroup = gltf.scene;
    
    const box = new THREE.Box3().setFromObject(currentModelGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    currentModelGroup.position.set(-center.x, -box.min.y, -center.z);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 1.3 / maxDim;
      currentModelGroup.scale.set(scale, scale, scale);
    }
    
    scene.add(currentModelGroup);
    
    currentGLBMaterials = [];
    let verts = 0, tris = 0;
    
    currentModelGroup.traverse((n) => {
      if (n.isMesh) {
        n.castShadow = true; n.receiveShadow = true;
        if (n.material) {
          currentGLBMaterials.push({
            mesh: n, original: n.material,
            wireframe: new THREE.MeshBasicMaterial({color: 0x00d4ff, wireframe: true}),
            clay: new THREE.MeshStandardMaterial({color: 0xbbbbaa, roughness: 0.9}),
            normal: new THREE.MeshNormalMaterial()
          });
        }
        if (n.geometry) {
          verts += n.geometry.attributes.position?.count || 0;
          tris += n.geometry.index ? n.geometry.index.count/3 : (n.geometry.attributes.position?.count||0)/3;
        }
      }
    });
    
    document.getElementById('stat-vertices').textContent = verts.toLocaleString();
    document.getElementById('stat-triangles').textContent = Math.round(tris).toLocaleString();
    document.getElementById('stat-materials').textContent = currentGLBMaterials.length;
    document.getElementById('stat-task-status').textContent = 'SUCCESS';
    document.getElementById('stat-verts').querySelector('span').textContent = verts.toLocaleString();
    document.getElementById('stat-tris').querySelector('span').textContent = Math.round(tris).toLocaleString();
    document.getElementById('hud-model-name').textContent = 'MODEL_GEN.GLB';
    document.getElementById('hud-poly').textContent = Math.round(tris).toLocaleString() + ' TRIS';
    document.getElementById('no-model-msg').style.display = 'none';
    
    setPipeStep(6, 'done');
    addLog('Rendered successfully.', 'ok');
    
    // Enable exports
    document.getElementById('dl-glb-btn').disabled = false;
    document.querySelectorAll('.format-conv-btn').forEach(b => b.disabled = false);
    document.getElementById('gen-btn').classList.remove('processing');
    document.getElementById('gen-btn').disabled = false;
    
    // Enable Enhance info
    document.getElementById('enhance-info').style.display = 'none';
    document.getElementById('animate-info').style.display = 'none';
    
  });
}

function setRenderMode(mode) {
  if (!currentModelGroup) return;
  renderMode = mode;
  document.querySelectorAll('.vp-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`rb-${mode}`).classList.add('active');
  document.getElementById('hud-render-mode').textContent = mode.toUpperCase();

  currentGLBMaterials.forEach(item => {
    if (mode === 'wireframe') item.mesh.material = item.wireframe;
    else if (mode === 'clay') item.mesh.material = item.clay;
    else if (mode === 'normal') item.mesh.material = item.normal;
    else item.mesh.material = item.original;
  });
}

function resetCamera() {
  controls.reset();
  camera.position.set(2.5, 1.5, 2.5);
  controls.target.set(0, 0.2, 0);
}

// --- History ---
function updateHistoryUI() {
  const list = document.getElementById('history-list');
  if (taskHistory.length === 0) return;
  list.innerHTML = '';
  taskHistory.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = `history-item ${t.id === currentTask?.id ? 'selected' : ''}`;
    el.onclick = () => selectHistory(i);
    el.innerHTML = `
      <div class="history-dot ${t.status}"></div>
      <div class="history-info">
        <div class="history-type">${t.type.replace(/_/g, ' ')}</div>
        <div class="history-id">${t.id}</div>
      </div>
    `;
    list.appendChild(el);
  });
}

function selectHistory(idx) {
  currentTask = taskHistory[idx];
  updateHistoryUI();
  if (currentTask.url) {
    loadModel(currentTask.url);
  }
}

// --- Enhance & Animate ---
async function startEnhance(type) {
  if (!currentTask || !currentTask.id) return alert('Select a model task first');
  addLog(`Requesting ${type}...`, 'info');
  
  let payload = { original_model_task_id: currentTask.id };
  
  if (type === 'refine') payload.type = 'refine_model';
  if (type === 'lowpoly') payload.type = 'highpoly_to_lowpoly';
  if (type === 'texture') {
    payload.type = 'texture_model';
    payload.prompt = document.getElementById('retexture-prompt').value;
  }
  if (type.startsWith('stylize')) {
    payload.type = 'stylize_model';
    payload.style = type.split('_')[1];
  }

  try {
    const res = await fetch('/api/task', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const data = await res.json();
    currentTask = { id: data.data.task_id, type: payload.type, url: null, status: 'queued' };
    taskHistory.unshift(currentTask);
    updateHistoryUI();
    setMainTab('generate');
    document.getElementById('progress-area').style.display = 'block';
    for(let i=0; i<7; i++) setPipeStep(i, 'pending');
    pollTask(currentTask.id);
  } catch(e) {
    addLog(e.message, 'err');
  }
}

async function startAnimate(type) {
  if (!currentTask || !currentTask.id) return alert('Select a model task first');
  let payload = { original_model_task_id: currentTask.id, type: type === 'rig' ? 'animate_rig' : 'animate_retarget' };
  
  if (type === 'retarget') {
    const url = document.getElementById('anim-url').value;
    if (!url) return alert('Provide animation URL for retargeting');
    payload.animation = url;
  }
  
  try {
    const res = await fetch('/api/task', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const data = await res.json();
    currentTask = { id: data.data.task_id, type: payload.type, url: null, status: 'queued' };
    taskHistory.unshift(currentTask);
    updateHistoryUI();
    setMainTab('generate');
    pollTask(currentTask.id);
  } catch(e) {
    addLog(e.message, 'err');
  }
}

// --- Export ---
function downloadOriginalGLB() {
  if (!currentTask?.url) return;
  const a = document.createElement('a');
  a.href = `/api/proxy-file?url=${encodeURIComponent(currentTask.url)}`;
  a.download = `model_${currentTask.id}.glb`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function requestConversion(format) {
  if (!currentTask?.id) return;
  const btn = document.getElementById(`conv-${format.toLowerCase()}`);
  btn.disabled = true;
  
  try {
    const res = await fetch('/api/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'convert_model', original_model_task_id: currentTask.id, format })
    });
    const data = await res.json();
    const cid = data.data.task_id;
    
    const int = setInterval(async () => {
      const p = await fetch(`/api/task/${cid}`);
      const d = await p.json();
      if (d.data.status === 'success') {
        clearInterval(int);
        btn.disabled = false;
        const a = document.createElement('a');
        a.href = `/api/proxy-file?url=${encodeURIComponent(d.data.output.model)}`;
        a.download = `converted_${cid}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (d.data.status === 'failed') {
        clearInterval(int);
        btn.disabled = false;
        addLog(`Conversion to ${format} failed`, 'err');
      }
    }, 3000);
  } catch(e) {
    btn.disabled = false;
    addLog(e.message, 'err');
  }
}

// --- Lighting ---
function changeLighting(val) {
  if (val === 'night') {
    ambientLight.color.set(0x1a0a2a);
    dirLight.color.set(0x7b2fff);
    rimLight.color.set(0xff0088);
  } else if (val === 'outdoor') {
    ambientLight.color.set(0x88aacc);
    dirLight.color.set(0xfff4e0);
    rimLight.color.set(0x88ccff);
  } else if (val === 'neutral') {
    ambientLight.color.set(0x888888);
    dirLight.color.set(0xffffff);
    rimLight.color.set(0xcccccc);
  } else {
    ambientLight.color.set(0xffffff);
    dirLight.color.set(0xffffff);
    rimLight.color.set(0x7b2fff);
  }
}
