const fs = require('fs');
const zlib = require('zlib');

// 1. Copier sooner.png et shadowz.png
fs.copyFileSync('scratch/sooner.png', 'assets/logos/sooner.png');
fs.copyFileSync('scratch/shadowz.png', 'assets/logos/shadowz.png');
console.log('✅ sooner.png et shadowz.png copiés dans assets/logos/');

// 2. Nettoyer insomnia.png (retirer bandeau Prime Video et centrer le logo)
const buf = fs.readFileSync('scratch/insomnia.png');

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

// Le fond est noir (0, 0, 0)
// On crée une image 100x100 noire uniforme
const cleanPixels = Buffer.alloc(width * height * bpp, 0);

// Le logo original allait de minY=30 à maxY=44 (hauteur 15px, centre à 37)
// Pour le centrer à 49.5 dans 100px, on décale de +13px en Y
const shiftY = 13;

for (let y = 20; y <= 55; y++) {
  for (let x = 0; x < width; x++) {
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

const scanlineLen = 1 + width * bpp;
const uncompressed = Buffer.alloc(height * scanlineLen);
for (let y = 0; y < height; y++) {
  uncompressed[y * scanlineLen] = 0; // Filter None
  cleanPixels.copy(uncompressed, y * scanlineLen + 1, y * width * bpp, (y + 1) * width * bpp);
}

const compressed = zlib.deflateSync(uncompressed, { level: 9 });

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
ihdrData[8] = 8;
ihdrData[9] = 2;
ihdrData[10] = 0;
ihdrData[11] = 0;
ihdrData[12] = 0;

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const newPng = Buffer.concat([
  pngSignature,
  makeChunk('IHDR', ihdrData),
  makeChunk('IDAT', compressed),
  makeChunk('IEND', Buffer.alloc(0))
]);

fs.writeFileSync('assets/logos/insomnia.png', newPng);
console.log('✅ assets/logos/insomnia.png nettoyé et centré avec succès !');
