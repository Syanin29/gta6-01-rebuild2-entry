// Pedestrians strolling the sidewalks; they scatter when danger is near.
import * as THREE from "three";
import { ROAD_LINES, PED_COUNT } from "./config.js";
import { rngPick, rngRange } from "./random.js";

const SHIRTS = [0xff6b6b, 0x4dabff, 0xffd93d, 0x6bcb77, 0xc77dff, 0xff9f45, 0xf5f5f5];
const SKINS = [0xf1c27d, 0xe0ac69, 0x8d5524, 0xffdbac];

export function makePersonMesh(rng, shirtColor) {
  const group = new THREE.Group();
  const skin = rngPick(rng, SKINS);
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.85, 0.34),
    new THREE.MeshLambertMaterial({ color: shirtColor })
  );
  torso.position.y = 1.05;
  group.add(torso);
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.42, 0.4),
    new THREE.MeshLambertMaterial({ color: skin })
  );
  head.position.y = 1.72;
  group.add(head);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x2e3440 });
  for (const lx of [-0.16, 0.16]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.62, 0.26), legMat);
    leg.position.set(lx, 0.31, 0);
    group.add(leg);
  }
  return group;
}

export class Ped {
  constructor(scene, rng) {
    this.mesh = makePersonMesh(rng, rngPick(rng, SHIRTS));
    const line = rngPick(rng, ROAD_LINES);
    this.axis = rng() < 0.5 ? "x" : "z";
    this.line = line + (rng() < 0.5 ? 8.6 : -8.6);
    this.along = rngRange(rng, -200, 200);
    this.dir = rng() < 0.5 ? 1 : -1;
    this.speed = rngRange(rng, 1.1, 1.9);
    this.flee = 0;
    this.down = false;
    scene.add(this.mesh);
    this.sync();
  }
  sync() {
    if (this.axis === "z") this.mesh.position.set(this.line, 0, this.along);
    else this.mesh.position.set(this.along, 0, this.line);
    this.mesh.rotation.y = this.axis === "z" ? (this.dir > 0 ? 0 : Math.PI) : (this.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  }
  update(dt, dangerPos, rng) {
    if (this.down) return;
    const p = this.mesh.position;
    const d = dangerPos ? Math.hypot(p.x - dangerPos.x, p.z - dangerPos.z) : 999;
    if (d < 9) this.flee = 2.2;
    const speed = this.flee > 0 ? this.speed * 3.1 : this.speed;
    if (this.flee > 0) this.flee -= dt;
    this.along += speed * dt * this.dir;
    if (Math.abs(this.along) > 205) this.dir *= -1;
    if (rng() < dt * 0.02) this.dir *= -1;
    this.sync();
  }
  knockDown() {
    this.down = true;
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.25;
  }
}

export function spawnPeds(scene, rng) {
  const peds = [];
  for (let i = 0; i < PED_COUNT; i++) peds.push(new Ped(scene, rng));
  return peds;
}
