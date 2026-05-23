"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { availabilityAPI } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Plus, Globe, MoreHorizontal, Pencil, Trash2, Check } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

interface Schedule {
  id: number;
  name: string;
  timezone: string;
  is_default: boolean;
  rules: Array<{ day_of_week: number; is_available: boolean; start_time: string; end_time: string }>;
}

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function AvailabilityPage() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [newName, setNewName] = useState("Working Hours");

  useEffect(() => { fetchSchedules(); }, []);

  const fetchSchedules = async () => {
    try {
      const res = await availabilityAPI.listSchedules();
      setSchedules(res.data);
    } catch { toast("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      await availabilityAPI.deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast("Schedule deleted");
    } catch { toast("Failed to delete", "error"); }
    setOpenMenu(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rules = Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i,
        is_available: i >= 1 && i <= 5,
        start_time: "09:00:00",
        end_time: "17:00:00",
      }));
      const res = await availabilityAPI.createSchedule({
        name: newName, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        is_default: schedules.length === 0, rules
      });
      setSchedules(prev => [...prev, res.data]);
      setShowNew(false);
      toast("Schedule created!");
    } catch { toast("Failed to create", "error"); }
  };

  const getScheduleSummary = (schedule: Schedule) => {
    const available = schedule.rules?.filter(r => r.is_available) || [];
    if (available.length === 0) return "No available days";
    const days = available.map(r => DAYS[r.day_of_week]).join(", ");
    const first = available[0];
    const time = first ? `${first.start_time?.slice(0, 5)} - ${first.end_time?.slice(0, 5)}` : "";
    return `${days}, ${time}`;
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <PageHeader
          title="Availability"
          subtitle="Configure times when you are available for bookings."
          actions={
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                <button className="px-4 py-2 text-sm font-medium bg-[var(--text)] text-[var(--bg)]">My availability</button>
                <button className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors">Team availability</button>
              </div>
              <Button onClick={() => setShowNew(true)} size="md"><Plus size={15} /> New</Button>
            </div>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-[var(--text)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center py-20">
            <p className="text-[var(--text-secondary)] text-sm mb-3">No availability schedules yet</p>
            <Button onClick={() => setShowNew(true)} size="sm"><Plus size={14} /> Create schedule</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(schedule => (
              <div key={schedule.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 flex items-center justify-between group hover:bg-[var(--surface)] transition-colors">
                <Link href={`/availability/${schedule.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--text)] text-sm">{schedule.name}</p>
                    {schedule.is_default && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{getScheduleSummary(schedule)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Globe size={11} className="text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-muted)]">{schedule.timezone}</span>
                  </div>
                </Link>
                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.preventDefault(); setOpenMenu(openMenu === schedule.id ? null : schedule.id); }}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--muted)]/20"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                  {openMenu === schedule.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-20 py-1 animate-fade-in">
                      <Link href={`/availability/${schedule.id}`}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface)]"
                        onClick={() => setOpenMenu(null)}>
                        <Pencil size={13} /> Edit
                      </Link>
                      <button onClick={() => handleDelete(schedule.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-[var(--surface)]">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <p className="text-xs text-center text-[var(--text-muted)] mt-4">
              Temporarily out-of-office? <span className="underline cursor-pointer">Add a date override</span>
            </p>
          </div>
        )}

        <Modal open={showNew} onClose={() => setShowNew(false)} title="New schedule">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Schedule name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Modal>
        {openMenu !== null && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}
      </div>
    </DashboardLayout>
  );
}
