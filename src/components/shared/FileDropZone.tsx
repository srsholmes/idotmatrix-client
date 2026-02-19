import { open } from "@tauri-apps/plugin-dialog";

interface FileDropZoneProps {
  onFileSelected: (path: string) => void;
  accept?: string;
  label?: string;
}

export function FileDropZone({
  onFileSelected,
  accept,
  label = "Click to select file",
}: FileDropZoneProps) {
  const handleClick = async () => {
    const filters = accept
      ? [{ name: "Files", extensions: accept.split(",").map((s) => s.trim()) }]
      : [];

    const result = await open({
      multiple: false,
      filters,
    });

    if (result) {
      onFileSelected(result);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-700 p-8 text-center transition-colors hover:border-gray-500 hover:bg-gray-900"
    >
      <p className="text-gray-400">{label}</p>
    </button>
  );
}
