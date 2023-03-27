var Logger = require('dw/system/Logger');
var service = require('int_talkoot/cartridge/scripts/services/TalkootService');
var xmlWriter;
var models = {};
var modelsCopies = {};


const ATTRIBUTE_ORDER = ['ean', 'upc', 'unit', 'min-order-quantity', 'step-quantity', 'display-name', 'short-description', 'long-description',
    'store-force-price-flag', 'store-non-inventory-flag', 'store-non-revenue-flag', 'store-non-discountable-flag', 'online-flag', 'available-flag',
    'searchable-flag', 'tax-class-id'];

/**
 * Generate a copy of models
 * @param {string} modelID model
 * @param {string} jobID job
 * @returns {Object} modelCopies for a model
 */
function getModelsCopies(modelID, jobID) {
    if (!modelsCopies[modelID]) {
        var resp = service.call({
            endpoint: 'copy',
            params: {
                modelID: modelID,
                jobID: jobID
            }
        });
        if (resp && resp.Copies && resp.Copies) {
            modelsCopies[modelID] = resp.Copies;
        }
    }
    return modelsCopies[modelID];
}

/**
 * query a particular model
 * @param {string} id model id
 * @return {Object} model
 */
function getModel(id) {
    if (!models[id]) {
        var resp = service.call({
            endpoint: 'model/' + id
        });
        if (resp && resp.Models && resp.Models[0]) {
            models[id] = resp.Models[0];
        }
    }
    return models[id];
}

/**
 * Creates an XML writer with header based on params
 * @param {string} path  IMPEX path
 * @param {string} catalogID current catalog
 * @param {string} jobID current job
 * @returns {XMLWriter} xmlWriter
 */
function getXmlWriter(path, catalogID, jobID) {
    if (xmlWriter) {
        return xmlWriter;
    }
    const File = require('dw/io/File');
    const FileWriter = require('dw/io/FileWriter');
    const XMLStreamWriter = require('dw/io/XMLStreamWriter');
    var file = new File(File.IMPEX + '/' + path + '/talkootCatalog_' + jobID + '_' + (new Date()).getTime() + '.xml');
    file.createNewFile();
    xmlWriter = new XMLStreamWriter(new FileWriter(file, 'UTF-8'));
    xmlWriter.writeStartDocument();
    xmlWriter.writeStartElement('catalog');
    xmlWriter.writeAttribute('catalog-id', catalogID);
    xmlWriter.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
    return xmlWriter;
}

/**
 * Writes attributes using the XMLWriter
 * @param {XMLWriter} localXmlWriter copy of global XMLWriter
 * @param {Object} complexAttributes array of complex attributes
 * @param {Object} customAttributes array of custom attributes
 * @param {string} modelID model ID
 * @param {string} jobID job ID
 */
function writeComplexAttributes(localXmlWriter, complexAttributes, customAttributes, modelID, jobID) {
    if (!localXmlWriter || !complexAttributes || !customAttributes) {
        return;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (let key in complexAttributes) {
        if (Object.prototype.hasOwnProperty.call(complexAttributes, key)) {
            let attr = complexAttributes[key];
            attr.value = [];

            let bullets = key.split(',');
            for (let x = 0; x < bullets.length; x++) {
                let bullet = bullets[x];
                if (attr.values[bullet]) {
                    attr.value.push(attr.values[bullet]);
                } else {
                    let modelCopies = getModelsCopies(modelID, jobID);
                    let copy = modelCopies && modelCopies.filter(function (el) {
                        return el.CopyName.replace(/ /g, '-').replace(/[^\w-]+/g, '').toLowerCase() === bullet;
                    });
                    if (copy && copy[0] && copy[0].CopyValue) {
                        attr.value.push(copy[0].CopyValue);
                    }
                }
            }
            attr.value = attr.value.join(attr.separator);
            if (attr.isCustom) {
                customAttributes.push(attr);
            } else {
                localXmlWriter.writeStartElement(attr.attrID);
                if (attr.locale) {
                    localXmlWriter.writeAttribute('xml:lang', attr.locale);
                }
                localXmlWriter.writeCharacters(attr.value);
                localXmlWriter.writeEndElement();
            }
        }
    }
}

/**
 * Writes custom attributes using the XML attributes
 * @param {XMLWriter} localXmlWriter copy of global XMLWriter
 * @param {Object} customAttributes array of custom attributes
 */
function writeCustomAttributes(localXmlWriter, customAttributes) {
    if (!localXmlWriter || !customAttributes || !customAttributes.length) {
        return;
    }
    localXmlWriter.writeStartElement('custom-attributes');
    for (let i = 0; i < customAttributes.length; i++) {
        let attr = customAttributes[i];
        localXmlWriter.writeStartElement('custom-attribute');
        localXmlWriter.writeAttribute('attribute-id', attr.attrID);
        if (attr.locale) {
            localXmlWriter.writeAttribute('xml:lang', attr.locale);
        }

        if (attr.multiple) {
            let multipleValues = attr.value.replace(/, /g, ':: ').split(',');
            for (let v = 0; v < multipleValues.length; v++) {
                localXmlWriter.writeStartElement('value');
                localXmlWriter.writeCharacters(multipleValues[v].replace(/:: /g, ', '));
                localXmlWriter.writeEndElement();
            }
        } else {
            localXmlWriter.writeCharacters(attr.value);
        }

        localXmlWriter.writeEndElement();
    }
    localXmlWriter.writeEndElement();
}

/**
 * Returns locales in expected format
 * @returns {Object} locales
 */
function getLocales() {
    var resp = service.call({
        endpoint: 'locale'
    });
    var locales = [];

    if (resp && resp.Locales) {
        for (let i = 0; i < resp.Locales.length; i++) {
            let respLocale = resp.Locales[i];
            locales[respLocale.LocaleID] = respLocale.LocaleName.replace(/(\w+)-(\w+)/, function (m1, m2, m3) {
                return m2 + '-' + m3.toUpperCase();
            });
        }
    }
    return locales;
}

module.exports = {
    execute: function (jobParams) {
        var locales = getLocales();
        var endpoint = 'job' + (jobParams.JobID ? '/' + jobParams.JobID : '');
        var respJobs = service.call({
            endpoint: endpoint,
            params: {
                includearchived: 'false'
            },
            paramsStr: (jobParams && jobParams.JobQuery)
        });
        var map = JSON.parse(require('dw/system/System').getPreferences().getCustom().talkootMap);
        var complexMapKeys = [];
        if (!respJobs || !respJobs.Jobs) {
            Logger.warn('endpoint ' + endpoint + ' returned 0 Jobs.');
            return;
        }
        var orderMap = {};

        // eslint-disable-next-line no-restricted-syntax
        for (let key in map) {
            if (~key.indexOf(',')) {
                complexMapKeys.push(key);
            }
            if (~ATTRIBUTE_ORDER.indexOf(map[key].attrID)) {
                let bullets = key.split(',');
                for (let j = 0; j < bullets.length; j++) {
                    let bullet = bullets[j];
                    orderMap[bullet] = ATTRIBUTE_ORDER.indexOf(map[key].attrID);
                }
            }
        }

        Logger.info('loop trough ' + respJobs.Jobs.length + ' returned Jobs.');

        for (let i = 0; i < respJobs.Jobs.length; i++) {
            let job = respJobs.Jobs[i];

            Logger.info('JobID ' + job.JobID);
            if (job.JobTypeName === 'eCom Copy - New') {
                let modifiedAfter = new Date();
                modifiedAfter.setHours(modifiedAfter.getHours() + (+jobParams.TimeZone));
                modifiedAfter.setHours(modifiedAfter.getHours() - jobParams.TimeOffset);
                modifiedAfter = modifiedAfter.getFullYear() + '-'
                + (modifiedAfter.getMonth() <= 9 ? 0 : '') + (modifiedAfter.getMonth() + 1) + '-'
                + (modifiedAfter.getDate() <= 9 ? 0 : '') + modifiedAfter.getDate() + 'T'
                + (modifiedAfter.getHours() <= 9 ? 0 : '') + modifiedAfter.getHours() + ':'
                + (modifiedAfter.getMinutes() <= 9 ? 0 : '') + modifiedAfter.getMinutes();

                Logger.info('modifiedAfter ' + modifiedAfter);

                let respCopies = service.call({
                    endpoint: 'copy',
                    params: {
                        jobID: job.JobID,
                        modifiedAfter: modifiedAfter
                    }
                });
                let currentModel;
                let customAttributes = [];
                let complexAttributes = [];

                if (respCopies && respCopies.Copies && respCopies.Copies.length) {
                    Logger.info('respCopies.Copies.length ' + respCopies.Copies.length);

                    respCopies.Copies.sort(function (c1, c2) {
                        var modelIDCriteria = (+c1.ModelID) - (+c2.ModelID);
                        if (modelIDCriteria) {
                            return modelIDCriteria;
                        }
                        var c1Name = c1.CopyName.replace(/ /g, '-').replace(/[^\w-]+/g, '').toLowerCase();
                        if (!orderMap[c1Name]) {
                            orderMap[c1Name] = ATTRIBUTE_ORDER.length;
                        }
                        let c2Name = c2.CopyName.replace(/ /g, '-').replace(/[^\w-]+/g, '').toLowerCase();
                        if (!orderMap[c2Name]) {
                            orderMap[c2Name] = ATTRIBUTE_ORDER.length;
                        }
                        return orderMap[c1Name] - orderMap[c2Name];
                    });

                    for (let j = 0; j < respCopies.Copies.length; j++) {
                        let continueWithNext = false;

                        let copy = respCopies.Copies[j];
                        Logger.warn('i:' + j);
                        Logger.warn('respCopies.Copies.length:' + respCopies.Copies.length);
                        xmlWriter = getXmlWriter(jobParams.FilePath, jobParams.CatalogID, job.JobID);

                        if (!currentModel || currentModel.ModelID !== copy.ModelID) {
                            if (currentModel) {
                                writeComplexAttributes(xmlWriter, complexAttributes, customAttributes, currentModel.ModelID, job.JobID);
                                complexAttributes = {};
                                writeCustomAttributes(xmlWriter, customAttributes);
                                customAttributes = [];
                                xmlWriter.writeEndElement();
                                map = JSON.parse(require('dw/system/System').getPreferences().getCustom().talkootMap);
                            }
                            currentModel = getModel(copy.ModelID);
                            if (!currentModel) {
                                continueWithNext = true;
                            } else {
                                xmlWriter.writeStartElement('product');
                                xmlWriter.writeAttribute('product-id', currentModel.ModelNumber);
                            }
                        }

                        if (!continueWithNext) {
                            let copyName = copy.CopyName.replace(/ /g, '-').replace(/[^\w-]+/g, '').toLowerCase();
                            let copyConfig = map[copyName];
                            if (!map[copyName]) {
                                let complexAttrKey = complexMapKeys.join('|').match(
                                    new RegExp('(?:^|\\|)((?:[\\w\\-]+\\,)*' + copyName.replace(/-/g, '\\-') + '(?:\\,[\\w\\-]+)*)(?:\\||$)')
                                );
                                complexAttrKey = complexAttrKey && complexAttrKey[1];

                                if (complexAttrKey) {
                                    let complexAttrConfig = map[complexAttrKey];
                                    complexAttributes[complexAttrKey] = complexAttributes[complexAttrConfig.attrID] || complexAttrConfig;

                                    if (complexAttrConfig.localized) {
                                        complexAttributes[complexAttrKey].locale = locales[job.LocaleID] || 'x-default';
                                    }
                                    complexAttributes[complexAttrKey].values = complexAttributes[complexAttrKey].values || [];
                                    complexAttributes[complexAttrKey].values[copyName] = copy.CopyValue;
                                }
                            } else if (!copyConfig.isCustom) {
                                xmlWriter.writeStartElement(copyConfig.attrID);
                                if (copyConfig.localized) {
                                    xmlWriter.writeAttribute('xml:lang', locales[job.LocaleID] || 'x-default');
                                }
                                xmlWriter.writeCharacters(copy.CopyValue);
                                xmlWriter.writeEndElement();
                            } else {
                                customAttributes.push({ attrID: copyConfig.attrID, value: copy.CopyValue, locale: (copyConfig.localized ? locales[job.LocaleID] || 'x-default' : null), multiple: copyConfig.multiple });
                            }
                        }
                    }

                    writeComplexAttributes(xmlWriter, complexAttributes, customAttributes, currentModel.ModelID, job.JobID);
                    complexAttributes = [];
                    writeCustomAttributes(xmlWriter, customAttributes);
                    customAttributes = [];
                    if (xmlWriter) {
                        xmlWriter.writeEndElement();
                        xmlWriter.writeEndElement();
                        xmlWriter.close();
                        xmlWriter = null;
                    }
                }
            }
        }
    }
}
;
