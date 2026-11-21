// Mama Sol's three-job chain: pickups, a hot car, and a payday run.
import * as THREE from "three";

export const MISSIONS = [
  {
    title: "The Sunset Score",
    brief: "Mama Sol: \"A cooler waits on the Harbor Row pier. Bring it to the Neon Mile motel. Quietly, Reno.\"",
    steps: [
      { text: "Pick up the cooler at the Harbor Row pier", x: -228, z: -60, radius: 6, wanted: 2, msg: "Cooler grabbed — the PD just lit up. Lose them or outrun them!" },
      { text: "Deliver the cooler to the Neon Mile motel", x: 0, z: 120, radius: 7, reward: 1200, msg: "Delivered. Mama Sol pays cash, no questions." },
    ],
  },
  {
    title: "Hot Wheels",
    brief: "Mama Sol: \"A Comet GT sits outside the Casino Strip. Steal it and bring it to my Harbor Row lockup.\"",
    steps: [
      { text: "Steal the Comet GT on the Casino Strip", x: 60, z: 180, radius: 8, needCar: true, msg: "That's the Comet. Now get it to the lockup in one piece." },
      { text: "Deliver the Comet GT to the Harbor Row lockup", x: -150, z: -60, radius: 8, needCar: true, reward: 1800, msg: "Clean delivery. The lockup boys are impressed." },
    ],
  },
  {
    title: "Payday Run",
    brief: "Mama Sol: \"Three drops, three corners of the island. Hit every marker before the heat finds you.\"",
    steps: [
      { text: "Drop 1 of 3: Old Palms", x: 120, z: -120, radius: 7, msg: "Drop one done. Two to go." },
      { text: "Drop 2 of 3: The Flats", x: -60, z: -180, radius: 7, msg: "Drop two done. One more, Reno." },
      { text: "Drop 3 of 3: Neon Mile", x: 0, z: 120, radius: 7, reward: 2500, msg: "Payday. Mama Sol clears your debt — Coral Palms is yours." },
    ],
  },
];

export class MissionRunner {
  constructor(scene) {
    this.index = 0;
    this.step = 0;
    this.done = false;
    this.marker = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 9, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    this.marker.position.y = 4.5;
    scene.add(this.marker);
    this.beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffe98a })
    );
    scene.add(this.beacon);
    this.placeMarker();
  }
  current() {
    if (this.done) return null;
    return MISSIONS[this.index];
  }
  currentStep() {
    const m = this.current();
    return m ? m.steps[this.step] : null;
  }
  placeMarker() {
    const s = this.currentStep();
    if (!s) {
      this.marker.visible = false;
      this.beacon.visible = false;
      return;
    }
    this.marker.visible = true;
    this.beacon.visible = true;
    this.marker.position.set(s.x, 4.5, s.z);
    this.beacon.position.set(s.x, 8.6, s.z);
  }
  // Returns an event object when a step completes, else null.
  update(dt, player, police) {
    this.marker.rotation.y += dt * 0.8;
    this.beacon.position.y = 8.6 + Math.sin(performance.now() * 0.003) * 0.5;
    const s = this.currentStep();
    if (!s) return null;
    if (s.needCar && !player.car) return null;
    const d = Math.hypot(player.pos.x - s.x, player.pos.z - s.z);
    if (d > s.radius) return null;
    const finishedMission = this.step === this.current().steps.length - 1;
    const reward = s.reward || 0;
    if (s.wanted) police.addCrime(s.wanted);
    if (reward) player.cash += reward;
    const event = { msg: s.msg, reward, finishedMission, missionTitle: this.current().title };
    this.step++;
    if (finishedMission) {
      this.index++;
      this.step = 0;
      if (this.index >= MISSIONS.length) this.done = true;
    }
    this.placeMarker();
    return event;
  }
  restore(index, step) {
    this.index = Math.min(index, MISSIONS.length);
    this.step = step || 0;
    this.done = this.index >= MISSIONS.length;
    this.placeMarker();
  }
}
