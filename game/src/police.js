// Wanted stars + Coral Palms PD pursuit cars with a bust meter.
import * as THREE from "three";
import { WANTED } from "./config.js";
import { Car } from "./vehicles.js";
import { collideCircle } from "./world.js";

export class PoliceSystem {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.stars = 0;
    this.cars = [];
    this.bustTimer = 0;
    this.flash = 0;
  }
  addCrime(amount) {
    this.stars = Math.min(WANTED.maxStars, this.stars + amount);
  }
  wantedCount() {
    return Math.ceil(this.stars);
  }
  update(dt, player, colliders) {
    const want = this.wantedCount();
    // Keep pursuit strength matched to the star count.
    while (this.cars.length < want) {
      const angle = this.rng() * Math.PI * 2;
      const x = player.pos.x + Math.sin(angle) * 70;
      const z = player.pos.z + Math.cos(angle) * 70;
      const car = new Car(this.scene, this.rng, x, z, 0, true);
      car.driver = "police";
      this.cars.push(car);
    }
    while (this.cars.length > want && this.cars.length > 0) {
      const car = this.cars.pop();
      this.scene.remove(car.mesh);
    }
    let anyNear = false;
    for (const car of this.cars) {
      const dx = player.pos.x - car.pos.x;
      const dz = player.pos.z - car.pos.z;
      const dist = Math.hypot(dx, dz);
      const targetHeading = Math.atan2(dx, dz);
      let turn = targetHeading - car.heading;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      car.heading += THREE.MathUtils.clamp(turn, -2.2 * dt, 2.2 * dt);
      const topSpeed = 30 + this.stars * 2.4;
      car.speed += (topSpeed - car.speed) * Math.min(1, dt * 1.2);
      car.pos.x += Math.sin(car.heading) * car.speed * dt;
      car.pos.z += Math.cos(car.heading) * car.speed * dt;
      collideCircle(car.pos, 1.6, colliders);
      car.syncMesh();
      // Ram: slow the player's car on contact.
      if (player.car && dist < 4.4) {
        player.car.speed *= 0.985;
        if (Math.abs(player.car.speed) > 6) player.hurt(dt * 3);
      }
      if (dist < WANTED.bustRadius + 3) anyNear = true;
      const bar = car.mesh.getObjectByName("lightbar");
      if (bar) bar.visible = Math.floor(this.flash * 6) % 2 === 0;
    }
    this.flash += dt;
    const playerSlow = !player.car || Math.abs(player.car.speed) < 3;
    if (anyNear && playerSlow && this.stars > 0) {
      this.bustTimer += dt;
    } else {
      this.bustTimer = Math.max(0, this.bustTimer - dt * 1.5);
    }
    if (this.stars > 0 && !anyNear) {
      this.stars = Math.max(0, this.stars - WANTED.decayPerSecond * dt);
    }
    return this.bustTimer >= WANTED.bustSeconds;
  }
  clear() {
    for (const car of this.cars) this.scene.remove(car.mesh);
    this.cars = [];
    this.stars = 0;
    this.bustTimer = 0;
  }
}
