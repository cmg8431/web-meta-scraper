/**
 * Truncates a string to a specified maximum length and adds an ellipsis.
 *
 * If the text is longer than the maximum length, it will be cut off and
 * an ellipsis (...) will be appended. The resulting string, including
 * the ellipsis, will not exceed the maximum length.
 *
 * @param {string} text - The text to truncate
 * @param {number} maxLength - The maximum allowed length
 * @returns {string} The truncated text, or the original text if already shorter
 * @example
 *
 * toTruncatedText('Hello World', 8); // Returns 'Hello...'
 * toTruncatedText('Hi', 5);         // Returns 'Hi'
 */
export const toTruncatedText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}...`;
};

/**
 * Normalizes whitespace in a string by replacing multiple whitespace
 * characters with a single space and trimming leading/trailing whitespace.
 *
 * This function:
 * - Replaces multiple spaces, tabs, and newlines with a single space
 * - Removes leading and trailing whitespace
 *
 * @param {string} text - The text to normalize
 * @returns {string} The text with normalized whitespace
 * @example
 *
 * toNormalizedText('Hello   World\n  '); // Returns 'Hello World'
 * toNormalizedText('\t\tHi  there');     // Returns 'Hi there'
 */
export const toNormalizedText = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};
