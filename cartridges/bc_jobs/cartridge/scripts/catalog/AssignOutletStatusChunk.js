'use strict';
const Catalog = require('dw/catalog');
const ProductSearchModel = require('dw/catalog/ProductSearchModel');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var outletStatus = require('bc_jobs/cartridge/scripts/catalog/AssignOutletStatus');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var Site = require('dw/system/Site');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Logger = require("dw/system/Logger");
var Status = require('dw/system/Status');
var Locale = require('dw/util/Locale');

var allSiteProducts;
var fileWriter;
var xmlStreamWriter;
var localeList = null;
var updateUnorderableVariants;
var processOnlineOrEcommAssortmentProductsOnly;
var useProductSearchModel;
var PSM;


function writeHeader(catId) {
    //XML Header
    xmlStreamWriter.writeStartDocument("UTF-8", "1.0");
    xmlStreamWriter.writeCharacters("\n");
    xmlStreamWriter.writeStartElement("catalog");
    xmlStreamWriter.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
    xmlStreamWriter.writeAttribute("catalog-id", catId);
    xmlStreamWriter.writeCharacters("\n");
}

/*======= JOB STEPS =======
First Step (MERGE):
1. Create a Product XML that checks for price discrepancies between sale and list prices in variants
2. If discrepancies are found, mark those products as isOutlet, and include outletColors
3. If no discrepancies are found, remove isOutlet

Second Step (REPLACE):
1. Loop through Products
2. Write a Catalog XML that removes or adds products to Outlet categories*/

/**
 * Determine if product is Outlet or Premium based on variant prices.
 *
 * Set custom attributes for: isOutlet, experienceType, outletColors
 */
function getOutletData(product) {
    try {
        let productUtils = require('int_customfeeds/cartridge/scripts/util/ProductUtils'),
        variants = product.getVariants().iterator(),
        pvm = product.getVariationModel(),
        pva = pvm.getProductVariationAttribute('color'),
        allColors = {},
        outletColors = {},
        variantData = [],
        experienceType = 'both',
        variantUpdated = false,
        retObj = {},
        premiumFilter;

        // Product filter
        // Site array typically following
        // [0] default, [1] en_CA, [2] fr_CA
        let locales = Site.getCurrent().getAllowedLocales();

        while(variants.hasNext()){
            var localizedData = {};
            let variant = variants.next(),
                color = pvm.getVariationValue(variant, pva),
                customColor = variant.custom && variant.custom.color ? variant.custom.color : '',
                colorID = (color) ? color.ID : customColor,
                variantUpdated = false;
            if (empty(colorID)) continue;
            if (updateUnorderableVariants === false && !variant.getAvailabilityModel().orderable) continue; // If job pref is false, skip variants which are not orderable.

            for (var i = 0; i < locales.length; i++) {
                let locale = locales[i].trim();
                request.setLocale(locale);
                let countryCode = Locale.getLocale(locale).getCountry();
                let currencyCode = outletStatus.getCurrencyCode(countryCode);
                var merchOverrideActive = product.custom.experienceType && product.custom.experienceType.value && product.custom.experienceType.value.indexOf('Merch') !== -1;
                localizedData[locale] = {};
                if (!(locale in outletColors)) {
                    outletColors[locale] = [];
                }
                if (!(locale in allColors)) {
                    allColors[locale] = [];
                }
                if (allColors[locale].indexOf(colorID) == -1) allColors[locale].push(colorID);
                let standardPrice = productUtils.getPriceByPricebook(variant, currencyCode, 'list', locale),
                    salesPrice = productUtils.getPriceByPricebook(variant, currencyCode, 'sale', locale);

                if (salesPrice.valueOrNull == null || salesPrice.valueOrNull === 0) {
                    salesPrice = standardPrice;
                }

                // Check if Standard price is not equal to Sale price
                if ( salesPrice.value < standardPrice.value ) {
                    // Variant is Outlet
                    premiumFilter = merchOverrideActive ? 'both' : 'outlet';
                    if (variant.custom.isOutlet.value !== "Yes" || variant.custom.premiumFilter.value !== premiumFilter) {
                        localizedData[locale] = { outlet : "Yes", premiumFilter: premiumFilter};
                        variantUpdated = true;
                    } else {
                        // This would appear that localized variant is keeping same values?
                        // Why are we writing this out again?
                        localizedData[locale] = { outlet : variant.custom.isOutlet.value, premiumFilter: variant.custom.premiumFilter.value};
                    }
                    // Appears only adds color to OutletColors not in else section?
                    if (outletColors[locale].indexOf(colorID) == -1) outletColors[locale].push(colorID);

                } else {
                    // Variant is Premium
                    premiumFilter = merchOverrideActive ? 'both' : 'premium';
                    if (variant.custom.isOutlet.value !== "No" || variant.custom.premiumFilter.value !== premiumFilter) {
                        localizedData[locale] = { outlet : "No", premiumFilter: premiumFilter};
                        variantUpdated = true;
                    } else {
                        // This would appear that localized variant is keeping same values?
                        // Why are we writing this out again?
                        localizedData[locale] = { outlet : variant.custom.isOutlet.value, premiumFilter: variant.custom.premiumFilter.value};
                    }
                }
            }
            // Only Push Variant if localized Data Changed?
            if (variantUpdated) {
                variantData.push({ ID : variant.ID, localizedData : localizedData});
            }
        }
        retObj.experienceType = {};
        retObj.outletColors = {};
        for (var i = 0; i < locales.length; i++) {
            let locale = locales[i].trim();
            experienceType = 'both';
            if(empty(outletColors[locale])){
                experienceType = 'premium'; // No outlet colors available, therefore experience type must be premium
             } else if (outletColors[locale] && outletColors[locale].length && allColors[locale] && allColors[locale].length && outletColors[locale].length === allColors[locale].length) {
                experienceType = 'outlet'; // outlet colors are available, therefore experience type must be outlet
             }
            retObj.experienceType[locale] = experienceType;
            retObj.outletColors[locale] = outletColors[locale] ? outletColors[locale].toString() : '';
        }
        retObj.variantData = variantData;
        return (retObj);

    } catch (e) {
        Logger.error("AssignOutletStatusChunk: getOutletData comparePricebooks function failed for child of product " + product.ID + ".  Error: " + e);
        return retObj;
    }
}

function writeProductData(outletData){
    try {
        let product = outletData.product;
        xmlStreamWriter.writeStartElement("product");
        xmlStreamWriter.writeAttribute("product-id", product.ID);
        xmlStreamWriter.writeStartElement("custom-attributes");
        for (var p = 0; p < localeList.size(); p++) {
            let locale = localeList.get(p).trim();
            let dataLocale = ((locale === 'x-default') ? Site.getCurrent().getDefaultLocale() : locale.replace('-','_'));
            request.setLocale(dataLocale);
            xmlStreamWriter.writeStartElement("custom-attribute");
            xmlStreamWriter.writeAttribute("xml:lang", locale);
            xmlStreamWriter.writeAttribute("attribute-id", "outletColors");
            xmlStreamWriter.writeCharacters(outletData.outletColors[dataLocale] ? outletData.outletColors[dataLocale] : '00' ); //00 required so empty value does not trigger fallback to default locale
            xmlStreamWriter.writeEndElement();//</custom-attribute>

            if (!product.custom.experienceType.value || (product.custom.experienceType.value && product.custom.experienceType.value.indexOf('Merch') == -1)) {
                xmlStreamWriter.writeStartElement("custom-attribute");
                xmlStreamWriter.writeAttribute("xml:lang", locale);
                xmlStreamWriter.writeAttribute("attribute-id", "experienceType");
                xmlStreamWriter.writeCharacters(outletData.experienceType[dataLocale]);
                xmlStreamWriter.writeEndElement();//</custom-attribute>
            }
        }
        xmlStreamWriter.writeEndElement();//</custom-attributes>
        xmlStreamWriter.writeEndElement();//</product>
        xmlStreamWriter.writeCharacters("\n");
    } catch (e) {
        Logger.error('AssignOutletStatusChunk writeProductData step failed. Error: ' + e);
        throw new Status(Status.ERROR);
    }
}

function writeVariantData(outletData){
  try {
    let variantData = outletData.variantData;

    for (var v = 0; v < variantData.length; v++) {
        let variantObj = variantData[v];
    	xmlStreamWriter.writeStartElement("product");
        xmlStreamWriter.writeAttribute("product-id", variantObj.ID);
        xmlStreamWriter.writeStartElement("custom-attributes");

        for (var i = 0; i < localeList.size(); i++) {
            let locale = localeList.get(i).trim();
            let dataLocale = ((locale === 'x-default') ? Site.getCurrent().getDefaultLocale() : locale.replace('-','_'));
            let localizedVariantData = variantObj.localizedData[dataLocale];
            xmlStreamWriter.writeStartElement("custom-attribute");
            xmlStreamWriter.writeAttribute("xml:lang", locale);
            xmlStreamWriter.writeAttribute("attribute-id", "isOutlet");
            xmlStreamWriter.writeCharacters(localizedVariantData.outlet);
            xmlStreamWriter.writeEndElement();//</custom-attribute>
            // Set premiumFilter variant attribute
            xmlStreamWriter.writeStartElement("custom-attribute");
            xmlStreamWriter.writeAttribute("xml:lang", locale);
            xmlStreamWriter.writeAttribute("attribute-id", "premiumFilter");
            xmlStreamWriter.writeCharacters(localizedVariantData.premiumFilter);
            xmlStreamWriter.writeEndElement();//</custom-attribute>
        }
        xmlStreamWriter.writeEndElement();//</custom-attributes>
        xmlStreamWriter.writeEndElement();//</product>
    	xmlStreamWriter.writeCharacters("\n");
    }
  } catch (e) {
    Logger.error('AssignOutletStatusChunk writeVariantData step failed. For Variant Error: ' + e);
    throw new Status(Status.ERROR);
  }
}

exports.beforeStep = function( parameters, stepExecution )
{
    try {
        let siteID = Site.getCurrent().getID().toLowerCase(),
        storefrontCatalogID = parameters.storefrontCatalogID || CatalogMgr.getSiteCatalog().getID(),
        dir = new File(File.IMPEX + "/src/feeds/outletStatus");
        updateUnorderableVariants = parameters.updateUnorderableVariants;
        processOnlineOrEcommAssortmentProductsOnly = parameters.processOnlineOrEcommAssortmentProductsOnly || false;
        // runForLocales = (!empty(parameters) && !empty(parameters.runForLocales) ? parameters.runForLocales.split(',') : null);
        useProductSearchModel = parameters.useProductSearchModel || false;

        dir.mkdirs();
        let file = new File(File.IMPEX + "/src/feeds/outletStatus/setOutletData_" + siteID + ".xml");
        if (useProductSearchModel) {
            PSM = new ProductSearchModel();
            PSM.setCategoryID(CatalogMgr.getCatalog(storefrontCatalogID).getRoot().getID());
            PSM.setRecursiveCategorySearch(true);
            PSM.search();
            allSiteProducts = PSM.getProducts();
        } else {
            allSiteProducts = ProductMgr.queryAllSiteProducts();
        }
        // This is using assignOutetStatus getLocaleStrings()
        // This is now an ArrayList and doesn't include the locale == default.
        // Also if locale is en-US or de-DE then locale = x-default
        localeList = outletStatus.getLocaleStrings();
        file.createNewFile();
        fileWriter = new FileWriter(file, 'UTF-8');
        xmlStreamWriter = new XMLStreamWriter(fileWriter);
        // Write The Header for the file
        writeHeader(storefrontCatalogID);
    } catch (e) {
        try {
            fileWriter.close();
        } catch (e) {
            // Trying to make sure fileWriter is closed
        }
        Logger.error("AssignOutletStatusChunk beforeStep failed.  Error: " + e);
        throw new Status(Status.ERROR);
    }
}

exports.getTotalCount = function( parameters, stepExecution )
{
    if (useProductSearchModel) {
        return PSM.getCount();
    } else {
        return allSiteProducts.getCount();
    }
}

exports.read = function( parameters, stepExecution )
{
  if( allSiteProducts.hasNext() )
  {
    return allSiteProducts.next();
  }
}

exports.process = function( product, parameters, stepExecution )
{
    if (product.isMaster()) {
        if (processOnlineOrEcommAssortmentProductsOnly && !(product.online || (product.custom && 'ecommAssortment' in product.custom && product.custom.ecommAssortment))) {
            // Nothing to process here.
            return;
        }
        try {
            let outletData = getOutletData(product);
            let linesToWrite = '';
            if (!empty(outletData)) {
                // During Writing it never uses the default locale and if locale is en-US or de-DE then uses x-default
                // Get Lines for Product Data....
                outletData.product = product;
                return outletData;
            }
        } catch (e) {
            Logger.error('AssignOutletStatusChunk process step failed. For Product:'  + product.ID + ' Error: ' + e);
            throw new Status(Status.ERROR);
        }
    }
}

exports.write = function( lines, parameters, stepExecution )
{
    // Lines is actually outletData
  for ( let w = 0; w < lines.size(); w++ )
  {
    // Write Out Product Data
    writeProductData(lines.get(w));
    // Write Out Variant Data
    writeVariantData(lines.get(w));
  }
}

exports.afterStep = function( success, parameters, stepExecution )
{
    try {
        if( success )
        {
            xmlStreamWriter.writeEndElement(); // </catalog>
            xmlStreamWriter.flush();
            xmlStreamWriter.close();
        }
    } catch (e) {
        Logger.error('AssignOutletStatusChunk Error in while closing xmlStreamWriter - errorMsg: {0}', e.message);
        throw new Status(Status.ERROR, 'ERROR: Error while closing xmlStreamWriter: ' + e);
    }
    try {
        fileWriter.close();
    } catch (e) {
        Logger.error('AssignOutletStatusChunk Error in while closing FileWriter - errorMsg: {0}', e.message);
        throw new Status(Status.ERROR, 'ERROR: Error while querying FileWriter: ' + e);
    }
    try {
        if (!useProductSearchModel) {
            allSiteProducts.close();
        }
    } catch (e) {
        Logger.error('AssignOutletStatusChunk Error in while closing SeekableIterator Products - errorMsg: {0}', e.message);
        throw new Status(Status.ERROR, 'ERROR: Error while querying Products: ' + e);
    }
    return new Status(Status.OK, 'OK', 'Finished');
}
