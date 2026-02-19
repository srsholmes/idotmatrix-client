import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import { ColorInput } from "../shared/ColorInput";
import type { SuccessOutput } from "../../lib/types";

export function ColorPicker() {
  const { getBaseArgs } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [color, setColor] = useState("ff0000");
  const [message, setMessage] = useState<string | null>(null);

  const handleSend = async () => {
    setMessage(null);
    const result = await execute([...getBaseArgs(), "color", color]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Fullscreen Color</h2>

      <ColorInput value={color} onChange={setColor} label="Color" />

      <div
        className="h-20 w-20 rounded border border-gray-700"
        style={{ backgroundColor: `#${color}` }}
      />

      <button
        onClick={handleSend}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
      >
        Set Color
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
