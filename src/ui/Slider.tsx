interface Props {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  label?: string;
}

export function Slider({ min, max, step = 1, value, onChange, suffix = '', label }: Props) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        className="duo-range flex-1"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="w-16 text-right text-xl font-black text-macaw">
        {value}
        {suffix}
      </span>
    </div>
  );
}
