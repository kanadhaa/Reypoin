import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function createPng(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines with basic pattern
  const rawScanlines = [];
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0; // filter type 0 (none)
    for (let x = 0; x < width; x++) {
      const idx = 1 + x * 3;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Indigo gradient / badge circle
      if (dist < radius) {
        // Inner badge: Gold/white star/shield look
        if (dist < radius * 0.65) {
          row[idx] = 245;     // R (Gold/Warm White)
          row[idx + 1] = 197; // G
          row[idx + 2] = 24;  // B
        } else {
          row[idx] = 79;      // R (Indigo)
          row[idx + 1] = 70;  // G
          row[idx + 2] = 229; // B
        }
      } else {
        // Background
        row[idx] = r;
        row[idx + 1] = g;
        row[idx + 2] = b;
      }
    }
    rawScanlines.push(row);
  }

  const uncompressedData = Buffer.concat(rawScanlines);
  const compressedData = zlib.deflateSync(uncompressedData);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate PNGs
const pwa192 = createPng(192, 192, 248, 250, 252);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

const pwa512 = createPng(512, 512, 248, 250, 252);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

const pwaMaskable = createPng(512, 512, 79, 70, 229);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);

const appleTouch = createPng(180, 180, 79, 70, 229);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

console.log('PNG assets generated successfully in /public');
