import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { upsertYandexUser } from "@/lib/org-email-binding";
import { getDeploymentMode, isHubEnabled, isTenantDeploy } from "@/lib/deployment";
import { syncUserProfileToHub, upsertFederatedProfileWithTenants } from "@/lib/hub-sync";
import { isYandexAuthConfigured, Yandex } from "@/lib/yandex-provider";

const providers = [];

if (isYandexAuthConfigured()) {
  providers.push(
    Yandex({
      clientId: process.env.YANDEX_CLIENT_ID!,
      clientSecret: process.env.YANDEX_CLIENT_SECRET!,
    }),
  );
}

if (process.env.ALLOW_DEV_LOGIN === "true" || process.env.NODE_ENV === "development") {
  providers.push(
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "yandex") {
        if (!user.email || !user.id) return false;
        const dbUser = await upsertYandexUser({
          yandexId: String(user.id),
          email: user.email,
          name: user.name,
          avatarUrl: user.image,
        });
        user.id = dbUser.id;

        if (isHubEnabled(getDeploymentMode())) {
          const memberships = await prisma.membership.findMany({
            where: { userId: dbUser.id },
            include: { organization: { select: { slug: true, name: true, shortName: true } } },
          });
          const profile = await upsertFederatedProfileWithTenants({
            email: user.email,
            name: user.name,
            avatarUrl: user.image,
            tenants: memberships.map((m) => ({
              orgSlug: m.organization.slug,
              orgName: m.organization.shortName || m.organization.name,
              role: m.role,
            })),
          });
          if (dbUser.hubProfileId !== profile.id) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { hubProfileId: profile.id },
            });
          }
        } else if (isTenantDeploy() && process.env.HUB_BASE_URL) {
          await syncUserProfileToHub(dbUser.id);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

export { isYandexAuthConfigured };
