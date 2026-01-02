import { dailyQuotes } from './quotes';

/**
 * Returns a greeting based on the current time of day
 * @returns 'Good morning', 'Good afternoon', 'Good evening', or 'Good night'
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    return 'Good evening';
  } else {
    return 'Good night';
  }
}

export function getQuoteOfTheDay() {
  const today = new Date();

  // Day of year (0–364 / 365)
  const start = new Date(today.getFullYear(), 0, 0);
  const diff =
    today.getTime() - start.getTime() +
    (start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const index = dayOfYear % dailyQuotes.length;
  return dailyQuotes[index];
}

// export async function randomDesktopQuote(): Promise<string> {
//   const random = Math.random();
//   const response = await api.chatWithAI('Generate ONLY a random philosophical quote for the desktop based on the number ' + random + ', ALWAYS END THE SENTENCE WITH . (period) no other text or explanation. JUST TEXT NOT MARKDOWN OR ANYTHING ELSE.');
//   return response.reply || '';
// }