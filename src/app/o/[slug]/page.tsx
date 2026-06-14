import { redirect } from "next/navigation";

export default async function OrgIndex({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/o/${slug}/dashboard`);
}
