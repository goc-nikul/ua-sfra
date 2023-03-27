'use strict';

const XMLStreamWriter = require('dw/io/XMLStreamWriter'),
    Site = require('dw/system/Site'),
    FileWriter = require('dw/io/FileWriter'),
    File = require('dw/io/File'),
    CatalogMgr = require('dw/catalog/CatalogMgr'),
    CustomObjectMgr = require('dw/object/CustomObjectMgr');
let regionalSuffixesArr = [];

/**
 * Main function
 */
function execute(params) {
    var xsw,
        masterCatalogID = params.masterCatalogID,
        categoryID = params.categoryID;
    try {
        const siteID = Site.getCurrent().getID().toLowerCase();
        let regionalImageSuffixes = CustomObjectMgr.getCustomObject('SiteData', 'RegionalImageSuffixes');

        if (!empty(regionalImageSuffixes) && 'custom' in regionalImageSuffixes) {
            regionalImageSuffixes = regionalImageSuffixes.getCustom();
            if (!empty(regionalImageSuffixes) && 'data' in regionalImageSuffixes && regionalImageSuffixes.data) {
                regionalSuffixesArr = regionalImageSuffixes.data.split(',');
            }
        }

        const dir = new File(File.IMPEX + '/src/feeds/removeImageAssociation/');
        dir.mkdirs();

        const file = new File(File.IMPEX + '/src/feeds/removeImageAssociation/remove_sizemodel_associations_' + siteID + '.xml');
        file.createNewFile();

        let fw = new FileWriter(file, 'UTF-8');
        xsw = new XMLStreamWriter(fw);
        xsw.writeStartDocument('UTF-8', '1.0');
        xsw.writeStartElement('catalog');
        xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
        xsw.writeAttribute('catalog-id', masterCatalogID);
    } catch (e) {
        throw new Error('RemoveSizeModelImages.js : Could not create xml file' + e);
    }

    // fetching product from the category
    var products = CatalogMgr.getCategory(categoryID).getProducts().iterator();
    while (products.hasNext()) {
        try {
            var product = products.next();
            if (!product.master) continue;

            xsw.writeStartElement('product');
            xsw.writeAttribute('product-id', product.getID());
            xsw.writeStartElement('images');
            
            let variants = product.getVariants().iterator(),
            checkedColors = [];
            while (variants.hasNext()) {
                let variant = variants.next();
                if (variant.custom.color == null) {
                    continue;
                };
                if (checkedColors.indexOf(variant.custom.color) == -1) {
                    checkedColors.push(variant.custom.color);
                }
                // Check whether images exist on scene7 or not
                var S7 = existsOnS7(variant),
                    exists = S7[0],
                    existPosition = -1,
                    newSuffixes = ['BC', 'BC_Main', 'FC', 'FC_Main', 'FSF', 'FSF1', 'FSF2', 'FSF_Main', 'F1', 'SC', 'SC_Main', 'HF', 'HB', 'SLF_SL', 'SLB_SL', 'LDF_SL', 'LDB_SL', 'SIDEDET', 'HF', 'PACK', 'C', 'f', 'b', 'FNT', 'SNT'];
                
                for (let i = 0; i < newSuffixes.length; i++) {
                    // first check if global image exists
                    existPosition = checkRegionalImagesCodes(exists, newSuffixes[i]);
                    if (existPosition > -1) break;
                }
                
                // New image found, generate XML and continue to next product
                if (existPosition > -1) {
                    generateNewFormatImages(variant, xsw, S7);
                    continue;
                }
            }
        } catch(e) {
            throw new Error('RemoveSizeModelImages.js : error while processing products ' + e);
        }
        xsw.writeEndElement(); //</images>
        xsw.writeEndElement(); //</product>
        xsw.flush();
    }
    xsw.writeEndElement(); //</catalog>
    xsw.flush();
    xsw.close();
}

/**
 * generate images in new format
 * @param {product} product - Product
 * @param {dw.io.StreamWriter} xsw - StreamWriter
 * @param {array} S7 array of images
 */
function generateNewFormatImages(product, xsw, S7) {
    let exists = S7[0],
        existPosition = -1,
        prefixes = S7[1],
        prefix = '',
        suffix = '';
        

    var productHasFitModelImages = false;
    ['MD', 'LG', 'XL', 'SM'].map(function(sizeCode) { // Loop through fit model sizes
        //FIT/SIZE MODELS
        let FIT = braSizeTable(sizeCode); // Get bra sizes mapping table
        let FC_FIT = FIT.map(function(c) {return 'FC_' + c;}); // Fit front images
        let BC_FIT = FIT.map(function(c) {return 'BC_' + c;}); // Fit back images
        let FITCodes = FC_FIT.concat(BC_FIT);
        if (fitModelImageExistsCheck(FITCodes, exists)) { // Check if fit model images exists
            productHasFitModelImages = true;
            xsw.writeStartElement('image-group');
            xsw.writeAttribute('view-type', 'sizeModel' + sizeCode); // sizeModelXX view type
            updateColorVariation(xsw, product.custom.color);
            xsw.writeEndElement(); //</image-group>
        } else if (sizeCode === 'SM' && productHasFitModelImages === true) {
            // Note: Edge-case for SM fit image.
            xsw.writeStartElement('image-group');
            xsw.writeAttribute('view-type', 'sizeModel' + sizeCode); // sizeModelXX view type
            updateColorVariation(xsw, product.custom.color);
            xsw.writeEndElement(); //</image-group>
        }
        //set false for hasSizeModel, since not generating path for size model images
        var Transaction = require('dw/system/Transaction');
        if (productHasFitModelImages) {
            Transaction.wrap(function () {
                if (product.isMaster() && product.custom && 'hasSizeModel' in product.custom) {
                    product.custom.hasSizeModel = false;
                } else {
                    var master = product.masterProduct;
                    if (master.custom && 'hasSizeModel' in master.custom && master.custom.hasSizeModel) {
                        master.custom.hasSizeModel = false;
                    }
                }
            });
        }
    });
}

/**
 * check images exist on scene7
 * @param {product} product - Product
 * @returns {array} array of images
 */
function existsOnS7(product) {

    var Scene7Mgr = require('bc_jobs/cartridge/scripts/services/Scene7Service');
    let exists = [],
        materialPrefixes = [],
        filePrefixes = ['V5-', 'PS', ''],
        params = null,
        result = null,
        SKU = null;

    //The image could be in one of 3 file formats check for each
    for (let i = 0; i < filePrefixes.length; i++) {
        let prefix = filePrefixes[i];
        SKU = product.custom.style + '-' + product.custom.color;
        params = prefix + SKU + '_is?req=imageset';
        result = Scene7Mgr.call(params);

        //EMPTY RESULT IS NOT NULL BUT HAS LENGTH OF 2
        if (result && result.length > 2) {
            var arrayResult = result.split(',');
            for (let z = 0; z < arrayResult.length; z++) {
                let a = arrayResult[z].split(';');
                if (product.custom.division === 'Accessories' && SKU && a[0] === 'Underarmour/' + SKU) {
                    exists.push(SKU);
                } else {
                    a = a[0].split('_');
                    a.shift();
                    exists.push(a.join('_'));
                }

                materialPrefixes.push(prefix);
            }
        }
    }

    //Return array of images found and an array
    //with the appropriate prefix
    return [exists, materialPrefixes];
}

/**
 * generate XML tag for variation attribute
 * @param {dw.io.StreamWriter} xsw - StreamWriter
 * @param {String} colorValue
 */
function updateColorVariation(xsw, colorValue) {
    xsw.writeStartElement('variation');
    xsw.writeAttribute('attribute-id', 'color');
    xsw.writeAttribute('value', colorValue);
    xsw.writeEndElement();
}

/**
 * @param {dw.system.Site} imageCode preference
 * @param {JSON} JSON
 */
function parsedJsonCodes(imageCode) {
    var parsedJSON = false;
    if (imageCode) {
        try {
            var tempJSON = JSON.parse(imageCode);
            if (typeof tempJSON == 'object' && Object.keys(tempJSON).length) {
                parsedJSON = tempJSON;
            }
        } catch(e) {
            // Parsing error 
        }
    }
    return parsedJSON
}

/**
 * Check regional image codes in priority: 1. SiteData -> RegionalImageSuffixes custom object (KR,EM,JP...), 2. Global suffixes
 *
 * @param {Array} array of existed scene7 images codes 
 * @param {String} code for check if exist in 'exists' array 
 * @returns {Number} found code index in 'exists' array or -1
 */

function checkRegionalImagesCodes(exists, code) {
    let existsUpperCase = exists.toString().toUpperCase().split(','); // Convert to uppercase
    if (code) {
        code = code.toUpperCase(); // Convert to uppercase
    }
    let index = existsUpperCase.indexOf(code); // indexOf is case-sensitive
    for (let i = 0; i < regionalSuffixesArr.length; ++i) {
        let region = regionalSuffixesArr[i];
        let regionIndex = existsUpperCase.indexOf((code + '_' + region).toUpperCase()); // Convert to uppercase
        if (regionIndex !== -1) {
            index = regionIndex;
            break;
        }
    }
    return index;
}

/**
 * Check if any "fit model" or "size model" images exist for a product color
 *
 * @param {Array} codes image suffixes ['FC_MD', 'FC_32DD', 'FC_34C', ...]
 * @param {Array} exists S7 image array ["BC_MD","FC_MD","LDB_SL","LDF_SL", ...]
 * @returns {Boolean} an image was fundd
 */
function fitModelImageExistsCheck(codes, exists) { // This is a minial version of the processCodes function
    for (let i = 0; i < codes.length; ++i) {
        let code = codes[i];
        let existPosition = checkRegionalImagesCodes(exists, code);
        if (existPosition != -1) {
            return true;
        };
    }
    return false;
}

/**
 * @param {String} size
 * @returns {Object} braSizeMap
 */
function braSizeTable(size) {
    let braSizeMap = {
        'SM': ['SM', '30AA', '30A', '30B', '32AA', '32A', '32B', '32C', '32D', '34AA', '34A','34B'],
        'MD': ['MD', '32DD', '34C', '34D', '36A', '36B'],
        'LG': ['LG', '34DD', '34DDD', '36C', '36D', '38B', '38C'],
        'XL': ['XL', 'X1', '36DD', '36DDD', '38D', '38DD', '38DDD', '40C', '40D', '40DD', '40DDD', '42C', '42D', '42DD', '42DDD', '44DD', '44DDD']
    };
    return braSizeMap[size]
}

module.exports.execute = execute;