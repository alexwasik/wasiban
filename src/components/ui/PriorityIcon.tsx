import type { ReactNode } from "react";

export type Priority = "low" | "medium" | "high" | "highest";

const CHEVRON_PATH = "M4 8l4-4 4 4";

function Chevron({ y, color }: { y: number; color: string }) {
  return (
    <polyline
      points={`4,${y + 4} 8,${y} 12,${y + 4}`}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function DashIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ display: "block" }}>
      <line x1="2" y1="7" x2="12" y2="7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SingleChevronIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" style={{ display: "block" }}>
      <Chevron y={4} color={color} />
    </svg>
  );
}

function DoubleChevronIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" style={{ display: "block" }}>
      <Chevron y={1} color={color} />
      <Chevron y={6} color={color} />
    </svg>
  );
}

function TripleChevronIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 18" style={{ display: "block" }}>
      <Chevron y={0} color={color} />
      <Chevron y={5} color={color} />
      <Chevron y={10} color={color} />
    </svg>
  );
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; icon: (color: string) => ReactNode }
> = {
  low: {
    label: "Low",
    color: "#8c8c8c",
    icon: (c) => <DashIcon color={c} />,
  },
  medium: {
    label: "Medium",
    color: "#52c41a",
    icon: (c) => <SingleChevronIcon color={c} />,
  },
  high: {
    label: "High",
    color: "#faad14",
    icon: (c) => <DoubleChevronIcon color={c} />,
  },
  highest: {
    label: "Highest",
    color: "#f5222d",
    icon: (c) => <TripleChevronIcon color={c} />,
  },
};

export const PRIORITY_OPTIONS = (Object.keys(PRIORITY_CONFIG) as Priority[]).map(
  (value) => ({
    value,
    label: PRIORITY_CONFIG[value].label,
    color: PRIORITY_CONFIG[value].color,
    icon: PRIORITY_CONFIG[value].icon(PRIORITY_CONFIG[value].color),
  })
);

interface PriorityIconProps {
  priority: string | null | undefined;
  showLabel?: boolean;
}

export function PriorityIcon({ priority, showLabel = false }: PriorityIconProps) {
  if (!priority) return null;
  const config = PRIORITY_CONFIG[priority as Priority];
  if (!config) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        color: config.color,
        fontSize: "12px",
        fontWeight: 500,
      }}
      title={config.label}
    >
      {config.icon(config.color)}
      {showLabel && config.label}
    </span>
  );
}
