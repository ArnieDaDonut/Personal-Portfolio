// Build a 3D constellation (.glb) from real star data using only Node built-ins.
// Output: public/constellation.glb
// Default constellation: Orion (M42). Positions in a small, viewable unit-cube scale.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '..', 'public', 'constellation.glb');

// ---------- Star data (Orion, approximate RA/Dec -> XYZ) ----------
// Real Hipparcos-style positions. RA in hours, Dec in degrees, dist in parsecs.
// Converted to a normalized 3D coordinate frame (light-years / 50, centered).
// Format: { name, ra_h, dec_deg, dist_pc, mag }  mag ~ apparent visual magnitude.
const STARS = [
  { name: 'Betelgeuse',   ra_h: 5.9195,  dec_deg:  7.4071,  dist_pc:  168.0, mag: 0.42 },
  { name: 'Bellatrix',    ra_h: 5.4188,  dec_deg:  6.3497,  dist_pc:   64.6, mag: 1.64 },
  { name: 'Mintaka',      ra_h: 5.5334,  dec_deg: -0.2991,  dist_pc:  380.0, mag: 2.23 },
  { name: 'Alnilam',      ra_h: 5.6036,  dec_deg: -1.2019,  dist_pc:  600.0, mag: 1.69 },
  { name: 'Alnitak',      ra_h: 5.6793,  dec_deg: -1.9426,  dist_pc:  250.0, mag: 1.74 },
  { name: 'Saiph',        ra_h: 5.7959,  dec_deg: -9.6696,  dist_pc:  210.0, mag: 2.06 },
  { name: 'Rigel',        ra_h: 5.2422,  dec_deg: -8.2017,  dist_pc:  264.0, mag: 0.13 },
  // Belt triplet is the core; the 4 above/below form the body outline.
];

// Optional faint background stars for ambience (smaller, dimmer).
const BG_STARS = [
  { name: 'Meissa',       ra_h: 5.5854,  dec_deg:  9.9341,  dist_pc:  550, mag: 3.55 }, // Orion's head
  { name: 'Tabit',        ra_h: 4.5997,  dec_deg:  1.7140,  dist_pc:   26, mag: 3.19 }, // pi3 Ori
  { name: 'Tabit-b',      ra_h: 4.6321,  dec_deg:  1.1340,  dist_pc:   27, mag: 4.10 },
  { name: 'Tabit-c',      ra_h: 4.6502,  dec_deg:  1.5950,  dist_pc:   27, mag: 4.50 },
  { name: 'Hatsya',       ra_h: 5.6771,  dec_deg: -5.4167,  dist_pc:  440, mag: 3.60 }, // 32 Ori (sword tip)
  { name: 'Nair al Saif', ra_h: 5.6884,  dec_deg: -5.3910,  dist_pc:  495, mag: 4.55 }, // 33 Ori
  { name: 'Thabit',       ra_h: 5.5793,  dec_deg: -4.8460,  dist_pc:  505, mag: 4.65 }, // 42 Ori
  { name: 'Cursa',        ra_h: 5.1306,  dec_deg: -5.0861,  dist_pc:   27, mag: 2.78 }, // beta Eri
  { name: 'Tau Ori',      ra_h: 5.5857,  dec_deg: -6.8443,  dist_pc:  150, mag: 3.59 },
  { name: 'pi5 Ori',      ra_h: 4.8877,  dec_deg:  2.4371,  dist_pc:  150, mag: 3.69 },
  { name: 'pi4 Ori',      ra_h: 4.8391,  dec_deg:  1.1160,  dist_pc:  150, mag: 4.65 },
  { name: 'pi2 Ori',      ra_h: 4.8241,  dec_deg:  0.5023,  dist_pc:  150, mag: 4.35 },
  { name: 'pi1 Ori',      ra_h: 4.8241,  dec_deg:  0.5023,  dist_pc:  150, mag: 4.65 },
  { name: 'Omicron1 Ori', ra_h: 4.8841,  dec_deg:  0.4900,  dist_pc:  150, mag: 4.71 },
  { name: 'Omicron2 Ori', ra_h: 4.8881,  dec_deg:  0.6200,  dist_pc:  150, mag: 4.07 },
  { name: 'M42 hint',     ra_h: 5.5881,  dec_deg: -5.3911,  dist_pc:  500, mag: 4.00 },
];

// Orion "stick figure" line indices into STARS (0..6)
const LINES = [
  // shoulders -> belt
  [0, 2], [1, 2],   // Betelgeuse-Mintaka, Bellatrix-Mintaka
  [0, 4], [1, 4],   // Betelgeuse-Alnitak,  Bellatrix-Alnitak (rectangle top)
  // belt
  [2, 3], [3, 4],
  // belt -> feet
  [2, 6], [4, 5],   // Mintaka-Rigel, Alnitak-Saiph
  [6, 5],           // Rigel-Saiph (rectangle bottom)
  // body diagonals
  [0, 5], [1, 6],
];

// Convert RA(h) / Dec(deg) / dist(pc) -> unit-vector XYZ, then scale by dist.
function toXYZ({ ra_h, dec_deg, dist_pc }) {
  const ra = ra_h * 15 * Math.PI / 180;     // hours -> radians
  const dec = dec_deg * Math.PI / 180;
  const r = dist_pc * 3.26156;              // parsecs -> light-years
  return [
    r * Math.cos(dec) * Math.cos(ra),
    r * Math.sin(dec),
    r * Math.cos(dec) * Math.sin(ra),
  ];
}

// Recenter + normalize so the constellation fits in a unit cube (side ~ 2.0).
function attachXYZ(s) {
  return Object.assign({}, s, { xyz: toXYZ(s) });
}
const starsWithXYZ   = STARS.map(attachXYZ);
const bgStarsWithXYZ = BG_STARS.map(attachXYZ);
const all = [...starsWithXYZ, ...bgStarsWithXYZ];
let cx = 0, cy = 0, cz = 0, n = 0;
for (const s of all) { cx += s.xyz[0]; cy += s.xyz[1]; cz += s.xyz[2]; n++; }
cx /= n; cy /= n; cz /= n;
for (const s of all) { s.xyz = [s.xyz[0]-cx, s.xyz[1]-cy, s.xyz[2]-cz]; }
let maxR = 0;
for (const s of all) {
  const r = Math.hypot(s.xyz[0], s.xyz[1], s.xyz[2]);
  if (r > maxR) maxR = r;
}
const SCALE = 1.0 / maxR;            // fits roughly in [-1, 1]
for (const s of all) {
  s.xyz = [s.xyz[0]*SCALE, s.xyz[1]*SCALE, s.xyz[2]*SCALE];
}

// Radius from apparent magnitude: brighter = larger. clamp to [0.006, 0.05].
function radiusFor(mag) {
  const r = 0.045 * Math.pow(2.512, -mag) * 1.2;
  return Math.max(0.010, Math.min(0.06, r));
}

// ---------- Geometry builders ----------

// Octahedron (6 verts, 8 triangles) — small star marker.
function makeOctahedron(r) {
  const v = [
    [ r, 0, 0], [-r, 0, 0],
    [ 0, r, 0], [ 0,-r, 0],
    [ 0, 0, r], [ 0, 0,-r],
  ];
  const idx = [
    0,2,4,  0,4,3,  0,3,5,  0,5,2,
    1,4,2,  1,3,4,  1,5,3,  1,2,5,
  ];
  return { v, idx };
}

// Build a single mesh: stars (octahedrons, indexed) + lines (GL_LINES).
// Returns { positions: Float32, indices: Uint16/Uint32, lineIndices, meshBins }.

const positions = [];
const indices = [];
const lineIndices = [];

// Track which "primitive" is which via accessor.byteOffset splitting is messy.
// Instead, split into TWO meshes (two primitives) within one mesh node:
//   primitive 0: TRIANGLES  (stars)
//   primitive 1: LINES      (constellation lines)

let vCursor = 0;
for (const s of starsWithXYZ) {
  const r = radiusFor(s.mag);
  const { v, idx } = makeOctahedron(r);
  const base = vCursor;
  for (const p of v) positions.push(p[0]+s.xyz[0], p[1]+s.xyz[1], p[2]+s.xyz[2]);
  for (const i of idx) indices.push(base + i);
  vCursor += v.length;
}
const starsIndexCount = indices.length;

// background stars (smaller)
for (const s of bgStarsWithXYZ) {
  const r = radiusFor(s.mag) * 0.55;
  const { v, idx } = makeOctahedron(r);
  const base = vCursor;
  for (const p of v) positions.push(p[0]+s.xyz[0], p[1]+s.xyz[1], p[2]+s.xyz[2]);
  for (const i of idx) indices.push(base + i);
  vCursor += v.length;
}

// Lines: push star-center vertices again so they don't share with octahedrons.
let lineVBase = vCursor;
for (const [a, b] of LINES) {
  const sa = starsWithXYZ[a].xyz, sb = starsWithXYZ[b].xyz;
  positions.push(sa[0], sa[1], sa[2]);
  positions.push(sb[0], sb[1], sb[2]);
  lineIndices.push(lineVBase, lineVBase + 1);
  lineVBase += 2;
}

const positionArr = new Float32Array(positions);
const starsIdxArr = new Uint32Array(indices);
const linesIdxArr = new Uint32Array(lineIndices);

// ---------- Pack binary buffer ----------
// We need:
//   - positions: float32 LE
//   - stars indices: uint32 LE
//   - lines indices: uint32 LE
// All padded to 4-byte boundaries.

function pad4(n) { return (n + 3) & ~3; }

const posBytes = positionArr.byteLength;
const starsIdxBytes = starsIdxArr.byteLength;
const linesIdxBytes = linesIdxArr.byteLength;

const posOffset = 0;
const starsIdxOffset = pad4(posBytes);
const linesIdxOffset = pad4(starsIdxOffset + starsIdxBytes);
const totalBin = pad4(linesIdxOffset + linesIdxBytes);

const bin = new Uint8Array(totalBin);
new Float32Array(bin.buffer, bin.byteOffset + posOffset, positionArr.length).set(positionArr);
new Uint32Array(bin.buffer, bin.byteOffset + starsIdxOffset, starsIdxArr.length).set(starsIdxArr);
new Uint32Array(bin.buffer, bin.byteOffset + linesIdxOffset, linesIdxArr.length).set(linesIdxArr);

// ---------- glTF JSON ----------
// 1 mesh, 1 node, 2 primitives (stars TRIANGLES, lines LINES).
// Use UNSIGNED_INT for indices (positions > 65535 if many stars; safe default).
// Materials: two PBR materials with emissive — stars (warm white) and lines (cyan).

const gltf = {
  asset: { version: '2.0', generator: 'hermes-constellation-builder' },
  scene: 0,
  scenes: [{ name: 'Constellation', nodes: [0] }],
  nodes: [{ name: 'Orion', mesh: 0 }],
  meshes: [{
    name: 'Stars',
    primitives: [
      {
        attributes: { POSITION: 0 },
        indices: 1,
        material: 0,
        mode: 4, // TRIANGLES
      },
      {
        attributes: { POSITION: 0 },
        indices: 2,
        material: 1,
        mode: 1, // LINES
      },
    ],
  }],
  materials: [
    {
      name: 'StarMaterial',
      pbrMetallicRoughness: {
        baseColorFactor: [1.0, 0.95, 0.85, 1.0],
        metallicFactor: 0.0,
        roughnessFactor: 0.4,
      },
      emissiveFactor: [1.0, 0.92, 0.78],
    },
    {
      name: 'LineMaterial',
      pbrMetallicRoughness: {
        baseColorFactor: [0.45, 0.85, 1.0, 1.0],
        metallicFactor: 0.0,
        roughnessFactor: 0.6,
      },
      emissiveFactor: [0.45, 0.85, 1.0],
    },
  ],
  accessors: [
    {
      bufferView: 0, componentType: 5126, count: positionArr.length / 3,
      type: 'VEC3', min: positionArr.length ? min3(positionArr) : [0,0,0],
      max: positionArr.length ? max3(positionArr) : [0,0,0],
    },
    {
      bufferView: 1, componentType: 5125, count: starsIdxArr.length, type: 'SCALAR',
    },
    {
      bufferView: 2, componentType: 5125, count: linesIdxArr.length, type: 'SCALAR',
    },
  ],
  bufferViews: [
    { buffer: 0, byteOffset: posOffset, byteLength: posBytes, target: 34962 },
    { buffer: 0, byteOffset: starsIdxOffset, byteLength: starsIdxBytes, target: 34963 },
    { buffer: 0, byteOffset: linesIdxOffset, byteLength: linesIdxBytes, target: 34963 },
  ],
  buffers: [{ byteLength: totalBin }],
};

function min3(arr) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  for (let i = 0; i < arr.length; i += 3) {
    if (arr[i]   < minX) minX = arr[i];
    if (arr[i+1] < minY) minY = arr[i+1];
    if (arr[i+2] < minZ) minZ = arr[i+2];
  }
  return [minX, minY, minZ];
}
function max3(arr) {
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < arr.length; i += 3) {
    if (arr[i]   > maxX) maxX = arr[i];
    if (arr[i+1] > maxY) maxY = arr[i+1];
    if (arr[i+2] > maxZ) maxZ = arr[i+2];
  }
  return [maxX, maxY, maxZ];
}

// ---------- Assemble .glb ----------
// Header (12) + JSON chunk header (8) + JSON + BIN chunk header (8) + BIN.
// JSON must be padded with spaces (0x20) to 4-byte alignment.
// BIN already padded.

const jsonStr = JSON.stringify(gltf);
let jsonBytes = Buffer.from(jsonStr, 'utf8');
const jsonPadLen = pad4(jsonBytes.length) - jsonBytes.length;
const jsonPad = Buffer.alloc(jsonPadLen, 0x20);
const jsonChunk = Buffer.concat([jsonBytes, jsonPad]);

const totalLength =
  12 +                    // header
  8 + jsonChunk.length +  // JSON chunk
  8 + bin.length;         // BIN chunk

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546C67, 0); // 'glTF' magic
header.writeUInt32LE(2, 4);          // version
header.writeUInt32LE(totalLength, 8);

const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(jsonChunk.length, 0);
jsonHeader.writeUInt32LE(0x4E4F534A, 4); // 'JSON'

const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(bin.length, 0);
binHeader.writeUInt32LE(0x004E4942, 4); // 'BIN\0'

const out = Buffer.concat([header, jsonHeader, jsonChunk, binHeader, Buffer.from(bin)]);

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, out);

console.log(`Wrote ${OUT_PATH} (${out.length} bytes)`);
console.log(`  stars (incl bg): ${STARS.length + BG_STARS.length}, lines: ${LINES.length}`);
console.log(`  positions: ${positionArr.length/3} verts, stars idx: ${starsIdxArr.length}, lines idx: ${linesIdxArr.length}`);
