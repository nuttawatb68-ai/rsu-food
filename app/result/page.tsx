import Link from "next/link";
import ResultClient from "@/components/ResultClient";
import { MIN_BUDGET, MAX_BUDGET } from "@/lib/constants";

export default function ResultPage({ searchParams }: { searchParams: { budget?: string } }) {
  const n = Number(searchParams.budget);
  const ok = Number.isInteger(n) && n >= MIN_BUDGET && n <= MAX_BUDGET;
  return (
    <main className="container">
      {ok ? (
        <ResultClient budget={n} />
      ) : (
        <div className="panel">
          <p>งบไม่ถูกต้อง กรุณาเลือกงบ {MIN_BUDGET}-{MAX_BUDGET} บาท</p>
          <Link href="/" className="btn btn-pink">กลับไปเลือกงบ</Link>
        </div>
      )}
    </main>
  );
}
