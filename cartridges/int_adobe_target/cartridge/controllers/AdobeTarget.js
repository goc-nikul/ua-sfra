/* globals empty, session */

var server = require('server');

server.get('Test', function (req, res, next) {
    var getDecision = require('int_adobe_target/cartridge/scripts/adobeTargetDecision');
    var decision = getDecision('test_server_side');
    var experience =
        decision.options && decision.options[0]
            ? decision.options[0]
            : 'Unable to retrieve decision';

    res.render('adobe/test', {
        experience: experience.content.value
    });
    next();
});

server.get('VEC', function (req, res, next) {
    const adobeTargetPreferences = require('~/cartridge/scripts/adobeTargetPreferences');
    if (!adobeTargetPreferences.isVecEnabled) {
        res.print('');
    } else {
        var deliveryService = require('int_adobe_target/cartridge/scripts/init/DeliveryService');

        var url = req.querystring.url;
        var deliveryServiceResult = deliveryService.call({
            url: url,
            propertyId: adobeTargetPreferences.propertyId
        });

        var responseObj = JSON.parse(deliveryServiceResult.object);
        var requestObj = JSON.parse(deliveryService.requestData);
        requestObj.requestId = responseObj.requestId;
        requestObj.id = { tntId: responseObj.id.tntId };

        var serverState = JSON.stringify({
            request: requestObj,
            response: responseObj
        });

        res.render('adobe/vec', {
            serverState: serverState
        });
    }
    next();
});

module.exports = server.exports();
