import type { ParsedLesson } from "@/lib/parser-client";

export type ScheduleJsonEntry = {
  date: string;
  timeStart: string;
  timeEnd: string;
  subject: string;
  room?: string | null;
  kind?: string | null;
  teacher?: string | null;
};

export type ScheduleJsonV1 = {
  formatVersion: string;
  organizationSlug: string;
  studyGroup: string;
  studyGroupExternalKey?: string | null;
  generatedAt?: string;
  entries: ScheduleJsonEntry[];
};

export function parseScheduleJson(raw: string): { data: ScheduleJsonV1 } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Невалидный JSON." };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { error: "Корень документа должен быть объектом." };
  }

  const doc = parsed as Record<string, unknown>;
  if (doc.formatVersion !== "1.0") {
    return { error: 'formatVersion должен быть "1.0".' };
  }
  if (typeof doc.organizationSlug !== "string" || !doc.organizationSlug.trim()) {
    return { error: "organizationSlug обязателен." };
  }
  if (typeof doc.studyGroup !== "string" || !doc.studyGroup.trim()) {
    return { error: "studyGroup обязателен." };
  }
  if (!Array.isArray(doc.entries) || doc.entries.length === 0) {
    return { error: "entries — непустой массив." };
  }

  const entries: ScheduleJsonEntry[] = [];
  for (let i = 0; i < doc.entries.length; i++) {
    const e = doc.entries[i];
    if (!e || typeof e !== "object") {
      return { error: `entries[${i}] — объект.` };
    }
    const row = e as Record<string, unknown>;
    if (typeof row.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
      return { error: `entries[${i}].date — YYYY-MM-DD.` };
    }
    if (typeof row.timeStart !== "string" || typeof row.timeEnd !== "string") {
      return { error: `entries[${i}] — timeStart/timeEnd обязательны.` };
    }
    if (typeof row.subject !== "string" || !row.subject.trim()) {
      return { error: `entries[${i}].subject обязателен.` };
    }
    entries.push({
      date: row.date,
      timeStart: row.timeStart,
      timeEnd: row.timeEnd,
      subject: row.subject.trim(),
      room: typeof row.room === "string" ? row.room : null,
      kind: typeof row.kind === "string" ? row.kind : null,
      teacher: typeof row.teacher === "string" ? row.teacher : null,
    });
  }

  return {
    data: {
      formatVersion: "1.0",
      organizationSlug: doc.organizationSlug.trim(),
      studyGroup: doc.studyGroup.trim(),
      studyGroupExternalKey:
        typeof doc.studyGroupExternalKey === "string" ? doc.studyGroupExternalKey : null,
      generatedAt: typeof doc.generatedAt === "string" ? doc.generatedAt : undefined,
      entries,
    },
  };
}

export function scheduleJsonToLessons(json: ScheduleJsonV1): ParsedLesson[] {
  return json.entries.map((e) => ({
    date: e.date,
    time_start: e.timeStart,
    time_end: e.timeEnd,
    subject: e.subject,
    room: e.room ?? null,
    kind: e.kind ?? null,
    teacher: e.teacher ?? null,
  }));
}
