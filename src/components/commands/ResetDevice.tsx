import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import type { SuccessOutput } from "../../lib/types";

export function ResetDevice() {
  const { getBaseArgs } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleReset = async () => {
    if (!confirmed) return;
    setMessage(null);
    const result = await execute([...getBaseArgs(), "reset"]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
    setConfirmed(false);
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Reset Device</h2>

      <p className="text-sm text-gray-400">
        This will reset the device to factory defaults. This action cannot be undone.
      </p>

      <label className="flex items-center gap-3">
        <input
          type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
          className="h-4 w-4"
        />
        <span className="text-sm text-red-400">I understand this will reset the device</span>
      </label>

      <button
        onClick={handleReset}
        disabled={loading || !confirmed}
        className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
      >
        Reset Device
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
