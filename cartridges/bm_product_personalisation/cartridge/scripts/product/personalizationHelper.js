'use strict';

const coType = 'ProductPersonalization';
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var log = require('*/cartridge/scripts/logs/writelogs');

/**
 * Get Data personalization
 * @param {Object} data Personaliation object
 * @returns {Object} returns JSON parsed Object
 */
function getDataPersonalization(data) {
    if (!data) return {};
    try {
        return JSON.parse(data);
    } catch (e) {
        log.error(e.message + '\n' + e.stack);
    }
    return {};
}

/**
 * Get page title
 * @param {Object} data Personaliation object
 * @param {Object} error error
 * @returns {string} returns page title
 */
function getPageTitle(data, error) {
    return (!data.productID || error) ?
        Resource.msg('productpersonalization.modalNewPersonalizationTitle', 'personalization', null) :
        Resource.msgf('productpersonalization.modalEditPersonalizationTitle', 'personalization', null, data.productID.replace(/.*_/, ''));
}

/**
 * Get values of personalizationStyle
 * @returns {Object} get all values of personalizationStyle
 */
function getPersonalizationStyles() {
    return require('dw/object/SystemObjectMgr').describe('Product').getCustomAttributeDefinition('personalizationStyle');
}

/**
 * Update custom object from form data
 * @param {Object} form Updated custom object from form data
 * @returns {Object} returns updated custom object
 */
function updateCustomObject(form) {
    var co = CustomObjectMgr.getCustomObject(coType, Site.current.ID + '_' + form.productID) || CustomObjectMgr.createCustomObject(coType, Site.current.ID + '_' + form.productID);
    co.custom.jerseyStyle = !empty(form.jerseyStyle) ? form.jerseyStyle : null;
    co.custom.frontImage = !empty(form.frontImage) ? form.frontImage : null;
    co.custom.backImage = !empty(form.backImage) ? form.backImage : null;
    co.custom.enableSponsors = !empty(form.enableSponsors) ? form.enableSponsors : null;
    co.custom.frontImageSponsors = !empty(form.frontImageSponsors) ? form.frontImageSponsors : null;
    co.custom.backImageSponsors = !empty(form.backImageSponsors) ? form.backImageSponsors : null;
    co.custom.nameLocation = !empty(form.nameLocation) ? form.nameLocation : null;
    co.custom.personalizationInfo = !empty(form.personalizationInfo) ? form.personalizationInfo : null;
    // Personalizations Options
    co.custom.nopersonalizationsOption = !empty(form.nopersonalizationsOption) ? Number(form.nopersonalizationsOption).toFixed(2) : 0.00;
    co.custom.nameOption = !empty(form.nameOption) ? Number(form.nameOption).toFixed(2) : 0.00;
    co.custom.numberOption = !empty(form.numberOption) ? Number(form.numberOption).toFixed(2) : 0.00;
    co.custom.namenumberOption = !empty(form.namenumberOption) ? Number(form.namenumberOption).toFixed(2) : 0.00;
    co.custom.sponsorsOption = !empty(form.sponsorsOption) ? Number(form.sponsorsOption).toFixed(2) : 0.00;
    co.custom.namesponsorsOption = !empty(form.namesponsorsOption) ? Number(form.namesponsorsOption).toFixed(2) : 0.00;
    co.custom.numbersponsorsOption = !empty(form.numbersponsorsOption) ? Number(form.numbersponsorsOption).toFixed(2) : 0.00;
    co.custom.namenumbersponsorsOption = !empty(form.namenumbersponsorsOption) ? Number(form.namenumbersponsorsOption).toFixed(2) : 0.00;
    co.custom.defaultOption = !empty(form.defaultOption) ? form.defaultOption : null;
    return co;
}

/**
 * Create XML file to import
 * @param {string} productID product ID
 * @returns {Object} returns file name
 */
function getXMLFile(productID) {
    var File = require('dw/io/File');
    var dir = new File(File.IMPEX + '/src/personalizationsoptions');
    dir.mkdirs();
    var fileName = Site.current.ID + '_' + productID + '.xml';
    var file = new File(dir.fullPath + '/' + fileName);
    if (!file.exists()) file.createNewFile();
    return file;
}

/**
 * Build Personalization XML to update product
 * @param {Object} dataPersonalization Personalization data
 * @param {boolean} deleteOptions is Delete
 * @returns {Object} returns generated file
 */
function buildXML(dataPersonalization, deleteOptions) {
    var file = getXMLFile(dataPersonalization.ID.split('_')[1]);
    var FileWriter = require('dw/io/FileWriter');
    var XMLStreamWriter = require('dw/io/XMLStreamWriter');
    var {
        catalogId
    } = require('*/cartridge/config/prefs');
    var fileWriter = new FileWriter(file, 'UTF-8');
    var xsw = new XMLStreamWriter(fileWriter);

    xsw.writeStartDocument('UTF-8', '1.0');
    xsw.writeStartElement('catalog');
    xsw.writeAttribute('catalog-id', catalogId);
    xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');

    var ProductMgr = require('dw/catalog/ProductMgr');
    var isColorAvailable = dataPersonalization.ID.split('-').length > 1;
    var products = [];
    if (isColorAvailable) {
        var productWithColor = dataPersonalization.ID.split('_')[1];
        var product = ProductMgr.getProduct(productWithColor.split('-')[0]);
        if (product && product.master) {
            products = product.variants.toArray().filter((variant) => {
                return variant.custom.color === productWithColor.split('-')[1];
            });
        }
    } else {
        products = [ProductMgr.getProduct(dataPersonalization.ID.split('_')[1])];
    }

    products.forEach((dwProduct) => {
        xsw.writeStartElement('product');
        xsw.writeAttribute('product-id', dwProduct.ID);
        xsw.writeStartElement('options');
        if (!deleteOptions) {
            xsw.writeStartElement('option');
            xsw.writeAttribute('option-id', 'personalizations');
            xsw.writeStartElement('sort-mode');
            xsw.writeCharacters('position');
            xsw.writeEndElement();
            xsw.writeStartElement('option-values');
            const personalizationAttrs = ['nopersonalizationsOption', 'nameOption', 'numberOption', 'namenumberOption', 'sponsorsOption', 'namesponsorsOption', 'numbersponsorsOption', 'namenumbersponsorsOption'];
            personalizationAttrs.forEach((item, index) => {
                if (item in dataPersonalization) {
                    xsw.writeStartElement('option-value');
                    xsw.writeAttribute('value-id', index);
                    xsw.writeAttribute('default', (dataPersonalization.defaultOption && dataPersonalization.defaultOption === item));
                    xsw.writeStartElement('display-value');
                    xsw.writeAttribute('xml:lang', request.locale === 'default' ? 'x-default' : require('dw/util/Locale').getLocale(request.locale).language);// eslint-disable-line
                    /* Since multilocale is not supporting in bm extensions,
                    We are appending locale from request in bundle name to fetch the localised content
                    and fallback will be default bundle */
                    var localizedOption;
                    if (request.locale !== 'default') localizedOption = Resource.msg('productpersonalization.option.' + item, 'personalization_' + request.locale, null); // eslint-disable-line
                    if (!localizedOption || localizedOption === 'productpersonalization.option.' + item) localizedOption = Resource.msg('productpersonalization.option.' + item, 'personalization', null);
                    xsw.writeCharacters(localizedOption);
                    xsw.writeEndElement();
                    xsw.writeStartElement('option-value-prices');
                    var originalLocale = request.locale; // eslint-disable-line
                    require('*/cartridge/config/countries.js').forEach((allowedLocale) => {
                        request.setLocale(allowedLocale.id); // eslint-disable-line
                        var localeDataPersonalization = CustomObjectMgr.getCustomObject(coType, dataPersonalization.ID).custom;
                        if (item in localeDataPersonalization) {
                            xsw.writeStartElement('option-value-price');
                            xsw.writeAttribute('currency', allowedLocale.currencyCode);
                            xsw.writeCharacters(localeDataPersonalization[item]);
                            xsw.writeEndElement();
                        }
                    });
                    request.setLocale(originalLocale); // eslint-disable-line
                    xsw.writeEndElement();
                    xsw.writeEndElement();
                }
            });
            xsw.writeEndElement();
            xsw.writeEndElement();
        }

        xsw.writeEndElement();
        xsw.writeEndElement();
    });
    xsw.writeEndElement();

    xsw.close();
    fileWriter.close();
    return file;
}

/**
 * Import Product Personalizations
 * @param {Object} file File to import
 * @returns {boolean} error code
 */
function importProductPersonalizations(file) {
    var Pipelet = require('dw/system/Pipelet');
    var importCatalog = new Pipelet('ImportCatalog').execute({
        ImportFile: file.getFullPath().replace('/IMPEX/src/', ''),
        ImportMode: 'MERGE'
    });
    file.remove();
    return importCatalog.ErrorCode !== 0;
}

/**
 * Import Data personalization
 * @param {Object} dataPersonalization Data personalization object
 */
function importChanges(dataPersonalization) {
    var Transaction = require('dw/system/Transaction');
    try {
        Transaction.begin();
        var customObj = updateCustomObject(dataPersonalization);
        if (!customObj) throw new Error('Failed to update custom object');
        var file = buildXML(customObj.custom);
        if (!file) throw new Error('Failed to generate file');
        Transaction.commit();
        importProductPersonalizations(file);
    } catch (e) {
        log.error(e.message + '\n' + e.stack);
        Transaction.rollback();
    }
}

/**
 * Get custom object
 * @param {string} styleID Custom object's unique ID
 * @returns {Object} returns personalize model
 */
function getCustomObjectFromStyleID(styleID) {
    var co = CustomObjectMgr.getCustomObject(coType, styleID);
    if (!co) return {};
    var Personalize = require('*/cartridge/models/personalize');
    return new Personalize(co);
}

/**
 * Get Personalization data from custom object
 * @param {string} searchID query params
 * @returns {Object} returns indexed custom object
 */
function getPersonalizationData(searchID) {
    var personalizationObj = CustomObjectMgr.queryCustomObjects(coType, 'custom.ID LIKE {0}', null, Site.current.ID + '_' + (searchID || '') + '*').asList().toArray();
    return personalizationObj.map((element) => {
        return element.custom;
    });
}

/**
 * Remove Personalization
 * @param {string} productID product ID
 */
function removePersonalization(productID) {
    var Transaction = require('dw/system/Transaction');
    try {
        Transaction.begin();
        var styleID = Site.current.ID + '_' + productID;
        var customObj = CustomObjectMgr.getCustomObject(coType, styleID);
        if (!customObj) throw new Error('Failed to update custom object');
        var file = buildXML(customObj.custom, true);
        if (!file) throw new Error('Failed to generate file');
        CustomObjectMgr.remove(customObj);
        Transaction.commit();
        importProductPersonalizations(file);
    } catch (e) {
        log.error(e.message + '\n' + e.stack);
        Transaction.rollback();
    }
}

/**
 * Fetch all allowed locales from site prefs
 * @returns {Object} retuns array of allowed locales
 */
function allowedlocales() {
    var allowedlocalesArray = [];
    require('*/cartridge/config/countries.js').forEach((allowedlocale) => {
        allowedlocalesArray.push({
            id: allowedlocale.id,
            name: require('dw/util/Locale').getLocale(allowedlocale.id).displayName
        });
    });
    return allowedlocalesArray;
}

module.exports = {
    getDataPersonalization: getDataPersonalization,
    getPageTitle: getPageTitle,
    getPersonalizationStyles: getPersonalizationStyles,
    updateCustomObject: updateCustomObject,
    importChanges: importChanges,
    getPersonalizationData: getPersonalizationData,
    getCustomObjectFromStyleID: getCustomObjectFromStyleID,
    removePersonalization: removePersonalization,
    allowedlocales: allowedlocales
};
