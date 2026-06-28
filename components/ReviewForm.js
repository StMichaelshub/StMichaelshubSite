import { useState } from "react";

function StarInput({ rating, onChange }) {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`select-none text-3xl transition-colors duration-200 ${
            star <= rating ? "text-yellow-500" : "text-gray-300"
          }`}
          aria-label={`${star} Star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm({ productId, onSubmitted }) {
  const [reviewData, setReviewData] = useState({
    title: "",
    text: "",
    rating: 0,
    customerName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!reviewData.rating) {
      setFeedback({ type: "error", message: "Please choose a rating before submitting." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      const response = await fetch(`/api/product/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to submit review");
      }

      setFeedback({ type: "success", message: "Review submitted successfully." });
      setReviewData({
        title: "",
        text: "",
        rating: 0,
        customerName: "",
      });
      onSubmitted?.(payload.review);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Failed to submit review.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleReviewSubmit} className="space-y-4">
      <h3 className="mb-6 border-b border-[rgba(20,109,126,0.12)] pb-4 text-2xl font-bold text-[var(--foreground-strong)]">
        Add a Review
      </h3>
      <StarInput
        rating={reviewData.rating}
        onChange={(rating) => setReviewData((currentValue) => ({ ...currentValue, rating }))}
      />
      <input
        type="text"
        placeholder="Your Name"
        value={reviewData.customerName}
        onChange={(e) =>
          setReviewData({ ...reviewData, customerName: e.target.value })
        }
        className="theme-input-light w-full rounded-2xl p-3"
        required
      />
      <input
        type="text"
        placeholder="Review Title"
        value={reviewData.title}
        onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
        className="theme-input-light w-full rounded-2xl p-3"
        required
      />
      <textarea
        placeholder="Write your review here..."
        value={reviewData.text}
        onChange={(e) => setReviewData({ ...reviewData, text: e.target.value })}
        className="theme-input-light min-h-32 w-full rounded-2xl p-3"
        required
      />

      {feedback.message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          feedback.type === "success"
            ? "border border-emerald-200/80 bg-emerald-50 text-emerald-700"
            : "border border-red-200/80 bg-red-50 text-red-700"
        }`}>
          {feedback.message}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className={`mt-4 min-h-[3.25rem] rounded-[1rem] px-5 py-2.5 font-semibold ${
          isSubmitting
            ? "bg-[rgba(18,52,60,0.08)] text-[rgba(18,52,60,0.4)] cursor-not-allowed"
            : "theme-button-accent"
        }`}
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
