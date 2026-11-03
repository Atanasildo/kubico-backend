"""Serviço de envio de email via SMTP."""
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def _build_message(to: str, subject: str, html_body: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    return msg


def send_email(to: str, subject: str, html_body: str) -> bool:
    """Envia email via SMTP. Retorna True em sucesso."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print(f"[EMAIL SKIP — sem SMTP config] Para: {to} | Assunto: {subject}")
        return False
    try:
        context = ssl.create_default_context()
        msg = _build_message(to, subject, html_body)
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context) as srv:
                srv.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                srv.send_message(msg)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as srv:
                srv.ehlo()
                srv.starttls(context=context)
                srv.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                srv.send_message(msg)
        return True
    except Exception as exc:
        print(f"[EMAIL ERROR] {exc}")
        return False


# ── Templates ────────────────────────────────────────────────────────────────

def html_verificacao_email(codigo: str) -> str:
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="margin:0 0 8px;color:#1a1a1a">Verificação de conta</h2>
  <p style="color:#555;margin:0 0 24px">Introduza este código na aplicação Kubico:</p>
  <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#e05c00;text-align:center;padding:20px 0;background:#fff8f5;border-radius:8px">{codigo}</div>
  <p style="color:#999;font-size:12px;margin-top:24px">Válido por 10 minutos. Se não solicitou este código, ignore este email.</p>
</div>
</body></html>"""


def html_reset_senha(link: str) -> str:
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <h2 style="margin:0 0 8px;color:#1a1a1a">Recuperação de senha — Kubico</h2>
  <p style="color:#555;margin:0 0 24px">Clique no botão abaixo para definir uma nova senha. O link expira em 30 minutos.</p>
  <a href="{link}" style="display:inline-block;padding:14px 32px;background:#e05c00;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
    Redefinir senha
  </a>
  <p style="color:#999;font-size:12px;margin-top:32px">Se não pediu esta alteração, pode ignorar este email com segurança.</p>
</div>
</body></html>"""
