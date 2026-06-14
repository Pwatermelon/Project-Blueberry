import { signInWithYandex } from "@/actions/yandex-login";

export function YandexLoginButton({
  redirectTo,
  label = "Войти через Яндекс ID",
}: {
  redirectTo: string;
  label?: string;
}) {
  return (
    <form action={signInWithYandex.bind(null, redirectTo)}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FC3F1D] px-4 py-3 font-medium text-white transition hover:bg-[#e83818]"
      >
        <YandexIcon />
        {label}
      </button>
    </form>
  );
}

function YandexIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13.32 4h2.59c.09 1.16.37 2.08 1.68 5.6.6 1.5 1.14 2.87 1.68 4.24l.06.15c.54-1.37 1.08-2.74 1.68-4.24 1.31-3.52 1.59-4.44 1.68-5.6h2.59C22.4 6.28 21.2 9.12 18.72 14.4 17.52 16.92 16.32 19.32 15.12 21.6h-3.36c1.2-2.28 2.4-4.68 3.6-7.2C17.88 9.12 19.08 6.28 13.32 4Z"
        fill="white"
      />
    </svg>
  );
}
