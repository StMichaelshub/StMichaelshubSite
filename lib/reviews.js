export function getReviewSummary(reviews = []) {
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const count = safeReviews.length;

  if (!count) {
    return {
      count: 0,
      average: 0,
      averageLabel: "New",
    };
  }

  const average =
    safeReviews.reduce((runningTotal, review) => runningTotal + (review?.rating || 0), 0) /
    count;

  return {
    count,
    average,
    averageLabel: average.toFixed(1),
  };
}