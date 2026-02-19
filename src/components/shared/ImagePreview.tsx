interface ImagePreviewProps {
  base64: string;
  width: number;
  height: number;
  format?: string;
}

export function ImagePreview({
  base64,
  width,
  height,
  format = "gif",
}: ImagePreviewProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={`data:image/${format};base64,${base64}`}
        alt="Preview"
        width={width * 8}
        height={height * 8}
        className="rounded border border-gray-700"
        style={{ imageRendering: "pixelated" }}
      />
      <span className="text-xs text-gray-500">
        {width}x{height} preview
      </span>
    </div>
  );
}
