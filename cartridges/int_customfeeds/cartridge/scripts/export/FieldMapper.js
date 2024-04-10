'use strict';

let CSVStreamWriter = require('dw/io/CSVStreamWriter'),
    StringUtils = require('dw/util/StringUtils'),
    Calendar = require('dw/util/Calendar'),
    URLUtils = require('dw/web/URLUtils'),
    Site = require('dw/system/Site'),
    Currency = require('dw/util/Currency'),
    SystemObjectMgr = require('dw/object/SystemObjectMgr'),
    CatalogMgr = require('dw/catalog/CatalogMgr'),
    Money = require('dw/value/Money'),
    videoMaterial = require('*/cartridge/models/product/decorators/videoMaterial'),
    Logger = require('dw/system/Logger');

/* Script Modules */
let ProductUtils = require('~/cartridge/scripts/util/ProductUtils');

var FieldMapper = function() {};


/**
 * Supported system attributes
 */
FieldMapper.SYSTEM_ATTRIBUTES = ["brand","EAN","ID","pageDescription",
            "pageKeywords","pageURL","pageTitle","taxClassID","UPC","lastModified"];

/**
 * Returns the value of the product for the given field. Field is eiher a system attribute or a custom attribute 
 * prefixed with "custom."
 */
FieldMapper.getField = function(product, field, format, currency) {
    let master;
    //throw new Error("Invalid template ssssssss:" + currency);
    // no field, can't do anything

    if (empty(field) || product == null) {
        return '';
    }
    try {
        if (product.master) {
            master = product;
        } else {
            master = product.variationModel.master;
        }
        // special fields
        if (field === 'inventory') {
            if (product.variant) {
                let inventoryQTY = empty(product.availabilityModel.inventoryRecord) ? 0 : product.availabilityModel.inventoryRecord.ATS.value.toFixed();
                return inventoryQTY;
            }
            return 'N/A';
        }

        if (field === 'onOrder') {
            if (product.variant) {
                let ats = product.availabilityModel.inventoryRecord.ATS.value.toFixed(),
                    allocation = product.availabilityModel.inventoryRecord.allocation.value.toFixed(),
                    turnover = product.availabilityModel.inventoryRecord.turnover.value.toFixed(),
                    onOrder = empty(product.availabilityModel.inventoryRecord) ? 0 : allocation - turnover - ats;

                return onOrder.toString();
            }
            return 'N/A';
        }

        if (field === 'siteID') {
            return Site.getCurrent().getID().toLowerCase();
        }

        if (field === 'availableForLocale') {
            return 'availableForLocale' in master.custom && master.custom.availableForLocale ? master.custom.availableForLocale : '';
        }

        if (field === 'bfxCountryRestrictions') {
            var BFXCountryRestrictions = 'bfxCountryRestrictions' in product.custom && product.custom.bfxCountryRestrictions ? product.custom.bfxCountryRestrictions : null,
            BFXCountryRestrictionsResult = '';
            if (BFXCountryRestrictions) {
                for each (let BFXCountry in BFXCountryRestrictions) {
                    BFXCountryRestrictionsResult += BFXCountry +'|';
                }
            }

            BFXCountryRestrictionsResult = BFXCountryRestrictionsResult ? BFXCountryRestrictionsResult.substring(0, BFXCountryRestrictionsResult.length - 1) : BFXCountryRestrictionsResult;
            return BFXCountryRestrictionsResult;
        }

        if (field === 'shortDescription' && product.master) {
            return master.getShortDescription();
        } else if (field === 'shortDescription') {
            return master.getShortDescription();
        }

        if (field === 'name' && product.master) {
            return ProductUtils.sanitizeInvisibleSpaces(master.getName());
        } else if (field === 'name') {
            return ProductUtils.sanitizeInvisibleSpaces(master.getName());
        }

        if (field === 'longDescription' && product.master) {
            return master.getLongDescription();
        } else if (field === 'longDescription') {
            return master.getLongDescription();
        }

        if (field === 'videoMaterials') {
            if (!product.master) {
                let videoModel = {};
                videoMaterial(videoModel, product);
                let videoURL = videoModel.video360Material && videoModel.video360Material.length > 0 && 
                    videoModel.video360Material[0] && videoModel.video360Material[0].video_url_mp4 ? 
                    videoModel.video360Material[0].video_url_mp4 : '';
                return videoURL;
            } else {
                return '';
            }
        }

        if (field === 'swatchImage') {
            let prodImages = product.getImages('swatch'),
            prodImagesLength = prodImages.size(),
            image_link = '';

            if (prodImagesLength > 0) {
                image_link = encodeURI(prodImages[0].httpsURL.toString());
                image_link = image_link.replace(/,/g,"%2C");
            }
            return image_link;
        }

        if (field === 'image') {
            let prodImages = product.getImages('pdpMainDesktop'),
                prodImagesLength = prodImages.size(),
                image_link = '';

            if (prodImagesLength > 0) {
                image_link = encodeURI(prodImages[0].httpsURL.toString());
                image_link = image_link.replace(/,/g,"%2C");
            }
            return image_link;
        }

        if (field === 'gallery') {
            let prodImages = product.getImages('pdpMainDesktop'),
                prodImagesLength = prodImages.size(),
                image_link = '';

            // additional_image_link(s)
            let additional_images = '',
                imageNumber = (prodImagesLength > 10) ? 10 : prodImagesLength;

            for (let i = 1; i < imageNumber; i++) {
                image_link = encodeURI(prodImages[i].httpsURL);
                image_link = image_link.replace(/,/g,"%2C");
                additional_images += image_link+',';
            }
            if (additional_images.length > 0) {
                additional_images = additional_images.substr(0, additional_images.length - 1);
            }
            return additional_images;
        }

        if (field === 'carousel') {
            let prodImages = product.getImages('standardProductCarousel'),
                prodImagesLength = prodImages.size(),
                carousel_image_link = '';
                
            if (prodImagesLength > 0) {
                carousel_image_link = encodeURI(prodImages[0].httpsURL.toString());
                carousel_image_link = carousel_image_link.replace(/,/g,"%2C");
            }
            return carousel_image_link;
        }

        if (field === 'productimage') {
            let prodImages = product.getImages('feedsDefault'),
                prodImagesLength = prodImages.size(),
                product_image_link = '';

            if (prodImagesLength > 0) {
                product_image_link = encodeURI(prodImages[0].httpsURL.toString());
                product_image_link = product_image_link.replace(/,/g,"%2C");
            }
            return product_image_link;
        }

        if (field === 'onmodelImage') {
            let prodImages = product.getImages('onmodelImage'),
                prodImagesLength = prodImages.size(),
                onmodelImageUrl = '';

            if (prodImagesLength > 0) {
                onmodelImageUrl = encodeURI(prodImages[0].httpsURL.toString());
                onmodelImageUrl = onmodelImageUrl.replace(/,/g,"%2C");
            }
            return onmodelImageUrl;
        }

        if (field === 'colorValue') {
            if (product.master) {
                return '';
            }
            let colorAttr,
                pvm = product.variationModel,
                color = product.custom.color;

            if (empty(colorAttr)) {
                colorAttr = product.variationModel.getProductVariationAttribute('color');
            }
            let colorValue = '';
            if (product && !empty(color) && colorAttr) {
                colorValue = pvm.getVariationValue(product,colorAttr) ? pvm.getVariationValue(product,colorAttr).displayValue : '';
                return colorValue;
            }
            return '';
        }

        if (field === 'defaultColor') {
            if (product.master) {
                return '';
            }

            let colorAttr = product.variationModel.getProductVariationAttribute('color'),
                defaultColor = '';

            if (!empty(product.custom.color)) {
                let defaultVariant = ProductUtils.getDefaultVariant(product.variationModel);
                if (defaultVariant && colorAttr) {
                    defaultColor = product.variationModel.getVariationValue(defaultVariant, colorAttr) ? product.variationModel.getVariationValue(defaultVariant, colorAttr).displayValue : '';
                }
            }
            return defaultColor;
        }

        if (field === 'dna') {
            var dnaDes = 'dna' in product.custom ? product.custom.dna : null,
            dnaResult = '';
            if (dnaDes) {
                for each (let dna in dnaDes) {
                    dnaResult += dna +'|';
                }
            }

            dnaResult = dnaResult ? dnaResult.substring(0, dnaResult.length - 1) : dnaResult;
            return dnaResult;
        }

        if (field === 'specs') {
            var specDes = 'specs' in product.custom ? product.custom.specs : null,
            specsResult = '';
            if (specDes) {
                for each (let spec in specDes) {
                    specsResult += spec +'|';
                }
            }

            specsResult = specsResult ? specsResult.substring(0, specsResult.length - 1) : specsResult;
            return specsResult;
        }

        if (field === 'fitCare') {
            var fitCareDes = 'fitCare' in product.custom ? product.custom.fitCare : null,
            fitCareResult = '';
            if (fitCareDes) {
                for each (let fitCare in fitCareDes) {
                    fitCareResult += fitCare +'|';
                }
            }
            fitCareResult = fitCareResult ? fitCareResult.substring(0, fitCareResult.length - 1) : fitCareResult;
            return fitCareResult;
        }

        if (field === 'productType') {
            if (product.master) {
                return 'Master';
            } else if (product.variant) {
                return 'Variant';
            }
        }

        if (field === 'creationDate') {
            return product.creationDate;
        }

        if (field === 'lastModified') {
            return product.lastModified;
        }

        if (field === 'updateTime') {
            if (product.lastModified) {
                let updateTime = StringUtils.formatCalendar(new Calendar(product.lastModified), "yyyy-MM-dd HH:mm:ss");
                return updateTime ? updateTime : '';
            } else {
                return '';
            }
        }

        if (field === 'sizeValue') {
            if (product.master) {
                return '';
            }
            let sizeAttr,
                pvm = product.variationModel,
                size = product.custom.size;

            if (empty(sizeAttr)) {
                sizeAttr = product.variationModel.getProductVariationAttribute('size');
            }
            let sizeValue = '';
            if (!empty(size) && sizeAttr) {
                sizeValue = pvm.getVariationValue(product,sizeAttr) ? pvm.getVariationValue(product,sizeAttr).displayValue : '';
                return sizeValue;
            }
            return '';
        }

        if (field === 'locale') {
            return request.locale.toLowerCase();
        }

        if (field === 'gender') {
            return master.custom.gender ? master.custom.gender : '';
        }

        if (field === 'bvAggregateReviewCount') {
            return 'bvAggregateReviewCount' in master.custom && master.custom.bvAggregateReviewCount ? master.custom.bvAggregateReviewCount : '';
        }

        if (field === 'bvAggregateAverageRating') {
            return 'bvAggregateAverageRating' in master.custom && master.custom.bvAggregateAverageRating ? master.custom.bvAggregateAverageRating : '';
        }

        if (field === 'url') {
            //link',
            let link = URLUtils.https('Product-Show', 'pid', master.ID),
                color = product.custom.color,
                size = product.custom.size;

            if (!empty(color)) {
                link.append('dwvar_' + master.ID + '_color', color);
            }
            if (!empty(size)) {
                link.append('dwvar_' + master.ID + '_size', size);
            }

            let variantLengthValue = product.custom.length ? product.custom.length : '';
            if (!empty(variantLengthValue)) {
                link.append('dwvar_' + master.ID + '_length', variantLengthValue);
            }

            link = require('~/cartridge/scripts/util/URLUtilsHelper').prepareURLForLocale(link.toString(), request.locale);
            link = link.toString();
            return link;
        }

        if (field === 'category') {
            //DisplayName
            let category = getProductCategory(master);

            if (category != null) {
                return category.displayName;
            }
            return '';
        }

        if (field === 'categoryID') {
            //ID
            let category = getProductCategory(master);

            if (category != null) {
                return category.ID;
            }
            return '';
        }
        if (field === 'allCategories') {
            //allCategories
            let allCategoryIDs = getAllProductCategories(master);
            if (allCategoryIDs != null) {
                return allCategoryIDs
            }
            //return 'rererere';
        }

        if (field === 'googleAdwordsAPISport') {
            //googleAdwordsAPISport
            let category = getProductCategory(master);

            if (category != null && 'googleAdwordsAPISport' in category.custom && category.custom.googleAdwordsAPISport) {
                return category.custom.googleAdwordsAPISport;
            }
            return '';
        }

        if (field === 'googleAdwordsAPIMainCategory') {
            //googleAdwordsAPIMainCategory
            let category = getProductCategory(master);

            if (category != null && 'googleAdwordsAPIMainCategory' in category.custom && category.custom.googleAdwordsAPIMainCategory) {
                return category.custom.googleAdwordsAPIMainCategory;
            }
            return '';
        }

        if (field === 'googleAdwordsAPISubCategory1') {
            //googleAdwordsAPISubCategory1
            let category = getProductCategory(master);

            if (category != null && 'googleAdwordsAPISubCategory1' in category.custom && category.custom.googleAdwordsAPISubCategory1) {
                return category.custom.googleAdwordsAPISubCategory1;
            }
            return '';
        }

        if (field === 'googleAdwordsAPISubCategory2') {
            //googleAdwordsAPISubCategory2
            let category = getProductCategory(master);

            if (category != null && 'googleAdwordsAPISubCategory2' in category.custom && category.custom.googleAdwordsAPISubCategory2) {
                return category.custom.googleAdwordsAPISubCategory2;
            }
            return '';
        }

        if (field === 'categoryPath') {
            let catOutput = [],
                cat = getProductCategory(master);

            while (cat.ID != 'root') {
                catOutput.push(cat.displayName);
                cat = cat.parent;
                if (typeof cat == 'undefined') {
                    break;
                }
            }
            return catOutput.reverse().join(' > ');
        }

        if (field === 'googleCategory') {
            let category = getProductCategory(master);

            if (category != null && 'googleCategoryID' in category.custom && category.custom.googleCategoryID ) {
                return category.custom.googleCategoryID;
            }
            return '';
        }

        if (field === 'standardPrice') {
            try {
                let JSONUtils = require('~/cartridge/scripts/util/JSONUtils'),
                    supplementalPriceBooksData = JSONUtils.getValue(Site.getCurrent().getCustomPreferenceValue('supplementalPriceBooks'), request.locale.slice(-2).toUpperCase()),
                    standardPrice = null;

                if (supplementalPriceBooksData) {
                    supplementalPriceBooksData = supplementalPriceBooksData[0].split('-');
                    let priceBookId = supplementalPriceBooksData[0];

                    standardPrice = ProductUtils.getPriceByPricebook(product, priceBookId, 'list');
                }else{
                    standardPrice = ProductUtils.getPriceByPricebook(product, currency, 'list');
                }

                if (standardPrice != null && standardPrice != Money.NOT_AVAILABLE && standardPrice.value > 0) {
                    return StringUtils.formatMoney(standardPrice).toString();
                }
                return '';
            } catch (err) {
                Logger.getLogger('GlobalFeedExport', 'GlobalFeedExport').error(err.message);
            }
        }

        if (field === 'standardPriceValue') {
            try {
                let JSONUtils = require('~/cartridge/scripts/util/JSONUtils'),
                    supplementalPriceBooksData = JSONUtils.getValue(Site.getCurrent().getCustomPreferenceValue('supplementalPriceBooks'), request.locale.slice(-2).toUpperCase()),
                    standardPrice = null;

                if (supplementalPriceBooksData) {
                    supplementalPriceBooksData = supplementalPriceBooksData[0].split('-');
                    let priceBookId = supplementalPriceBooksData[0];

                    standardPrice = ProductUtils.getPriceByPricebook(product, priceBookId, 'list');
                } else {
                    standardPrice = ProductUtils.getPriceByPricebook(product, currency, 'list');
                }

                if (standardPrice != null && standardPrice != Money.NOT_AVAILABLE && standardPrice.value > 0) {
                    return standardPrice.value
                }
                return '';
            } catch (err) {
                Logger.getLogger('GlobalFeedExport', 'GlobalFeedExport').error(err.message);
            }
        }

        if (field === 'salePrice') {
            let JSONUtils = require('~/cartridge/scripts/util/JSONUtils'),
                supplementalPriceBooksData = JSONUtils.getValue(Site.getCurrent().getCustomPreferenceValue('supplementalPriceBooks'), request.locale.slice(-2).toUpperCase()),
                salePrice = null;

            if (supplementalPriceBooksData) {
                supplementalPriceBooksData = supplementalPriceBooksData[0].split('-');
                let priceBookId = supplementalPriceBooksData[0];

                salePrice = ProductUtils.getPriceByPricebook(product, priceBookId, 'sale');
            } else {
                salePrice = ProductUtils.getPriceByPricebook(product, currency, 'sale');
            }

            if (salePrice != null && salePrice != Money.NOT_AVAILABLE && salePrice.value > 0) {
                return StringUtils.formatMoney(salePrice).toString();
            }
            return '';
        }

        if (field === 'salePriceValue') {
            let JSONUtils = require('~/cartridge/scripts/util/JSONUtils'),
                supplementalPriceBooksData = JSONUtils.getValue(Site.getCurrent().getCustomPreferenceValue('supplementalPriceBooks'),request.locale.slice(-2).toUpperCase()),
                salePrice = null;

            if (supplementalPriceBooksData) {
                supplementalPriceBooksData = supplementalPriceBooksData[0].split('-');
                let priceBookId = supplementalPriceBooksData[0];

                salePrice = ProductUtils.getPriceByPricebook(product, priceBookId, 'sale');
            } else {
                salePrice = ProductUtils.getPriceByPricebook(product, currency, 'sale');
            }

            if (salePrice != null && salePrice != Money.NOT_AVAILABLE && salePrice.value > 0) {
                return salePrice.value;
            }
            return '';
        }

        if (field === 'currencySymbol') {
            return Currency.getCurrency(currency).getSymbol();
        }

        if (field === 'currencyCode') {
            return currency;
        }

        if (field === 'masterStockColors') {
            if (product.variant) {
                return '';
            }
            let variants = master.getVariants(),
                pvm = master.getVariationModel(),
                pva = pvm.getProductVariationAttribute('color');
            if (empty(pva)) {
                return '';
            }
            let allColorVariationValues = pvm.getAllValues(pva),
                colorQty = 0,
                qtys = [];
            
            for each (let colorVariationValue in allColorVariationValues) {
                colorQty = 0;
                for each (let variant in variants) {
                    let variantColorValue = pvm.getVariationValue(variant, pva),
                        inventoryRecord = variant.getAvailabilityModel().getInventoryRecord(),
                        creationDate = variant.creationDate;

                    if (empty(variantColorValue) || variantColorValue.ID != colorVariationValue.ID) {
                        continue;
                    }
                    if (variant.online == false || empty(inventoryRecord)) {
                        colorQty = colorQty + 0;
                    } else {
                        colorQty = colorQty + inventoryRecord.ATS.value;
                    }
                }
                qtys.push(colorQty);
            }
            return qtys.toString();
        }

        if (field === 'masterStockSizes') {
            if (product.variant) {
                return '';
            }
            let variants = master.getVariants(),
                pvm = master.getVariationModel(),
                pva = pvm.getProductVariationAttribute('size');
            if (empty(pva)) {
                return '';
            }
            let allSizeVariationValues = pvm.getAllValues(pva),
                sizeQty = 0,
                qtys = [];

            for each (let sizeVariationValue in allSizeVariationValues) {
                sizeQty = 0;
                for each (let variant in variants) {
                    let variantSizeValue = pvm.getVariationValue(variant, pva),
                        inventoryRecord = variant.getAvailabilityModel().getInventoryRecord(),
                        creationDate = variant.creationDate;
                    if (empty(variantSizeValue) || variantSizeValue.ID != sizeVariationValue.ID) {
                        continue;
                    }
                    if (variant.online == false || empty(inventoryRecord)) {
                        sizeQty = sizeQty + 0;
                    } else {
                        sizeQty = sizeQty + inventoryRecord.ATS.value;
                    }
                }
                qtys.push(sizeQty);
            }
            return qtys.toString();
        }

        if (field == 'masterColors') {
            if (product.variant) {
                return '';
            }
            let variants = master.getVariants(),
                pvm = master.getVariationModel(),
                pva = pvm.getProductVariationAttribute('color');
            if (empty(pva)) {
                return '';
            }
            let allColorVariationValues = pvm.getAllValues(pva),
                colors = [];

            for each (let colorVariationValue in allColorVariationValues) {
                for each (let variant in variants) {
                    let variantColorValue = pvm.getVariationValue(variant, pva),
                        inventoryRecord = variant.getAvailabilityModel().getInventoryRecord(),
                        creationDate = variant.creationDate;

                    if (empty(variantColorValue) || variantColorValue.ID != colorVariationValue.ID) {
                        continue;
                    }
                    colors.push(variantColorValue.displayValue);
                    break;
                }
            }
            return colors.toString();
        }

        if (field == 'masterSizes') {
            if (product.variant) {
                return '';
            }
            let variants = master.getVariants(),
                pvm = master.getVariationModel(),
                pva = pvm.getProductVariationAttribute('size');
            if (empty(pva)) {
                return '';
            }
            let allSizeVariationValues = pvm.getAllValues(pva),
                sizes = [];

            for each (let sizeVariationValue in allSizeVariationValues) {
                for each (let variant in variants) {
                    let variantSizeValue = pvm.getVariationValue(variant, pva),
                        inventoryRecord = variant.getAvailabilityModel().getInventoryRecord(),
                        creationDate = variant.creationDate;

                    if ( empty(variantSizeValue) || variantSizeValue.ID != sizeVariationValue.ID ) {
                        continue;
                    }
                    sizes.push(variantSizeValue.displayValue);
                    break;
                }
            }
            return sizes.toString();
        }
        
        if (field == 'variantUPCList') {
            if (product.variant) {
                return '';
            }
            let variants = master.getVariants(),
            variantUPCList = "<UPCS>";
            for each (let variant in variants) {
            	variantUPCList += "<UPC>"+variant.ID+"</UPC>";
             }
            variantUPCList += "</UPCS>";
            return variantUPCList;
        }
        
        if (field == 'variantSKUList') {
            if (product.variant) {
                return '';
            }
            let variants = master.getVariants(),
            variantSKUList = "<SKUS>";

            for each (let variant in variants) {
            	variantSKUList += "<SKU>"+variant.custom.sku+"</SKU>";
             }
            variantSKUList += "</SKUS>";
            return variantSKUList;
        }

        if (field === 'onlineFlag') {
            return product.onlineFlag;
        }

        if (field === 'shipmentstartdate') {
            return 'shipmentstartdate' in product.custom && product.custom.shipmentstartdate ? product.custom.shipmentstartdate : null;
        }

        // now handle generic attributes
        var result = '';

        // handle custom attributes
        if (field.indexOf('custom.') == 0) {
            var cname = field.substr(7);
            if (cname in product.custom) {
            	result = empty(product.custom[cname]) ? master.custom[cname] : product.custom[cname];                 
            }
        }
        // handle system attributes
        if (FieldMapper.SYSTEM_ATTRIBUTES.indexOf(field) > -1) {
            result = empty(product[field]) ? master[field] : product[field];
        }
        if (format && result instanceof Date) {
            result = StringUtils.formatCalendar(new Calendar(result), format);
        }
        return result;
    } catch (e) {
        Logger.getLogger('GlobalFeedExport', 'GlobalFeedExport').error('Error occured while mapping field {0} for product {1} ' + e.message, field, product.ID);
    }
    return null;
};

/**
 * Parses a given field definition as string and return a field object
 */
FieldMapper.parseField = function(a) {
    let typeDef = SystemObjectMgr.describe('Product'),
        field = a.split(/(?:\{\{| |\}\})/g).filter(function(t) { return !empty(t)})[0];

    if (field.indexOf('var:') == 0) {
        field = field.substring(4).replace(':','.')
    }
    let f = {}
    if (a.indexOf('format="') > -1) {
        f.format = a.split('format="')[1].split('"')[0];
    }
    if (field.indexOf('custom.') == 0) {
        if (typeDef.getCustomAttributeDefinition(field.substr(7)) != null) {
            f.attribute = field;
        }
    } else {
        f.attribute = field;
    }
    Logger.getLogger('GlobalFeedExport', 'GlobalFeedExport').debug('Parsed mapping for field {0} to field {1}',a,JSON.stringify(f));
//    else if(typeDef.getSystemAttributeDefinition(field) != null){
//        _that.fieldCache[a] = field;
//    }
    return f;
}

/**
 * Returns category of a product from current storefront catalog.
 * @param {dw.catalog.Product} product Product instance to get category from
 * @returns {(dw.catalog.Category|null)} Category of the product
 */
function getProductCategory(product) {
    if (!empty(product.custom.dfwCategory)) {
        let category = CatalogMgr.getCategory(product.custom.dfwCategory);
        if (!empty(category)) {
            return category;
        }
    }

    let category = getClassificationCategory(product),
        categories = null;

    if (!empty(category)) {
        return category;
    }

    category = product.getPrimaryCategory();
    
    if (empty(category)) {
        categories = product.getCategories();

        if (categories.size() > 0) {
            category = categories[0];
        }
    }

    return category;
}

/**
 * Returns All categories of a product from current storefront catalog.
 * @param {dw.catalog.Product} product Product instance to get category from
 * @returns {Collection} Category of the product
 */
function getAllProductCategories(product) {

    let allCategories = product.getCategories();



    // Convert collection to | list
    let categoryResults = '';
    if (allCategories) {
        for each (let category in allCategories) {
            categoryResults += category.getID() +'|';
        }
    }

    categoryResults = categoryResults ? categoryResults.substring(0, categoryResults.length - 1) : categoryResults;
    return categoryResults;

}

/**
 * Returns classification category of a product if the classification category
 * is from current storefront catalog.
 * @param {dw.catalog.Product} product Product instance to get category from
 * @returns {(dw.catalog.Category|null)} classification category of the product
 */
function getClassificationCategory(product) {
    let classificationCategory = product.getClassificationCategory(),
        currentSiteCatalogCategory = null;

    if (empty(classificationCategory)) {
        return null;
    }

    currentSiteCatalogCategory = CatalogMgr.getCategory(classificationCategory.ID);

    if (empty(currentSiteCatalogCategory)) {
        return null;
    }

    // Comparing object's UUID to identify that they are belong to the same catalog
    if (classificationCategory.UUID !== currentSiteCatalogCategory.UUID) {
        classificationCategory = null;
    }

    return classificationCategory;
}

exports.FieldMapper = FieldMapper;