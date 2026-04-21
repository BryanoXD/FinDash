/**
 * Componentes de formulário reutilizáveis para todo o app.
 * Fonte única de verdade para: Field, Inp, MoneyInp, Sel, Btn, Toggle
 */
import React from "react";

/** Wrapper de campo com label */
export const Field = ({ label, required, children }) => (
  <div>
    <label className="text-white/60 text-xs block mb-1.5">
      {label}{required && " *"}
    </label>
    {children}
  </div>
);

/** Input de texto genérico (dark theme) */
export const Inp = (props) => (
  <input
    {...props}
    className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 placeholder:text-white/25 ${props.className || ""}`}
  />
);

/**
 * Input monetário com máscara BRL em tempo real.
 * Aceita `value` (número) e `onValueChange` (callback com número).
 * O usuário vê "1.234,56" enquanto digita; o valor interno é 1234.56.
 */
export const MoneyInp = ({ value, onValueChange, ...rest }) => {
  const formatFromNum = (num) => {
    if (!num && num !== 0) return "";
    const fixed = Number(num).toFixed(2);
    const [int, dec] = fixed.split(".");
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + dec;
  };

  const [display, setDisplay] = React.useState(() =>
    value ? formatFromNum(value) : ""
  );

  React.useEffect(() => {
    if (!value && value !== 0) setDisplay("");
  }, [value]);

  const handleChange = (e) => {
    let raw = e.target.value.replace(/[^\d]/g, "");
    if (!raw) {
      setDisplay("");
      onValueChange("");
      return;
    }
    raw = raw.replace(/^0+/, "") || "0";
    while (raw.length < 3) raw = "0" + raw;
    const cents = raw.slice(-2);
    const intPart = raw.slice(0, -2).replace(/^0+/, "") || "0";
    setDisplay(intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + cents);
    onValueChange(parseFloat(intPart + "." + cents));
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      placeholder="0,00"
      value={display}
      onChange={handleChange}
      className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 placeholder:text-white/25 ${rest.className || ""}`}
    />
  );
};

/** Select (dark theme) com opções legíveis */
export const Sel = ({ children, ...rest }) => (
  <select
    {...rest}
    className={`w-full bg-[#1a1a1a] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 ${rest.className || ""}`}
    style={{ colorScheme: "dark" }}
  >
    {children}
  </select>
);

/** Botão com variantes: primary (branco) e secondary (outline) */
export const Btn = ({ children, variant = "primary", ...rest }) => (
  <button
    {...rest}
    className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
      variant === "primary"
        ? "bg-white text-black hover:bg-gray-100"
        : "text-white/40 border border-white/[0.08] hover:bg-white/[0.04]"
    } ${rest.className || ""}`}
  >
    {children}
  </button>
);

/** Toggle switch reutilizável */
export const Toggle = ({ on, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <button
      type="button"
      onClick={onChange}
      className={`w-9 h-5 rounded-full transition-colors relative ${
        on ? "bg-emerald-500" : "bg-white/10"
      }`}
    >
      <div
        className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${
          on ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
    {label && <span className="text-white/50 text-xs">{label}</span>}
  </label>
);
