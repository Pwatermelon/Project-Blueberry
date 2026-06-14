"""
Парсер расписания СГТУ (rasp.sstu.ru).
- GET /parse/sstu/{group_id} — загрузка HTML и разбор таблицы + эвристики.
- POST /parse/sstu-txt — разбор legacy-формата .txt (старый текстовый формат расписания).
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Any

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, Request, Response
from pydantic import BaseModel

app = FastAPI(title="Цифровой ВУЗ — парсер расписания СГТУ", version="1.0.0")

TIME_RE = re.compile(
    r"^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})",
    re.UNICODE,
)


class Lesson(BaseModel):
    date: str
    time_start: str
    time_end: str
    room: str | None
    subject: str
    kind: str | None
    teacher: str | None


def _year_for_day_month(day: int, month: int, ref: datetime | None = None) -> int:
    ref = ref or datetime.now()
    y = ref.year
    try:
        candidate = datetime(y, month, day)
    except ValueError:
        return y
    if candidate < ref.replace(month=1, day=1):
        return y + 1
    return y


def parse_legacy_txt(text: str, ref: datetime | None = None) -> tuple[list[Lesson], list[str]]:
    """Формат строк: DD.MM=День_недели=...уроки, разделённые '=='."""
    warnings: list[str] = []
    out: list[Lesson] = []
    ref = ref or datetime.now()

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        m = re.match(r"^(\d{2})\.(\d{2})=([^=]*)=(.*)$", line)
        if not m:
            warnings.append(f"Пропуск строки (неизвестный формат): {line[:60]}...")
            continue
        d_s, mo_s, _weekday, rest = m.groups()
        day, month = int(d_s), int(mo_s)
        year = _year_for_day_month(day, month, ref)
        date_iso = f"{year:04d}-{month:02d}-{day:02d}"

        chunks = [c.strip() for c in rest.split("==") if c.strip()]
        for chunk in chunks:
            t_m = TIME_RE.match(chunk)
            if not t_m:
                continue
            ts, te = t_m.group(1), t_m.group(2)
            tail = chunk[t_m.end() :].lstrip("—").lstrip("-").lstrip(";")
            parts = [p.strip() for p in tail.split(";") if p.strip()]
            room = parts[0] if parts else None
            subject = parts[1] if len(parts) > 1 else (parts[0] if parts else "Без названия")
            kind = None
            for p in parts:
                inner = re.search(r"\(([^)]+)\)", p)
                if inner:
                    kind = inner.group(1)
                    break
            teacher = parts[-1] if len(parts) > 2 else None
            if subject and len(parts) > 2 and parts[-1] == subject:
                teacher = None

            out.append(
                Lesson(
                    date=date_iso,
                    time_start=ts,
                    time_end=te,
                    room=room,
                    subject=subject,
                    kind=kind,
                    teacher=teacher,
                )
            )

    return out, warnings


def parse_html_sstu(html: str) -> tuple[list[Lesson], list[str]]:
    """
    Заготовка под разметку rasp.sstu.ru. Сайт может отдавать SPA без таблиц в HTML —
    тогда список пустой: используйте legacy-текст или ручной ввод на платформе.
    """
    warnings: list[str] = []
    out: list[Lesson] = []
    soup = BeautifulSoup(html, "lxml")

    for tr in soup.find_all("tr"):
        row = " ".join(tr.stripped_strings)
        dm = re.search(r"\b(\d{2})\.(\d{2})\.(\d{4})\b", row)
        if not dm:
            dm2 = re.match(r"^(\d{2})\.(\d{2})\s+", row.strip())
            if dm2:
                d_, m_ = dm2.group(1), dm2.group(2)
                y = _year_for_day_month(int(d_), int(m_))
                date_iso = f"{y:04d}-{int(m_):02d}-{int(d_):02d}"
            else:
                continue
        else:
            date_iso = f"{dm.group(3)}-{dm.group(2)}-{dm.group(1)}"

        t_m = TIME_RE.search(row)
        if not t_m:
            continue
        ts, te = t_m.group(1), t_m.group(2)
        tail = row[t_m.end() :].strip()
        parts = [p.strip() for p in re.split(r"[;]", tail) if p.strip()]
        room = parts[0] if parts else None
        subject = parts[1] if len(parts) > 1 else tail[:200]
        out.append(
            Lesson(
                date=date_iso,
                time_start=ts,
                time_end=te,
                room=room,
                subject=subject,
                kind=None,
                teacher=parts[-1] if len(parts) > 2 else None,
            )
        )

    if not out:
        warnings.append(
            "Авто-разбор HTML не нашёл пар с датой и временем. "
            "Сохраните расписание в формате legacy .txt и отправьте на POST /parse/sstu-txt."
        )
    return out, warnings


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/parse/sstu/{group_id}")
async def parse_sstu(group_id: int) -> dict[str, Any]:
    url = f"https://rasp.sstu.ru/rasp/group/{group_id}"
    warnings: list[str] = []
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        try:
            r = await client.get(url)
            r.raise_for_status()
            html = r.text
        except Exception as e:  # noqa: BLE001
            return {
                "source": "sstu",
                "group_id": group_id,
                "lessons": [],
                "warnings": [f"Не удалось загрузить {url}: {e}"],
            }

    lessons, w_html = parse_html_sstu(html)
    warnings.extend(w_html)
    if not lessons and re.search(r"\d{2}\.\d{2}=", html) and "==" in html:
        lessons, w_txt = parse_legacy_txt(html)
        warnings.extend(w_txt)
        if lessons:
            warnings.insert(0, "Использован fallback: текст похож на legacy-формат внутри ответа страницы.")
    if not lessons:
        warnings.append("Попробуйте POST /parse/sstu-txt с файлом в legacy-формате (как calendars/*.txt в старом проекте).")
    return {
        "source": "sstu",
        "group_id": group_id,
        "lessons": [L.model_dump() for L in lessons],
        "warnings": warnings,
    }


@app.post("/parse/sstu-txt")
async def parse_sstu_txt(request: Request) -> dict[str, Any]:
    body = await request.body()
    text = body.decode("utf-8", errors="replace")
    lessons, warnings = parse_legacy_txt(text)
    return {
        "source": "sstu-legacy-txt",
        "group_id": None,
        "lessons": [L.model_dump() for L in lessons],
        "warnings": warnings,
    }


@app.get("/")
def root() -> Response:
    return Response("Парсер расписания СГТУ (Цифровой ВУЗ) — см. /docs", media_type="text/plain; charset=utf-8")
