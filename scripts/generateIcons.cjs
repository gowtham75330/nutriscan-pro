const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.resolve(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, body, crcBuf]);
}

function createPng(width, height, pixelFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatCompressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatCompressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function sdRoundedBox(px, py, bx, by, r) {
  const qx = Math.abs(px) - bx + r;
  const qy = Math.abs(py) - by + r;
  return Math.min(Math.max(qx, qy), 0.0) + Math.hypot(Math.max(qx, 0.0), Math.max(qy, 0.0)) - r;
}

function renderNutriScanIcon(isMaskable) {
  return (x, y, size) => {
    const cx = size / 2;
    const cy = size / 2;
    const nx = (x - cx) / (size / 2);
    const ny = (y - cy) / (size / 2);

    const tGrad = clamp((nx * 0.5 + ny * 0.8 + 1) / 2, 0, 1);
    const bgR = Math.round(lerp(22, 16, tGrad));
    const bgG = Math.round(lerp(185, 120, tGrad));
    const bgB = Math.round(lerp(90, 110, tGrad));

    if (isMaskable) {
      return renderEmblem(nx, ny, 0.75, bgR, bgG, bgB, 255);
    } else {
      const boxSize = 0.86;
      const cornerRadius = 0.28;
      const d = sdRoundedBox(nx, ny, boxSize, boxSize, cornerRadius);
      const pixelDist = 2.0 / size;
      const alpha = clamp((-d) / pixelDist, 0, 1);

      if (alpha <= 0) {
        const shadowD = sdRoundedBox(nx, ny - 0.04, boxSize, boxSize, cornerRadius);
        const shadowAlpha = clamp((-shadowD) / (pixelDist * 6), 0, 0.22);
        return [16, 35, 20, Math.round(shadowAlpha * 255)];
      }

      return renderEmblem(nx, ny, 0.85, bgR, bgG, bgB, Math.round(alpha * 255));
    }
  };
}

function renderEmblem(nx, ny, scale, bgR, bgG, bgB, baseAlpha) {
  const px = nx / scale;
  const py = ny / scale;

  const rDist = Math.hypot(px, py);
  const glow = clamp(1 - rDist * 1.1, 0, 1) * 0.18;
  let curR = clamp(bgR + glow * 255, 0, 255);
  let curG = clamp(bgG + glow * 255, 0, 255);
  let curB = clamp(bgB + glow * 255, 0, 255);

  const plateDist = Math.abs(rDist - 0.72);
  if (plateDist < 0.035) {
    const ringAlpha = clamp(1 - plateDist / 0.035, 0, 1) * 0.25;
    curR = lerp(curR, 255, ringAlpha);
    curG = lerp(curG, 255, ringAlpha);
    curB = lerp(curB, 255, ringAlpha);
  }

  // Fork
  let forkAlpha = 0;
  const forkX = px + 0.25;
  const forkY = py;
  if (Math.abs(forkX) < 0.038 && forkY >= -0.05 && forkY <= 0.52) forkAlpha = 1;
  if (Math.abs(forkX) < 0.12 && forkY >= -0.16 && forkY <= -0.05) forkAlpha = 1;
  if (forkY >= -0.48 && forkY <= -0.15) {
    if (Math.abs(forkX + 0.08) < 0.024 || Math.abs(forkX) < 0.024 || Math.abs(forkX - 0.08) < 0.024) forkAlpha = 1;
  }

  // Knife
  let knifeAlpha = 0;
  const knifeX = px - 0.25;
  const knifeY = py;
  if (Math.abs(knifeX) < 0.038 && knifeY >= -0.05 && knifeY <= 0.52) knifeAlpha = 1;
  if (knifeX >= -0.04 && knifeX <= 0.09 && knifeY >= -0.48 && knifeY <= -0.05) {
    const bladeT = (knifeY - (-0.48)) / 0.43;
    const maxW = 0.09 * (1 - Math.pow(1 - bladeT, 3));
    if (knifeX <= maxW) knifeAlpha = 1;
  }

  // Leaves
  let leafAlpha = 0;
  const leaf1D = Math.hypot((px + 0.04) * 1.6, (py + 0.15) * 1.2);
  const leaf2D = Math.hypot((px - 0.04) * 1.6, (py + 0.15) * 1.2);
  if (leaf1D < 0.13 || leaf2D < 0.13) {
    if (py <= -0.05 && py >= -0.32) leafAlpha = 0.95;
  }

  // Heart
  let heartAlpha = 0;
  const hx = px * 2.8;
  const hy = (py - 0.1) * -2.8;
  const hEq = Math.pow(hx * hx + hy * hy - 0.6, 3) - hx * hx * Math.pow(hy, 3);
  if (hEq <= 0) heartAlpha = 1;

  const emblemWhite = Math.max(forkAlpha, knifeAlpha, leafAlpha);
  if (emblemWhite > 0) {
    curR = lerp(curR, 255, emblemWhite);
    curG = lerp(curG, 255, emblemWhite);
    curB = lerp(curB, 255, emblemWhite);
  }

  if (heartAlpha > 0 && emblemWhite === 0) {
    curR = lerp(curR, 245, heartAlpha);
    curG = lerp(curG, 130, heartAlpha);
    curB = lerp(curB, 32, heartAlpha);
  }

  return [Math.round(curR), Math.round(curG), Math.round(curB), baseAlpha];
}

const targets = [
  { name: 'icon-192x192.png', size: 192, maskable: false },
  { name: 'icon-192x192-maskable.png', size: 192, maskable: true },
  { name: 'icon-512x512.png', size: 512, maskable: false },
  { name: 'icon-512x512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const t of targets) {
  const destPath = path.join(iconsDir, t.name);
  const pngBuf = createPng(t.size, t.size, renderNutriScanIcon(t.maskable));
  fs.writeFileSync(destPath, pngBuf);
  console.log(`Generated ${t.name} (${pngBuf.length} bytes)`);
}

