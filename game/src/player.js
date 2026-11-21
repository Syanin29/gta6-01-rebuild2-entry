// Reno Vale: on-foot movement, car entry, arcade driving, punch/shoot.
import * as THREE from "three";
import { PLAYER } from "./config.js";
import { makePersonMesh } from "./peds.js";
import { collideCircle } from "./world.js";

export class Player {
  constructor(scene, rng) {
    this.mesh = makePersonMesh(rng, 0x2ec4b6);
    this.mesh.position.set(0, 0, 24);
    this.heading = Math.PI;
    this.health = PLAYER.maxHealth;
    this.cash = PLAYER.startCash;
    this.car = null; // Car being driven, or null on foot
    this.ammo = 24;
    this.weapon = "fists";
    this.dead = false;
    scene.add(this.mesh);
  }
  get pos() {
    return this.car ? this.car.pos : this.mesh.position;
  }
  get speedKmh() {
    return this.car ? Math.abs(this.car.speed) * 3.6 : 0;
  }
  update(dt, keys, camYaw, colliders, cars) {
    if (this.dead) return;
    if (this.car) this.driveCar(dt, keys, colliders);
    else this.walk(dt, keys, camYaw, colliders);
    this.mesh.visible = !this.car;
  }
  walk(dt, keys, camYaw, colliders) {
    const fwd = (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0);
    const strafe = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
    if (fwd === 0 && strafe === 0) return;
    const run = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const speed = run ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const moveYaw = camYaw + Math.atan2(strafe, fwd);
    const p = this.mesh.position;
    p.x += Math.sin(moveYaw) * speed * dt;
    p.z += Math.cos(moveYaw) * speed * dt;
    this.heading = moveYaw;
    this.mesh.rotation.y = moveYaw;
    collideCircle(p, 0.6, colliders);
  }
  driveCar(dt, keys, colliders) {
    const car = this.car;
    const throttle = (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0);
    const steer = (keys.has("KeyA") ? 1 : 0) - (keys.has("KeyD") ? 1 : 0);
    if (keys.has("Space")) {
      car.speed -= Math.sign(car.speed) * PLAYER.carBrake * dt;
      if (Math.abs(car.speed) < 0.4) car.speed = 0;
    } else if (throttle !== 0) {
      car.speed += throttle * PLAYER.carAccel * dt;
    } else {
      car.speed -= car.speed * 0.6 * dt; // engine drag
    }
    car.speed = THREE.MathUtils.clamp(car.speed, -12, PLAYER.carTopSpeed);
    if (Math.abs(car.speed) > 0.5) {
      car.heading += steer * PLAYER.carTurn * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 8);
    }
    car.pos.x += Math.sin(car.heading) * car.speed * dt;
    car.pos.z += Math.cos(car.heading) * car.speed * dt;
    const before = { x: car.pos.x, z: car.pos.z };
    collideCircle(car.pos, 1.6, colliders);
    if (Math.abs(car.pos.x - before.x) > 0.01 || Math.abs(car.pos.z - before.z) > 0.01) {
      if (Math.abs(car.speed) > 9) this.hurt(Math.abs(car.speed) * 0.35);
      car.speed *= 0.45;
    }
    car.syncMesh();
  }
  nearestCar(cars, maxDist = 4.2) {
    let best = null;
    let bestD = maxDist;
    for (const car of cars) {
      const d = Math.hypot(car.pos.x - this.mesh.position.x, car.pos.z - this.mesh.position.z);
      if (d < bestD) { bestD = d; best = car; }
    }
    return best;
  }
  enterCar(car, onSteal) {
    if (car.driver === "traffic") {
      car.driver = "player";
      onSteal(car);
    } else if (car.driver === null || car.driver === "player") {
      car.driver = "player";
    } else {
      return false;
    }
    this.car = car;
    return true;
  }
  exitCar() {
    if (!this.car) return;
    const car = this.car;
    car.driver = null;
    car.speed = 0;
    this.mesh.position.set(car.pos.x + 2.2, 0, car.pos.z);
    this.car = null;
  }
  hurt(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) this.dead = true;
  }
  heal(amount) {
    this.health = Math.min(PLAYER.maxHealth, this.health + amount);
  }
}
