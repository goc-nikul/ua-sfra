'use strict';
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger').getLogger('SDL_translation', 'SDL_translation');
var SDLHelpers = require('*/cartridge/scripts/helpers/sdlHelpers');
var ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');

/**
 *  SDL Create Translation History Job.
 */
exports.run = function () {
    try {
        var objIterator = CustomObjectMgr.queryCustomObjects('Project', "custom.ProjectStatus = 'Preparing' and custom.IsTranslationHistoryCreated = false", null);
        while (objIterator.hasNext()) {
            var eachProject = objIterator.next();
            var eachProjectID = eachProject.getCustom().ProjectID;
            var projectID = eachProject.getCustom().TMSProjectID;
            var projectType = eachProject.getCustom().ProjectType;
            var siteCatalogs = eachProject.getCustom().CatalogIdsList;
            var authToken = SDLHelpers.getAuthToken();
            if (!authToken) {
                throw new Error('Auth Token Could not find while Transalation Job execution. Please check the Custom ERROR LOGS.');
            }
            var objToken = authToken.access_token;
            var objType = authToken.token_type;
            var sdlConfigurationDetails = authToken.TMSCredentials;
            var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
            var endPoint = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects/' + projectID;
            var service = ServiceMgr.tMSGet();
            service.URL = endPoint;
            service.addHeader('Authorization', objType + ' ' + objToken);
            service.addHeader('Content-Type', 'application/json');
            var result = service.call();
            if (empty(result.errorMessage)) {
                try {
                    var projectDetailsResponse = result.object;
                    var responseResult = JSON.parse(projectDetailsResponse);
                    if (responseResult && !empty(responseResult.LanguagePairDetails) && responseResult.LanguagePairDetails.length > 0) {
                        for (var i = 0; i < responseResult.LanguagePairDetails.length; i++) {
                            var filesList = responseResult.LanguagePairDetails[i].Files;
                            var TargetLanguage = responseResult.LanguagePairDetails[i].Language.Name;
                            var targetLanguageCode = responseResult.LanguagePairDetails[i].Language.CultureCode;
                            if (!empty(filesList) && filesList.length > 0) {
                                for (var j = 0; j < filesList.length; j++) {
                                    var eachFile = filesList[j];
                                   // var guid = SDLHelpers.createGuid();
                                    if (!empty(eachFile) && !empty(eachFile.Id)) {
                                        try {
                                            Transaction.wrap(function () { //eslint-disable-line
                                                var objtransHistory = CustomObjectMgr.getCustomObject('TranslationHistory', eachFile.Id);
                                                if (empty(objtransHistory)) {
                                                    objtransHistory = CustomObjectMgr.createCustomObject('TranslationHistory', eachFile.Id);
                                                }
                                                objtransHistory.custom.ArtifactID = eachFile.Name.split('.')[0];
                                                objtransHistory.custom.TargetLanguage = TargetLanguage;
                                                objtransHistory.custom.TragetLanguageCode = targetLanguageCode;
                                                objtransHistory.custom.DownloadableFileID = eachFile.Id;
                                                objtransHistory.custom.ArtifactType = SDLHelpers.getArtifactType(projectType);
                                                objtransHistory.custom.ProjectID = projectID;
                                                objtransHistory.custom.IsAutoDownload = true;
                                                if (!empty(siteCatalogs) && siteCatalogs !== '') {
                                                    objtransHistory.custom.CatalogIdsList = siteCatalogs;
                                                }
                                                objtransHistory.custom.Status = SDLHelpers.getProjectStatus(eachFile.Status);
                                            });
                                        } catch (e) {
                                            Logger.error('There was an Error in Create Translation History Schedular JOB while updating the Translation History Object for TMS project {0}:  ' + e.stack, projectID);
                                        }
                                    }
                                }
                                // updating the project custom object type
                                try {
                                    Transaction.wrap(function () { //eslint-disable-line
                                        var objectProj = CustomObjectMgr.getCustomObject('Project', eachProjectID);
                                        if (!empty(objectProj)) {
                                            objectProj.custom.IsTranslationHistoryCreated = true;
                                        } else {
                                            throw new Error('The Project {0} - {1} is either completed at TMS or deleted. Please check with your administator at SDL to remove it from the list.', eachProjectID, projectID);
                                        }
                                    });
                                } catch (e) {
                                    Logger.error('There was an Error in Create Translation History Schedular JOB while updating the Project Object:  ' + e.stack);
                                }
                            }
                        }
                    }
                } catch (e) {
                    Logger.error('There was an Error in Create Translation History JOB while Post processing of project creation in Translation History Object: ' + e.stack);
                }
            }
        }
        objIterator.close();
    } catch (e) {
        Logger.error('There was an Error while executing the Create Translation History.: ' + e.stack);
    }
};
