interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ColorInput({ value, onChange, label }: ColorInputProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <label className="text-sm text-gray-400">{label}</label>}
      <input
        type="color"
        value={`#${value}`}
        onChange={(e) => onChange(e.target.value.replace("#", ""))}
        className="h-8 w-10 cursor-pointer rounded border border-gray-700 bg-gray-800"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.replace("#", ""))}
        className="w-20 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white"
        maxLength={6}
        placeholder="ff0000"
      />
    </div>
  );
}
