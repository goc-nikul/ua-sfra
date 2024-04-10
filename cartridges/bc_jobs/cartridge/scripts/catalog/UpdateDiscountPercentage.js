'use strict';

var File = require('dw/io/File');
var Logger = require('dw/system/Logger');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');

var allowedCurrencies;
var allowedLocales;
var attDataObj;
var collections;
var count = 0;
var countries;
var currentSite;
var FileWriter;
var PreferencesUtil;
var priceFactory;
var PriceHelper;
var productHits;
var products;
var psm;
var xsw;

// eslint-disable-next-line consistent-return
exports.beforeStep = function () {
    try {
        PriceHelper = require('app_ua_core/cartridge/scripts/util/PriceHelper');
        FileWriter = require('dw/io/FileWriter');
        var XMLStreamWriter = require('dw/io/XMLStreamWriter');
        priceFactory = require('*/cartridge/scripts/factories/price');
        PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        countries = PreferencesUtil.getJsonValue('countriesJSON');
        collections = require('*/cartridge/scripts/util/collections');

        currentSite = Site.getCurrent();

        // Create xml file that will be used to update the catalog products
        var date = new Date();
        var filename = 'discountPercentages_' + currentSite.ID + '_' + date.getFullYear() + (date.getMonth() + 1) + (date.getDate() + 1) + (date.getHours() + 1) + (date.getMinutes() + 1) + (date.getMilliseconds()) + '.xml';
        var workingFolder = File.IMPEX + '/src/feeds/discountpercentage/';
        new File(workingFolder).mkdirs();
        var file = new File(workingFolder + filename);
        file.createNewFile();

        try {
            // Setup file writer variables
            var fw = new FileWriter(file, 'UTF-8');
            xsw = new XMLStreamWriter(fw);

            // Begin The XML document
            xsw.writeStartDocument('UTF-8', '1.0');
            xsw.writeStartElement('catalog');
            xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
            xsw.writeAttribute('catalog-id', 'EMEACatalog');
        } catch (e) {
            Logger.error('UpdateDiscountPercentage.js: Could not create and start xml file: ' + e);
            return new Status(Status.ERROR, 'ERROR: Could not create and start xml file: ' + e);
        }

        allowedCurrencies = currentSite.getAllowedCurrencies();
        allowedLocales = currentSite.getAllowedLocales();

        const psm = new ProductSearchModel();
        psm.setCategoryID('root');
        psm.setRecursiveCategorySearch(true);
        psm.setOrderableProductsOnly(true);
        psm.search();
        count = psm.count;
        productHits = psm.getProductSearchHits();
    } catch (e) {
        Logger.error('UpdateDiscountPercentage.js: Error while processing site products: ' + e);
        return new Status(Status.ERROR, 'ERROR: Error while processing site products: ' + e);
    }
};

exports.getTotalCount = function () {
    return count;
};

exports.read = function (parameters) {
    if (!productHits || !productHits.hasNext()) return null;
    var productHit = productHits.next();
    var product = productHit.product;

    return product;
};


/**
 * Calculates breakpoint for the value
 * @param {number} value - value to be returned as breakpoint
 * @returns {number} - breakpoint value
 */
function breakPoint(value) {
    let breakPointVal = '';
    if (value >= 0 && value <= 20) {
        breakPointVal = 20;
    } else if (value > 20 && value <= 30) {
        breakPointVal = 30;
    } else if (value > 30 && value <= 40) {
        breakPointVal = 40;
    } else if (value > 40 && value <= 50) {
        breakPointVal = 50;
    } else if (value > 50) {
        breakPointVal = 51;
    }

    return breakPointVal;
}

/**
 * 
 * @param {dw.catalog.Product} product - Product to update attribute
 * @returns - void
 */
function calculateDiscountPercentage(product) {
    try {
        if (product.isMaster()) return;
        var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(product);
        var priceObj = priceFactory.getPrice(product, null, true, promotions, null);
        if (!priceObj || !priceObj.list || !priceObj.sales || !priceObj.list.value || !priceObj.sales.value) {
            xsw.writeCharacters('');
            return;
        }
        var amountDiff = priceObj.list.value - priceObj.sales.value;
        var discountPercentage = Number(Math.floor((amountDiff / priceObj.list.value) * 100)).toFixed(0);
        var breakPointVal = Number(breakPoint(discountPercentage)).toFixed(0);
        xsw.writeCharacters(breakPointVal);
    } catch (e) {
        Logger.error("UpdateDiscountPercentage - calculateDiscountPercentage function failed for child of product " + product.ID + ".  Error: " + e);
    }
}

exports.process = function (masterProduct) {
    try {
        collections.forEach(masterProduct.variants, function (product) {
            xsw.writeStartElement('product');
            xsw.writeAttribute('product-id', product.ID);
            xsw.writeStartElement('custom-attributes');
            countries.forEach(countryObj => {
                var countryCode = countryObj.countryCode;
                var locales = countryObj.locales;
                var priceBooks = countryObj.priceBooks;
                var currencyCode = countryObj.currencyCode.toUpperCase();
                try {
                    if (allowedCurrencies.indexOf(currencyCode) < 0) {
                        return;
                    }
                    locales.forEach(locale => {
                        try {
                            if (allowedLocales.indexOf(locale) < 0) {
                                return;
                            }
                            session.setCurrency(dw.util.Currency.getCurrency(currencyCode));
                            request.setLocale(locale);
                            xsw.writeStartElement('custom-attribute');
                            xsw.writeAttribute('attribute-id', 'discountPercentage');
                            xsw.writeAttribute('xml:lang', locale.replace('_', '-'));
                            PriceHelper.setSitesApplicablePriceBooks(countryCode, countries);
                            calculateDiscountPercentage(product);
                            xsw.writeEndElement(); // </custom-attribute
                        } catch (err) {
                            Logger.error("calculateDiscountPercentage - locale - function failed for child of product " + product.ID + ".  Error: " + err);
                        }
                    });
                } catch (err) {
                    Logger.error("calculateDiscountPercentage - variants - function failed for child of product " + product.ID + ".  Error: " + err);
                }
            });
            xsw.writeEndElement(); // </custom-attributes
            xsw.writeEndElement(); // </product
        });
    } catch (e) {
        Logger.error("UpdateDiscountPercentage - process function failed for child of product " + masterProduct.ID + ".  Error: " + e);
    }
};

// eslint-disable-next-line consistent-return
exports.write = function () { };

// eslint-disable-next-line consistent-return
exports.afterStep = function (success) {
    if (success) {
        try {
            // Write the closing Feed element, then flush & close the stream
            xsw.writeEndDocument();
            xsw.flush();
            xsw.close();
        } catch (e) {
            Logger.error('UpdateDiscountPercentage.js: Could not close file:: ' + e);
            return new Status(Status.ERROR, 'ERROR: Could not close file:: ' + e);
        }
    }
};
