/* EARTH // NOW — real interactive 3D planet viewer (Three.js WebGL).
   The selected planet is a live 3D object: camera-fit math keeps its center
   exactly at the screen center on every viewport, drag rotates, wheel/pinch
   zooms, and the camera re-fits on resize. Falls back gracefully: if this
   module fails to load, window.Planet3D is undefined and the CSS journey
   path in app.js still works. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const R = 1;                 // planet radius in scene units
const FIT_MARGIN = 1.22;     // >1 keeps the disc off every screen edge (no crop)
const MIN_DIST = R * 1.05;   // zoom-in limit (just off the surface)
const MAX_ZOOM_RATIO = 6;    // zoom-out limit, relative to fit distance

/* Visual spin: seconds per revolution, mirroring app.js visualRotation. */
const SPIN = { sun: 7, mercury: 12, venus: 14, earth: 8, moon: 13, mars: 9, jupiter: 5, saturn: 6, uranus: 10, neptune: 8, pluto: 11, ceres: 10, haumea: 5, makemake: 10, eris: 10 };
const RETROGRADE = new Set(['venus', 'uranus']);
const RINGS = new Set(['saturn']);

let renderer, scene, camera, controls, stage, journey, planetPanel;
let worldGroup = null;        // current planet + optional ring
let currentKey = null;
let active = false;
let running = false;
let lastFit = 0;
let camTween = null;
let lastTime = 0;
const texCache = new Map();

/* ---------- procedural textures (no external image dependencies) ---------- */

function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function speckle(ctx, w, h, n, palette, rMin, rMax, aMin, aMax, ySquash = 1) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const r = rMin + Math.random() * (rMax - rMin);
    ctx.globalAlpha = aMin + Math.random() * (aMax - aMin);
    ctx.fillStyle = palette[(Math.random() * palette.length) | 0];
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * ySquash, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function polarCaps(ctx, w, h, size, color) {
  let g = ctx.createLinearGradient(0, 0, 0, h * size);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * size);
  g = ctx.createLinearGradient(0, h, 0, h * (1 - size));
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, h * (1 - size), w, h * size);
}
function craters(ctx, w, h, n) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 3 + Math.random() * 22;
    ctx.globalAlpha = .28; ctx.fillStyle = '#3f3d3a';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = .22; ctx.fillStyle = '#d9d6cf';
    ctx.beginPath(); ctx.arc(x - r * .22, y - r * .22, r * .62, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function gasBands(ctx, w, h, colors, turbulence, spots) {
  let y = 0, i = 0;
  while (y < h) {
    const bandH = h * (0.03 + Math.random() * 0.075);
    ctx.fillStyle = colors[i++ % colors.length];
    ctx.fillRect(0, y, w, bandH + 2);
    y += bandH;
  }
  // wavy turbulence streaks
  for (let s = 0; s < 260; s++) {
    const sy = Math.random() * h, amp = turbulence * (0.4 + Math.random());
    const col = colors[(Math.random() * colors.length) | 0];
    ctx.globalAlpha = .10 + Math.random() * .16;
    ctx.strokeStyle = col; ctx.lineWidth = 1.5 + Math.random() * 5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 16) {
      const yy = sy + Math.sin((x / w) * Math.PI * 2 * (1 + Math.random() * 2) + sy) * amp;
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  (spots || []).forEach(([sx, sy, rx, ry, col]) => {
    const g = ctx.createRadialGradient(w * sx, h * sy, 2, w * sx, h * sy, w * rx);
    g.addColorStop(0, col); g.addColorStop(.75, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = .85; ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(w * sx, h * sy, w * rx, h * ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });
}

const painters = {
  sun(ctx, w, h) {
    const g = ctx.createRadialGradient(w * .42, h * .46, 10, w * .5, h * .5, w * .62);
    g.addColorStop(0, '#fff8cb'); g.addColorStop(.3, '#ffc249'); g.addColorStop(.62, '#e25d18'); g.addColorStop(1, '#651c0c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 900, ['#fff3b0', '#ffb03a', '#d14e12'], 2, 14, .08, .3);
  },
  mercury(ctx, w, h) {
    ctx.fillStyle = '#8f887f'; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 700, ['#a39b91', '#6b655e', '#7c766e'], 3, 26, .15, .4);
    craters(ctx, w, h, 260);
  },
  moon(ctx, w, h) {
    ctx.fillStyle = '#a3a49f'; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 600, ['#c4c5c0', '#7d7f7a', '#8f918c'], 3, 30, .12, .35);
    craters(ctx, w, h, 320);
  },
  venus(ctx, w, h) {
    ctx.fillStyle = '#e6c98c'; ctx.fillRect(0, 0, w, h);
    gasBands(ctx, w, h, ['#f2ddb0', '#dcae66', '#eecf95', '#c98f4e'], 26,
      [[.3, .3, .2, .05, 'rgba(255,244,214,.5)'], [.7, .68, .22, .05, 'rgba(255,240,205,.4)']]);
  },
  earth(ctx, w, h) {
    ctx.fillStyle = '#1c4d7e'; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 380, ['#1a558c', '#153d68', '#2a6ba3'], 8, 42, .2, .5); // ocean depth
    // continents: clustered blobs
    for (let c = 0; c < 9; c++) {
      const cx = Math.random() * w, cy = h * (.18 + Math.random() * .64);
      for (let b = 0; b < 46; b++) {
        const x = cx + (Math.random() - .5) * w * .24, y = cy + (Math.random() - .5) * h * .3;
        const r = 6 + Math.random() * 34;
        ctx.globalAlpha = .5 + Math.random() * .5;
        ctx.fillStyle = Math.random() < .68 ? '#3e7a3c' : (Math.random() < .5 ? '#8a7a4d' : '#b0a06a');
        ctx.beginPath(); ctx.ellipse((x + w) % w, y, r, r * .8, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    speckle(ctx, w, h, 240, ['#ffffff', '#dfe9ee'], 3, 14, .25, .6, .45); // clouds
    polarCaps(ctx, w, h, .085, 'rgba(240,248,255,.95)');
  },
  mars(ctx, w, h) {
    ctx.fillStyle = '#b5533c'; ctx.fillRect(0, 0, w, h);
    gasBands(ctx, w, h, ['#c26044', '#a34a33', '#bd6a4c', '#96422e'], 14);
    speckle(ctx, w, h, 300, ['#7e3524', '#d08668'], 4, 30, .12, .35);
    polarCaps(ctx, w, h, .055, 'rgba(245,240,235,.9)');
  },
  jupiter(ctx, w, h) {
    gasBands(ctx, w, h, ['#e8d3ae', '#b98a5e', '#d9b98c', '#8f5a3c', '#e5c9a2', '#c49a6c'], 34,
      [[.68, .62, .055, .035, '#c2543a'], [.68, .62, .032, .02, '#e08a6a']]);
  },
  saturn(ctx, w, h) {
    gasBands(ctx, w, h, ['#f1dfae', '#d9bd82', '#c8a86c', '#e8d5a0', '#b99a5f'], 20);
  },
  uranus(ctx, w, h) {
    ctx.fillStyle = '#9fd8dd'; ctx.fillRect(0, 0, w, h);
    gasBands(ctx, w, h, ['#aadee2', '#93ced4', '#b5e6ea'], 8);
  },
  neptune(ctx, w, h) {
    ctx.fillStyle = '#3457c9'; ctx.fillRect(0, 0, w, h);
    gasBands(ctx, w, h, ['#3d63d6', '#2c4ab5', '#4a74e0', '#26409f'], 18,
      [[.4, .42, .05, .028, '#1c2f77'], [.62, .3, .08, .018, 'rgba(210,225,255,.55)']]);
  },
  pluto(ctx, w, h) {
    ctx.fillStyle = '#c8b29a'; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 420, ['#a98f74', '#e0d3bd', '#8f7a62', '#d8c8b0'], 5, 34, .2, .5);
    const g = ctx.createRadialGradient(w * .62, h * .42, 4, w * .62, h * .42, w * .14);
    g.addColorStop(0, 'rgba(240,232,215,.9)'); g.addColorStop(1, 'rgba(240,232,215,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(w * .62, h * .42, w * .14, h * .11, 0, 0, Math.PI * 2); ctx.fill();
  },
  ceres(ctx, w, h) {
    ctx.fillStyle = '#8d8378'; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 500, ['#9c9287', '#6f665c', '#a89e92'], 3, 22, .15, .45);
  },
  rocky(ctx, w, h) { /* haumea / makemake / eris and unknowns */
    ctx.fillStyle = '#a4907c'; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 460, ['#8a7561', '#c0ad97', '#776351'], 4, 26, .18, .45);
  }
};

function getTexture(key) {
  if (texCache.has(key)) return texCache.get(key);
  const [c, ctx] = canvas2d(2048, 1024);
  (painters[key] || painters.rocky)(ctx, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 4;
  texCache.set(key, tex);
  return tex;
}

function makeRingTexture() {
  const [c, ctx] = canvas2d(512, 512);
  const g = ctx.createRadialGradient(256, 256, 256 * (1.35 / 2.45), 256, 256, 256);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(.14, 'rgba(214,196,158,.85)');
  g.addColorStop(.3, 'rgba(190,170,130,.55)');
  g.addColorStop(.42, 'rgba(120,104,78,.15)');
  g.addColorStop(.52, 'rgba(228,212,175,.8)');
  g.addColorStop(.7, 'rgba(180,160,120,.5)');
  g.addColorStop(.88, 'rgba(150,132,100,.28)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- scene ---------- */

function ensureScene() {
  if (renderer) return true;
  try {
    journey = document.getElementById('journey');
    planetPanel = document.getElementById('planetPanel');
    if (!journey) return false;
    stage = document.createElement('div');
    stage.className = 'journey-stage';
    journey.prepend(stage);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.05, 400);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.8;
    controls.minDistance = MIN_DIST;
    controls.enabled = false; // until focus tween completes

    // lighting: key light + cool fill, scaled with the planet
    const key = new THREE.DirectionalLight(0xfff4e0, 2.6);
    key.position.set(4, 2.2, 5);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.55));
    const rim = new THREE.DirectionalLight(0x6fb7ff, 0.7);
    rim.position.set(-5, -1.5, -4);
    scene.add(rim);

    // starfield
    const starGeo = new THREE.BufferGeometry();
    const N = 1600, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(70 + Math.random() * 90);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcfe0ff, size: .35, sizeAttenuation: true, transparent: true, opacity: .9 })));

    camera.position.set(0, R * .35, 6);
    camera.lookAt(0, 0, 0);

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // leaving planet view: the info panel closing releases the camera
    new MutationObserver(() => {
      const open = planetPanel?.classList.contains('open');
      if (!open && active) release();
    }).observe(planetPanel, { attributes: true, attributeFilter: ['class'] });

    onResize();
    return true;
  } catch (err) {
    console.warn('Planet3D unavailable, using CSS fallback.', err);
    return false;
  }
}

function fitDistance() {
  // Distance at which a radius-R sphere fills the smaller screen axis,
  // with margin so it never touches or crosses any edge.
  const fovV = THREE.MathUtils.degToRad(camera.fov);
  const fovH = 2 * Math.atan(Math.tan(fovV / 2) * camera.aspect);
  const fitFov = Math.min(fovV, fovH);
  return (R / Math.tan(fitFov / 2)) * FIT_MARGIN;
}

function onResize() {
  if (!renderer) return;
  const w = stage.clientWidth || window.innerWidth;
  const h = stage.clientHeight || window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (active && worldGroup) {
    // re-fit: keep the user's zoom ratio, re-derive absolute distance
    const fit = fitDistance();
    const ratio = Math.min(MAX_ZOOM_RATIO, Math.max(MIN_DIST / fit, camera.position.length() / (lastFit || fit)));
    lastFit = fit;
    const d = fit * ratio;
    camera.position.setLength(d);
    controls.minDistance = MIN_DIST;
    controls.maxDistance = fit * MAX_ZOOM_RATIO;
  }
}

function buildWorld(key) {
  if (worldGroup) {
    scene.remove(worldGroup);
    worldGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }
  worldGroup = new THREE.Group();
  const geo = new THREE.SphereGeometry(R, 96, 96);
  let mat;
  if (key === 'sun') {
    mat = new THREE.MeshBasicMaterial({ map: getTexture('sun') });
  } else {
    mat = new THREE.MeshStandardMaterial({ map: getTexture(key), roughness: 1, metalness: 0 });
  }
  worldGroup.add(new THREE.Mesh(geo, mat));
  if (RINGS.has(key)) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(R * 1.35, R * 2.45, 160),
      new THREE.MeshBasicMaterial({ map: makeRingTexture(), side: THREE.DoubleSide, transparent: true })
    );
    ring.rotation.x = -Math.PI / 2 + 0.42;
    worldGroup.add(ring);
  }
  if (RETROGRADE.has(key)) worldGroup.rotation.y = Math.PI; // retrograde worlds start flipped; spin is negative
  scene.add(worldGroup);
}

/* ---------- animation ---------- */

const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function tweenCamera(toPos, duration, onDone) {
  camTween = { from: camera.position.clone(), to: toPos.clone(), start: performance.now(), duration: Math.max(1, duration), onDone };
}

function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);
  const dt = Math.min(64, now - lastTime || 16);
  lastTime = now;

  if (camTween) {
    const t = Math.min(1, (now - camTween.start) / camTween.duration);
    camera.position.lerpVectors(camTween.from, camTween.to, easeInOut(t));
    if (t === 1) { const done = camTween.onDone; camTween = null; done?.(); }
  } else if (active) {
    controls.update(); // user drag / zoom with damping
  }

  if (worldGroup && active) {
    const speed = SPIN[currentKey] || 9;                       // seconds per revolution
    const dir = RETROGRADE.has(currentKey) ? -1 : 1;
    worldGroup.rotation.y += dir * (Math.PI * 2 / (speed * 1000)) * dt;
  }

  renderer.render(scene, camera);
}

function startLoop() {
  if (running) return;
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

/* ---------- public API ---------- */

function focus(name) {
  if (!ensureScene()) return false;
  const key = name.toLowerCase().replace(/\s+/g, '');
  const reduced = window.EarthNowCore?.state?.reducedMotion;

  // swap world if the selection changed; keep spin continuity otherwise
  if (key !== currentKey || !worldGroup) {
    buildWorld(key);
    currentKey = key;
  }

  active = true;
  journey.classList.add('active', 'webgl');
  controls.enabled = false;

  onResize();
  const fit = fitDistance();
  lastFit = fit;
  const target = new THREE.Vector3(0, 0, fit);
  controls.target.set(0, 0, 0);
  camera.lookAt(0, 0, 0);

  const startDist = camera.position.length();
  const cinematic = !camTween && startDist < fit * 1.05; // first open or after full release
  const from = cinematic ? new THREE.Vector3(0, R * .4, fit * 2.6) : camera.position.clone();
  camera.position.copy(from);
  tweenCamera(target, reduced ? 1 : 1400, () => {
    controls.minDistance = MIN_DIST;
    controls.maxDistance = fit * MAX_ZOOM_RATIO;
    controls.enabled = true;
    controls.update();
  });
  startLoop();
  return true;
}

function release() {
  if (!active) return;
  active = false;
  controls.enabled = false;
  const reduced = window.EarthNowCore?.state?.reducedMotion;
  const away = camera.position.clone().setLength(lastFit * 2.6);
  tweenCamera(away, reduced ? 1 : 900, () => {
    journey.classList.remove('active');
    setTimeout(() => {
      journey.classList.remove('webgl');
      running = false; // stop the render loop once the fade completes
    }, 480);
  });
}

window.Planet3D = { focus, release, get active() { return active; } };
