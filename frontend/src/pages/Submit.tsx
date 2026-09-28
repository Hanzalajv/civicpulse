import { useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, CheckCircle2, FileText, Mail, MapPin, Send, ShieldCheck } from "lucide-react";
import { api, ApiError, type Complaint } from "../api/client";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";

const MIN_TEXT = 10;
const MAX_TEXT = 2000;
const MIN_LOCATION = 3;
const MAX_LOCATION = 200;

interface FormErrors {
  text?: string;
  location?: string;
  general?: string;
}

export default function Submit() {
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<Complaint | null>(null);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (text.length < MIN_TEXT) errs.text = `Must be at least ${MIN_TEXT} characters`;
    if (text.length > MAX_TEXT) errs.text = `Must be at most ${MAX_TEXT} characters`;
    if (location.length < MIN_LOCATION)
      errs.location = `Must be at least ${MIN_LOCATION} characters`;
    if (location.length > MAX_LOCATION)
      errs.location = `Must be at most ${MAX_LOCATION} characters`;
    return errs;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    const localErrors = validate();
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const created = await api.createComplaint({
        text,
        location,
        reporter_contact: contact.trim() || undefined,
      });
      setResult(created);
      setText("");
      setLocation("");
      setContact("");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.body.errors && err.body.errors.length > 0) {
          const fieldErrs: FormErrors = {};
          for (const fe of err.body.errors) {
            if (fe.field === "text") fieldErrs.text = fe.message;
            else if (fe.field === "location") fieldErrs.location = fe.message;
          }
          setErrors(fieldErrs);
        } else {
          setErrors({ general: err.body.detail || "Submission failed" });
        }
      } else {
        setErrors({ general: "Unexpected error" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Full-bleed photo background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/hero-city.jpg)" }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-slate-900/55" />

      {/* Content */}
      <div className="relative z-10 min-h-full px-12 py-14 flex items-center">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: hero copy */}
          <div className="lg:col-span-7 text-white">
            <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] mb-6">
              Better reporting.
              <br />
              <span className="text-white">Faster action.</span>
            </h1>

            <p className="text-slate-100/90 text-base leading-relaxed mb-14 max-w-md">
              Report non-emergency issues in your city and help us build a cleaner, safer, and more
              connected community.
            </p>

            <div className="grid grid-cols-3 gap-10 max-w-lg">
              <HeroFeature Icon={Send} title="Submit" caption="Report an issue in seconds" />
              <HeroFeature
                Icon={FileText}
                title="Track"
                caption="See your complaint status in real time"
              />
              <HeroFeature
                Icon={ShieldCheck}
                title="Make an Impact"
                caption="A cleaner, safer city for everyone"
              />
            </div>
          </div>

          {/* Right: form card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <Card className="p-7 shadow-2xl border-0">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-slate-900">Submit a Complaint</h2>
                </div>

                <form onSubmit={onSubmit} noValidate className="space-y-4">
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Location <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Street name, landmark, or address"
                        disabled={loading}
                        className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 ${
                          errors.location ? "border-rose-400" : "border-slate-300"
                        }`}
                      />
                    </div>
                    {errors.location && (
                      <div className="text-xs mt-1 text-rose-600">{errors.location}</div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="text"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Describe the issue <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={5}
                      placeholder="Please provide as much detail as possible…"
                      disabled={loading}
                      className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 ${
                        errors.text ? "border-rose-400" : "border-slate-300"
                      }`}
                    />
                    <div className="flex justify-between text-xs mt-1">
                      {errors.text ? (
                        <span className="text-rose-600">{errors.text}</span>
                      ) : (
                        <span />
                      )}
                      <span className="text-slate-400">
                        {text.length}/{MAX_TEXT}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Your contact (optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="contact"
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="Email or phone number"
                        disabled={loading}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                      "Submitting…"
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Complaint
                      </>
                    )}
                  </Button>

                  <div className="flex items-start gap-2 text-xs text-slate-500 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Your information is secure and only used to process your complaint.</span>
                  </div>
                </form>
              </Card>

              {loading && (
                <div className="mt-4">
                  <LoadingSpinner label="Analyzing your complaint…" />
                </div>
              )}

              {errors.general && (
                <Card className="mt-4 p-4 border-rose-200 bg-rose-50 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-rose-700">{errors.general}</span>
                </Card>
              )}

              {result && (
                <Card className="mt-6 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Complaint received</h2>
                  </div>

                  <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                    <dt className="font-medium text-slate-500">ID</dt>
                    <dd className="font-mono text-xs text-slate-800 break-all">{result.id}</dd>

                    <dt className="font-medium text-slate-500">Category</dt>
                    <dd className="text-slate-800">{result.category}</dd>

                    <dt className="font-medium text-slate-500">Priority</dt>
                    <dd className="text-slate-800">{result.priority}</dd>

                    <dt className="font-medium text-slate-500">Status</dt>
                    <dd className="text-slate-800">{result.status}</dd>

                    <dt className="font-medium text-slate-500">Summary</dt>
                    <dd className="text-slate-800">{result.ai_summary || "—"}</dd>

                    <dt className="font-medium text-slate-500">Triaged by</dt>
                    <dd className="text-slate-800">{result.triaged_by}</dd>

                    <dt className="font-medium text-slate-500">Latency</dt>
                    <dd className="text-slate-800">{result.triage_latency_ms} ms</dd>
                  </dl>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroFeature({
  Icon,
  title,
  caption,
}: {
  Icon: typeof Send;
  title: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col items-start">
      <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-sm font-semibold mb-1 text-white">{title}</div>
      <div className="text-xs text-slate-200 leading-snug">{caption}</div>
    </div>
  );
}
