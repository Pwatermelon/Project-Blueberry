import { normalizeEmail } from "@/lib/org-email-binding";

export function getHubRootAdminEmail(): string | undefined {
  const raw = (process.env.HUB_ROOT_ADMIN_EMAIL || process.env.ROOT_ADMIN_EMAIL)?.trim();
  return raw ? normalizeEmail(raw) : undefined;
}

export function isHubRootAdminEmail(email: string): boolean {
  const root = getHubRootAdminEmail();
  return Boolean(root && normalizeEmail(email) === root);
}
