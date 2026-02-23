import { type Cheerio, type CheerioAPI, load } from 'cheerio';

/**
 * Creates a CheerioAPI instance from an HTML string.
 *
 * @param {string} html - The HTML string to parse
 * @returns {CheerioAPI} A Cheerio API instance for querying the document
 * @example
 *
 * const $ = getCheerioDoc('<div>Hello</div>');
 * $('div').text(); // Returns 'Hello'
 */
export const getCheerioDoc = (html: string): CheerioAPI => {
  return load(html, {
    xml: false,
  });
};

/**
 * Gets the text content of a Cheerio element and trims whitespace.
 *
 * @param {Cheerio<any>} elem - The Cheerio element to extract text from
 * @returns {string} The trimmed text content of the element
 * @example
 *
 * const $ = getCheerioDoc('<div> Hello World </div>');
 * getText($('div')); // Returns 'Hello World'
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getText = (elem: Cheerio<any>): string => {
  return elem.text().trim();
};

/**
 * Gets the value of a specified attribute from a Cheerio element.
 *
 * @param {Cheerio<any>} elem - The Cheerio element to get the attribute from
 * @param {string} attr - The name of the attribute to retrieve
 * @returns {string | undefined} The attribute value if it exists, undefined otherwise
 * @example
 *
 * const $ = getCheerioDoc('<a href="https://example.com">Link</a>');
 * getAttr($('a'), 'href'); // Returns 'https://example.com'
 */
export const getAttr = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elem: Cheerio<any>,
  attr: string,
): string | undefined => {
  return elem.attr(attr)?.trim();
};
