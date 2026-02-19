import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import type { SuccessOutput } from "../../lib/types";

export function CountdownControl() {
  const { getBaseArgs } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const sendAction = async (action: string) => {
    setMessage(null);
    const result = await execute([
      ...getBaseArgs(), "countdown", action, "-m", String(minutes), "-s", String(seconds),
    ]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Countdown</h2>

      <div className="flex gap-3">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Minutes</label>
          <input
            type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-20 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
            min={0} max={99}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">Seconds</label>
          <input
            type="number" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))}
            className="w-20 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
            min={0} max={59}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["start", "pause", "restart", "disable"].map((action) => (
          <button
            key={action}
            onClick={() => sendAction(action)}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium capitalize text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {action}
          </button>
        ))}
      </div>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
