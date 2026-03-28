/**
 * Generates a modern QR Reader icon (1024x1024 PNG) using pngjs.
 * Run: node scripts/generate-icon.js
 */
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const SIZE = 1024;
const png = new PNG({ width: SIZE, height: SIZE, colorType: 6 });
png.data.fill(0);

// Colors
const BG      = [10, 14, 39, 255];      // #0A0E27 dark navy
const FG      = [255, 255, 255, 255];   // white
const ACCENT  = [74, 158, 255, 255];    // #4A9EFF blue
const ACCENT2 = [0, 210, 180, 255];     // #00D2B4 teal

function setPixel(x, y, c) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const idx = (SIZE * y + x) * 4;
  png.data[idx]     = c[0];
  png.data[idx + 1] = c[1];
  png.data[idx + 2] = c[2];
  png.data[idx + 3] = c[3] !== undefined ? c[3] : 255;
}

function fillRect(x, y, w, h, c) {
  for (let py = y; py < y + h; py++)
    for (let px = x; px < x + w; px++)
      setPixel(px, py, c);
}

function fillRoundedRect(x, y, w, h, radius, c) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const lx = px - x, ly = py - y;
      let inside;
      if (lx >= radius && lx < w - radius) {
        inside = true;
      } else if (ly >= radius && ly < h - radius) {
        inside = true;
      } else {
        const cx = lx < radius ? radius : w - radius;
        const cy = ly < radius ? radius : h - radius;
        const dx = lx - cx, dy = ly - cy;
        inside = dx * dx + dy * dy <= radius * radius;
      }
      if (inside) setPixel(px, py, c);
    }
  }
}

function fillCircle(cx, cy, r, c) {
  for (let py = cy - r; py <= cy + r; py++)
    for (let px = cx - r; px <= cx + r; px++)
      if ((px - cx) ** 2 + (py - cy) ** 2 <= r * r)
        setPixel(px, py, c);
}

function ringCircle(cx, cy, r, thick, c) {
  for (let py = cy - r - thick; py <= cy + r + thick; py++) {
    for (let px = cx - r - thick; px <= cx + r + thick; px++) {
      const d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      if (d >= r - thick && d <= r + thick) setPixel(px, py, c);
    }
  }
}

function drawLine(x1, y1, x2, y2, thick, c) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len, ny = dx / len;
  const steps = Math.ceil(len * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t, py = y1 + dy * t;
    for (let j = -thick; j <= thick; j++)
      setPixel(Math.round(px + nx * j), Math.round(py + ny * j), c);
  }
}

// Draw QR finder pattern (nested squares)
function drawFinder(x, y, cs, fg, bg) {
  fillRect(x,             y,             cs * 7, cs * 7, fg);
  fillRect(x + cs,        y + cs,        cs * 5, cs * 5, bg);
  fillRect(x + cs * 2,    y + cs * 2,    cs * 3, cs * 3, fg);
}

// ── Background ──────────────────────────────────────────────────
fillRoundedRect(0, 0, SIZE, SIZE, 200, BG);

// ── Subtle gradient overlay (lighter at top) ─────────────────────
for (let y = 0; y < 400; y++) {
  const alpha = Math.round((1 - y / 400) * 30);
  for (let x = 0; x < SIZE; x++) {
    const idx = (SIZE * y + x) * 4;
    const existing = [png.data[idx], png.data[idx+1], png.data[idx+2]];
    if (existing[0] > 0 || existing[1] > 0 || existing[2] > 0) {
      png.data[idx]   = Math.min(255, existing[0] + alpha);
      png.data[idx+1] = Math.min(255, existing[1] + alpha);
      png.data[idx+2] = Math.min(255, existing[2] + alpha + 10);
    }
  }
}

// ── QR Code ─────────────────────────────────────────────────────
const PAD = 95;
const QR = SIZE - 2 * PAD;   // 834
const CS = Math.floor(QR / 21); // ~39px per cell

// Finder patterns
drawFinder(PAD,                      PAD,                      CS, FG, BG);
drawFinder(PAD + QR - 7 * CS,       PAD,                      CS, FG, BG);
drawFinder(PAD,                      PAD + QR - 7 * CS,        CS, FG, BG);

// Timing patterns (row 6 and col 6 between finders)
for (let i = 8; i <= 12; i++) {
  if (i % 2 === 0) {
    fillRect(PAD + i * CS, PAD + 6 * CS, CS, CS, FG);
    fillRect(PAD + 6 * CS, PAD + i * CS, CS, CS, FG);
  }
}

// Alignment pattern (col 16, row 16 — standard QR v2+)
const alX = PAD + 14 * CS, alY = PAD + 14 * CS;
fillRect(alX,          alY,          CS * 5, CS * 5, FG);
fillRect(alX + CS,     alY + CS,     CS * 3, CS * 3, BG);
fillRect(alX + CS * 2, alY + CS * 2, CS,     CS,     FG);

// Data cells — valid data area (col 7-13, rows 0-5 / rows 7-13)
const dataCells = [
  [8,0],[9,1],[10,0],[12,1],[13,0],
  [8,2],[10,3],[11,2],[13,4],[12,3],
  [8,5],[9,4],[11,5],[12,4],
  [7,8],[8,9],[9,8],[11,9],[12,8],[13,10],
  [7,10],[9,11],[10,10],[12,12],[13,11],
  [7,12],[8,12],[10,12],[11,13],[13,12],
  // Right side data
  [14,0],[15,1],[17,0],[19,1],[20,0],
  [14,2],[16,3],[18,2],[20,3],
  [14,4],[15,4],[17,5],[19,4],[20,5],
  [14,8],[16,9],[17,8],[19,9],[20,8],
  [14,10],[15,11],[18,10],[20,11],
  // Bottom data (rows 14-20, cols 7-13)
  [7,14],[9,14],[11,15],[12,14],
  [8,16],[10,16],[12,17],[13,16],
  [7,18],[8,18],[10,19],[11,18],[13,19],[12,20],
  [7,20],[9,20],[11,20],[13,20],
];
for (const [col, row] of dataCells) {
  fillRect(PAD + col * CS + 3, PAD + row * CS + 3, CS - 6, CS - 6, FG);
}

// ── Magnifying Glass (bottom-right) ──────────────────────────────
// Cover underlying QR cells first
const GX = PAD + QR - 185;
const GY = PAD + QR - 185;
const GR = 145;
const GT = 32;

fillCircle(GX, GY, GR + GT + 18, BG);

// Blue teal gradient ring
ringCircle(GX, GY, GR, GT, ACCENT);

// Inner tinted circle
fillCircle(GX, GY, GR - GT - 4, [30, 40, 90, 180]);

// Cross-lines inside glass (scan lines look)
for (let i = -1; i <= 1; i++) {
  const lineY = GY + i * 30;
  for (let px = GX - GR + GT + 10; px <= GX + GR - GT - 10; px++) {
    const alpha = 60 + (i === 0 ? 80 : 0);
    const idx = (SIZE * lineY + px) * 4;
    if (png.data[idx + 3] > 0) {
      png.data[idx]   = Math.min(255, png.data[idx]   + 40);
      png.data[idx+1] = Math.min(255, png.data[idx+1] + 80);
      png.data[idx+2] = Math.min(255, png.data[idx+2] + 120);
    } else {
      setPixel(px, lineY, [74, 120, 200, alpha]);
    }
  }
}

// Handle
const ang = Math.PI / 4;
const hx1 = Math.round(GX + Math.cos(ang) * (GR + GT));
const hy1 = Math.round(GY + Math.sin(ang) * (GR + GT));
const hx2 = Math.round(hx1 + Math.cos(ang) * 130);
const hy2 = Math.round(hy1 + Math.sin(ang) * 130);
// Rounded end cap
fillCircle(hx2, hy2, GT - 4, ACCENT);
drawLine(hx1, hy1, hx2, hy2, GT - 6, ACCENT);

// ── Corner accent brackets (overlay on corners of icon) ───────────
const BR = 60, BW = 18, BL = 110;
// Top-left bracket
fillRect(BR, BR, BL, BW, ACCENT2);
fillRect(BR, BR, BW, BL, ACCENT2);
// Top-right bracket
fillRect(SIZE - BR - BL, BR, BL, BW, ACCENT2);
fillRect(SIZE - BR - BW, BR, BW, BL, ACCENT2);
// Bottom-left bracket
fillRect(BR, SIZE - BR - BW, BL, BW, ACCENT2);
fillRect(BR, SIZE - BR - BL, BW, BL, ACCENT2);
// Bottom-right bracket
fillRect(SIZE - BR - BL, SIZE - BR - BW, BL, BW, ACCENT2);
fillRect(SIZE - BR - BW, SIZE - BR - BL, BW, BL, ACCENT2);

// ── Write output ─────────────────────────────────────────────────
const assetsDir = path.join(__dirname, '..', 'assets');
const buffer = PNG.sync.write(png);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), buffer);
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), buffer);
console.log('✓ Icon generated: assets/icon.png + assets/splash-icon.png');
