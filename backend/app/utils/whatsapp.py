"""Gera links wa.me com mensagem pré-formatada para contacto directo."""

import re
from urllib.parse import quote


def _normalize_phone(telefone: str) -> str:
    """Remove tudo exceto dígitos; assume +244 se não tiver indicativo."""
    digits = re.sub(r"\D", "", telefone)
    if digits.startswith("244"):
        return digits
    if digits.startswith("0"):
        digits = digits[1:]
    return f"244{digits}"


def build_whatsapp_link(telefone: str, titulo_imovel: str, preco: str, moeda: str, provincia: str, municipio: str) -> str:
    phone = _normalize_phone(telefone)
    message = (
        f"Olá! Tenho interesse no imóvel \"{titulo_imovel}\" "
        f"({preco} {moeda}) em {municipio}, {provincia}. Ainda está disponível?"
    )
    return f"https://wa.me/{phone}?text={quote(message)}"
