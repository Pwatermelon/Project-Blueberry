import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getRootAdminEmail } from "../src/lib/root-admin";
import { bootstrapTenantFromEnv, seedTenantBuildings } from "../src/lib/tenant-bootstrap";
import { seedRegisteredTenantEntry } from "../src/lib/hub-registry";
import {
  loadTenantBuildings,
  loadTenantPack,
  tenantPackToPortalConfig,
} from "../src/lib/tenant-pack";

const prisma = new PrismaClient();

async function main() {
  const tenantOrg = await bootstrapTenantFromEnv();
  const useProductionBootstrap = Boolean(getRootAdminEmail() && process.env.TENANT_SLUG);

  const sstuPack = loadTenantPack("sstu");
  const portalFromPack = sstuPack ? tenantPackToPortalConfig(sstuPack) : {};

  const org =
    tenantOrg ??
    (await prisma.organization.upsert({
      where: { slug: "sstu" },
      update: {
        tenantPackSlug: "sstu",
        hubBaseUrl: process.env.HUB_BASE_URL ?? null,
      },
      create: {
        slug: "sstu",
        name: sstuPack?.name ?? "Саратовский государственный технический университет",
        shortName: sstuPack?.shortName ?? "СГТУ",
        primaryColor: sstuPack?.branding?.primaryColor ?? "#4f46e5",
        accentColor: sstuPack?.branding?.accentColor ?? "#a855f7",
        scheduleSource: "SSTU_RASP",
        sstuGroupId: 55,
        tenantPackSlug: "sstu",
        hubBaseUrl: process.env.HUB_BASE_URL ?? null,
        portalConfig: portalFromPack,
      },
    }));

  const tenantSlug = process.env.TENANT_SLUG ?? "sstu";
  await seedTenantBuildings(org.id, tenantSlug);

  const group = await prisma.studyGroup.upsert({
    where: {
      organizationId_name: { organizationId: org.id, name: "м2-ИФСТ-11" },
    },
    update: { externalKey: "55" },
    create: {
      organizationId: org.id,
      name: "м2-ИФСТ-11",
      externalKey: "55",
    },
  });

  if (!useProductionBootstrap) {
    const hash = await bcrypt.hash("password123", 12);

    const adminEmail = "admin@sstu.local";
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Администратор (демо)",
          passwordHash: hash,
        },
      });
    }
    await prisma.membership.upsert({
      where: {
        userId_organizationId: { userId: admin.id, organizationId: org.id },
      },
      update: { role: "ADMIN", studyGroupId: group.id },
      create: {
        userId: admin.id,
        organizationId: org.id,
        role: "ADMIN",
        studyGroupId: group.id,
      },
    });

    const stEmail = "student@sstu.local";
    let student = await prisma.user.findUnique({ where: { email: stEmail } });
    if (!student) {
      student = await prisma.user.create({
        data: {
          email: stEmail,
          name: "Студент (демо)",
          passwordHash: hash,
        },
      });
    }
    await prisma.membership.upsert({
      where: {
        userId_organizationId: { userId: student.id, organizationId: org.id },
      },
      update: { studyGroupId: group.id },
      create: {
        userId: student.id,
        organizationId: org.id,
        role: "STUDENT",
        studyGroupId: group.id,
      },
    });

    const teacherEmail = "teacher@sstu.local";
    let teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });
    if (!teacher) {
      teacher = await prisma.user.create({
        data: {
          email: teacherEmail,
          name: "Преподаватель (демо)",
          passwordHash: hash,
        },
      });
    }
    await prisma.membership.upsert({
      where: {
        userId_organizationId: { userId: teacher.id, organizationId: org.id },
      },
      update: { role: "TEACHER", studyGroupId: group.id },
      create: {
        userId: teacher.id,
        organizationId: org.id,
        role: "TEACHER",
        studyGroupId: group.id,
      },
    });

    const demoOrg = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "Демонстрационный вуз",
      shortName: "Демо",
      primaryColor: "#0d9488",
      accentColor: "#f59e0b",
      scheduleSource: "MANUAL",
      sstuGroupId: null,
      portalConfig: {
        welcomeBanner: "Второй вуз в сиде — проверка multi-tenant и регистрации.",
        featureFlags: { schedule: true, homework: true, chats: true, map: true, news: true, broadcasts: true },
      },
    },
  });

  await prisma.studyGroup.upsert({
    where: {
      organizationId_name: { organizationId: demoOrg.id, name: "Группа А" },
    },
    update: {},
    create: {
      organizationId: demoOrg.id,
      name: "Группа А",
    },
  });
  }

  const schedCount = await prisma.scheduleEntry.count({ where: { studyGroupId: group.id } });
  if (schedCount === 0) {
    const makeDay = (add: number) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + add);
      return d;
    };
    await prisma.scheduleEntry.createMany({
      data: [
        {
          organizationId: org.id,
          studyGroupId: group.id,
          date: makeDay(1),
          timeStart: "10:00",
          timeEnd: "11:30",
          room: "5/101",
          subject: "Демо: введение (после сида можно заменить импортом)",
          kind: "лек",
          teacher: "Демо-преподаватель",
        },
        {
          organizationId: org.id,
          studyGroupId: group.id,
          date: makeDay(2),
          timeStart: "12:10",
          timeEnd: "13:40",
          room: "5/202",
          subject: "Демо: практическое занятие",
          kind: "прак",
          teacher: "Демо-преподаватель",
        },
        {
          organizationId: org.id,
          studyGroupId: group.id,
          date: makeDay(3),
          timeStart: "09:45",
          timeEnd: "11:15",
          room: "1/316",
          subject: "Демо: иностранный язык",
          kind: "прак",
          teacher: "Демо-преподаватель",
        },
      ],
    });
  }

  const existingRoom = await prisma.chatRoom.findFirst({
    where: { organizationId: org.id, name: "Общий чат" },
  });
  if (!existingRoom) {
    await prisma.chatRoom.create({
      data: {
        organizationId: org.id,
        name: "Общий чат",
      },
    });
  }

  const newsCount = await prisma.newsPost.count({ where: { organizationId: org.id } });
  if (newsCount === 0) {
    await prisma.newsPost.create({
      data: {
        organizationId: org.id,
        title: "Запуск «Цифровой ВУЗ»",
        body: "Платформа переведена на современный стек: Next.js, PostgreSQL, Docker, парсер расписания СГТУ.",
      },
    });
  }

  const bCount = await prisma.campusBuilding.count({ where: { organizationId: org.id } });
  if (bCount === 0) {
    const fromPack = loadTenantBuildings("sstu");
    if (fromPack.length > 0) {
      for (const b of fromPack) {
        await prisma.campusBuilding.create({
          data: {
            organizationId: org.id,
            name: b.name,
            address: b.address,
            lat: b.lat,
            lng: b.lng,
            description: b.description,
            floors: b.floors ?? [],
          },
        });
      }
    } else {
      await prisma.campusBuilding.create({
        data: {
          organizationId: org.id,
          name: "Корпус 1 (пример)",
          address: "ул. Политехническая",
          lat: 51.5335,
          lng: 46.0345,
          description: "Замените на реальные корпуса в tenant pack.",
          floors: [],
        },
      });
    }
  }

  const brCount = await prisma.broadcast.count({ where: { organizationId: org.id } });
  if (brCount === 0) {
    await prisma.broadcast.create({
      data: {
        organizationId: org.id,
        title: "Пример трансляции (замените URL)",
        description: "Вставьте embed-ссылку (YouTube / VK Video) в записи в БД.",
        streamUrl: "https://www.youtube.com/embed/jfKfPfyJRdk",
        startsAt: new Date(),
      },
    });
  }

  const hubChannelCount = await prisma.federatedChannel.count();
  if (hubChannelCount === 0) {
    await prisma.federatedChannel.createMany({
      data: [
        {
          name: "Общий чат студентов",
          description: "Межвузовский канал для общения",
          isPublic: true,
        },
        {
          name: "IT и проекты",
          description: "Обмен опытом по разработке в вузах",
          isPublic: true,
        },
      ],
    });
  }

  const siteBase = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  await seedRegisteredTenantEntry({
    slug: "sstu",
    name: org.name,
    shortName: org.shortName,
    siteUrl: `${siteBase.replace(/\/$/, "")}/o/sstu/dashboard`,
    primaryColor: org.primaryColor,
    accentColor: org.accentColor,
    description: "Dev: эмуляция реплики СГТУ. В prod — реальный домен вуза.",
  });

  console.log(
    useProductionBootstrap
      ? `Seed OK — tenant ${process.env.TENANT_SLUG}; root: ${getRootAdminEmail()} (войдите через Яндекс ID)`
      : "Seed OK — admin@sstu.local / password123 (dev); второй вуз: slug demo",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
