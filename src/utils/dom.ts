import type { Cheerio } from 'cheerio';

// biome-ignore lint/suspicious/noExplicitAny: Cheerio generic requires any for broad element matching
export const getText = (elem: Cheerio<any>): string => {
  return elem.text().trim();
};

export const getAttr = (
  // biome-ignore lint/suspicious/noExplicitAny: Cheerio generic requires any for broad element matching
  elem: Cheerio<any>,
  attr: string,
): string | undefined => {
  return elem.attr(attr)?.trim();
};
