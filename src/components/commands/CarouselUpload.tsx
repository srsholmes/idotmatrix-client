import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import type { SuccessOutput, ProgressOutput } from "../../lib/types";

export function CarouselUpload() {
  const { getBaseArgs, size } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [delay, setDelay] = useState(3000);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressOutput | null>(null);

  const handlePickFiles = async () => {
    const result = await open({
      multiple: true,
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "bmp", "webp"] }],
    });
    if (result && Array.isArray(result)) {
      setFilePaths(result as string[]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (filePaths.length < 2) return;
    setMessage(null);
    setProgress(null);
    const result = await execute(
      [...getBaseArgs(), "carousel", "upload", ...filePaths, "--size", String(size), "-d", String(delay)],
      { onProgress: setProgress },
    );
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
    setProgress(null);
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Carousel Upload</h2>

      <button
        onClick={handlePickFiles}
        className="w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-700 p-8 text-center transition-colors hover:border-gray-500 hover:bg-gray-900"
      >
        <p className="text-gray-400">
          {filePaths.length > 0
            ? `${filePaths.length} images selected`
            : "Click to select images (min. 2)"}
        </p>
      </button>

      {filePaths.length > 0 && (
        <div className="space-y-1">
          {filePaths.map((p, i) => (
            <div key={i} className="text-xs text-gray-400">
              {p.split("/").pop()}
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm text-gray-400">Delay (ms)</label>
        <input
          type="number" value={delay} onChange={(e) => setDelay(Number(e.target.value))}
          className="w-28 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          min={100} max={30000} step={100}
        />
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
        disabled={loading || filePaths.length < 2}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Upload Carousel
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
