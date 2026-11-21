// Deterministic screenshot staging (?shot=chase|drive|foot|start&seed=N).
// Drives the real simulation with scripted input for a few seconds, then
// flags window.__shotReady so a headless browser can capture the frame.
export function stageShot(name, game) {
  const { player, police, missions, cars, input } = game;
  if (name === "start") {
    window.__shotReady = true;
    return;
  }
  game.startPlay();
  if (name === "foot") {
    player.mesh.position.set(3, 0, 30);
    player.heading = Math.PI;
    input.camYaw = Math.PI;
    game.stepSim(1.2);
    game.renderOnce();
    window.__shotReady = true;
    return;
  }
  // chase + drive: put Reno in the nearest car on a clear road, floor it.
  const car = cars.find((c) => c.driver === "traffic") || cars[0];
  car.pos.set(0, 0, -40);
  car.heading = 0;
  car.speed = 0;
  player.mesh.position.set(0, 0, -38);
  player.enterCar(car, () => {});
  if (name === "chase") {
    missions.restore(0, 1); // cooler picked up, heading to the motel
    police.addCrime(2);
    player.cash = 40;
  }
  input.keys.add("KeyW");
  game.stepSim(name === "chase" ? 5.2 : 4.2);
  game.renderOnce();
  window.__shotReady = true;
}
