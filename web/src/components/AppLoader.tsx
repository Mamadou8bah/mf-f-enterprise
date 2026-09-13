type AppLoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  /** Full-viewport centered shell (route transitions) */
  fullPage?: boolean;
};

export function AppLoader({
  label = "Loading…",
  size = "md",
  fullPage = false,
}: AppLoaderProps) {
  const sizeClass =
    size === "sm" ? "app-loader--sm" : size === "lg" ? "app-loader--lg" : "";

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <div className={`app-loader ${sizeClass}`.trim()} aria-hidden />
      {label ? (
        <p className="text-sm font-semibold text-garawol-muted">{label}</p>
      ) : null}
      <span className="sr-only">{label || "Loading"}</span>
    </div>
  );

  if (!fullPage) return spinner;

  return (
    <div className="flex min-h-[50dvh] w-full flex-1 items-center justify-center px-4 py-16">
      {spinner}
    </div>
  );
}
