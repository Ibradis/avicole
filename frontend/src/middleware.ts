import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/inscription", "/activer", "/mot-de-passe/reinitialiser"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const hasToken = Boolean(request.cookies.get("avicole_access")?.value);

  if (!hasToken && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasToken && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
