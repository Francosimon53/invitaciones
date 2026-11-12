/** Iconos lucide usados por el original, con el mismo markup (misma clase y trazos). */
import type { SVGProps } from "react";

type IconProps = { size?: number; className?: string } & Omit<SVGProps<SVGSVGElement>, "ref">;

function icon(name: string, paths: React.ReactNode) {
  return function Icon({ size = 24, className = "", ...rest }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`lucide lucide-${name}${className ? ` ${className}` : ""}`}
        aria-hidden="true"
        {...rest}
      >
        {paths}
      </svg>
    );
  };
}

export const ArrowDown = icon(
  "arrow-down",
  <>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </>,
);

export const CalendarDays = icon(
  "calendar-days",
  <>
    <path d="M8 2v3" />
    <path d="M16 2v3" />
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M8 13h.01" />
    <path d="M12 13h.01" />
    <path d="M16 13h.01" />
    <path d="M8 17h.01" />
    <path d="M12 17h.01" />
    <path d="M16 17h.01" />
  </>,
);

export const ChevronDown = icon("chevron-down", <path d="m6 9 6 6 6-6" />);

export const MapPin = icon(
  "map-pin",
  <>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </>,
);

export const Music2 = icon(
  "music2 lucide-music-2",
  <>
    <circle cx="8" cy="18" r="4" />
    <path d="M12 18V2l7 4" />
  </>,
);

export const Pause = icon(
  "pause",
  <>
    <rect x="14" y="3" width="5" height="18" rx="1" />
    <rect x="5" y="3" width="5" height="18" rx="1" />
  </>,
);

export const Phone = icon(
  "phone",
  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />,
);

export const Play = icon("play", <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />);

export const Sparkles = icon(
  "sparkles",
  <>
    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    <path d="M20 2v4" />
    <path d="M22 4h-4" />
    <circle cx="4" cy="20" r="2" />
  </>,
);

export const SnowflakeIcon = icon(
  "snowflake",
  <>
    <path d="m10 20-1.25-2.5L6 18" />
    <path d="M10 4 8.75 6.5 6 6" />
    <path d="m14 20 1.25-2.5L18 18" />
    <path d="m14 4 1.25 2.5L18 6" />
    <path d="m17 21-3-6h-4" />
    <path d="m17 3-3 6 1.5 3" />
    <path d="M2 12h6.5L10 9" />
    <path d="m20 10-1.5 2 1.5 2" />
    <path d="M22 12h-6.5L14 15" />
    <path d="m4 10 1.5 2L4 14" />
    <path d="m7 21 3-6-1.5-3" />
    <path d="m7 3 3 6h4" />
  </>,
);

export const Check = icon("check", <path d="M20 6 9 17l-5-5" />);

/** Cristal de nieve decorativo del original (componente D). */
export function Crystal({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        {Array.from({ length: 6 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 60} 50 50)`}>
            <path d="M50 50V9M50 23L40 14M50 23L60 14M50 35L36 24M50 35L64 24" />
            <path d="M47 11L50 6L53 11L50 16Z" />
          </g>
        ))}
      </g>
      <path d="M50 39L59.5 44.5V55.5L50 61L40.5 55.5V44.5Z" fill="currentColor" fillOpacity=".25" stroke="currentColor" />
      <circle cx="50" cy="50" r="4" fill="currentColor" />
    </svg>
  );
}
