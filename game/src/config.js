// Coral Palms layout + tuning constants shared by every system.

// Roads run on a square grid; their center lines sit at these coordinates.
export const ROAD_LINES = [-180, -120, -60, 0, 60, 120, 180];
export const ROAD_HALF = 7; // half width of a road strip
export const CITY_EDGE = 215; // playable bound; ocean lies west of -215

export const DISTRICTS = [
  { name: "Neon Mile", x: 0, z: 120, color: 0xff5da2 },
  { name: "Harbor Row", x: -150, z: -60, color: 0x35c4ff },
  { name: "Old Palms", x: 120, z: -120, color: 0xffc94d },
  { name: "Casino Strip", x: 60, z: 180, color: 0xb78bff },
  { name: "The Flats", x: -60, z: -180, color: 0x7dff8a },
];

export const CAR_COLORS = [0xd64541, 0x2e86ff, 0xf5c542, 0x37b24d, 0xe8e8ec, 0x8a5cff, 0xff8c42, 0x20c4b2];
export const CAR_NAMES = ["Comet GT", "Sundown Sedan", "Marlin Coupe", "Tide Runner", "Palma Wagon", "Vesper S"];

export const PLAYER = {
  walkSpeed: 6,
  runSpeed: 10.5,
  carTopSpeed: 42,
  carAccel: 16,
  carBrake: 30,
  carTurn: 1.9,
  startCash: 40,
  maxHealth: 100,
};

export const WANTED = {
  maxStars: 5,
  decayPerSecond: 0.02, // stars fade slowly when no police can see you
  bustRadius: 5,
  bustSeconds: 2.5,
};

export const TRAFFIC_COUNT = 14;
export const PED_COUNT = 26;
