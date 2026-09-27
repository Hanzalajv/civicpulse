import { useState } from "react";
import Sidebar, { type Tab } from "./components/Sidebar";
import Complaints from "./pages/Complaints";
import ComplaintDetail from "./pages/ComplaintDetail";
import Stats from "./pages/Stats";
import Submit from "./pages/Submit";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [tab, setTab] = useState<Tab>("submit");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        tab={tab}
        onTabChange={(next) => {
          setTab(next);
          setSelectedComplaintId(null);
        }}
      />
      <main className="flex-1 overflow-y-auto">
        {tab === "submit" && <Submit />}
        {tab === "dashboard" && <Dashboard />}
        {tab === "complaints" &&
          (selectedComplaintId ? (
            <ComplaintDetail
              complaintId={selectedComplaintId}
              onBack={() => setSelectedComplaintId(null)}
            />
          ) : (
            <Complaints onSelect={setSelectedComplaintId} />
          ))}
        {tab === "stats" && <Stats />}
      </main>
    </div>
  );
}