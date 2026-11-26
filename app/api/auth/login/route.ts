import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { str } from "@/lib/validate";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = str(b.email, 120).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const user = await prisma.user.findUnique({ where: { email } });
  // ข้อความเดียวกันทั้งกรณีไม่มีอีเมล/รหัสผิด เพื่อไม่บอกใบ้ผู้โจมตี
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  await createSession({ uid: user.id, role: user.role, name: user.name, email: user.email });
  return NextResponse.json({ role: user.role });
}
