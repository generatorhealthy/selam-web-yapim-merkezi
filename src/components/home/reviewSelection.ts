export function pickRandomHomeReviews<T>(
  reviews: T[],
  count = 5,
  random: () => number = Math.random,
): T[] {
  const shuffled = [...reviews];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled.slice(0, Math.max(0, count));
}
