import { type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

const base =
  "w-full font-medium text-[15px] text-charcoal bg-cream border-[1.5px] border-line rounded-xl outline-none transition-colors";
const pad = "px-4 py-3";
const focus = "focus:border-charcoal";

export function Input({ label, hint, className = "", ...rest }: InputProps) {
  return (
    <label className="block">
      {label && (
        <span className="block text-[13px] font-semibold text-charcoal mb-2">
          {label}
        </span>
      )}
      <input className={`${base} ${pad} ${focus} ${className}`} {...rest} />
      {hint && (
        <span className="block text-[12px] text-faint mt-1.5">{hint}</span>
      )}
    </label>
  );
}

export function Textarea({ label, hint, className = "", ...rest }: TextareaProps) {
  return (
    <label className="block">
      {label && (
        <span className="block text-[13px] font-semibold text-charcoal mb-2">
          {label}
        </span>
      )}
      <textarea
        className={`${base} ${pad} ${focus} min-h-[88px] resize-y leading-relaxed ${className}`}
        {...rest}
      />
      {hint && (
        <span className="block text-[12px] text-faint mt-1.5">{hint}</span>
      )}
    </label>
  );
}

export default Input;