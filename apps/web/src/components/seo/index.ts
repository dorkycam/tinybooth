/**
 * Barrel for SEO helpers. Pages import the JsonLd component plus whichever
 * schema builder they need.
 */
export { JsonLd } from './JsonLd';
export {
  SITE_URL,
  absoluteUrl,
  organizationSchema,
  softwareApplicationSchema,
  mobileApplicationSchema,
  breadcrumbsSchema,
  articleSchema,
  pricingProductSchema,
} from './schemas';
export type { BreadcrumbItem, ArticleSchemaInput, ProductOffer } from './schemas';
