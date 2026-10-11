const fs = require('fs');
const zlib = require('zlib');

// 1. Lire le PNG actuel
const buf = fs.readFileSync('assets/logos/france_tv.png');

let offset = 8;
const idatChunks = [];
while (offset < buf.length) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IDAT') idatChunks.push(buf.subarray(offset + 8, offset + 8 + len));
  offset += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idatChunks));

const width = 100, height = 100, bpp = 3;
const pixels = Buffer.alloc(width * height * bpp);

let rawOffset = 0;
for (let y = 0; y < height; y++) {
  const filter = raw[rawOffset++];
  for (let x = 0; x < width * bpp; x++) {
    const val = raw[rawOffset++];
    let prevLeft = (x >= bpp) ? pixels[y * width * bpp + x - bpp] : 0;
    let prevUp = (y > 0) ? pixels[(y - 1) * width * bpp + x] : 0;
    let prevUpLeft = (y > 0 && x >= bpp) ? pixels[(y - 1) * width * bpp + x - bpp] : 0;

    let res = 0;
    if (filter === 0) res = val;
    else if (filter === 1) res = (val + prevLeft) & 0xff;
    else if (filter === 2) res = (val + prevUp) & 0xff;
    else if (filter === 3) res = (val + Math.floor((prevLeft + prevUp) / 2)) & 0xff;
    else if (filter === 4) {
      const p = prevLeft + prevUp - prevUpLeft;
      const pa = Math.abs(p - prevLeft);
      const pb = Math.abs(p - prevUp);
      const pc = Math.abs(p - prevUpLeft);
      let pr = 0;
      if (pa <= pb && pa <= pc) pr = prevLeft;
      else if (pb <= pc) pr = prevUp;
      else pr = prevUpLeft;
      res = (val + pr) & 0xff;
    }
    pixels[y * width * bpp + x] = res;
  }
}

// 2. Extraire les pixels du logo france.tv (y de 25 à 60)
// Fond officiel france.tv : R=23, G=33, B=40 (#172128)
const bgR = 23, bgG = 33, bgB = 40;

// Nouveau buffer 100x100 initialisé avec le fond sombre uniforme
const cleanPixels = Buffer.alloc(width * height * bpp);
for (let i = 0; i < width * height; i++) {
  cleanPixels[i * bpp] = bgR;
  cleanPixels[i * bpp + 1] = bgG;
  cleanPixels[i * bpp + 2] = bgB;
}

// Le logo original allait de minY=34 à maxY=47 (hauteur 14px, centre à 40.5)
// Pour le centrer parfaitement à 49.5 dans 100px, on le décale de +9px en Y
const shiftY = 9;

for (let y = 30; y <= 55; y++) {
  for (let x = 10; x <= 90; x++) {
    const srcIdx = (y * width + x) * bpp;
    const r = pixels[srcIdx];
    const g = pixels[srcIdx + 1];
    const b = pixels[srcIdx + 2];

    const targetY = y + shiftY;
    if (targetY >= 0 && targetY < height) {
      const tgtIdx = (targetY * width + x) * bpp;
      cleanPixels[tgtIdx] = r;
      cleanPixels[tgtIdx + 1] = g;
      cleanPixels[tgtIdx + 2] = b;
    }
  }
}

// 3. Encoder en PNG non filtré (filter 0)
const scanlineLen = 1 + width * bpp;
const uncompressed = Buffer.alloc(height * scanlineLen);
for (let y = 0; y < height; y++) {
  uncompressed[y * scanlineLen] = 0; // Filter None
  cleanPixels.copy(uncompressed, y * scanlineLen + 1, y * width * bpp, (y + 1) * width * bpp);
}

const compressed = zlib.deflateSync(uncompressed, { level: 9 });

// CRC32 helper
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(width, 0);
ihdrData.writeUInt32BE(height, 4);
ihdrData[8] = 8; // bit depth
ihdrData[9] = 2; // RGB
ihdrData[10] = 0; // compression
ihdrData[11] = 0; // filter
ihdrData[12] = 0; // interlace

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const newPng = Buffer.concat([
  pngSignature,
  makeChunk('IHDR', ihdrData),
  makeChunk('IDAT', compressed),
  makeChunk('IEND', Buffer.alloc(0))
]);

fs.writeFileSync('assets/logos/france_tv.png', newPng);
console.log('✅ assets/logos/france_tv.png nettoyé et centré avec succès ! (taille :', newPng.length, 'octets)');
