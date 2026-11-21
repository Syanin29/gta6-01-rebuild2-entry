// Car factory + ambient traffic that cruises the road grid in lanes.
import * as THREE from "three";
import { ROAD_LINES, CAR_COLORS, CAR_NAMES, TRAFFIC_COUNT } from "./config.js";
import { rngPick, rngRange } from "./random.js";

export function makeCarMesh(color, police = false) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: police ? 0xf2f2f5 : color });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.65, 4.4), bodyMat);
  body.position.y = 0.55;
  group.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.6, 2.1),
    new THREE.MeshLambertMaterial({ color: police ? 0x22304d : 0x2b3442 })
  );
  cabin.position.set(0, 1.12, -0.2);
  group.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x15151a });
  for (const [wx, wz] of [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.36, wz);
    group.add(wheel);
  }
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  for (const lx of [-0.65, 0.65]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.08), lightMat);
    lamp.position.set(lx, 0.62, 2.21);
    group.add(lamp);
  }
  if (police) {
    const bar = new THREE.Group();
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.5), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
    red.position.x = -0.32;
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.5), new THREE.MeshBasicMaterial({ color: 0x2a6bff }));
    blue.position.x = 0.32;
    bar.add(red, blue);
    bar.position.y = 1.55;
    bar.name = "lightbar";
    group.add(bar);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.3, 4.42), new THREE.MeshLambertMaterial({ color: 0x22304d }));
    stripe.position.y = 0.62;
    group.add(stripe);
  }
  return group;
}

export class Car {
  constructor(scene, rng, x, z, heading, police = false) {
    this.mesh = makeCarMesh(rngPick(rng, CAR_COLORS), police);
    this.mesh.position.set(x, 0, z);
    this.heading = heading;
    this.speed = 0;
    this.police = police;
    this.name = police ? "CPD Interceptor" : rngPick(rng, CAR_NAMES);
    this.driver = null; // "player" | "traffic" | "police" | null (parked)
    this.health = 100;
    this.laneAxis = Math.abs(Math.sin(heading)) > 0.5 ? "x" : "z";
    this.laneLine = this.laneAxis === "x" ? z : x;
    this.dir = Math.cos(heading) >= 0 && this.laneAxis === "z" ? 1 : (Math.sin(heading) >= 0 ? 1 : -1);
    this.cruise = rngRange(rng, 9, 14);
    scene.add(this.mesh);
  }
  get pos() { return this.mesh.position; }
  syncMesh() {
    this.mesh.rotation.y = this.heading;
  }
  // Ambient traffic: hold a lane, turn at intersections sometimes.
  updateTraffic(dt, rng) {
    if (this.driver !== "traffic") return;
    this.speed += (this.cruise - this.speed) * Math.min(1, dt * 1.5);
    const step = this.speed * dt * this.dir;
    if (this.laneAxis === "z") this.pos.z += step;
    else this.pos.x += step;
    const along = this.laneAxis === "z" ? this.pos.z : this.pos.x;
    for (const line of ROAD_LINES) {
      if (Math.abs(along - line) < this.speed * dt + 0.4 && rng() < 0.35) {
        // Turn onto the crossing road.
        const newAxis = this.laneAxis === "z" ? "x" : "z";
        this.laneLine = line;
        this.laneAxis = newAxis;
        this.dir = rng() < 0.5 ? 1 : -1;
        if (newAxis === "z") this.pos.x = line + this.dir * 3.4;
        else this.pos.z = line - this.dir * 3.4;
        break;
      }
    }
    const laneOffset = this.laneAxis === "z" ? this.dir * 3.4 : -this.dir * 3.4;
    if (this.laneAxis === "z") this.pos.x += (this.laneLine + laneOffset - this.pos.x) * Math.min(1, dt * 2);
    else this.pos.z += (this.laneLine + laneOffset - this.pos.z) * Math.min(1, dt * 2);
    this.heading = this.laneAxis === "z"
      ? (this.dir > 0 ? 0 : Math.PI)
      : (this.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    if (Math.abs(this.pos.x) > 240 || Math.abs(this.pos.z) > 240) {
      this.pos.x = THREE.MathUtils.clamp(this.pos.x, -200, 200);
      this.pos.z = THREE.MathUtils.clamp(this.pos.z, -200, 200);
      this.dir *= -1;
    }
    this.syncMesh();
  }
}

export function spawnTraffic(scene, rng) {
  const cars = [];
  for (let i = 0; i < TRAFFIC_COUNT; i++) {
    const vertical = rng() < 0.5;
    const line = rngPick(rng, ROAD_LINES);
    const along = rngRange(rng, -190, 190);
    const dir = rng() < 0.5 ? 1 : -1;
    const x = vertical ? line + dir * 3.4 : along;
    const z = vertical ? along : line - dir * 3.4;
    const heading = vertical ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    const car = new Car(scene, rng, x, z, heading);
    car.driver = "traffic";
    cars.push(car);
  }
  // A few parked cars the player can steal.
  for (let i = 0; i < 8; i++) {
    const line = rngPick(rng, ROAD_LINES);
    const car = new Car(scene, rng, line + 5.6, rngRange(rng, -190, 190), 0);
    car.driver = null;
    cars.push(car);
  }
  return cars;
}
