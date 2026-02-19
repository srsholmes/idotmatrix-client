import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import type { SuccessOutput } from "../../lib/types";

export function ChronographControl() {
  const { getBaseArgs } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [message, setMessage] = useState<string | null>(null);

  const sendAction = async (action: string) => {
    setMessage(null);
    const result = await execute([...getBaseArgs(), "chronograph", action]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Chronograph</h2>

      <div className="flex flex-wrap gap-2">
        {["start", "pause", "continue", "reset"].map((action) => (
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
