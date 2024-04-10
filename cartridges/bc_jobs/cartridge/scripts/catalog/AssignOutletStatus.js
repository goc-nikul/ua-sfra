'use strict';
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var Site = require('dw/system/Site');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Logger = require("dw/system/Logger");
var Status = require('dw/system/Status');
var Locale = require('dw/util/Locale');

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
function getOutletData(product, updateUnorderableVariants) {
    let productUtils = require('int_customfeeds/cartridge/scripts/util/ProductUtils'),
            variants = product.getVariants().iterator(),
            pvm = product.getVariationModel(),
            pva = pvm.getProductVariationAttribute('color'),
            allColors = {},
            outletColors = {},
            variantData = [],
            experienceType = 'both',
            retObj = {},
            premiumFilter;

    try {
        // Product filter
        var locales = Site.getCurrent().getAllowedLocales();

        while(variants.hasNext()){
            var localizedData = {};
            let variant = variants.next(),
                color = pvm.getVariationValue(variant, pva),
                customColor = variant.custom && variant.custom.color ? variant.custom.color : '',
                colorID = (color) ? color.ID : customColor;
            if (empty(colorID)) continue;
            if (updateUnorderableVariants === false && !variant.getAvailabilityModel().orderable) continue; // If job pref is false, skip variants which are not orderable.

            for each(let locale in locales) {
                request.setLocale(locale);
                let countryCode = Locale.getLocale(locale).getCountry();
                let currencyCode = getCurrencyCode(countryCode);
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
                    } else {
                        localizedData[locale] = { outlet : variant.custom.isOutlet.value, premiumFilter: variant.custom.premiumFilter.value};
                    }

                    if (outletColors[locale].indexOf(colorID) == -1) outletColors[locale].push(colorID);

                } else {
                    // Variant is Premium
                    premiumFilter = merchOverrideActive ? 'both' : 'premium';
                    if (variant.custom.isOutlet.value !== "No" || variant.custom.premiumFilter.value !== premiumFilter) {
                        localizedData[locale] = { outlet : "No", premiumFilter: premiumFilter};
                    } else {
                        localizedData[locale] = { outlet : variant.custom.isOutlet.value, premiumFilter: variant.custom.premiumFilter.value};
                    }
                }
            }
            variantData.push({ ID : variant.ID, localizedData : localizedData});
        }
        retObj.experienceType = {};
        retObj.outletColors = {};
        for each(let locale in locales) {
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
        Logger.error("comparePricebooks function failed for child of product " + product.ID + ".  Error: " + e);
        return retObj;
    }
}

function assignOutletStatus(args) {
    try {
        let siteID = Site.getCurrent().getID().toLowerCase(),
            storefrontCatalogID = args.storefrontCatalogID || CatalogMgr.getSiteCatalog().getID(),
            xsw,
            dir = new File(File.IMPEX + "/src/feeds/outletStatus"),
            locales = getLocaleStrings(),
            updateUnorderableVariants = args.updateUnorderableVariants,
            processOnlineOrEcommAssortmentProductsOnly = args.processOnlineOrEcommAssortmentProductsOnly || false;

        dir.mkdirs();

        let file = new File(File.IMPEX + "/src/feeds/outletStatus/setOutletData_" + siteID + ".xml");
        file.createNewFile();

        let fw = new FileWriter(file, "UTF-8");
        xsw = new XMLStreamWriter(fw);

        //XML Header
        xsw.writeStartDocument("UTF-8", "1.0");
        xsw.writeCharacters("\n");
        xsw.writeStartElement("catalog");
        xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
        xsw.writeAttribute("catalog-id", storefrontCatalogID);
        xsw.writeCharacters("\n");

        let allSiteProducts = ProductMgr.queryAllSiteProducts();

        while (allSiteProducts.hasNext()) {
            let product = allSiteProducts.next(),
                outletData = '';

            //Used to get master items from search hit
            if (product.isMaster()) {
                // Skip the product if the processOnlineOrEcommAssortmentProductsOnly flag is enabled for the job and the product is not online or ecomm assortment
                if (processOnlineOrEcommAssortmentProductsOnly && !(product.online || (product.custom && 'ecommAssortment' in product.custom && product.custom.ecommAssortment))) {
                    continue;
                }
                outletData = getOutletData(product, updateUnorderableVariants);
                if (!empty(outletData)) {
                    writeProductData(product, outletData, locales, xsw);
                    if (outletData.variantData.length) {
                        writeVariantData(outletData.variantData, locales, xsw);
                    }
                }
            }
        }
        xsw.writeEndElement(); // </catalog>
        xsw.flush();
        xsw.close();

        return new Status(Status.OK);
    } catch (e) {
        Logger.error("AssignOutletStatus step failed.  Error: " + e);
        return new Status(Status.ERROR);
    }
}

function writeProductData(product, outletData, locales, xsw){
	xsw.writeStartElement("product");
	xsw.writeAttribute("product-id", product.ID);
	xsw.writeStartElement("custom-attributes");

	for each(let locale in locales){
        let dataLocale = (locale === 'x-default') ? Site.current.getDefaultLocale() : locale.replace('-','_');
        request.setLocale(dataLocale);
        // Set outletColors master attribute
		xsw.writeStartElement("custom-attribute");
		xsw.writeAttribute("xml:lang", locale);
	    xsw.writeAttribute("attribute-id", "outletColors");
        xsw.writeCharacters(outletData.outletColors[dataLocale] ? outletData.outletColors[dataLocale] : '00' ); //00 required so empty value does not trigger fallback to default locale
	    xsw.writeEndElement();//</custom-attribute>

	    if (!product.custom.experienceType.value || (product.custom.experienceType.value && product.custom.experienceType.value.indexOf('Merch') == -1)) {
            // Set experienceType master attribute
	    	xsw.writeStartElement("custom-attribute");
	        xsw.writeAttribute("xml:lang", locale);
	        xsw.writeAttribute("attribute-id", "experienceType");
            xsw.writeCharacters(outletData.experienceType[dataLocale]);
            xsw.writeEndElement();//</custom-attribute>
	    }
	}

	xsw.writeEndElement();//</custom-attributes>
	xsw.writeEndElement();//</product>
	xsw.writeCharacters("\n");
}

function writeVariantData(variantData, locales, xsw){
	for each(let variantObj in variantData){
    	xsw.writeStartElement("product");
        xsw.writeAttribute("product-id", variantObj.ID);
        xsw.writeStartElement("custom-attributes");

        for each(let locale in locales) {
            let dataLocale = (locale === 'x-default') ? Site.current.getDefaultLocale() : locale.replace('-','_');
            let localizedVariantData = variantObj.localizedData[dataLocale];
            // Set isOutlet variant attribute
        	xsw.writeStartElement("custom-attribute");
        	xsw.writeAttribute("xml:lang", locale);
            xsw.writeAttribute("attribute-id", "isOutlet");
            xsw.writeCharacters(localizedVariantData.outlet);
            xsw.writeEndElement();//</custom-attribute>

            // Set premiumFilter variant attribute
        	xsw.writeStartElement("custom-attribute");
        	xsw.writeAttribute("xml:lang", locale);
            xsw.writeAttribute("attribute-id", "premiumFilter");
            xsw.writeCharacters(localizedVariantData.premiumFilter);
            xsw.writeEndElement();//</custom-attribute>
        }
        xsw.writeEndElement();//</custom-attributes>
        xsw.writeEndElement();//</product>
    	xsw.writeCharacters("\n");
    }
}


//SECOND STEP
function trimGender(gender) {
    if(!gender) return;
    let g = gender.toLowerCase();
    if(g == 'mens') return 'men'
    if(g =='womens') return 'women'
    return g;
}

function findSalesCategories(product) {
    let productCatIDs = getCatIDs(product.getCategories()),
        trim = trimGender(product.custom.gender),
        categories = [];
    if (trim == 'unisex' || trim == 'adult_unisex' || trim == 'youth_unisex') {
        let agegroup = product.custom.agegroup ? product.custom.agegroup.toLowerCase() : '';
        switch(agegroup) {
            case 'toddler':
            case 'grade-school':
            case 'grade school':
            case 'pre-school':
            case 'pre school':
            case 'infant':
                if(productCatIDs.indexOf('sale-boys') == -1) categories.push('sale-boys');
                if(productCatIDs.indexOf('sale-boys') == -1) categories.push('sale-girls');

                break;
            case 'adult':
            default:
                if(productCatIDs.indexOf('sale-men') == -1) categories.push('sale-men');
                if(productCatIDs.indexOf('sale-women') == -1) categories.push('sale-women');
        }
    }
    else if(!empty(trim)) if(productCatIDs.indexOf('sale-' + trim) == -1) categories.push('sale-' + trim);
    return categories;

}

function getCatIDs(categories){
	let catIDs = [];
	for each(let cat in categories){
		catIDs.push(cat.ID);
	}
	return catIDs;
}

function cleanUpOutletCategories(args) {
    try {
        let siteID = Site.getCurrent().getID().toLowerCase(),
            storefrontCatalogID = args.storefrontCatalogID || CatalogMgr.getSiteCatalog().getID(),
            xsw,
            dir = new File(File.IMPEX + "/src/feeds/outletStatus");

        dir.mkdirs();

        let file = new File(File.IMPEX + "/src/feeds/outletStatus/outletCategoryAssignments_" + siteID + ".xml");
        file.createNewFile();

        let fw = new FileWriter(file, "UTF-8");
        xsw = new XMLStreamWriter(fw);

        //XML Header
        xsw.writeStartDocument("UTF-8", "1.0");
        xsw.writeCharacters("\n");
        xsw.writeStartElement("catalog");
        xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
        xsw.writeAttribute("catalog-id", storefrontCatalogID);
        xsw.writeCharacters("\n");

        let allSiteProducts = ProductMgr.queryAllSiteProducts();

        while (allSiteProducts.hasNext()) {
            let product = allSiteProducts.next(),
                outletColors = '';

            //Used to get master items from search hit
            if (product.isMaster()) {
	            outletColors = product.custom.outletColors;

	            if (!product.master || product.custom.outletColors == '00' ) continue;
	            let findSalesCats = findSalesCategories(product);

                for (let i=0; i < findSalesCats.length; i++) {
                    xsw.writeStartElement("category-assignment");
                    xsw.writeAttribute("category-id", findSalesCats[i]);
                    xsw.writeAttribute("product-id", product.ID);
                    xsw.writeEndElement();//</category-assignment>
                }
            }
        }
        xsw.writeEndElement(); //</catalog>
        xsw.flush();
        xsw.close();

        return new Status(Status.OK);
    } catch (e) {
        Logger.error("cleanUpOutletCategories step failed.  Error: " + e);
        return new Status(Status.ERROR);
    }
}

function getLocaleStrings(){
	let ArrayList = require('dw/util/ArrayList'),
		locales = new ArrayList();
	for each(let locale in Site.getCurrent().getAllowedLocales()){
		locale = locale.toString().replace('_','-');
		if(locale == 'default') continue; //default level not needed
        else if(locale == 'en-US' || locale == 'de-DE') locales.push('x-default'); //set US data to default data level
		else locales.push(locale);
	}
	return locales;
}

function getCurrencyCode(countryCode) {
    var currencyCode = session.getCurrency().getCurrencyCode();
    try {
        var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        var JSONUtils = require('int_customfeeds/cartridge/scripts/util/JSONUtils');
        var countriesJSON = PreferencesUtil.getJsonValue('countriesJSON');
        if (countriesJSON && countryCode) {
            var lookupCountry = JSONUtils.searchJSON(countriesJSON, 'countryCode', countryCode);
            if (lookupCountry && lookupCountry.length > 0 && lookupCountry[0] && 'currencyCode' in lookupCountry[0]) {
                currencyCode = lookupCountry[0].currencyCode;
            }
        }
    } catch(e) {
        Logger.error('AssignOutletStatus.js --> Failed to return locale speciific currencyCode');
    }
    return currencyCode;
}

/* Exported Methods */
module.exports = {
    assignOutletStatus: assignOutletStatus,
    cleanUpOutletCategories : cleanUpOutletCategories,
    getCurrencyCode: getCurrencyCode,
    getLocaleStrings: getLocaleStrings

};
