import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyPinSession } from "@/lib/session";

const PUBLIC_PATHS = new Set(["/pin", "/api/auth-pin"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isValid = await verifyPinSession(
    request.cookies.get(SESSION_COOKIE)?.value,
    process.env.PIN_SESSION_SECRET,
  );

  if (pathname === "/pin" && isValid) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isValid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Sesi PIN tidak valid atau sudah berakhir." },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/pin", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
