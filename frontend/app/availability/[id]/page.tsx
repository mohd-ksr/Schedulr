"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { availabilityAPI } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";

const DAYS_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TIMEZONES = ["UTC","America/New_York","America/Chicago","America/Denver","America/Los_Angeles",
  "Europe/London","Europe/Paris","Europe/Berlin","Asia/Dubai","Asia/Kolkata","Asia/Singapore",
  "Asia/Tokyo","Australia/Sydney","Pacific/Auckland"];

interface Rule {
  id?: number;
  day_of_week: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
}

interface DateOverride {
  id?: number;
  date: string;
  is_available: boolean;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export default function EditSchedulePage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [newOverride, setNewOverride] = useState<DateOverride>({ date: "", is_available: false });

  useEffect(() => {
    availabilityAPI.getSchedule(Number(id))
      .then(res => {
        setSchedule(res.data);
        // Build full 7-day rules
        const existingRules = res.data.rules || [];
        const fullRules = Array.from({ length: 7 }, (_, dow) => {
          const existing = existingRules.find((r: Rule) => r.day_of_week === dow);
          return existing || { day_of_week: dow, is_available: false, start_time: "09:00:00", end_time: "17:00:00" };
        });
        setRules(fullRules);
        setOverrides(res.data.date_overrides || []);
      })
      .catch(() => { toast("Schedule not found", "error"); router.push("/availability"); })
      .finally(() => setLoading(false));
  }, [id]);

  const updateRule = (dow: number, field: keyof Rule, value: any) => {
    setRules(prev => prev.map(r => r.day_of_week === dow ? { ...r, [field]: value } : r));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await availabilityAPI.updateSchedule(Number(id), {
        name: schedule.name,
        timezone: schedule.timezone,
        is_default: schedule.is_default,
        rules: rules.map(r => ({
          day_of_week: r.day_of_week,
          is_available: r.is_available,
          start_time: r.start_time,
          end_time: r.end_time,
        })),
      });
      toast("Schedule saved!");
    } catch { toast("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await availabilityAPI.addOverride(Number(id), newOverride);
      setOverrides(prev => [...prev, res.data]);
      setShowOverrideForm(false);
      setNewOverride({ date: "", is_available: false });
      toast("Override added");
    } catch { toast("Failed to add override", "error"); }
  };

  const handleDeleteOverride = async (overrideId: number) => {
    try {
      await availabilityAPI.deleteOverride(Number(id), overrideId);
      setOverrides(prev => prev.filter(o => o.id !== overrideId));
      toast("Override removed");
    } catch { toast("Failed to remove", "error"); }
  };

  if (loading || !schedule) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-[var(--text)] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/availability" className="text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text)]">{schedule.name}</h1>
            <p className="text-sm text-[var(--text-secondary)]">Edit availability schedule</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Schedule name & timezone */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Schedule name</label>
              <input value={schedule.name} onChange={e => setSchedule((p: any) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Timezone</label>
              <select value={schedule.timezone} onChange={e => setSchedule((p: any) => ({ ...p, timezone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]">
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>

          {/* Weekly schedule */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text)] text-sm">Weekly hours</h3>
            </div>
            {rules.map(rule => (
              <div key={rule.day_of_week} className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-0">
                <Toggle
                  checked={rule.is_available}
                  onChange={v => updateRule(rule.day_of_week, "is_available", v)}
                />
                <span className="w-20 text-sm font-medium text-[var(--text)]">{DAYS_FULL[rule.day_of_week]}</span>
                {rule.is_available ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={rule.start_time?.slice(0, 5) || "09:00"}
                      onChange={e => updateRule(rule.day_of_week, "start_time", e.target.value + ":00")}
                      className="px-3 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]"
                    />
                    <span className="text-[var(--text-muted)] text-sm">–</span>
                    <input
                      type="time"
                      value={rule.end_time?.slice(0, 5) || "17:00"}
                      onChange={e => updateRule(rule.day_of_week, "end_time", e.target.value + ":00")}
                      className="px-3 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-[var(--text-muted)] flex-1">Unavailable</span>
                )}
              </div>
            ))}
          </div>

          {/* Date overrides */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[var(--text)] text-sm">Date overrides</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Block specific dates or set different hours</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowOverrideForm(!showOverrideForm)}>
                <Plus size={13} /> Add override
              </Button>
            </div>

            {showOverrideForm && (
              <form onSubmit={handleAddOverride} className="mb-4 p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text)] mb-1">Date</label>
                    <input type="date" required value={newOverride.date}
                      onChange={e => setNewOverride(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text)] mb-1">Status</label>
                    <select value={newOverride.is_available ? "available" : "blocked"}
                      onChange={e => setNewOverride(p => ({ ...p, is_available: e.target.value === "available" }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none">
                      <option value="blocked">Block day</option>
                      <option value="available">Custom hours</option>
                    </select>
                  </div>
                </div>
                {newOverride.is_available && (
                  <div className="flex items-center gap-2">
                    <input type="time" value={newOverride.start_time || "09:00"}
                      onChange={e => setNewOverride(p => ({ ...p, start_time: e.target.value }))}
                      className="px-3 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none" />
                    <span className="text-[var(--text-muted)]">–</span>
                    <input type="time" value={newOverride.end_time || "17:00"}
                      onChange={e => setNewOverride(p => ({ ...p, end_time: e.target.value }))}
                      className="px-3 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none" />
                  </div>
                )}
                <input placeholder="Reason (optional)" value={newOverride.reason || ""}
                  onChange={e => setNewOverride(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none" />
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Add</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowOverrideForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {overrides.length > 0 ? (
              <div className="space-y-2">
                {overrides.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">{o.date}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {o.is_available ? `${o.start_time?.slice(0,5)} – ${o.end_time?.slice(0,5)}` : "Blocked"}
                        {o.reason && ` · ${o.reason}`}
                      </p>
                    </div>
                    <button onClick={() => o.id && handleDeleteOverride(o.id)}
                      className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No date overrides yet</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Link href="/availability"><Button type="button" variant="secondary">Cancel</Button></Link>
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
