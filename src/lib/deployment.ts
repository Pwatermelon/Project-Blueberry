export type DeploymentMode = "tenant" | "hub" | "all";

export function getDeploymentMode(): DeploymentMode {
  const v = process.env.DEPLOYMENT_MODE?.toLowerCase();
  if (v === "hub") return "hub";
  if (v === "tenant") return "tenant";
  return "all";
}

export function isHubDeploy(mode = getDeploymentMode()): boolean {
  return mode === "hub";
}

export function isTenantDeploy(mode = getDeploymentMode()): boolean {
  return mode === "tenant";
}

export function isAllInOneDeploy(mode = getDeploymentMode()): boolean {
  return mode === "all";
}

export function getTenantSlug(): string | undefined {
  return process.env.TENANT_SLUG || undefined;
}

export function getHubBaseUrl(orgHubUrl?: string | null): string | undefined {
  if (isHubDeploy()) {
    return process.env.AUTH_URL || process.env.NEXTAUTH_URL || undefined;
  }
  return orgHubUrl || process.env.HUB_BASE_URL || undefined;
}

export function isHubEnabled(mode = getDeploymentMode()): boolean {
  return mode === "hub" || mode === "all";
}

export function getPublicSiteUrl(): string | undefined {
  return process.env.AUTH_URL || process.env.NEXTAUTH_URL || undefined;
}
