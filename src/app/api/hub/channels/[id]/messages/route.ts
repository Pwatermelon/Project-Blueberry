import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isHubEnabled } from "@/lib/deployment";
import {
  ensureLocalHubProfile,
  isHubSyncAuthorized,
  postMessageToHub,
} from "@/lib/hub-sync";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isHubEnabled()) {
    return NextResponse.json([], { status: 200 });
  }
  const { id } = await ctx.params;
  const messages = await prisma.federatedMessage.findMany({
    where: { channelId: id },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      profile: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      profile: m.profile,
      meta: m.meta,
    })),
  );
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isHubEnabled()) {
    return NextResponse.json({ error: "Hub disabled" }, { status: 503 });
  }

  const { id: channelId } = await ctx.params;
  let profileId: string | undefined;
  let body = "";
  let meta: Record<string, unknown> = {};

  if (isHubSyncAuthorized(req.headers.get("x-hub-sync-secret"))) {
    try {
      const payload = await req.json();
      profileId = payload.profileId;
      body = String(payload.body ?? "");
      meta = (payload.meta && typeof payload.meta === "object" ? payload.meta : {}) as Record<
        string,
        unknown
      >;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  } else {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    profileId =
      (await ensureLocalHubProfile(session.user.id, session.user.email, session.user.name)) ??
      undefined;
    try {
      const payload = await req.json();
      body = String(payload.body ?? "");
      meta = (payload.meta && typeof payload.meta === "object" ? payload.meta : {}) as Record<
        string,
        unknown
      >;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const result = await postMessageToHub({ channelId, profileId, body, meta });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
