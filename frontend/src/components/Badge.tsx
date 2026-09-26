import type { ReactNode } from "react";
import type { Priority, Status } from "../api/client";

type Tone = "blue" | "green" | "yellow" | "red" | "purple" | "slate";

const TONE_CLASSES: Record<Tone, string> = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700",
  purple: "bg-violet-100 text-violet-700",
  slate: "bg-slate-100 text-slate-700",
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
}

export default function Badge({ tone = "slate", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

const PRIORITY_TONES: Record<Priority, Tone> = {
  high: "red",
  normal: "yellow",
  low: "green",
};

const STATUS_TONES: Record<Status, Tone> = {
  open: "blue",
  in_progress: "yellow",
  resolved: "green",
  rejected: "slate",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONES[priority]}>{priority}</Badge>;
}

export function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={STATUS_TONES[status]}>{status.replace("_", " ")}</Badge>;
}
