'use strict';

var server = require('server');

var preferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
/**
 * @param {string} emailWebSource - emailWebSource
 * @returns {string} - emailSourceCode
 */
function findEmailSource(emailWebSource) {
    var emailSourceCode;
    var countryCode = session.custom.currentCountry ? session.custom.currentCountry : require('dw/util/Locale').getLocale(request.getLocale()).country; // eslint-disable-line
    var emailWebSourceJSON = preferencesUtil.getJsonValue('emailWebSourceCodesJSON');
    if (!empty(emailWebSource) && !empty(emailWebSourceJSON) && emailWebSourceJSON[countryCode]) {
        emailWebSourceJSON = emailWebSourceJSON[countryCode];
        emailSourceCode = emailWebSourceJSON[emailWebSource];
    } else if (!empty(emailWebSource) && !empty(emailWebSourceJSON)) {
        emailSourceCode = emailWebSourceJSON[emailWebSource];
    }
    return emailSourceCode;
}

server.post('Subscribe', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var form = req.form;
    var resObj;
    if (!empty(form) && 'email' in form) {
        var emailWebSourceCode = findEmailSource(form.emailWebsource);
        resObj = require('*/cartridge/modules/providers').get('Newsletter', {
            email: form.email,
            merkleSourceCode: emailWebSourceCode
        }).subscribe();
    }
    var response = {
        resObj: resObj
    };

    if (resObj && 'MerkleStatus' in resObj && ('emailStatus' in resObj || 'doubleOpt' in resObj)) {
        response.success = true;

        // Invalid Email address
        if ('invalidEmail' in resObj && resObj.invalidEmail) {
            response.msg = Resource.msg('error.message.parse.email.subscribe', 'forms', '');
            response.merklecode = -10; // mapped the code for ajax usage
        // Success response
        } else if (resObj.MerkleStatus === 'success' && (resObj.emailStatus === 'does not exist' || resObj.doubleOpt === 'success')) {
            response.msg = Resource.msg('subscribe.email.success', 'homePage', '');
            response.merklecode = 10; // mapped the code for ajax usage
        // Email already subscribed
        } else if (resObj.MerkleStatus === 'success' && resObj.emailStatus === 'exist') {
            response.msg = Resource.msg('subscribe.email.alreadySubscribed', 'homePage', '');
            response.merklecode = -40; // mapped the code for ajax usage
        } else {
            response.msg = Resource.msg('subscribe.email.error.generic', 'homePage', '');
        }
    } else {
        // Bad request mapping
        response.error = true;
        response.msg = Resource.msg('subscribe.email.error.generic', 'homePage', '');
        response.merklecode = -99; // mapped the code for ajax usage
    }

    res.json(response);

    next();
});
module.exports = server.exports();
