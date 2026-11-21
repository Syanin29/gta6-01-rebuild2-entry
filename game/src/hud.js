// DOM HUD: cash, clock, health, wanted stars, mission card, minimap.
import { CITY_EDGE, ROAD_LINES } from "./config.js";

export class Hud {
  constructor() {
    this.cash = document.getElementById("hud-cash");
    this.clock = document.getElementById("hud-clock");
    this.healthFill = document.getElementById("hud-healthfill");
    this.wanted = document.getElementById("hud-wanted");
    this.missionTitle = document.getElementById("hud-mission-title");
    this.missionText = document.getElementById("hud-mission-text");
    this.message = document.getElementById("hud-message");
    this.speed = document.getElementById("hud-speed");
    this.weapon = document.getElementById("hud-weapon");
    this.minimap = document.getElementById("minimap");
    this.mapCtx = this.minimap.getContext("2d");
    this.messageUntil = 0;
  }
  showMessage(text, seconds = 4) {
    this.message.textContent = text;
    this.messageUntil = performance.now() + seconds * 1000;
  }
  update(state) {
    const { player, police, mission, step, cars, peds, elapsed } = state;
    this.cash.textContent = "$" + player.cash;
    const mins = 18 * 60 + 42 + Math.floor(elapsed / 4);
    const hh = String(Math.floor(mins / 60) % 24).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    this.clock.textContent = hh + ":" + mm + " · Coral Palms";
    this.healthFill.style.width = Math.max(0, player.health) + "%";
    const stars = Math.ceil(police.stars);
    this.wanted.textContent = stars > 0 ? "★".repeat(stars) + "☆".repeat(5 - stars) : "";
    if (mission) {
      this.missionTitle.textContent = mission.title;
      this.missionText.textContent = step ? step.text : "";
    } else {
      this.missionTitle.textContent = "Free roam";
      this.missionText.textContent = "The island is yours. M to save, L to load.";
    }
    this.speed.textContent = Math.round(player.speedKmh) + " km/h";
    this.weapon.textContent = player.weapon === "pistol" ? "Pistol · " + player.ammo : "Fists";
    if (performance.now() > this.messageUntil) this.message.textContent = "";
    this.drawMinimap(player, police, step, cars, peds);
  }
  drawMinimap(player, police, step, cars, peds) {
    const g = this.mapCtx;
    const S = 150;
    const scale = S / (CITY_EDGE * 2 + 40);
    const px = (x) => (x + CITY_EDGE + 20) * scale;
    const pz = (z) => (z + CITY_EDGE + 20) * scale;
    g.clearRect(0, 0, S, S);
    g.fillStyle = "#1b7fa8";
    g.fillRect(0, 0, px(-CITY_EDGE - 10), S);
    g.fillStyle = "#4c5a44";
    g.fillRect(px(-CITY_EDGE), 0, S, S);
    g.strokeStyle = "#20242e";
    g.lineWidth = 5;
    for (const line of ROAD_LINES) {
      g.beginPath(); g.moveTo(px(line), 0); g.lineTo(px(line), S); g.stroke();
      g.beginPath(); g.moveTo(0, pz(line)); g.lineTo(S, pz(line)); g.stroke();
    }
    if (step) {
      g.fillStyle = "#ffd34d";
      g.beginPath(); g.arc(px(step.x), pz(step.z), 5, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = "#cfe3ff";
    for (const ped of peds) {
      if (ped.down) continue;
      g.fillRect(px(ped.mesh.position.x) - 1, pz(ped.mesh.position.z) - 1, 2, 2);
    }
    g.fillStyle = "#9aa3ad";
    for (const car of cars) g.fillRect(px(car.pos.x) - 1.5, pz(car.pos.z) - 1.5, 3, 3);
    g.fillStyle = "#ff4040";
    for (const car of police.cars) {
      g.beginPath(); g.arc(px(car.pos.x), pz(car.pos.z), 3, 0, Math.PI * 2); g.fill();
    }
    // Player arrow.
    const x = px(player.pos.x);
    const z = pz(player.pos.z);
    const heading = player.car ? player.car.heading : player.heading;
    g.save();
    g.translate(x, z);
    g.rotate(Math.PI - heading);
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(0, -6); g.lineTo(4, 5); g.lineTo(-4, 5);
    g.closePath(); g.fill();
    g.restore();
  }
}
