import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import { SliderInput } from "../shared/SliderInput";
import type { SuccessOutput } from "../../lib/types";

export function SpeedControl() {
  const { getBaseArgs } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [speed, setSpeed] = useState(128);
  const [message, setMessage] = useState<string | null>(null);

  const handleSend = async () => {
    setMessage(null);
    const result = await execute([...getBaseArgs(), "speed", String(speed)]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Speed</h2>

      <SliderInput label="Speed" value={speed} onChange={setSpeed} min={0} max={255} />

      <button
        onClick={handleSend}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Set Speed
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
