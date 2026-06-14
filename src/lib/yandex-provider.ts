import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

export type YandexProfile = {
  id: string;
  login: string;
  default_email?: string;
  real_name?: string;
  display_name?: string;
  default_avatar_id?: string;
};

export function Yandex(
  options: OAuthUserConfig<YandexProfile>,
): OAuthConfig<YandexProfile> {
  return {
    id: "yandex",
    name: "Yandex",
    type: "oauth",
    authorization: {
      url: "https://oauth.yandex.ru/authorize",
      params: { scope: "login:email login:info login:avatar" },
    },
    token: "https://oauth.yandex.ru/token",
    userinfo: {
      url: "https://login.yandex.ru/info",
      params: { format: "json" },
    },
    profile(profile) {
      return {
        id: profile.id,
        name: profile.real_name || profile.display_name || profile.login,
        email: profile.default_email,
        image: profile.default_avatar_id
          ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`
          : undefined,
      };
    },
    options,
  };
}

export function isYandexAuthConfigured(): boolean {
  return Boolean(process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET);
}
