import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import { ColorInput } from "../shared/ColorInput";
import { CLOCK_STYLES } from "../../lib/constants";
import type { SuccessOutput } from "../../lib/types";

export function ClockControl() {
  const { getBaseArgs } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [style, setStyle] = useState(0);
  const [color, setColor] = useState("ffffff");
  const [noDate, setNoDate] = useState(false);
  const [twelveHour, setTwelveHour] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSet = async () => {
    setMessage(null);
    const args = [...getBaseArgs(), "clock", "set", "--style", String(style), "--color", color];
    if (noDate) args.push("--no-date");
    if (twelveHour) args.push("--12h");
    const result = await execute(args);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  const handleSync = async () => {
    setMessage(null);
    const result = await execute([...getBaseArgs(), "clock", "sync"]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Clock</h2>

      <div>
        <label className="mb-1 block text-sm text-gray-400">Style</label>
        <select
          value={style}
          onChange={(e) => setStyle(Number(e.target.value))}
          className="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
        >
          {CLOCK_STYLES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <ColorInput value={color} onChange={setColor} label="Color" />

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={noDate} onChange={(e) => setNoDate(e.target.checked)} />
          Hide date
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={twelveHour} onChange={(e) => setTwelveHour(e.target.checked)} />
          12-hour format
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSet}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          Set Clock
        </button>
        <button
          onClick={handleSync}
          disabled={loading}
          className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50"
        >
          Sync Time
        </button>
      </div>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
