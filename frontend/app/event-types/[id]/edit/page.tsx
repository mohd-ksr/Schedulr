"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { eventTypesAPI } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, Clock, MapPin, Globe } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

const COLORS = ["#0ea5e9","#10b981","#8b5cf6","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16"];
const LOCATION_TYPES = [
  { value: "google_meet", label: "Google Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "phone", label: "Phone" },
  { value: "in_person", label: "In Person" },
  { value: "custom", label: "Custom" },
];

export default function EditEventTypePage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    eventTypesAPI.get(Number(id))
      .then(res => setForm(res.data))
      .catch(() => { toast("Event type not found", "error"); router.push("/event-types"); })
      .finally(() => setLoading(false));
  }, [id]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p: any) => ({ ...p, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await eventTypesAPI.update(Number(id), form);
      toast("Event type saved!");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to save", "error");
    } finally { setSaving(false); }
  };

  if (loading || !form) {
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
          <Link href="/event-types" className="text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text)]">{form.title}</h1>
            <p className="text-sm text-[var(--text-secondary)]">Edit event type settings</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Basic Info */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4">
            <h3 className="font-semibold text-[var(--text)] text-sm">Basic information</h3>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Title</label>
              <input value={form.title} onChange={set("title")} required
                className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Description</label>
              <textarea value={form.description || ""} onChange={set("description")} rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)] resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">URL Slug</label>
              <input value={form.slug} onChange={set("slug")} required
                className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]" />
            </div>
          </div>

          {/* Duration & Color */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4">
            <h3 className="font-semibold text-[var(--text)] text-sm">Duration & Appearance</h3>
            <div className="flex items-center gap-3">
              <Clock size={15} className="text-[var(--text-muted)]" />
              <label className="text-sm text-[var(--text)]">Duration</label>
              <input type="number" min={5} max={480} value={form.duration}
                onChange={e => setForm((p: any) => ({ ...p, duration: parseInt(e.target.value) || 30 }))}
                className="w-24 px-3 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]" />
              <span className="text-sm text-[var(--text-muted)]">minutes</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Color</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm((p: any) => ({ ...p, color: c }))}
                    className={clsx("w-7 h-7 rounded-full transition-all", form.color === c && "ring-2 ring-offset-2 ring-offset-[var(--card)] ring-white")}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4">
            <h3 className="font-semibold text-[var(--text)] text-sm">Location</h3>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Location type</label>
              <select value={form.location_type} onChange={set("location_type")}
                className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]">
                {LOCATION_TYPES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          {/* Advanced */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4">
            <h3 className="font-semibold text-[var(--text)] text-sm">Advanced</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Hide from profile</p>
                <p className="text-xs text-[var(--text-secondary)]">Won't show on your public profile page</p>
              </div>
              <Toggle checked={form.is_hidden} onChange={v => setForm((p: any) => ({ ...p, is_hidden: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Buffer before (min)</label>
                <input type="number" min={0} value={form.buffer_before}
                  onChange={e => setForm((p: any) => ({ ...p, buffer_before: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Buffer after (min)</label>
                <input type="number" min={0} value={form.buffer_after}
                  onChange={e => setForm((p: any) => ({ ...p, buffer_after: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Min notice (min)</label>
                <input type="number" min={0} value={form.min_booking_notice}
                  onChange={e => setForm((p: any) => ({ ...p, min_booking_notice: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Max days in advance</label>
                <input type="number" min={1} value={form.max_booking_days}
                  onChange={e => setForm((p: any) => ({ ...p, max_booking_days: parseInt(e.target.value) || 60 }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Link href="/event-types"><Button type="button" variant="secondary">Cancel</Button></Link>
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
