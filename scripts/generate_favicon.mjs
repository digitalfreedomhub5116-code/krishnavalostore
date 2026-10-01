import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to generate an uncompressed/deflated raw PNG file
function createPng(width, height, drawFn) {
  // RGBA buffer
  const rowSize = width * 4;
  const rawData = Buffer.alloc((1 + rowSize) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + rowSize);
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // Compress IDAT data
  const compressed = zlib.deflateSync(rawData);

  // CRC32 calculation
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcBuf = Buffer.alloc(4 + len);
    crcBuf.write(type, 0, 4, 'ascii');
    data.copy(crcBuf, 4);
    buf.writeUInt32BE(crc32(crcBuf), 8 + len);
    return buf;
  }

  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw a stylized gaming "KV" emblem
function drawKvIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background: dark squircle #020617 with subtle border #ff4655
  const cornerR = 0.22;
  const cx = Math.abs(nx - 0.5);
  const cy = Math.abs(ny - 0.5);
  const maxCorner = 0.5 - cornerR;

  // Rounded corner mask
  let inside = true;
  if (cx > maxCorner && cy > maxCorner) {
    const dist = Math.hypot(cx - maxCorner, cy - maxCorner);
    if (dist > cornerR) inside = false;
  }
  if (!inside) return [0, 0, 0, 0]; // Transparent outside

  // Border check
  const borderThickness = 2 / w;
  let isBorder = false;
  if (cx > 0.48 - borderThickness || cy > 0.48 - borderThickness) {
    isBorder = true;
  }

  // Base background color #0f172a / #020617
  let r = 15, g = 23, b = 42, a = 255;
  if (isBorder) {
    return [255, 70, 85, 230]; // Valorant red border
  }

  // Draw "K"
  // Vertical stem of K: x between 0.20 and 0.30, y between 0.24 and 0.76
  if (nx >= 0.20 && nx <= 0.30 && ny >= 0.24 && ny <= 0.76) {
    return [255, 255, 255, 255]; // White stem
  }
  // Upper diagonal of K: from (0.30, 0.50) to (0.50, 0.24)
  const kTopLine = (ny - 0.50) + (nx - 0.30) * 1.3;
  if (nx >= 0.28 && nx <= 0.52 && ny >= 0.24 && ny <= 0.52 && Math.abs(kTopLine) < 0.08) {
    return [255, 255, 255, 255];
  }
  // Lower diagonal of K: from (0.30, 0.50) to (0.52, 0.76)
  const kBotLine = (ny - 0.50) - (nx - 0.30) * 1.2;
  if (nx >= 0.28 && nx <= 0.54 && ny >= 0.48 && ny <= 0.76 && Math.abs(kBotLine) < 0.08) {
    return [255, 70, 85, 255]; // Red lower diagonal
  }

  // Draw "V"
  // Left arm of V: from (0.52, 0.24) to (0.68, 0.76)
  const vLeft = (ny - 0.24) - (nx - 0.52) * 3.25;
  if (nx >= 0.50 && nx <= 0.72 && ny >= 0.24 && ny <= 0.76 && Math.abs(vLeft) < 0.16) {
    return [255, 255, 255, 255];
  }
  // Right arm of V: from (0.84, 0.24) to (0.68, 0.76)
  const vRight = (ny - 0.24) + (nx - 0.84) * 3.25;
  if (nx >= 0.66 && nx <= 0.88 && ny >= 0.24 && ny <= 0.76 && Math.abs(vRight) < 0.18) {
    return [255, 70, 85, 255]; // Valorant Red right wedge
  }

  // Cyan glowing dot at bottom center
  const dotDist = Math.hypot(nx - 0.5, ny - 0.84);
  if (dotDist < 0.025) {
    return [0, 240, 255, 255];
  }

  return [r, g, b, a];
}

// Build ICO containing a 48x48 PNG (modern standard supported by all browsers and Google)
function createIcoFromPng(pngBuffer, width, height) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // Count = 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(width >= 256 ? 0 : width, 0);
  dirEntry.writeUInt8(height >= 256 ? 0 : height, 1);
  dirEntry.writeUInt8(0, 2); // Color palette
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // Image data size
  dirEntry.writeUInt32LE(22, 12); // Offset of image data (6 header + 16 entry = 22)

  return Buffer.concat([icoHeader, dirEntry, pngBuffer]);
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 48x48 PNG (Exact standard requested by Google Search Favicon Guidelines: multiple of 48px)
const png48 = createPng(48, 48, drawKvIcon);
fs.writeFileSync(path.join(outDir, 'favicon-48x48.png'), png48);

// 192x192 PNG (for high-res and PWA / Android)
const png192 = createPng(192, 192, drawKvIcon);
fs.writeFileSync(path.join(outDir, 'favicon.png'), png192);
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), png192);

// ICO wrapping the 48x48 PNG
const ico = createIcoFromPng(png48, 48, 48);
fs.writeFileSync(path.join(outDir, 'favicon.ico'), ico);

console.log('Successfully generated favicon.ico, favicon.png, favicon-48x48.png, and apple-touch-icon.png in public/!');
