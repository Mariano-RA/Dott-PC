"""Normalización compartida de descripción / atributos entre proveedores."""
from __future__ import annotations

import html
import re
from typing import Any, Dict, List, Optional, Tuple

_DESC_ROW_NAMES = frozenset({"descripcion", "descripción", "description"})

# "Nombre: Valor" en una línea.
_KV_LINE = re.compile(r"^([^:\n]{1,80}?)\s*:\s*(.+)$")
# "Nombre: Valor. Nombre: Valor" (estilo Elit descripcion).
_KV_SENTENCE = re.compile(r"([^.]{1,80}?)\s*:\s*([^.]+?)(?=\s*\.\s*[^.]{1,80}?\s*:|$)")


def clean_plain_text(raw: Any) -> Optional[str]:
    """Texto plano uniforme: entidades HTML, NBSP, espacios y saltos de línea."""
    if raw is None:
        return None
    text = html.unescape(str(raw))
    text = text.replace("\xa0", " ").replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = text.strip()
    return text or None


def normalize_atributos_list(raw: Any) -> Optional[List[Dict[str, str]]]:
    """Normaliza lista heterogénea a [{nombre, valor}].

    Acepta claves ``nombre`` o ``atributo`` (Elit API usa ``atributo``).
    """
    if not isinstance(raw, list) or not raw:
        return None
    out: List[Dict[str, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        nombre = str(
            item.get("nombre") or item.get("atributo") or item.get("name") or ""
        ).strip()
        valor = str(item.get("valor") or item.get("value") or "").strip()
        nombre = clean_plain_text(nombre) or ""
        valor = clean_plain_text(valor) or ""
        if not nombre and not valor:
            continue
        if nombre.lower() in _DESC_ROW_NAMES:
            continue
        out.append({"nombre": nombre, "valor": valor})
    return out or None


def _atributos_from_kv_lines(text: str) -> Optional[List[Dict[str, str]]]:
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    if len(lines) < 2:
        return None
    attrs: List[Dict[str, str]] = []
    for ln in lines:
        m = _KV_LINE.match(ln)
        if not m:
            return None
        nombre = m.group(1).strip()
        valor = m.group(2).strip()
        if nombre.lower() in _DESC_ROW_NAMES:
            continue
        if nombre or valor:
            attrs.append({"nombre": nombre, "valor": valor})
    return attrs or None


def _atributos_from_kv_sentences(text: str) -> Optional[List[Dict[str, str]]]:
    """Parsea 'Tipo: Aire. Color: Negro' (sin saltos) a atributos."""
    if "\n" in text or text.count(":") < 2:
        return None
    attrs: List[Dict[str, str]] = []
    for m in _KV_SENTENCE.finditer(text):
        nombre = m.group(1).strip(" .")
        valor = m.group(2).strip(" .")
        if not nombre and not valor:
            continue
        if nombre.lower() in _DESC_ROW_NAMES:
            continue
        attrs.append({"nombre": nombre, "valor": valor})
    return attrs if len(attrs) >= 2 else None


def split_text_to_descripcion_atributos(
    raw: Any,
) -> Tuple[Optional[str], Optional[List[Dict[str, str]]]]:
    """Intenta separar texto libre en descripcion + atributos estructurados.

    - Varias líneas ``Nombre: Valor`` → atributos
    - Cadena ``A: B. C: D`` (estilo Elit) → atributos
    - Caso contrario → descripcion (texto limpio)
    """
    text = clean_plain_text(raw)
    if not text:
        return None, None

    attrs = _atributos_from_kv_lines(text)
    if attrs:
        return None, attrs

    attrs = _atributos_from_kv_sentences(text)
    if attrs:
        return None, attrs

    return text, None
