interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
}

export function SliderInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: SliderInputProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-24 text-sm text-gray-400">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <span className="w-12 text-right text-sm text-gray-300">{value}</span>
    </div>
  );
}
