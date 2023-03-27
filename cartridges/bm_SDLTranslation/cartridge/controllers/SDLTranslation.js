'use strict';

var server = require('server');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger').getLogger('SDL_translation', 'SDL_translation');
var SDLHelpers = require('*/cartridge/scripts/helpers/sdlHelpers');
var ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');
var ArrayList = require('dw/util/ArrayList');

server.get('SDLConfiguration', function (req, res, next) {
    try {
        var config = SDLHelpers.getSDLConfiguration();
        res.render('sdl/SDLConfiguration', {
            ConfigObj: config,
            submitConfigUrl: URLUtils.url('SDLTranslation-SaveConfig').toString()
        });
    } catch (error) {
        res.render('sdl/SDLGeneralError', {
            ProjectError: error.stack
        });
    }

    next();
});

server.post('SaveConfig', function (req, res, next) {
    try {
        var tMSCredentials = request.httpParameterMap.TMSCredentials.stringValue;
        var tokenType = request.httpParameterMap.tokenType.stringValue;
        var catalogIds = request.httpParameterMap.CatalogIds.stringValue;
        var libraryIDs = request.httpParameterMap.LibraryIDs.stringValue;
        var languageMap = request.httpParameterMap.LanguagesMap.stringValue;
        var isParentLevelTranslationValue = request.httpParameterMap.isParentLevelTranslation.booleanValue;
        var selectedProductAttribute = request.httpParameterMap.SelectedProductAttribute.stringValue;
        var selectedContentAttribute = request.httpParameterMap.SelectedContentAttribute.stringValue;
        var selectedPromotionAttribute = request.httpParameterMap.SelectedPromotionAttribute.stringValue;
        var selectedCampaignAttribute = request.httpParameterMap.SelectedCampaignAttribute.stringValue;

        Transaction.wrap(function () {
            var object = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
            var langMapToSave = '';
            var sdlCurrentDate = new Date();
            if (object !== undefined && object !== null) {
                object.custom.token_type = tokenType;
                object.custom.TMSCredentials = tMSCredentials;
                object.custom.SiteCatalogs = catalogIds;
                object.custom.SiteLibraries = libraryIDs;
                object.custom.access_token = '';
                object.custom.IsParentLevelTranslation = isParentLevelTranslationValue;
                if (isParentLevelTranslationValue) {
                    if (languageMap !== undefined && languageMap !== null) {
                        langMapToSave = languageMap;
                    }
                }
                object.custom.LanguagesMap = langMapToSave;
                sdlCurrentDate.setDate(sdlCurrentDate.getDate() - 1);
                object.custom.expiry_date = sdlCurrentDate;
                object.custom.translatableProductAttributes = selectedProductAttribute;
                object.custom.translatableContentAttributes = selectedContentAttribute;
                object.custom.translatablePromotionAttributes = selectedPromotionAttribute;
                object.custom.translatableCampaignAttributes = selectedCampaignAttribute;
            } else {
                var object1 = CustomObjectMgr.createCustomObject('SDL_Session', 'SDLTMSCredentials');
                if (!empty(object1)) {
                    object1.custom.token_type = tokenType;
                    object1.custom.TMSCredentials = tMSCredentials;
                    object1.custom.SiteCatalogs = catalogIds;
                    object1.custom.SiteLibraries = libraryIDs;
                    object1.custom.access_token = '';
                    object.custom.IsParentLevelTranslation = isParentLevelTranslationValue;
                    if (isParentLevelTranslationValue) {
                        if (languageMap !== undefined && languageMap !== null) {
                            langMapToSave = languageMap;
                        }
                    }
                    object1.custom.LanguagesMap = langMapToSave;
                    sdlCurrentDate.setDate(sdlCurrentDate.getDate() - 1);
                    object1.custom.expiry_date = sdlCurrentDate;
                    object1.custom.translatableProductAttributes = selectedProductAttribute;
                    object1.custom.translatableContentAttributes = selectedContentAttribute;
                    object1.custom.translatablePromotionAttributes = selectedPromotionAttribute;
                    object1.custom.translatableCampaignAttributes = selectedCampaignAttribute;
                }
            }
        });
        res.json({ success: true });
    } catch (error) {
        Logger.error('Error while saving the SDL configuration ' + error.stack);
        res.json({ success: true });
    }
    next();
});

server.get('CategoryOption', function (req, res, next) {
    var errorText;
    try {
        var result = SDLHelpers.getsdlProjectOptions();
        var catalogList = SDLHelpers.getSDLCatalogList();
        if (!catalogList) {
            throw new Error('Catalog IDs are not configured in the SDL configuration page. Please setup it to proceed.');
        }
        if (empty(result.errorMessage)) {
            var jsonObj = JSON.parse(result.object);
            var topLevelCategory = SDLHelpers.getTopLevelCategory();
            res.render('sdl/SDLCreateCategoryProject', {
                ProjectOption: jsonObj,
                TopLevelCategory: topLevelCategory,
                CatalogList: catalogList
            });
        } else {
            errorText = 'Please verify your credential or contact Administrator';
            res.render('sdl/SDLGeneralError', {
                ProjectError: errorText
            });
        }
    } catch (e) {
        Logger.error('There was an error while loading the Category Metadata Project. : ', e.stack);
        errorText = 'Please verify your credential or contact Administrator';
        res.render('sdl/SDLGeneralError', {
            ProjectError: errorText
        });
    }
    return next();
});

server.post('SendCategoryProject', function (req, res, next) {
    var errorText;
    try {
        // create directory if not exist
        SDLHelpers.createDirectory();
        // deleting previous existing files from impex upload folder if exist
        SDLHelpers.deleteExistingDirectory();

        var form = req.form;
        var item = form.items;
        var jsonVal = JSON.parse(item);
        var jobOptionForTMS = jsonVal.JobOptions;

        // Fetch the Catalog List
        var catalogList = jsonVal.Catalog;
        var jobCatalog;
        if (!empty(catalogList)) {
            jobCatalog = {
                catalogIDs: [catalogList]
            }
        }

        var uploadResponseList = [];
        var targetLanguagesArray = [];

        for (let i = 0; i < Object.keys(jsonVal.FileIds).length; i++) {
            if (jsonVal.FileIds[i].cat_original_id !== undefined && jsonVal.FileIds[i].cat_original_id !== null && jsonVal.FileIds[i].cat_original_id !== '') {
                var catidFromJson = jsonVal.FileIds[i].cat_original_id;
                if (jsonVal.FileIds[i].tlang_code !== undefined && jsonVal.FileIds[i].tlang_code !== null && jsonVal.FileIds[i].tlang_code.length > 0) {
                    targetLanguagesArray = jsonVal.FileIds[i].tlang_code;
                }
                var allCategoriesList = SDLHelpers.getAllLevelSubCategories(catidFromJson);
                if (!empty(allCategoriesList) && allCategoriesList.length > 0) {
                    for (let k = 0; k < allCategoriesList.length; k++) {
                        var eachCategoryId = allCategoriesList[k];
                        var selectedCategory = CatalogMgr.getCategory(eachCategoryId);
                        var objCategory = {};

                        if (!empty(selectedCategory)) {
                            if (selectedCategory.ID !== '') objCategory.ID = selectedCategory.ID;
                            if (selectedCategory.displayName !== '') objCategory.displayName = selectedCategory.displayName;
                            if (selectedCategory.description !== '') objCategory.description = selectedCategory.description;
                            if (selectedCategory.pageTitle !== '') objCategory.pageTitle = selectedCategory.pageTitle;
                            if (selectedCategory.pageDescription !== '') objCategory.pageDescription = selectedCategory.pageDescription;
                            if (selectedCategory.pageKeywords !== '') objCategory.pageKeywords = selectedCategory.pageKeywords;
                            if (selectedCategory.pageURL !== '') objCategory.pageURL = selectedCategory.pageURL;
                            if ('headerMenuBanner' in selectedCategory.custom && selectedCategory.custom.headerMenuBanner !== '') objCategory.headerMenuBanner = selectedCategory.custom.headerMenuBanner;
                        }

                        var xmlString = SDLHelpers.buildXMLString(eachCategoryId, objCategory);
                        if (!empty(xmlString) && xmlString !== '') {
                            try {
                                var theAuthToken = SDLHelpers.getAuthToken();
                                var uploadparms = {};
                                let sdlConfigurationDetails = theAuthToken.TMSCredentials;
                                let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                                uploadparms.access_token = theAuthToken.access_token;
                                uploadparms.token_type = theAuthToken.token_type;
                                uploadparms.xmlname = selectedCategory.ID.replace(/[^1-9a-zA-Z]/g, '_') + '.xml';
                                uploadparms.xmlstr = xmlString;
                                uploadparms.joboption = jobOptionForTMS;
                                uploadparms.Base_url = sdlConfiguration.Base_url;
                                var fileResponseFromTMS = SDLHelpers.uploadFileToTMS(uploadparms);
                                if (fileResponseFromTMS !== undefined && fileResponseFromTMS !== null && fileResponseFromTMS !== '') {
                                    var fileDetails = {};
                                    fileDetails.fileId = fileResponseFromTMS.FileId;
                                    fileDetails.targets = targetLanguagesArray;
                                    uploadResponseList.push(fileDetails);
                                }
                            } catch (e) {
                                Logger.error('There was an error while creating Category meta data TMS project. : ' + e.stack);
                                errorText = 'Please verify your credential or contact Administrator';
                                res.json({ success: false, error: errorText });
                                return next();
                            }
                        }
                    }
                }
            }
        }
        if (!empty(jsonVal) && !empty(uploadResponseList) && uploadResponseList.length > 0) {
            var createProjectObj = {};
            createProjectObj.Description = jsonVal.Description;
            createProjectObj.Files = uploadResponseList;
            createProjectObj.ProjectOptionsId = jsonVal.JobOptions;
            if (jsonVal.Metadata !== undefined && jsonVal.Metadata.length > 0) {
                createProjectObj.Metadata = jsonVal.Metadata;
            } else {
                createProjectObj.Metadata = null;
            }
            createProjectObj.Name = jsonVal.Name;
            createProjectObj.DueDate = jsonVal.DueDate;
            createProjectObj.SrcLang = jsonVal.SrcLang;
            var jsonString = JSON.stringify(createProjectObj);
            try {
                var authToken = SDLHelpers.getAuthToken();
                var objToken = authToken.access_token;
                var objType = authToken.token_type;
                let sdlConfigurationDetails = authToken.TMSCredentials;
                let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                var service = ServiceMgr.tMSPost();
                service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects';
                service.addHeader('Authorization', objType + ' ' + objToken);
                service.addHeader('Content-Type', 'application/json');
                var result = service.call(jsonString);
                var siteCatalogs = authToken.SiteCatalogs;
                if (empty(result.errorMessage)) {
                    try {
                        var createProjectResponse = result.object;
                        var response = JSON.parse(createProjectResponse);
                        if (response !== undefined && response !== null) {
                            var guid = SDLHelpers.createGuid();
                            Transaction.wrap(function () {
                                var objProject = CustomObjectMgr.createCustomObject('Project', guid);
                                if (!empty(objProject)) {
                                    objProject.custom.ProjectName = jsonVal.Name;
                                    objProject.custom.ProjectStatus = 'Preparing';
                                    objProject.custom.TMSProjectID = response.ProjectId;
                                    if (!empty(jobCatalog) && jobCatalog.catalogIDs) {
                                        objProject.custom.CatalogIdsList = JSON.stringify(jobCatalog);
                                    } else if (!empty(siteCatalogs) && siteCatalogs !== '') {
                                        objProject.custom.CatalogIdsList = siteCatalogs;
                                    }
                                    objProject.custom.IsAutoDownload = true;
                                    objProject.custom.ProjectType = 'Category Project';
                                    objProject.custom.IsTranslationHistoryCreated = false;
                                }
                            });
                        }
                    } catch (e) {
                        Logger.error('There was an error while creating Category meta data TMS project. : ' + e.stack);
                        errorText = 'Please verify your credential or contact Administrator';
                        res.json({ success: false, error: errorText });
                        return next();
                    }
                } else {
                    errorText = 'Please verify your credential or contact Administrator';
                    res.json({ success: false, error: errorText });
                    return next();
                }
            } catch (e) {
                Logger.error('There was an error while creating Category meta data TMS project. : ' + e.stack);
                errorText = 'Please verify your credential or contact Administrator';
                res.json({ success: false, error: errorText });
                return next();
            }
        }
    } catch (e) {
        Logger.error('There was an error while creating Category meta data TMS project. : ' + e.stack);
        errorText = 'Please verify your credential or contact Administrator';
        res.json({ success: false, error: errorText });
        return next();
    }
    res.json({ success: true });
    return next();
});

server.get('ProductCategoryOption', function (req, res, next) {
    try {
        var result = SDLHelpers.getsdlProjectOptions();
        var catalogList = SDLHelpers.getSDLCatalogList();
        if (!catalogList) {
            throw new Error('Catalog IDs are not configured in the SDL configuration page. Please setup it to proceed.');
        }
        if (empty(result.errorMessage)) {
            var jsonObj = JSON.parse(result.object);
            var topLevelCategory = SDLHelpers.getTopLevelCategory();
            res.render('sdl/SDLCreateProductCategoryProject', {
                ProjectOption: jsonObj,
                TopLevelCategory: topLevelCategory,
                CatalogList: catalogList
            });
        } else {
            res.render('sdl/SDLGeneralError', {
                ProjectError: result.errorMessage
            });
        }
    } catch (e) {
        Logger.error('There was an error while loading the Category Product project view. : ' + e.stack);
        var errorText = 'Please verify your credential or contact Administrator';
        res.render('sdl/SDLGeneralError', {
            ProjectError: errorText
        });
    }
    return next();
});

server.post('SendProductCategoryProject', function (req, res, next) {
    var errorText;
    try {
        var ProductSearchModel = require('dw/catalog/ProductSearchModel');
        var form = req.form;
        var item = form.items;
        var jsonVal = JSON.parse(item);

        // Fetch the Catalog List
        var catalogList = jsonVal.Catalog;
        var jobCatalog;
        if (!empty(catalogList)) {
            jobCatalog = {
                catalogIDs: [catalogList]
            }
        }

        var TargetLanguageProductsListMap = [];

        for (var i = 0; i < Object.keys(jsonVal.FileIds).length; i++) {
            if (jsonVal.FileIds[i].cat_original_id !== undefined && jsonVal.FileIds[i].cat_original_id !== null && jsonVal.FileIds[i].cat_original_id !== '') {
                var catid = jsonVal.FileIds[i].cat_original_id;
                if (jsonVal.FileIds[i].tlang_code !== undefined && jsonVal.FileIds[i].tlang_code !== null && jsonVal.FileIds[i].tlang_code.length > 0) {
                    var languageList = jsonVal.FileIds[i].tlang_code;
                    var targetLangProductsMap = {};
                    var psm;
                    psm = new ProductSearchModel();
                    psm.setCategoryID(catid);
                    psm.search();
                    var products = psm.productSearchHits;
                    var productsArray = [];
                    while (products.hasNext()) {
                        var eachProduct = products.next();
                        productsArray.push(eachProduct.getProduct().ID);
                    }
                    targetLangProductsMap.TargetLanguage = languageList;
                    targetLangProductsMap.ProductsArray = productsArray;
                    TargetLanguageProductsListMap.push(targetLangProductsMap);
                }
            }
        }

        var targetLanguageProductIdListMapJson = JSON.stringify(TargetLanguageProductsListMap);
        var guid = SDLHelpers.createGuid();

        try {
            var authToken = SDLHelpers.getAuthToken();
            var siteCatalogs = authToken.SiteCatalogs;
            Transaction.wrap(function () {
                var objProject = CustomObjectMgr.createCustomObject('ProjectsDataForCreating', guid);
                if (!empty(objProject)) {
                    objProject.custom.CreateProjectJson = item;
                    objProject.custom.IsTMSProjectCreated = false;
                    if (!empty(jobCatalog) && jobCatalog.catalogIDs) {
                        objProject.custom.CatalogIdsList = JSON.stringify(jobCatalog);
                    } else if (!empty(siteCatalogs) && siteCatalogs !== '') {
                        objProject.custom.CatalogIdsList = siteCatalogs;
                    }
                    objProject.custom.ProjectType = 'Category Product';
                    objProject.custom.TargetLanguageProductsListMap = targetLanguageProductIdListMapJson;
                }
            });
        } catch (error) {
            Logger.error('There was an error while creating and saving category product project data in custom oject : ' + error.stack);
            errorText = 'Please verify your credential or contact Administrator';
            res.json({ success: false, error: errorText });
            return next();
        }
    } catch (e) {
        Logger.error('There was an error while creating and saving category product project data in custom oject : ' + e.stack);
        errorText = 'Please verify your credential or contact Administrator';
        res.json({ success: false, error: errorText });
        return next();
    }
    res.json({ success: true });
    return next();
});

server.get('ProductOption', function (req, res, next) {
    try {
        var topLevelCategory = SDLHelpers.getTopLevelCategory();
        res.render('sdl/SDLProductOptions', {
            TopLevelCategory: topLevelCategory
        });
    } catch (e) {
        Logger.error('There was an error while loading the Product project view. : ' + e.stack);
        var errorText = 'Please verify your credential or contact Administrator';
        res.render('sdl/SDLGeneralError', {
            ProjectError: errorText
        });
    }
    return next();
});

server.get('ProductByCategory', function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var params = req.querystring;
    var catID = params.cat_id;
    var productList = [];
    var noProduct = [];
    try {
        var psm;
        psm = new ProductSearchModel();
        psm.setCategoryID(catID);
        psm.search();
        var prds = psm.productSearchHits;
        while (prds.hasNext()) {
            var prd = prds.next();
            productList.push(prd.product);
        }
        if (productList.length === 0) {
            noProduct.push(Resource.msgf('sdl.search.cat.no.product', 'SDLTranslation', null, catID));
        }
        var result = SDLHelpers.getsdlProjectOptions();
        var catalogList = SDLHelpers.getSDLCatalogList();
        if (!catalogList) {
            throw new Error('Catalog IDs are not configured in the SDL configuration page. Please setup it to proceed.');
        }
        if (empty(result.errorMessage)) {
            var jsonObj = JSON.parse(result.object);
            res.render('sdl/SDLCreateProductProject', {
                ProjectOption: jsonObj,
                ProductArray: productList,
                NoProductArray: noProduct,
                CatalogList: catalogList
            });
        } else {
            res.render('sdl/SDLGeneralError', {
                ProjectError: result.errorMessage
            });
        }
    } catch (e) {
        Logger.error('There was an error while while fetching the Product by Category : ' + e.stack);
        var errorText = 'Please verify your credential or contact Administrator';
        res.render('sdl/SDLGeneralError', {
            ProjectError: errorText
        });
    }
    return next();
});

server.post('SearchProd', function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var form = req.form;
    var searchprod = form.prodSearch;
    if (!searchprod || searchprod === '') {
        res.redirect(URLUtils.url('SDLTranslation-ProductCategoryOption'));
        return next();
    }
    try {
        var productArray = [];
        var noProduct = [];
        try {
            var searchProdArray = searchprod.split(',');
            for (let i = 0; i < searchProdArray.length; i++) {
                    var trimValue = searchProdArray[i];
                    var product = ProductMgr.getProduct(trimValue.trim());
                    if (product) {
                      productArray.push(product);
                /* var psm = new ProductSearchModel();
                var trimValue = searchProdArray[i];
                psm.setSearchPhrase(trimValue.trim());
                psm.search();
                if (psm.count > 0) {
                    var prds = psm.productSearchHits;
                    while (prds.hasNext()) {
                        var prd = prds.next();
                        productArray.push(prd.product);
                    } */
                    } else {
                        noProduct.push(searchProdArray[i]);
                }
            }
        } catch (e) {
            Logger.error('There was an error while searching product. : ' + e.stack);
            res.render('sdl/SDLGeneralError', {
                ProjectError: e.stack
            });
        }
        var result = SDLHelpers.getsdlProjectOptions();
        var catalogList = SDLHelpers.getSDLCatalogList();
        if (!catalogList) {
            throw new Error('Catalog IDs are not configured in the SDL configuration page. Please setup it to proceed.');
        }
        if (empty(result.errorMessage)) {
            var jsonObj = JSON.parse(result.object);
            res.render('sdl/SDLCreateProductProject', {
                ProjectOption: jsonObj,
                ProductArray: productArray,
                NoProductArray: noProduct,
                CatalogList: catalogList
            });
        } else {
            res.render('sdl/SDLGeneralError', {
                ProjectError: result.errorMessage
            });
        }
    } catch (e) {
        var errorText = 'Please verify your credential or contact Administrator';
        res.render('sdl/SDLGeneralError', {
            ProjectError: errorText
        });
    }
    return next();
});

server.post('SendProductProject', function (req, res, next) {
    var errorText = 'Please verify your credential or contact Administrator';
    try {
        var ProductSearchModel = require('dw/catalog/ProductSearchModel');
        var ProductMgr = require('dw/catalog/ProductMgr');
        // create directory if not exist
        SDLHelpers.createDirectory();
        // deleting previous existing files from impex upload folder if exist
        SDLHelpers.deleteExistingDirectory();

        var jsonVal;
        var siteCatalogs;

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

        var form = req.form;
        var item = form.items;
        jsonVal = JSON.parse(item);
        var jobOptionForTMS = jsonVal.JobOptions;

        // Fetch the Catalog List
        var catalogList = jsonVal.Catalog;
        var jobCatalog;
        if (!empty(catalogList)) {
            jobCatalog = {
                catalogIDs: [catalogList]
            }
        }

        var uploadResponseList = [];
        var targetLanguagesArray = [];

        if (Object.keys(jsonVal.FileIds).length < 500) {
            for (let i = 0; i < Object.keys(jsonVal.FileIds).length; i++) {
                if (jsonVal.FileIds[i].prod_original_id && !empty(jsonVal.FileIds[i].prod_original_id)) {
                    var productID = jsonVal.FileIds[i].prod_original_id;
                    /* var psm = new ProductSearchModel();
                    psm.setProductID(productID);
                    psm.search();*/
                    var product = ProductMgr.getProduct(productID);
                    if (product) {
                        // var productsList = psm.products;
                        if (!empty(jsonVal.FileIds[i].tlang_code) && jsonVal.FileIds[i].tlang_code.length > 0) {
                            targetLanguagesArray = jsonVal.FileIds[i].tlang_code;
                        }
                        // while (productsList.hasNext()) {
                            var eachProduct = product;
                            var productObj = {};
                            for (let j = 0; j < selectedProdAttrList.length; j++) {
                                var attr = selectedProdAttrList[j];
                                var attribute = attr.id;
                                if (attr.type === 'system' && eachProduct[attribute] !== undefined && !empty(eachProduct[attribute])) {
                                    if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '33') {
                                        let enumValue = new ArrayList(eachProduct[attribute]);
                                        let multiDisplayVal = new ArrayList();
                                        for (let k = 0; k < enumValue.length; k++) {
                                            multiDisplayVal.add(enumValue[k].value);
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
                                        for (let k = 0; k < enumValue.length; k++) {
                                            multiDisplayVal.add(enumValue[k].value);
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

                            var xmlStr = SDLHelpers.buildXMLString(eachProduct.ID, productObj);
                            if (!empty(xmlStr) && xmlStr !== '') {
                                try {
                                    var theAuthToken = SDLHelpers.getAuthToken();
                                    var uploadparms = {};
                                    let sdlConfigurationDetails = theAuthToken.TMSCredentials;
                                    let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                                    uploadparms.access_token = theAuthToken.access_token;
                                    uploadparms.token_type = theAuthToken.token_type;
                                    uploadparms.xmlname = eachProduct.ID.replace(/[^1-9a-zA-Z]/g, '_') + '.xml';
                                    uploadparms.xmlstr = xmlStr;
                                    uploadparms.joboption = jobOptionForTMS;
                                    uploadparms.Base_url = sdlConfiguration.Base_url;
                                    var fileResponseFromTMS = SDLHelpers.uploadFileToTMS(uploadparms);
                                    if (fileResponseFromTMS !== undefined && fileResponseFromTMS !== null && fileResponseFromTMS !== '') {
                                        var fileDetails = {};
                                        fileDetails.fileId = fileResponseFromTMS.FileId;
                                        fileDetails.targets = targetLanguagesArray;
                                        uploadResponseList.push(fileDetails);
                                    }
                                } catch (e) {
                                    Logger.error('There was an error while creating Product TMS project. : ' + e.stack);
                                    errorText = 'Please verify your credential or contact Administrator';
                                    res.json({ success: false, error: errorText });
                                    return next();
                                }
                            }
                    }
                }
            }
            if (!empty(jsonVal) && !empty(uploadResponseList) && uploadResponseList.length > 0) {
                var createProjectObj = {};
                createProjectObj.Description = jsonVal.Description;
                createProjectObj.Files = uploadResponseList;
                createProjectObj.ProjectOptionsId = jsonVal.JobOptions;
                if (jsonVal.Metadata && jsonVal.Metadata.length > 0) {
                    createProjectObj.Metadata = jsonVal.Metadata;
                } else {
                    createProjectObj.Metadata = null;
                }
                createProjectObj.Name = jsonVal.Name;
                createProjectObj.DueDate = jsonVal.DueDate;
                createProjectObj.SrcLang = jsonVal.SrcLang;
                var jsonString = JSON.stringify(createProjectObj);
                try {
                    var authToken = SDLHelpers.getAuthToken();
                    var objToken = authToken.access_token;
                    var objType = authToken.token_type;
                    let sdlConfigurationDetails = authToken.TMSCredentials;
                    let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                    siteCatalogs = authToken.SiteCatalogs;
                    var service = ServiceMgr.tMSPost();
                    service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects';
                    service.addHeader('Authorization', objType + ' ' + objToken);
                    service.addHeader('Content-Type', 'application/json');
                    var result = service.call(jsonString);
                    if (empty(result.errorMessage)) {
                        try {
                            var createProjectResponse = result.object;
                            var response = JSON.parse(createProjectResponse);
                            if (!empty(response)) {
                                let guid = SDLHelpers.createGuid();
                                Transaction.wrap(function () {
                                    var objProject = CustomObjectMgr.createCustomObject('Project', guid);
                                    if (!empty(objProject)) {
                                        objProject.custom.ProjectName = jsonVal.Name;
                                        objProject.custom.ProjectStatus = 'Preparing';
                                        objProject.custom.IsTranslationHistoryCreated = false;
                                        objProject.custom.IsAutoDownload = true;
                                        objProject.custom.TMSProjectID = response.ProjectId;
                                        if (!empty(jobCatalog) && jobCatalog.catalogIDs) {
                                            objProject.custom.CatalogIdsList = JSON.stringify(jobCatalog);
                                        } else if (!empty(siteCatalogs) && siteCatalogs !== '') {
                                            objProject.custom.CatalogIdsList = siteCatalogs;
                                        }
                                        objProject.custom.ProjectType = 'Product';
                                    }
                                });
                            }
                        } catch (error) {
                            Logger.error('There was an error while creating Product project data TMS project. : ' + error.stack);
                            errorText = 'Please verify your credential or contact Administrator';
                            res.json({ success: false, error: errorText });
                            return next();
                        }
                    } else {
                        errorText = 'Please verify your credential or contact Administrator';
                        res.json({ success: false, error: errorText });
                        return next();
                    }
                } catch (e) {
                    Logger.error('There was an error while creating Product data TMS project. : ', e.stack);
                    errorText = 'Please verify your credential or contact Administrator';
                    res.json({ success: false, error: errorText });
                    return next();
                }
            }
        } else {
            jsonVal = JSON.parse(item);
            var TargetLanguageProductsListMap = [];
            for (let i = 0; i < Object.keys(jsonVal.FileIds).length; i++) {
                if (!empty(jsonVal.FileIds[i].prod_original_id) && jsonVal.FileIds[i].prod_original_id !== '') {
                    var pid = jsonVal.FileIds[i].prod_original_id;
                    var languageList = jsonVal.FileIds[i].tlang_code;
                    var targetLangProductsMap = {};
                    var productsArray = [];
                    productsArray.push(pid);
                    targetLangProductsMap.TargetLanguage = languageList;
                    targetLangProductsMap.ProductsArray = productsArray;
                    TargetLanguageProductsListMap.push(targetLangProductsMap);
                }
            }
            var targetLanguageProductIdListMapJson = JSON.stringify(TargetLanguageProductsListMap);
            let guid = SDLHelpers.createGuid();
            Transaction.wrap(function () {
                var objProject = CustomObjectMgr.createCustomObject('ProjectsDataForCreating', guid);
                if (!empty(objProject)) {
                    objProject.custom.CreateProjectJson = item;
                    objProject.custom.IsTMSProjectCreated = false;
                    if (!empty(siteCatalogs) && siteCatalogs !== '') {
                        objProject.custom.CatalogIdsList = siteCatalogs;
                    }
                    objProject.custom.TargetLanguageProductsListMap = targetLanguageProductIdListMapJson;
                    objProject.custom.ProjectType = 'Product';
                }
            });
        }
    } catch (e) {
        Logger.error('There was an error while creating Product data TMS project. : ' + e.stack);
        errorText = 'Please verify your credential or contact Administrator';
        res.json({ success: false, error: errorText });
        return next();
    }
    res.json({ success: true });
    return next();
});

server.get('ContentAssetList', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    const PRIVATE_LIBRARY = 'Library';
    try {
        var library = ContentMgr.getSiteLibrary();
        var folder = library.getRoot();
        var subFolders = folder.getSubFolders();
        var contents = new ArrayList();
        if (subFolders.length > 0) {
            contents.addAll(SDLHelpers.getContentFromSubFolders(subFolders));
        }
        contents.addAll(folder.getContent());
        var siteLibraries = SDLHelpers.getSDLSiteLibraries();
        if (!siteLibraries) {
            throw new Error('Site assigned Library is not configured in the SDL configuration page. Please setup it.');
        }
        if (siteLibraries.libraryIDs) {
            siteLibraries.libraryIDs.push(PRIVATE_LIBRARY);
        }
        var result = SDLHelpers.getsdlProjectOptions();
        if (empty(result.errorMessage)) {
            var jsonObj = JSON.parse(result.object);
            res.render('sdl/SDLContentOptions', {
                ProjectOption: jsonObj,
                SiteLibraries: siteLibraries.libraryIDs,
                ContentAssetArray: contents.iterator()
            });
        } else {
            Logger.error('There was an error while loading the Content project view. : ' + result.errorMessage);
            var errorText = 'Please verify your credential or contact Administrator';
            res.render('sdl/SDLGeneralError', {
                ProjectError: errorText
            });
        }
    } catch (e) {
        Logger.error('There was an error while loading the Content project view. : ' + e.stack);
        res.render('sdl/SDLGeneralError', {
            ProjectError: e.stack
        });
    }
    return next();
});

server.post('SendContentAssestsProject', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    try {
        // create directory if not exist
        SDLHelpers.createDirectory();
        // deleting previous existing files from impex upload folder if exist
        SDLHelpers.deleteExistingDirectory();
        var errorText;

        var typeCode = ['33', '23'];
        var SDLCredObject = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
        var selectedContentAttr;
        var selectedContentAttrList = new ArrayList();
        if (!empty(SDLCredObject) && !empty(SDLCredObject.custom.translatableContentAttributes)) {
            selectedContentAttr = JSON.parse(SDLCredObject.custom.translatableContentAttributes);
            for (let i = 0; i < selectedContentAttr.length; i++) {
                var contentAttr = selectedContentAttr[i];
                selectedContentAttrList.add(contentAttr);
            }
        }

        var item = request.httpParameterMap.items.stringValue;
        var jsonVal = JSON.parse(item);
        // Fetch the Library ID
        var siteLibrary = jsonVal.Library;
        var projectLib;
        if (!empty(siteLibrary)) {
            projectLib = {
                libraryIDs: [siteLibrary]
            }
        }
        var jobOptionForTMS = jsonVal.JobOptions;
        var uploadResponseList = [];
        var targetLanguagesArray = [];
        for (let i = 0; i < Object.keys(jsonVal.FileIds).length; i++) {
            if (!empty(jsonVal.FileIds[i].original_casset_id) && jsonVal.FileIds[i].original_casset_id !== '') {
                if (!empty(jsonVal.FileIds[i].tlang_code) && jsonVal.FileIds[i].tlang_code.length > 0) {
                    targetLanguagesArray = jsonVal.FileIds[i].tlang_code;
                }
                var eachAssestID = jsonVal.FileIds[i].original_casset_id;
                var eachContentAsset = ContentMgr.getContent(eachAssestID);
                var assetObj = {};

                for (let j = 0; j < selectedContentAttrList.length; j++) {
                    var attr = selectedContentAttrList[j];
                    var attribute = attr.id;
                    if (attr.type === 'system' && eachContentAsset[attribute] !== undefined && !empty(eachContentAsset[attribute])) {
                        if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '33') {
                            let enumValue = new ArrayList(eachContentAsset[attribute]);
                            let multiDisplayVal = new ArrayList();
                            for (let k = 0; k < enumValue.length; k++) {
                                multiDisplayVal.add(enumValue[k].value);
                            }
                            assetObj[attribute] = multiDisplayVal.join('^');
                        } else if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '23') {
                            let setOfStringData = new ArrayList(eachContentAsset[attribute]);
                            assetObj[attribute] = setOfStringData.join('~');
                        } else {
                            assetObj[attribute] = eachContentAsset[attribute];
                        }
                    } else if (attr.type === 'custom' && eachContentAsset.custom[attribute] !== undefined && !empty(eachContentAsset.custom[attribute])) {
                        if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '33') {
                            let enumValue = new ArrayList(eachContentAsset.custom[attribute]);
                            let multiDisplayVal = new ArrayList();
                            for (let k = 0; k < enumValue.length; k++) {
                                multiDisplayVal.add(enumValue[k].value);
                            }
                            assetObj[attribute] = multiDisplayVal.join('^');
                        } else if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '23') {
                            let setOfStringData = new ArrayList(eachContentAsset.custom[attribute]);
                            assetObj[attribute] = setOfStringData.join('~');
                        } else if (attr.typecode === '5') {
                            assetObj[attribute] = eachContentAsset.custom[attribute].source;
                        } else {
                            assetObj[attribute] = eachContentAsset.custom[attribute];
                        }
                    }
                }

                var xmlStr = SDLHelpers.buildXMLString(eachAssestID, assetObj);
                if (!empty(xmlStr) && xmlStr !== '') {
                    try {
                        var theAuthToken = SDLHelpers.getAuthToken();
                        let sdlConfigurationDetails = theAuthToken.TMSCredentials;
                        let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                        var uploadparms = {};
                        uploadparms.access_token = theAuthToken.access_token;
                        uploadparms.token_type = theAuthToken.token_type;
                        uploadparms.xmlname = eachAssestID.replace(/[^1-9a-zA-Z]/g, '_') + '.xml';
                        uploadparms.xmlstr = xmlStr;
                        uploadparms.joboption = jobOptionForTMS;
                        uploadparms.Base_url = sdlConfiguration.Base_url;
                        var fileResponseFromTMS = SDLHelpers.uploadFileToTMS(uploadparms);
                        if (!empty(fileResponseFromTMS) && fileResponseFromTMS !== '') {
                            var fileDetails = {};
                            fileDetails.fileId = fileResponseFromTMS.FileId;
                            fileDetails.targets = targetLanguagesArray;
                            uploadResponseList.push(fileDetails);
                        }
                    } catch (e) {
                        Logger.error('There was an error while creating the Content Project in TMS. : ' + e.stack);
                        errorText = 'Please verify your credential or contact Administrator';
                        res.json({ success: false, error: errorText });
                        return next();
                    }
                }
            }
        }
        if (!empty(jsonVal) && !empty(uploadResponseList) && uploadResponseList.length > 0) {
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
            try {
                var authToken = SDLHelpers.getAuthToken();
                let sdlConfigurationDetails = authToken.TMSCredentials;
                let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                var siteLibraries = authToken.SiteLibraries;
                var objToken = authToken.access_token;
                var objType = authToken.token_type;
                var service = ServiceMgr.tMSPost();
                service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects';
                service.addHeader('Authorization', objType + ' ' + objToken);
                service.addHeader('Content-Type', 'application/json');
                var result = service.call(jsonString);
                if (empty(result.errorMessage)) {
                    try {
                        var createProjectResponse = result.object;
                        var response = JSON.parse(createProjectResponse);
                        if (!empty(response)) {
                            var guid = SDLHelpers.createGuid();
                            Transaction.wrap(function () {
                                var objProject = CustomObjectMgr.createCustomObject('Project', guid);
                                if (!empty(objProject)) {
                                    objProject.custom.ProjectName = jsonVal.Name;
                                    objProject.custom.ProjectStatus = 'Preparing';
                                    objProject.custom.IsTranslationHistoryCreated = false;
                                    objProject.custom.IsAutoDownload = true;
                                    objProject.custom.TMSProjectID = response.ProjectId;
                                    if (!empty(projectLib) && projectLib.libraryIDs) {
                                        objProject.custom.CatalogIdsList = JSON.stringify(projectLib);
                                    } else if (!empty(siteLibraries) && siteLibraries !== '') {
                                        objProject.custom.CatalogIdsList = siteLibraries;
                                    }
                                    objProject.custom.ProjectType = 'Content-Asset';
                                }
                            });
                        }
                    } catch (e) {
                        Logger.error('There was an error while creating the Content Project in TMS. : ' + e.stack);
                        errorText = 'Please verify your credential or contact Administrator';
                        res.json({ success: false, error: errorText });
                        return next();
                    }
                } else {
                    res.json({ success: false, error: result.errorMessage });
                    return next();
                }
            } catch (e) {
                Logger.error('There was an error while creating the Content Project in TMS. : ' + e.stack);
                errorText = 'Please verify your credential or contact Administrator';
                res.json({ success: false, error: errorText });
                return next();
            }
        }
    } catch (e) {
        Logger.error('There was an error while creating the Content Project in TMS. : ' + e.message);
        res.json({ success: false, error: e.stack });
        return next();
    }
    res.json({ success: true });
    return next();
});

server.get('SitePromotionsList', function (req, res, next) {
    var PromotionMgr = require('dw/campaign/PromotionMgr');

    try {
        var sitePromotions = PromotionMgr.getPromotions();
        var result = SDLHelpers.getsdlProjectOptions();
        if (empty(result.errorMessage)) {
            var jsonObj = JSON.parse(result.object);
            res.render('sdl/SDLPromotionlist', {
                ProjectOption: jsonObj,
                SitePromotions: sitePromotions.iterator()
            });
        } else {
            Logger.error('There was an error while loading the Site Promotion project view. : ' + result.errorMessage);
            var errorText = 'Please verify your credential or contact Administrator';
            res.render('sdl/SDLGeneralError', {
                ProjectError: errorText
            });
        }
    } catch (e) {
        Logger.error('There was an error while loading the Site Promotion project view. : ' + e.stack);
        res.render('sdl/SDLGeneralError', {
            ProjectError: e.stack
        });
    }
    return next();
});

server.post('SendPromotionsProjectForTMS', function (req, res, next) {
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var errorText;
    try {
        // create directory if not exist
        SDLHelpers.createDirectory();
        // deleting previous existing files from impex upload folder if exist
        SDLHelpers.deleteExistingDirectory();

        var typeCode = ['33', '23'];
        var SDLCredObject = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
        var selectedPromotionAttr;
        var selectedPromotionAttrList = new ArrayList();
        if (!empty(SDLCredObject) && !empty(SDLCredObject.custom.translatablePromotionAttributes)) {
            selectedPromotionAttr = JSON.parse(SDLCredObject.custom.translatablePromotionAttributes);
            for (let i = 0; i < selectedPromotionAttr.length; i++) {
                var promoAttr = selectedPromotionAttr[i];
                selectedPromotionAttrList.add(promoAttr);
            }
        }

        var item = request.httpParameterMap.items.stringValue;
        var jsonVal = JSON.parse(item);
        var jobOptionForTMS = jsonVal.JobOptions;
        var uploadResponseList = [];
        var targetLanguagesArray = [];
        for (let i = 0; i < Object.keys(jsonVal.FileIds).length; i++) {
            if (!empty(jsonVal.FileIds[i].original_promo_id) && jsonVal.FileIds[i].original_promo_id !== '') {
                if (!empty(jsonVal.FileIds[i].tlang_code) && jsonVal.FileIds[i].tlang_code.length > 0) {
                    targetLanguagesArray = jsonVal.FileIds[i].tlang_code;
                }
                var eachPromotionID = jsonVal.FileIds[i].original_promo_id;
                var eachPromotion = PromotionMgr.getPromotion(eachPromotionID);
                var promoObj = {};

                for (let j = 0; j < selectedPromotionAttrList.length; j++) {
                    var attr = selectedPromotionAttrList[j];
                    var attribute = attr.id;
                    if (attr.type === 'system' && eachPromotion[attribute] !== undefined && !empty(eachPromotion[attribute])) {
                        if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '33') {
                            let enumValue = new ArrayList(eachPromotion[attribute]);
                            let multiDisplayVal = new ArrayList();
                            for (let k = 0; k < enumValue.length; k++) {
                                multiDisplayVal.add(enumValue[k].value);
                            }
                            promoObj[attribute] = multiDisplayVal.join('^');
                        } else if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '23') {
                            let setOfStringData = new ArrayList(eachPromotion[attribute]);
                            promoObj[attribute] = setOfStringData.join('~');
                        } else {
                            promoObj[attribute] = eachPromotion[attribute];
                        }
                    } else if (attr.type === 'custom' && eachPromotion.custom[attribute] !== undefined && !empty(eachPromotion.custom[attribute])) {
                        if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '33') {
                            let enumValue = new ArrayList(eachPromotion.custom[attribute]);
                            let multiDisplayVal = new ArrayList();
                            for (let k = 0; k < enumValue.length; k++) {
                                multiDisplayVal.add(enumValue[k].value);
                            }
                            promoObj[attribute] = multiDisplayVal.join('^');
                        } else if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '23') {
                            let setOfStringData = new ArrayList(eachPromotion.custom[attribute]);
                            promoObj[attribute] = setOfStringData.join('~');
                        } else if (attr.typecode === '5') {
                            promoObj[attribute] = eachPromotion.custom[attribute].source;
                        } else {
                            promoObj[attribute] = eachPromotion.custom[attribute];
                        }
                    }
                }
                var xmlStr = SDLHelpers.buildXMLString(eachPromotionID, promoObj);
                if (!empty(xmlStr) && xmlStr !== '') {
                    try {
                        var theAuthToken = SDLHelpers.getAuthToken();
                        let sdlConfigurationDetails = theAuthToken.TMSCredentials;
                        let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                        var uploadparms = {};
                        uploadparms.access_token = theAuthToken.access_token;
                        uploadparms.token_type = theAuthToken.token_type;
                        uploadparms.xmlname = eachPromotionID.replace(/[^1-9a-zA-Z]/g, '_') + '.xml';
                        uploadparms.xmlstr = xmlStr;
                        uploadparms.joboption = jobOptionForTMS;
                        uploadparms.Base_url = sdlConfiguration.Base_url;
                        var fileResponseFromTMS = SDLHelpers.uploadFileToTMS(uploadparms);
                        if (!empty(fileResponseFromTMS) && fileResponseFromTMS !== '') {
                            var fileDetails = {};
                            fileDetails.fileId = fileResponseFromTMS.FileId;
                            fileDetails.targets = targetLanguagesArray;
                            uploadResponseList.push(fileDetails);
                        }
                    } catch (e) {
                        Logger.error('There was an error while creating the Promotion Project in TMS. : ' + e.stack);
                        errorText = 'Please verify your credential or contact Administrator';
                        res.json({
                            success: false,
                            error: errorText
                        });
                        return next();
                    }
                }
            }
        }
        if (!empty(jsonVal) && !empty(uploadResponseList) && uploadResponseList.length > 0) {
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
            try {
                var authToken = SDLHelpers.getAuthToken();
                let sdlConfigurationDetails = authToken.TMSCredentials;
                let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                var objToken = authToken.access_token;
                var objType = authToken.token_type;
                var service = ServiceMgr.tMSPost();
                service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects';
                service.addHeader('Authorization', objType + ' ' + objToken);
                service.addHeader('Content-Type', 'application/json');
                var result = service.call(jsonString);
                if (empty(result.errorMessage)) {
                    try {
                        var createProjectResponse = result.object;
                        var response = JSON.parse(createProjectResponse);
                        if (!empty(response)) {
                            var guid = SDLHelpers.createGuid();
                            Transaction.wrap(function () {
                                var objProject = CustomObjectMgr.createCustomObject('Project', guid);
                                if (!empty(objProject)) {
                                    objProject.custom.ProjectName = jsonVal.Name;
                                    objProject.custom.ProjectStatus = 'Preparing';
                                    objProject.custom.IsTranslationHistoryCreated = false;
                                    objProject.custom.IsAutoDownload = true;
                                    objProject.custom.TMSProjectID = response.ProjectId;
                                    objProject.custom.ProjectType = 'Promotions';
                                }
                            });
                        }
                    } catch (e) {
                        Logger.error('There was an error while creating the Promotion Project in TMS. : ' + e.stack);
                        errorText = 'Please verify your credential or contact Administrator';
                        res.json({
                            success: false,
                            error: errorText
                        });
                        return next();
                    }
                } else {
                    res.json({
                        success: false,
                        error: result.errorMessage
                    });
                    return next();
                }
            } catch (e) {
                Logger.error('There was an error while creating the Promotion Project in TMS. : ' + e.stack);
                errorText = 'Please verify your credential or contact Administrator';
                res.json({
                    success: false,
                    error: errorText
                });
                return next();
            }
        }
    } catch (e) {
        Logger.error('There was an error while creating the Content Project in TMS. : ' + e.message);
        res.json({
            success: false,
            error: e.stack
        });
        return next();
    }
    res.json({
        success: true
    });
    return next();
});

server.get('SiteCampaignList', function (req, res, next) {
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var errorText;
    try {
        var siteCampaigns = PromotionMgr.getCampaigns();
        var result = SDLHelpers.getsdlProjectOptions();
        if (empty(result.errorMessage)) {
            var jsonObj = JSON.parse(result.object);
            res.render('sdl/SDLCampaignlist', {
                ProjectOption: jsonObj,
                SitePromotions: siteCampaigns.iterator()
            });
        } else {
            Logger.error('There was an error while loading the Site Campaign project view. : ' + result.errorMessage);
            errorText = 'Please verify your credential or contact Administrator';
            res.render('sdl/SDLGeneralError', {
                ProjectError: errorText
            });
        }
    } catch (e) {
        Logger.error('There was an error while loading the Site Campaign project view. : ' + e.stack);
        res.render('sdl/SDLGeneralError', {
            ProjectError: e.stack
        });
    }
    return next();
});

server.post('SendCampaignsProjectForTMS', function (req, res, next) {
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var errorText;
    try {
        // create directory if not exist
        SDLHelpers.createDirectory();
        // deleting previous existing files from impex upload folder if exist
        SDLHelpers.deleteExistingDirectory();

        var typeCode = ['33', '23'];
        var SDLCredObject = CustomObjectMgr.getCustomObject('SDL_Session', 'SDLTMSCredentials');
        var selectedCampaignAttr;
        var selectedCampaignAttrList = new ArrayList();
        if (!empty(SDLCredObject) && !empty(SDLCredObject.custom.translatableCampaignAttributes)) {
            selectedCampaignAttr = JSON.parse(SDLCredObject.custom.translatableCampaignAttributes);
            for (let i = 0; i < selectedCampaignAttr.length; i++) {
                var promoAttr = selectedCampaignAttr[i];
                selectedCampaignAttrList.add(promoAttr);
            }
        }

        var item = request.httpParameterMap.items.stringValue;
        var jsonVal = JSON.parse(item);
        var jobOptionForTMS = jsonVal.JobOptions;
        var uploadResponseList = [];
        var targetLanguagesArray = [];
        for (let i = 0; i < Object.keys(jsonVal.FileIds).length; i++) {
            if (!empty(jsonVal.FileIds[i].original_campaign_id) && jsonVal.FileIds[i].original_campaign_id !== '') {
                if (!empty(jsonVal.FileIds[i].tlang_code) && jsonVal.FileIds[i].tlang_code.length > 0) {
                    targetLanguagesArray = jsonVal.FileIds[i].tlang_code;
                }
                var eachCampaignIDFormatted = jsonVal.FileIds[i].campaign_id;
                var eachCampaignID = jsonVal.FileIds[i].original_campaign_id;
                eachCampaignID = unescape(eachCampaignID);
                var eachCampaign = PromotionMgr.getCampaign(eachCampaignID);
                var campaignObj = {};
                for (let j = 0; j < selectedCampaignAttrList.length; j++) {
                    var attr = selectedCampaignAttrList[j];
                    var attribute = attr.id;
                    if (attr.type === 'system' && eachCampaign[attribute] !== undefined && !empty(eachCampaign[attribute])) {
                        if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '33') {
                            let enumValue = new ArrayList(eachCampaign[attribute]);
                            let multiDisplayVal = new ArrayList();
                            for (let k = 0; k < enumValue.length; k++) {
                                multiDisplayVal.add(enumValue[k].value);
                            }
                            campaignObj[attribute] = multiDisplayVal.join('^');
                        } else if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '23') {
                            let setOfStringData = new ArrayList(eachCampaign[attribute]);
                            campaignObj[attribute] = setOfStringData.join('~');
                        } else {
                            campaignObj[attribute] = eachCampaign[attribute];
                        }
                    } else if (attr.type === 'custom' && eachCampaign.custom[attribute] !== undefined && !empty(eachCampaign.custom[attribute])) {
                        if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '33') {
                            let enumValue = new ArrayList(eachCampaign.custom[attribute]);
                            let multiDisplayVal = new ArrayList();
                            for (let k = 0; k < enumValue.length; k++) {
                                multiDisplayVal.add(enumValue[k].value);
                            }
                            campaignObj[attribute] = multiDisplayVal.join('^');
                        } else if (typeCode.indexOf(attr.typecode) > -1 && attr.typecode === '23') {
                            let setOfStringData = new ArrayList(eachCampaign.custom[attribute]);
                            campaignObj[attribute] = setOfStringData.join('~');
                        } else if (attr.typecode === '5') {
                            campaignObj[attribute] = eachCampaign.custom[attribute].source;
                        } else {
                            campaignObj[attribute] = eachCampaign.custom[attribute];
                        }
                    }
                }
                var xmlStr = SDLHelpers.buildXMLString(eachCampaignID, campaignObj);
                if (!empty(xmlStr) && xmlStr !== '') {
                    try {
                        var theAuthToken = SDLHelpers.getAuthToken();
                        let sdlConfigurationDetails = theAuthToken.TMSCredentials;
                        let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                        var uploadparms = {};
                        uploadparms.access_token = theAuthToken.access_token;
                        uploadparms.token_type = theAuthToken.token_type;
                        uploadparms.xmlname = eachCampaignIDFormatted + '.xml';
                        uploadparms.xmlstr = xmlStr;
                        uploadparms.joboption = jobOptionForTMS;
                        uploadparms.Base_url = sdlConfiguration.Base_url;
                        var fileResponseFromTMS = SDLHelpers.uploadFileToTMS(uploadparms);
                        if (!empty(fileResponseFromTMS) && fileResponseFromTMS !== '') {
                            var fileDetails = {};
                            fileDetails.fileId = fileResponseFromTMS.FileId;
                            fileDetails.targets = targetLanguagesArray;
                            uploadResponseList.push(fileDetails);
                        }
                    } catch (e) {
                        Logger.error('There was an error while creating the Campaign Project in TMS. : ' + e.stack);
                        errorText = 'Please verify your credential or contact Administrator';
                        res.json({
                            success: false,
                            error: errorText
                        });
                        return next();
                    }
                }
            }
        }
        if (!empty(jsonVal) && !empty(uploadResponseList) && uploadResponseList.length > 0) {
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
            try {
                var authToken = SDLHelpers.getAuthToken();
                let sdlConfigurationDetails = authToken.TMSCredentials;
                let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                var objToken = authToken.access_token;
                var objType = authToken.token_type;
                var service = ServiceMgr.tMSPost();
                service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects';
                service.addHeader('Authorization', objType + ' ' + objToken);
                service.addHeader('Content-Type', 'application/json');
                var result = service.call(jsonString);
                if (empty(result.errorMessage)) {
                    try {
                        var createProjectResponse = result.object;
                        var response = JSON.parse(createProjectResponse);
                        if (!empty(response)) {
                            var guid = SDLHelpers.createGuid();
                            Transaction.wrap(function () {
                                var objProject = CustomObjectMgr.createCustomObject('Project', guid);
                                if (!empty(objProject)) {
                                    objProject.custom.ProjectName = jsonVal.Name;
                                    objProject.custom.ProjectStatus = 'Preparing';
                                    objProject.custom.IsTranslationHistoryCreated = false;
                                    objProject.custom.IsAutoDownload = true;
                                    objProject.custom.TMSProjectID = response.ProjectId;
                                    objProject.custom.ProjectType = 'Campaigns';
                                }
                            });
                        }
                    } catch (e) {
                        Logger.error('There was an error while creating the Campaigns Project in TMS. : ' + e.stack);
                        errorText = 'Please verify your credential or contact Administrator';
                        res.json({
                            success: false,
                            error: errorText
                        });
                        return next();
                    }
                } else {
                    res.json({
                        success: false,
                        error: result.errorMessage
                    });
                    return next();
                }
            } catch (e) {
                Logger.error('There was an error while creating the Campaigns Project in TMS. : ' + e.stack);
                errorText = 'Please verify your credential or contact Administrator';
                res.json({
                    success: false,
                    error: errorText
                });
                return next();
            }
        }
    } catch (e) {
        Logger.error('There was an error while creating the Content Project in TMS. : ' + e.message);
        res.json({
            success: false,
            error: e.stack
        });
        return next();
    }
    res.json({
        success: true
    });
    return next();
});

server.get('Dictionary', function (req, res, next) {
    try {
        res.render('sdl/SDLDictionaryTranslationConfig');
    } catch (e) {
        Logger.error('There was an error loading the Dictionary view : ' + e.message);
        res.render('sdl/SDLGeneralError', {
            ProjectError: e.stack
        });
    }
    return next();
});

server.post('FindDictionary', function (req, res, next) {
    var WebDAVClient = require('dw/net/WebDAVClient');
    try {
        var params = req.form;
        var sdlCartridgeName = params.sdlCartridgeName;
        var sdlCodeVersion = params.sdlCodeVersion;
        var sdlWebDAVURL = params.sdlWebDAVURL;
        var sdlUserName = params.sdlUserName;
        var sdlPassword = params.sdlPassword;
        if (empty(sdlCartridgeName) || empty(sdlCodeVersion) || empty(sdlWebDAVURL) || empty(sdlUserName) || empty(sdlPassword)) {
            res.render('sdl/SDLDictionaryTranslationConfig', {
                Params: params,
                MissingConfiguration: Resource.msg('sdl.dictionary.missing.configuration.text', 'SDLTranslation', null),
                Error: true
            });
        }
        var prepareURL = sdlWebDAVURL;
        prepareURL += '/' + sdlCodeVersion + '/' + sdlCartridgeName + '/cartridge/templates/resources';
        var wdCleint = new WebDAVClient(prepareURL, sdlUserName, sdlPassword);
        var propertiesFiles = wdCleint.propfind('/');
        if (!empty(propertiesFiles) && propertiesFiles.length >= 1) {
            var propertiesFileNames = [];
            for (var i = 1; i < propertiesFiles.length; i++) {
                var propertyFile = propertiesFiles[i];
                if (propertyFile.name.charAt(propertyFile.name.indexOf('.') - 3) !== '_') {
                    propertiesFileNames.push(propertyFile.name);
                }
            }
            var result = SDLHelpers.getsdlProjectOptions();
            if (empty(result.errorMessage)) {
                try {
                    var jsonObj = JSON.parse(result.object);
                    res.render('sdl/SDLDictionaryCreateProject', {
                        ProjectOption: jsonObj,
                        PrepareURL: prepareURL,
                        SdlUserName: sdlUserName,
                        SdlPassword: sdlPassword,
                        PropertiesFileNames: propertiesFileNames
                    });
                } catch (e) {
                    Logger.error('There was an error loading the Dictionary view : ' + e.message);
                    res.render('sdl/SDLGeneralError', {
                        ProjectError: e
                    });
                }
            } else {
                Logger.error('There was an error loading the Dictionary view : ' + result.errorMessage);
                res.render('sdl/SDLGeneralError', {
                    ProjectError: result.errorMessage
                });
            }
        } else {
            res.render('sdl/SDLDictionaryTranslationConfig', {
                Params: params,
                MissingConfiguration: Resource.msg('sdl.dictionary.no.properties.file.found', 'SDLTranslation', null),
                Error: true
            });
        }
    } catch (e) {
        Logger.error('There was an error loading the Dictionary view : ' + e.message);
        res.render('sdl/SDLGeneralError', {
            ProjectError: e.stack
        });
    }
    return next();
});

server.post('SendDictioanryProject', function (req, res, next) {
    var WebDAVClient = require('dw/net/WebDAVClient');
    var HashMap = require('dw/util/HashMap');
    var errorText;
    try {
        // create directory if not exist
        SDLHelpers.createDirectory();
        // deleting previous existing files from impex upload folder if exist
        SDLHelpers.deleteExistingDirectory();

        var form = req.form;

        // WebDAV Client Connection open
        var resource = JSON.parse(form.resource);
        var wdCleint = new WebDAVClient(resource.ResourceURLUrl, resource.SdlUserName, resource.SdlPassword);
        var propertiesFiles = wdCleint.propfind('/');
        var propertiesFilesMap = new HashMap();
        if (!empty(propertiesFiles) && propertiesFiles.length >= 1) {
            for (let i = 1; i < propertiesFiles.length; i++) {
                var propertyFile = propertiesFiles[i];
                if (propertyFile.name.charAt(propertyFile.name.indexOf('.') - 3) !== '_') {
                    propertiesFilesMap.put(propertyFile.name, propertyFile);
                }
            }
        }

        var item = form.items;
        var jsonVal = JSON.parse(item);
        // var downloadType : String = jsonVal.DownloadType;
        var jobOptionForTMS = jsonVal.JobOptions;
        var uploadResponseList = [];
        var targetLanguagesArray = [];

        for (let i = 0; i < Object.keys(jsonVal.FileIds).length; i++) {
            if (!empty(jsonVal.FileIds[i].dict_id) && jsonVal.FileIds[i].dict_id !== '') {
                if (!empty(jsonVal.FileIds[i].tlang_code) && jsonVal.FileIds[i].tlang_code.length > 0) {
                    targetLanguagesArray = jsonVal.FileIds[i].tlang_code;
                }
                var eachPropertiesFileName = jsonVal.FileIds[i].dict_id + '.properties';
                var propertiesStr;
                if (propertiesFilesMap.containsKey(eachPropertiesFileName)) {
                    propertiesStr = wdCleint.get('/' + eachPropertiesFileName);
                }

                if (propertiesStr !== undefined && propertiesStr !== null && propertiesStr !== '') {
                    try {
                        var theAuthToken = SDLHelpers.getAuthToken();
                        let sdlConfigurationDetails = theAuthToken.TMSCredentials;
                        let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                        var uploadparms = {};
                        uploadparms.access_token = theAuthToken.access_token;
                        uploadparms.token_type = theAuthToken.token_type;
                        uploadparms.propertiesName = eachPropertiesFileName;
                        uploadparms.propertiesStr = propertiesStr;
                        uploadparms.joboption = jobOptionForTMS;
                        uploadparms.Base_url = sdlConfiguration.Base_url;
                        var fileResponseFromTMS = SDLHelpers.uploadPropertiesFileFileToTMS(uploadparms);
                        if (!empty(fileResponseFromTMS) && fileResponseFromTMS !== '') {
                            var fileDetails = {};
                            fileDetails.fileId = fileResponseFromTMS.FileId;
                            fileDetails.targets = targetLanguagesArray;
                            uploadResponseList.push(fileDetails);
                        }
                    } catch (e) {
                        Logger.error('There was an error while creating the Dictionary Project : ' + e.message);
                        errorText = 'Please verify your credential or contact Administrator';
                        res.json({ success: false, error: errorText });
                        return next();
                    }
                }
            }
        }

        if (!empty(jsonVal) && !empty(uploadResponseList) && uploadResponseList.length > 0) {
            var createProjectObj = {};
            createProjectObj.Description = jsonVal.Description;
            createProjectObj.Files = uploadResponseList;
            createProjectObj.ProjectOptionsId = jsonVal.JobOptions;
            if (jsonVal.Metadata !== undefined && jsonVal.Metadata.length > 0) {
                createProjectObj.Metadata = jsonVal.Metadata;
            } else {
                createProjectObj.Metadata = null;
            }
            createProjectObj.Name = jsonVal.Name;
            createProjectObj.DueDate = jsonVal.DueDate;
            createProjectObj.SrcLang = jsonVal.SrcLang;
            var jsonString = JSON.stringify(createProjectObj);
            try {
                var authToken = SDLHelpers.getAuthToken();
                let sdlConfigurationDetails = authToken.TMSCredentials;
                let sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                var siteLibraries = authToken.SiteLibraries;
                var objToken = authToken.access_token;
                var objType = authToken.token_type;
                var service = ServiceMgr.tMSPost();
                service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects';
                service.addHeader('Authorization', objType + ' ' + objToken);
                service.addHeader('Content-Type', 'application/json');
                var result = service.call(jsonString);
                if (empty(result.errorMessage)) {
                    try {
                        var createProjectResponse = result.object;
                        var response = JSON.parse(createProjectResponse);
                        if (response !== undefined && response !== null) {
                            var guid = SDLHelpers.createGuid();
                            Transaction.wrap(function () {
                                var objProject = CustomObjectMgr.createCustomObject('Project', guid);
                                if (!empty(objProject)) {
                                    objProject.custom.ProjectName = jsonVal.Name;
                                    objProject.custom.ProjectStatus = 'Preparing';
                                    objProject.custom.IsTranslationHistoryCreated = false;
                                    objProject.custom.IsAutoDownload = true;
                                    objProject.custom.TMSProjectID = response.ProjectId;
                                    if (siteLibraries !== undefined && siteLibraries !== null && siteLibraries !== '') {
                                        objProject.custom.CatalogIdsList = siteLibraries;
                                    }
                                    objProject.custom.ProjectType = 'Dictionary';
                                }
                            });
                        }
                    } catch (e) {
                        Logger.error('There was an error while creating the Dictionary Project : ', e.message);
                        errorText = 'Please verify your credential or contact Administrator';
                        res.json({ success: false, error: errorText });
                        return next();
                    }
                } else {
                    res.json({ success: false, error: result.errorMessage });
                    return next();
                }
            } catch (e) {
                Logger.error('There was an error while creating the Dictionary Project : ' + e.message);
                errorText = 'Please verify your credential or contact Administrator';
                res.json({ success: false, error: errorText });
                return next();
            }
        }
    } catch (e) {
        Logger.error('There was an error while creating the Dictionary Project : ' + e.message);
        res.json({ success: false, error: e.stack });
        return next();
    }
    res.json({ success: true });
    return next();
});

server.get('AllProjects', function (req, res, next) {
    try {
        var Calendar = require('dw/util/Calendar');
        var params = req.querystring;
        var sdlFlag = params.sdlAllProjFlag;

        var returnObj;

        if (sdlFlag === 1) {
            var approveID = params.sdlAllProjApproveID;
            returnObj = SDLHelpers.approveFunc(approveID);
        } else if (sdlFlag === 2) {
            var rejectID = params.sdlAllProjRejectID;
            returnObj = SDLHelpers.rejectFunc(rejectID);
        } else if (sdlFlag === 3) {
            var downloadID = params.sdlAllProjDownloadID;
            returnObj = SDLHelpers.downloadFunc(downloadID);
        }

        var auth = SDLHelpers.getAuthToken();
        var sdlConfigurationDetails = auth.TMSCredentials;
        var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
        var objToken = auth.access_token;
        var objType = auth.token_type;
        var service = ServiceMgr.tMSGet();
        service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects/List';
        service.addHeader('Authorization', objType + ' ' + objToken);
        service.addHeader('Content-Type', 'application/json');
        var result = service.call();

        if (empty(result.errorMessage)) {
            try {
                var jsonObj = JSON.parse(result.object);
                var filterObj = [];
                var dropDownValue = '';
                var filter = params.sdlAllProjFilter;
                if (filter === 'pa') {
                    for (let i = 0; i < jsonObj.length; i++) {
                        if (jsonObj[i].Status === 1) {
                            filterObj.push(jsonObj[i]);
                        }
                    }
                    dropDownValue = 'pa';
                } else if (filter === 'pd') {
                    for (let i = 0; i < jsonObj.length; i++) {
                        if (jsonObj[i].Status === 3) {
                            filterObj.push(jsonObj[i]);
                        }
                    }
                    dropDownValue = 'pd';
                } else if (filter === 'pp') {
                    for (let i = 0; i < jsonObj.length; i++) {
                        if (jsonObj[i].Status === 2) {
                            filterObj.push(jsonObj[i]);
                        }
                    }
                    dropDownValue = 'pp';
                } else {
                    filterObj = jsonObj;
                    dropDownValue = 'ap';
                }
                var mName = SDLHelpers.getMonths();

                for (let j = 0; j < filterObj.length; j++) {
                    // Creation Date
                    var creationDate = SDLHelpers.formatDate(filterObj[j].CreatedDate);
                    creationDate = new Date(creationDate);
                    var creationDateOfDate = creationDate.getDate();
                    var creationDateOfMonth = creationDate.getMonth();
                    var creationDateOfYear = creationDate.getFullYear();

                    var dueD = SDLHelpers.formatDate(filterObj[j].DueDate);
                    var dueDate = new Date(dueD);
                    var duecurrDate = dueDate.getDate();
                    var duecurrMonth = dueDate.getMonth();
                    var duecurrYear = dueDate.getFullYear();
                    filterObj[j].DueDate = mName[duecurrMonth] + ' ' + duecurrDate + ', ' + duecurrYear;
                    if (!empty(filterObj[j].DeliveredDate) && filterObj[j].DeliveredDate !== '' && dueDate.getTime() > 0) {
                        var deliveryD = SDLHelpers.formatDate(filterObj[j].DeliveredDate);
                        var deliveryDate = new Date(deliveryD);
                        var deliverycurrDate = deliveryDate.getDate();
                        var deliverycurrMonth = deliveryDate.getMonth();
                        var deliverycurrYear = deliveryDate.getFullYear();
                        filterObj[j].DeliveredDate = mName[deliverycurrMonth] + ' ' + deliverycurrDate + ', ' + deliverycurrYear;
                    }
                    filterObj[j].CreationFormattedDate = mName[creationDateOfMonth] + ' ' + creationDateOfDate + ', ' + creationDateOfYear;
                    filterObj[j].creationDate = creationDate;
                }
                // Sort based on creation date
                filterObj.sort(function (obj1, obj2) {
                    var c1 = new Calendar(obj1.creationDate);
                    var c2 = new Calendar(obj2.creationDate);
                    return c2.compareTo(c1);
                });

                res.render('sdl/SDLAllProjectList', {
                    ProjectList: filterObj,
                    ProjectFilter: dropDownValue,
                    returnObj: returnObj
                });
            } catch (e) {
                res.render('sdl/SDLGeneralError', {
                    ProjectError: e
                });
            }
        } else {
            res.render('sdl/SDLGeneralError', {
                ProjectError: result.errorMessage
            });
        }
    } catch (e) {
        Logger.error('There was an error loading the Dictionary view : ' + e.message);
        res.render('sdl/SDLGeneralError', {
            ProjectError: e.stack
        });
    }
    return next();
});

server.get('ProjetDetails', function (req, res, next) {
    try {
        var params = req.querystring;
        var prjId = params.sdlProjId;

        if (!empty(prjId)) {
            var auth = SDLHelpers.getAuthToken();
            var sdlConfigurationDetails = auth.TMSCredentials;
            var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
            var objToken = auth.access_token;
            var objType = auth.token_type;
            var service = ServiceMgr.tMSGet();
            service.URL = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects/' + prjId;
            service.addHeader('Authorization', objType + ' ' + objToken);
            service.addHeader('Content-Type', 'application/json');
            var result = service.call();

            if (empty(result.errorMessage)) {
                try {
                    var jsonObj = JSON.parse(result.object);
                    var currentDate = new Date().getTime();
                    var created = SDLHelpers.formatDate(jsonObj.CreatedDate);
                    var createdDate = new Date(created);
                    var createdDiffTime = Math.abs(currentDate - createdDate);
                    var createdDiffDays = parseInt(createdDiffTime / (1000 * 3600 * 24), 10);
                    jsonObj.CreatedDate = createdDiffDays + ' days ago';
                    var deliveryD = SDLHelpers.formatDate(jsonObj.DeliveredDate);
                    var deliveryDate = new Date(deliveryD);
                    var monthNames = SDLHelpers.getMonths();
                    var deliverycurrDate = deliveryDate.getDate();
                    var deliverycurrMonth = deliveryDate.getMonth();
                    var deliverycurrYear = deliveryDate.getFullYear();
                    var deliverycurrHour = deliveryDate.getHours();
                    var deliverycurrMinute = SDLHelpers.padValue(deliveryDate.getMinutes());
                    var deliverycurrAMPM = 'AM';
                    var deliverycurriHourCheck = parseInt(deliverycurrHour, 10);
                    if (deliverycurriHourCheck > 12) {
                        deliverycurrAMPM = 'PM';
                        deliverycurrHour = deliverycurriHourCheck - 12;
                    } else if (deliverycurriHourCheck === 0) {
                        deliverycurrHour = '12';
                    }

                    deliverycurrHour = SDLHelpers.padValue(deliverycurrHour);
                    if (deliveryDate.getTime() > 0) {
                        jsonObj.DeliveredDate = monthNames[deliverycurrMonth] + ' ' + deliverycurrDate + ', ' + deliverycurrYear + ' ' + deliverycurrHour + ':' + deliverycurrMinute + ' ' + deliverycurrAMPM;
                    } else {
                        jsonObj.DeliveredDate = '';
                    }

                    if (deliveryDate.getTime() <= currentDate) {
                        jsonObj.delivarStatusClass = 1;
                    } else {
                        jsonObj.delivarStatusClass = 2;
                    }

                    var dueD = SDLHelpers.formatDate(jsonObj.DueDate);
                    var dueDate = new Date(dueD);
                    var dueDatecurrDate = dueDate.getDate();
                    var dueDatecurrMonth = dueDate.getMonth();
                    var dueDatecurrYear = dueDate.getFullYear();
                    var dueDatecurrHour = dueDate.getHours();
                    var dueDatecurrMinute = SDLHelpers.padValue(dueDate.getMinutes());
                    var dueDatecurrAMPM = 'AM';
                    var dueDatecurriHourCheck = parseInt(dueDatecurrHour, 10);

                    if (dueDatecurriHourCheck > 12) {
                        dueDatecurrAMPM = 'PM';
                        dueDatecurrHour = dueDatecurriHourCheck - 12;
                    } else if (dueDatecurriHourCheck === 0) {
                        dueDatecurrHour = '12';
                    }

                    dueDatecurrHour = SDLHelpers.padValue(dueDatecurrHour);
                    jsonObj.DueDate = monthNames[dueDatecurrMonth] + ' ' + dueDatecurrDate + ', ' + dueDatecurrYear + ' ' + dueDatecurrHour + ':' + dueDatecurrMinute + ' ' + dueDatecurrAMPM;
                    if (dueDate.getTime() <= currentDate) {
                        jsonObj.deuStatusClass = 1;
                    } else {
                        jsonObj.deuStatusClass = 2;
                    }
                    var sdlFilter = params.sdlProjFilter;

                    res.render('sdl/SDLProjectDetails', {
                        ProjectDetails: jsonObj,
                        ProjFilter: sdlFilter
                    });
                } catch (e) {
                    res.render('sdl/SDLGeneralError', {
                        ProjectError: e
                    });
                }
            } else {
                res.render('sdl/SDLGeneralError', {
                    ProjectError: result.errorMessage
                });
            }
        } else {
            throw new Error('Project ID was not found.' + prjId);
        }
    } catch (e) {
        Logger.error('There was an error loading the Project Details view : ' + e.message);
        res.render('sdl/SDLGeneralError', {
            ProjectError: e.stack
        });
    }
    next();
});

module.exports = server.exports();
