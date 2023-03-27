'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Logger = require('dw/system/Logger');

var tokenObj;
var Service = LocalServiceRegistry.createService('int_talkoot.http.talkoot', {

    createRequest: function (service, params) {
        var requestParams = [];
        if (params.endpoint !== 'session') {
            service.addHeader('Authorization', 'Basic ' + require('dw/util/StringUtils').encodeBase64(service.getConfiguration().getCredential().getUser() + ':' + tokenObj.token));
        }

        if (params.params) {
            // eslint-disable-next-line no-restricted-syntax
            for (let key in params.params) {
                if (Object.prototype.hasOwnProperty.call(params.params, key)) {
                    requestParams.push(key + '=' + params.params[key]);
                }
            }
        }

        service.setURL(service.getURL().replace(/api\S*$/, 'api/'));
        var newUrl = service.getURL() + params.endpoint;

        if (requestParams.length) {
            newUrl += '?' + requestParams.join('&');
        }
        if (params.paramsStr) {
            newUrl += (requestParams.length ? '&' : '?') + params.paramsStr;
        }

        service.setURL(newUrl);
        service.setRequestMethod(params.method || 'GET');
        return params;
    },

    parseResponse: function (service, resp) {
        if (!resp) {
            return null;
        }
        return JSON.parse(resp.text);
    }
});

/**
 * Gets a new token for the API calls
 * @return {Object} with token and expiration
 */
function authorize() {
    var resp = Service.call({ endpoint: 'session' });
    var tokenCO;
    if (!resp || !resp.object || !resp.object.SessionKey) {
        Logger.info('No Session');
        return null;
    }
    require('dw/system/Transaction').wrap(function () {
        Logger.info('Update tokenCO');
        tokenCO = CustomObjectMgr.getCustomObject('authTokens', 'talkoot') || CustomObjectMgr.createCustomObject('authTokens', 'talkoot');
        tokenCO.custom.token = resp.object.SessionKey;
        tokenCO.custom.expires = new Date(resp.object.Expiration);
    });
    return {
        token: resp.object.SessionKey,
        expires: new Date(resp.object.Expiration)
    };
}
module.exports = {
    call: function (params) {
        if (!tokenObj) {
            let tokenCO = CustomObjectMgr.getCustomObject('authTokens', 'talkoot');
            if (!tokenCO || !tokenCO.custom.expires || tokenCO.custom.expires < new Date()) {
                Logger.info('tokenCO Expired');
                tokenObj = authorize();
            } else {
                tokenObj = {
                    token: tokenCO.custom.token,
                    expires: tokenCO.custom.expires
                };
            }
        } else if (tokenObj.expires < new Date()) {
            Logger.info('tokenObj Expired');
            tokenObj = authorize();
        }
        var resp = tokenObj && Service.call(params);
        if (resp && resp.object && resp.object.ErrorCode === '000') {
            Logger.info('Token ErrorCode 000');
            tokenObj = authorize();
            resp = tokenObj && Service.call(params);
        }
        if (resp && resp.errorMessage) {
            Logger.info(params);
            Logger.warn(resp.errorMessage);
        }
        return resp && resp.object;
    },
    __noSuchMethod__: function (method, args) {
        Service[method].apply(Service, args);
    }
};
