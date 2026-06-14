import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/o/") && !req.auth) {
    const login = new URL("/login", req.url);
    login.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/o/:path*"],
};
