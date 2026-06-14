/**
 * Импорт учебных групп из tenants/{slug}/data/links.csv
 * Формат CSV СГТУ: URL,название_группы (первая строка — заголовок)
 *
 * npx tsx scripts/import-tenant-groups.ts sstu
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { resolveTenantDataPath } from "../src/lib/tenant-pack";

const prisma = new PrismaClient();

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: tsx scripts/import-tenant-groups.ts <tenant-slug>");
    process.exit(1);
  }

  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) {
    console.error(`Organization not found: ${slug}`);
    process.exit(1);
  }

  const csvPath = resolveTenantDataPath(slug, "data/links.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`Missing ${csvPath}`);
    process.exit(1);
  }

  const lines = fs.readFileSync(csvPath, "utf-8").split(/\r?\n/).filter(Boolean);
  let imported = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const comma = line.indexOf(",");
    if (comma < 0) continue;
    const url = line.slice(0, comma).trim();
    const name = line.slice(comma + 1).trim();
    const m = url.match(/\/group\/(\d+)/);
    const externalKey = m?.[1];
    if (!name || !externalKey) continue;

    await prisma.studyGroup.upsert({
      where: { organizationId_name: { organizationId: org.id, name } },
      update: { externalKey },
      create: { organizationId: org.id, name, externalKey },
    });
    imported++;
  }

  console.log(`Imported/updated ${imported} groups for ${slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
