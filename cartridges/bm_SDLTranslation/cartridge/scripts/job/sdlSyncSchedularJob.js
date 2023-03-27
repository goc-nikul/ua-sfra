'use strict';
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger').getLogger('SDL_translation', 'SDL_translation');
var SDLHelpers = require('*/cartridge/scripts/helpers/sdlHelpers');
var ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');


/**
 *  SDL SYNC schedular Job to sync the SDL Custom Object and TMS.
 */
exports.run = function () {
    var objIterator;
    try {
        objIterator = CustomObjectMgr.queryCustomObjects('Project', "custom.ProjectStatus != 'Completed' and custom.ProjectStatus != 'ForDownload' and custom.IsTranslationHistoryCreated = true", null);
        var projectIdsList = [];
        while (objIterator.hasNext()) {
            var eachProject = objIterator.next();
            var projectID = eachProject.getCustom().TMSProjectID;
            projectIdsList.push(projectID);
        }
        objIterator.close();

        if (projectIdsList.length > 0) {
            var authToken = SDLHelpers.getAuthToken();
            if (!authToken) {
                throw new Error('Auth Token Could not found. Please check the Custom ERROR LOGS.');
            }
            var objToken = authToken.access_token;
            var objType = authToken.token_type;
            var sdlConfigurationDetails = authToken.TMSCredentials;
            var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
            var endPoint = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects/fetch';
            var service = ServiceMgr.tMSPost();
            service.URL = endPoint;
            service.addHeader('Authorization', objType + ' ' + objToken);
            service.addHeader('Content-Type', 'application/json');
            var result = service.call(JSON.stringify(projectIdsList));
            if (empty(result.errorMessage)) {
                try {
                    var getAllProjectsData = result.object;
                    var response = JSON.parse(getAllProjectsData);
                    if (!empty(response) && response.length > 0) {
                        for (let i = 0; i < response.length; i++) {
                            var langDetails = response[i].LanguagePairDetails;
                            var eachProjectID = response[i].Id;
                            var eachProjectStatus = response[i].Status;
                            let eachFileReadyForDownalod = false;
                            if (!empty(langDetails) && langDetails.length > 0) {
                                for (let j = 0; j < langDetails.length; j++) {
                                    var TargetLanguage = langDetails[j].Language.Name;
                                    var targetLanguageCode = langDetails[j].Language.CultureCode;
                                    var filesList = langDetails[j].Files;
                                    if (!empty(filesList) && filesList.length > 0) {
                                        for (let k = 0; k < filesList.length; k++) {
                                            var eachFile = filesList[k];
                                            try {
                                                Transaction.wrap(function () { // eslint-disable-line
                                                    var objtransHistory = CustomObjectMgr.getCustomObject('TranslationHistory', eachFile.Id);
                                                    if (!empty(objtransHistory)) {
                                                        objtransHistory.custom.TargetLanguage = TargetLanguage;
                                                        objtransHistory.custom.TragetLanguageCode = targetLanguageCode;
                                                        objtransHistory.custom.DownloadableFileID = eachFile.Id;
                                                        // IF File is already completed don't update the status.
                                                        if (empty(objtransHistory.custom.Status) || ('Status' in objtransHistory.custom && objtransHistory.custom.Status !== 'Completed')) {
                                                            let fileStatus = SDLHelpers.getProjectStatus(eachFile.Status);
                                                            objtransHistory.custom.Status = fileStatus;
                                                            if (fileStatus !== 'ForDownload') {
                                                                eachFileReadyForDownalod = false;
                                                            }
                                                        }
                                                    }
                                                });
                                            } catch (e) {
                                                Logger.error('There was an Error in Sync Schedular JOB while updating the Translation History Object:  ' + e.stack);
                                            }
                                        }
                                    }
                                }
                            }

                            try {
                                Transaction.wrap(function () { // eslint-disable-line
                                    var objectProj = CustomObjectMgr.getCustomObject('Project', eachProjectID);

                                    if (!empty(objectProj)) {
                                        let projectStatus = SDLHelpers.getProjectStatus(eachProjectStatus);
                                        if (!eachFileReadyForDownalod && projectStatus === 'ForDownload') {
                                            // If all the files in this project is not ready for download, don't update the Project status with For Download.
                                        } else {
                                            objectProj.custom.ProjectStatus = projectStatus;
                                        }
                                    }
                                });
                            } catch (e) {
                                Logger.error('There was an Error in Sync Schedular JOB while updating the Project Object: ' + e.stack);
                            }
                        }
                    }
                } catch (e) {
                    Logger.error('There was an Error in Sync Schedular JOB while Post processing of fetched TMS Data: ' + e.stack);
                }
            }
        }
    } catch (e) {
        if (objIterator) {
            objIterator.close();
        }
        Logger.error('There was an Error while executing the Sync Schedular JOB.: ' + e.stack);
    }
};
