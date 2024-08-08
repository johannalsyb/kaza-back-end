/**
 * @file date.ts
 * @description Utility functions for formatting dates.
 */

/**
 * Formats a date into a friendly string representation.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string in the format "Mmm dd".
 */
export const formatFriendlyDate = (date: Date | undefined): string => {
  if (!date) {
    return '';
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
  });
};
