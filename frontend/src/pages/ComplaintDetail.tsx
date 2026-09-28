import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  Calendar,
  Clock,
  FileText,
  MapPin,
  Sparkles,
  Zap,
} from "lucide-react";
import { api, ApiError, type Complaint, type Status } from "../api/client";
import Button from "../components/Button";
import Card from "../components/Card";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";

interface ComplaintDetailProps {
  complaintId: string;
  onBack: () => void;
  onStatusChange?: (updated: Complaint) => void;
}

const NEXT_STATUSES: Record<Status, Status[]> = {
  open: ["in_progress", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved: [],
  rejected: [],
};

export default function ComplaintDetail({
  complaintId,
  onBack,
  onStatusChange,
}: ComplaintDetailProps) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);



  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getComplaint(complaintId);
        if (cancelled) return;
        setComplaint(data);
      } catch {
        if (cancelled) return;
        setError("Failed to load complaint");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [complaintId]);

  async function changeStatus(next: Status) {
    if (!complaint) return;
    setUpdating(true);
    setError(null);
    setFlash(null);
    try {
      const updated = await api.updateStatus(complaint.id, next);
      setComplaint(updated);
      setFlash(`Status changed to ${next.replace("_", " ")}`);
      onStatusChange?.(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body.detail || "Update failed");
      } else {
        setError("Update failed");
      }
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner label="Loading complaint…" />
      </div>
    );
  }

  if (error && !complaint) {
    return (
      <div className="p-8">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </Button>
        <Card className="mt-6 p-6 border-rose-200 bg-rose-50 flex items-center gap-2 text-rose-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </Card>
      </div>
    );
  }

  if (!complaint) return null;

  const nextOptions = NEXT_STATUSES[complaint.status];

  return (
    <div className="p-8 max-w-5xl">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to list
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-xs text-slate-500">
              #{complaint.id.slice(0, 8)}
            </span>
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {complaint.ai_summary || complaint.text.slice(0, 80)}
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {complaint.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Submitted {new Date(complaint.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {flash && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-700">
          <Sparkles className="w-4 h-4" />
          {flash}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Triage Results */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-slate-900">AI Triage Results</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 mb-1">Category</div>
                <div className="font-medium text-slate-900 capitalize">
                  {complaint.category}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Priority</div>
                <div className="font-medium text-slate-900 capitalize">
                  {complaint.priority}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500 mb-1">Summary</div>
                <div className="text-slate-800">
                  {complaint.ai_summary || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Triaged by</div>
                <div className="font-medium text-slate-900">{complaint.triaged_by}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Latency</div>
                <div className="font-medium text-slate-900">
                  {complaint.triage_latency_ms} ms
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-500">Cache:</span>
              <span className="font-medium text-slate-700">
                {complaint.triage_latency_ms === 0 ? "HIT" : "MISS"}
              </span>
            </div>
          </Card>

          {/* Details */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 mb-1">Full description</div>
                <div className="text-slate-800 leading-relaxed">{complaint.text}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Location</div>
                <div className="text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {complaint.location}
                </div>
              </div>
              {complaint.reporter_contact && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Contact</div>
                  <div className="text-slate-800">{complaint.reporter_contact}</div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column — timeline + actions */}
        <div className="space-y-6">
          {/* Status History */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-900">Status History</h2>
            </div>
            <ol className="space-y-4 text-sm">
              <TimelineStep
                label="Created"
                time={new Date(complaint.created_at).toLocaleString()}
                active
              />
              {complaint.ai_summary && (
                <TimelineStep
                  label="Triage Completed"
                  time={`${complaint.triage_latency_ms} ms`}
                  active
                />
              )}
              {complaint.status !== "open" && (
                <TimelineStep
                  label={complaint.status.replace("_", " ")}
                  time={new Date(complaint.updated_at).toLocaleString()}
                  active
                />
              )}
            </ol>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Actions</h2>
            {nextOptions.length === 0 ? (
              <p className="text-sm text-slate-500">
                No further actions. This complaint is {complaint.status}.
              </p>
            ) : (
              <div className="space-y-2">
                {nextOptions.map((next) => (
                  <Button
                    key={next}
                    variant={
                      next === "resolved"
                        ? "success"
                        : next === "rejected"
                        ? "danger"
                        : "lavender"
                    }
                    size="sm"
                    className="w-full"
                    disabled={updating}
                    onClick={() => changeStatus(next)}
                  >
                    Mark as {next.replace("_", " ")}
                  </Button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function TimelineStep({
  label,
  time,
  active,
}: {
  label: string;
  time: string;
  active?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <div
        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
          active ? "bg-brand-600" : "bg-slate-300"
        }`}
      />
      <div className="flex-1">
        <div className="font-medium text-slate-800 capitalize">{label}</div>
        <div className="text-xs text-slate-500">{time}</div>
      </div>
    </li>
  );
}