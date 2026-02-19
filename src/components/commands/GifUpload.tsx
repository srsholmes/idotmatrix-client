import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import { ImagePreview } from "../shared/ImagePreview";
import type { PreviewOutput, SuccessOutput, ProgressOutput } from "../../lib/types";

export function GifUpload() {
  const { getBaseArgs, size } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewOutput | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressOutput | null>(null);

  const handlePickFile = async () => {
    const result = await open({
      filters: [{ name: "GIF", extensions: ["gif"] }],
    });
    if (result) {
      setFilePath(result as string);
      setPreview(null);
      setMessage(null);
      const prev = await execute(["gif", "preview", result as string, "--size", String(size)]);
      if (prev && "preview" in prev) {
        setPreview(prev as PreviewOutput);
      }
    }
  };

  const handleUpload = async () => {
    if (!filePath) return;
    setMessage(null);
    setProgress(null);
    const result = await execute(
      [...getBaseArgs(), "gif", "upload", filePath, "--size", String(size)],
      { onProgress: setProgress },
    );
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
    setProgress(null);
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">GIF Upload</h2>

      <button
        onClick={handlePickFile}
        className="w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-700 p-8 text-center transition-colors hover:border-gray-500 hover:bg-gray-900"
      >
        <p className="text-gray-400">
          {filePath ? filePath.split("/").pop() : "Click to select a GIF"}
        </p>
      </button>

      {preview && (
        <ImagePreview
          base64={preview.preview}
          width={preview.width}
          height={preview.height}
          format={preview.format}
        />
      )}

      {progress && (
        <div className="text-sm text-blue-400">
          {progress.stage === "uploading" && progress.chunk && progress.total_chunks
            ? `Uploading chunk ${progress.chunk}/${progress.total_chunks}...`
            : progress.message || progress.stage}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading || !filePath}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Upload to Device
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
