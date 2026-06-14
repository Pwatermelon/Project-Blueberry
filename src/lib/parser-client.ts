export type ParsedLesson = {
  date: string;
  time_start: string;
  time_end: string;
  room: string | null;
  subject: string;
  kind: string | null;
  teacher: string | null;
};

export type ParseResponse = {
  source: string;
  group_id: number | null;
  lessons: ParsedLesson[];
  warnings?: string[];
};

export async function fetchSstuSchedule(groupId: number): Promise<ParseResponse> {
  const base = process.env.PARSER_URL ?? "http://127.0.0.1:8081";
  const url = `${base.replace(/\/$/, "")}/parse/sstu/${groupId}`;
  const res = await fetch(url, { cache: "no-store", next: { revalidate: 0 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Парсер вернул ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<ParseResponse>;
}

export async function postSstuLegacyTxt(body: string): Promise<ParseResponse> {
  const base = process.env.PARSER_URL ?? "http://127.0.0.1:8081";
  const url = `${base.replace(/\/$/, "")}/parse/sstu-txt`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Парсер вернул ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<ParseResponse>;
}
