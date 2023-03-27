module.exports = (function () {
    function sitemapLocales() {
        const Site = require('dw/system/Site');
        let countries = JSON.parse(Site.getCurrent().getCustomPreferenceValue('countriesJSON')),
            locales = {};

        for(let countryIdx in countries) {
            var country = countries[countryIdx];
            for(let loc in country.locales) {
                locales[country.locales[loc]] = {
                    'locale': country.locales[loc].toLowerCase().replace('_', '-'),
                    'hostName': countries[countryIdx].hostname
                };
            }
        }

        return locales;

    }

    function productSitemap(locale, localeObj) {
        const ProductSearchModel = require('dw/catalog/ProductSearchModel'),
            ArrayList = require('dw/util/ArrayList'),
            Logger = require('dw/system/Logger'),
            Variant = require('dw/catalog/Variant');

        let psm = new ProductSearchModel(),
            urls = [];

        psm.setCategoryID('root');
        psm.setRecursiveCategorySearch(true);
        psm.setOrderableProductsOnly(true);
        psm.search();

        let products = psm.getProductSearchHits(),
            exportedProducts = new ArrayList();
        while (products.hasNext()) {
            let productSearchHit = products.next(),
                product = productSearchHit.firstRepresentedProduct;

            if (!empty(product) && product instanceof Variant) {
                try {
                    product = product.getMasterProduct();
                } catch (ex) {
                    Logger.error("productXMLs.js: productSitemap: Error during script execution: " + ex);
                    continue;
                }
            } else {
                continue;
            }

            if (product == null || !product.isMaster() || product.searchableIfUnavailableFlag) continue;

            if (exportedProducts.indexOf(product.ID) == -1) {
                if (product && product.onlineFlag && product.searchable && (('availableForLocale' in product.custom) && product.custom.availableForLocale == "Yes")) {
                    urls.push(getUrlsForSitemap(product));
                    exportedProducts.add(product.ID);
                }
            }
        }

        generateFile(urls, 'product', locale);

        function getUrlsForSitemap(product) {
            const URLUtils = require('dw/web/URLUtils');

            let link = URLUtils.http('Product-Show', 'pid', product.ID);

            link = require('int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds').prepareURLForLocale(link.toString(), request.locale);
            //link = link.toString().replace('staging', 'www').replace('development', 'www');
            link = link.toString();
            return {
                'link': link,
                'lastmodified': product.getLastModified()
            };
        }

        function generateFile(urls, attributeName, locale) {
            const StringUtils = require('dw/util/StringUtils'),
                Calendar = require('dw/util/Calendar');

            let currentLocale = locale.replace('_', '-').toLowerCase(),
                xsw;

            //GENERATE FILE
            try {
                xsw = openFile(attributeName, currentLocale);
                for(let url in urls) {
                    let lastMod = new Date(urls[url].lastmodified);
                    lastMod = new Calendar(lastMod);
                    lastMod = StringUtils.formatCalendar(lastMod, "yyyy-MM-dd'T'hh:mm:ss+00:00");

                    xsw.writeStartElement("url");
                    xsw.writeStartElement("loc");
                    xsw.writeCharacters(urls[url].link);
                    xsw.writeEndElement(); //</loc>
                    xsw.writeStartElement("lastmod");
                    xsw.writeCharacters(lastMod);
                    xsw.writeEndElement(); //</lastmod>
                    xsw.writeStartElement("changefreq");
                    xsw.writeCharacters("daily");
                    xsw.writeEndElement(); //</changefreq>
                    xsw.writeStartElement("priority");
                    xsw.writeCharacters("0.6");
                    xsw.writeEndElement(); //</priority>
                    xsw.writeEndElement(); //</url>           
                }
            } catch (e) {
                Logger.error("productXMLs.js: generateFile: Error during file generation: " + e.message);
            } finally {
                closeFile(xsw);
            }
        }

        function openFile(attributeName, currentLocale) {
            const XMLStreamWriter = require('dw/io/XMLStreamWriter'),
                FileWriter = require('dw/io/FileWriter'),
                File = require('dw/io/File');
            let xsw;
            //mkdirs()
            let dir = new File(File.IMPEX + "/src/sitemaps/");
            dir.mkdirs();

            let file = new File(File.IMPEX + "/src/sitemaps/" + attributeName + "-sitemap-" + currentLocale + '.xml');
            file.createNewFile();

            // Setup file writer
            let fw = new FileWriter(file, "UTF-8");
            xsw = new XMLStreamWriter(fw);


            // Begin The XML document
            xsw.writeStartDocument("UTF-8", "1.0");
            xsw.writeCharacters("\n");
            xsw.writeStartElement("urlset");
            xsw.writeAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
            xsw.writeAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9', 'xhtml', 'http://www.w3.org/1999/xhtml');
            xsw.writeAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9', 'image', 'http://www.google.com/schemas/sitemap-image/1.1');
            xsw.writeAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9', 'xsi', 'http://www.w3.org/2001/XMLSchema-instance');
            xsw.writeAttribute('xsi', 'http://www.w3.org/2001/XMLSchema-instance', 'schemaLocation', 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.google.com/schemas/sitemap-image/1.1 http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd http://www.w3.org/1999/xhtml http://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd');
            return xsw;
        }

        function closeFile(xsw) {
            xsw.writeEndElement(); //</urlset>
            xsw.flush();
            xsw.close();
        }

    }

    function generateProductXML() {
        let locales = sitemapLocales();
        let props = Object.getOwnPropertyNames(locales);
        for(let loc in props) {
            request.setLocale(props[loc]);
            productSitemap(props[loc], locales[props[loc]]);
        }
    }

    return {
        'execute': generateProductXML
    }
}());
