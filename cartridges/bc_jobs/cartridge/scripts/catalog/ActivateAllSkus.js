'use strict';
/*
 * Activate all skus of prep category based on the rules
 */
var Logger = require('dw/system/Logger');
const StringUtils = require('dw/util/StringUtils');
const productMgr = require('dw/catalog/ProductMgr');
const CatalogMgr = require('dw/catalog/CatalogMgr');
const Calendar = require('dw/util/Calendar');
const CSVStreamWriter = require('dw/io/CSVStreamWriter');
const File = require('dw/io/File');
const FileWriter = require('dw/io/FileWriter');
const Site = require('dw/system/Site');
const siteID = Site.getCurrent().getID().toUpperCase();
const collections = require('*/cartridge/scripts/util/collections');

function getTopMostCategory(category) {
    var parentCategory = category.getParent();
    if (parentCategory.isTopLevel()) {
        return parentCategory;
    } else {
        var parent = getTopMostCategory(parentCategory);
        return parent;
    }
}

function getHealthPercent(category) {
    var categoryHealthPercent;
    if (category.ID === 'men' || category.ID === 'women') {
        categoryHealthPercent = 90;
    }
    if (category.ID === 'Accessories' || category.ID === 'footwear') {
        categoryHealthPercent = 50;
    }
    if (category.ID === 'kids') {
        categoryHealthPercent = 75;
    }
    return categoryHealthPercent;
}

function activateProduct(product, defaultInventoryHealth, csw, productsCsw) {
    var productActivated = false;
    try {
        if (product.isMaster()) {
            var allVariants = product.getVariants();
            var errorReport = [];
            var successReport = [];
            var colors = {};
            // sort variants by their colors
            collections.forEach(allVariants, function (variantProduct) {
                if (!colors.hasOwnProperty(variantProduct.custom.color)) {
                    colors[variantProduct.custom.color] = [];
                }
                colors[variantProduct.custom.color].push(variantProduct.ID);
            });
            // loop through all the colors in master product
            var Transaction = require('dw/system/Transaction');
            Transaction.wrap(function () {
                Object.keys(colors).forEach(function (color) {
                    // say red color
                    var colorVariantsGroup = colors[color];
                    var instockCount = 0;
                    // loop through all the variants in a color to calculate inventory health
                    for (let i = 0; i < colorVariantsGroup.length; i++) {
                        let variant = productMgr.getProduct(colorVariantsGroup[i]);
                        let inventory = variant.availabilityModel && variant.availabilityModel.inventoryRecord && variant.availabilityModel.inventoryRecord.allocation && (variant.availabilityModel.inventoryRecord.allocation.value > 0 || variant.availabilityModel.inventoryRecord.perpetual);
                        if (inventory) {
                            instockCount = instockCount + 1;
                        }
                    }
                    var inventoryHealth = (instockCount / colorVariantsGroup.length) * 100;
                    var primaryCategory = product.primaryCategory;
                    var categoryHealthPercent;
                    if (primaryCategory && primaryCategory.custom && primaryCategory.custom.inventoryHealthPercent !== null) {
                        categoryHealthPercent = primaryCategory.custom.inventoryHealthPercent;
                    } else if (primaryCategory.isTopLevel() === false) {
                        var topMostCategory = getTopMostCategory(primaryCategory);
                        categoryHealthPercent = getHealthPercent(topMostCategory);
                    } else {
                        categoryHealthPercent = getHealthPercent(primaryCategory);
                    }
                    if (categoryHealthPercent === undefined) {
                        categoryHealthPercent = defaultInventoryHealth;
                    }
                    var healthCheckPass = inventoryHealth >= categoryHealthPercent ? true : false;
                    for (let i = 0; i < colorVariantsGroup.length; i++) {
                        let variant = productMgr.getProduct(colorVariantsGroup[i]);
                        var variantData = [];
                        // check inventory of product
                        let inventory = variant.availabilityModel && variant.availabilityModel.inventoryRecord && variant.availabilityModel.inventoryRecord.allocation && (variant.availabilityModel.inventoryRecord.allocation.value > 0 || variant.availabilityModel.inventoryRecord.perpetual);
                        var pricing = variant.priceModel && variant.priceModel.price && variant.priceModel.price.available;
                        var images = variant.getImages('pdpMainDesktop');
                        var startShipDate = variant.custom.shipmentstartdate;
                        if (startShipDate) {
                            startShipDate = new Date(startShipDate);
                        }
                        var todaysDate = new Date();
                        if (healthCheckPass && inventory && pricing && startShipDate && (startShipDate <= todaysDate) && (images && images.length > 0)) {
                            // activate sku
                            variant.setOnlineFlag(true);
                            // activate master product also if all criteria met
                            if (variant.masterProduct && !variant.masterProduct.online) {
                                variant.masterProduct.setOnlineFlag(true);
                            }

                            variantData.push(variant.masterProduct.ID);
                            variantData.push('="' + variant.ID + '"');
                            variantData.push(variant.custom.sku);
                            variantData.push('="' + StringUtils.formatCalendar(new Calendar(), 'MM/dd/yyyy') + '"');
                            variantData.push('Style and Material Both Were Activated');
                            productActivated = true;
                            successReport[successReport.length] = variantData;
                        } else {
                            variantData.push('="' + variant.ID + '"');
                            variantData.push(variant.custom.sku);

                            if (!inventory) {
                                variantData.push('Variant is Out_of_Stock');
                            } else if (!healthCheckPass) {
                                variantData.push('Inventory health is below ' + categoryHealthPercent + ' percent');
                            } else {
                                variantData.push(' ');
                            }
                            // check pricing
                            if (!pricing) {
                                variantData.push('Variant doesnt have any price assigned');
                            } else {
                                variantData.push(' ');
                            }
                            if (!startShipDate || !(startShipDate <= todaysDate)) {
                                variantData.push('Variant shipping start date is ' + startShipDate);
                            } else {
                                variantData.push(' ');
                            }
                            // check images
                            if (!images || (images && images.length === 0)) {
                                variantData.push('Variant doesnt have any images assigned');
                            } else {
                                variantData.push(' ');
                            }
                            errorReport[errorReport.length] = variantData;
                        }
                    }
                });
            });
            successReport.forEach(function (report) {
                productsCsw.writeNext(report);
            });
            errorReport.forEach(function (report) {
                csw.writeNext(report);
            });
        }
    } catch (e) {
        Logger.error('activateAllSKUs.js: activateProduct() - There was an error while trying to process the product : ' + product.ID + ', error - ' + e);
        var errorData = [];
        errorData.push('="' + product.ID + '"');
        errorData.push(' ');
        errorData.push(' ');
        errorData.push(' ');
        errorData.push(' ');
        errorData.push(' ');
        errorData.push('There was an error while processing this product. It will be picked in the next job run. If its failing more than 3 times, Please check the logs to investigate or raise it with dev team');
        csw.writeNext(errorData);
        productActivated = false;
    }
    return productActivated;
}

function activatePrepCategorySKUs(params) {
    var workingFolder = new File(File.IMPEX + '/src/prepCategory');
    if (!workingFolder.exists()) {
        workingFolder.mkdirs();
    }
    // Error Report File
    var fileName = 'SkuActivationErrors_' + siteID + '_' + StringUtils.formatCalendar(new Calendar(), 'yyyyMMddHHmmss') + '.csv';
    var file = new File(workingFolder, fileName);
    var fw = new FileWriter(file);
    var csw = new CSVStreamWriter(fw);

    // Success Report File
    var activatedProductsFileName = 'ProductsSuccessfullyActivated_' + siteID + '_' + StringUtils.formatCalendar(new Calendar(), 'yyyyMMddHHmmss') + '.csv';
    var productsFile = new File(workingFolder, activatedProductsFileName);
    var productsFw = new FileWriter(productsFile);
    var productsCsw = new CSVStreamWriter(productsFw);
    try {
        var PrepProducts = CatalogMgr.getCategory('prep-category').getProducts();
        var products = PrepProducts.iterator();
        Logger.info('activateAllSKUs.js: Number of products assigned in prep-categry : ' + PrepProducts.length);

        // grab prep-category for site
        var variantData = [];
        var successVariantData = [];
        if (PrepProducts.length === 0 || PrepProducts.empty) {
            variantData.push('No products are assigned to prep category for processing');
            successVariantData.push('No products are assigned to prep category for processing');
        } else {
            variantData.push('Product ID');
            variantData.push('Sku');
            variantData.push('Inventory Error');
            variantData.push('Pricing Error');
            variantData.push('StartShippingDate Error');
            variantData.push('Images Error');
            variantData.push('SFCC Error');

            successVariantData.push('Style Number');
            successVariantData.push('Variant ID');
            successVariantData.push('Material');
            successVariantData.push('Activation Date');
            successVariantData.push('Action');
        }
        csw.writeNext(variantData);
        productsCsw.writeNext(successVariantData);

        var defaultInventoryHealth = params.inventoryHealth ? parseInt(params.inventoryHealth) : 80;
        var activationSucceessCount = 0;
        var activationErrorCount = 0;
        while (products.hasNext()) {
            var product = products.next();
            var productActivated = activateProduct(product, defaultInventoryHealth, csw, productsCsw);
            if (productActivated) {
                activationSucceessCount = activationSucceessCount + 1;
            } else {
                activationErrorCount = activationErrorCount + 1;
            }
        }
        Logger.info('activateAllSKUs.js: Number of products successfully activated in prep-categry : ' + activationSucceessCount);
        Logger.info('activateAllSKUs.js: Number of products not activated in prep-categry : ' + activationErrorCount);

        csw.close();
        fw.close();
        productsCsw.close();
        productsFw.close();

        if (PrepProducts.length > 0) {
            var Resource = require('dw/web/Resource');
            var template = new dw.util.Template('/mail/impexLocationUrl');
            var HashMap = require('dw/util/HashMap');

            var emailList = params.emailList.split(',');
            var webdavURL = 'https://' + dw.system.System.getInstanceHostname() + '/on/demandware.servlet/webdav/Sites';
            var subjectText = Resource.msg('email.activateSku.subject', 'common', null);

            var fileFullPath = webdavURL + file.getFullPath();
            var activatedFilePath = productsFile.getFullPath();
            var activatedFileFullPath = webdavURL + activatedFilePath;
            var map = new HashMap();
            map.put('data', { filePath: fileFullPath });
            map.put('activatedData', { activatedFilePath: activatedFileFullPath });
            var content = template.render(map).text;
            var mail = new dw.net.Mail();
            mail.addTo(emailList);
            mail.setFrom('system-notification@underarmour.com');
            mail.setSubject(subjectText);
            mail.setContent(content);
            mail.send();
        }
    } catch (e) {
        csw.close();
        fw.close();
        productsCsw.close();
        productsFw.close();
        Logger.error('activateAllSKUs.js: Could not activate all skus of prep category for site: ' + siteID + ' - ' + e);
        return;
    }
}

/* Exported methods */
module.exports = {
    activatePrepCategorySKUs: activatePrepCategorySKUs
};
