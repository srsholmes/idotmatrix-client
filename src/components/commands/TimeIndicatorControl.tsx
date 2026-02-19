import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import type { SuccessOutput } from "../../lib/types";

export function TimeIndicatorControl() {
  const { getBaseArgs } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const handleSend = async () => {
    setMessage(null);
    const result = await execute([
      ...getBaseArgs(), "time-indicator", enabled ? "on" : "off",
    ]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Time Indicator</h2>

      <label className="flex items-center gap-3">
        <input
          type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        <span className="text-sm text-gray-300">Enable time indicator</span>
      </label>

      <button
        onClick={handleSend}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Set Time Indicator
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
