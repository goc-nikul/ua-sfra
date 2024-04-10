var atLogger = require('dw/system/Logger').getLogger(
    'adobeTarget',
    'adobeTarget'
);

const adobeTargetPreferences = require('~/cartridge/scripts/adobeTargetPreferences');

/**
 * Get Adobe Target decision for a mbox
 * @param {string} mboxId - mbox ID used for the test (activity)
 * @param {boolean} useCache - cache the value on customer's session
 * @return {Object|null} decision object
 */
function getDecision(mboxId, useCache) {
    var mboxesDecision = {};
    if (useCache && session.custom.AT && !empty(session.custom.AT[mboxId])) {
        return session.custom.AT[mboxId];
    }

    var deliveryService = require('int_adobe_target/cartridge/scripts/init/DeliveryService');
    var deliveryServiceResult = deliveryService.call({
        mboxId: mboxId,
        propertyId: adobeTargetPreferences.propertyId
    });

    if (!deliveryServiceResult.ok) {
        atLogger.error(
            'adobeTarget: Delivery request: ' +
                deliveryServiceResult.status +
                ':  ' +
                (deliveryServiceResult.errorMessage ||
                    deliveryServiceResult.msg)
        );
        return null;
    }

    var responseObj = JSON.parse(deliveryServiceResult.object);

    mboxesDecision =
        responseObj.execute && responseObj.execute.mboxes
            ? responseObj.execute.mboxes
            : {};

    if (responseObj.id && responseObj.id.tntId) {
        session.custom.adobeTargetTntId = responseObj.id.tntId;
    }

    // Forward response from Adobe Target Delivery as it is to Adobe Analytics
    if (mboxesDecision[0].analytics) {
        var insertionService = require('int_adobe_target/cartridge/scripts/init/InsertionService');
        insertionService.call({
            payload: mboxesDecision[0].analytics.payload.tnta,
            marketingCloudVisitorId: responseObj.id.marketingCloudVisitorId
        });
    }

    if (useCache) {
        if (!session.custom.AT) {
            session.custom.AT = {};
        }

        session.custom.AT[mboxId] = mboxesDecision[0];
    }

    return mboxesDecision[0];
}

module.exports = getDecision;
