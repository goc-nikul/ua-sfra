/* Script Modules */
const URLUtils = require('dw/web/URLUtils');
// Logger includes
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
/**
 * Calls Shoplinker service and processed received response.
 *
 * @param {string} serviceType - Called Shoplinker service type (e.g. G2, G3 etc.)
 * @param {string} params - Called Shoplinker service type (e.g. G2, G3 etc.)
 * @returns {boolean} Service response status
 */
function callShoplinkerService(serviceType, params) {
    const shoplinkerService = LocalServiceRegistry.createService('int_shoplinker.http.product', {
        createRequest: function (svc, serviceParams) {
            // Build full service request URL
            let requestURL = svc.getConfiguration().credential.URL; // Common URL path
            requestURL += serviceParams.endpointURL; // Service endpoint
            requestURL += '?iteminfo_url=' + serviceParams.iteminfoURL; // Request serviceParams

            svc.setRequestMethod('GET');
            svc.setURL(requestURL);
        },
        parseResponse: function (svc, client) {
            return client.text;
        },
        getResponseLogMessage: function (response) {
            return response.text;
        }
    });

    let serviceResponse = shoplinkerService.call(params);
    var shopLinkerLogger = Logger.getLogger('shoplinker', 'shoplinker');

    if (serviceResponse.status !== 'OK') {
        shopLinkerLogger.error('Shoplinker.js: call to {0} service failed. Service response: {1}', serviceType, serviceResponse.errorMessage);
        return false;
    } else { // eslint-disable-line no-else-return
        let responseMessage = new XML(serviceResponse.object);// eslint-disable-line
        if (serviceType === 'G4' && responseMessage.child('ResultMessage').child('result').text().toString() === 'true') {
            let mid = params.iteminfoURL.split('=').pop();
            Transaction.begin();
            let shoplinkerObj = CustomObjectMgr.getCustomObject('ShoplinkerData', mid);
            if (shoplinkerObj == null) shoplinkerObj = CustomObjectMgr.createCustomObject('ShoplinkerData', mid);
            shoplinkerObj.custom.shoplinkerID = responseMessage.child('ResultMessage').child('product_id').text().toString();
            Transaction.commit();
        }
        if (responseMessage.child('ResultMessage').child('result').text().toString() === 'false') {
            return false;
        }
    }

    return true;
}

/**
 * Generates absolute URL for Shoplinker controller to be used by Shoplinker service as callback URL.
 *
 * NOTE: In case of production mode is enabled callback URL must point to the production environment.
 *
 * @param {string} serviceName - Endpoint name for Shoplinker controller (e.g. G2, G3 etc.)
 * @param {string} urlParamName - URL parameter name (vid or mid)
 * @param {string} urlParamValue - URL parameter value
 * @returns {string} Absolute URL for Shoplinker
 */
function getCallbackURL(serviceName, urlParamName, urlParamValue) {
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    const HOSTNAME_PRODUCTION_KR = PreferencesUtil.getValue('shoplinkerHostnameProduction');
    const productionMode = PreferencesUtil.getValue('shoplinkerProductionMode');
    let callbackURL = URLUtils.https('Shoplinker-' + serviceName, urlParamName, urlParamValue);

    if (productionMode) {
        // Replace current hostname with production hostname.
        callbackURL = callbackURL.host(HOSTNAME_PRODUCTION_KR);
    }

    return callbackURL.toString();
}

/**
 * Module provides wrapper methods for Shoplinker API calls.
 * Each method defines parameters for specific service:
 *  iteminfoURL - Callback URL which is sent to Shoplinker as parameter;
 *  endpointURL - Actual endpoint of Shoplinker API which should be called;
 *
 *  NOTE: Common Shoplinker API URL part is defined in the SFCC service credentials.
 *
 * @module scripts/Shoplinker
 */
module.exports = {
    callG2: function (variationID) {
        return callShoplinkerService('G2', {
            iteminfoURL: getCallbackURL('G2', 'vid', variationID),
            endpointURL: '/attribute_insert.php'
        });
    },
    callG3: function (materialItemsIDList) {
        return callShoplinkerService('G3', {
            iteminfoURL: getCallbackURL('G3', 'materialItemsIDList', materialItemsIDList.join(',')),
            endpointURL: '/attribute_prod_insert.php'
        });
    },
    callG4: function (materialID) {
        return callShoplinkerService('G4', {
            iteminfoURL: getCallbackURL('G4', 'mid', materialID),
            endpointURL: '/attribute_modify.php'
        });
    },
    callG5: function (materialID) {
        return callShoplinkerService('G5', {
            iteminfoURL: getCallbackURL('G5', 'mid', materialID),
            endpointURL: '/product_image_register.php'
        });
    },
    callG6: function (materialID) {
        return callShoplinkerService('G6', {
            iteminfoURL: getCallbackURL('G6', 'mid', materialID),
            endpointURL: '/goods_info_reg.php'
        });
    },
    callG7: function (productID) {
        return callShoplinkerService('G7', {
            iteminfoURL: getCallbackURL('G7', 'pid', productID),
            endpointURL: '/product_list.php'
        });
    }
};
