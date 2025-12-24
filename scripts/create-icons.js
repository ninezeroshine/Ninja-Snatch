// Simple script to create placeholder icons using pure Node.js
// Creates minimal valid PNG files for Chrome extension

const fs = require('fs');
const path = require('path');

// Ninja emoji as base64 PNG (pre-generated minimal icons)
// These are placeholder icons - in production, use proper graphic design tools

const sizes = [16, 32, 48, 128];

// Create a minimal PNG file signature with IHDR and IEND chunks
function createMinimalPNG(width, height) {
    // PNG signature
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);  // Width
    ihdrData.writeUInt32BE(height, 4); // Height
    ihdrData.writeUInt8(8, 8);         // Bit depth
    ihdrData.writeUInt8(6, 9);         // Color type (RGBA)
    ihdrData.writeUInt8(0, 10);        // Compression method
    ihdrData.writeUInt8(0, 11);        // Filter method
    ihdrData.writeUInt8(0, 12);        // Interlace method

    // CRC32 function
    function crc32(buf) {
        let crc = 0xFFFFFFFF;
        const table = [];
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let k = 0; k < 8; k++) {
                c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            }
            table[i] = c;
        }
        for (let i = 0; i < buf.length; i++) {
            crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    function makeChunk(type, data) {
        const typeAndData = Buffer.concat([Buffer.from(type), data]);
        const lengthBuf = Buffer.alloc(4);
        lengthBuf.writeUInt32BE(data.length, 0);
        const crcBuf = Buffer.alloc(4);
        crcBuf.writeUInt32BE(crc32(typeAndData), 0);
        return Buffer.concat([lengthBuf, typeAndData, crcBuf]);
    }

    // Create image data (RGBA with dark background and simple ninja icon)
    const zlib = require('zlib');
    const rawData = [];
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const radius = Math.floor(Math.min(width, height) * 0.4);

    for (let y = 0; y < height; y++) {
        rawData.push(0); // Filter byte
        for (let x = 0; x < width; x++) {
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            if (dist < radius) {
                // Dark circle (ninja theme)
                rawData.push(30, 30, 35, 255);
            } else {
                // Transparent
                rawData.push(0, 0, 0, 0);
            }
        }
    }

    // Add simple "eyes" in the middle
    const eyeY = Math.floor(height * 0.4);
    const eyeSpacing = Math.floor(width * 0.15);

    const idatData = zlib.deflateSync(Buffer.from(rawData));

    const ihdrChunk = makeChunk('IHDR', ihdrData);
    const idatChunk = makeChunk('IDAT', idatData);
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Create icons
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

sizes.forEach(size => {
    const png = createMinimalPNG(size, size);
    const filename = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(filename, png);
    console.log(`Created ${filename} (${png.length} bytes)`);
});

console.log('Done! Icons created successfully.');
