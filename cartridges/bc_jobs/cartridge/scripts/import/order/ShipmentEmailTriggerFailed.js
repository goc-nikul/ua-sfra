/*In case there is any failure, system should reprocess the failed ship confirmation message. So we can make sure shipment confirmation email sent to customer successfully. */
'use strict';

var Transaction = require('dw/system/Transaction'),
    Logger = require('dw/system/Logger'),
    Order = require('dw/order/Order'),
    OrderMgr = require('dw/order/OrderMgr'),
    ProductMgr = require('dw/catalog/ProductMgr'),
    ArrayList = require('dw/util/ArrayList'),
    HashMap = require('dw/util/HashMap'),
    HookMgr = require('dw/system/HookMgr'),
    CustomObjectMgr = require('dw/object/CustomObjectMgr'),
    ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils'),
    returnsUtils = new ReturnsUtils(),
    Status = require('dw/system/Status'),
    ordersToEmail = new ArrayList();

const preferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var emailHelper = require('*/cartridge/scripts/helpers/SFMCEmailHelper');

function execute(params) {
    var maxResendAttempts = !empty(params.maxResendAttempts) ? params.maxResendAttempts : 3;
    var serviceErrorCount = 0;
    var maxCSErrorCount = !empty(params.maxConsecutiveServiceErrorCount) ? params.maxConsecutiveServiceErrorCount : 5;
    var customObjIterator = CustomObjectMgr.getAllCustomObjects('MarketingCloudFailedTriggers');
    var hookID = 'app.communication.oms.shipment';
    var helpers = require('int_marketing_cloud/cartridge/scripts/util/helpers');
    var customObjectdefinition = helpers.getCustomObject('MarketingCloudTriggers', hookID, false);

    while (customObjIterator.hasNext()) {
        try {
            //send shipment confirmation emails
            var customObj = customObjIterator.next();
            var orderID = customObj.custom.Content;
            var orderToEmail = OrderMgr.getOrder(orderID);

            if (!empty(orderID) && !empty(orderToEmail)) {
                var dateFormatInvalid = false;
                request.setLocale(orderToEmail.custom.customerLocale);
                if (!empty(orderToEmail.custom.shippingJson)) {
                    dateFormatInvalid = returnsUtils.getShippingDate(orderToEmail);
                }
                let args = new HashMap(),
                    countryEnabled = !empty(customObjectdefinition) && customObjectdefinition.enabled && !empty(customObjectdefinition.countriesEnabled) ?
                    customObjectdefinition.countriesEnabled.indexOf(orderToEmail.custom.customerCountry) !== -1 : false;
                args.put('Order', orderToEmail);

                if (preferencesUtil.isCountryEnabled('SFMCEnabled') && countryEnabled && HookMgr.hasHook(hookID) && dateFormatInvalid == false) {
                    var trackingLink = returnsUtils.getShippingTrackingLink(orderToEmail);
                    var trackingCode = returnsUtils.getShippingTrackingCode(orderToEmail);

                    var params = {
                        Order: orderToEmail,
                        trackingLink: trackingLink,
                        trackingCode: !empty(trackingCode) ? trackingCode : ''
                        
                    }
                    // Send shipment confirmation email
                    var retryCount = !empty(customObj.custom.RetryCount) ? customObj.custom.RetryCount : 0;
                    var apiResponse = emailHelper.sendShipmentConfirmationEmail(orderToEmail, params);
                    var shippingJson = orderToEmail.custom.shippingJson && JSON.parse(orderToEmail.custom.shippingJson) || '';
                    var emailSentFlag = updateEmailFlag(shippingJson);
                    if(apiResponse.status !== 'OK') {
                    	serviceErrorCount++;
                        Logger.error('serviceErrorCount...............:'+serviceErrorCount);
                    }
                    if (apiResponse.status === 'OK' || retryCount > maxResendAttempts) {
                        Transaction.wrap(function() {
                            CustomObjectMgr.remove(customObj);
                        });
                        Logger.error('ShipmentEmailTriggerFailed.js: if custom object RetryCount has exceeded the job step attribute maxResendAttempts. If exceeded, remove custom object or remove custom object If service response success ');
                    } else if(apiResponse.status !== 'OK' && serviceErrorCount > maxCSErrorCount) {
                        Logger.error('ShipmentEmailTriggerFailed.js: Max number of consecutive service errors occur stopping the job.');
                        return new Status(Status.ERROR);
                    }
                    
                    if (shippingJson && apiResponse.status === 'OK') {
                        Transaction.wrap(function() {
                            orderToEmail.custom.shippingJson = emailSentFlag;
                        });
                    }
                }
                ordersToEmail = new ArrayList();
            }
        } catch (error) {
            Logger.error('ShipmentEmailTriggerFailed.js email triger failedError: {0} ; lineNumber: {1} ; stack: {2}', '' + error, error.lineNumber, error.stack);
        }
    }
}

function updateEmailFlag(shippingJson) {
    /* Update Shipping JSON to reflect that order shipped */
    for (let i = 0, len = shippingJson.length; i < len; i++) {
        let object = shippingJson[i];

        if (object.emailSent != true && object.hasOwnProperty('items'))
            object.emailSent = true;
    }

    return JSON.stringify(shippingJson);
}

module.exports.execute = execute;