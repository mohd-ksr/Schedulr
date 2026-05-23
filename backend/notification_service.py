"""
Notification Service
====================
Sends transactional emails for:
- Booking confirmation (to guest + host)
- Cancellation notice
- Reminder (can be triggered by a scheduler/cron)

Uses aiosmtplib for async email sending.
Falls back silently if SMTP is not configured — emails are
a bonus feature, core booking flow must never fail due to this.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from zoneinfo import ZoneInfo
from app.core.config import settings
from app.models.booking import Booking
from app.models.event_type import EventType


def _send_email(to: str, subject: str, html_body: str) -> None:
    """
    Simple synchronous SMTP send.
    Raises on failure — callers should catch and ignore if email is optional.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[EMAIL SKIPPED] No SMTP configured. Would send to {to}: {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, to, msg.as_string())


def _format_dt(dt, tz_name: str) -> str:
    """Format datetime in the given timezone for human display."""
    try:
        tz = ZoneInfo(tz_name)
        local = dt.astimezone(tz)
        return local.strftime("%A, %B %d, %Y at %I:%M %p %Z")
    except Exception:
        return str(dt)


def send_booking_confirmation(booking: Booking, event_type: EventType) -> None:
    """Send confirmation to the guest."""
    time_str = _format_dt(booking.start_time, booking.guest_timezone)
    subject = f"Booking Confirmed: {event_type.title}"
    cancel_link = f"{settings.FRONTEND_URL}/cancel/{booking.cancel_token}"
    reschedule_link = f"{settings.FRONTEND_URL}/reschedule/{booking.reschedule_token}"

    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #0EA5E9;">Your booking is confirmed!</h2>
      <p>Hi {booking.guest_name},</p>
      <p>Your <strong>{event_type.title}</strong> is scheduled for:</p>
      <p style="font-size: 18px; color: #111;"><strong>{time_str}</strong></p>
      <p>Duration: {event_type.duration} minutes</p>
      {"<p>Meeting URL: <a href='" + booking.meeting_url + "'>" + booking.meeting_url + "</a></p>" if booking.meeting_url else ""}
      <hr/>
      <p>
        <a href="{reschedule_link}" style="color: #0EA5E9;">Reschedule</a> &nbsp;|&nbsp;
        <a href="{cancel_link}" style="color: #ef4444;">Cancel</a>
      </p>
    </div>
    """
    _send_email(booking.guest_email, subject, html)


def send_cancellation_email(booking: Booking, reason: str | None = None) -> None:
    """Send cancellation notice to the guest."""
    subject = "Booking Cancelled"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #ef4444;">Your booking has been cancelled</h2>
      <p>Hi {booking.guest_name},</p>
      <p>Your booking on <strong>{booking.start_time.strftime("%B %d, %Y")}</strong> has been cancelled.</p>
      {"<p>Reason: " + reason + "</p>" if reason else ""}
      <p>You can book a new time at any time.</p>
    </div>
    """
    _send_email(booking.guest_email, subject, html)
