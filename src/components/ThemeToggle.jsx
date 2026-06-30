import { TiAdjustContrast } from "react-icons/ti";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle-nav ${className}`}
      onClick={toggleTheme}
      aria-label="Cambiar tema"
    >
      <TiAdjustContrast size={20} />
    </button>
  );
}
