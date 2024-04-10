'use strict';

var UUIDUtils = require('dw/util/UUIDUtils');
var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
const adobeTargetPreferences = require('~/cartridge/scripts/adobeTargetPreferences');
const collections = require('*/cartridge/scripts/util/collections');
var atLogger = require('dw/system/Logger').getLogger(
    'adobeTarget',
    'adobeTarget'
);

/**
 * creates a uuid used as id for custom objects
 * @returns {string} unique ID
 */
function createGuid() {
    var uniqueID = UUIDUtils.createUUID();
    return uniqueID;
}

/**
 * generate ECID/MCVID at server side
 * @returns {string} unique ID
 */
function generateECID() {
    var ecidService = require('int_adobe_target/cartridge/scripts/init/ServerSideEcidService');
    var serviceResult = ecidService.call();

    if (!serviceResult.ok) {
        atLogger.error(
            'adobeTarget: ECID request: ' +
                serviceResult.status +
                ':  ' +
                (serviceResult.errorMessage || serviceResult.msg)
        );
        return null;
    }

    var responseObj = JSON.parse(serviceResult.object);

    return responseObj.d_mid;
}

/**
 * get MCVID from cookie or generate ECID at server side
 * @returns {string} unique MCVID
 */
function getMCVID() {
    var mcid;
    var cookieName = encodeURIComponent('AMCV_' + adobeTargetPreferences.orgId);
    var cookieVal = cookieHelper.read(cookieName);

    if (cookieVal) {
        var pieces = decodeURIComponent(cookieVal).split('|');
        mcid = pieces[2];
        delete session.custom.serverSideEcid;
    } else if (!empty(session.custom.serverSideEcid)) {
        mcid = session.custom.serverSideEcid;
    } else {
        mcid = generateECID();
        session.custom.serverSideEcid = mcid;

        var ecidCookieName = 's_ecid';
        var ecidCookieValue = 'MCMID|' + mcid;
        cookieHelper.create(ecidCookieName, ecidCookieValue);
    }

    return mcid;
}

/**
 * Helper Script, used to construct json request body with given page/mbox
 */

var DeliveryHelper = function () {
    this.createAdobeTargetDeliveryRequest = function (params) {
        var marketingCloudVisitorId = getMCVID();
        var customerGroups = [];
        if (session.customer.customerGroups) {
            customerGroups = collections.map(
                session.customer.customerGroups,
                function (cg) {
                    return cg.ID;
                }
            );
        }

        var request = {
            context: {
                channel: 'web'
            },
            property: {
                token: params.propertyId
            },
            id: {
                tntId: session.custom.adobeTargetTntId,
                marketingCloudVisitorId: marketingCloudVisitorId
            },
            experienceCloud: {
                analytics: {
                    logging: 'client_side'
                }
            }
        };

        if (params.mboxId) {
            request.execute = {
                mboxes: [
                    {
                        name: params.mboxId,
                        profileParameters: {
                            customerGroups: customerGroups.join(',')
                        },
                        index: 1
                    }
                ]
            };
        } else {
            request.execute = {
                pageLoad: {
                    address: { url: params.url },
                    profileParameters: {
                        customerGroups: customerGroups.join(',')
                    }
                }
            };
        }

        return JSON.stringify(request);
    };

    this.getAdobeTargetSessionId = function () {
        if (!session.custom.adobeTargetSessionId) {
            session.custom.adobeTargetSessionId = createGuid();
        }

        return session.custom.adobeTargetSessionId;
    };
};

module.exports = DeliveryHelper;
