'use strict';

// Include required packages and classes
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var HashMap = require('dw/util/HashMap');
var List = require('dw/util/List');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var StreamWriter = require('dw/io/XMLStreamWriter');
var URLUtils = require('dw/web/URLUtils');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var System = require('dw/system/System');

var adobeAssetService = require('bc_jobs/cartridge/scripts/services/AdobeAssetApi');

/**
* @param {number} nb - A number
* @returns {string} - Padded date
*/
function insertLeadingZero(nb) {
    if (nb < 10) {
        return '0' + nb;
    }
    return '' + nb;
}

/**
*@param {dw.io.File} File - file
*@param {object} params - object
*@param {dw.io.StreamWriter} xsw - StreamWriter
*/
function initFeed(file, xsw, params) {
    Logger.getLogger('shopTheLook').info('Init Feed: {0}', file.name);
    xsw.writeStartDocument("UTF-8", "1.0");
    xsw.writeStartElement("catalog");
    xsw.writeAttribute("xmlns", "http://www.demandware.com/xml/impex/catalog/2006-10-31");
    xsw.writeAttribute("catalog-id", params.masterCatalogID);
}

/**
* @param {dw.io.StreamWriter} xsw - StreamWriter
*/
function finalizeFeed(xsw) {
    Logger.getLogger('shopTheLook').info('Feed Finished');
    xsw.writeEndElement();
    xsw.writeEndDocument();
    xsw.flush();
    xsw.close();
}
function writeProductXML(xsWriter, product, ImageModelInfoObj, shopTheLookLastUpdate, DOMServiceStatus) {
    xsWriter.writeStartElement('product');
    xsWriter.writeAttribute('product-id', product.getID());
    xsWriter.writeStartElement('custom-attributes');
    writeElementXML(xsWriter, 'shopTheLookJson', JSON.stringify(ImageModelInfoObj));
    writeElementXML(xsWriter, 'shopTheLookLastUpdate', shopTheLookLastUpdate);
    writeElementXML(xsWriter, 'shopTheLookStatus', DOMServiceStatus);
    var shopTheLookDisable = false;
    writeElementXML(xsWriter, 'shopTheLookDisable', shopTheLookDisable);
    xsWriter.writeEndElement(); //</custom-attributes>
    xsWriter.writeEndElement(); //</product>
    xsWriter.flush();
}
function writeElementXML(xsWriter, attributeId, attributeValue) {
    xsWriter.writeStartElement('custom-attribute');
    xsWriter.writeAttribute('attribute-id', attributeId);
    xsWriter.writeCharacters(attributeValue);
    xsWriter.writeEndElement(); // </custom-attribute>
}

function createJSONObj(response) {
    var responseResult = response[0].results;
    return responseResult;
}
/**
* @param {String} str - Image URL String
* @returns {String} - String
*/
function reduceImageURL(str) {
    var result = str.split('?')[0]; // Remove query component
    var pathArr = result.split('/');
    return pathArr[pathArr.length - 1]; // Return last name in path
}
function ImageModelInfoJSON(imageResponse, uniqueId) {
    var modelInfo = {};
    var showMoreInfo = false;
    var showLookBotton = false;
    if (imageResponse.hasOwnProperty('ua:Size')) {
        modelInfo.modelSize = imageResponse['ua:Size'];
        showMoreInfo = true;
    }
    if (imageResponse.hasOwnProperty('ua:ModelHeightCm')) {
        modelInfo.modelHeightCm = imageResponse['ua:ModelHeightCm'];
        showMoreInfo = true;
    }
    if (imageResponse.hasOwnProperty('ua:ModelHeightFtIn')) {
        modelInfo.modelHeightFtIn = imageResponse['ua:ModelHeightFtIn'];
        showMoreInfo = true;
    }
    // material codes
    if (imageResponse.hasOwnProperty('ua:MaterialCode')) {
        for (var k = 0; k < imageResponse['ua:MaterialCode'].length; k++) {
            if (imageResponse['ua:MaterialCode'][k] !== uniqueId) {
                showLookBotton = true;
                break;
            }
        }
    }
    modelInfo.showLookButton = showLookBotton;
    modelInfo.showModelInfo = showMoreInfo;
    return modelInfo;
}
function materialCodesJSON(uniqueMaterialCodes) {
    var materialCodesObj = {};
    var materialCodes = [];
    for (var m = 0; m < uniqueMaterialCodes.length; m++) {
        var materialCode = uniqueMaterialCodes[m].split('-');
        var materialInfo = {};
        materialInfo.sku = materialCode[0];
        materialInfo.color = materialCode[1];
        materialCodes.push(materialInfo);
    }
    materialCodesObj.materialCodes = materialCodes;
    return materialCodesObj;
}

/**
* @param {dw.io.StreamWriter} fw - StreamWriter
* @param {product} product - Product
* @param {number} count - Product export count
* @param {object} params - object
* @returns {number} - Output count
*/
function writeProduct(fw, product, count, params) {
    var allViewTypes = ['pdpMainDesktop', 'pdpMainMobile', 'sizeModelSM', 'sizeModelMD', 'sizeModelLG', 'sizeModelXL'];
    var ImageModelInfoObj = new Object();
    var outputCount = 0;
    var allColors = [];

    var styleNumber = product.ID;
    var variationModel = product.getVariationModel();
    var DOMServiceStatus = false;

    var productVariants = product.getVariants();
    productVariants.toArray().forEach(function(variant) {
        if (params.excludeOfflineVariants && !variant.isOnline()) {
            return;
        }

        var colorAttribute = variant.getCustom().color;
        if (colorAttribute && allColors.indexOf(colorAttribute) === -1) {
            allColors.push(colorAttribute);
        }
    });

    allColors.forEach(function(colorValue) {
        var uniqueId = styleNumber + '-' + colorValue;
        var productUrl = URLUtils.https('Product-Show', 'pid', product.ID, 'dwvar_' + product.ID + '_color', colorValue);
        var uniqueImages = [];
        // Get variants in the selected color
        var filter = new HashMap();
        filter.put('color', colorValue);
        var variants = variationModel.getVariants(filter);
        if (variants && variants.length) {
            // First variant
            var variant = variants[0];
            // Get images assigned to pdpMainDesktop and pdpMainMobile views
            for (var viewType = 0; viewType < allViewTypes.length; viewType++) {
                var images = variant.getImages(allViewTypes[viewType]);
                if (!empty(images)) {
                    var imageArray = images.toArray();
                    for (var i = 0; i < imageArray.length; i++) {
                        var absURL = imageArray[i].absURL;
                        if (absURL && !empty(absURL.toString())) {
                            var imageFileName = reduceImageURL(absURL.toString());
                            if (imageFileName && uniqueImages.indexOf(imageFileName) === -1) {
                                // Array will look like: ["V5-5033169-480_FC_Main", "V5-5033169-480_BC", "PS5033169-480_HF", "PS5033169-480_HB"]
                                uniqueImages.push(imageFileName);
                            }
                        }
                    }
                }
            }
            // Call DAM service
            if (uniqueImages.length) {
                Logger.getLogger('shopTheLook').info('Product: {0}, Color: {1}, Images: {2}', product.ID, colorValue, uniqueImages.length);
                var param = 'assetType=photography&queryType=materialCode&queryValue=' + product.ID + '-' + colorValue;
                var response = adobeAssetService.call(param);
                if (!empty(response)) {
                    var responseResult = createJSONObj(JSON.parse(response));
                    var colorId = '-' + colorValue + '_';
                    var colorCode = colorValue;
                    var ImageModelInfo = {};
                    var uniqueMaterialCodesBySizes = {};
                    for (var i = 0; i < responseResult.length; i++) {
                        var ImageTypePrefix = responseResult[i].name.split('.')[0];
                        for (var j = 0; j < uniqueImages.length; j++) {
                            if (ImageTypePrefix === uniqueImages[j]) {
                                var ImagePrefix = ImageTypePrefix.split(colorId);
                                var imageResponse = responseResult[i];
                                ImageModelInfo[ImageTypePrefix] = ImageModelInfoJSON(imageResponse, uniqueId);
                                if (imageResponse.hasOwnProperty('ua:MaterialCode') && imageResponse.hasOwnProperty('ua:Size')) {
                                    var uaSize = imageResponse['ua:Size'];
                                    if (uniqueMaterialCodesBySizes[uaSize] === undefined) {
                                        uniqueMaterialCodesBySizes[uaSize] = [];
                                    }
                                    var imageMaterialCodes = imageResponse['ua:MaterialCode'];
                                    for (var n = 0; n < imageMaterialCodes.length; n++) {
                                        if (uniqueMaterialCodesBySizes[uaSize].indexOf(imageMaterialCodes[n]) == -1) {
                                            uniqueMaterialCodesBySizes[uaSize].push(imageMaterialCodes[n]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    var shopTheLookOutfit = {};

                    var sizes = Object.keys(uniqueMaterialCodesBySizes);
                    for (let i = 0; i < sizes.length; i++) {
                        var size = sizes[i];
                        var uniqueMaterialCodes = uniqueMaterialCodesBySizes[size];
                        shopTheLookOutfit[size.toLowerCase()] = materialCodesJSON(uniqueMaterialCodes);
                    }
                    ImageModelInfo.shopTheLookOutfit = shopTheLookOutfit;
                    ImageModelInfoObj[colorCode] = ImageModelInfo;
                    DOMServiceStatus = true;
                }
            }
            var shopTheLookLastUpdate = StringUtils.formatCalendar(new Calendar(), "MM/dd/YYYY H:MM:ss");
        }
    });

    writeProductXML(fw, product, ImageModelInfoObj, shopTheLookLastUpdate, DOMServiceStatus);

    return outputCount;
}

/**
* @param {dw.io.File} fw - FileWriter
*/
function writeProducts(xsw, params) {
    Logger.getLogger('shopTheLook').info('Writing Products');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var count = 0;
    var IsQueryAllForSiteProducts = params.IsQueryAllForSiteProducts;
    var limitDAMServiceCall =  params.limitDOMServiceCall;
    var shopTheLookthresholdDays =  params.shopTheLookthresholdDays;
    var prepCategory = !empty(params.prepImageCategoryID) ? params.prepImageCategoryID : 'prep-category';
    var ignoreProductSTLStatus = params.ignoreProductSTLStatus;
    var productIterator;
    // Added Job Step preference to ONLY look at Prep Category OR look at ALL products
    // If ALL products:
    // 1. Use the Last Updated date to update
    // 2. Use STATUS to determine if DAM should be called
    // 3. Limit number of DAM Calls and stop job after X calls. Should be incremental. 
    if (IsQueryAllForSiteProducts) {
        productIterator = ProductMgr.queryAllSiteProducts();
        Logger.getLogger('shopTheLook').info('Found {0} Products', productIterator.getCount());
    } else {
        productIterator = CatalogMgr.getCategory(prepCategory).getProducts().iterator();
        Logger.getLogger('shopTheLook').info('Found {0} Products', CatalogMgr.getCategory(prepCategory).getProducts().size());
    }
    while (productIterator.hasNext()) {
        var product = productIterator.next();
        if (product.master) {
            if (product.custom.giftCard.value === 'GIFT_CARD' || product.custom.giftCard.value === 'EGIFT_CARD') { //Exclude gift cards and stuff
                continue;
            }
            var serviceStatus = ignoreProductSTLStatus ? false : product.custom.shopTheLookStatus;
            var lastupdated = product.custom.shopTheLookLastUpdate;
            var lastupdatedDate = StringUtils.formatCalendar(new Calendar(new Date(product.custom.shopTheLookLastUpdate)), 'MM/dd/yyyy H:MM:ss');
            var noOfDays = (System.getCalendar().getTime().getTime() - new Date(lastupdatedDate).getTime()) / (1000 * 60 * 60 * 24);
            if ((IsQueryAllForSiteProducts && serviceStatus && noOfDays < shopTheLookthresholdDays) || (!IsQueryAllForSiteProducts && serviceStatus)) {
                continue;
            }
            // if (product.getAvailabilityModel().isInStock()) { //  Unclear if this is needed
            count += writeProduct(xsw, product, count, params);
            // }
        }
        if (IsQueryAllForSiteProducts && count >= limitDAMServiceCall) { // Limit number of DAM Calls and stop job after X calls. Should be incremental. Unless in Prep-Category mode.
            break;
        }
    }
    if (IsQueryAllForSiteProducts) {
        productIterator.close();
    }
    Logger.getLogger('shopTheLook').info('Wrote {0} Products', count);
}

/**
* Main function
*/
function assignShopTheLook(params) {
    Logger.getLogger('shopTheLook').info('Shop The Look Product Feed: Starting');
    // This is not site specific... Should be run over any product assigned to any site.
    var siteID = Site.getCurrent().getID().toLowerCase();
    var date = new Date();
    var dateString = date.getFullYear() + insertLeadingZero(date.getMonth() + 1) + insertLeadingZero(date.getDate()) + insertLeadingZero(date.getHours()) + insertLeadingZero(date.getMinutes());
    var filename = 'ShopTheLook-' + siteID + '-' + dateString + '.xml';

    var dir = new File(File.IMPEX + '/src/feeds/shopTheLook/');
    dir.mkdirs();
    var file = new File(File.IMPEX + '/src/feeds/shopTheLook/' + filename);
    file.createNewFile();

    Logger.getLogger('shopTheLook').info('Current Site: {0}', Site.current.ID);
    Logger.getLogger('shopTheLook').info('File Path: {0}', File.IMPEX + '/src/feeds/shopTheLook/' + filename);

    try {
        var fw = new FileWriter(file, 'UTF-8', false),
            xsw = new StreamWriter(fw);
        initFeed(file, xsw, params);
        writeProducts(xsw, params);
        finalizeFeed(xsw);
        // TODO: Upload the feed somewhere
    } catch (ex) {
        Logger.error('Exception caught during catalog export and upload: {0}', ex.message);
    } finally {
        if (file.exists()) {
            // file.remove();
        }
    }
    var zipFile = new File(File.IMPEX + '/src/feeds/shopTheLook/' + filename + '.zip');
    file.zip(zipFile);

    Logger.getLogger('shopTheLook').info('Shop The Look Product Feed: Complete');
}

exports.assignShopTheLook = assignShopTheLook;