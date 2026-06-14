import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isHubEnabled } from "@/lib/deployment";

export async function GET() {
  if (!isHubEnabled()) {
    return NextResponse.json([], { status: 200 });
  }
  const channels = await prisma.federatedChannel.findMany({
    where: { isPublic: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true },
  });
  return NextResponse.json(channels);
}
