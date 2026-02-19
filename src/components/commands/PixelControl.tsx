import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import { ColorInput } from "../shared/ColorInput";
import type { SuccessOutput } from "../../lib/types";

export function PixelControl() {
  const { getBaseArgs, size } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [color, setColor] = useState("00ff00");
  const [message, setMessage] = useState<string | null>(null);

  const handleSend = async () => {
    setMessage(null);
    const result = await execute([
      ...getBaseArgs(), "pixel", String(x), String(y), color,
    ]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Single Pixel</h2>

      <div className="flex gap-3">
        <div>
          <label className="mb-1 block text-sm text-gray-400">X</label>
          <input
            type="number" value={x} onChange={(e) => setX(Number(e.target.value))}
            className="w-20 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
            min={0} max={size - 1}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">Y</label>
          <input
            type="number" value={y} onChange={(e) => setY(Number(e.target.value))}
            className="w-20 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
            min={0} max={size - 1}
          />
        </div>
      </div>

      <ColorInput value={color} onChange={setColor} label="Color" />

      <button
        onClick={handleSend}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Set Pixel
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
