import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ด่านแรกของ RBAC: กันที่ระดับหน้าเว็บ (API แต่ละตัวมี guard() ซ้ำอีกชั้น)
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("rsu_session")?.value;
  let role: string | null = null;
  if (token && process.env.AUTH_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      role = payload.role as string;
    } catch {}
  }
  if (!role) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
  if (pathname.startsWith("/partner") && role !== "PARTNER") return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/partner/:path*"] };
