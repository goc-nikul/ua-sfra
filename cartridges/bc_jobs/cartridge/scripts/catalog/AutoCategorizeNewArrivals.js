'use strict';

/*
 * Generate 
 * generates the xml for assigning new arrival prodcuts to new arrival category
 * generates the xml for assigning new arrival prodcuts badges
 */
/* API Includes */
var CatalogMgr = require('dw/catalog/CatalogMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var Site = require('dw/system/Site');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Logger = require("dw/system/Logger");
var Status = require('dw/system/Status');
var Locale = require('dw/util/Locale');
var productUtils = require('int_customfeeds/cartridge/scripts/util/ProductUtils')


/**
 * Writes category assignment xml for single category
 * 
 * @param {String} productID to assign categories to
 * @param {String} categoryID ID to assign to this product
 * @param {XMLStreamWriter} xsw
 */
 function writeCategoryDataToXML(productID, categoryID, xsw) {
    
    if (empty(categoryID)) return;
    xsw.writeStartElement("category-assignment");
    xsw.writeAttribute("category-id", categoryID);
    xsw.writeAttribute("product-id", productID);
    xsw.writeEndElement(); //</category-assignment>

    xsw.flush();
}

/**
 * Writes Badge assignment xml for the product
 * 
 * @param {String} productID to assign categories to
 * @param {JSON} badgeType ID to assign to this product
 * @param {XMLStreamWriter} xsw
 */
function writeBadgeDataToXML(productID, badgeType, setDefaultActivaitonDate, xsw) {
    
    if (empty(badgeType)) return;
    
    let locales = Site.getCurrent().getAllowedLocales();
    let Calendar = require('dw/util/Calendar');
    let cal = new Calendar();
    var time = cal.time.toISOString();     
    time = time.replace("Z", "+0000");


    xsw.writeStartElement("product");
    xsw.writeAttribute("product-id", productID);
    xsw.writeStartElement("custom-attributes");

    
    xsw.writeStartElement("custom-attribute");
    if (badgeType === 'new') {
        xsw.writeAttribute("attribute-id", "productTileUpperLeftFlameIconBadge");
        xsw.writeAttribute("xml:lang", 'x-default');
        xsw.writeCharacters("new");
    } else if (badgeType === 'newColor') {
        xsw.writeAttribute("attribute-id", "productTileUpperLeftBadge");
        xsw.writeAttribute("xml:lang", 'x-default');
        xsw.writeCharacters("new-colors-available");
    } 
    
    xsw.writeEndElement(); 

    if(setDefaultActivaitonDate) {
        xsw.writeStartElement("custom-attribute");
        xsw.writeAttribute("attribute-id", "activationDate");
        xsw.writeCharacters(time);
        xsw.writeEndElement(); 
    }
    
    xsw.writeEndElement(); 
    xsw.writeEndElement(); //</product>

    xsw.flush();

}

/**
 * Conditons for the categories assignment
 * 
 * @param {Object} product object 
 * @param {XMLStreamWriter} xsw
 */
function assignCategory(product, xsw) {

    var productID = product.getID();  
        
    writeCategoryDataToXML(productID, 'new-arrivals', xsw);

    switch (product.custom.gender) {
        case 'Boys':
            writeCategoryDataToXML(productID, 'new-arrivals-kids', xsw);
            break;
        case 'Girls':
            writeCategoryDataToXML(productID, 'new-arrivals-kids', xsw);
            break;
        case 'Mens':
            writeCategoryDataToXML(productID, 'new-arrivals-mens', xsw);
            break;
        case 'Womens':
            writeCategoryDataToXML(productID, 'new-arrivals-womens', xsw);
            break;
        case 'Unisex':
            writeCategoryDataToXML(productID, 'new-arrivals-kids', xsw);
            writeCategoryDataToXML(productID, 'new-arrivals-womens', xsw);
            writeCategoryDataToXML(productID, 'new-arrivals-mens', xsw);
            break;
        case 'Adult Unisex':
        case 'AdultUnisex':
        case 'Adultunisex':
        case 'adult_unisex':
            writeCategoryDataToXML(productID, 'new-arrivals-womens', xsw);
            writeCategoryDataToXML(productID, 'new-arrivals-mens', xsw);
            break;
        case 'Youth Unisex':
        case 'YouthUnisex':
        case 'Youthunisex':
        case 'youth_unisex':
            writeCategoryDataToXML(productID, 'new-arrivals-kids', xsw);
            break;
    }

    if (product.custom.division === 'Footwear') {
        writeCategoryDataToXML(productID, 'new-arrivals-shoes', xsw);        
    }
}

/**
 * check if any variant has a single standard and sales price difference
 * 
 * @param {Object} variants list of the product objects 
 * @param {integer} currentIndex starting index for the price comparision
 *  @return {boolean} true/false
 */

function hasPriceDifference(variants, currentIndex) {
    
    if (currentIndex >= variants.length) {
        return false;
    }

    let locale = Site.getCurrent().getDefaultLocale();
    let currencyCode = Site.getCurrent().getDefaultCurrency();
    let standardPrice = productUtils.getPriceByPricebook(variants[currentIndex], currencyCode, 'list', locale),
    salesPrice = productUtils.getPriceByPricebook(variants[currentIndex], currencyCode, 'sale', locale);

    if (salesPrice.valueOrNull == null || salesPrice.valueOrNull === 0) {
        salesPrice = standardPrice;
    }
    if ( standardPrice.value != salesPrice.value) {
        return true;
    }

    return hasPriceDifference(variants, currentIndex + 1);
}
    
/**
 * Conditons for the badges assignment
 * 
 * @param {Object} product object 
 * @param {XMLStreamWriter} xsw
 */
function assignBadges(product, xsw, setDefaultActivaitonDate) {
    var productID = product.getID();  
    var experienceType = product.custom.experienceType.value;
    var outletColors = product.custom.outletColors;

    if (experienceType === 'allMerchOverride') {
        if ( outletColors && outletColors !== '00') {
            writeBadgeDataToXML(productID, 'newColor', setDefaultActivaitonDate, xsw);                
        } else {
            writeBadgeDataToXML(productID, 'new', setDefaultActivaitonDate, xsw)
        }
    } else if(experienceType === 'outlet' || experienceType === 'both' || experienceType === 'outletMerchOverride') {
        writeBadgeDataToXML(productID, 'newColor', setDefaultActivaitonDate, xsw);     
    } else if(experienceType === 'premium' || experienceType === 'premiumMerchOverride') {
        writeBadgeDataToXML(productID, 'new', setDefaultActivaitonDate, xsw)
    }
}
    
/**
 * Initial xml file to set the new arrival product level badging attributes
 * 
 * @param {string} masterCatalogID  
 * @param {XMLStreamWriter} xsw
 */
function startBadgeNewArrivals(masterCatalogID){

    var xsw,
    siteID = Site.getCurrent().getID().toLowerCase();
    
    var file = new File(File.IMPEX + "/src/feeds/newArrivalAssociation/catalog_associations_newArrival_badging_" + siteID + ".xml");
    file.createNewFile();

    // Setup file writer
    var fw = new FileWriter(file, "UTF-8");
    xsw = new XMLStreamWriter(fw);

    // Begin The XML document
    xsw.writeStartDocument("UTF-8", "1.0");
    xsw.writeCharacters("\n");
    xsw.writeStartElement("catalog");
    xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
    xsw.writeAttribute("catalog-id", masterCatalogID);
    xsw.writeCharacters("\n");

    return xsw;
}

/**
 * Initial xml file to set the new arrival categories
 * 
 * @param {string} storefrontCatalogID  
 * @param {XMLStreamWriter} xsw
 */
function startCategorizeNewArrivals(storefrontCatalogID){
    
    var xsw,
    siteID = Site.getCurrent().getID().toLowerCase();
    
    var file = new File(File.IMPEX + "/src/feeds/newArrivalAssociation/catalog_associations_newArrival_category_" + siteID + ".xml");
    file.createNewFile();

    // Setup file writer
    var fw = new FileWriter(file, "UTF-8");
    xsw = new XMLStreamWriter(fw);

    // Begin The XML document
    xsw.writeStartDocument("UTF-8", "1.0");
    xsw.writeCharacters("\n");
    xsw.writeStartElement("catalog");
    xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
    xsw.writeAttribute("catalog-id", storefrontCatalogID);
    xsw.writeCharacters("\n");

    return xsw;
}

/**
 * end the xml feed file
 * 
 * @param {string} storefrontCatalogID  
 * @param {XMLStreamWriter} xsw
 */
function endStreamWriter (xsw) {
    xsw.writeEndElement(); // </catalog>
    xsw.writeEndDocument();
    xsw.flush();
    xsw.close();
}

/**
 * generate a xml to auto categorize the new arrival products
 * 
 * @param {Object} params 
 */
function autoCategorizeNewArrivals(params) {
        
    try {
        if (params.isDisabled) return new Status(Status.OK, 'OK', 'Auto Categorize new arrival disabled');
        
        var storefrontCatalogID = params.storefrontCatalogID || CatalogMgr.getSiteCatalog().getID();
        var masterCatalogID = params.masterCatalogID;

        var dir = new File(File.IMPEX + "/src/feeds/newArrivalAssociation/");
        dir.mkdirs();

        var categoryxsw = startCategorizeNewArrivals(storefrontCatalogID);
        var badgexsw = startBadgeNewArrivals(masterCatalogID);
        
        var products = CatalogMgr.getCategory('prep-category').getProducts().iterator();
        var sitePreferences = Site.current.preferences.custom;
        var newArrivalInterval = 'newArrivalInterval' in sitePreferences ? sitePreferences.newArrivalInterval : 45;
        
        while (products.hasNext()) {
            var product = products.next();

            if (!product.master) continue;
            
            var setDefaultActivaitonDate = false;

            if(product.custom.skipResetActivationDate && product.custom.activationDate) {
                var activationDate = new Date(product.custom.activationDate );
                var Calendar = require('dw/util/Calendar');
                var cal = new Calendar();
                var difference = (cal.time - activationDate) / (1000 * 3600 * 24);
                if(Math.floor(difference) > newArrivalInterval) continue;        
            } else if (product.custom.skipResetActivationDate && !product.custom.activationDate) {
                continue;
            } else {
                setDefaultActivaitonDate = true;
            }   
            
            assignCategory(product, categoryxsw);
            assignBadges(product, badgexsw, setDefaultActivaitonDate);
        }
        
        endStreamWriter(categoryxsw);
        endStreamWriter(badgexsw);
        return new Status(Status.OK, 'OK', 'Auto Categorize new arrival completed');
    } catch (e) {
        Logger.error("AutoCategorizeNewArrivals.js: Could not create Auto Categorize New Arrivals xml file " + " - " + e);
        return new Status(Status.ERROR, 'ERROR', 'Auto Categorize new arrival Error state');
    }
}
/* Exported methods */
module.exports = {
    autoCategorizeNewArrivals: autoCategorizeNewArrivals
};