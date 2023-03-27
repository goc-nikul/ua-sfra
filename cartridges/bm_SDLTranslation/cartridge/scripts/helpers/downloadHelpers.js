/* global XML */
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var ArrayList = require('dw/util/ArrayList');
var HashMap = require('dw/util/HashMap');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamReader = require('dw/io/XMLStreamReader');
var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var Status = require('dw/system/Status');
var StringUtils = require('dw/util/StringUtils');
var Pipelet = require('dw/system/Pipelet');
var Logger = require('dw/system/Logger').getLogger('SDL_translation', 'SDL_translation');
var ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');
var SDLHelpers = require('*/cartridge/scripts/helpers/sdlHelpers');

/**
 * Update Project status
 * @param {Object} status - Status
 * @param {dw.object.CustomObject} projectObject - Project object
 */
function updateProjectPostDownload(status, projectObject) {
    try {
        var objStatus = status.Status;
        if (objStatus.status === 0) {
            var projectID = projectObject.getCustom().ProjectID;
            var TID = projectObject.getCustom().FileID;
            var objectProj = CustomObjectMgr.getCustomObject('TranslationHistory', TID);
            objectProj.custom.Status = 'Completed';
            var projectCompleted = true;
            var queryString = "custom.ProjectID = '" + projectID + "'";
            var objIterator = CustomObjectMgr.queryCustomObjects('TranslationHistory', queryString, null);
            while (objIterator.hasNext()) {
                var translationObj = objIterator.next();
                if (translationObj.custom.Status !== 'Completed') {
                    projectCompleted = false;
                    break;
                }
            }
            objIterator.close();

            if (projectCompleted) {
                var projQueryString = "custom.TMSProjectID = '" + projectID + "'";
                var objProject = CustomObjectMgr.queryCustomObject('Project', projQueryString, null);
                if (!empty(objProject)) {
                    var PID = objProject.getCustom().ProjectID;
                    var pidProject = CustomObjectMgr.getCustomObject('Project', PID);
                    pidProject.custom.ProjectStatus = 'Completed';
                }
            }
        }
    } catch (e) {
        Logger.error('There was an error while updating Project with Project ID - ' + projectObject.getCustom().ProjectID + '. : ' + e.stack);
    }
}

/**
 * Update Project status for properties type
 * @param {Object} status - Status
 * @param {dw.object.CustomObject} projectObject - Project object
 */
function updateDictionaryProjectPostDownload(status, projectObject) {
    try {
        if (status.status === 0) {
            var projectID = projectObject.getCustom().ProjectID;
            var TID = projectObject.getCustom().FileID;
            var objectProj = CustomObjectMgr.getCustomObject('TranslationHistory', TID);
            objectProj.custom.Status = 'Completed';
            var projectCompleted = true;
            var queryString = "custom.ProjectID = '" + projectID + "'";
            var objIterator = CustomObjectMgr.queryCustomObjects('TranslationHistory', queryString, null);
            while (objIterator.hasNext()) {
                var translationObj = objIterator.next();
                if (translationObj.custom.Status !== 'Completed') {
                    projectCompleted = false;
                    break;
                }
            }
            objIterator.close();

            if (projectCompleted) {
                var projQueryString = "custom.TMSProjectID = '" + projectID + "'";
                var objProject = CustomObjectMgr.queryCustomObject('Project', projQueryString, null);
                if (!empty(objProject)) {
                    var PID = objProject.getCustom().ProjectID;
                    var pidProject = CustomObjectMgr.getCustomObject('Project', PID);
                    pidProject.custom.ProjectStatus = 'Completed';
                }
            }
        }
    } catch (e) {
        Logger.error('There was an error while updating the dictionary Project with Project ID - ' + projectObject.getCustom().ProjectID + '. : ' + e.stack);
    }
}

/**
 * Download the product
 * @param {dw.object.CustomObject} eachProject - each product object
 * @param {string} fileString - file string
 * @param {string} catalogID - catalog ID
 * @param {boolean} isParentLevelTranslation - ParentLevel Translation
 * @param {Object} languagesMap - Language Mapping
 */
function downloadProduct(eachProject, fileString, catalogID, isParentLevelTranslation, languagesMap) {
    try {
        var file = SDLHelpers.createFile('product', eachProject.getCustom().ArtifactID + '.xml');
        var fileWriter = new FileWriter(file, 'UTF-8');
        fileWriter.write(fileString);
        fileWriter.flush();
        fileWriter.close();
        var fileReader = new FileReader(file, 'UTF-8');
        var xmlStreamReader = new XMLStreamReader(fileReader);
        var attributesArray = new ArrayList();
        var valuesArray = new ArrayList();
        var attributesMap = new HashMap();
        var productOriginalID;
        while (xmlStreamReader.hasNext()) {
            if (xmlStreamReader.next() === XMLStreamConstants.START_ELEMENT) {
                var localElementName = xmlStreamReader.getLocalName();
                if (localElementName === 'fields') {
                    let myObject = xmlStreamReader.readXMLObject();
                    let xmlString = new XML(myObject);
                    let attributes = xmlString.children().attribute('name');
                    let values = xmlString.children().text();

                    for (let i in attributes) { // eslint-disable-line
                        attributesArray.push(attributes[i]);
                    }
                    for (let j in values) { // eslint-disable-line
                        valuesArray.push(values[j]);
                    }

                    for (let i = 0; i < attributesArray.size(); i++) {
                        attributesMap.put(attributesArray.get(i).toString(), valuesArray.get(i).toString());
                    }
                } else if (localElementName === 'id') {
                    let myObject = xmlStreamReader.readXMLObject();
                    let xmlString = new XML(myObject);
                    let value = xmlString.text();
                    productOriginalID = value.toString();
                }
            }
        }
        xmlStreamReader.close();
        fileReader.close();
        var targetLocale = eachProject.getCustom().TragetLanguageCode;
        if (isParentLevelTranslation) {
            if (languagesMap !== '' && languagesMap !== undefined && languagesMap !== null) {
                var localesMap = SDLHelpers.getLanguagesMap(languagesMap);
                var parentLangCode = localesMap[targetLocale];
                if (parentLangCode !== undefined && parentLangCode !== null && parentLangCode !== '') {
                    targetLocale = parentLangCode;
                }
            }
        }
        file = new File(File.IMPEX + '/src/sdltms/Product/download/');
        if (!file.isDirectory()) {
            file.mkdirs();
        }
        file = new File(File.IMPEX + '/src/sdltms/Product/download/Product_' + eachProject.getCustom().ArtifactID + '_' + catalogID.replace('-', '_') + '_' + targetLocale.replace('-', '_') + '.xml');
        if (file.exists()) {
            file.remove();
        }

        var SDLCredObject = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
        var selectedProdAttr;
        var selectedProdAttrList = new ArrayList();
        if (!empty(SDLCredObject) && !empty(SDLCredObject.custom.translatableProductAttributes)) {
            selectedProdAttr = JSON.parse(SDLCredObject.custom.translatableProductAttributes);
            for (let i = 0; i < selectedProdAttr.length; i++) {
                let prodAttr = selectedProdAttr[i];
                if (!empty(prodAttr.type) && prodAttr.type === 'custom') {
                    selectedProdAttrList.add(prodAttr);
                }
            }
        }

        try {
            if (file.createNewFile()) {
                var exportFileWriter = new FileWriter(file, 'UTF-8');
                exportFileWriter.write('<catalog xmlns="http://www.demandware.com/xml/impex/catalog/2006-10-31" catalog-id="' + StringUtils.stringToXml(catalogID) + '">\n');
                exportFileWriter.write('<header>\n');
                exportFileWriter.write('</header>\n');
                var productID = eachProject.getCustom().ArtifactID;
                if (!empty(productOriginalID)) {
                    productID = productOriginalID;
                }
                var displayName = attributesMap.get('name');
                var shortDescription = attributesMap.get('shortDescription');
                var longDescription = attributesMap.get('longDescription');
                var pageTitle = attributesMap.get('pageTitle');
                var pageDescription = attributesMap.get('pageDescription');
                var pageKeywords = attributesMap.get('pageKeywords');
                var pageURL = attributesMap.get('pageURL');
                if (productID !== undefined && productID !== null && productID !== '') {
                    exportFileWriter.write('<product product-id="' + StringUtils.stringToXml(productID) + '">\n');
                }

                if (displayName !== undefined && displayName !== null && displayName !== '') {
                    exportFileWriter.write('<display-name xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(displayName) + '</display-name>');
                }

                if (shortDescription !== undefined && shortDescription !== null && shortDescription !== '') {
                    exportFileWriter.write('<short-description xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(shortDescription) + '</short-description>');
                }

                if (longDescription !== undefined && longDescription !== null && longDescription !== '') {
                    exportFileWriter.write('<long-description xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(longDescription) + '</long-description>');
                }

                exportFileWriter.write('<page-attributes>');
                if (pageTitle !== undefined && pageTitle !== null && pageTitle !== '') {
                    exportFileWriter.write('<page-title xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(pageTitle) + '</page-title>');
                }

                if (pageDescription !== undefined && pageDescription !== null && pageDescription !== '') {
                    exportFileWriter.write('<page-description xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(pageDescription) + '</page-description>');
                }

                if (pageKeywords !== undefined && pageKeywords !== null && pageKeywords !== '') {
                    exportFileWriter.write('<page-keywords xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(pageKeywords) + '</page-keywords>');
                }

                if (pageURL !== undefined && pageURL !== null && pageURL !== '') {
                    exportFileWriter.write('<page-url xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(pageURL) + '</page-url>');
                }

                exportFileWriter.write('</page-attributes>');

                exportFileWriter.write('<custom-attributes>');

                for (let i = 0; i < selectedProdAttrList.length; i++) {
                    var prodAttr = selectedProdAttrList[i];
                    if (!empty(attributesMap.get(prodAttr.id))) {
                        var attrVal = attributesMap.get(prodAttr.id);
                        if (!empty(prodAttr.typecode) && prodAttr.typecode === '33') { // ENUM Case
                            let splitVale = attrVal.split('^');
                            exportFileWriter.write('<custom-attribute attribute-id="' + prodAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">');
                            for (let j = 0; j < splitVale.length; j++) {
                                exportFileWriter.write('<value>' + splitVale[j] + '</value>');
                            }
                            exportFileWriter.write('</custom-attribute>');
                        } else if (!empty(prodAttr.typecode) && prodAttr.typecode === '23') { // Set of String Case
                            let splitVale = attrVal.split('~');
                            exportFileWriter.write('<custom-attribute attribute-id="' + prodAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">');
                            for (let j = 0; j < splitVale.length; j++) {
                                exportFileWriter.write('<value>' + splitVale[j] + '</value>');
                            }
                            exportFileWriter.write('</custom-attribute>');
                        } else {
                            exportFileWriter.write('<custom-attribute attribute-id="' + prodAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(attributesMap.get(prodAttr.id)) + '</custom-attribute>');
                        }
                    }
                }
                exportFileWriter.write('</custom-attributes>');
                exportFileWriter.write('</product>');
                exportFileWriter.write('</catalog>\n');
                exportFileWriter.close();
            }
        } catch (e) {
            Logger.error('There was an error while Generating the Product Import XML with project ID - ' + eachProject.getCustom().ProjectID + ': ' + e.message);
        }
    } catch (e) {
        Logger.error('There was an error while Downlading the Product Import File with project ID - ' + eachProject.getCustom().ProjectID + ': ' + e.message);
    }
}

/**
 * Download the category
 * @param {dw.object.CustomObject} eachProject - each product object
 * @param {string} fileString - file string
 * @param {string} catalogID - catalog ID
 * @param {boolean} isParentLevelTranslation - ParentLevel Translation
 * @param {Object} languagesMap - Language Mapping
 */
function downloadCategory(eachProject, fileString, catalogID, isParentLevelTranslation, languagesMap) {
    try {
        var file = SDLHelpers.createFile('category', eachProject.getCustom().ArtifactID + '.xml');
        if (file.createNewFile()) {
            var fileWriter = new FileWriter(file, 'UTF-8');
            fileWriter.write(fileString);
            fileWriter.flush();
            fileWriter.close();
            var fileReader = new FileReader(file, 'UTF-8');
            var xmlStreamReader = new XMLStreamReader(fileReader);
            var attributesArray = new ArrayList();
            var valuesArray = new ArrayList();
            var attributesMap = new HashMap();
            var categoryOriginalID;
            while (xmlStreamReader.hasNext()) {
                if (xmlStreamReader.next() === XMLStreamConstants.START_ELEMENT) {
                    var localElementName = xmlStreamReader.getLocalName();
                    if (localElementName === 'fields') {
                        let myObject = xmlStreamReader.readXMLObject();
                        let xmlString = new XML(myObject);
                        var attributes = xmlString.children().attribute('name');
                        var values = xmlString.children().text();

                        for (let i in attributes) { // eslint-disable-line
                            attributesArray.push(attributes[i]);
                        }
                        for (let j in values) { // eslint-disable-line
                            valuesArray.push(values[j]);
                        }
                        for (let i = 0; i < attributesArray.size(); i++) {
                            attributesMap.put(attributesArray.get(i).toString(), valuesArray.get(i).toString());
                        }
                    } else if (localElementName === 'id') {
                        let myObject = xmlStreamReader.readXMLObject();
                        let xmlString = new XML(myObject);
                        var value = xmlString.text();
                        categoryOriginalID = value.toString();
                    }
                }
            }
            xmlStreamReader.close();
            fileReader.close();
            var targetLocale = eachProject.getCustom().TragetLanguageCode;
            if (isParentLevelTranslation) {
                if (!empty(languagesMap) && languagesMap !== '') {
                    var localesMap = SDLHelpers.getLanguagesMap(languagesMap);
                    var parentLangCode = localesMap[targetLocale];
                    if (!empty(parentLangCode) && parentLangCode !== '') {
                        targetLocale = parentLangCode;
                    }
                }
            }
            file = new File(File.IMPEX + '/src/sdltms/Category/download/');
            if (!file.isDirectory()) {
                file.mkdirs();
            }
            file = new File(File.IMPEX + '/src/sdltms/Category/download/Category_' + eachProject.getCustom().ArtifactID + '_' + catalogID.replace('-', '_') + '_' + targetLocale.replace('-', '_') + '.xml');
            if (file.exists()) {
                file.remove();
            }
            try {
                if (file.createNewFile()) {
                    var exportFileWriter = new FileWriter(file, 'UTF-8');
                    exportFileWriter.write('<catalog xmlns="http://www.demandware.com/xml/impex/catalog/2006-10-31" catalog-id="' + StringUtils.stringToXml(catalogID) + '">\n');
                    exportFileWriter.write('<header>\n');
                    exportFileWriter.write('</header>\n');
                    var eachCategoryID = eachProject.getCustom().ArtifactID;
                    if (!empty(categoryOriginalID)) {
                        eachCategoryID = categoryOriginalID;
                    }
                    var eachCategoryName = attributesMap.get('displayName');
                    var eachCategoryDescription = attributesMap.get('description');
                    var eachCategoryPageTitle = attributesMap.get('pageTitle');
                    var eachCategoryPageDescription = attributesMap.get('pageDescription');
                    var eachCategoryPageKeywords = attributesMap.get('pageKeywords');
                    var eachCategoryHeaderMenuBanner = attributesMap.get('headerMenuBanner');
                    if (!empty(eachCategoryID) && eachCategoryID !== '') {
                        exportFileWriter.write('<category category-id="' + StringUtils.stringToXml(eachCategoryID) + '">\n');
                    }

                    if (!empty(eachCategoryName) && eachCategoryName !== '') {
                        exportFileWriter.write('<display-name xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(eachCategoryName) + '</display-name>');
                    }
                    if (!empty(eachCategoryDescription) && eachCategoryDescription !== '') {
                        exportFileWriter.write('<description xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(eachCategoryDescription) + '</description>');
                    }
                    exportFileWriter.write('<page-attributes>');
                    if (!empty(eachCategoryPageTitle) && eachCategoryPageTitle !== '') {
                        exportFileWriter.write('<page-title xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(eachCategoryPageTitle) + '</page-title>');
                    }
                    if (!empty(eachCategoryPageDescription) && eachCategoryPageDescription !== '') {
                        exportFileWriter.write('<page-description xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(eachCategoryPageDescription) + '</page-description>');
                    }
                    if (!empty(eachCategoryPageKeywords) && eachCategoryPageKeywords !== '') {
                        exportFileWriter.write('<page-keywords xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(eachCategoryPageKeywords) + '</page-keywords>');
                    }
                    exportFileWriter.write('</page-attributes>');
                    exportFileWriter.write('<custom-attributes>');
                    if (!empty(eachCategoryHeaderMenuBanner) && eachCategoryHeaderMenuBanner !== '') {
                        exportFileWriter.write('<custom-attribute attribute-id="headerMenuBanner" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(eachCategoryHeaderMenuBanner) + '</custom-attribute>');
                    }
                    exportFileWriter.write('</custom-attributes>');
                    exportFileWriter.write('</category>');
                    exportFileWriter.write('</catalog>\n');
                    exportFileWriter.close();
                }
            } catch (e) {
                Logger.error('There was an error while Generating the Catalog Import XML with project ID - ' + eachProject.getCustom().ProjectID + ': ' + e.stack);
            }
        }
    } catch (e) {
        Logger.error('There was an error while Downlading the Catalog Import File with project ID - ' + eachProject.getCustom().ProjectID + ': ' + e.stack);
    }
}

/**
 * Download the catalog and import it
 * @param {string} catalogIDArg - Catalog ID
 * @param {dw.object.CustomObject} translationObj - translationObj
 * @returns {Object} status
 */
function downloadAndImportCatalog(catalogIDArg, translationObj) {
    try {
        var eachProject = translationObj;
        var catalogID = catalogIDArg;
        var authToken = SDLHelpers.getAuthToken();
        var objToken = authToken.access_token;
        var objType = authToken.token_type;
        var isParentLevelTranslation = authToken.IsParentLevelTranslation;
        var languagesMap = authToken.languagesMap;
        var sdlConfigurationDetails = authToken.TMSCredentials;
        var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
        var service = ServiceMgr.tMSGet();
        var endPoint = sdlConfiguration.Base_url + '/tm4lc/api/v1/files/' + eachProject.getCustom().ProjectID + '/' + eachProject.getCustom().DownloadableFileID;
        service.URL = endPoint;
        service.addHeader('Authorization', objType + ' ' + objToken);
        service.addHeader('Content-Type', 'application/json');
        var result = service.call();
        if (empty(result.errorMessage)) {
            if (eachProject.getCustom().ArtifactType === 'Product') {
                downloadProduct(eachProject, result.object, catalogID, isParentLevelTranslation, languagesMap);
            } else if (eachProject.getCustom().ArtifactType === 'Category') {
                downloadCategory(eachProject, result.object, catalogID, isParentLevelTranslation, languagesMap);
            }
            var itemtype = eachProject.getCustom().ArtifactType;
            var targetLocale = eachProject.getCustom().TragetLanguageCode;
            if (isParentLevelTranslation) {
                if (!empty(languagesMap) && languagesMap !== '') {
                    var localesMap = SDLHelpers.getLanguagesMap(languagesMap);
                    var parentLangCode = localesMap[targetLocale];
                    if (!empty(parentLangCode) && parentLangCode !== '') {
                        targetLocale = parentLangCode;
                    }
                }
            }
            var ImportFile = '/sdltms/' + itemtype + '/download/' + itemtype + '_' + eachProject.getCustom().ArtifactID + '_' + catalogID.replace('-', '_') + '_' + targetLocale.replace('-', '_') + '.xml';
            var importContentStatus;
            try {
                importContentStatus = new Pipelet('ImportCatalog').execute({
                    ImportFile: ImportFile,
                    ImportMode: 'MERGE'
                });
                updateProjectPostDownload(importContentStatus, eachProject);
            } catch (e) {
                Logger.error('There was an error while IMPORT Catalog with project ID - ' + translationObj.getCustom().ProjectID + ': ' + e.message);
                return new Status(Status.ERROR, 'ERROR');
            }
        }
    } catch (e) {
        Logger.error('There was an error while Downloading and IMPORT Catalog with project ID - ' + translationObj.getCustom().ProjectID + ': ' + e.message);
        return new Status(Status.ERROR, 'ERROR');
    }
    return new Status(Status.ERROR, 'OK');
}

/**
 * Download dictionary files
 * @param {dw.object.CustomObject} eachProject - each dictionary object
 * @param {string} fileString - fileString
 * @param {boolean} isParentLevelTranslation - ParentLevel Translation
 * @param {Object} languagesMap - Language Mapping
 * @returns {Object} status
 */
function downloadDictionary(eachProject, fileString, isParentLevelTranslation, languagesMap) {
    try {
        var file = SDLHelpers.createFile('Resource', eachProject.getCustom().ArtifactID + '.properties');
        if (file.createNewFile()) {
            var fileWriter = new FileWriter(file, 'UTF-8');
            fileWriter.write(fileString);
            fileWriter.flush();
            fileWriter.close();
            var targetLocale = eachProject.getCustom().TragetLanguageCode;
            if (isParentLevelTranslation) {
                if (!empty(languagesMap) && languagesMap !== '') {
                    var localesMap = SDLHelpers.getLanguagesMap(languagesMap);
                    var parentLangCode = localesMap[targetLocale];
                    if (!empty(parentLangCode) && parentLangCode !== '') {
                        targetLocale = parentLangCode;
                    }
                }
            }
            file = new File(File.IMPEX + '/src/sdltms/Dictionary/download/');
            if (!file.isDirectory()) {
                file.mkdirs();
            }
            file = new File(File.IMPEX + '/src/sdltms/Dictionary/download/' + eachProject.getCustom().ArtifactID + '_' + targetLocale.replace('-', '_') + '.properties');
            if (file.exists()) {
                file.remove();
            }
            try {
                if (file.createNewFile()) {
                    var exportFileWriter = new FileWriter(file, 'UTF-8');
                    exportFileWriter.write(fileString);
                    exportFileWriter.close();
                }
            } catch (e) {
                Logger.error('There was an error while creating the file with file name for project' + eachProject.getCustom().ProjectID + file.name + '. : ' + e.stack);
                return new Status(Status.ERROR);
            }
        }
    } catch (e) {
        Logger.error('There was an error while Downloading the Dictionary project - ' + eachProject.getCustom().ProjectID + ': ' + e.stack);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

/**
 * Download and import resource bundle
 * @param {dw.object.CustomObject} translationObj - translationObj
 */
function downloadAndImportDictionary(translationObj) {
    try {
        var eachProject = translationObj;
        var authToken = SDLHelpers.getAuthToken();
        var objToken = authToken.access_token;
        var objType = authToken.token_type;
        var isParentLevelTranslation = authToken.IsParentLevelTranslation;
        var languagesMap = authToken.languagesMap;
        var sdlConfigurationDetails = authToken.TMSCredentials;
        var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
        var service = ServiceMgr.tMSGet();
        var endPoint = sdlConfiguration.Base_url + '/tm4lc/api/v1/files/' + eachProject.getCustom().ProjectID + '/' + eachProject.getCustom().DownloadableFileID;
        service.URL = endPoint;
        service.addHeader('Authorization', objType + ' ' + objToken);
        service.addHeader('Content-Type', 'application/json');
        var result = service.call();
        if (empty(result.errorMessage)) {
            var status = downloadDictionary(eachProject, result.object, isParentLevelTranslation, languagesMap);
            updateDictionaryProjectPostDownload(status, eachProject);
        }
    } catch (e) {
        Logger.error('There was an error while Importing the Dictionary project - ' + translationObj.getCustom().ProjectID + ': ' + e.stack);
    }
}

/**
 * Download each content assets
 * @param {dw.object.CustomObject} eachProject - each content object
 * @param {string} fileString - fileString
 * @param {string} libraryID - library ID
 * @param {boolean} isParentLevelTranslation - ParentLevel Translation
 * @param {Object} languagesMap - Language Mapping
 */
function downloadContentAsset(eachProject, fileString, libraryID, isParentLevelTranslation, languagesMap) {
    const PRIVATE_LIBRARY = 'Library';
    try {
        var file = SDLHelpers.createFile('ContentAsset', eachProject.getCustom().ArtifactID + '.xml');
        if (file.createNewFile()) {
            var fileWriter = new FileWriter(file, 'UTF-8');
            fileWriter.write(fileString);
            fileWriter.flush();
            fileWriter.close();
            var fileReader = new FileReader(file, 'UTF-8');
            var xmlStreamReader = new XMLStreamReader(fileReader);
            var attributesArray = new ArrayList();
            var valuesArray = new ArrayList();
            var attributesMap = new HashMap();
            var contentOriginalID;
            while (xmlStreamReader.hasNext()) {
                if (xmlStreamReader.next() === XMLStreamConstants.START_ELEMENT) {
                    var localElementName = xmlStreamReader.getLocalName();
                    if (localElementName === 'fields') {
                        let myObject = xmlStreamReader.readXMLObject();
                        let xmlString = new XML(myObject);
                        var attributes = xmlString.children().attribute('name');
                        var values = xmlString.children().text();
                        for (let i in attributes) { // eslint-disable-line
                            attributesArray.push(attributes[i]);
                        }
                        for (let j in values) { // eslint-disable-line
                            valuesArray.push(values[j]);
                        }
                        for (let i = 0; i < attributesArray.size(); i++) {
                            attributesMap.put(attributesArray.get(i).toString(), valuesArray.get(i).toString());
                        }
                    } else if (localElementName === 'id') {
                        let myObject = xmlStreamReader.readXMLObject();
                        let xmlString = new XML(myObject);
                        var value = xmlString.text();
                        contentOriginalID = value.toString();
                    }
                }
            }
            xmlStreamReader.close();
            fileReader.close();
            var targetLocale = eachProject.getCustom().TragetLanguageCode;
            if (isParentLevelTranslation) {
                if (!empty(languagesMap) && languagesMap !== '') {
                    var localesMap = SDLHelpers.getLanguagesMap(languagesMap);
                    var parentLangCode = localesMap[targetLocale];
                    if (!empty(parentLangCode) && parentLangCode !== '') {
                        targetLocale = parentLangCode;
                    }
                }
            }
            file = new File(File.IMPEX + '/src/sdltms/ContentAsset/download/');
            if (!file.isDirectory()) {
                file.mkdirs();
            }
            file = new File(File.IMPEX + '/src/sdltms/ContentAsset/download/ContentAsset_' + eachProject.getCustom().ArtifactID + '_' + libraryID.replace('-', '_') + '_' + targetLocale.replace('-', '_') + '.xml');
            if (file.exists()) {
                file.remove();
            }
            var SDLCredObject = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
            var selectedContentAttr;
            var selectedContentAttrList = new ArrayList();
            if (!empty(SDLCredObject) && !empty(SDLCredObject.custom.translatableContentAttributes)) {
                selectedContentAttr = JSON.parse(SDLCredObject.custom.translatableContentAttributes);
                for (let i = 0; i < selectedContentAttr.length; i++) {
                    let contentAttr = selectedContentAttr[i];
                    if (!empty(contentAttr.type) && contentAttr.type === 'custom') {
                        selectedContentAttrList.add(contentAttr);
                    }
                }
            }
            try {
                if (file.createNewFile()) {
                    var exportFileWriter = new FileWriter(file, 'UTF-8');
                    if (libraryID === PRIVATE_LIBRARY) {
                        exportFileWriter.write('<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31">\n');
                    } else {
                        exportFileWriter.write('<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="' + StringUtils.stringToXml(libraryID) + '">\n');
                    }

                    var contentAssetID = eachProject.getCustom().ArtifactID;
                    if (!empty(contentOriginalID)) {
                        contentAssetID = contentOriginalID;
                    }
                    var contentAssetName = attributesMap.get('name');
                    var contentAssetDescription = attributesMap.get('description');
                    var contentAssetPageTitle = attributesMap.get('pageTitle');
                    var contentAssetPageDescription = attributesMap.get('pageDescription');
                    var contentAssetPageKeywords = attributesMap.get('pageKeywords');

                    if (!empty(contentAssetID) && contentAssetID !== '') {
                        exportFileWriter.write('<content content-id="' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(contentAssetID)) + '">\n');
                    }
                    if (!empty(contentAssetName) && contentAssetName !== '') {
                        exportFileWriter.write('<display-name xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(contentAssetName)) + '</display-name>');
                    }
                    if (!empty(contentAssetDescription) && contentAssetDescription !== '') {
                        exportFileWriter.write('<description xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(contentAssetDescription)) + '</description>');
                    }
                    exportFileWriter.write('<page-attributes>');
                    if (!empty(contentAssetPageTitle) && contentAssetPageTitle !== '') {
                        exportFileWriter.write('<page-title xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(contentAssetPageTitle)) + '</page-title>');
                    }
                    if (!empty(contentAssetPageDescription) && contentAssetPageDescription !== '') {
                        exportFileWriter.write('<page-description xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(contentAssetPageDescription)) + '</page-description>');
                    }
                    if (!empty(contentAssetPageKeywords) && contentAssetPageKeywords !== '') {
                        exportFileWriter.write('<page-keywords xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(contentAssetPageKeywords)) + '</page-keywords>');
                    }
                    exportFileWriter.write('</page-attributes>');
                    exportFileWriter.write('<custom-attributes>');

                    for (let i = 0; i < selectedContentAttrList.length; i++) {
                        let contentAttr = selectedContentAttrList[i];
                        if (!empty(attributesMap.get(contentAttr.id))) {
                            var attrVal = attributesMap.get(contentAttr.id);
                            if (!empty(contentAttr.typecode) && contentAttr.typecode === '33') { // ENUM Case
                                let splitVale = attrVal.split('^');
                                exportFileWriter.write('<custom-attribute attribute-id="' + contentAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">');
                                for (let j = 0; j < splitVale.length; j++) {
                                    exportFileWriter.write('<value>' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(splitVale[j])) + '</value>');
                                }
                                exportFileWriter.write('</custom-attribute>');
                            } else if (!empty(contentAttr.typecode) && contentAttr.typecode === '23') { // Set of String Case
                                let splitVale = attrVal.split('~');
                                exportFileWriter.write('<custom-attribute attribute-id="' + contentAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">');
                                for (let j = 0; j < splitVale.length; j++) {
                                    exportFileWriter.write('<value>' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(splitVale[j])) + '</value>');
                                }
                                exportFileWriter.write('</custom-attribute>');
                            } else {
                                exportFileWriter.write('<custom-attribute attribute-id="' + contentAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(attributesMap.get(contentAttr.id))) + '</custom-attribute>');
                            }
                        }
                    }
                    exportFileWriter.write('</custom-attributes>');
                    exportFileWriter.write('</content>');
                    exportFileWriter.write('</library>\n');
                    exportFileWriter.close();
                }
            } catch (e) {
                Logger.error('There was an error while generating the content asset IMPORT XML with project ID' + eachProject.getCustom().ProjectID + ': ' + e.message);
            }
        }
    } catch (e) {
        Logger.error('There was an error while downloading the content asset project with project ID' + eachProject.getCustom().ProjectID + ': ' + e.message);
    }
}

/**
 * Download and import the content assets
 * @param {string} catalogID - catalog ID
 * @param {dw.object.CustomObject} translationObj - translationObj
 */
function downloadAndImportContentAsset(catalogID, translationObj) {
    try {
        var eachProject = translationObj;
        var libraryID = catalogID;
        var authToken = SDLHelpers.getAuthToken();
        var objToken = authToken.access_token;
        var objType = authToken.token_type;
        var isParentLevelTranslation = authToken.IsParentLevelTranslation;
        var languagesMap = authToken.languagesMap;
        var sdlConfigurationDetails = authToken.TMSCredentials;
        var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
        var service = ServiceMgr.tMSGet();
        var endPoint = sdlConfiguration.Base_url + '/tm4lc/api/v1/files/' + eachProject.getCustom().ProjectID + '/' + eachProject.getCustom().DownloadableFileID;
        service.URL = endPoint;
        service.addHeader('Authorization', objType + ' ' + objToken);
        service.addHeader('Content-Type', 'application/json');
        var result = service.call();
        if (empty(result.errorMessage)) {
            if (eachProject.getCustom().ArtifactType === 'Content-Asset') {
                downloadContentAsset(eachProject, result.object, libraryID, isParentLevelTranslation, languagesMap);
            }
            var targetLocale = eachProject.getCustom().TragetLanguageCode;
            if (isParentLevelTranslation) {
                if (languagesMap !== '' && languagesMap !== undefined && languagesMap !== null) {
                    var localesMap = SDLHelpers.getLanguagesMap(languagesMap);
                    var parentLangCode = localesMap[targetLocale];
                    if (parentLangCode !== undefined && parentLangCode !== null && parentLangCode !== '') {
                        targetLocale = parentLangCode;
                    }
                }
            }

            var ImportFile = '/sdltms/ContentAsset/download/ContentAsset_' + eachProject.getCustom().ArtifactID + '_' + libraryID.replace('-', '_') + '_' + targetLocale.replace('-', '_') + '.xml';
            var importContentStatus;
            try {
                importContentStatus = new Pipelet('ImportContent').execute({
                    ImportFile: ImportFile,
                    ImportMode: 'MERGE'
                });
                updateProjectPostDownload(importContentStatus, eachProject);
            } catch (e) {
                Logger.error('There was an error while Importing the content assets project {0} with path' + ImportFile + '. : ' + e.stack, translationObj.getCustom().ProjectID);
            }
        }
    } catch (e) {
        Logger.error('There was an error while Importing the content project - ' + translationObj.getCustom().ProjectID + ': ' + e.stack);
    }
}

/**
 * Download and import each promoition
 * @param {dw.object.CustomObject} eachProject - Each promotion object
 * @param {string} fileString - fileString
 * @param {boolean} isParentLevelTranslation - ParentLevel Translation
 * @param {Object} languagesMap - Language Mapping
 */
function downloadPromotion(eachProject, fileString, isParentLevelTranslation, languagesMap) {
    try {
        var file = SDLHelpers.createFile('Promotion', eachProject.getCustom().ArtifactID + '.xml');
        if (file.createNewFile()) {
            var fileWriter = new FileWriter(file, 'UTF-8');
            fileWriter.write(fileString);
            fileWriter.flush();
            fileWriter.close();
            var fileReader = new FileReader(file, 'UTF-8');
            var xmlStreamReader = new XMLStreamReader(fileReader);
            var attributesArray = new ArrayList();
            var promotionOriginalID;
            var valuesArray = new ArrayList();
            var attributesMap = new HashMap();
            while (xmlStreamReader.hasNext()) {
                if (xmlStreamReader.next() === XMLStreamConstants.START_ELEMENT) {
                    var localElementName = xmlStreamReader.getLocalName();
                    if (localElementName === 'fields') {
                        let myObject = xmlStreamReader.readXMLObject();
                        let xmlString = new XML(myObject);
                        var attributes = xmlString.children().attribute('name');
                        var values = xmlString.children().text();
                        for (let i in attributes) { // eslint-disable-line
                            attributesArray.push(attributes[i]);
                        }
                        for (let j in values) { // eslint-disable-line
                            valuesArray.push(values[j]);
                        }
                        for (let i = 0; i < attributesArray.size(); i++) {
                            attributesMap.put(attributesArray.get(i).toString(), valuesArray.get(i).toString());
                        }
                    } else if (localElementName === 'id') {
                        let myObject = xmlStreamReader.readXMLObject();
                        let xmlString = new XML(myObject);
                        var value = xmlString.text();
                        promotionOriginalID = value.toString();
                    }
                }
            }
            xmlStreamReader.close();
            fileReader.close();
            var targetLocale = eachProject.getCustom().TragetLanguageCode;
            if (isParentLevelTranslation) {
                if (!empty(languagesMap) && languagesMap !== '') {
                    var localesMap = SDLHelpers.getLanguagesMap(languagesMap);
                    var parentLangCode = localesMap[targetLocale];
                    if (!empty(parentLangCode) && parentLangCode !== '') {
                        targetLocale = parentLangCode;
                    }
                }
            }
            file = new File(File.IMPEX + '/src/sdltms/Promotion/download/');
            if (!file.isDirectory()) {
                file.mkdirs();
            }
            file = new File(File.IMPEX + '/src/sdltms/Promotion/download/Promotion_' + eachProject.getCustom().ArtifactID + '_' + targetLocale.replace('-', '_') + '.xml');
            if (file.exists()) {
                file.remove();
            }
            var SDLCredObject = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
            var selectedPromotionAttr;
            var selectedPromotionAttrList = new ArrayList();
            if (!empty(SDLCredObject) && !empty(SDLCredObject.custom.translatablePromotionAttributes)) {
                selectedPromotionAttr = JSON.parse(SDLCredObject.custom.translatablePromotionAttributes);
                for (let i = 0; i < selectedPromotionAttr.length; i++) {
                    var promoAttr = selectedPromotionAttr[i];
                    if (!empty(promoAttr.type) && promoAttr.type === 'custom') {
                        selectedPromotionAttrList.add(promoAttr);
                    }
                }
            }
            try {
                if (file.createNewFile()) {
                    var exportFileWriter = new FileWriter(file, 'UTF-8');
                    exportFileWriter.write('<promotions xmlns="http://www.demandware.com/xml/impex/promotion/2008-01-31">\n');
                    var promotionID = eachProject.getCustom().ArtifactID;
                    if (!empty(promotionOriginalID)) {
                        promotionID = promotionOriginalID;
                    }
                    var promotionName = attributesMap.get('name');
                    var promotionCalloutMsg = attributesMap.get('calloutMsg');
                    var promotionDetails = attributesMap.get('details');
                    if (!empty(promotionID) && promotionID !== '') {
                        exportFileWriter.write('<promotion  promotion-id="' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(promotionID)) + '">\n');
                    }
                    if (!empty(promotionName) && promotionName !== '') {
                        exportFileWriter.write('<name xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(promotionName)) + '</name>');
                    }
                    if (!empty(promotionCalloutMsg) && promotionCalloutMsg !== '') {
                        exportFileWriter.write('<callout-msg xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(promotionCalloutMsg)) + '</callout-msg>');
                    }
                    if (!empty(promotionDetails) && promotionDetails !== '') {
                        exportFileWriter.write('<details xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(promotionDetails)) + '</details>');
                    }
                    exportFileWriter.write('<custom-attributes>');

                    for (let i = 0; i < selectedPromotionAttrList.length; i++) {
                        var promotionAttr = selectedPromotionAttrList[i];
                        if (!empty(attributesMap.get(promotionAttr.id))) {
                            var attrVal = attributesMap.get(promotionAttr.id);
                            if (!empty(promotionAttr.typecode) && promotionAttr.typecode === '33') { // ENUM Case
                                let splitVale = attrVal.split('^');
                                exportFileWriter.write('<custom-attribute attribute-id="' + promotionAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">');
                                for (let j = 0; j < splitVale.length; j++) {
                                    exportFileWriter.write('<value>' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(splitVale[j])) + '</value>');
                                }
                                exportFileWriter.write('</custom-attribute>');
                            } else if (!empty(promotionAttr.typecode) && promotionAttr.typecode === '23') { // Set of String Case
                                let splitVale = attrVal.split('~');
                                exportFileWriter.write('<custom-attribute attribute-id="' + promotionAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">');
                                for (let j = 0; j < splitVale.length; j++) {
                                    exportFileWriter.write('<value>' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(splitVale[j])) + '</value>');
                                }
                                exportFileWriter.write('</custom-attribute>');
                            } else {
                                exportFileWriter.write('<custom-attribute attribute-id="' + promotionAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(attributesMap.get(promotionAttr.id))) + '</custom-attribute>');
                            }
                        }
                    }
                    exportFileWriter.write('</custom-attributes>');
                    exportFileWriter.write('</promotion>');
                    exportFileWriter.write('</promotions>\n');
                    exportFileWriter.close();
                }
            } catch (e) {
                Logger.error('There was an error while generating the Promotion IMPORT XML with project ID' + eachProject.getCustom().ProjectID + ': ' + e.stack);
            }
        }
    } catch (e) {
        Logger.error('There was an error while downloading the Promotion project with project ID' + eachProject.getCustom().ProjectID + ': ' + e.stack);
    }
}

/**
 * Download and import the promoitions
 * @param {dw.object.CustomObject} translationObj - translationObj
 */
function downloadAndImportPromotion(translationObj) {
    try {
        var eachProject = translationObj;
        var authToken = SDLHelpers.getAuthToken();
        var objToken = authToken.access_token;
        var objType = authToken.token_type;
        var isParentLevelTranslation = authToken.IsParentLevelTranslation;
        var languagesMap = authToken.languagesMap;
        var sdlConfigurationDetails = authToken.TMSCredentials;
        var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
        var service = ServiceMgr.tMSGet();
        var endPoint = sdlConfiguration.Base_url + '/tm4lc/api/v1/files/' + eachProject.getCustom().ProjectID + '/' + eachProject.getCustom().DownloadableFileID;
        service.URL = endPoint;
        service.addHeader('Authorization', objType + ' ' + objToken);
        service.addHeader('Content-Type', 'application/json');
        var result = service.call();
        if (empty(result.errorMessage)) {
            if (eachProject && eachProject.getCustom().ArtifactType === 'Promotions') {
                downloadPromotion(eachProject, result.object, isParentLevelTranslation, languagesMap);
            }
            var targetLocale = eachProject.getCustom().TragetLanguageCode;
            if (isParentLevelTranslation) {
                if (!empty(languagesMap) && languagesMap !== '') {
                    var localesMap = SDLHelpers.getLanguagesMap(languagesMap);
                    var parentLangCode = localesMap[targetLocale];
                    if (!empty(parentLangCode) && parentLangCode !== '') {
                        targetLocale = parentLangCode;
                    }
                }
            }

            var ImportFile = '/sdltms/Promotion/download/Promotion_' + eachProject.getCustom().ArtifactID + '_' + targetLocale.replace('-', '_') + '.xml';
            var importPromotionStatus;
            try {
                importPromotionStatus = new Pipelet('ImportPromotions').execute({
                    ImportFile: ImportFile,
                    ImportMode: 'MERGE'
                });
                updateProjectPostDownload(importPromotionStatus, eachProject);
            } catch (e) {
                Logger.error('There was an error while Importing the Promotion project {0} with path' + ImportFile + '. : ' + e.stack, translationObj.getCustom().ProjectID);
            }
        }
    } catch (e) {
        Logger.error('There was an error while Importing the Promotion project - ' + translationObj.getCustom().ProjectID + ': ' + e.stack);
    }
}

/**
 * Download and import each campaign
 * @param {dw.object.CustomObject} eachProject - Each campaign object
 * @param {string} fileString - fileString
 * @param {boolean} isParentLevelTranslation - ParentLevel Translation
 * @param {Object} languagesMap - Language Mapping
 */
function downloadCampaign(eachProject, fileString, isParentLevelTranslation, languagesMap) {
    try {
        var file = SDLHelpers.createFile('Campaigns', eachProject.getCustom().ArtifactID + '.xml');
        if (file.createNewFile()) {
            var fileWriter = new FileWriter(file, 'UTF-8');
            fileWriter.write(fileString);
            fileWriter.flush();
            fileWriter.close();
            var fileReader = new FileReader(file, 'UTF-8');
            var xmlStreamReader = new XMLStreamReader(fileReader);
            var attributesArray = new ArrayList();
            var campaignOriginalID;
            var valuesArray = new ArrayList();
            var attributesMap = new HashMap();
            while (xmlStreamReader.hasNext()) {
                if (xmlStreamReader.next() === XMLStreamConstants.START_ELEMENT) {
                    var localElementName = xmlStreamReader.getLocalName();
                    if (localElementName === 'fields') {
                        let myObject = xmlStreamReader.readXMLObject();
                        let xmlString = new XML(myObject);
                        var attributes = xmlString.children().attribute('name');
                        var values = xmlString.children().text();
                        for (let i in attributes) { // eslint-disable-line
                            attributesArray.push(attributes[i]);
                        }
                        for (let j in values) { // eslint-disable-line
                            valuesArray.push(values[j]);
                        }
                        for (let i = 0; i < attributesArray.size(); i++) {
                            attributesMap.put(attributesArray.get(i).toString(), valuesArray.get(i).toString());
                        }
                    } else if (localElementName === 'id') {
                        let myObject = xmlStreamReader.readXMLObject();
                        let xmlString = new XML(myObject);
                        var value = xmlString.text();
                        campaignOriginalID = value.toString();
                    }
                }
            }
            xmlStreamReader.close();
            fileReader.close();
            var targetLocale = eachProject.getCustom().TragetLanguageCode;
            if (isParentLevelTranslation) {
                if (!empty(languagesMap) && languagesMap !== null) {
                    var localesMap = SDLHelpers.getLanguagesMap(languagesMap);
                    var parentLangCode = localesMap[targetLocale];
                    if (!empty(parentLangCode) && parentLangCode !== '') {
                        targetLocale = parentLangCode;
                    }
                }
            }
            file = new File(File.IMPEX + '/src/sdltms/Campaigns/download/');
            if (!file.isDirectory()) {
                file.mkdirs();
            }
            file = new File(File.IMPEX + '/src/sdltms/Campaigns/download/Campaigns_' + eachProject.getCustom().ArtifactID + '_' + targetLocale.replace('-', '_') + '.xml');
            if (file.exists()) {
                file.remove();
            }
            var SDLCredObject = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
            var selectedCampAttr;
            var selectedCampAttrList = new ArrayList();
            if (!empty(SDLCredObject) && !empty(SDLCredObject.custom.translatableCampaignAttributes)) {
                selectedCampAttr = JSON.parse(SDLCredObject.custom.translatableCampaignAttributes);
                for (let i = 0; i < selectedCampAttr.length; i++) {
                    var campAttr = selectedCampAttr[i];
                    if (!empty(campAttr.type) && campAttr.type === 'custom') {
                        selectedCampAttrList.add(campAttr);
                    }
                }
            }
            try {
                if (file.createNewFile()) {
                    var exportFileWriter = new FileWriter(file, 'UTF-8');
                    exportFileWriter.write('<promotions xmlns="http://www.demandware.com/xml/impex/promotion/2008-01-31">\n');
                    var campaignID = eachProject.getCustom().ArtifactID;
                    if (!empty(campaignOriginalID)) {
                        campaignID = campaignOriginalID;
                    }
                    if (!empty(campaignID) && campaignID !== '') {
                        exportFileWriter.write('<campaign  campaign-id="' + StringUtils.stringToXml(campaignID) + '">\n');
                    }

                    exportFileWriter.write('<custom-attributes>');

                    for (let i = 0; i < selectedCampAttrList.length; i++) {
                        var campaignAttr = selectedCampAttrList[i];
                        if (!empty(attributesMap.get(campaignAttr.id))) {
                            var attrVal = attributesMap.get(campaignAttr.id);
                            if (!empty(campaignAttr.typecode) && campaignAttr.typecode === '33') { // ENUM Case
                                let splitVale = attrVal.split('^');
                                exportFileWriter.write('<custom-attribute attribute-id="' + campaignAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">');
                                for (let j = 0; j < splitVale.length; j++) {
                                    exportFileWriter.write('<value>' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(splitVale[j])) + '</value>');
                                }
                                exportFileWriter.write('</custom-attribute>');
                            } else if (!empty(campaignAttr.typecode) && campaignAttr.typecode === '23') { // Set of String Case
                                let splitVale = attrVal.split('~');
                                exportFileWriter.write('<custom-attribute attribute-id="' + campaignAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">');
                                for (let j = 0; j < splitVale.length; j++) {
                                    exportFileWriter.write('<value>' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(splitVale[j])) + '</value>');
                                }
                                exportFileWriter.write('</custom-attribute>');
                            } else {
                                exportFileWriter.write('<custom-attribute attribute-id="' + campaignAttr.id + '" xml:lang="' + StringUtils.stringToXml(targetLocale) + '">' + StringUtils.stringToXml(SDLHelpers.replaceXMLChar(attributesMap.get(campaignAttr.id))) + '</custom-attribute>');
                            }
                        }
                    }

                    exportFileWriter.write('</custom-attributes>');
                    exportFileWriter.write('</campaign>');
                    exportFileWriter.write('</promotions>\n');
                    exportFileWriter.close();
                }
            } catch (e) {
                Logger.error('There was an error while generating the Campaigns IMPORT XML with project ID' + eachProject.getCustom().ProjectID + ': ' + e.stack);
            }
        }
    } catch (e) {
        Logger.error('There was an error while downloading the Campaigns project with project ID' + eachProject.getCustom().ProjectID + ': ' + e.stack);
    }
}

/**
 * Download and import the campaigns
 * @param {dw.object.CustomObject} translationObj - translationObj
 */
function downloadAndImportCampaign(translationObj) {
    try {
        var eachProject = translationObj;
        var authToken = SDLHelpers.getAuthToken();
        var objToken = authToken.access_token;
        var objType = authToken.token_type;
        var isParentLevelTranslation = authToken.IsParentLevelTranslation;
        var languagesMap = authToken.languagesMap;
        var sdlConfigurationDetails = authToken.TMSCredentials;
        var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
        var service = ServiceMgr.tMSGet();
        var endPoint = sdlConfiguration.Base_url + '/tm4lc/api/v1/files/' + eachProject.getCustom().ProjectID + '/' + eachProject.getCustom().DownloadableFileID;
        service.URL = endPoint;
        service.addHeader('Authorization', objType + ' ' + objToken);
        service.addHeader('Content-Type', 'application/json');
        var result = service.call();
        if (empty(result.errorMessage)) {
            if (eachProject.getCustom().ArtifactType === 'Campaigns') {
                downloadCampaign(eachProject, result.object, isParentLevelTranslation, languagesMap);
            }
            var targetLocale = eachProject.getCustom().TragetLanguageCode;
            if (isParentLevelTranslation) {
                if (!empty(languagesMap) && languagesMap !== '') {
                    var localesMap = SDLHelpers.getLanguagesMap(languagesMap);
                    var parentLangCode = localesMap[targetLocale];
                    if (!empty(parentLangCode) && parentLangCode !== '') {
                        targetLocale = parentLangCode;
                    }
                }
            }

            var ImportFile = '/sdltms/Campaigns/download/Campaigns_' + eachProject.getCustom().ArtifactID + '_' + targetLocale.replace('-', '_') + '.xml';
            var importPromotionStatus;
            try {
                importPromotionStatus = new Pipelet('ImportPromotions').execute({
                    ImportFile: ImportFile,
                    ImportMode: 'MERGE'
                });
                updateProjectPostDownload(importPromotionStatus, eachProject);
            } catch (e) {
                Logger.error('There was an error while Importing the Campaign project {0} with path' + ImportFile + '. : ' + e.stack, translationObj.getCustom().ProjectID);
            }
        }
    } catch (e) {
        Logger.error('There was an error while Importing the Campaign project - ' + translationObj.getCustom().ProjectID + ': ' + e.stack);
    }
}

module.exports = {
    downloadAndImportCatalog: downloadAndImportCatalog,
    downloadAndImportContentAsset: downloadAndImportContentAsset,
    downloadAndImportDictionary: downloadAndImportDictionary,
    downloadAndImportPromotion: downloadAndImportPromotion,
    downloadAndImportCampaign: downloadAndImportCampaign
};
