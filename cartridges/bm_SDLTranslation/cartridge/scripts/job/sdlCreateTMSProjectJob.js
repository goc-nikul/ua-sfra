'use strict';
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var File = require('dw/io/File');
var ArrayList = require('dw/util/ArrayList');
var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger').getLogger('SDL_translation', 'SDL_translation');
var SDLHelpers = require('*/cartridge/scripts/helpers/sdlHelpers');
var ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');

exports.run = function () {
    try {
        // create directory if not exist
        SDLHelpers.createDirectory();
        // deleting previous existing files from impex if exist
        var thisDirectory = new File(File.IMPEX + '/src/sdlconnector/upload/');

        var folder = thisDirectory.listFiles();
        if (folder.length !== 0) {
            for (let i = 0; i < folder.length; i++) {
                folder[i].remove();
            }
        }
    } catch (e) {
        Logger.error('There was an error while removing the existing file in Create TMS Project. : ' + e.stack);
    }

    var typeCode = ['33', '23'];
    var SDLCredObject = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
    var selectedProdAttr;
    var selectedProdAttrList = new ArrayList();
    if (!empty(SDLCredObject) && !empty(SDLCredObject.custom.translatableProductAttributes)) {
        selectedProdAttr = JSON.parse(SDLCredObject.custom.translatableProductAttributes);
        for (let i = 0; i < selectedProdAttr.length; i++) {
            var prodAttr = selectedProdAttr[i];
            selectedProdAttrList.add(prodAttr);
        }
    }

    try {
        var objIterator = CustomObjectMgr.queryCustomObjects('ProjectsDataForCreating', 'custom.IsTMSProjectCreated = false', null);
        while (objIterator.hasNext()) {
            var uploadResponseList = [];
            var eachCustomObject = objIterator.next();
            var eachCustomObjectID = eachCustomObject.getCustom().ProjectID;
            var ProjectType = eachCustomObject.getCustom().ProjectType;
            var eachCreateProjectData = eachCustomObject.getCustom().CreateProjectJson;
            var eachTargetLanguageProduct = eachCustomObject.getCustom().TargetLanguageProductsListMap;
            var siteCatalogs = eachCustomObject.getCustom().CatalogIdsList;
            var jsonVal = JSON.parse(eachCreateProjectData);
            var jobOptionForTMS = jsonVal.JobOptions;
            var productsData = JSON.parse(eachTargetLanguageProduct);
            if (productsData.length <= 0) {
                try {
                    Transaction.wrap(function() { //eslint-disable-line
                        var object = CustomObjectMgr.getCustomObject('ProjectsDataForCreating', eachCustomObjectID);
                        if (!empty(object)) {
                            CustomObjectMgr.remove(object);
                        }
                    });
                } catch (e) {
                    Logger.error('There was an error while execting Create TMS Project job while updating ProjectsDataForCreating Object. : ' + e.stack);
                }
            } else {
                for (let i = 0; i < productsData.length; i++) {
                    var targetLangs = productsData[i].TargetLanguage;
                    var productIDList = productsData[i].ProductsArray;
                    if (productIDList.length <= 0) {
                        try {
                            Transaction.wrap(function () { //eslint-disable-line
                                var object = CustomObjectMgr.getCustomObject('ProjectsDataForCreating', eachCustomObjectID);
                                if (!empty(object)) {
                                    CustomObjectMgr.remove(object);
                                }
                            });
                        } catch (e) {
                            Logger.error('There was an error while executing Create TMS Project job while updating ProjectsDataForCreating Object. : ' + e.stack);
                        }
                    } else {
                        for (var j = 0; j < productIDList.length; j++) {
                            var eachProductID = productIDList[j];
                            var eachProduct = ProductMgr.getProduct(eachProductID);
                            var productObj = {};
                            if (!empty(eachProduct)) {
                                for (var k = 0; k < selectedProdAttrList.length; k++) {
                                    var attr = selectedProdAttrList[k];
                                    var attribute = attr.id;
                                    if (attr.type === 'system' && eachProduct[attribute] !== undefined && !empty(eachProduct[attribute])) {
                                        if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '33') {
                                            let enumValue = new ArrayList(eachProduct[attribute]);
                                            let multiDisplayVal = new ArrayList();
                                            for (let x = 0; x < enumValue.length; x++) {
                                                multiDisplayVal.add(enumValue[x].value);
                                            }
                                            productObj[attribute] = multiDisplayVal.join('^');
                                        } else if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '23') {
                                            let setOfStringData = new ArrayList(eachProduct[attribute]);
                                            productObj[attribute] = setOfStringData.join('~');
                                        } else {
                                            productObj[attribute] = eachProduct[attribute];
                                        }
                                    } else if (attr.type === 'custom' && eachProduct.custom[attribute] !== undefined && !empty(eachProduct.custom[attribute])) {
                                        if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '33') {
                                            let enumValue = new ArrayList(eachProduct.custom[attribute]);
                                            let multiDisplayVal = new ArrayList();
                                            for (let x = 0; x < enumValue.length; x++) {
                                                multiDisplayVal.add(enumValue[x].value);
                                            }
                                            productObj[attribute] = multiDisplayVal.join('^');
                                        } else if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '23') {
                                            let setOfStringData = new ArrayList(eachProduct.custom[attribute]);
                                            productObj[attribute] = setOfStringData.join('~');
                                        } else {
                                            productObj[attribute] = eachProduct.custom[attribute];
                                        }
                                    }
                                }
                            }
                            var xmlStr = SDLHelpers.buildXMLString(eachProduct.ID, productObj);
                            if (!empty(xmlStr) && xmlStr !== '') {
                                var theAuthToken = SDLHelpers.getAuthToken();
                                if (!theAuthToken) {
                                    throw new Error('Auth Token Could not found while Offline project job creation. Please check the Custom ERROR LOGS.');
                                }
                                let sdlConfigurationDetails = theAuthToken.TMSCredentials;
                                let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                                var uploadparms = {};
                                uploadparms.access_token = theAuthToken.access_token;
                                uploadparms.token_type = theAuthToken.token_type;
                                uploadparms.xmlname = eachProduct.ID.replace(/[^1-9a-zA-Z]/g, '_') + '.xml';
                                uploadparms.xmlstr = xmlStr;
                                uploadparms.joboption = jobOptionForTMS;
                                uploadparms.Base_url = sdlConfiguration.Base_url;
                                var fileResponseFromTMS = SDLHelpers.uploadFileToTMS(uploadparms);
                                if (!empty(fileResponseFromTMS) && fileResponseFromTMS !== '') {
                                    var fileDetails = {};
                                    if (!empty(fileResponseFromTMS.FileId) && fileResponseFromTMS.FileId !== '') {
                                        fileDetails.fileId = fileResponseFromTMS.FileId;
                                        fileDetails.targets = targetLangs;
                                        uploadResponseList.push(fileDetails);
                                    }
                                }
                            }
                        }
                    }
                }
                if (!empty(uploadResponseList) && uploadResponseList.length > 0) {
                    var createProjectObj = {};
                    createProjectObj.Description = jsonVal.Description;
                    createProjectObj.Files = uploadResponseList;
                    createProjectObj.ProjectOptionsId = jsonVal.JobOptions;
                    if (!empty(jsonVal.Metadata) && jsonVal.Metadata.length > 0) {
                        createProjectObj.Metadata = jsonVal.Metadata;
                    } else {
                        createProjectObj.Metadata = null;
                    }
                    createProjectObj.Name = jsonVal.Name;
                    createProjectObj.DueDate = jsonVal.DueDate;
                    createProjectObj.SrcLang = jsonVal.SrcLang;
                    var jsonString = JSON.stringify(createProjectObj);
                    var authToken = SDLHelpers.getAuthToken();
                    if (!authToken) {
                        throw new Error('Auth Token Could not found while Offline project job creation. Please check the Custom ERROR LOGS.');
                    }
                    var objToken = authToken.access_token;
                    var objType = authToken.token_type;
                    let sdlConfigurationDetails = authToken.TMSCredentials;
                    let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                    var endPoint = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects';
                    var service = ServiceMgr.tMSPost();
                    service.URL = endPoint;
                    service.addHeader('Authorization', objType + ' ' + objToken);
                    service.addHeader('Content-Type', 'application/json');
                    var result = service.call(jsonString);
                    if (empty(result.errorMessage)) {
                        var createProjectResponse = result.object;
                        var response = JSON.parse(createProjectResponse);
                        if (!empty(response)) {
                            var guid = SDLHelpers.createGuid();
                            Transaction.wrap(function () { // eslint-disable-line
                                var objProject = CustomObjectMgr.createCustomObject('Project', guid);
                                if (!empty(objProject)) {
                                    objProject.custom.ProjectName = jsonVal.Name;
                                    objProject.custom.ProjectStatus = 'Preparing';
                                    objProject.custom.IsTranslationHistoryCreated = false;
                                    objProject.custom.IsAutoDownload = true;
                                    if (!empty(siteCatalogs) && siteCatalogs !== '') {
                                        objProject.custom.CatalogIdsList = siteCatalogs;
                                    }
                                    objProject.custom.TMSProjectID = response.ProjectId;
                                    objProject.custom.ProjectType = ProjectType;
                                }
                            });

                            // updating the ProjectsDataForCreating custom object in demandware db
                            try {
                                Transaction.wrap(function () { // eslint-disable-line
                                    var object = CustomObjectMgr.getCustomObject('ProjectsDataForCreating', eachCustomObjectID);
                                    if (!empty(object)) {
                                        CustomObjectMgr.remove(object);
                                    }
                                });
                            } catch (e) {
                                Logger.error('There was an error while execting Create TMS Project job while removing ProjectsDataForCreating Object. : ' + e.stack);
                            }
                        }
                    }
                }
            }
        }
        objIterator.close();
    } catch (e) {
        Logger.error('There was an Error while executing the  Create TMS Project job.: ' + e.stack);
    }
};
