// Save / load the run in localStorage: cash, health, mission progress.
const SAVE_KEY = "coral-palms-neon-tide-save-v1";

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.cash !== "number" || typeof data.mission !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

export function snapshotOf(player, missions) {
  return {
    cash: player.cash,
    health: Math.round(player.health),
    mission: missions.index,
    step: missions.step,
    x: Math.round(player.pos.x),
    z: Math.round(player.pos.z),
  };
}
