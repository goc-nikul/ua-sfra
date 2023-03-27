'use strict';
module.exports.execute = function (jobParameters) {
    var Logger = require('dw/system/Logger');
    var Status = require('dw/system/Status');
    var Site = require('dw/system/Site');
    var ArrayList = require('dw/util/ArrayList');
    const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
    var filePathForTokenRefesh = 'filePathForTokenRefesh' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('filePathForTokenRefesh');
    var tokenHelpersFilePath;
    try {
        if (!empty(filePathForTokenRefesh)) {
            tokenHelpersFilePath = new ArrayList(filePathForTokenRefesh);
        } else if (isMAOEnabled) {
            tokenHelpersFilePath = ['int_marketing_cloud/cartridge/scripts/models/authToken.js', 'int_mao/cartridge/scripts/MAOAuthTokenHelper.js', 'int_VIP/cartridge/scripts/util/VIPAuthTokenHelper.js', 'int_first_data/cartridge/scripts/firstDataAuthTokenHelper.js'];
        } else {
            tokenHelpersFilePath = ['int_marketing_cloud/cartridge/scripts/models/authToken.js', 'int_VIP/cartridge/scripts/util/VIPAuthTokenHelper.js', 'int_first_data/cartridge/scripts/firstDataAuthTokenHelper.js'];
        }
        var tokenRefreshTime = (jobParameters && jobParameters.tokenRefreshTime) || 15;
        if (tokenHelpersFilePath) {
            for (var i = 0; i < tokenHelpersFilePath.length; i++) {
                var TokenHelper = require(tokenHelpersFilePath[i].trim());
                var tokenHelperObj = new TokenHelper();
                var tokenObj = tokenHelperObj.getValidToken();
                var tokenExpiryInMinutes = Math.floor(((tokenObj.expires - Date.now()) / 1000) / 60);
                // Refresh the token if it's going to expire in next 15(configurable in job Parameters) minutes.
                if (tokenExpiryInMinutes <= tokenRefreshTime) {
                    tokenHelperObj.refreshToken();
                }
            }
        }
    } catch (e) {
        Logger.error('Error in refreshAccessToken.js :: {0}', e.message);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
};
