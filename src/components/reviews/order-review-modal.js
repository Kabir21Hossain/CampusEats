"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, Sparkles, Star, Store, Utensils, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const RATING_LABELS = ["", "Needs improvement", "Fair", "Good", "Very good", "Excellent"];

function StarRating({ label, value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const activeRating = hovered || value;

  return (
    <div>
      <div className="flex items-center gap-1" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            aria-label={`${label}: ${rating} star${rating === 1 ? "" : "s"}`}
            aria-pressed={value === rating}
            onMouseEnter={() => setHovered(rating)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(rating)}
            onBlur={() => setHovered(0)}
            onClick={() => onChange(rating)}
            className="rounded-lg p-1.5 text-amber-400 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Star className={`h-7 w-7 ${rating <= activeRating ? "fill-current" : ""}`} />
          </button>
        ))}
        <span className="ml-2 min-w-28 text-xs font-medium text-zinc-500 dark:text-zinc-400" aria-live="polite">
          {RATING_LABELS[activeRating] || "Tap to rate"}
        </span>
      </div>
    </div>
  );
}

function CommentField({ id, label, value, onChange, placeholder }) {
  return (
    <div className="mt-3">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        {label} <span className="font-normal text-zinc-400">(optional)</span>
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={1000}
        rows={2}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <div className="mt-1 text-right text-[10px] text-zinc-400">{value.length}/1000</div>
    </div>
  );
}

function ReviewSection({ icon: Icon, title, detail, children }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/70">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h4>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function OrderReviewModal({ isOpen, onClose, order, isSubmitting, onSubmit }) {
  const [shopRating, setShopRating] = useState(0);
  const [shopComment, setShopComment] = useState("");
  const [foodReviews, setFoodReviews] = useState({});
  const [riderRating, setRiderRating] = useState(0);
  const [riderComment, setRiderComment] = useState("");
  const items = [...new Map((order?.items || []).map((item) => [item.id, item])).values()];
  const hasRider = Boolean(order?.riderId || order?.riderUserId);
  const hasRating = shopRating > 0 ||
    Object.values(foodReviews).some((review) => review.rating > 0) ||
    riderRating > 0;

  useEffect(() => {
    if (!isOpen) return;
    setShopRating(0);
    setShopComment("");
    setRiderRating(0);
    setRiderComment("");
    setFoodReviews(Object.fromEntries(items.map((item) => [
      item.id,
      { rating: 0, comment: "" },
    ])));
  }, [isOpen, order?.id]);

  const updateFoodReview = (itemId, key, value) => {
    setFoodReviews((current) => ({
      ...current,
      [itemId]: { ...current[itemId], [key]: value },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!hasRating) return;

    onSubmit({
      ...(shopRating > 0
        ? { shopReview: { rating: shopRating, comment: shopComment } }
        : {}),
      foodReviews: items
        .filter((item) => foodReviews[item.id]?.rating > 0)
        .map((item) => ({
          menuItemId: item.id,
          rating: foodReviews[item.id].rating,
          comment: foodReviews[item.id].comment,
        })),
      ...(riderRating > 0
        ? { riderReview: { rating: riderRating, comment: riderComment } }
        : {}),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How was your order?"
      description="Your feedback helps the campus community choose well."
      maxWidth="max-w-2xl"
      className="max-h-[90vh] overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="flex max-h-[calc(90vh-7rem)] flex-col">
        <div className="-mx-6 -mt-6 overflow-y-auto px-6 pb-5 pt-1">
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 p-4 text-white">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">A little feedback goes a long way</p>
              <p className="mt-0.5 text-xs text-emerald-50/90">
                Rate any part of your experience. Comments are optional.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <ReviewSection
              icon={Store}
              title={order?.shopName || "Campus shop"}
              detail="Rate the shop and your overall experience."
            >
              <StarRating label="Shop rating" value={shopRating} onChange={setShopRating} />
              <CommentField
                id="shop-review-comment"
                label="Your shop comment"
                value={shopComment}
                onChange={setShopComment}
                placeholder="What did you enjoy about the shop?"
              />
            </ReviewSection>

            {items.map((item, index) => {
              const review = foodReviews[item.id] || { rating: 0, comment: "" };
              return (
                <ReviewSection
                  key={`${item.id}-${index}`}
                  icon={Utensils}
                  title={item.name}
                  detail="How was this dish?"
                >
                  <StarRating
                    label={`${item.name} rating`}
                    value={review.rating}
                    onChange={(rating) => updateFoodReview(item.id, "rating", rating)}
                  />
                  <CommentField
                    id={`food-review-comment-${index}`}
                    label={`Your comment about ${item.name}`}
                    value={review.comment}
                    onChange={(comment) => updateFoodReview(item.id, "comment", comment)}
                    placeholder="Share a note about the taste or quality..."
                  />
                </ReviewSection>
              );
            })}

            {hasRider && (
              <ReviewSection
                icon={Bike}
                title={order?.riderName || "Your delivery rider"}
                detail="Rate your delivery experience."
              >
                <StarRating label="Rider rating" value={riderRating} onChange={setRiderRating} />
                <CommentField
                  id="rider-review-comment"
                  label="Your rider comment"
                  value={riderComment}
                  onChange={setRiderComment}
                  placeholder="How was the delivery?"
                />
              </ReviewSection>
            )}
          </div>
        </div>

        <div className="-mx-6 flex items-center justify-between gap-3 border-t border-zinc-100 bg-white px-6 pt-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="hidden items-center gap-1.5 text-xs text-zinc-400 sm:flex">
            <MessageSquareText className="h-3.5 w-3.5" />
            You can submit feedback once per order.
          </p>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Not now
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={!hasRating}>
              Submit feedback
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
