// CORAL PALMS: Neon Tide — boot, game loop, camera, combat, save/load.
import * as THREE from "three";
import { makeRng } from "./random.js";
import { buildWorld, collideCircle } from "./world.js";
import { spawnTraffic } from "./vehicles.js";
import { spawnPeds } from "./peds.js";
import { Player } from "./player.js";
import { PoliceSystem } from "./police.js";
import { MissionRunner } from "./missions.js";
import { Hud } from "./hud.js";
import { GameAudio } from "./audio.js";
import { Input } from "./input.js";
import { saveGame, loadGame, snapshotOf } from "./save.js";
import { stageShot } from "./shots.js";

const params = new URLSearchParams(location.search);
const seed = Number(params.get("seed") || 7);
const rng = makeRng(seed);

const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7a56b);
scene.fog = new THREE.Fog(0xf2a56f, 90, 420);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1200);

const hemi = new THREE.HemisphereLight(0xffd9b0, 0x3a4a6b, 0.95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffb37a, 1.5);
sun.position.set(-140, 90, -60);
scene.add(sun);

// Sunset sky dome: a big sphere with a baked vertex-color gradient so the
// horizon glows orange under a violet zenith (no custom shader needed).
const skyGeo = new THREE.SphereGeometry(900, 24, 16);
{
  const pos = skyGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const low = new THREE.Color(0xffb86b);
  const mid = new THREE.Color(0xf9734f);
  const top = new THREE.Color(0x52409e);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const h = THREE.MathUtils.clamp(pos.getY(i) / 900 * 1.6 + 0.25, 0, 1);
    if (h < 0.45) tmp.copy(low).lerp(mid, h / 0.45);
    else tmp.copy(mid).lerp(top, (h - 0.45) / 0.55);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  skyGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}
const sky = new THREE.Mesh(
  skyGeo,
  new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true, depthWrite: false, fog: false })
);
scene.add(sky);

const { colliders } = buildWorld(scene, rng);
const cars = spawnTraffic(scene, rng);
const peds = spawnPeds(scene, rng);
const player = new Player(scene, rng);
const police = new PoliceSystem(scene, rng);
const missions = new MissionRunner(scene);
const hud = new Hud();
const audio = new GameAudio();
const input = new Input(canvas);

let state = "title"; // title | play | over
let elapsed = 0;
let lastHitAt = 0;

function startPlay() {
  if (state !== "title") return;
  state = "play";
  document.getElementById("title-screen").style.display = "none";
  audio.start();
  const m = missions.current();
  if (m) hud.showMessage(m.brief, 7);
}

function endGame(reason) {
  state = "over";
  const end = document.getElementById("end-screen");
  document.getElementById("end-title").textContent = reason === "busted" ? "BUSTED" : "WASTED";
  document.getElementById("end-text").textContent =
    reason === "busted"
      ? "The Coral Palms PD hauls Reno in. Mama Sol bails him out — for a price."
      : "Reno wakes up at Coral Palms General, lighter by one hospital bill.";
  end.style.display = "flex";
  player.cash = Math.max(0, player.cash - 150);
}

function restart() {
  player.dead = false;
  player.health = 100;
  player.exitCar();
  player.mesh.position.set(0, 0, 24);
  police.clear();
  document.getElementById("end-screen").style.display = "none";
  state = "play";
}

document.getElementById("btn-start").addEventListener("click", startPlay);
document.getElementById("btn-restart").addEventListener("click", restart);

function combat() {
  const now = performance.now();
  if (now - lastHitAt < 260) return;
  lastHitAt = now;
  const p = player.mesh.position;
  if (player.weapon === "pistol" && player.ammo > 0) {
    player.ammo--;
    audio.shot();
    police.addCrime(1);
    // Tracer: a quick fading line toward the camera's aim.
    const dir = new THREE.Vector3(Math.sin(input.camYaw), 0, Math.cos(input.camYaw));
    const from = new THREE.Vector3(p.x, 1.4, p.z);
    const to = from.clone().add(dir.multiplyScalar(30));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([from, to]),
      new THREE.LineBasicMaterial({ color: 0xffe98a })
    );
    scene.add(line);
    setTimeout(() => scene.remove(line), 90);
    for (const ped of peds) {
      if (ped.down) continue;
      const d = Math.hypot(ped.mesh.position.x - p.x, ped.mesh.position.z - p.z);
      if (d < 16) { ped.knockDown(); break; }
    }
    return;
  }
  audio.thud();
  for (const ped of peds) {
    if (ped.down) continue;
    const d = Math.hypot(ped.mesh.position.x - p.x, ped.mesh.position.z - p.z);
    if (d < 2.2) {
      ped.knockDown();
      police.addCrime(0.5);
      hud.showMessage("You decked a local. The PD heard about it.", 3);
      break;
    }
  }
}

function stepSim(seconds) {
  const dt = 1 / 60;
  const steps = Math.floor(seconds / dt);
  for (let i = 0; i < steps; i++) tick(dt);
}

function tick(dt) {
  elapsed += dt;
  player.update(dt, input.keys, input.camYaw, colliders, cars);
  for (const car of cars) car.updateTraffic(dt, rng);
  const danger = police.stars > 0 || player.car ? player.pos : null;
  for (const ped of peds) ped.update(dt, danger, rng);
  // Running a ped over is a crime.
  if (player.car && Math.abs(player.car.speed) > 5) {
    for (const ped of peds) {
      if (ped.down) continue;
      const d = Math.hypot(ped.mesh.position.x - player.car.pos.x, ped.mesh.position.z - player.car.pos.z);
      if (d < 2.4) {
        ped.knockDown();
        police.addCrime(1);
        audio.thud();
      }
    }
  }
  const busted = police.update(dt, player, colliders);
  const event = missions.update(dt, player, police);
  if (event) {
    hud.showMessage(event.msg + (event.reward ? "  +$" + event.reward : ""), 5);
    audio.chime();
    const next = missions.current();
    if (event.finishedMission && next) {
      setTimeout(() => hud.showMessage(next.brief, 7), 5200);
    }
  }
  if (player.dead) endGame("wasted");
  else if (busted) endGame("busted");
  if (player.health < 100 && !player.dead) player.heal(dt * 0.7);
}

function handleActions() {
  if (input.wasPressed("KeyF")) {
    if (player.car) {
      player.exitCar();
      hud.showMessage("On foot. Watch the traffic.", 2.5);
    } else {
      const car = player.nearestCar(cars);
      if (car) {
        const stolen = car.driver === "traffic";
        if (player.enterCar(car, () => {})) {
          if (stolen) {
            police.addCrime(1);
            hud.showMessage("You jacked a " + car.name + ". The owner called it in!", 3.5);
          } else {
            hud.showMessage("Driving a " + car.name + ".", 2.5);
          }
        }
      }
    }
  }
  if (input.wasPressed("KeyQ")) {
    player.weapon = player.weapon === "pistol" ? "fists" : "pistol";
    hud.showMessage(player.weapon === "pistol" ? "Pistol out. Loud and illegal." : "Fists up.", 2);
  }
  if (input.mousePressed && !player.car) combat();
  if (input.wasPressed("KeyM")) {
    hud.showMessage(saveGame(snapshotOf(player, missions)) ? "Saved. Mama Sol keeps your ledger." : "Save failed.", 3);
  }
  if (input.wasPressed("KeyL")) {
    const data = loadGame();
    if (data) {
      player.cash = data.cash;
      player.health = data.health;
      missions.restore(data.mission, data.step);
      player.mesh.position.set(data.x || 0, 0, data.z || 24);
      hud.showMessage("Loaded. Back on the street.", 3);
    } else {
      hud.showMessage("No save on file yet. Press M to save.", 3);
    }
  }
}

function updateCamera(dt) {
  const target = player.pos;
  const dist = player.car ? 11 : 7.5;
  const height = 2.2 + input.camPitch * 5;
  const cx = target.x - Math.sin(input.camYaw) * dist;
  const cz = target.z - Math.cos(input.camYaw) * dist;
  const desired = new THREE.Vector3(cx, Math.max(1.6, height), cz);
  camera.position.lerp(desired, Math.min(1, dt * 6));
  camera.lookAt(target.x, 1.6, target.z);
}

const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (state === "play") {
    handleActions();
    tick(dt);
    updateCamera(dt);
    audio.update(dt, player.speedKmh, police.wantedCount());
    hud.update({
      player, police,
      mission: missions.current(),
      step: missions.currentStep(),
      cars, peds, elapsed,
    });
  } else if (state === "title") {
    // Slow orbit over the city behind the title screen.
    const t = performance.now() * 0.00005;
    camera.position.set(Math.sin(t) * 120, 46, Math.cos(t) * 120);
    camera.lookAt(0, 8, 0);
    for (const car of cars) car.updateTraffic(dt, rng);
  }
  input.endFrame();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Test hooks + screenshot staging.
function renderOnce() {
  updateCamera(1 / 60);
  hud.update({
    player, police,
    mission: missions.current(),
    step: missions.currentStep(),
    cars, peds, elapsed,
  });
  renderer.render(scene, camera);
}
window.__game = { player, police, missions, cars, peds, input, startPlay, stepSim, renderOnce, state: () => state };
const shot = params.get("shot");
if (shot) stageShot(shot, window.__game);
loop();
