"""Serviço de envio de SMS via Africa's Talking.

Configurar no .env:
    SMS_API_KEY=<chave da Africa's Talking>
    SMS_USERNAME=<username da AT — "sandbox" para testes>
    SMS_SENDER_ID=KUBICO
"""
import json
import urllib.parse
import urllib.request

from app.core.config import settings


def send_sms(destinatario: str, mensagem: str) -> bool:
    """Envia SMS via Africa's Talking. Retorna True em sucesso."""
    if not settings.SMS_API_KEY:
        print(f"[SMS SKIP — sem API key] Para: {destinatario} | Msg: {mensagem}")
        return False
    try:
        payload = {
            "username": settings.SMS_USERNAME,
            "to": destinatario,
            "message": mensagem,
        }
        if settings.SMS_SENDER_ID:
            payload["from"] = settings.SMS_SENDER_ID

        data = urllib.parse.urlencode(payload).encode()
        req = urllib.request.Request(
            "https://api.africastalking.com/version1/messaging",
            data=data,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
                "apiKey": settings.SMS_API_KEY,
            },
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode())
            recipients = body.get("SMSMessageData", {}).get("Recipients", [])
            # statusCode 101 = Request Queued (AT standard)
            if any(r.get("statusCode") == 101 for r in recipients):
                return True
            print(f"[SMS WARN] Resposta inesperada: {body}")
            return False
    except Exception as exc:
        print(f"[SMS ERROR] {exc}")
        return False
