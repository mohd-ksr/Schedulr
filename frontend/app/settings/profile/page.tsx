"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { usersAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const TIMEZONES = ["UTC","America/New_York","America/Chicago","America/Los_Angeles","Europe/London","Europe/Paris","Asia/Kolkata","Asia/Singapore","Asia/Tokyo","Australia/Sydney"];

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", bio: "", timezone: "UTC", avatar_url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name, bio: user.bio || "", timezone: user.timezone, avatar_url: user.avatar_url || "" });
  }, [user]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usersAPI.updateMe(form);
      setUser(res.data);
      toast("Profile updated!");
    } catch { toast("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/settings" className="text-[var(--text-secondary)] hover:text-[var(--text)]">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text)]">Profile</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage settings for your profile</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {form.name?.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text)] mb-1">Profile picture</p>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm">Upload avatar</Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Username</label>
              <div className="flex items-center rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] overflow-hidden">
                <span className="px-3 py-2 text-sm text-[var(--text-muted)] border-r border-[var(--input-border)]">cal.com/</span>
                <span className="px-3 py-2 text-sm text-[var(--text)]">{user?.username}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Full name</label>
              <input value={form.name} onChange={set("name")}
                className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Email</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)]">
                  <span className="text-sm text-[var(--text)]">{user?.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Primary</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Bio</label>
              <textarea value={form.bio} onChange={set("bio")} rows={3} placeholder="Tell people a bit about yourself..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)] resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Timezone</label>
              <select value={form.timezone} onChange={set("timezone")}
                className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)]">
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-semibold text-[var(--text)] text-sm mb-1">Danger zone</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-3">Be careful. Account deletion cannot be undone.</p>
            <Button type="button" variant="danger" size="sm">Delete account</Button>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Update</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
