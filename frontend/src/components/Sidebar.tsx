import { BarChart3, FileText, LayoutDashboard, ListChecks, Activity } from "lucide-react";

export type Tab = "submit" | "dashboard" | "complaints" | "stats";

interface SidebarProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
}

const NAV_ITEMS: { id: Tab; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "submit", label: "Submit Complaint", Icon: FileText },
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "complaints", label: "Complaints", Icon: ListChecks },
  { id: "stats", label: "Statistics", Icon: BarChart3 },
];

export default function Sidebar({ tab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-lg">CivicPulse</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        System online
      </div>
    </aside>
  );
}
