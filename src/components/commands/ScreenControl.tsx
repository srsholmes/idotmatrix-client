import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import { SliderInput } from "../shared/SliderInput";
import type { SuccessOutput } from "../../lib/types";

export function ScreenControl() {
  const { getBaseArgs, busy } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [brightness, setBrightness] = useState(50);
  const [message, setMessage] = useState<string | null>(null);

  const sendCommand = async (args: string[]) => {
    setMessage(null);
    const result = await execute([...getBaseArgs(), "screen", ...args]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  const disabled = loading || busy;

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Screen Control</h2>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => sendCommand(["on"])}
          disabled={disabled}
          className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
        >
          On
        </button>
        <button
          onClick={() => sendCommand(["off"])}
          disabled={disabled}
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          Off
        </button>
        <button
          onClick={() => sendCommand(["flip", "on"])}
          disabled={disabled}
          className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 disabled:opacity-50"
        >
          Flip On
        </button>
        <button
          onClick={() => sendCommand(["flip", "off"])}
          disabled={disabled}
          className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 disabled:opacity-50"
        >
          Flip Off
        </button>
        <button
          onClick={() => sendCommand(["freeze"])}
          disabled={disabled}
          className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 disabled:opacity-50"
        >
          Freeze
        </button>
      </div>

      <div className="space-y-2">
        <SliderInput
          label="Brightness"
          value={brightness}
          onChange={setBrightness}
          min={5}
          max={100}
        />
        <button
          onClick={() => sendCommand(["brightness", String(brightness)])}
          disabled={disabled}
          className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          Set Brightness
        </button>
      </div>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
