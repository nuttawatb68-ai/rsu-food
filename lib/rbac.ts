import { NextResponse } from "next/server";
import { getSession, type RoleName, type Session } from "./auth";

/**
 * RBAC: กำหนดสิทธิ์ทั้งหมดไว้ที่ไฟล์เดียว
 * - GUEST/STUDENT: สุ่มอาหารได้ (ไม่ต้องมีสิทธิ์พิเศษ)
 * - PARTNER: ส่งข้อมูลร้านของตัวเอง + จัดการเมนูของตัวเอง (ต้องรอ Admin อนุมัติ)
 * - ADMIN: ดู Dashboard, อนุมัติ/ปฏิเสธ, แก้ไข, ลบ
 */
export type Action =
  | "dashboard:view"
  | "shop:submit_own"
  | "menu:manage_own"
  | "shop:favorite"
  | "shop:write_review"
  | "shop:review"
  | "shop:edit_any"
  | "shop:delete_any";

const MATRIX: Record<RoleName, Action[]> = {
  STUDENT: ["shop:favorite", "shop:write_review"],
  PARTNER: ["shop:submit_own", "menu:manage_own"],
  ADMIN: ["dashboard:view", "shop:review", "shop:edit_any", "shop:delete_any"],
};

export const can = (role: RoleName, action: Action) => MATRIX[role]?.includes(action) ?? false;

type Guard = { session: Session; error?: undefined } | { error: NextResponse; session?: undefined };

export async function guard(action: Action): Promise<Guard> {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 }) };
  if (!can(session.role, action))
    return { error: NextResponse.json({ error: "คุณไม่มีสิทธิ์ทำรายการนี้" }, { status: 403 }) };
  return { session };
}
