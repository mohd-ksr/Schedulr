"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { bookingsAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { Clock, Calendar, CheckCircle, XCircle } from "lucide-react";

export default function CancelPage() {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    bookingsAPI.getByToken(token)
      .then(res => {
        setBooking(res.data);
        if (res.data.status === "cancelled") setCancelled(true);
      })
      .catch(() => setError("Booking not found or already cancelled."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(true);
    try {
      await bookingsAPI.cancelByToken(token, reason);
      setCancelled(true);
    } catch { setError("Failed to cancel. Please try again."); }
    finally { setCancelling(false); }
  };

  if (loading) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[var(--text)] border-t-transparent rounded-full animate-spin" /></div>;

  if (error) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="text-center">
        <XCircle size={40} className="text-red-500 mx-auto mb-3" />
        <p className="text-[var(--text)] font-semibold">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8">
        {cancelled ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} className="text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text)] mb-2">Booking Cancelled</h1>
            <p className="text-sm text-[var(--text-secondary)]">Your booking has been successfully cancelled.</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-[var(--text)] mb-1">Cancel booking</h1>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Are you sure you want to cancel this booking?</p>

            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 mb-5 space-y-3">
              <p className="font-semibold text-[var(--text)] text-sm">{booking?.event_type?.title}</p>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Calendar size={13} />
                {booking && format(new Date(booking.start_time), "EEEE, MMMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Clock size={13} />
                {booking && `${format(new Date(booking.start_time), "h:mm a")} – ${format(new Date(booking.end_time), "h:mm a")}`}
              </div>
              <p className="text-sm text-[var(--text-secondary)]">with {booking?.guest_name}</p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Reason (optional)</label>
              <textarea
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Let the host know why you're cancelling..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text)] text-sm outline-none focus:border-[var(--text-secondary)] resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => window.history.back()}>Keep booking</Button>
              <Button variant="danger" className="flex-1" loading={cancelling} onClick={handleCancel}>Cancel booking</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
