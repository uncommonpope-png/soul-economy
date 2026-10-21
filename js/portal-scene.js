/* ============================================================
   PORTAL SCENE — a doorway of light, in the Soulfeild register.
   ------------------------------------------------------------
   Ambience only. This module follows the mobile-repair law:
   the canvas NEVER receives an event and NEVER traps a scroll.
   It is position:fixed, pointer-events:none, behind the page.
   If WebGL or the CDN fails, the page loses nothing — a CSS
   gradient doorway (body::before) carries the mood instead.
   Cheap by design: two point clouds, basic materials, no
   lights, capped pixel ratio, paused when the tab hides.
   ============================================================ */
import * as THREE from 'three';

(function () {
  'use strict';
  var canvas = document.getElementById('portalScene');
  if (!canvas) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power'
    });
  } catch (e) {
    document.documentElement.classList.add('no-webgl');
    canvas.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 1.9, 8.4);
  camera.lookAt(0, 1.7, 0);

  function glowTexture(inner, mid) {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
    grad.addColorStop(0, inner);
    grad.addColorStop(0.45, mid);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    var tex = new THREE.CanvasTexture(c);
    return tex;
  }

  var door = new THREE.Group();

  /* — the door's inner light — */
  var doorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 5.6),
    new THREE.MeshBasicMaterial({
      map: glowTexture('rgba(255,214,130,0.95)', 'rgba(255,123,172,0.42)'),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  doorGlow.position.set(0, 1.55, -0.35);
  door.add(doorGlow);

  /* — arch + pillars, gold line-work — */
  var gold = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.92 });
  var arch = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.085, 12, 72, Math.PI), gold);
  arch.position.set(0, 2.25, 0);
  door.add(arch);
  var pillarGeo = new THREE.BoxGeometry(0.17, 3.5, 0.17);
  var leftPillar = new THREE.Mesh(pillarGeo, gold);
  leftPillar.position.set(-2.3, 0.5, 0);
  door.add(leftPillar);
  var rightPillar = new THREE.Mesh(pillarGeo, gold);
  rightPillar.position.set(2.3, 0.5, 0);
  door.add(rightPillar);
  /* threshold — the step she crosses */
  var threshold = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.12, 0.5), gold);
  threshold.position.set(0, -1.28, 0);
  door.add(threshold);

  /* — light pooling on the floor — */
  var floorGlow = new THREE.Mesh(
    new THREE.CircleGeometry(3.9, 40),
    new THREE.MeshBasicMaterial({
      map: glowTexture('rgba(255,209,102,0.55)', 'rgba(139,92,246,0.20)'),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.set(0, -1.32, 0.6);
  door.add(floorGlow);

  scene.add(door);

  /* — dust motes in the light — */
  function makeMotes(count, color, size, spread) {
    var pos = new Float32Array(count * 3);
    var speeds = new Float32Array(count);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread.x;
      pos[i * 3 + 1] = -1.3 + Math.random() * 6.4;
      pos[i * 3 + 2] = -1.5 + Math.random() * spread.z;
      speeds[i] = 0.05 + Math.random() * 0.14;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      color: color,
      size: size,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var points = new THREE.Points(geo, mat);
    points.userData = { speeds: speeds, count: count };
    return points;
  }
  var motesGold = makeMotes(620, 0xffd9a0, 0.05, { x: 9.5, z: 4 });
  var motesPink = makeMotes(200, 0xff7bac, 0.038, { x: 7, z: 3 });
  scene.add(motesGold);
  scene.add(motesPink);

  function drift(points, dt, t) {
    var arr = points.geometry.attributes.position.array;
    var speeds = points.userData.speeds;
    for (var i = 0; i < points.userData.count; i++) {
      arr[i * 3 + 1] += speeds[i] * dt;
      arr[i * 3] += Math.sin(t * 0.6 + i) * 0.0009;
      if (arr[i * 3 + 1] > 5.3) arr[i * 3 + 1] = -1.3;
    }
    points.geometry.attributes.position.needsUpdate = true;
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clock = new THREE.Clock();
  var raf = null;

  function frame() {
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;
    door.rotation.y = Math.sin(t * 0.11) * 0.06;
    door.position.y = Math.sin(t * 0.5) * 0.05;
    doorGlow.material.opacity = 0.84 + Math.sin(t * 0.8) * 0.16;
    drift(motesGold, dt, t);
    drift(motesPink, dt, t * 1.3);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf !== null || reduceMotion) return;
    clock.getDelta();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
  }

  if (reduceMotion) {
    renderer.render(scene, camera); /* one still doorway, no motion */
  } else {
    start();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
  }

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
