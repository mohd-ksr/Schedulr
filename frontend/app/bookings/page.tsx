"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { bookingsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Calendar, Clock, Mail, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";

type Tab = "upcoming" | "past" | "cancelled";

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_notes?: string;
  start_time: string;
  end_time: string;
  status: string;
  cancel_token: string;
  event_type: { title: string; duration: number; color: string };
}

export default function BookingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await bookingsAPI.adminList();
      setUpcoming(res.data.upcoming);
      setPast(res.data.past);
    } catch { toast("Failed to load bookings", "error"); }
    finally { setLoading(false); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(id);
    try {
      await bookingsAPI.adminCancel(id);
      setUpcoming(prev => prev.filter(b => b.id !== id));
      toast("Booking cancelled");
      fetchBookings();
    } catch { toast("Failed to cancel", "error"); }
    finally { setCancelling(null); }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Canceled" },
  ];

  const allBookings = tab === "upcoming" ? upcoming
    : tab === "past" ? past.filter(b => b.status !== "cancelled")
    : past.filter(b => b.status === "cancelled");

  const filtered = allBookings.filter(b =>
    b.guest_name.toLowerCase().includes(search.toLowerCase()) ||
    b.guest_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={clsx(
                  "px-4 py-2 text-sm rounded-lg font-medium transition-colors",
                  tab === t.key
                    ? "bg-[var(--text)] text-[var(--bg)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search bookings..."
                className="pl-3 pr-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] outline-none focus:border-[var(--text-secondary)] w-52"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter size={13} /> Filter
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-[var(--text)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center mb-3">
              <Calendar size={20} className="text-[var(--text-muted)]" />
            </div>
            <p className="font-semibold text-[var(--text)]">No {tab} bookings</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {tab === "upcoming" ? "As soon as someone books a time with you it will show up here." : "No bookings in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(booking => (
              <div key={booking.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 hover:bg-[var(--surface)] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-12 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: booking.event_type.color }} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[var(--text)] text-sm">{booking.guest_name}</p>
                        <span className={clsx(
                          "text-xs px-2 py-0.5 rounded-full",
                          booking.status === "confirmed" ? "bg-green-500/10 text-green-500" :
                          booking.status === "cancelled" ? "bg-red-500/10 text-red-500" :
                          "bg-yellow-500/10 text-yellow-500"
                        )}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{booking.event_type.title}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {format(new Date(booking.start_time), "EEE, MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {format(new Date(booking.start_time), "h:mm a")} – {format(new Date(booking.end_time), "h:mm a")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail size={11} />
                          {booking.guest_email}
                        </span>
                      </div>
                      {booking.guest_notes && (
                        <p className="text-xs text-[var(--text-muted)] mt-1.5 italic">"{booking.guest_notes}"</p>
                      )}
                    </div>
                  </div>
                  {booking.status === "confirmed" && tab === "upcoming" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(booking.id)}
                      loading={cancelling === booking.id}
                      className="text-red-500 hover:text-red-400 shrink-0"
                    >
                      <X size={13} /> Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
