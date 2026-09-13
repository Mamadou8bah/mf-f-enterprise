import clsx from "clsx";
import {
  BuildingIcon,
  HouseIcon,
  MarketIcon,
  PlazaIcon,
  StarIcon,
} from "@/components/icons";

export type PropertyKind = "plaza" | "market" | "residential" | "building";

export function propertyKind(type?: string | null, name?: string | null): PropertyKind {
  const t = (type || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (t === "plaza" || n.includes("plaza")) return "plaza";
  if (t === "market" || n.includes("market")) return "market";
  if (
    t === "residential" ||
    n.includes("house") ||
    n.includes("apartment") ||
    n.includes("residential")
  ) {
    return "residential";
  }
  return "building";
}

const ICONS = {
  plaza: PlazaIcon,
  market: MarketIcon,
  residential: HouseIcon,
  building: BuildingIcon,
} as const;

const SIZES = {
  sm: { wrap: "h-9 w-9 rounded-xl", icon: "h-4 w-4" },
  md: { wrap: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
  lg: { wrap: "h-12 w-12 rounded-2xl", icon: "h-6 w-6" },
} as const;

export function PropertyIcon({
  type,
  name,
  favorite,
  size = "md",
  className,
}: {
  type?: string | null;
  name?: string | null;
  favorite?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const kind = propertyKind(type, name);
  const Icon = ICONS[kind];
  const s = SIZES[size];

  return (
    <span className={clsx("relative inline-flex shrink-0", className)}>
      <span
        className={clsx(
          "flex items-center justify-center bg-garawol-greenSoft text-garawol-green",
          s.wrap
        )}
        aria-hidden
      >
        <Icon className={s.icon} />
      </span>
      {favorite ? (
        <span
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-garawol-clay text-garawol-goldInk shadow-sm"
          title="Favourite"
        >
          <StarIcon className="h-2.5 w-2.5" />
        </span>
      ) : null}
    </span>
  );
}
