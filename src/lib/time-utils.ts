/**
 * Get local time string in ISO format
 * This function formats the current date/time to a consistent format
 * that includes timezone information
 */
export function getLocalTimestr(): string {
  const now = new Date();

  // Get timezone offset in minutes and convert to ±HH:MM format
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (absOffset % 60).toString().padStart(2, '0');
  const timezone = `${sign}${hours}:${minutes}`;

  // Format date as YYYY-MM-DD HH:MM:SS
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');

  // Return in format: YYYY-MM-DD HH:MM:SS±HH:MM
  return `${year}-${month}-${day} ${hour}:${minute}:${second}${timezone}`;
}

/**
 * Parse a local time string back to Date object
 */
export function parseLocalTimestr(timestr: string): Date {
  // Remove timezone suffix if present and parse as local time
  const cleanTimeStr = timestr.split(/[+-]/)[0].trim();
  return new Date(cleanTimeStr.replace(' ', 'T'));
}
