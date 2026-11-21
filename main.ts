// Entrypoint for the gta6-01 entry: hands the built game to the grader.
// Copies game/ and screenshots/ into the output directory, then writes
// dossier.json with the kit's own buildDossier library (vendor/, unchanged).
// Deterministic: the same repository always produces the same bytes.
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

mkdirSync(outDir, { recursive: true });
cpSync(join(here, "game"), join(outDir, "game"), { recursive: true });
cpSync(join(here, "screenshots"), join(outDir, "screenshots"), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, "dossier.json"), dossier);
console.log("coral-palms: game + screenshots copied, dossier.json written (" + dossier.length + " bytes)");
