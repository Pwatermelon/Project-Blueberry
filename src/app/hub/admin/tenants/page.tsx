import { auth } from "@/auth";
import { HubTenantRegistryPanel } from "@/components/hub-tenant-registry-panel";
import { isHubRootAdminEmail, getHubRootAdminEmail } from "@/lib/hub-root";
import { listAllRegisteredTenants } from "@/lib/hub-registry";
import { redirect } from "next/navigation";

export default async function HubAdminTenantsPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?redirectTo=/hub/admin/tenants");
  }
  if (!isHubRootAdminEmail(session.user.email)) {
    redirect("/");
  }

  const tenants = await listAllRegisteredTenants();
  const rootEmail = getHubRootAdminEmail();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Реестр вузов</h1>
        <p className="mt-2 text-zinc-400">
          Root hub ({rootEmail}): добавляете мета и домен реплики после того, как вуз развернул
          дистрибутив у себя. Все операционные данные — на их сервере.
        </p>
      </div>
      <HubTenantRegistryPanel tenants={tenants} />
    </div>
  );
}
