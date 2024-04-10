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
    xsw.writeAttribute("mode", "delete");
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
function writeBadgeDataToXML(productID, badgeType, xsw) {
    
    if (empty(badgeType)) return;
    
    let locales = Site.getCurrent().getAllowedLocales();

        
    xsw.writeStartElement("product");
    xsw.writeAttribute("product-id", productID);
    xsw.writeStartElement("custom-attributes");
    
    xsw.writeStartElement("custom-attribute");
    if (badgeType === 'new') {
        xsw.writeAttribute("attribute-id", "productTileUpperLeftFlameIconBadge");
        xsw.writeAttribute("xml:lang", "x-default");
    } else if (badgeType === 'newColor') {
        xsw.writeAttribute("attribute-id", "productTileUpperLeftBadge");
        xsw.writeAttribute("xml:lang", "x-default");
    }
    xsw.writeEndElement(); 

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
function removeCategory(product, xsw) {

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
 * Conditons for the badges assignment
 * 
 * @param {Object} product object 
 * @param {XMLStreamWriter} xsw
 */
function removeBadges(product, xsw) {
    var productID = product.getID();  
    
    if (product.custom.productTileUpperLeftFlameIconBadge && product.custom.productTileUpperLeftFlameIconBadge.value === 'new') {
        writeBadgeDataToXML(productID, 'new', xsw);          
    } 
    if (product.custom.productTileUpperLeftBadge && product.custom.productTileUpperLeftBadge.value === 'new-colors-available') {
        writeBadgeDataToXML(productID, 'newColor', xsw);        
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
    
    var file = new File(File.IMPEX + "/src/feeds/newArrivalAssociationRemoval/catalog_associations_newArrival_removeBadging_" + siteID + ".xml");
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
    
    var file = new File(File.IMPEX + "/src/feeds/newArrivalAssociationRemoval/catalog_associations_newArrival_removeCategory_" + siteID + ".xml");
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
function autoUncategorizeNewArrivals(params) {
        
    try {
        if (params.isDisabled) return new Status(Status.OK, 'OK', 'Auto Uncategorize new arrival disabled');
        
        var storefrontCatalogID = params.storefrontCatalogID || CatalogMgr.getSiteCatalog().getID();
        var masterCatalogID = params.masterCatalogID;

        var dir = new File(File.IMPEX + "/src/feeds/newArrivalAssociationRemoval/");
        dir.mkdirs();

        var categoryxsw = startCategorizeNewArrivals(storefrontCatalogID);
        var badgexsw = startBadgeNewArrivals(masterCatalogID);
        
        var products = CatalogMgr.getCategory('new-arrivals').getProducts().iterator();
        var sitePreferences = Site.current.preferences.custom;
        var newArrivalInterval = 'newArrivalInterval' in sitePreferences ? sitePreferences.newArrivalInterval : 45;
        
        while (products.hasNext()) {
            var product = products.next();

            if (!product.master) continue;
            
            if(product.custom.activationDate) 
            {
                var Calendar = require('dw/util/Calendar');
                var cal = new Calendar();
                var difference = (cal.time - product.custom.activationDate) / (1000 * 3600 * 24);
                if(Math.floor(difference) <= newArrivalInterval) continue;
            }        
            removeCategory(product, categoryxsw);
            removeBadges(product, badgexsw);
        }
        
        endStreamWriter(categoryxsw);
        endStreamWriter(badgexsw);
        return new Status(Status.OK, 'OK', 'Auto UnCategorize new arrival completed');
    } catch (e) {
        Logger.error("AutoRemoveNewArrivals.js: Could not create Auto Categorize New Arrivals xml file " + " - " + e);
        return new Status(Status.ERROR, 'ERROR', 'Auto Uncategorize new arrival Error state');
    }
}
/* Exported methods */
module.exports = {
    autoUncategorizeNewArrivals: autoUncategorizeNewArrivals
};