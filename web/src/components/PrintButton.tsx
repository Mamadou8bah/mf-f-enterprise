"use client";

export function PrintButton({
  label = "Print",
  autofocus,
}: {
  label?: string;
  autofocus?: boolean;
}) {
  return (
    <button
      type="button"
      className="btn-primary"
      autoFocus={autofocus}
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
