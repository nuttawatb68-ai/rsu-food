import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type RoleName = "ADMIN" | "PARTNER" | "STUDENT";
export type Session = { uid: number; role: RoleName; name: string; email: string };

export const COOKIE = "rsu_session";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("ตั้งค่า AUTH_SECRET (ยาวอย่างน้อย 16 ตัวอักษร) ใน .env ก่อน");
  return new TextEncoder().encode(s);
}

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<Session | null> {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(COOKIE);
}
