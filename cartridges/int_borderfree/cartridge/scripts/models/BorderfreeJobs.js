'use strict';

/**
 * Include API dependencies
 */
const File = require('dw/io/File');
const ProductMgr = require('dw/catalog/ProductMgr');
const StringUtils = require('dw/util/StringUtils');
const Calendar = require('dw/util/Calendar');
const ProductAvailabilityModel = require('dw/catalog/ProductAvailabilityModel');
const URLUtils = require('dw/web/URLUtils');

/**
 * Include dependencies
 */
const Util = require('~/cartridge/scripts/utils/Util');

/**
 * Store data about non exsisting attributes
 */
let NonExistingAttributes = [];

/**
 * Store data about wrong attribute types
 */
let WrongAttributesType = [];

/**
 * Create File
 * 
 * @param {String} type
 * @returns {dw.io.File}
 */
exports.createFeedFile = function(type) {
    let filenamePattern, filename, filePath, fullFilePath, file;
    
    if (type == 'catalog') {
        filenamePattern = Util.VALUE.CATALOG_EXPORT_FILE_NAME;
    } else if (type == 'customs') {
        filenamePattern = Util.VALUE.CUSTOM_EXPORT_FILE_NAME;
    } else if (type == 'kits') {
        filenamePattern = Util.VALUE.KITS_EXPORT_FILE_NAME;
    }
    
    filename = Util.VALUE.MERCHANT_ID + '_' + filenamePattern;
    filePath = Util.VALUE.FILE_EXPORT_FOLDER;
    fullFilePath = File.IMPEX + filePath + filename;
    new File(File.IMPEX + filePath).mkdirs();
    file= new File(fullFilePath);
    file.createNewFile();
   
    return file;
}

/**
 * Fetch Feed File
 * 
 * @param {String} type
 * @returns {dw.io.File}
 */
exports.fetchFeedFile = function(type) {
    let filenamePattern, filename, filePath, fullFilePath, file;
    
    if (type == 'catalog') {
        filenamePattern = Util.VALUE.CATALOG_EXPORT_FILE_NAME;
    } else if (type == 'customs') {
        filenamePattern = Util.VALUE.CUSTOM_EXPORT_FILE_NAME;
    } else if (type == 'kits') {
        filenamePattern = Util.VALUE.KITS_EXPORT_FILE_NAME;
    }
    
    if(null != filenamePattern){
    	filename = Util.VALUE.MERCHANT_ID + '_' + filenamePattern;
	    filePath = Util.VALUE.FILE_EXPORT_FOLDER;
	    fullFilePath = File.IMPEX + filePath + filename;
	    file= new File(fullFilePath);
    }
   
    return file;
}


/**
 * Add header to catalog feed file
 * 
 * @param {dw.io.FileWriter} fileWriter
 * @param {Array} headers
 */
exports.addHeadersToFeed = function (fileWriter, headers) {

    if (headers.length > 0) {
        fileWriter.write(headers.join('\t'));
        fileWriter.write('\r\n');
    }

}

/**
 * Add header to catalog feed file
 * 
 * @param {dw.io.FileWriter} fileWriter
 * @param {Object} mapping
 */
exports.addProductDataToFeed = function (fileWriter, mapping) {
    let products;

    products = ProductMgr.queryAllSiteProducts();
    while (products.hasNext()) {
        var product = products.next();
        if(!(product.master)) {
	        let productData = getProductAttributes(product, mapping);
	        fileWriter.write(productData.join('\t'));
	        fileWriter.write('\r\n');
	        //break;
        }
    }

}

/**
 * Write kits feed data to file
 * 
 * @param {dw.io.FileWriter} fileWriter
 * @param {Object} mapping
 */
exports.writeKitsFeedData = function (fileWriter) {
    let product,products,bundledProducts,bundledProductIterator,bundledProduct;
    //get all site products
    products = ProductMgr.queryAllSiteProducts();
    while (products.hasNext()) {
        product = products.next();
        if(product.isBundle()) {
     	   bundledProducts = product.getBundledProducts();
     	   bundledProductIterator = bundledProducts.iterator();
     	   while(bundledProductIterator.hasNext()){
     		   bundledProduct = bundledProductIterator.next();
         	   fileWriter.write(product.ID+'\t'+bundledProduct.ID+'\t'+product.getBundledProductQuantity(bundledProduct)+'\r\n');
     	   }
 	   }
    }

}

/**
 * Get product data
 * 
 * @param {dw.catalog.Product} product
 * @param {Object} mapping
 * @returns {Array}
 */
function getProductAttributes (product, mapping) {
    let productData = [];
    for (let borderfreeAttribute in mapping) {
        let attributeData = mapping[borderfreeAttribute];
        let attributeParts = attributeData.source.split('.');
        let isCustom = (attributeParts.length == 2 && attributeParts[0] == 'custom') ? true : false;
        let sourceAttributeName = (isCustom) ? attributeParts[1] : attributeData.source;
        let attributeType = attributeData.type.toLowerCase();
        let attribute, attributeValue;
        
        //Check if attribute exists
        if (!isAttributeExists(product, isCustom, sourceAttributeName, attributeType)) {
            productData.push('');
            continue;
        }
        
        switch (attributeType) {
            case 'string':
                attributeValue = (isCustom) ? product.custom[sourceAttributeName] : product[sourceAttributeName];
                if (attributeValue !== null && typeof attributeValue != 'string') {
                    pushWrongAttributesType(attributeData.source + ' must have String type');
                }
                break;
            case 'boolean':
                attributeValue = (isCustom) ? product.custom[sourceAttributeName] : product[sourceAttributeName];
                if (attributeValue !== null && typeof attributeValue != 'boolean') {
                    pushWrongAttributesType(attributeData.source + ' must have Boolean type');
                }
                break;
            case 'html':
                attribute = (isCustom) ? product.custom[sourceAttributeName] : product[sourceAttributeName];
                if (attribute !== null && !attribute instanceof dw.content.MarkupText) {
                    pushWrongAttributesType(attributeData.source + ' must have HTML type');
                }
                if (attribute) {
                    attributeValue = attribute.markup;
                }
                break;
            case 'url':
                attributeValue = URLUtils.https('Product-Show', 'pid', product.ID);
                break;
            case 'category':
                attributeValue = getCategories(product);
                break;
            case 'image':
                attributeValue = getImage(product, borderfreeAttribute);
                break;
            case 'enumofstrings':
                attribute = (isCustom) ? product.custom[sourceAttributeName] : product[sourceAttributeName];
                if (attribute !== null && typeof attribute != 'object' || !('value' in attribute)) {
                    pushWrongAttributesType(attributeData.source + ' must have EnumOfStrings type');
                }
                if (attribute) {
                    attributeValue = attribute.value;
                }
                break;
            case 'datetime':
                attributeValue = getDate(product, borderfreeAttribute, isCustom, sourceAttributeName);
                break;
            case 'availability':
                attributeValue = getAvailabilityStatus(product);
                break;
            case 'price':
                attributeValue = getPrice(product, borderfreeAttribute, sourceAttributeName);
                break;
            case 'producttypeid':
                attributeValue = (product.variant) ? product.masterProduct.ID : product.ID;
                break;
            case 'setofstrings':
                attribute = (isCustom) ? product.custom[sourceAttributeName] : product[sourceAttributeName];
                if (attribute !== null && !attribute instanceof Array) {
                    pushWrongAttributesType(attributeData.source + ' must have SetOfStrings type');
                }
                if (attribute) {
                    let separator = (sourceAttributeName == 'bfxCountryRestrictions') ? ',' : '/';
                    attributeValue = (isCustom) ? attribute.join(separator) : attribute.join(separator);
                }
                break;
            default:
                attributeValue = '';
        }
        productData.push(clearData(attributeValue));
    }
    return productData;
}

/**
 * Get product categories
 * 
 * @param {dw.catalog.Product} product
 * @returns {Array}
 */
function getCategories(product) {
    let categories = [];
    
    //check if primary category exists
    if (product.primaryCategory) {
        var category = product.primaryCategory;
        
        categories.push(category.displayName);
        var parentCategory;
        do {
            parentCategory = category.parent;
            //add parent category name to array
            if (parentCategory) {
                //skip root category
                if (parentCategory.root) {
                    parentCategory = null;
                    continue;
                }
                categories.unshift(parentCategory.displayName);
                category = parentCategory;
            }
        } while (parentCategory);
    } else if (product.onlineCategories.length > 0) {
    	for each (var cat in product.onlineCategories) {
    		categories.push(cat.displayName);
    	}
    } else if (!empty(product.getClassificationCategory())) {
    		categories.push(product.getClassificationCategory().displayName);
    } else {
    	var prod = product.getMasterProduct();
    	
    	if(!empty(prod)) {
	    	if (prod.primaryCategory) {
	            categories.push(prod.primaryCategory.displayName);
	    	} else if (prod.onlineCategories.length > 0) {
	    		for each (var cat in prod.onlineCategories) {
	        		categories.push(cat.displayName);
	    		}
	        } else if (!empty(prod.getClassificationCategory())) {
	        	categories.push(prod.getClassificationCategory().displayName);
	        } else {
	        	categories.push("No category assigned");
	        }
    	} else {
    		categories.push("No variant master available for category");
    	}
    }
    
    return categories.join(' > ');
}

/**
 * Get Image
 * 
 * @param {dw.catalog.Product} product
 * @returns {String}
 */
function getImage(product, borderfreeAttribute) {
    let imageData = '';
    if (borderfreeAttribute == 'image_link') {
        let image = product.getImage('large', 0);
        if (image) {
            imageData = image.httpsURL.toString();
        }
    } else if (borderfreeAttribute == 'additional_image_link') {
        let images = product.getImages('large');
        let imageUrls = [];
        if (images.size() > 0) {
            for each (let image in images) {
                imageUrls.push(image.httpsURL.toString());
            }
            imageData = imageUrls.join(',');
        }
    }
    return imageData;
}

/**
 * Get product date data
 * 
 * @param {dw.catalog.Product} product
 * @param {String} borderfreeAttribute
 * @param {Boolean} isCustom
 * @param {String} sourceAttributeName
 */
function getDate(product, borderfreeAttribute, isCustom, sourceAttributeName) {
    let dateString = '';
    let dateFormat = 'yyyy-MM-dd\'T\'hh:mmZ';
    if (borderfreeAttribute == 'availability_date') {
        if (product.availabilityModel && product.availabilityModel.inventoryRecord 
                && product.availabilityModel.inventoryRecord.inStockDate) {
            dateString = StringUtils.formatCalendar(new Calendar(product.availabilityModel.inventoryRecord.inStockDate), dateFormat);
        }
    } else if (borderfreeAttribute == 'sale_price_effective_date') {
        if ('bfxSalePriceEffectiveDateStart' in product.custom && 'bfxSalePriceEffectiveDateEnd' in product.custom) {
            if (!product.custom['bfxSalePriceEffectiveDateStart'] instanceof Date) {
                pushWrongAttributesType('custom.bfxSalePriceEffectiveDateStart must have Date type');
            }
            if (!product.custom['bfxSalePriceEffectiveDateEnd'] instanceof Date) {
                pushWrongAttributesType('custom.bfxSalePriceEffectiveDateEnd must have Date type');
            }
            dateString = StringUtils.formatCalendar(new Calendar(product.custom['bfxSalePriceEffectiveDateStart']), dateFormat);
            dateString += '/' + StringUtils.formatCalendar(new Calendar(product.custom['bfxSalePriceEffectiveDateEnd']), dateFormat);
        } else {
            //Store attribute data to send error email
            let fullAttributeName = 'custom.bfxSalePriceEffectiveDateStart' + ' | ' +  'custom.bfxSalePriceEffectiveDateEnd';
            if (NonExistingAttributes.indexOf(fullAttributeName) == -1) {
                NonExistingAttributes.push(fullAttributeName);
            }
        }
    } else {
        if (isCustom) {
            if (sourceAttributeName in product.custom) {
                if (!product.custom[sourceAttributeName] instanceof Date) {
                    pushWrongAttributesType(attributeData.source + ' must have Date type');
                }
                dateString = StringUtils.formatCalendar(new Calendar(product.custom[sourceAttributeName]), dateFormat);
            } else {
                //Store attribute data to send error email
                let fullAttributeName = 'custom.' + sourceAttributeName;
                if (NonExistingAttributes.indexOf(fullAttributeName) == -1) {
                    NonExistingAttributes.push(fullAttributeName);
                }
            }
        } else {
            if (!product[sourceAttributeName] instanceof Date) {
                pushWrongAttributesType(attributeData.source + ' must have Date type');
            }
            dateString = StringUtils.formatCalendar(new Calendar(product[sourceAttributeName]), dateFormat);
        }
    }
    return dateString;
}

/**
 * Get product availability status
 * 
 * @param {dw.catalog.Product} product
 */
function getAvailabilityStatus(product) {
    let status = '';
    if (product.availabilityModel) {
        switch (product.availabilityModel.availabilityStatus) {
            case ProductAvailabilityModel.AVAILABILITY_STATUS_BACKORDER:
            case ProductAvailabilityModel.AVAILABILITY_STATUS_PREORDER:
                status = 'preorder';
                break;
            case ProductAvailabilityModel.AVAILABILITY_STATUS_IN_STOCK:
                status = 'in stock';
                break;
            case ProductAvailabilityModel.AVAILABILITY_STATUS_PREORDER:
                status = 'out of stock';
                break;
            default:
                status = '';
        }
    }
    return status;
}

/**
 * Get product price
 * 
 * @param {dw.catalog.Product} product
 * @param {String} borderfreeAttribute
 * @param {String} sourceAttributeName
 * @returns {String}
 */
function getPrice(product, borderfreeAttribute, sourceAttributeName) {
    let price = '';
    let bookPrice = '';
    // fetching priceBook if configured
    let dutiablePriceBook = Util.VALUE.DUTIABLE_PRICE_BOOK;
    let salePriceBook = Util.VALUE.SALE_PRICE_BOOK;
    if (borderfreeAttribute == 'dutiable_price') {
    	if(dutiablePriceBook != null){
    		bookPrice = product.getPriceModel().getPriceBookPrice(dutiablePriceBook);
    		if(null != bookPrice){
    			price = bookPrice.value + ' ' + bookPrice.currencyCode;
    		}
        } else if (product.priceModel.price.available) {
            price = product.priceModel.price.value + ' ' + product.priceModel.price.currencyCode;
        }
    } else if (borderfreeAttribute == 'sale_price') {
    	if(salePriceBook != null){
    		bookPrice = product.getPriceModel().getPriceBookPrice(salePriceBook);
    		if(null != bookPrice){
    			price = bookPrice.value + ' ' + bookPrice.currencyCode;
    		}
        } else 	if (sourceAttributeName in product.custom) {
            price = product.custom[sourceAttributeName] + ' ' + product.priceModel.price.currencyCode;;
        }  else if (product.priceModel.price.available) {
            price = product.priceModel.price.value + ' ' + product.priceModel.price.currencyCode;
        }   else {
            //Store attribute data to send error email
            let fullAttributeName = 'custom.' + sourceAttributeName;
            if (NonExistingAttributes.indexOf(fullAttributeName) == -1) {
                NonExistingAttributes.push(fullAttributeName);
            }
        }
    }
    return price;
}


/**
 * Check if attribute exists
 * 
 * @param {dw.catalog.Product} product
 * @param {boolean} isCustom
 * @param {string} sourceAttributeName
 * @param {string} attributeType
 * @returns {boolean}
 */
function isAttributeExists(product, isCustom, sourceAttributeName, attributeType) {
    let exists = false;
    let skippedAttributeTypes = ['image', 'price', 'category', 'datetime', 'availability', 'producttypeid'];
    
    //Check if the type should be skipped
    if (skippedAttributeTypes.indexOf(attributeType) >= 0) {
        return true;
    }
    
    if (isCustom) {
        if (sourceAttributeName in product.custom) {
            exists = true;
        }
    } else if (sourceAttributeName in product) {
        exists = true;
    }
    
    //Store attribute data to send error email
    if (!exists) {
        let fullAttributeName = (isCustom) ? 'custom.' + sourceAttributeName : sourceAttributeName;
        if (NonExistingAttributes.indexOf(fullAttributeName) == -1) {
            NonExistingAttributes.push(fullAttributeName);
        }
    }
    
    return exists;
}

/**
 * Clear input data: remove line breaks and tabs
 * 
 * @param {String} input
 * @returns {String} output
 */
function clearData(input : String) {
    let output = '';
    if(!empty(input)) {
        //remove line breaks, tabs
        let newlineRegex : RegExp = new RegExp(/[\r\n]{1}/gm);
        let tabRegex : RegExp = new RegExp(/[\t]{1}/gm);
        output = input.toString().replace(newlineRegex,' ');
        output = output.replace(tabRegex, ' ');
    }
    return output;
}

/**
 * Push wrong attribute types message
 * 
 * @param {String} message
 */
function pushWrongAttributesType(message) {
    if (WrongAttributesType.indexOf(message) == -1) {
        WrongAttributesType.push(message);
    }
}

/**
 * Get non existing attributes
 * 
 * @returns {Array}
 */
exports.getNonExistingAttributes = function () {
    return NonExistingAttributes;
}

/**
 * Get wrong attribute types
 * 
 * @returns {Array}
 */
exports.getWrongAttributesType = function () {
    return WrongAttributesType;
}

/**
 * Transform catalog mapping string to JSON object
 * 
 * @returns {Object}
 */
exports.getCatalogMappingJSON = function () {
    let mapping = Util.CATALOG_FEED_MAPPING;
    if (Util.VALUE.CATALOG_MAPPING) {
        let customMapping = JSON.parse(Util.VALUE.CATALOG_MAPPING);
        for (let key in customMapping) {
            mapping[key] = customMapping[key];
        }
    }
    return mapping;
}

/**
 * Transform custom mapping string to JSON object
 * 
 * @returns {Object}
 */
exports.getCustomMappingJSON = function () {
    let mapping = Util.CUSTOM_FEED_MAPPING;
    if (Util.VALUE.CUSTOM_MAPPING) {
        let customMapping = JSON.parse(Util.VALUE.CUSTOM_MAPPING);
        for (let key in customMapping) {
            mapping[key] = customMapping[key];
        }
    }
    return mapping;
}