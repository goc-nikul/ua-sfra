var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Calendar = require('dw/util/Calendar');
var Transaction = require('dw/system/Transaction');
var UUIDUtils = require('dw/util/UUIDUtils');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var FileWriter = require('dw/io/FileWriter');
var XMLIndentingStreamWriter = require('dw/io/XMLIndentingStreamWriter');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger').getLogger('SDL_translation', 'SDL_translation');

var ArrayList = require('dw/util/ArrayList');
var ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');

/**
 * saveAuthToken - Save SDL auth Token
 * @param {Object} theNewAuthToken - Auth Token object
 */
function saveAuthToken(theNewAuthToken) {
    try {
        Transaction.wrap(function () {
            var object = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
            object.custom.access_token = theNewAuthToken.access_token;
            object.custom.token_type = theNewAuthToken.token_type;
            var secondstoadd = (theNewAuthToken.expires_in) - 1;
            var calendar = new Calendar();
            calendar.add(Calendar.SECOND, secondstoadd);
            object.custom.expiry_date = calendar.getTime();
        });
    } catch (e) {
        Logger.error('Error creating custom object for token ' + e.message);
    }
}

/**
 * getAuthToken - Get SDL auth token if expires
 * @returns {Object} Auth Token
 */
function getAuthToken() {
    try {
        var returnAuthToken = {};
        var objConfig = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
        if (objConfig !== undefined && objConfig !== null) {
            var acctoken = 'access_token' in objConfig.custom && objConfig.custom.access_token ? objConfig.custom.access_token : null;
            if (acctoken !== undefined && acctoken !== null) {
                var expdate = objConfig.custom.expiry_date;
                var thetoday = new Calendar();
                var theExpCalDate = new Calendar(expdate);
                var comparisonnum = thetoday.compareTo(theExpCalDate);
                if (comparisonnum <= 0) {
                    returnAuthToken.access_token = acctoken;
                    returnAuthToken.expiry_date = expdate;
                    returnAuthToken.token_type = objConfig.getCustom().token_type;
                    returnAuthToken.TMSCredentials = objConfig.getCustom().TMSCredentials;
                    returnAuthToken.SiteCatalogs = objConfig.getCustom().SiteCatalogs;
                    returnAuthToken.SiteLibraries = objConfig.getCustom().SiteLibraries;
                    returnAuthToken.IsParentLevelTranslation = objConfig.getCustom().IsParentLevelTranslation;
                    returnAuthToken.languagesMap = objConfig.getCustom().LanguagesMap;
                } else {
                    let sdlConfigurationDetails = objConfig.getCustom().TMSCredentials;
                    if (sdlConfigurationDetails !== undefined && sdlConfigurationDetails !== null && sdlConfigurationDetails !== '') {
                        let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                        let service = ServiceMgr.tMSPost();
                        service.setRequestMethod('POST');
                        service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/auth/token';
                        service.addHeader('Content-Type', 'application/x-www-form-urlencoded');
                        let bodyStr = 'grant_type=' + sdlConfiguration.grant_type + '&username=' + sdlConfiguration.username + '&password=' + sdlConfiguration.password + '&client_id=' + sdlConfiguration.clientID + '&client_secret=' + sdlConfiguration.clientSecret;
                        let result = service.call(bodyStr);
                        if (empty(result.errorMessage)) {
                            let authToken = JSON.parse(result.object);
                            returnAuthToken.access_token = authToken.access_token;
                            returnAuthToken.token_type = authToken.token_type;
                            returnAuthToken.expiry_date = authToken.expires_in;
                            returnAuthToken.TMSCredentials = objConfig.getCustom().TMSCredentials;
                            returnAuthToken.SiteCatalogs = objConfig.getCustom().SiteCatalogs;
                            returnAuthToken.SiteLibraries = objConfig.getCustom().SiteLibraries;
                            returnAuthToken.IsParentLevelTranslation = objConfig.getCustom().IsParentLevelTranslation;
                            returnAuthToken.languagesMap = objConfig.getCustom().LanguagesMap;
                            saveAuthToken(authToken);
                        } else {
                            throw new Error('There was an Error while Auth Service call:  ' + result.errorMessage);
                        }
                    } else {
                        throw new Error('SDL Configuration is missing. Please configure it at Configuration View.');
                    }
                }
            } else {
                let sdlConfigurationDetails = objConfig.getCustom().TMSCredentials;
                if (sdlConfigurationDetails !== undefined && sdlConfigurationDetails !== null && sdlConfigurationDetails !== '') {
                    let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                    let service = ServiceMgr.tMSPost();
                    service.setRequestMethod('POST');
                    service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/auth/token';
                    service.addHeader('Content-Type', 'application/x-www-form-urlencoded');
                    let bodyStr = 'grant_type=' + sdlConfiguration.grant_type + '&username=' + sdlConfiguration.username + '&password=' + sdlConfiguration.password + '&client_id=' + sdlConfiguration.clientID + '&client_secret=' + sdlConfiguration.clientSecret;
                    let result = service.call(bodyStr);
                    if (empty(result.errorMessage)) {
                        let authToken = JSON.parse(result.object);
                        returnAuthToken.access_token = authToken.access_token;
                        returnAuthToken.token_type = authToken.token_type;
                        returnAuthToken.expiry_date = authToken.expires_in;
                        returnAuthToken.TMSCredentials = objConfig.getCustom().TMSCredentials;
                        returnAuthToken.SiteCatalogs = objConfig.getCustom().SiteCatalogs;
                        returnAuthToken.SiteLibraries = objConfig.getCustom().SiteLibraries;
                        saveAuthToken(authToken);
                    } else {
                        throw new Error('There was an Error while Auth Service call: ' + result.errorMessage);
                    }
                } else {
                    throw new Error('SDL Configuration is missing. Please configure it at Configuration View.');
                }
            }
            return returnAuthToken;
        } else { // eslint-disable-line
            throw new Error('SDL Configuration or SDL_Session Custom Object definition is missing. Please create and configure it.');
        }
    } catch (e) {
        Logger.error('Error creating custom object for token ' + e.message);
        return null;
    }
}

/**
 * getSDLSiteLibraries - Get SDL Site Library
 * @returns {Object} SDL Site Library
 */
function getSDLSiteLibraries() {
    var siteLibraries;
    var objConfig = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
    if (objConfig && objConfig.getCustom().SiteLibraries) {
        siteLibraries = JSON.parse(objConfig.getCustom().SiteLibraries);
    }
    return siteLibraries;
}

/**
 * getSDLSiteLibraries - Get SDL Catalog List
 * @returns {Object} SDL Catalog List
 */
 function getSDLCatalogList() {
    var catalogList;
    var objConfig = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
    if (objConfig && objConfig.getCustom().SiteCatalogs) {
        catalogList = JSON.parse(objConfig.getCustom().SiteCatalogs);
    }
    return catalogList;
}

/**
 * getsdlProjectOptions - Get SDL Auth Token
 * @returns {Object} Auth Token service response
 */
function getsdlProjectOptions() {
    var auth = getAuthToken();
    var sdlConfigurationDetails = auth.TMSCredentials;
    var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
    var objToken = auth.access_token;
    var objType = auth.token_type;
    var service = ServiceMgr.tMSGet();
    service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects/options';
    service.addHeader('Authorization', objType + ' ' + objToken);
    service.addHeader('Content-Type', 'application/json');
    var result = service.call();
    return result;
}

/**
 * getTopLevelCategory - Get top lavel category
 * @returns {Array} - List of top category
 */
function getTopLevelCategory() {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var siteCatalog = CatalogMgr.getSiteCatalog();
    var topLavelCats;
    if (siteCatalog) {
        var topLavelSubCat = siteCatalog.getRoot().getSubCategories();
        topLavelCats = topLavelSubCat.toArray().map(function (cat) {
            return {
                ID: cat.ID,
                formattedID: cat.ID.replace(/[^1-9a-zA-Z]/g, '_'),
                displayName: cat.displayName,
                formattedName: escape(cat.displayName)
            };
        });
    }
    return topLavelCats || null;
}

/**
 * fetches all the sublevel categories required for creating the category metadata project SFRA
 * @param {string} catId - category ID
 * @returns {Array} - Category List
 */
function getAllLevelSubCategories(catId) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var categoryList = [];
    categoryList.push(catId);
    var selectedCategory = CatalogMgr.getCategory(catId);
    var subCategories = selectedCategory.getSubCategories();
    if (subCategories.length > 0) {
        var subCategoryIterator = subCategories.iterator();
        while (subCategoryIterator.hasNext()) {
            var eachSubCategory = subCategoryIterator.next();
            var subCategoriesList = getAllLevelSubCategories(eachSubCategory.ID);
            categoryList.push.apply(categoryList, subCategoriesList);
        }
    }
    return categoryList;
}

/**
 * Get the content asset sub folder
 * @param {Array} folders - List of folders
 * @returns {dw.util.ArrayList} all Contents
 */
function getContentFromSubFolders(folders) {
    var contents = new ArrayList();
    try {
        for (let i = 0; i < folders.length; i++) {
            var folder = folders[i];
            var subFolders = folder.getSubFolders();
            if (subFolders.length > 0) {
                contents.addAll(getContentFromSubFolders(subFolders));
            }
            contents.addAll(folder.getContent());
        }
        return contents;
    } catch (e) {
        return contents;
    }
}

/**
 * gets the status text based on the tms statuses
 * @param {Object} status - Project status
 * @returns {string} status
 */
function getProjectStatus(status) {
    if (status !== undefined && status !== null) {
        if (status === 0) {
            return 'Preparing';
        } else if (status === 1) {
            return 'ForApproval';
        } else if (status === 2) {
            return 'InProgress';
        } else if (status === 3) {
            return 'ForDownload';
        } else if (status === 4) {
            return 'Completed';
        } else if (status === 5) {
            return 'PartialDownload';
        }
    }
    return '';
}

/**
 * creates a uuid used as id for custom objects
 * @returns {string} unique ID
 */
function createGuid() {
    var uniqueID = UUIDUtils.createUUID();
    return uniqueID;
}

/**
 * gets the artifact type based on the project type
 * @param {string} projectType - Project Type
 * @returns {string} - Artifact Type
 */
function getArtifactType(projectType) {
    if (projectType !== undefined && projectType !== null && projectType !== '') {
        if (projectType === 'Product') {
            return 'Product';
        } else if (projectType === 'Category Product') {
            return 'Product';
        } else if (projectType === 'Category Project') {
            return 'Category';
        } else if (projectType === 'Content-Asset') {
            return 'Content-Asset';
        } else if (projectType === 'Dictionary') {
            return 'Dictionary';
        } else if (projectType === 'Promotions') {
            return 'Promotions';
        } else if (projectType === 'Campaigns') {
            return 'Campaigns';
        }
    }
    return '';
}

/**
 * creates a directory in the impex folder
 */
function createDirectory() {
    var file = new File(File.IMPEX + '/src/sdlconnector/upload');
    if (!file.isDirectory()) {
        file.mkdirs();
    }
}

/**
 * Delete existing a directory in the impex folder SFRA
 */
function deleteExistingDirectory() {
    var directory = new File(File.IMPEX + '/src/sdlconnector/upload/');
    var folder = directory.listFiles();
    if (folder.length !== 0) {
        for (let i = 0; i < folder.length; i++) {
            folder[i].remove();
        }
    }
}

/**
 * writes the single element tag for xml (example id)
 * @param {dw.io.XMLStreamWriter} writer - XML Writer
 * @param {string} elementName - Element name
 * @param {string} elementValue - Element value
 */
function writeSingleElement(writer, elementName, elementValue) {
    if (elementValue !== undefined && elementValue !== null && elementValue !== '') {
        writer.writeStartElement(elementName);
        writer.writeCharacters(elementValue);
        writer.writeEndElement();
    } else {
        writer.writeEmptyElement(elementName);
    }
}

/**
 * Build Request XML
 * @param {string} artifactID - Artifact ID
 * @param {Object} artifactObj - Artifact Object
 * @returns {string} Request XML string
 */
function buildXMLString(artifactID, artifactObj) {
    try {
        var calendar = new Calendar();
        var localfilename = 'SDL_TRANSLATE_' + StringUtils.formatCalendar(calendar, 'yyyy-MM-dd HH:mm:ss.SSS z') + '.xml';
        var customerOut = new File(File.IMPEX + '/src/sdlconnector/upload/' + localfilename);
        var swriter = new FileWriter(customerOut);
        var writer = new XMLIndentingStreamWriter(swriter);
        writer.writeStartDocument();
        writer.writeStartElement('articles');
        writer.writeStartElement('article');
        writeSingleElement(writer, 'id', artifactID);
        writer.writeStartElement('fields');
        Object.keys(artifactObj).forEach(function (key) {
            if (artifactObj[key] !== undefined && artifactObj[key] !== null && artifactObj[key] !== '') {
                writer.writeStartElement('field');
                writer.writeAttribute('name', key);
                writer.writeAttribute('translatable', 'true');
                writer.writeCData(artifactObj[key]);
                writer.writeEndElement();
            }
        });
        writer.writeEndElement();
        writer.writeEndElement();
        writer.writeEndElement();
        writer.writeEndDocument();
        writer.flush();
        writer.close();
        var fileReader = new FileReader(customerOut, 'UTF-8');
        var fileString = fileReader.readString();
        return fileString;
    } catch (e) {
        Logger.error('There was an error while executing buildXMLString function for generating request string. : ' + e.message);
        return null;
    }
}

/**
 * Upload project file to TMS
 * @param {Object} args - Argument
 * @returns {string} TMS upload response
 */
function uploadFileToTMS(args) {
    try {
        var token = args.access_token;
        var type = args.token_type;
        var xmlstr = args.xmlstr;
        var baseUrl = args.Base_url;
        var joboption = args.joboption;
        var service = ServiceMgr.tMSPost();
        service.URL = baseUrl + '/tm4lc/api/v1/files/' + joboption;
        service.addHeader('Content-Type', 'multipart/form-data; boundary=564d7ba0-7e84-4d26-996f-8b347767dd1c');
        service.addHeader('Accept-Encoding', 'gzip, deflate');
        service.addHeader('Authorization', type + ' ' + token);
        service.addHeader('Accept', 'application/json');
        var boundry = '--564d7ba0-7e84-4d26-996f-8b347767dd1c';
        var atName = args.xmlname;
        var bodyData = '';
        bodyData = bodyData + '\r\n' + boundry;
        bodyData += '\r\nContent-Type: applicatiom/xml';
        bodyData += '\r\nContent-Disposition: form-data; name=file; filename="' + atName + '"; filename*=utf-8\'\'' + atName + '\r\n\r\n';
        bodyData += xmlstr + '\r\n';
        bodyData += boundry + '--';
        var result = service.call(bodyData);
        if (empty(result.errorMessage)) {
            var fileResponse = JSON.parse(result.object);
            return fileResponse[0];
        }
        return '';
    } catch (e) {
        Logger.error('There was an Error while Uploading file to TMS in sdlHelper.js : ' + e.message);
    }
    return null;
}

/**
 * Upload project Properties file to TMS
 * @param {Object} args - Argument
 * @returns {string} TMS upload response
 */
function uploadPropertiesFileFileToTMS(args) {
    try {
        var token = args.access_token;
        var type = args.token_type;
        var propertiesStr = args.propertiesStr;
        var baseUrl = args.Base_url;
        var joboption = args.joboption;
        var service = ServiceMgr.tMSPost();
        service.URL = baseUrl + '/tm4lc/api/v1/files/' + joboption;
        service.addHeader('Content-Type', 'multipart/form-data; boundary=564d7ba0-7e84-4d26-996f-8b347767dd1c');
        service.addHeader('Accept-Encoding', 'gzip, deflate');
        service.addHeader('Authorization', type + ' ' + token);
        service.addHeader('Accept', 'application/json');
        var boundry = '--564d7ba0-7e84-4d26-996f-8b347767dd1c';
        var atName = args.propertiesName;
        var bodyData = '';
        bodyData += '\r\n' + boundry;
        bodyData += '\r\nContent-Type: text/plain';
        bodyData += '\r\nContent-Disposition: form-data; name=file; filename="' + atName + '"; filename*=utf-8\'\'' + atName + '\r\n\r\n';
        bodyData += propertiesStr + '\r\n';
        bodyData += boundry + '--';
        var result = service.call(bodyData);
        if (empty(result.errorMessage)) {
            var fileResponse = JSON.parse(result.object);
            return fileResponse[0];
        }
        return '';
    } catch (e) {
        Logger.error('There was an Error while Uploading properties file to TMS in sdlHelper.js : ' + e.message);
    }
    return null;
}

/**
 * Create XML file
 * @param {*} type - Project Type
 * @param {*} fileName - File name
 * @returns {dw.io.File} XML File
 */
function createFile(type, fileName) {
    try {
        var file = new File(File.IMPEX + File.SEPARATOR + 'sdlTMS' + File.SEPARATOR + type + File.SEPARATOR + 'upload' + File.SEPARATOR);
        if (!file.isDirectory()) {
            file.mkdirs();
        }
        file = new File(File.IMPEX + File.SEPARATOR + 'sdlTMS' + File.SEPARATOR + type + File.SEPARATOR + 'upload' + File.SEPARATOR + fileName);
        if (file.exists()) {
            file.remove();
        }
        return file;
    } catch (e) {
        Logger.error('There was an error while creating the file with file name' + fileName + '. : ' + e.message);
    }
    return null;
}

/**
 * Get Language Mapping
 * @param {string} languagesMap - Language Mapping
 * @returns {Object} - Language Mapping object
 */
function getLanguagesMap(languagesMap) {
    try {
        var langObj = JSON.parse(languagesMap);
        var returnMap = {};
        for (var name in langObj) { // eslint-disable-line
            var attributeValue = langObj[name]; // eslint-disable-line
            returnMap[attributeValue] = name; // eslint-disable-line
        }
        return returnMap;
    } catch (e) {
        Logger.error('There was an error while calculating the Language Map. : ' + e.message);
    }
    return null;
}

/**
 * Replace XML Character
 * @param {string} data - XML String
 * @returns {string} XML string
 */
function replaceXMLChar(data) {
    var originalData = data;
    try {
        // Replace Just five: &lt; (<), &amp; (&), &gt; (>), &quot; ("), and &apos; (')
        originalData = originalData.replace(/&lt;/g, '<');
        originalData = originalData.replace(/&amp;/g, '&');
        originalData = originalData.replace(/&gt;/g, '>');
        originalData = originalData.replace(/&quot;/g, '"');
        originalData = originalData.replace(/&apos;/g, "'");
    } catch (e) {
        Logger.error('There was an error while replacing the special char. : ' + e.message + originalData);
    }
    return originalData;
}

/**
 * Replace escape character
 * @param {string} xmlString - XML string
 * @returns {string} XML string
 */
function replaceXMLEscapeChar(xmlString) { // eslint-disable-line
    var data = xmlString;
    try {
        // Replace to Just five: &lt; (<), &amp; (&), &gt; (>), &quot; ("), and &apos; (')
        data = data.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    } catch (e) {
        Logger.error('There was an error while replacing the special char. : ' + e.message + data);
    }
    return data;
}

/**
 * Write Attribute key and value to xml
 * @param {dw.io.XMLStreamWriter} xsw - XML writer
 * @param {string} attributeId - Attribute ID
 * @param {string} locale - Locale
 * @param {string} attributesValue - Attribute value
 */
function addXMLAttribute(xsw, attributeId, locale, attributesValue) {
    try {
        xsw.writeStartElement(attributeId);
        xsw.writeAttribute('xml:lang', locale);
        xsw.writeCharacters(attributesValue);
        xsw.writeEndElement();
    } catch (e) {
        Logger.error('There was an error while adding attribute to XML. : ' + e.message);
    }
}

/**
 * Write set of Attribute key and value to xml
 * @param {dw.io.XMLStreamWriter} xsw - XML writer
 * @param {string} attributeId - Attribute ID
 * @param {string} locale - Locale
 * @param {string} attributesValueArg - Attribute value
 */
function addXMLCustomSetOfAttribute(xsw, attributeId, locale, attributesValueArg) {
    try {
        var attributesValue = attributesValueArg;
        attributesValue = attributesValue.split(';');
        xsw.writeStartElement('custom-attribute');
        xsw.writeAttribute('xml:lang', locale);
        xsw.writeAttribute('attribute-id', attributeId);
        for (var i = 0; i < attributesValue.length; i++) {
            var value = attributesValue[i];
            xsw.writeStartElement('value');
            xsw.writeCData(value);
            xsw.writeEndElement();
        }
        xsw.writeEndElement();
    } catch (e) {
        Logger.error('There was an error while adding attribute ID to  XML. : ' + e.message);
    }
}

/**
 * Write custom Attribute key and value to xml
 * @param {dw.io.XMLStreamWriter} xsw - XML writer
 * @param {string} attributeId - Attribute ID
 * @param {string} locale - Locale
 * @param {string} attributesValue - Attribute value
 */
function addXMLCustomAttribute(xsw, attributeId, locale, attributesValue) {
    try {
        xsw.writeStartElement('custom-attribute');
        xsw.writeAttribute('xml:lang', locale);
        xsw.writeAttribute('attribute-id', attributeId);
        xsw.writeCData(attributesValue);
        xsw.writeEndElement();
    } catch (e) {
        Logger.error('There was an error while adding attribute ID to  XML. : ' + e.message);
    }
}

/**
 * Get SDL Locales
 * @returns {string} SDL Lacales mapping
 */
function getLocales() {
    var SDLLanguageMapping = require('*/cartridge/config/SDLLanguagesMapping');
    return JSON.stringify(SDLLanguageMapping);
}

/**
 * get SDL session configuration
 * @returns {Object} config object
 */
function getSDLConfiguration() {
    var SystemObjectMgr = require('dw/object/SystemObjectMgr');
    var config = {};
    var SDLGLobalSession = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
    if (!SDLGLobalSession) {
        SDLGLobalSession = CustomObjectMgr.createCustomObject('SDL_Session', 'SDLTMSCredentials');
    }
    config.token_type = 'token_type' in SDLGLobalSession.custom && !empty(SDLGLobalSession.custom.token_type)
    ? SDLGLobalSession.custom.token_type
    : null;

    config.TMSCredentials = 'TMSCredentials' in SDLGLobalSession.custom && !empty(SDLGLobalSession.custom.TMSCredentials)
    ? SDLGLobalSession.custom.TMSCredentials
    : null;

    config.SiteCatalogs = 'SiteCatalogs' in SDLGLobalSession.custom && !empty(SDLGLobalSession.custom.SiteCatalogs)
    ? SDLGLobalSession.custom.SiteCatalogs
    : null;

    config.SiteLibraries = 'SiteLibraries' in SDLGLobalSession.custom && !empty(SDLGLobalSession.custom.SiteLibraries)
    ? SDLGLobalSession.custom.SiteLibraries
    : null;

    config.IsParentLevelTranslation = 'IsParentLevelTranslation' in SDLGLobalSession.custom && !empty(SDLGLobalSession.custom.IsParentLevelTranslation)
    ? SDLGLobalSession.custom.IsParentLevelTranslation
    : null;

    config.translatableProductAttributes = 'translatableProductAttributes' in SDLGLobalSession.custom && !empty(SDLGLobalSession.custom.translatableProductAttributes)
    ? SDLGLobalSession.custom.translatableProductAttributes
    : null;

    config.translatableContentAttributes = 'translatableContentAttributes' in SDLGLobalSession.custom && !empty(SDLGLobalSession.custom.translatableContentAttributes)
    ? SDLGLobalSession.custom.translatableContentAttributes
    : null;

    config.translatablePromotionAttributes = 'translatablePromotionAttributes' in SDLGLobalSession.custom && !empty(SDLGLobalSession.custom.translatablePromotionAttributes)
    ? SDLGLobalSession.custom.translatablePromotionAttributes
    : null;

    config.translatableCampAttributes = 'translatableCampaignAttributes' in SDLGLobalSession.custom && !empty(SDLGLobalSession.custom.translatableCampaignAttributes)
    ? SDLGLobalSession.custom.translatableCampaignAttributes
    : null;

    var languagesMap = 'LanguagesMap' in SDLGLobalSession.custom && !empty(SDLGLobalSession.custom.LanguagesMap)
    ? SDLGLobalSession.custom.LanguagesMap
    : null;

    if (languagesMap) {
        config.languagesMap = JSON.parse(languagesMap);
    }
    var localesString = getLocales();
    config.localesString = JSON.parse(localesString);
    try {
        var siteCatIds = '';
        var siteCat = [];
        if (JSON.parse(config.SiteCatalogs) !== null) {
            siteCat = JSON.parse(config.SiteCatalogs).catalogIDs;
            for (let i = 0; i < siteCat.length; i++) {
                if (siteCat.length === i + 1) {
                    siteCatIds += siteCat[i];
                } else {
                    siteCatIds += siteCat[i] + ',';
                }
            }
        }
        config.SiteCatalogs = siteCatIds;
    } catch (error) {
        Logger.error('Error While fetching the site catalogs ID in the configuration Object ' + error.stack);
    }

    try {
        var siteLib = [];
        var siteLibIds = '';
        if (JSON.parse(config.SiteLibraries) !== null) {
            siteLib = JSON.parse(config.SiteLibraries).libraryIDs;
            for (let i = 0; i < siteLib.length; i++) {
                if (siteLib.length === i + 1) {
                    siteLibIds += siteLib[i];
                } else {
                    siteLibIds += siteLib[i] + ',';
                }
            }
        }
        config.SiteLibraries = siteLibIds;
    } catch (error) {
        Logger.error('Error While fetching the site Libraries in the configuration Object ' + error.stack);
    }

    // Product Availabele Attribute
    var savedTranslatabeProdAttr = new ArrayList();
    if (config.translatableProductAttributes !== null) {
        var translatableProductAttributes = JSON.parse(config.translatableProductAttributes);
        for (let j = 0; j < translatableProductAttributes.length; j++) {
            var selectedProdAttr = translatableProductAttributes[j];
            savedTranslatabeProdAttr.add(selectedProdAttr.id);
        }
    }

    var allowedAttributeType = new ArrayList(Site.current.preferences.custom.allowedAttributeType);
    var productObjDefinition = SystemObjectMgr.describe('Product');
    var availableAttributeForProduct = new ArrayList();
    var attributeDefinitions = productObjDefinition.attributeDefinitions;
    for (let i = 0; i < attributeDefinitions.length; i++) {
        var prodAttr = attributeDefinitions[i];
        if (allowedAttributeType.contains(prodAttr.valueTypeCode.toFixed()) && !savedTranslatabeProdAttr.contains(prodAttr.ID)) {
            availableAttributeForProduct.add(prodAttr);
        }
    }
    config.AvailableAttributeForProduct = availableAttributeForProduct;

    // Content Availabele Attribute
    var savedTranslatabeContentAttr = new ArrayList();
    if (JSON.parse(config.translatableContentAttributes) !== null) {
        var translatableContentAttributes = JSON.parse(config.translatableContentAttributes);
        for (let j = 0; j < translatableContentAttributes.length; j++) {
            var selectedContentAttr = translatableContentAttributes[j];
            savedTranslatabeContentAttr.add(selectedContentAttr.id);
        }
    }
    var contentObjDefinition = SystemObjectMgr.describe('Content');
    var availableAttributeForContent = new ArrayList();
    var conAttributeDefinitions = contentObjDefinition.attributeDefinitions;
    for (let i = 0; i < conAttributeDefinitions.length; i++) {
        var conAttr = conAttributeDefinitions[i];
        if (allowedAttributeType.contains(conAttr.valueTypeCode.toFixed()) && !savedTranslatabeContentAttr.contains(conAttr.ID)) {
            availableAttributeForContent.add(conAttr);
        }
    }
    config.AvailableAttributeForContent = availableAttributeForContent;

    // Promotion Available Attribute
    var savedTranslatabePromotionsAttr = new ArrayList();
    if (JSON.parse(config.translatablePromotionAttributes) !== null) {
        var translatablePromotionAttributes = JSON.parse(config.translatablePromotionAttributes);
        for (let j = 0; j < translatablePromotionAttributes.length; j++) {
            var selectedPromoAttr = translatablePromotionAttributes[j];
            savedTranslatabePromotionsAttr.add(selectedPromoAttr.id);
        }
    }

    var promotionObjDefinition = SystemObjectMgr.describe('Promotion');
    var availableAttributeForPromotion = new ArrayList();
    var proAttributeDefinitions = promotionObjDefinition.attributeDefinitions;
    for (let i = 0; i < proAttributeDefinitions.length; i++) {
        var promoAttr = proAttributeDefinitions[i];
        if (allowedAttributeType.contains(promoAttr.valueTypeCode.toFixed()) && !savedTranslatabePromotionsAttr.contains(promoAttr.ID)) {
            availableAttributeForPromotion.add(promoAttr);
        }
    }
    config.AvailableAttributeForPromotion = availableAttributeForPromotion;

    // Campaign Available Attribute
    var savedTranslatabeCampaignAttr = new ArrayList();
    if (JSON.parse(config.translatableCampAttributes) !== null) {
        var translatableCampAttributes = JSON.parse(config.translatableCampAttributes);
        for (let j = 0; j < translatableCampAttributes.length; j++) {
            var selectedCampAttr = translatableCampAttributes[j];
            savedTranslatabeCampaignAttr.add(selectedCampAttr.id);
        }
    }
    var campaignObjDefinition = SystemObjectMgr.describe('Campaign');
    var availableAttributeForCampaign = new ArrayList();
    var camAttributeDefinitions = campaignObjDefinition.attributeDefinitions;
    for (let i = 0; i < camAttributeDefinitions.length; i++) {
        var camAttr = camAttributeDefinitions[i];
        if (allowedAttributeType.contains(camAttr.valueTypeCode.toFixed()) && !savedTranslatabeCampaignAttr.contains(camAttr.ID)) {
            availableAttributeForCampaign.add(camAttr);
        }
    }
    config.AvailableAttributeForCampaign = availableAttributeForCampaign;

    return config;
}

/**
 * approves the specified project in the tms server
 * @param {string} approveID - Approval ID
 * @returns {Object} - return response
 */
function approveFunc(approveID) {
    var errorText;
    try {
        var auth = getAuthToken();
        var jsonString = {};
        var sdlConfigurationDetails = auth.TMSCredentials;
        var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
        var objToken = auth.access_token;
        var objType = auth.token_type;
        var service = ServiceMgr.tMSPost();
        service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects/' + approveID;
        service.addHeader('Authorization', objType + ' ' + objToken);
        service.addHeader('Content-Type', 'application/json');
        var result = service.call(jsonString);
        if (empty(result.errorMessage)) {
            return { id: 1, msg: '' };
        }
        errorText = 'Please verify your credential or contact Administrator';
        return { id: 2, msg: errorText };
    } catch (e) {
        errorText = 'Please verify your credential or contact Administrator';
        return { id: 2, msg: errorText };
    }
}

/**
 * rejects the specified project in the tms server
 * @param {string} rejectID - Reject ID
 * @returns {Object} - return response
 */
function rejectFunc(rejectID) {
    try {
        var auth = getAuthToken();
        var jsonString = {};
        var sdlConfigurationDetails = auth.TMSCredentials;
        var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
        var objToken = auth.access_token;
        var objType = auth.token_type;
        var service = ServiceMgr.tMSDelete();
        service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects/' + rejectID;
        service.addHeader('Authorization', objType + ' ' + objToken);
        service.addHeader('Content-Type', 'application/json');
        var result = service.call(jsonString);
        if (empty(result.errorMessage)) {
            try {
                var projQueryString = 'custom.TMSProjectID = "' + rejectID + '"';
                var objProject = CustomObjectMgr.queryCustomObject('Project', projQueryString, null);
                if (!empty(objProject)) {
                    Transaction.wrap(function() { // eslint-disable-line
                        CustomObjectMgr.remove(objProject);
                    });
                }
                var transHistoryQueryString = 'custom.ProjectID = "' + rejectID + '"';
                var objTransHistoryItr = CustomObjectMgr.queryCustomObjects('TranslationHistory', transHistoryQueryString, null);
                while (objTransHistoryItr.hasNext()) {
                    var FileID = objTransHistoryItr.next().getCustom().FileID;
                    Transaction.wrap(function() { // eslint-disable-line
                        var objTransHistory = CustomObjectMgr.getCustomObject('TranslationHistory', FileID);
                        if (!empty(objTransHistory)) {
                            CustomObjectMgr.remove(objTransHistory);
                        }
                    });
                }
                objTransHistoryItr.close();
                return { id: 1, msg: '' };
            } catch (e) {
                return { id: 2, msg: e };
            }
        }
        return { id: 2, msg: result.errorMessage };
    } catch (e) {
        var errorText = 'Please verify your credential or contact Administrator';
        return { id: 2, msg: errorText };
    }
}

/**
 * marks the project as auto download in the SFCC
 * @param {string} downloadID - Download Id
 * @returns {Object} - return response
 */
function downloadFunc(downloadID) {
    var projQueryString = 'custom.TMSProjectID = "' + downloadID + '" and custom.IsAutoDownload = false';
    var objProject = CustomObjectMgr.queryCustomObject('Project', projQueryString, null);
    try {
        if (!empty(objProject)) {
            var PID = objProject.getCustom().ProjectID;
            Transaction.wrap(function() { // eslint-disable-line
                var pidObjProject = CustomObjectMgr.getCustomObject('Project', PID);
                if (!empty(pidObjProject)) {
                    pidObjProject.custom.IsAutoDownload = true;
                }
            });
        }
        var transHistoryQueryString = 'custom.ProjectID = "' + downloadID + '" and custom.IsAutoDownload = false';
        var objTransHistoryItr = CustomObjectMgr.queryCustomObjects('TranslationHistory', transHistoryQueryString, null);
        while (objTransHistoryItr.hasNext()) {
            var FileID = objTransHistoryItr.next().getCustom().FileID;
            Transaction.wrap(function() { // eslint-disable-line
                var objTransHistory = CustomObjectMgr.getCustomObject('TranslationHistory', FileID);
                if (!empty(objTransHistory)) {
                    objTransHistory.custom.IsAutoDownload = true;
                }
            });
        }
        objTransHistoryItr.close();
        return { id: 1, msg: '' };
    } catch (e) {
        return { id: 2, msg: e };
    }
}

/**
 * Format date string
 * @param {string} formatDateOriginal - date
 * @returns {string} Formatted date string
 */
function formatDate(formatDateOriginal) {
    if (formatDateOriginal.slice(formatDateOriginal.lastIndexOf('.') + 1, formatDateOriginal.indexOf('Z')).length === 2) {
        return formatDateOriginal.slice(0, formatDateOriginal.indexOf('Z')) + '0Z';
    } else if (formatDateOriginal.slice(formatDateOriginal.lastIndexOf('.') + 1, formatDateOriginal.indexOf('Z')).length === 1) {
        return formatDateOriginal.slice(0, formatDateOriginal.indexOf('Z')) + '00Z';
    } else if (formatDateOriginal.indexOf('.') === -1) {
        return formatDateOriginal.slice(0, formatDateOriginal.indexOf('Z')) + '.000Z';
    }
    return formatDateOriginal;
}

/**
 * formats the date string as per the sdl format
 * @returns {Array} List of months
 */
function getMonths() {
    return [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];
}

/**
 * pad valud with 0
 * @param {string} value - value to pad
 * @returns {string} padded value
 */
function padValue(value) {
    return (value < 10) ? '0' + value : value;
}
function processCategoryProducts(category, productsArray) {
    var categories = category.getSubCategories().iterator();
    productsArray = updateProductArray(category, productsArray);
    while (categories.hasNext()) {
        var category = categories.next();
        productsArray = processCategoryProducts(category, productsArray);
    }
    return productsArray;
}

function updateProductArray(category, productsArray) {
    var products = category.getProducts().iterator();
    while (products.hasNext()) {
        var productID = products.next().ID;
        if (productsArray.indexOf(productID) < 0) {
            productsArray.push(productID)
        }
    }
    return productsArray;
}

function selectedCategoryProducts(category, productList) {
    var categories = category.getSubCategories().iterator();
    productList = categoryProductArray(category, productList);
    while (categories.hasNext()) {
        var category = categories.next();
        productList = selectedCategoryProducts(category, productList);
    }
    return productList;
}

function categoryProductArray(category, productList) {
    var products = category.getProducts().iterator();
    while (products.hasNext()) {
        var product = products.next();
        if (productList.indexOf(product) < 0) {
            productList.push(product)
        }
    }
    return productList;
}


module.exports = {
    getAuthToken: getAuthToken,
    saveAuthToken: saveAuthToken,
    getProjectStatus: getProjectStatus,
    createGuid: createGuid,
    getArtifactType: getArtifactType,
    createDirectory: createDirectory,
    deleteExistingDirectory: deleteExistingDirectory,
    buildXMLString: buildXMLString,
    uploadFileToTMS: uploadFileToTMS,
    writeSingleElement: writeSingleElement,
    createFile: createFile,
    getLanguagesMap: getLanguagesMap,
    replaceXMLChar: replaceXMLChar,
    addXMLAttribute: addXMLAttribute,
    addXMLCustomSetOfAttribute: addXMLCustomSetOfAttribute,
    addXMLCustomAttribute: addXMLCustomAttribute,
    getLocales: getLocales,
    getSDLConfiguration: getSDLConfiguration,
    getsdlProjectOptions: getsdlProjectOptions,
    getTopLevelCategory: getTopLevelCategory,
    getAllLevelSubCategories: getAllLevelSubCategories,
    getContentFromSubFolders: getContentFromSubFolders,
    uploadPropertiesFileFileToTMS: uploadPropertiesFileFileToTMS,
    approveFunc: approveFunc,
    rejectFunc: rejectFunc,
    downloadFunc: downloadFunc,
    formatDate: formatDate,
    getMonths: getMonths,
    padValue: padValue,
    getSDLSiteLibraries: getSDLSiteLibraries,
    getSDLCatalogList: getSDLCatalogList,
    processCategoryProducts: processCategoryProducts,
    updateProductArray: updateProductArray,
    selectedCategoryProducts:selectedCategoryProducts,
    categoryProductArray: categoryProductArray
};
