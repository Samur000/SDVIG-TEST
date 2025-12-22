import './UI.css';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  size?: 'sm' | 'md' | 'lg';
  color?: string; // кастомный цвет (например, цвет привычки)
}

export function Checkbox({ checked, onChange, size = 'md', color }: CheckboxProps) {
  const style: React.CSSProperties | undefined = color
    ? {
        ['--checkbox-color' as string]: color,
        borderColor: color,
        ...(checked ? { background: color } : {})
      }
    : undefined;

  return (
    <button 
      className={`checkbox ${checked ? 'checked' : ''} checkbox-${size}`}
      onClick={onChange}
      type="button"
      aria-checked={checked}
      style={style}
    >
      {checked && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </button>
  );
}

