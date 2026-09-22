"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

/**
 * QR Code Canvas component using the proven `qrcode` library.
 * - Supports all QR versions (1-40), auto-selects the best version
 * - Automatic mask pattern selection (evaluates all 8 patterns)
 * - ECC Level H (30% error correction) for maximum scan reliability
 * - Handles any UTF-8 string data (names, URLs, etc.)
 * - Guaranteed scannable by all QR readers
 */

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

    QRCode.toCanvas(
      canvas,
      data,
      {
        width: size,
        margin: 3,
        errorCorrectionLevel: "H", // Highest ECC — 30% error correction, tahan blur/sudut miring
        color: {
          dark: fgColor,
          light: bgColor,
        },
      },
      (error) => {
        if (error) {
          // Fallback: draw a simple placeholder text
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = size;
            canvas.height = size;
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = fgColor;
            ctx.font = "12px monospace";
            ctx.textAlign = "center";
            ctx.fillText("QR Error", size / 2, size / 2 - 8);
            ctx.fillText(data.substring(0, 20), size / 2, size / 2 + 8);
          }
          console.error("QRCode generation error:", error);
        }
      }
    );
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
