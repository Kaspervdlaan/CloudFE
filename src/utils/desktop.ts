import { api } from './api';


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

export async function randomDesktopQuote(): Promise<string> {
  const random = Math.random();
  const response = await api.chatWithAI('Generate ONLY a random philosophical quote for the desktop based on the number ' + random + ', ALWAYS END THE SENTENCE WITH . (period) no other text or explanation. JUST TEXT NOT MARKDOWN OR ANYTHING ELSE.');
  return response.reply || '';
}