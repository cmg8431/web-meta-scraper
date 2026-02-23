export type JsonLdType =
  | 'Article'
  | 'BreadcrumbList'
  | 'FAQPage'
  | 'Organization'
  | 'Person'
  | 'Product'
  | 'WebSite'
  | string;

export type JsonLdMetadata = {
  '@context': 'https://schema.org';
  '@type': JsonLdType;
  [key: string]: unknown;
};
