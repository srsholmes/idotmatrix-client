import { useState, useRef, useCallback, useEffect } from "react";
import { writeFile } from "@tauri-apps/plugin-fs";
import { tempDir } from "@tauri-apps/api/path";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import { ColorInput } from "../shared/ColorInput";
import type { SuccessOutput, ProgressOutput } from "../../lib/types";

type Tool = "pencil" | "eraser" | "fill";

export function CanvasDrawing() {
  const { getBaseArgs, size } = useDevice();
  const { loading, error, execute } = useSidecar();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("ff0000");
  const [pixels, setPixels] = useState<string[]>(() =>
    Array(size * size).fill("000000"),
  );
  const [drawing, setDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressOutput | null>(null);

  const pixelSize = Math.max(4, Math.min(12, Math.floor(512 / size)));
  const canvasSize = size * pixelSize;

  // Re-init pixels when size changes
  useEffect(() => {
    setPixels(Array(size * size).fill("000000"));
  }, [size]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const c = pixels[y * size + x]!;
        ctx.fillStyle = `#${c}`;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

    if (showGrid && pixelSize > 3) {
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= size; i++) {
        ctx.beginPath();
        ctx.moveTo(i * pixelSize, 0);
        ctx.lineTo(i * pixelSize, canvasSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * pixelSize);
        ctx.lineTo(canvasSize, i * pixelSize);
        ctx.stroke();
      }
    }
  }, [pixels, size, pixelSize, canvasSize, showGrid]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getPixelCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    if (x < 0 || x >= size || y < 0 || y >= size) return null;
    return { x, y };
  };

  const setPixel = (x: number, y: number) => {
    setPixels((prev) => {
      const next = [...prev];
      next[y * size + x] = tool === "eraser" ? "000000" : color;
      return next;
    });
  };

  const floodFill = (startX: number, startY: number) => {
    setPixels((prev) => {
      const next = [...prev];
      const targetColor = next[startY * size + startX]!;
      const fillColor = color;
      if (targetColor === fillColor) return prev;

      const stack = [{ x: startX, y: startY }];
      while (stack.length > 0) {
        const { x, y } = stack.pop()!;
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        if (next[y * size + x] !== targetColor) continue;
        next[y * size + x] = fillColor;
        stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
      }
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e);
    if (!coords) return;
    if (tool === "fill") {
      floodFill(coords.x, coords.y);
    } else {
      setDrawing(true);
      setPixel(coords.x, coords.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const coords = getPixelCoords(e);
    if (coords) setPixel(coords.x, coords.y);
  };

  const handleMouseUp = () => setDrawing(false);

  const handleClear = () => {
    setPixels(Array(size * size).fill("000000"));
  };

  const handleUpload = async () => {
    // Create a temporary canvas at device resolution
    const offscreen = document.createElement("canvas");
    offscreen.width = size;
    offscreen.height = size;
    const ctx = offscreen.getContext("2d")!;
    const imageData = ctx.createImageData(size, size);

    for (let i = 0; i < pixels.length; i++) {
      const hex = pixels[i]!;
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      imageData.data[i * 4] = r;
      imageData.data[i * 4 + 1] = g;
      imageData.data[i * 4 + 2] = b;
      imageData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    // Export as PNG blob and write to temp file
    const blob = await new Promise<Blob>((resolve) =>
      offscreen.toBlob((b) => resolve(b!), "image/png"),
    );
    const arrayBuffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Write to temp file using Tauri's temp directory
    const tmpDir = await tempDir();
    const tempPath = `${tmpDir}idm-canvas-${Date.now()}.png`;
    await writeFile(tempPath, uint8);

    setMessage(null);
    setProgress(null);
    const result = await execute(
      [...getBaseArgs(), "image", "upload", tempPath, "--size", String(size), "--raw"],
      { onProgress: setProgress },
    );
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
    setProgress(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Canvas Drawing</h2>

      <div className="flex gap-4">
        <div>
          <div className="mb-2 flex gap-1">
            {(["pencil", "eraser", "fill"] as Tool[]).map((t) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className={`rounded px-3 py-1 text-sm capitalize ${
                  tool === t ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {t}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="rounded bg-gray-700 px-3 py-1 text-sm text-gray-300 hover:bg-gray-600"
            >
              Clear
            </button>
            <label className="flex items-center gap-1.5 text-sm text-gray-400">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              Grid
            </label>
          </div>

          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair rounded border border-gray-700"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        <div className="space-y-3">
          <ColorInput value={color} onChange={setColor} label="Color" />
          <div
            className="h-10 w-10 rounded border border-gray-700"
            style={{ backgroundColor: `#${color}` }}
          />
        </div>
      </div>

      {progress && (
        <div className="text-sm text-blue-400">
          {progress.stage === "uploading" && progress.chunk && progress.total_chunks
            ? `Uploading chunk ${progress.chunk}/${progress.total_chunks}...`
            : progress.message || progress.stage}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Upload to Device
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
