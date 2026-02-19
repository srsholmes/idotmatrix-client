import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import { ColorInput } from "../shared/ColorInput";
import { EFFECT_STYLES } from "../../lib/constants";
import type { SuccessOutput } from "../../lib/types";

export function EffectControl() {
  const { getBaseArgs } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [style, setStyle] = useState(0);
  const [colors, setColors] = useState(["ff0000", "00ff00"]);
  const [message, setMessage] = useState<string | null>(null);

  const handleSend = async () => {
    setMessage(null);
    const result = await execute([
      ...getBaseArgs(), "effect", "--style", String(style), ...colors,
    ]);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  const updateColor = (index: number, value: string) => {
    setColors((prev) => prev.map((c, i) => (i === index ? value : c)));
  };

  const addColor = () => {
    if (colors.length < 7) setColors((prev) => [...prev, "0000ff"]);
  };

  const removeColor = () => {
    if (colors.length > 2) setColors((prev) => prev.slice(0, -1));
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Effect</h2>

      <div>
        <label className="mb-1 block text-sm text-gray-400">Style</label>
        <select
          value={style}
          onChange={(e) => setStyle(Number(e.target.value))}
          className="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
        >
          {EFFECT_STYLES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Colors ({colors.length}/7)</label>
          <div className="flex gap-1">
            <button onClick={removeColor} disabled={colors.length <= 2}
              className="rounded bg-gray-700 px-2 py-0.5 text-sm text-white hover:bg-gray-600 disabled:opacity-30"
            >-</button>
            <button onClick={addColor} disabled={colors.length >= 7}
              className="rounded bg-gray-700 px-2 py-0.5 text-sm text-white hover:bg-gray-600 disabled:opacity-30"
            >+</button>
          </div>
        </div>
        {colors.map((c, i) => (
          <ColorInput key={i} value={c} onChange={(v) => updateColor(i, v)} />
        ))}
      </div>

      <button
        onClick={handleSend}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Set Effect
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
