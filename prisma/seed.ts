import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hashSync(p, 10);
  const admin = await prisma.user.upsert({ where: { email: "admin@rsu.ac.th" }, update: {}, create: { email: "admin@rsu.ac.th", name: "ผู้ดูแลระบบ", role: "ADMIN", passwordHash: hash("admin1234") } });
  const partner = await prisma.user.upsert({ where: { email: "partner@rsu.ac.th" }, update: {}, create: { email: "partner@rsu.ac.th", name: "เจ๊หมู ร้านข้าว", role: "PARTNER", passwordHash: hash("partner1234") } });
  await prisma.user.upsert({ where: { email: "student@rsu.ac.th" }, update: {}, create: { email: "student@rsu.ac.th", name: "นศ. ทดสอบ", studentId: "6501234", role: "STUDENT", passwordHash: hash("student1234") } });
  void admin;

  if ((await prisma.shop.count()) > 0) return console.log("มีข้อมูลร้านอยู่แล้ว ข้ามการ seed ร้าน");

  const shops = [
    { name: "ข้าวมันไก่ป้าต้อย เมืองเอก ซอย 2", zone: "เมืองเอก ซอย 1-8", lat: 13.9655, lng: 100.5878, status: "APPROVED" as const,
      menus: [["ข้าวมันไก่ต้มสูตรพิเศษ", "น้ำจิ้มเด็ดเจี๊ยบสูตรเด็ด", 45, 40], ["ข้าวมันไก่ทอดกรอบ", "ไก่ทอดแป้งบางกรอบ", 50, 45], ["ข้าวมันไก่ผสม", "ต้ม+ทอด", 55, 50]] },
    { name: "หมูกรอบเมืองเอก ซอย 3", zone: "เมืองเอก ซอย 1-8", lat: 13.9641, lng: 100.5902, status: "APPROVED" as const,
      menus: [["กะเพราหมูกรอบไข่ดาว ราดข้าว", "หมูกรอบเน้นๆ ไข่ดาวกรอบ", 50, null], ["ข้าวหมูกรอบน้ำพริก", null, 45, null]] },
    { name: "ข้าวใต้ตึก 5 (ม.รังสิต)", zone: "ใน ม.รังสิต", lat: 13.9662, lng: 100.5874, status: "APPROVED" as const,
      menus: [["ข้าวราดแกง 2 อย่าง", "เลือกแกงได้เอง", 40, 35], ["ข้าวไข่เจียวหมูสับ", null, 35, null]] },
    { name: "ก๋วยเตี๋ยวเรือหน้ามอ", zone: "หน้า ม.รังสิต / พหลโยธิน", lat: 13.9701, lng: 100.5903, status: "APPROVED" as const,
      menus: [["ก๋วยเตี๋ยวเรือหมู", "ชามเล็ก", 15, null], ["เซ็ตก๋วยเตี๋ยว 3 ชาม + น้ำ", null, 45, null]] },
    { name: "ชานมไข่มุก... รอตรวจสอบ (ตัวอย่างคำขอ)", zone: "เมืองเอก ซอย 9 ขึ้นไป", lat: 13.9682, lng: 100.5874, status: "PENDING" as const,
      menus: [["ชาไทยหวานน้อย", null, 35, null]] },
  ];
  for (const s of shops) {
    await prisma.shop.create({
      data: {
        ownerId: partner.id, name: s.name, zone: s.zone, lat: s.lat, lng: s.lng, status: s.status,
        menus: { create: s.menus.map(([name, description, price, specialPrice]) => ({ name: name as string, description: description as string | null, price: price as number, specialPrice: specialPrice as number | null })) },
      },
    });
  }
  console.log("seed สำเร็จ ✔");
}

main().finally(() => prisma.$disconnect());
