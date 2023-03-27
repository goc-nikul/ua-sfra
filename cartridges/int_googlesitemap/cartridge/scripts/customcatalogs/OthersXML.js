'use strict';

var Site = require("dw/system/Site"),
    ContentMgr = require("dw/content/ContentMgr"),
    CatalogMgr = require("dw/catalog/CatalogMgr"),
    URLUtils = require("dw/web/URLUtils"),
    Logger = require("dw/system/Logger"),
    File = require("dw/io/File"),
    Status = require("dw/system/Status"),
    System = require("dw/system/System"),
    StringUtils = require("dw/util/StringUtils"),
    Calendar = require("dw/util/Calendar"),
    XMLStreamWriter = require("dw/io/XMLStreamWriter"),
    XMLStreamReader = require("dw/io/XMLStreamReader"),
    XMLStreamConstants = require("dw/io/XMLStreamConstants"),
    FileWriter = require("dw/io/FileWriter"),
    FileReader = require("dw/io/FileReader"),
    ProductSearchModel = require("dw/catalog/ProductSearchModel"),
    ArrayList = require("dw/util/ArrayList"),
    Status = require("dw/system/Status"),
    SEOUtilsHelper = require('app_ua_emea/cartridge/scripts/utils/SEOUtilsHelper.js');

/*
 * Generates other (combined category, refinement, content) XML sitemap files for locales
 */
function generateOtherSitemaps() {
    var countries = JSON.parse(Site.getCurrent().getCustomPreferenceValue('countriesJSON')),
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
    var localeNames = Object.getOwnPropertyNames(locales);
    for (let i = 0; i < localeNames.length; i++) {
        request.setLocale(localeNames[i]);
        // get category urls
        var root = CatalogMgr.getSiteCatalog().getRoot(),
            categoryUrls = getCategoryUrlsForSitemap(root, locales[localeNames[i]]);
        // get refinement urls
        //var refinementUrls = getRefUrlsForSitemap(root, locales[localeNames[i]]),
        //  colorGroupUrls = refinementUrls.colorgroup,
        // endUseUrls = refinementUrls.enduse;
        // get content urls
        var contentUrls = getSitemapContent(locales[localeNames[i]]);
        // concat all urls
        //var allOtherUrls = colorGroupUrls.concat(endUseUrls, contentUrls); 
        generateFile(categoryUrls, contentUrls, localeNames[i], locales[localeNames[i]].hostName);
    }
}

/*
 * Generates XML file @param categoryUrls : Array of category urls @param
 * otherUrls : Array of refinements/content urls @param locale : String locale
 */
function generateFile(categoryUrls, otherUrls, locale, hostname) {
    const EU_HOSTNAME_PATTERN = "underarmour.eu";
    var currentLocale = locale.replace('-', '_').toLowerCase(),
        hreflangEUSuffix = "";

    // GENERATE FILE
    try {
        var xsw = openFile(currentLocale);

        //add hreflang locale suffix for EU sitemaps
        if (hostname && hostname.indexOf(EU_HOSTNAME_PATTERN) !== -1) {
            hreflangEUSuffix = "-" + currentLocale;
        }
        var hreflangFile = new File(File.IMPEX + "/src/sitemaps/hreflang-sitemap-" + hostname + hreflangEUSuffix + ".xml"),
            hreflangFileReader,
            xmlStreamReader;

        // for some sites hreflang file could be absent
        if (hreflangFile.exists()) {
            hreflangFileReader = new FileReader(hreflangFile, "UTF-8"),
                xmlStreamReader = new XMLStreamReader(hreflangFileReader);
        }

        var duplicateUrls = getSkipDuplicateLinksList(xmlStreamReader, categoryUrls, "category");
        // write category URLs 
        for(let url in categoryUrls) {
            // check url for duplicate in hreflang sitemap
            if (duplicateUrls.indexOf(categoryUrls[url].link) == -1) {
                let lastMod = new Date(categoryUrls[url].lastmodified);
                lastMod = new Calendar(lastMod);
                lastMod = StringUtils.formatCalendar(lastMod, "yyyy-MM-dd'T'hh:mm:ss+00:00");

                xsw.writeStartElement("url");
                xsw.writeStartElement("loc");
                xsw.writeCharacters(categoryUrls[url].link);
                xsw.writeEndElement(); // </loc>
                xsw.writeStartElement("lastmod");
                xsw.writeCharacters(lastMod);
                xsw.writeEndElement(); // </lastmod>
                xsw.writeStartElement("changefreq");
                xsw.writeCharacters("weekly");
                xsw.writeEndElement(); // </changefreq>
                xsw.writeStartElement("priority");
                xsw.writeCharacters("0.8");
                xsw.writeEndElement(); // </priority>
                xsw.writeEndElement(); // </url>
            }
        }
        // reinit xmlStreamReader
        if (hreflangFile.exists()) {
            hreflangFileReader = new FileReader(hreflangFile, "UTF-8"),
                xmlStreamReader = new XMLStreamReader(hreflangFileReader);
        }
        // write other URLs
        duplicateUrls = getSkipDuplicateLinksList(xmlStreamReader, otherUrls, "other");
        for(let url in otherUrls) {
            // check url for duplicate in hreflang sitemap
            if (duplicateUrls.indexOf(otherUrls[url]) == -1) {
                xsw.writeStartElement("url");
                xsw.writeStartElement("loc");
                xsw.writeCharacters(otherUrls[url]);
                xsw.writeEndElement(); // </loc>
                xsw.writeStartElement("changefreq");
                xsw.writeCharacters("weekly");
                xsw.writeEndElement(); // </changefreq>
                xsw.writeStartElement("priority");
                xsw.writeCharacters("0.7");
                xsw.writeEndElement(); // </priority>
                xsw.writeEndElement(); // </url>
            }
        }
        closeFile(xsw);
        xmlStreamReader.close();
        hreflangFileReader.close();
    } catch (e) {
        Logger.error("OthersXML.js: Error during file generation: " + e.message);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

/*
 * Creates file for writing sitemap data @param currentLocale : String locale
 */
function openFile(currentLocale) {
    // mkdirs()
    var dir = new File(File.IMPEX + "/src/sitemaps/");
    if (!dir.exists()) {
        dir.mkdirs();
    }
    var file = new File(File.IMPEX + "/src/sitemaps/others-sitemap-" + currentLocale + '.xml');
    file.createNewFile();

    // Setup file writer
    var fw = new FileWriter(file, "UTF-8");
    var xsw = new XMLStreamWriter(fw);

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

/*
 * Closes XMLStreamWriter object @param xsw : XMLStreamWriter object
 */
function closeFile(xsw) {
    xsw.writeEndElement(); // </urlset>
    xsw.flush();
    xsw.close();
}

/*
 * Returnes Category urls array of sitemap objects @param category : Category
 * @param locObject : Object locale
 */
function getCategoryUrlsForSitemap(category, locObject) {
    let allUrls = [],
        subcatUrls = [];

    if (category.online && category.custom.showInMenu && category.onlineProducts.size() > 0 && category.ID !== "root" || category.online && category.custom.showInMenu && category.ID !== "root") {

        let catUrl = require('int_customfeeds/cartridge/scripts/util/ViewHelpers').getCategoryUrl(category);
        if (!SEOUtilsHelper.isShopAllCategory(category.ID) && checkAvailableProducts(category.onlineProducts.iterator()) && isCorrectSEOurl(catUrl.toString())) {
            catUrl = fixTLD(catUrl, locObject);
            allUrls.push({
                'link': catUrl,
                'lastmodified': category.getLastModified()
            });
        }
    }
    for(let subCategory in category.subCategories) {
        subcatUrls = getCategoryUrlsForSitemap(category.subCategories[subCategory], locObject);
        allUrls = subcatUrls.concat(allUrls);
    }
    return allUrls;
}

/*
 * Builds new url string @param url : URL @param loc : Object locale
 */
function fixTLD(url, loc) {
    let urlArray = url.toString().split('/'),
        localeIndex = urlArray.indexOf(loc.locale),
        protocol = request.httpProtocol;

    if (Site.getCurrent().getCustomPreferenceValue('isEnforceHTTPSEnabled')) {
        protocol = "https";
    }
    // Build new string using request data, correct hostname and sliced urlArray
    return protocol + '://' + loc.hostName + '/' + urlArray.slice(localeIndex, urlArray.length).join('/');
}

/*
 * Returns Refinement object of enduse/color array of sitemap urls @param
 * category : Category @param locObject : Object locale
 */
function getRefUrlsForSitemap(category, locObject) {
    let colorGroupUrls = [],
        endUseUrls = [];

    if (!SEOUtilsHelper.isShopAllCategory(category.ID)  && category.template == 'rendering/category/categoryproducthits') {
        let urls = getRefUrls(category, locObject);
        colorGroupUrls = colorGroupUrls.concat(urls.colorgroup);
        endUseUrls = endUseUrls.concat(urls.enduse);
    }

    for(let subCategory in category.onlineSubCategories) {
        let urls = getRefUrlsForSitemap(category.onlineSubCategories[subCategory], locObject);
        colorGroupUrls = colorGroupUrls.concat(urls.colorgroup);
        endUseUrls = endUseUrls.concat(urls.enduse);
    }

    return {
        "colorgroup": colorGroupUrls,
        "enduse": endUseUrls
    };

}

/*
 * Searches for refinement array of sitemap urls @param category : Category
 * @param Category : Category to search
 * @param locObject : Object locale
 */
function getRefUrls(Category, locObject) {
    var colorGroupUrls = [],
        endUseUrls = [],
        productSearchModel = new ProductSearchModel(),
        tempUrl = '';

    productSearchModel.setCategoryID(Category.ID);
    productSearchModel.setOrderableProductsOnly(true);
    productSearchModel.search();
    var Refinements = productSearchModel.getRefinements();

    if (Refinements != null && Refinements.refinementDefinitions.size() > 0) {
        var refinementsForExcluding = Site.getCurrent().getCustomPreferenceValue('excludedRefinements');
        var refDefsValues = Refinements.refinementDefinitions;
        for(let RefinementDefinition in refDefsValues) {
            if (refDefsValues[RefinementDefinition].getAttributeID() == 'colorgroup' || refDefsValues[RefinementDefinition].getAttributeID() == 'enduse') {
                var SearchModel = productSearchModel,
                    RefinementValues = Refinements.getRefinementValues(refDefsValues[RefinementDefinition]);

                if (RefinementValues.size() > 0) {
                    for(let RefinementValue in RefinementValues) {
                        if (RefinementValue.getHitCount() <= 1) {
                            continue;
                        }
                        if (refDefsValues[RefinementDefinition].getAttributeID() == 'colorgroup') {
                            tempUrl = SearchModel.urlRefineAttributeValue('Search-Show', RefinementValue.getID(), RefinementValue.getValue());
                            if (isCorrectSEOurl(tempUrl.toString())) {
                                tempUrl = fixTLD(tempUrl, locObject);
                                colorGroupUrls.push(tempUrl);
                            }
                        }
                        if (refDefsValues[RefinementDefinition].getAttributeID() == 'enduse') {
                            tempUrl = SearchModel.urlRefineAttributeValue('Search-Show', RefinementValue.getID(), RefinementValue.getValue());
                            if (isCorrectSEOurl(tempUrl.toString())) {
                                tempUrl = fixTLD(tempUrl, locObject);
                                endUseUrls.push(tempUrl);
                            }
                        }
                    }
                }
            }
        }
    }
    return {
        "colorgroup": colorGroupUrls,
        "enduse": endUseUrls
    };
}

/*
 * Returns array of Content urls 
 * @param locObject : Object locale
 * @param locObject : Object locale
 */
function getSitemapContent(locObject) {
    var library = ContentMgr.getSiteLibrary(),
        rootFolder = library.getRoot(),
        allAssets = new ArrayList(),
        searchableAssets = [];

    extractAllAssetsFromFolder(rootFolder, allAssets);
    for (var i = 0; i < allAssets.size(); i++) {
        var asset = allAssets[i],
            url = URLUtils.abs('Page-Show', 'cid', allAssets[i].ID);
        if (allAssets[i].onlineFlag && allAssets[i].getSiteMapIncluded() === 1 && isCorrectSEOurl(url.toString())) {
            searchableAssets.push(fixTLD(url, locObject));
        }
    }
    return searchableAssets;
}

/*
 * Recursive function to get all library content @param folder : Folder to
 * search @param allAssets : ArrayList of assets
 */
function extractAllAssetsFromFolder(folder, allAssets) {
    if (folder.getSubFolders().size() == 0) {
        allAssets.addAll(folder.getContent());
        return;
    } else {
        for (var i = 0; i < folder.getSubFolders().size(); i++) {
            if (folder.getContent().size() > 0) {
                allAssets.addAll(folder.getContent());
            }
            extractAllAssetsFromFolder(folder.getSubFolders()[i], allAssets);
        }
    }
}

/*
 * Searches duplicate links in hreflang files and returns them
 * @param xmlStreamReader : XMLStreamReader of hreflang file
 * @param urls : Array of urls
 * @param type : String url type
 */
function getSkipDuplicateLinksList(xmlStreamReader, urls, type) {
    var duplicateUrls = new Array(),
        checkUrl,
        xmlUrl;

    if (urls && xmlStreamReader) {
        while (xmlStreamReader.hasNext()) {
            if (xmlStreamReader.next() == XMLStreamConstants.START_ELEMENT) {
                var localElementName = xmlStreamReader.getLocalName();
                if (localElementName == "loc") {
                    xmlUrl = xmlStreamReader.readXMLObject().toString();
                } else if (localElementName == "link") {
                    xmlUrl = xmlStreamReader.getAttributeValue(0);
                }
                if (xmlUrl) {
                    for(var url in urls) {
                        if (type == "category") {
                            checkUrl = urls[url].link;
                        } else {
                            checkUrl = urls[url];
                        }
                        if (xmlUrl == checkUrl || xmlUrl.indexOf(checkUrl) > 0) {
                            duplicateUrls.push(checkUrl);
                        }
                    }
                }
            }
        }
    }
    return duplicateUrls;
}

/*
 * prevention of adding wrong url (url with parameters and double slashes) to the file
 * @param url : String
 */
function isCorrectSEOurl(stringUrl) {
    return stringUrl.indexOf("?") === -1 && stringUrl.replace("https://", "").replace("http://", "").indexOf("//") === -1;
}

function checkAvailableProducts(products) {
    var isAvailableProduct = false;

    while (products.hasNext() && !isAvailableProduct) {
        isAvailableProduct = products.next().getAvailabilityModel().isInStock();
    }

    return isAvailableProduct;
}

module.exports = {
    generateOtherSitemaps: generateOtherSitemaps
};
