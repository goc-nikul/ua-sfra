'use strict';
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger').getLogger('SDL_translation', 'SDL_translation');
var downloadHelpers = require('*/cartridge/scripts/helpers/downloadHelpers');

exports.run = function () {
    var translationHistoryItr;
    try {
        // Query all Translation Object.
        translationHistoryItr = CustomObjectMgr.queryCustomObjects('TranslationHistory', "custom.Status = 'ForDownload' and custom.IsAutoDownload = true", null);
        while (translationHistoryItr.hasNext()) {
            var translationHistory = translationHistoryItr.next();
            var allCatalogs = translationHistory.getCustom().CatalogIdsList;
            Transaction.wrap(function () { // eslint-disable-line
                try {
                    if (translationHistory.getCustom().ArtifactType === 'Dictionary') {
                        downloadHelpers.downloadAndImportDictionary(translationHistory);
                    } else if (translationHistory.getCustom().ArtifactType === 'Promotions') {
                        downloadHelpers.downloadAndImportPromotion(translationHistory);
                    } else if (translationHistory.getCustom().ArtifactType === 'Campaigns') {
                        downloadHelpers.downloadAndImportCampaign(translationHistory);
                    } else if (translationHistory.getCustom().ArtifactType === 'Content-Asset') {
                        if (!empty(allCatalogs) && allCatalogs !== '') { // eslint-disable-line
                            var objectCatalogs = JSON.parse(allCatalogs);
                            for (var i = 0; i < objectCatalogs.libraryIDs.length; i++) {
                                downloadHelpers.downloadAndImportContentAsset(objectCatalogs.libraryIDs[i], translationHistory);
                            }
                        }
                    } else {
                        if (!empty(allCatalogs) && allCatalogs !== '') { // eslint-disable-line
                            var objCatalogs = JSON.parse(allCatalogs);
                            for (var k = 0; k < objCatalogs.catalogIDs.length; k++) {
                                downloadHelpers.downloadAndImportCatalog(objCatalogs.catalogIDs[k], translationHistory);
                            }
                        }
                    }
                } catch (error) {
                    Logger.error('There was an error while downloading the {0} project : ' + error.stack, translationHistory.custom.ProjectID);
                }
            });
        }
        translationHistoryItr.close();
    } catch (e) {
        Logger.error('There was an Error while executing the Download Schedular JOB.: ' + e.stack);
        if (!empty(translationHistoryItr)) { // eslint-disable-line
            translationHistoryItr.close();
        }
    }
};
