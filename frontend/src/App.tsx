import { useState } from "react";
import Sidebar, { type Tab } from "./components/Sidebar";
import Complaints from "./pages/Complaints";
import Stats from "./pages/Stats";
import Submit from "./pages/Submit";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [tab, setTab] = useState<Tab>("submit");

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar tab={tab} onTabChange={setTab} />
      <main className="flex-1 overflow-y-auto">
        {tab === "submit" && <Submit />}
        {tab === "dashboard" && <Dashboard />}
        {tab === "complaints" && <Complaints />}
        {tab === "stats" && <Stats />}
      </main>
    </div>
  );
}
