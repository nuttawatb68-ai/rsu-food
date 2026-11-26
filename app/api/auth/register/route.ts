import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { str } from "@/lib/validate";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 60);
  const email = str(b.email, 120).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const studentId = str(b.studentId, 10) || null;
  // สำคัญ: สมัครเองได้แค่ STUDENT หรือ PARTNER — ห้ามสมัครเป็น ADMIN เด็ดขาด
  const role = b.role === "PARTNER" ? "PARTNER" : "STUDENT";

  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "กรอกชื่อและอีเมลให้ถูกต้อง" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email } }))
    return NextResponse.json({ error: "อีเมลนี้ถูกใช้แล้ว" }, { status: 409 });

  const user = await prisma.user.create({
    data: { name, email, studentId, role, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession({ uid: user.id, role: user.role, name: user.name, email: user.email });
  return NextResponse.json({ role: user.role });
}
