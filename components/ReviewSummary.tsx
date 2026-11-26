type ReviewItem = { id: number; rating: number; content: string; createdAt: string; userName: string };
type Props = { total: number; average: number; counts: number[]; latest: ReviewItem[] };

export default function ReviewSummary({ total, average, counts, latest }: Props) {
  return (
    <section className="panel review-summary">
      <div className="item review-summary-head">
        <div>
          <h3>สรุปรีวิวจากลูกค้า</h3>
          <span className="muted small">{total} รีวิวทั้งหมด</span>
        </div>
        <div className="review-average" aria-label={`คะแนนเฉลี่ย ${average.toFixed(1)} จาก 5`}>
          <b>★ {average.toFixed(1)}</b><span className="muted small"> / 5</span>
        </div>
      </div>
      {total === 0 ? <p className="muted">ร้านยังไม่มีรีวิว</p> : (
        <div className="review-chart" aria-label="กราฟจำนวนรีวิวแต่ละระดับคะแนน">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = counts[rating] ?? 0;
            return (
              <div className="review-bar-row" key={rating}>
                <span>{rating} ★</span>
                <div className="review-bar-track"><div className="review-bar-fill" style={{ width: `${(count / total) * 100}%` }} /></div>
                <span className="muted small">{count}</span>
              </div>
            );
          })}
        </div>
      )}
      {latest.length > 0 && (
        <div className="review-latest">
          <h4>รีวิวล่าสุด</h4>
          {latest.map((review) => (
            <article className="review-entry" key={review.id}>
              <div><b>{review.userName}</b> <span className="review-stars" aria-label={`${review.rating} ดาว`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div>
              <p>{review.content}</p>
              <time className="muted small" dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("th-TH")}</time>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
