import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';

// === BEGIN scene (1).js ===
// scene.js


export // Removed duplicate initScene

// === END scene (1).js ===

// === BEGIN animation (2).js ===



let activeBall = null;
let trailDots = [];
let animationFrame;
let startTime;
let animating = false;

function clearTrail(scene) {
  trailDots.forEach(dot => scene.remove(dot));
  trailDots = [];
}

function createBall(scene) {
  const geometry = new THREE.SphereGeometry(0.15, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const ball = new THREE.Mesh(geometry, material);
  scene.add(ball);
  return ball;
}

// Removed duplicate setTrailVisibility

// Removed duplicate pauseAnimation

// Removed duplicate clearAllBalls

// Removed duplicate replayAnimation

// Removed duplicate loadAndAnimatePitch

export {
  loadAndAnimatePitch,
  replayAnimation,
  pauseAnimation,
  setTrailVisibility,
  clearAllBalls
};

// === END animation (2).js ===

// === BEGIN ui (1).js ===
import {
  loadAndAnimatePitch,
  setTrailVisibility,
  pauseAnimation,
  replayAnimation
} from './animation.js';

export // Removed duplicate setupUI

// === END ui (1).js ===

// === BEGIN main (47).js ===
import { initScene } from './scene.js';
import { setupUI } from './ui.js';
import {
  loadAndAnimatePitch,
  replayAnimation,
  pauseAnimation,
  setTrailVisibility,
  clearAllBalls
} from './animation.js';

let sceneObjects;

window.addEventListener('DOMContentLoaded', () => {
  sceneObjects = initScene();

  setupUI({
    onPitchSelect: (pitchData) => loadAndAnimatePitch(pitchData, sceneObjects),
    onReplay: (pitchData) => replayAnimation(pitchData, sceneObjects),
    onPause: () => pauseAnimation(),
    onToggleTrail: (visible) => setTrailVisibility(visible),
    onClear: () => clearAllBalls(sceneObjects.scene),
    sceneObjects
  });
});

// === END main (47).js ===

// === SAFE ANIMATION FUNCTIONS ===

// PRIMARY FUNCTION
function loadAndAnimatePitch(pitchData, sceneObjects) {
  const {
    release_pos_x, release_pos_y, release_pos_z,
    vx0, vy0, vz0, ax, ay, az,
    release_spin_rate, spin_axis, time_to_plate
  } = pitchData;

  const scene = sceneObjects.scene;
  activeBall = createBall(scene);
  activeBall.position.set(release_pos_x, release_pos_z, release_pos_y);

  const spinRadiansPerFrame = (release_spin_rate / 60) * (2 * Math.PI / 60);
  const axis = new THREE.Vector3(Math.cos((spin_axis - 90) * Math.PI / 180), 0, Math.sin((spin_axis - 90) * Math.PI / 180));

  startTime = performance.now() / 1000;
  animating = true;

  function animate() {
    if (!animating) return;

    const t = (performance.now() / 1000) - startTime;

    if (t >= time_to_plate) {
      animating = false;
      return;
    }

    const x = release_pos_x + vx0 * t + 0.5 * ax * t * t;
    const y = release_pos_y + vy0 * t + 0.5 * ay * t * t;
    const z = release_pos_z + vz0 * t + 0.5 * az * t * t;

    activeBall.position.set(x, z, y);
    activeBall.rotateOnWorldAxis(axis, spinRadiansPerFrame);

    const trailDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    trailDot.position.copy(activeBall.position);
    scene.add(trailDot);
    trailDots.push(trailDot);

    animationFrame = requestAnimationFrame(animate);
  }

  animate();
}


function replayAnimation(pitchData, sceneObjects) {
  clearAllBalls(sceneObjects.scene);
  loadAndAnimatePitch(pitchData, sceneObjects);
}


function pauseAnimation() {
  animating = false;
  cancelAnimationFrame(animationFrame);
}


function setTrailVisibility(visible) {
  trailDots.forEach(dot => dot.visible = visible);
}


function clearAllBalls(scene) {
  if (activeBall) {
    scene.remove(activeBall);
    activeBall = null;
  }
  clearTrail(scene);
  pauseAnimation();
}

// === CLEAN INITSCENE ===

// PRIMARY FUNCTION
function initScene() {
  const canvas = document.getElementById('three-canvas');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  const moundGeometry = new THREE.CylinderGeometry(2.0, 9, 2.0, 64);
  const moundMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const mound = new THREE.Mesh(moundGeometry, moundMaterial);
  mound.position.set(0, 0, 0);
  mound.receiveShadow = true;
  scene.add(mound);

  const rubber = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.05, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  rubber.position.set(0, 1.05, 0);
  rubber.castShadow = true;
  rubber.receiveShadow = true;
  scene.add(rubber);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 2.5, -65);
  camera.lookAt(0, 2.5, 0);
  scene.add(camera);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x8b4513, 0.4);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfff0e5, 1.0);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;

  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;

  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 100;

  const dirTarget = new THREE.Object3D();
  dirTarget.position.set(0, 0, 0);
  scene.add(dirTarget);
  dirLight.target = dirTarget;

  scene.add(dirLight);

  const plateLight = new THREE.PointLight(0xffffff, 0.6, 100);
  plateLight.position.set(0, 3, -60.5);
  scene.add(plateLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x1e472d, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const zone = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.42, 2.0)),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  zone.position.set(0, 2.5, -60.5);
  scene.add(zone);

  const shape = new THREE.Shape();
  shape.moveTo(-0.85, 0);
  shape.lineTo(0.85, 0);
  shape.lineTo(0.85, 0.5);
  shape.lineTo(0, 1.0);
  shape.lineTo(-0.85, 0.5);
  shape.lineTo(-0.85, 0);
  const plate = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
  );
  plate.rotation.x = -Math.PI / 2;
  plate.position.set(0, 0.011, -60.5);
  scene.add(plate);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

// === CLEAN SETUPUI ===

// PRIMARY FUNCTION
function setupUI({
  onPitchSelect,
  onReplay,
  onPause,
  onToggleTrail,
  sceneObjects
}) {
  const teamSelect = document.getElementById('teamSelect');
  const batterSelect = document.getElementById('batterSelect');
  const dateSelect = document.getElementById('dateSelect');
  const pitcherSelect = document.getElementById('pitcherSelect');
  const pitchSelect = document.getElementById('pitchSelect');
  const cameraSelect = document.getElementById('cameraSelect');
  const trailToggle = document.getElementById('trailToggle');
  const replayBtn = document.getElementById('replayBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  let currentPitchData = null;

  fetch('pitch_data.json')
    .then(res => res.json())
    .then(data => {
      const teams = Object.keys(data);
      for (const team of teams) {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
      }

      teamSelect.addEventListener('change', () => {
        batterSelect.innerHTML = '';
        const team = teamSelect.value;
        const batters = Object.keys(data[team] || {});
        for (const batter of batters) {
          const option = document.createElement('option');
          option.value = batter;
          option.textContent = batter;
          batterSelect.appendChild(option);
        }
        batterSelect.dispatchEvent(new Event('change'));
      });

      batterSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        dateSelect.innerHTML = '';
        const dates = Object.keys(data[team]?.[batter] || {});
        for (const date of dates) {
          const option = document.createElement('option');
          option.value = date;
          option.textContent = date;
          dateSelect.appendChild(option);
        }
        dateSelect.dispatchEvent(new Event('change'));
      });

      dateSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        const date = dateSelect.value;
        pitcherSelect.innerHTML = '';
        const pitchers = Object.keys(data[team]?.[batter]?.[date] || {});
        for (const pitcher of pitchers) {
          const option = document.createElement('option');
          option.value = pitcher;
          option.textContent = pitcher;
          pitcherSelect.appendChild(option);
        }
        pitcherSelect.dispatchEvent(new Event('change'));
      });

      pitcherSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        const date = dateSelect.value;
        const pitcher = pitcherSelect.value;
        pitchSelect.innerHTML = '';
        const pitches = Object.keys(data[team]?.[batter]?.[date]?.[pitcher] || {});
        for (const pitch of pitches) {
          const option = document.createElement('option');
          option.value = pitch;
          option.textContent = pitch;
          pitchSelect.appendChild(option);
        }
        pitchSelect.dispatchEvent(new Event('change'));
      });

      pitchSelect.addEventListener('change', () => {
        const team = teamSelect.value;
        const batter = batterSelect.value;
        const date = dateSelect.value;
        const pitcher = pitcherSelect.value;
        const pitch = pitchSelect.value;
        const pitchData = data?.[team]?.[batter]?.[date]?.[pitcher]?.[pitch];
        if (pitchData) {
          currentPitchData = pitchData;
          onPitchSelect(pitchData);
          updateScorebug(team, batter, pitcher, date, pitch);
        }
      });

      teamSelect.selectedIndex = 0;
      teamSelect.dispatchEvent(new Event('change'));
    });

  trailToggle.addEventListener('change', () => {
    onToggleTrail(trailToggle.checked);
  });

  replayBtn.addEventListener('click', () => {
    if (currentPitchData) {
      onReplay(currentPitchData);
    }
  });

  pauseBtn.addEventListener('click', () => {
    onPause();
  });

  cameraSelect.addEventListener('change', () => {
    setCamera(cameraSelect.value);
  });

  function setCamera(view) {
    const { camera } = sceneObjects;

    switch (view) {
      case 'catcher':
        camera.position.set(0, 2.5, -65);
        camera.lookAt(0, 2.5, 0);
        break;
      case 'pitcher':
        camera.position.set(0, 6.0, 5);
        camera.lookAt(0, 2.0, -60.5);
        break;
      case 'rhh':
        camera.position.set(1, 4.0, -65);
        camera.lookAt(0, 1.5, 0);
        break;
      case 'lhh':
        camera.position.set(-1, 4.0, -65);
        camera.lookAt(0, 1.5, 0);
        break;
      case '1b':
        camera.position.set(50, 4.5, -30);
        camera.lookAt(0, 5, -30);
        break;
      case '3b':
        camera.position.set(-50, 4.5, -30);
        camera.lookAt(0, 5, -30);
        break;
      case 'side':
        camera.position.set(-25, 2.5, -15);
        camera.lookAt(0, 2.0, -30);
        break;
      case 'top':
        camera.position.set(0, 80, -30);
        camera.lookAt(0, 0, -30);
        break;
    }
  }

  function updateScorebug(team, batter, pitcher, date, pitch) {
    document.getElementById('scorebugTeam').textContent = team;
    document.getElementById('scorebugOpponent').textContent = 'OPP';
    document.getElementById('scorebugBatter').textContent = batter;
    document.getElementById('scorebugPitcher').textContent = pitcher;
    document.getElementById('scorebugInning').textContent = '1';
    document.getElementById('scorebugCount').textContent = '0-0';
  }
}
