# Storefront Reference Architecture (SFRA) SiteMap

This is the repository for the Site Map feature plugin for Storefront Reference Architecture.


# Getting Started

1. Clone this repository.
2. Install npm dependencies `npm install`
3. Add this cartridge to your project and insert it in the cartridge path from within the BM.

# Generating a Sitemap within BM

1. In Business Manager, navigate to Merchant Tools -> SEO -> Aliases and add an alias for your site
2. Navigate to Merchant Tools -> SEO -> Sitemaps
3. Under the Job tab, you can run a job to generate a sitemap. You can also upload a custom sitemap under the Custom Sitemaps tab.

The sitemap will be available under the /sitemap_index.xml path from your alias. ie. `https://abc-123.dx.commercecloud.salesforce.com/sitemap_index.xml``

## Linting your code

`npm run lint` - Execute linting for all JavaScript files in the project. You should run this command before committing your code.
