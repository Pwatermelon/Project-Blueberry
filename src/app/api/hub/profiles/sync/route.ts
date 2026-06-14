import { NextResponse } from "next/server";
import { isHubSyncAuthorized, upsertFederatedProfileWithTenants } from "@/lib/hub-sync";
import { isHubEnabled } from "@/lib/deployment";
import type { HubTenantRef } from "@/lib/hub-sync";

export async function POST(req: Request) {
  if (!isHubEnabled()) {
    return NextResponse.json({ error: "Hub disabled" }, { status: 503 });
  }
  if (!isHubSyncAuthorized(req.headers.get("x-hub-sync-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    email?: string;
    name?: string | null;
    avatarUrl?: string | null;
    tenants?: HubTenantRef[];
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.email?.includes("@")) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const profile = await upsertFederatedProfileWithTenants({
    email: payload.email,
    name: payload.name,
    avatarUrl: payload.avatarUrl,
    tenants: payload.tenants,
  });

  return NextResponse.json({ profileId: profile.id });
}
