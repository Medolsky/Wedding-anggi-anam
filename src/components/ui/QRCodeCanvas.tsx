"use client";

import { useEffect, useRef } from "react";

/**
 * Minimal QR Code generator using Canvas API — fully client-side, no external API.
 * Supports alphanumeric data up to ~50 chars (Version 3, ECC Level M).
 * For wedding guest codes like "ANDI-X3K9".
 */

// QR Code encoding tables
const EC_CODEWORDS_PER_BLOCK: Record<number, number[]> = {
  1: [7, 10, 13, 17],
  2: [10, 16, 22, 28],
  3: [15, 26, 36, 44],
  4: [20, 36, 52, 64],
  5: [26, 48, 72, 88],
};

const NUM_DATA_CODEWORDS: Record<number, number[]> = {
  1: [19, 16, 13, 9],
  2: [34, 28, 22, 16],
  3: [55, 44, 34, 24],
  4: [80, 64, 48, 36],
  5: [108, 86, 62, 46],
};

function getAlphanumericValue(c: string): number {
  if (c >= "0" && c <= "9") return c.charCodeAt(0) - 48;
  if (c >= "A" && c <= "Z") return c.charCodeAt(0) - 55;
  const special = " $%*+-./:";
  const idx = special.indexOf(c);
  if (idx >= 0) return 36 + idx;
  return -1;
}

function encodeAlphanumeric(data: string): number[] {
  const bits: number[] = [];
  for (let i = 0; i < data.length; i += 2) {
    if (i + 1 < data.length) {
      const val = getAlphanumericValue(data[i]) * 45 + getAlphanumericValue(data[i + 1]);
      for (let b = 10; b >= 0; b--) bits.push((val >> b) & 1);
    } else {
      const val = getAlphanumericValue(data[i]);
      for (let b = 5; b >= 0; b--) bits.push((val >> b) & 1);
    }
  }
  return bits;
}

function encodeByte(data: string): number[] {
  const bits: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    for (let b = 7; b >= 0; b--) bits.push((byte >> b) & 1);
  }
  return bits;
}

// GF(256) arithmetic for Reed-Solomon
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen: number[] = new Array(ecLen + 1).fill(0);
  gen[0] = 1;
  for (let i = 0; i < ecLen; i++) {
    for (let j = ecLen; j >= 1; j--) {
      gen[j] = gen[j - 1] ^ gfMul(gen[j], GF_EXP[i]);
    }
    gen[0] = gfMul(gen[0], GF_EXP[i]);
  }

  const msg = new Uint8Array(data.length + ecLen);
  for (let i = 0; i < data.length; i++) msg[i] = data[i];

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j <= ecLen; j++) {
        msg[i + j] ^= gfMul(gen[ecLen - j], coef);
      }
    }
  }

  return Array.from(msg.slice(data.length));
}

function generateQRMatrix(data: string): number[][] {
  const upperData = data.toUpperCase();

  // Check if alphanumeric encoding is possible
  let isAlphanumeric = true;
  for (let i = 0; i < upperData.length; i++) {
    if (getAlphanumericValue(upperData[i]) < 0) {
      isAlphanumeric = false;
      break;
    }
  }

  // Determine version (1-5) based on data length
  const eccLevel = 1; // M level (index 1)
  let version = 1;
  for (let v = 1; v <= 5; v++) {
    const capacity = NUM_DATA_CODEWORDS[v][eccLevel];
    const maxBits = capacity * 8;
    let headerBits: number;
    let dataBits: number;

    if (isAlphanumeric) {
      headerBits = 4 + (v <= 1 ? 9 : 11); // mode + char count
      dataBits = Math.floor(upperData.length / 2) * 11 + (upperData.length % 2 === 1 ? 6 : 0);
    } else {
      headerBits = 4 + (v <= 1 ? 8 : 16); // mode + char count
      dataBits = data.length * 8;
    }

    if (headerBits + dataBits <= maxBits) {
      version = v;
      break;
    }
    if (v === 5) version = 5;
  }

  const size = 17 + version * 4;
  const matrix: number[][] = Array.from({ length: size }, () => new Array(size).fill(-1));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  // Place finder patterns
  function placeFinderPattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r, cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        let val = 0;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          if (r === 0 || r === 6 || c === 0 || c === 6) val = 1;
          else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) val = 1;
        }
        matrix[rr][cc] = val;
        reserved[rr][cc] = true;
      }
    }
  }

  placeFinderPattern(0, 0);
  placeFinderPattern(0, size - 7);
  placeFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  // Dark module
  matrix[size - 8][8] = 1;
  reserved[size - 8][8] = true;

  // Reserve format info areas
  for (let i = 0; i < 9; i++) {
    if (i < size) { reserved[8][i] = true; reserved[i][8] = true; }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 8 + i] = true;
    reserved[size - 8 + i][8] = true;
  }

  // Alignment pattern for version >= 2
  if (version >= 2) {
    const alignPos = [6, version === 2 ? 18 : version === 3 ? 22 : version === 4 ? 26 : 30];
    for (const ar of alignPos) {
      for (const ac of alignPos) {
        if (reserved[ar]?.[ac]) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const rr = ar + r, cc = ac + c;
            if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
            if (reserved[rr][cc]) continue;
            let val = 0;
            if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) val = 1;
            matrix[rr][cc] = val;
            reserved[rr][cc] = true;
          }
        }
      }
    }
  }

  // Encode data
  const bits: number[] = [];
  if (isAlphanumeric) {
    // Mode indicator: Alphanumeric = 0010
    bits.push(0, 0, 1, 0);
    // Character count (9 bits for v1, 11 bits for v2-5)
    const countBits = version <= 1 ? 9 : 11;
    for (let b = countBits - 1; b >= 0; b--) bits.push((upperData.length >> b) & 1);
    bits.push(...encodeAlphanumeric(upperData));
  } else {
    // Mode indicator: Byte = 0100
    bits.push(0, 1, 0, 0);
    const countBits = version <= 1 ? 8 : 16;
    for (let b = countBits - 1; b >= 0; b--) bits.push((data.length >> b) & 1);
    bits.push(...encodeByte(data));
  }

  // Terminator
  const totalDataBits = NUM_DATA_CODEWORDS[version][eccLevel] * 8;
  const terminatorLen = Math.min(4, totalDataBits - bits.length);
  for (let i = 0; i < terminatorLen; i++) bits.push(0);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad bytes
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < totalDataBits) {
    for (let b = 7; b >= 0; b--) bits.push((padBytes[padIdx] >> b) & 1);
    padIdx = (padIdx + 1) % 2;
  }

  // Convert to codewords
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let val = 0;
    for (let b = 0; b < 8; b++) val = (val << 1) | (bits[i + b] || 0);
    codewords.push(val);
  }

  // Reed-Solomon error correction
  const ecCount = EC_CODEWORDS_PER_BLOCK[version][eccLevel];
  const ecCodewords = rsEncode(codewords, ecCount);
  const finalData = [...codewords, ...ecCodewords];

  // Convert final data to bits
  const finalBits: number[] = [];
  for (const cw of finalData) {
    for (let b = 7; b >= 0; b--) finalBits.push((cw >> b) & 1);
  }

  // Place data bits in matrix
  let bitIndex = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // Skip timing pattern column
    const rows = upward ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
    for (const row of rows) {
      for (let c = 0; c < 2; c++) {
        const col = right - c;
        if (col < 0 || col >= size) continue;
        if (reserved[row][col]) continue;
        matrix[row][col] = bitIndex < finalBits.length ? finalBits[bitIndex++] : 0;
      }
    }
    upward = !upward;
  }

  // Apply mask pattern 0 (checkerboard)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        if ((r + c) % 2 === 0) {
          matrix[r][c] ^= 1;
        }
      }
    }
  }

  // Format info for mask 0, ECC M
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Place format info
  // Around top-left finder
  const formatPositionsH = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatPositionsH[i];
    matrix[r][c] = formatBits[i];
  }

  // Around bottom-left and top-right
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = formatBits[i];
  }
  for (let i = 7; i < 15; i++) {
    matrix[8][size - 15 + i] = formatBits[i];
  }

  return matrix;
}

interface QRCodeCanvasProps {
  data: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
}

export function QRCodeCanvas({
  data,
  size = 180,
  className = "",
  fgColor = "#2a2723",
  bgColor = "#ffffff",
}: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const matrix = generateQRMatrix(data);
      const moduleCount = matrix.length;
      const quietZone = 4;
      const totalModules = moduleCount + quietZone * 2;
      const moduleSize = size / totalModules;

      canvas.width = size;
      canvas.height = size;

      // Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);

      // Draw modules
      ctx.fillStyle = fgColor;
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (matrix[r][c] === 1) {
            ctx.fillRect(
              (c + quietZone) * moduleSize,
              (r + quietZone) * moduleSize,
              moduleSize + 0.5,
              moduleSize + 0.5
            );
          }
        }
      }
    } catch {
      // Fallback: draw a simple placeholder
      canvas.width = size;
      canvas.height = size;
      const ctx2 = canvas.getContext("2d");
      if (ctx2) {
        ctx2.fillStyle = bgColor;
        ctx2.fillRect(0, 0, size, size);
        ctx2.fillStyle = fgColor;
        ctx2.font = "12px monospace";
        ctx2.textAlign = "center";
        ctx2.fillText("QR: " + data.substring(0, 15), size / 2, size / 2);
      }
    }
  }, [data, size, fgColor, bgColor]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
