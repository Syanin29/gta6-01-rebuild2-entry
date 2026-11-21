// Builds the Coral Palms island city: ground, road grid, buildings with
// colliders, palms, lamps, beach and ocean, district signs, parked cars.
import * as THREE from "three";
import { ROAD_LINES, ROAD_HALF, CITY_EDGE, DISTRICTS } from "./config.js";
import { rngRange, rngPick } from "./random.js";

const BUILDING_TONES = [0xf2d5b8, 0xe8b4a0, 0xd9e6f2, 0xf7e8c9, 0xcfe3d4, 0xe6d7f0, 0xf5c6c6, 0xd8d8dc];
const ROOF_TONES = [0x8a5a44, 0x5f6b7a, 0x7a4a5a, 0x4a6b5a];

export function isOnRoad(x, z) {
  for (const line of ROAD_LINES) {
    if (Math.abs(x - line) < ROAD_HALF + 1 || Math.abs(z - line) < ROAD_HALF + 1) return true;
  }
  return false;
}

export function nearestRoadPoint(x, z) {
  let best = null;
  let bestD = Infinity;
  for (const line of ROAD_LINES) {
    const cand = [
      { x: line, z },
      { x, z: line },
    ];
    for (const c of cand) {
      const d = (c.x - x) ** 2 + (c.z - z) ** 2;
      if (d < bestD) { bestD = d; best = c; }
    }
  }
  return best;
}

function makeSignTexture(text, color) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#140a24"; g.fillRect(0, 0, 256, 64);
  g.strokeStyle = color; g.lineWidth = 4; g.strokeRect(4, 4, 248, 56);
  g.fillStyle = color;
  g.font = "bold 26px Trebuchet MS, sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text.toUpperCase(), 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePalm(rng) {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8a6844 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 6.5, 6), trunkMat);
  trunk.position.y = 3.25;
  trunk.rotation.z = rngRange(rng, -0.08, 0.08);
  group.add(trunk);
  const frondMat = new THREE.MeshLambertMaterial({ color: 0x2e9e5b, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.7), frondMat);
    frond.position.y = 6.5;
    frond.rotation.y = (i / 7) * Math.PI * 2;
    frond.rotation.z = 0.55;
    frond.translateX(1.4);
    group.add(frond);
  }
  return group;
}

export function buildWorld(scene, rng) {
  const colliders = []; // {x, z, hx, hz} axis-aligned boxes

  // Ground: island slab + beach strip + ocean plane to the west.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY_EDGE * 2 + 60, CITY_EDGE * 2 + 60),
    new THREE.MeshLambertMaterial({ color: 0x9aa578 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const beach = new THREE.Mesh(
    new THREE.PlaneGeometry(46, CITY_EDGE * 2 + 60),
    new THREE.MeshLambertMaterial({ color: 0xf0dcab })
  );
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(-CITY_EDGE - 18, 0.02, 0);
  scene.add(beach);

  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 1400),
    new THREE.MeshLambertMaterial({ color: 0x1b7fa8 })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(-CITY_EDGE - 460, -0.4, 0);
  scene.add(ocean);

  // Roads: dark strips along every grid line, with dashed center paint.
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x33333d });
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xf5e9a8 });
  for (const line of ROAD_LINES) {
    for (const vertical of [true, false]) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(vertical ? ROAD_HALF * 2 : CITY_EDGE * 2, vertical ? CITY_EDGE * 2 : ROAD_HALF * 2), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(vertical ? line : 0, 0.03, vertical ? 0 : line);
      scene.add(road);
      for (let t = -CITY_EDGE + 8; t < CITY_EDGE; t += 12) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(vertical ? 0.5 : 5, vertical ? 5 : 0.5), dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(vertical ? line : t, 0.045, vertical ? t : line);
        scene.add(dash);
      }
    }
  }

  // Buildings fill each block between roads; every one registers a collider.
  const windowMat = new THREE.MeshBasicMaterial({ color: 0xffd98a });
  for (let bi = 0; bi < ROAD_LINES.length - 1; bi++) {
    for (let bj = 0; bj < ROAD_LINES.length - 1; bj++) {
      const x0 = ROAD_LINES[bi] + ROAD_HALF + 3;
      const x1 = ROAD_LINES[bi + 1] - ROAD_HALF - 3;
      const z0 = ROAD_LINES[bj] + ROAD_HALF + 3;
      const z1 = ROAD_LINES[bj + 1] - ROAD_HALF - 3;
      const count = 2 + Math.floor(rng() * 2);
      for (let k = 0; k < count; k++) {
        const w = rngRange(rng, 12, 20);
        const d = rngRange(rng, 12, 20);
        const h = rngRange(rng, 10, 42);
        const x = rngRange(rng, x0 + w / 2, x1 - w / 2);
        const z = rngRange(rng, z0 + d / 2, z1 - d / 2);
        const tone = rngPick(rng, BUILDING_TONES);
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, d),
          new THREE.MeshLambertMaterial({ color: tone })
        );
        b.position.set(x, h / 2, z);
        scene.add(b);
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(w + 0.6, 0.8, d + 0.6),
          new THREE.MeshLambertMaterial({ color: rngPick(rng, ROOF_TONES) })
        );
        roof.position.set(x, h + 0.4, z);
        scene.add(roof);
        // Lit windows: a few bright quads on two faces sell the sunset city.
        const floors = Math.floor(h / 4);
        for (let f = 0; f < floors; f++) {
          if (rng() < 0.45) continue;
          const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.7, 1.1), windowMat);
          win.position.set(x, 2.5 + f * 4, z + d / 2 + 0.06);
          scene.add(win);
        }
        colliders.push({ x, z, hx: w / 2, hz: d / 2 });
      }
    }
  }

  // Palms along the beach and scattered on sidewalks.
  for (let i = 0; i < 46; i++) {
    const palm = makePalm(rng);
    if (i < 20) {
      palm.position.set(-CITY_EDGE - rngRange(rng, 4, 26), 0, rngRange(rng, -CITY_EDGE, CITY_EDGE));
    } else {
      const line = rngPick(rng, ROAD_LINES);
      palm.position.set(line + ROAD_HALF + 2.2, 0, rngRange(rng, -CITY_EDGE, CITY_EDGE));
    }
    scene.add(palm);
  }

  // District signs on poles at district centers.
  for (const d of DISTRICTS) {
    const tex = makeSignTexture(d.name, "#" + d.color.toString(16).padStart(6, "0"));
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 3.5),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
    );
    sign.position.set(d.x, 7, d.z);
    scene.add(sign);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 7, 6), new THREE.MeshLambertMaterial({ color: 0x555560 }));
    pole.position.set(d.x, 3.5, d.z);
    scene.add(pole);
  }

  // Pier reaching into the ocean at Harbor Row (mission landmark).
  const pier = new THREE.Mesh(
    new THREE.BoxGeometry(70, 1.2, 8),
    new THREE.MeshLambertMaterial({ color: 0x9a7a54 })
  );
  pier.position.set(-CITY_EDGE - 34, 0.6, -60);
  scene.add(pier);

  return { colliders };
}

export function collideCircle(pos, radius, colliders) {
  for (const c of colliders) {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const px = c.hx + radius - Math.abs(dx);
    const pz = c.hz + radius - Math.abs(dz);
    if (px > 0 && pz > 0) {
      if (px < pz) pos.x += dx >= 0 ? px : -px;
      else pos.z += dz >= 0 ? pz : -pz;
    }
  }
  pos.x = Math.max(-CITY_EDGE - 30, Math.min(CITY_EDGE, pos.x));
  pos.z = Math.max(-CITY_EDGE, Math.min(CITY_EDGE, pos.z));
}
