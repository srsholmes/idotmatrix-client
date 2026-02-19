import { useState } from "react";
import { useDevice } from "../../hooks/useDevice";
import { useSidecar } from "../../hooks/useSidecar";
import { CommandOutput } from "../shared/CommandOutput";
import { ColorInput } from "../shared/ColorInput";
import { SliderInput } from "../shared/SliderInput";
import { TEXT_MODES, TEXT_COLOR_MODES } from "../../lib/constants";
import type { SuccessOutput } from "../../lib/types";

export function TextDisplay() {
  const { getBaseArgs } = useDevice();
  const { loading, error, execute } = useSidecar();
  const [text, setText] = useState("");
  const [mode, setMode] = useState(1);
  const [speed, setSpeed] = useState(95);
  const [colorMode, setColorMode] = useState(1);
  const [color, setColor] = useState("ff0000");
  const [bgMode, setBgMode] = useState(0);
  const [bgColor, setBgColor] = useState("000000");
  const [fontSize, setFontSize] = useState(24);
  const [message, setMessage] = useState<string | null>(null);

  const handleSend = async () => {
    if (!text.trim()) return;
    setMessage(null);
    const args = [
      ...getBaseArgs(), "text", text,
      "--mode", String(mode),
      "--speed", String(speed),
      "--color-mode", String(colorMode),
      "--color", color,
      "--bg-mode", String(bgMode),
      "--bg-color", bgColor,
      "--font-size", String(fontSize),
    ];
    const result = await execute(args);
    if (result && "message" in result) {
      setMessage((result as SuccessOutput).message);
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-white">Scrolling Text</h2>

      <div>
        <label className="mb-1 block text-sm text-gray-400">Message</label>
        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
          rows={2} placeholder="Enter text to display..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Mode</label>
          <select value={mode} onChange={(e) => setMode(Number(e.target.value))}
            className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          >
            {TEXT_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">Color Mode</label>
          <select value={colorMode} onChange={(e) => setColorMode(Number(e.target.value))}
            className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          >
            {TEXT_COLOR_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <SliderInput label="Speed" value={speed} onChange={setSpeed} min={0} max={255} />
      <SliderInput label="Font Size" value={fontSize} onChange={setFontSize} min={8} max={48} />

      <div className="flex gap-4">
        <ColorInput value={color} onChange={setColor} label="Text" />
        <ColorInput value={bgColor} onChange={setBgColor} label="Background" />
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-400">Background Mode</label>
        <select value={bgMode} onChange={(e) => setBgMode(Number(e.target.value))}
          className="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
        >
          <option value={0}>Black</option>
          <option value={1}>Custom</option>
        </select>
      </div>

      <button
        onClick={handleSend}
        disabled={loading || !text.trim()}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Send Text
      </button>

      <CommandOutput loading={loading} error={error} message={message} />
    </div>
  );
}
