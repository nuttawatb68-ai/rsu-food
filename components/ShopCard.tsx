"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { distanceKm, mapsUrl } from "@/lib/geo";
import { RSU } from "@/lib/constants";
import type { RoleName } from "@/lib/auth";

type Review = { id: number; rating: number; content: string; createdAt: string; userName: string };
type Shop = {
  id: number; name: string; zone: string; address: string | null;
  openTime: string; closeTime: string; lat: number; lng: number;
  menus: { id: number; name: string; price: number; specialPrice: number | null }[];
};

export default function ShopCard({
  shop, initialFavorite, reviews, myReview, role,
}: {
  shop: Shop; initialFavorite: boolean; reviews: Review[];
  myReview: { rating: number; content: string } | null; role: RoleName | null;
}) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [reviewList, setReviewList] = useState(reviews);
  const [rating, setRating] = useState(String(myReview?.rating ?? 5));
  const [content, setContent] = useState(myReview?.content ?? "");
  const [hasReview, setHasReview] = useState(!!myReview);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const canInteract = role === "STUDENT";

  async function toggleFavorite() {
    setError("");
    try {
      const response = await fetch(`/api/favorites/${shop.id}`, { method: favorite ? "DELETE" : "PUT" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "บันทึกร้านโปรดไม่สำเร็จ");
        return;
      }
      setFavorite(result.favorite);
      router.refresh();
    } catch {
      setError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch(`/api/shops/${shop.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: Number(rating), content }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "ส่งรีวิวไม่สำเร็จ");
      const review: Review = {
        id: result.id, rating: result.rating, content: result.content,
        createdAt: result.updatedAt, userName: "คุณ",
      };
      setReviewList((current) => [review, ...current.filter((item) => item.id !== review.id)].slice(0, 5));
      setHasReview(true);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="panel shop-card">
      <div className="shop-card-heading">
        <h3>{shop.name}</h3>
        {canInteract && (
          <button className={`favorite-btn${favorite ? " is-favorite" : ""}`} type="button" onClick={toggleFavorite}
            aria-pressed={favorite} aria-label={favorite ? `นำ ${shop.name} ออกจากร้านโปรด` : `เพิ่ม ${shop.name} ในร้านโปรด`}>
            {favorite ? "♥" : "♡"}
          </button>
        )}
      </div>
      <p className="muted small">{shop.zone} · {distanceKm(RSU.lat, RSU.lng, shop.lat, shop.lng).toFixed(1)} กม. · {shop.openTime}-{shop.closeTime} น.</p>
      {shop.menus.map((menu) => (
        <div className="item" key={menu.id}><span>{menu.name}</span><b>{menu.specialPrice ?? menu.price}.-</b></div>
      ))}
      <a className="btn btn-blue btn-block" style={{ marginTop: 12 }} href={mapsUrl(shop.lat, shop.lng)} target="_blank" rel="noopener noreferrer">นำทาง</a>

      <section className="shop-reviews">
        <h4>รีวิวจากผู้ใช้</h4>
        {reviewList.length === 0 && <p className="muted small">ยังไม่มีรีวิว</p>}
        {reviewList.map((review) => (
          <article className="review-entry" key={review.id}>
            <div><b>{review.userName}</b> <span className="review-stars" aria-label={`${review.rating} ดาว`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div>
            <p>{review.content}</p>
            <time className="muted small" dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("th-TH")}</time>
          </article>
        ))}
        {canInteract ? (
          <form onSubmit={submitReview} className="review-form">
            <label className="f" htmlFor={`rating-${shop.id}`}>{hasReview ? "แก้ไขคะแนนรีวิวของคุณ" : "ให้คะแนนร้านนี้"}</label>
            <select id={`rating-${shop.id}`} className="input" value={rating} onChange={(event) => setRating(event.target.value)}>
              {[5, 4, 3, 2, 1].map((value) => <option value={value} key={value}>{value} ดาว</option>)}
            </select>
            <label className="f" htmlFor={`review-${shop.id}`}>เขียนรีวิว</label>
            <textarea id={`review-${shop.id}`} className="input" rows={3} maxLength={1200} required value={content}
              onChange={(event) => setContent(event.target.value)} placeholder="แบ่งปันประสบการณ์ของคุณ" />
            <button className="btn btn-pink btn-sm" type="submit" disabled={saving}>{saving ? "กำลังส่ง…" : hasReview ? "บันทึกรีวิว" : "ส่งรีวิว"}</button>
          </form>
        ) : role === null ? (
          <p className="muted small"><Link href="/login">เข้าสู่ระบบ</Link> เพื่อกดใจหรือเขียนรีวิว</p>
        ) : (
          <p className="muted small">เฉพาะผู้ใช้ทั่วไปเท่านั้นที่เขียนรีวิวได้</p>
        )}
        {error && <div className="alert err" role="alert">{error}</div>}
      </section>
    </article>
  );
}
