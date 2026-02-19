import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import type { SuccessOutput } from "../../lib/types";

export function ScoreboardControl() {
  const { getBaseArgs } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const handleSend = async () => {
    setMessage(null);
    const result = await execute([
      ...getBaseArgs(), "scoreboard", String(score1), String(score2),
    ]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Scoreboard</h2>

      <div className="flex items-center gap-4">
        <div className="text-center">
          <label className="mb-1 block text-sm text-gray-400">Score 1</label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setScore1(Math.max(0, score1 - 1))}
              className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
            >
              -
            </button>
            <input
              type="number" value={score1} onChange={(e) => setScore1(Number(e.target.value))}
              className="w-16 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-center text-lg text-white"
              min={0} max={999}
            />
            <button
              onClick={() => setScore1(Math.min(999, score1 + 1))}
              className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
            >
              +
            </button>
          </div>
        </div>

        <span className="text-2xl text-gray-500">:</span>

        <div className="text-center">
          <label className="mb-1 block text-sm text-gray-400">Score 2</label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setScore2(Math.max(0, score2 - 1))}
              className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
            >
              -
            </button>
            <input
              type="number" value={score2} onChange={(e) => setScore2(Number(e.target.value))}
              className="w-16 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-center text-lg text-white"
              min={0} max={999}
            />
            <button
              onClick={() => setScore2(Math.min(999, score2 + 1))}
              className="rounded bg-gray-700 px-2 py-1 text-white hover:bg-gray-600"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleSend}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Set Scoreboard
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
