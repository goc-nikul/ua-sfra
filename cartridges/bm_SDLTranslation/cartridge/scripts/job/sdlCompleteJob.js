'use strict';
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger').getLogger('SDL_translation', 'SDL_translation');
var SDLHelpers = require('*/cartridge/scripts/helpers/sdlHelpers');
var ServiceMgr = require('*/cartridge/scripts/services/ServiceMgr');

/**
 * SDL Delete Schedular JOB to delete the completed Project from the TMS Server.
 */
exports.run = function () {
    try {
        var objIterator = CustomObjectMgr.queryCustomObjects('Project', "custom.ProjectStatus = 'Completed'", null);
        while (objIterator.getCount() > 0 && objIterator.hasNext()) {
            var projID = objIterator.next().getCustom().ProjectID;
            var transHistoryQueryString1 = "custom.ProjectID = '" + projID + "'";
            var objTransHistoryItr1 = CustomObjectMgr.queryCustomObject('Project', transHistoryQueryString1, null);
            if (!empty(objTransHistoryItr1)) {
                var TMSProjectID = objTransHistoryItr1.getCustom().TMSProjectID;
                var auth = SDLHelpers.getAuthToken();
                if (!auth) {
                    throw new Error('Auth Token Could not found while Complte Job execution. Please check the Custom ERROR LOGS.');
                }
                var jsonString = {};
                var sdlConfigurationDetails = auth.TMSCredentials;
                var sdlConfiguration = JSON.parse(sdlConfigurationDetails);
                var endPoint = sdlConfiguration.Base_url + '/tm4lc/api/v1/projects/' + TMSProjectID;
                var objToken = auth.access_token;
                var objType = auth.token_type;
                var service = ServiceMgr.tMSDelete();
                service.setRequestMethod('DELETE');
                service.URL = endPoint;
                service.addHeader('Content-Type', 'application/x-www-form-urlencoded');
                service.addHeader('Authorization', objType + ' ' + objToken);
                var result = service.call(jsonString);
                if (empty(result.errorMessage)) {
                    try {
                        var filesQueryString = "custom.ProjectID = '" + TMSProjectID + "'";
                        var transHistoryIterator = CustomObjectMgr.queryCustomObjects('TranslationHistory', filesQueryString, null);
                        while (transHistoryIterator.getCount() > 0 && transHistoryIterator.hasNext()) {
                            var eachTransHistoryID = transHistoryIterator.next().getCustom().FileID;
                            Transaction.wrap(function () { // eslint-disable-line
                                var object = CustomObjectMgr.getCustomObject('TranslationHistory', eachTransHistoryID);
                                if (!empty(object)) {
                                    CustomObjectMgr.remove(object);
                                }
                            });
                        }
                        transHistoryIterator.close();

                        Transaction.wrap(function () { // eslint-disable-line
                            var cusObject = CustomObjectMgr.getCustomObject('Project', projID);
                            if (!empty(cusObject)) {
                                CustomObjectMgr.remove(cusObject);
                            }
                        });
                    } catch (e) {
                        Logger.error('There was an Error in Completion Schedular JOB while removing the Translation History/Project Object:  ' + e.stack);
                    }
                }
            }
        }
        objIterator.close();
    } catch (e) {
        Logger.error('There was an Error while executing the  Completion Schedular JOB.: ' + e.stack);
    }
};
