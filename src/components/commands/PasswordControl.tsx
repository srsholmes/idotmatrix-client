import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import type { SuccessOutput } from "../../lib/types";

export function PasswordControl() {
  const { getBaseArgs } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [password, setPassword] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const handleSend = async () => {
    setMessage(null);
    const result = await execute([...getBaseArgs(), "password", String(password)]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Password</h2>

      <div>
        <label className="mb-1 block text-sm text-gray-400">Password (0-999999)</label>
        <input
          type="number" value={password} onChange={(e) => setPassword(Number(e.target.value))}
          className="w-40 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          min={0} max={999999}
        />
      </div>

      <button
        onClick={handleSend}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Set Password
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
