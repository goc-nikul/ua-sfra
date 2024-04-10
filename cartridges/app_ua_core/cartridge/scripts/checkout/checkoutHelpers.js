/* eslint-disable consistent-return */
'use strict';

/* API includes */
var ArrayList = require('dw/util/ArrayList');
var Money = require('dw/value/Money');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var HookMgr = require('dw/system/HookMgr');
const logger = require('dw/system/Logger').getLogger('constructor', 'constructor');

/* Script modules */
var base = require('app_storefront_base/cartridge/scripts/checkout/checkoutHelpers');
var plugin = require('plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers');
var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
var giftCardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
var errorLogger = require('dw/system/Logger').getLogger('OrderFail', 'OrderFail');
var LogHelper = require('*/cartridge/scripts/util/loggerHelper');
/**
 * @description Checks for invalid eGift Card Amount
 * @param {Object} giftCardForm eGift Card data form
 * @returns {Object} errors or empty
 */
function checkEGiftCardAmount(giftCardForm) {
    var errors = {};
    if (empty(giftCardForm.gcAmount)) {
        return {
            gcAmount: Resource.msg('error.egiftcard.amount.missing', 'checkout', null)
        };
    }
    try {
        var gcAmount = Number(giftCardForm.gcAmount);
        if (gcAmount < 0.00) {
            throw new Error(Resource.msg('error.egiftcard.amount.invalid', 'checkout', null));
        }
    } catch (e) {
        errors.gcAmount = Resource.msg('error.egiftcard.amount.invalid', 'checkout', null);
    }

    return errors;
}

/**
 * Calculates the amount to be payed by a non-gift certificate payment instrument based also reducing partial vip points if applied
 * on the given basket. The method subtracts the amount of all redeemed gift certificates
 * from the order total and returns this value.
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Current users's basket
 * @returns {dw.value.Money} amountOpen - Paid amount
 */
function calculateNonGiftCertificateAmount(lineItemCtnr) {
    var giftCertTotal = new Money(0.0, lineItemCtnr.currencyCode);
    var gcPaymentInstrs = lineItemCtnr.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();
    var orderTotal = lineItemCtnr.totalGrossPrice;
    var orderPI;

    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }
    // Subtract gift card amount from order total
    var gcRedeemedAmount = giftCardHelper.getGcRedeemedAmount(lineItemCtnr);
    if (gcRedeemedAmount && gcRedeemedAmount > 0) {
        giftCertTotal = giftCertTotal.add(new Money(gcRedeemedAmount, lineItemCtnr.currencyCode));
    }
    // substact partial vip points as well in case of VIP User.
    if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
        var vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
        var partialVipPoints = vipDataHelpers.calculatePartialVipAmount(lineItemCtnr);
        if (partialVipPoints) {
            orderTotal = orderTotal.subtract(new Money(partialVipPoints, lineItemCtnr.getCurrencyCode()));
        }
    }
    return orderTotal.subtract(giftCertTotal);
}

/**
 * Set the Paymetric Payload on the order notes and reset the payment instrument payload attribute
 * @param {dw.order.Order} order - The order object
 */
function handlePaymetricPayload(order) {
    if (order) {
        var collections = require('*/cartridge/scripts/util/collections');
        var orderPaymentInstruments = order.getPaymentInstruments();
        if (!empty(orderPaymentInstruments)) {
            collections.forEach(orderPaymentInstruments, function (paymentInstrument) {
                if (Object.prototype.hasOwnProperty.call(paymentInstrument.custom, 'payload') && !empty(paymentInstrument.custom.payload)) {
                    Transaction.wrap(function () {
                        order.addNote('Paymetric Payload', paymentInstrument.custom.payload);
                        // eslint-disable-next-line no-param-reassign
                        paymentInstrument.custom.payload = '';
                    });
                }
            });
        }
    }
}

/**
 * Validates payment instrument amount equal to total amount
 * @param {Object} currentBasket dw object
 * @returns {boolean} returns the status
 */
function isPaymentAmountMatches(currentBasket) {
    var collections = require('*/cartridge/scripts/util/collections');
    var paymentInstruments = currentBasket.paymentInstruments;
    var paymentInstrumentAmount = 0;
    collections.forEach(paymentInstruments, function (paymentInstrument) {
        paymentInstrumentAmount += (paymentInstrument.paymentTransaction.amount.available) ? (paymentInstrument.paymentTransaction.amount.value) : 0;
    });
    paymentInstrumentAmount = paymentInstrumentAmount.toFixed(2);
    var result = (currentBasket.totalGrossPrice.available) ? (Number(currentBasket.totalGrossPrice.value) === Number(paymentInstrumentAmount)) : false;
    return result;
}

/**
 * Function returns error code based on Processor Response
 * @param {Object} authorizationResult dw object
 * @returns {string} returns the payment error code
 */
function getPaymentErrorCode(authorizationResult) {
    var errorCode = null;
    // AurusPay
    if (authorizationResult.AurusPayResponseCode) {
        errorCode = authorizationResult.AurusPayResponseCode;
        // Paymetric
    } else if (authorizationResult.paymetricResponseCode) {
        errorCode = authorizationResult.paymetricResponseCode;
        // Paypal and others
    } else if (authorizationResult.errorCode) {
        errorCode = authorizationResult.errorCode;
    }
    return errorCode;
}

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @param {string} scope - The order scope - OCAPI
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber, scope) {
    var collections = require('*/cartridge/scripts/util/collections');

    var result = {};
    try {
        if (order.totalNetPrice !== 0.00) {
            var paymentInstruments = order.paymentInstruments;

            if (paymentInstruments.length === 0) {
                Transaction.wrap(function () {
                    order.trackOrderChange('Order Failed Reason: payment instrument is missing');
                    OrderMgr.failOrder(order, true);
                });
                result.error = true;
            }

            var isPaymentAmountMatch = isPaymentAmountMatches(order);
            if (!isPaymentAmountMatch) {
                errorLogger.error('!isPaymentAmountMatch {0} ', LogHelper.getLoggingObject(order));
                Transaction.wrap(function () {
                    order.trackOrderChange('Order Failed Reason: Order total and Payment Amount Mismatch');
                    OrderMgr.failOrder(order, true);
                });
                result.error = true;
            }

            if (!result.error) {
                /**
                 * Authorize gift card payment instruments separately from other payment Instruments
                 * This change is to prepare the list of GC Payment Instrument and send to the respective
                 * Payment processor for Check balance and Auth at once, in order to avoid multiple service call
                 * for each Payment Instrument. This will reduce the service calls and avoid Quota limit of 8 calls in Checkout.
                 */
                var gcpaymentInstruments = order.getPaymentInstruments('GIFT_CARD');
                if (gcpaymentInstruments.length > 0) {
                    var gcAuthResult = giftCardHelper.authorizeGiftCards(order);
                    if (gcAuthResult.error) {
                        result.error = true;
                        result.errorMessage = gcAuthResult.errorMessage;
                        Transaction.wrap(function () {
                            order.trackOrderChange('Order Failed Reason: Error during gift card authorization');
                            OrderMgr.failOrder(order, true);
                        });

                        return result;
                    }
                }

                var orderPaymentInstruments = order.getPaymentInstruments();
                var paymentMethods = '';
                if (!empty(orderPaymentInstruments)) {
                    collections.forEach(orderPaymentInstruments, function (paymentInstrument) {
                        paymentMethods += empty(paymentMethods) ? paymentInstrument.getPaymentMethod() : '&' + paymentInstrument.getPaymentMethod();
                    });
                }

                // Set the order payment method to the order custom attribute
                /* eslint-disable no-param-reassign */
                if (!empty(paymentMethods)) {
                    Transaction.wrap(function () {
                        order.custom.paymentMethodID = paymentMethods;
                    });
                }

                for (var i = 0; i < paymentInstruments.length; i++) {
                    var paymentInstrument = paymentInstruments[i];
                    if (paymentInstrument.getPaymentMethod().equalsIgnoreCase('GIFT_CARD')) {
                        continue; // eslint-disable-line no-continue
                    }
                    var paymentProcessor = PaymentMgr
                        .getPaymentMethod(paymentInstrument.paymentMethod)
                        .paymentProcessor;
                    var authorizationResult;
                    if (paymentProcessor === null) {
                        Transaction.begin();
                        paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                        Transaction.commit();
                    } else {
                        if (HookMgr.hasHook('app.payment.processor.' +
                            paymentProcessor.ID.toLowerCase())) {
                            authorizationResult = HookMgr.callHook(
                                'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                                'Authorize',
                                orderNumber,
                                paymentInstrument,
                                paymentProcessor,
                                scope
                            );
                        } else {
                            authorizationResult = HookMgr.callHook(
                                'app.payment.processor.default',
                                'Authorize'
                            );
                        }

                        if (!authorizationResult.error && paymentInstrument.paymentMethod === 'KLARNA_PAYMENTS') {
                            Transaction.wrap(function () {
                                order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                            });
                        }
                        if (authorizationResult.error) {
                            errorLogger.error('!authorizationResult {0} ', LogHelper.getLoggingObject(order));
                            var authErrorCode = getPaymentErrorCode(authorizationResult);
                            Transaction.wrap(function () { // eslint-disable-line
                                order.trackOrderChange('Order Failed Reason: could not Authorize.' + (authErrorCode ? 'Error Code: ' + authErrorCode : ''));
                                OrderMgr.failOrder(order, true);
                            });
                            result.error = true;
                            result.errorCode = authErrorCode;
                            result.resultCode = authorizationResult.resultCode;
                            result.errorMessage = authorizationResult.errorMessage ? authorizationResult.errorMessage : authorizationResult.paypalErrorMessage ? authorizationResult.paypalErrorMessage : '';
                            break;
                        }
                    }
                }
            }
        } else {
            Transaction.wrap(function () {
                order.trackOrderChange('Order Failed Reason: Order total is 0.00');
                OrderMgr.failOrder(order, true);
            });
            result.error = true;
            errorLogger.error('Order total is 0.00 {0} ', LogHelper.getLoggingObject(order));
        }

        handlePaymetricPayload(order);
    } catch (e) {
        result.error = true;
        Logger.error('Error during payment authorization: handlePayments() : ' + JSON.stringify(e));

        Transaction.wrap(function () {
            order.trackOrderChange('Order Failed Reason: Error during payment authorization. Please see order note');
            order.addNote('Order Failed Reason', JSON.stringify(e).substring(0, 4000));
            OrderMgr.failOrder(order, true);
        });
    }
    return result;
}

/**
 * Returns true if valid cookie is set to 1 or Klarna site Preference is enabled
 * @returns {boolean} - true valid cookie is set/ site Preference enabled
 */
function isKlarnaPaymentEnabled() {
    try {
        var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
        var cookie128 = cookieHelper.read('ua_exp_geat-128');
        var isKlarnaEnabled = 'isKlarnaEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isKlarnaEnabled');
        var enableKlarna = false; // eslint-disable-next-line
        var validCookie = cookie128 && (cookie128.toString() === '1' || cookie128.toString() === '0' || cookie128.toString() === '99') ? true : false;
        if (validCookie && cookie128.toString() === '1') {
            enableKlarna = true;
        } else if (validCookie && (cookie128.toString() === '0' || cookie128.toString() === '99')) {
            enableKlarna = false;
        } else if (!validCookie && isKlarnaEnabled) { // eslint-disable-next-line
            enableKlarna = isKlarnaEnabled;
        }
        Logger.info('Info on isKlarnaPaymentEnabled(): klarnaPreferenceEnabled: {0}, validCookie: {1} ', isKlarnaEnabled, validCookie);
        return enableKlarna;
    } catch (e) {
        Logger.error('Error in isKlarnaPaymentEnabled(): ' + JSON.stringify(e));
        return false;
    }
}

/**
 * Attempts to place the order
 * @param {dw.order.Order} order - Current order
 * @returns {Object} status
 */
function placeOrder(order) {
    var result = {
        error: false
    };

    try {
        Transaction.wrap(function () {
            var placeOrderStatus = OrderMgr.placeOrder(order);
            if (placeOrderStatus === Status.ERROR) {
                throw new Error();
            }
        });
    } catch (e) {
        Logger.error('Error during order placement: ' + JSON.stringify(e));
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
            order.trackOrderChange('Order Failed Reason: Error during order placement');
            order.addNote('Order Failed Reason: Error during order placement', JSON.stringify(e).substring(0, 4000));
        });
        result.error = true;
    }

    return result;
}

/**
 * Attempts to fail the order
 * @param {dw.order.Order} order - Current order
 * @returns {Object} status
 */
function failOrder(order) {
    var result = {
        error: false
    };

    try {
        Transaction.wrap(function () {
            if (order.status.value === Order.ORDER_STATUS_CREATED) {
                OrderMgr.failOrder(order, true);
            } else if (order.status.value === Order.ORDER_STATUS_OPEN || order.status.value === Order.ORDER_STATUS_NEW || order.status.value === Order.ORDER_STATUS_COMPLETED) {
                var cancelStatus = OrderMgr.cancelOrder(order);
                if (cancelStatus === Status.ERROR) {
                    throw new Error();
                }
                if ('accertifyRecCode' in order.custom && order.custom.accertifyRecCode) {
                    order.setCancelCode(order.custom.accertifyRecCode);
                }
                if ('accertifyActionType' in order.custom && order.custom.accertifyActionType) {
                    order.setCancelDescription(order.custom.accertifyActionType);
                }
            }
        });
    } catch (e) {
        Logger.error('Error during order cancellation: ' + e);
        result.error = true;
    }

    return result;
}

/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendConfirmationEmail(order) {
    /* eslint-disable no-param-reassign */
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var orderObject = {
        order: order
    };

    var emailData = {
        to: order.customerEmail,
        subject: Resource.msg('subject.order.confirmation.email', 'order', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'noreply@underarmour.com',
        type: emailHelpers.emailTypes.orderConfirmation
    };

    var emailObj = {
        templateData: orderObject,
        emailData: emailData
    };

    require('*/cartridge/modules/providers').get('Email', emailObj).send();
    Transaction.wrap(function () {
        order.custom.confirmationEmailSent = true;
    });
}

/**
 * Helper method to build the request to generate the giftcards
 * @param {dw.order.Order} order - The current user's order
 * @param {Object} eGiftCardLineItems - eGiftCard LineItems
 * @returns {Object} result - giftCard result object
 */
function generateGiftCardNumbers(order, eGiftCardLineItems) {
    const firstDataHelper = require('*/cartridge/scripts/firstDataHelper');
    var StringUtils = require('dw/util/StringUtils');
    var eGiftCardsDetails = [];

    var result = {
        error: false,
        eGiftCardsDetails: eGiftCardsDetails
    };

    if (eGiftCardLineItems.length > 0) {
        try {
            var prices = [];
            var Calendar = require('dw/util/Calendar');
            eGiftCardLineItems.forEach(function (lineItem) {
                const eGiftCard = {
                    purchaserName: lineItem.custom.gcFrom,
                    recipientName: lineItem.custom.gcRecipientName,
                    personalMessage: !empty(lineItem.custom.gcMessage) ? lineItem.custom.gcMessage : null,
                    cardAmount: lineItem.priceValue,
                    deliveryDate: StringUtils.formatCalendar(new Calendar(new Date(lineItem.custom.gcDeliveryDate)), 'MM-dd-yyyy'),
                    emailAddress: lineItem.custom.gcRecipientEmail,
                    orderNumber: order.orderNo
                };
                var egcData = {};
                egcData.amount = lineItem.priceValue;
                egcData.recipientEmail = lineItem.custom.gcRecipientEmail;
                eGiftCardsDetails.push(eGiftCard);
                prices.push(egcData);
            });

            var response = firstDataHelper.generateGiftCards(prices, order.orderNo, order.customerEmail);
            if (response.success && response.giftCardData) {
                var giftCardsData = response.giftCardData;
                for (var i = 0; i < giftCardsData.length; i++) {
                    eGiftCardsDetails[i].cardNumber = giftCardsData[i].cardNumber;
                    eGiftCardsDetails[i].cardPIN = giftCardsData[i].pin;
                }
            } else {
                Logger.error('Unable to generate gift cards for the order order No:: {0} ==> error :: {1}', order.orderNo, response.errorMessage);
                result.error = true;
            }
            result.eGiftCardsDetails = eGiftCardsDetails;
        } catch (e) {
            Logger.error('Unable to generate gift cards for the order order No:: {0} ==> error :: {1}', order.orderNo, e.message);
            result.error = true;
        }
    }
    return result;
}

/**
 * Sends a giftCard email to giftCard recipients
 * @param {dw.order.Order} order - The current user's order
 * @param {Object} eGiftCardsDetails - giftCard request object
 * @returns {void}
 */
function sendEGiftCardsEmail(order, eGiftCardsDetails) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

    var orderObject = {
        order: order
    };

    var emailData = {
        to: order.customerEmail,
        subject: Resource.msg('subject.order.confirmation.email', 'order', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'noreply@underarmour.com',
        type: emailHelpers.emailTypes.eGiftCard
    };

    var emailObj = {
        templateData: orderObject,
        emailData: emailData,
        eGiftCardsDetails: eGiftCardsDetails
    };
    require('*/cartridge/modules/providers').get('Email', emailObj).send();
}

/**
 * Sends a order cancellation email to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} orderCancelledType - order cancelled type
 * @returns {void}
 */
function sendFraudNotificationEmail(order, orderCancelledType) {
    try {
        var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
        var orderObject = {
            order: order,
            orderCancelledType: orderCancelledType
        };
        var emailData = {
            to: order.customerEmail,
            subject: Resource.msg('subject.order.cancell.email', 'order', null),
            from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'noreply@underarmour.com',
            type: emailHelpers.emailTypes.possibleFraudNotification
        };
        var emailObj = {
            templateData: orderObject,
            emailData: emailData
        };
        require('*/cartridge/modules/providers').get('Email', emailObj).send();
    } catch (e) {
        Logger.error('Error in checkoutHelper.js -> sendFraudNotificationEmail :: error {0}', e.message);
    }
}

/**
 * Update order hold attribute
 * @param {dw.order.Order} order - The current user's order
 * @param {boolean} onHold - On hold status
 * @param {string} message - Update message
 * @returns {void}
 */
function handleHoldStatus(order, onHold, message) {
    /* eslint-disable no-param-reassign */
    Transaction.wrap(function () {
        if (!empty(message)) {
            var updates = new ArrayList(order.custom.updates);
            if (!updates.contains(message)) {
                updates.push(message);
                order.custom.updates = updates;
            }
        }
        if (!empty(onHold)) {
            order.custom.onHold = onHold;
        }
    });
}

/**
 * Set exported status
 * @param {dw.order.Order} order - The current user's order
 * @returns {void}
 */
function setExportedStatus(order) {
    /* eslint-disable no-param-reassign */
    Transaction.wrap(function () {
        order.setExportStatus(Order.EXPORT_STATUS_READY);
    });
}

/**
 * Copies a CustomerAddress to a Shipment as its Shipping Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 * @param {dw.order.Shipment} [shipmentOrNull] - The target shipment
 */
function copyCustomerAddressToShipment(address, shipmentOrNull) {
    var Locale = require('dw/util/Locale'); // eslint-disable-next-line
    var siteCountryCode = Locale.getLocale(request.locale).country;

    if (address.countryCode === siteCountryCode || address.countryCode.value === siteCountryCode) {
        base.copyCustomerAddressToShipment(address, shipmentOrNull);
    }
}

/**
 * Copies a CustomerAddress to a Basket as its Billing Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 */
function copyCustomerAddressToBilling(address) {
    var Locale = require('dw/util/Locale'); // eslint-disable-next-line
    var siteCountryCode = Locale.getLocale(request.locale).country;

    if (address.countryCode === siteCountryCode || address.countryCode.value === siteCountryCode) {
        base.copyCustomerAddressToBilling(address);
    }
}

/**
 * Copies information from the shipping form to the associated shipping address
 * @param {Object} shippingData - the shipping data
 * @param {dw.order.Shipment} [shipmentOrNull] - the target Shipment
 * @param {string} type - origin of the request
 */
function copyShippingAddressToShipment(shippingData, shipmentOrNull, type) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;

    var shippingAddress = shipment.shippingAddress;

    Transaction.wrap(function () {
        if (shippingAddress === null) {
            shippingAddress = shipment.createShippingAddress();
        }

        // Fill address with forms data
        shippingAddress.setFirstName(shippingData.address.firstName);
        shippingAddress.setLastName(shippingData.address.lastName);
        shippingAddress.setAddress1(shippingData.address.address1);
        shippingAddress.setAddress2(shippingData.address.address2);
        shippingAddress.setCity(shippingData.address.city);
        shippingAddress.setPostalCode(shippingData.address.postalCode);
        shippingAddress.setStateCode(shippingData.address.stateCode || '');
        var countryCode = shippingData.address.countryCode.value ? shippingData.address.countryCode.value : shippingData.address.countryCode;
        shippingAddress.setCountryCode(countryCode);
        shippingAddress.setPhone(shippingData.address.phone);
    });

    /*
     * TODO: Rework on checkout flow. We need to pass saved address ID in order to use its custom attributes and update
     *    - shippingAddress.isml : add addressId formField
     *    - shipping.js : add address ID to addressId input
     *    - CheckoutShippingServices-SubmitShipping : get address by ID and trigger AddressType provider to update custom attributes
     *    - Extend shippingData object with new custom attributes (addressType, addressHash, addressExpiration)
     *    - CheckoutHelper-copyShippingAddressToShipment check if shippingData have addressType, if not, trigger AddressType provider
     *
     *    We can not do it in Fedex init commit, because of dependencies to Checkout ISD/FSD
     */

    // Update address type
    require('*/cartridge/modules/providers').get('AddressType', shippingAddress).addressType();

    if (shipment.shippingMethodID !== 'eGift_Card' && type !== 'selectCollectionPoint') {
        // Select shipment
        Transaction.wrap(function () {
            ShippingHelper.selectShippingMethod(shipment, shippingData.shippingMethod);
        });
    }
}

/**
 * Returns true if phone number field is mandatory
 * @returns {boolean} - true if phone number field is mandatory
 */
function isPhoneNumberMandatory() {
    try {
        var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
        var brooksBell = cookieHelper.read('ua_exp_geat-499'); // eslint-disable-next-line
        var validCookie = brooksBell && (brooksBell.toString() === '1' || brooksBell.toString() === '0' || brooksBell.toString() === '99') ? true : false;
        if (!validCookie) { // eslint-disable-next-line
            return Site.current.getCustomPreferenceValue('phoneNumberMandatory') && Site.current.getCustomPreferenceValue('phoneNumberMandatory').value === 1 ? true : false; //eslint-disable-next-line
        } else { // eslint-disable-next-line
            return brooksBell.toString() === '1' ? true : false;
        }
    } catch (e) {
        return false;
    }
}

/**
 * Returns true if HAL site Preference set boolean value
 * @returns {boolean} - true valid cookie is set/ site Preference enabled
 */
function isHALShippingEnabled() { // eslint-disable-line
    try {
        var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
        var cookie583 = cookieHelper.read('ua_exp_geat-583');
        var halShippingEnabled = Site.current.getCustomPreferenceValue('halShippingEnabled'); // eslint-disable-next-line
        var validCookie = cookie583 && (cookie583.toString() === '1' || cookie583.toString() === '0' || cookie583.toString() === '99') ? true : false;
        if (halShippingEnabled) {
            if (validCookie && cookie583.toString() === '1') {
                return true;
            } else if (validCookie && (cookie583.toString() === '0' || cookie583.toString() === '99')) {
                return false;
            } else if (!validCookie && halShippingEnabled) { // eslint-disable-next-line
                return halShippingEnabled;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * Returns true if HAL site Preference set boolean value
 * @returns {boolean} - true if site Preference enabled
 */
function isHALEnabledForShopApp() {
    var halShippingEnabled = Site.current.getCustomPreferenceValue('halEnabledForShopApp');
    return !empty(halShippingEnabled) ? halShippingEnabled : false;
}

/**
 * sets the gift message on a shipment
 * @param {dw.order.Shipment} shipment - Any shipment for the current basket
 * @param {boolean} isGift - is the shipment a gift
 * @param {string} giftMessage - The gift message the user wants to attach to the shipment
 * @param {string} giftItems - The gift items
 * @returns {Object} object containing error information
 */
function setGift(shipment, isGift, giftMessage, giftItems) {
    var result = {
        error: false,
        errorMessage: null
    };

    try {
        Transaction.wrap(function () {
            shipment.setGift(isGift);

            if (isGift && giftMessage) {
                shipment.setGiftMessage(giftMessage);
            } else {
                shipment.setGiftMessage(null);
            }
        });
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var ProductMgr = require('dw/catalog/ProductMgr');
        var childProducts = null;
        var options = [];

        if (giftItems) {
            var pidsObj = new ArrayList(JSON.parse(giftItems) || []);
            var collections = require('*/cartridge/scripts/util/collections');
            collections.forEach(pidsObj, function (PIDObj) {
                var currentBasket = BasketMgr.getCurrentBasket();
                var productLineItems = currentBasket.allProductLineItems;
                var product = ProductMgr.getProduct(PIDObj.pid);
                var addToCartEnabled = true;
                if (cartHelper.getExistingProductLineItemInCart(product, product.ID, productLineItems, childProducts, options)) {
                    addToCartEnabled = false;
                    if (PIDObj.clearItem) {
                        Transaction.wrap(function () {
                            for (var i = 0; i < productLineItems.length; i++) {
                                var item = productLineItems[i];
                                if (item.productID === product.ID) {
                                    currentBasket.removeProductLineItem(item);
                                    break;
                                }
                            }
                        });
                    }
                }
                if (addToCartEnabled && !PIDObj.clearItem) {
                    if (product && product.availabilityModel.inventoryRecord.ATS.value > 0) {
                        Transaction.wrap(function () {
                            cartHelper.addProductToCart(
                                currentBasket,
                                product.ID,
                                1,
                                childProducts,
                                options,
                                null, // eslint-disable-next-line
                                request,
                                true,
                                giftMessage
                            );
                        });
                    }
                }
            });
        }
    } catch (e) {
        result.error = true;
        result.errorMessage = Resource.msg('error.message.could.not.be.attached', 'checkout', null);
    }

    return result;
}


/**
 * Loop through all shipments and make sure all not null
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @returns {boolean} - allValid
 */
function ensureValidShipments(lineItemContainer) {
    var collections = require('*/cartridge/scripts/util/collections');
    const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    const giftCardShipmentID = 'EGiftCardShipment';
    var shipments = lineItemContainer.shipments;
    var allValid;
    if (giftcardHelper.basketHasGiftCardItems(lineItemContainer).onlyEGiftCards) {
        allValid = true;
    } else {
        allValid = collections.every(shipments, function (shipment) {
            var storeAddress = true;
            if (shipment) {
                var hasStoreID = shipment.custom && shipment.custom.fromStoreId;
                if (!empty(shipment.shippingMethod) && shipment.shippingMethod.custom && shipment.shippingMethod.custom.storePickupEnabled && !hasStoreID) {
                    storeAddress = false;
                }

                if (!empty(shipment.shippingMethod) && shipment.shippingMethod.custom && shipment.shippingMethod.custom.storePickupEnabled && storeAddress) {
                    storeAddress = collections.every(shipment.productLineItems, function (lineItem) {
                        return !empty(lineItem.shipment.custom.fromStoreId);
                    });
                }
            }
            if (shipment.ID !== giftCardShipmentID) {
                var address = shipment.shippingAddress;
                return address && address.address1 && storeAddress;
            }
            return true;
        });
    }
    return allValid;
}

/**
 * Sets the payment transaction amount
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an error object
 */
function calculatePaymentTransaction(currentBasket) {
    var result = { error: false };
    var collections = require('*/cartridge/scripts/util/collections');
    try {
        // TODO: This function will need to account for gift certificates at a later date
        var gcRedeemedAmount = giftCardHelper.getGcRedeemedAmount(currentBasket);
        var vipDataHelpers;
        if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
            vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
        }
        Transaction.wrap(function () {
            var paymentInstruments = currentBasket.paymentInstruments;

            if (!paymentInstruments.length) {
                return;
            }
            var orderTotal = currentBasket.totalGrossPrice;
            // Assuming that there is only one payment instrument used for the total order amount.
            // TODO: Will have to rewrite this logic once we start supporting multiple payment instruments for same order
            if (gcRedeemedAmount && gcRedeemedAmount > 0) {
                collections.forEach(paymentInstruments, function (paymentInstrument) {
                    if (paymentInstrument.paymentMethod !== 'GIFT_CARD' && !(vipDataHelpers && vipDataHelpers.vipPartialPointsApplied(paymentInstrument))) {
                        var nonGiftCertificateAmount = this.calculateNonGiftCertificateAmount(currentBasket);
                        paymentInstrument.paymentTransaction.setAmount(nonGiftCertificateAmount);
                    }
                });
            } else if (vipDataHelpers && vipDataHelpers.isPartialVipPointsApplied(currentBasket)) {
                var appliedPartialAmount = vipDataHelpers.calculatePartialVipAmount(currentBasket);
                if (appliedPartialAmount && appliedPartialAmount > 0) {
                    orderTotal = orderTotal.subtract(new Money(appliedPartialAmount, currentBasket.currencyCode));
                }
                let paymentInstrument = paymentInstruments[0];
                paymentInstrument.paymentTransaction.setAmount(orderTotal);
            } else {
                var paymentInstrument = paymentInstruments[0];
                paymentInstrument.paymentTransaction.setAmount(orderTotal);
            }
        });
    } catch (e) {
        result.error = true;
    }

    return result;
}

/**
 * Copies a raw address object to the basket shipping address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function copyBillingAddressToShippingAddress(address, currentBasket) {
    var shipment = currentBasket.getDefaultShipment();
    var shippingAddress = shipment.shippingAddress;

    if (!shippingAddress) {
        shippingAddress = shipment.createShippingAddress();
    }

    Transaction.wrap(function () {
        shippingAddress.setFirstName(address.firstName);
        shippingAddress.setLastName(address.lastName);
        shippingAddress.setAddress1(address.address1);
        shippingAddress.setAddress2(address.address2);
        shippingAddress.setCity(address.city);
        shippingAddress.setPostalCode(address.postalCode);
        shippingAddress.setStateCode(address.stateCode);
        shippingAddress.setCountryCode(address.countryCode.value);
        if (!shippingAddress.phone) {
            shippingAddress.setPhone(address.phone);
        }
    });
}

/**
 * This generic method return payment methods which are eligible at that particular movement of time
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {Object} giftCardFormData - giftCardForm data
 * @param {Object} vipPoints - vipPoints result object
 * @param {Object} currentCustomer - the current customer
 * @returns {Object} paymentMethods - Payment method object
 */
function getEligiblePaymentMethods(currentBasket, giftCardFormData, vipPoints, currentCustomer) {
    const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    const cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    const inStorePickUpHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
    var isKlarnaEnabledForPreOrder = 'isKlarnaEnabledForPreOrder' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isKlarnaEnabledForPreOrder') === true;
    var isOrderTotalRedeemed = giftCardFormData.gcResults.isOrderTotalRedeemed;
    var giftCardsLimitExceeded = giftCardFormData.giftCardsLimitExceeded;
    var gcPaymentInstruments = giftCardFormData.gcResults.gcPaymentInstruments;
    var isEmployee = false;

    if (currentCustomer.authenticated && currentCustomer.registered) {
        isEmployee = (!empty(customer.profile) && customer.profile.custom.isEmployee) || false;
    }

    var basketHasGiftCardItems = giftcardHelper.basketHasGiftCardItems(currentBasket);
    var basketHasBopisItems = inStorePickUpHelpers.basketHasInStorePickUpShipment(currentBasket.shipments);
    var paymentMethods = {
        nonGCPayment: true, // Here NonGC payment means CC, Paypal, Apple pay
        creditCard: true,
        payPal: !basketHasGiftCardItems.eGiftCards && !cartHelper.hasPreOrderItems(currentBasket),
        applePay: (!basketHasGiftCardItems.eGiftCards && !basketHasGiftCardItems.giftCards) && !basketHasBopisItems,
        giftCard: !((basketHasGiftCardItems.giftCards || isEmployee)),
        klarna: !basketHasGiftCardItems.giftCards && !isEmployee && ((isKlarnaEnabledForPreOrder) || (!isKlarnaEnabledForPreOrder && !cartHelper.hasPreOrderItems(currentBasket)))
    };

    if (giftCardsLimitExceeded || (gcPaymentInstruments && gcPaymentInstruments.length > 0 && isOrderTotalRedeemed)) {
        paymentMethods.nonGCPayment = false;
        paymentMethods.giftCard = true;
        paymentMethods.creditCard = false;
        paymentMethods.payPal = false;
        paymentMethods.applePay = false;
        paymentMethods.klarna = false;
    } else if (gcPaymentInstruments && gcPaymentInstruments.length > 0 && !isOrderTotalRedeemed) {
        paymentMethods.giftCard = true;
        paymentMethods.creditCard = true;
        paymentMethods.payPal = false;
        paymentMethods.applePay = false;
        paymentMethods.klarna = false;
    } else if (vipPoints && vipPoints.pointsApplied) {
        paymentMethods.nonGCPayment = false;
        paymentMethods.creditCard = false;
        paymentMethods.payPal = false;
        paymentMethods.applePay = false;
        paymentMethods.giftCard = false;
        paymentMethods.klarna = false;
    } else if (vipPoints && vipPoints.partialPointsApplied) {
        paymentMethods.nonGCPayment = true;
        paymentMethods.creditCard = true;
        paymentMethods.payPal = false;
        paymentMethods.applePay = false;
        paymentMethods.giftCard = true;
        paymentMethods.klarna = false;
    } else if (vipPoints && vipPoints.vipPromotionEnabled) {
        paymentMethods.nonGCPayment = true;
        paymentMethods.creditCard = true;
        paymentMethods.payPal = false;
        paymentMethods.applePay = false;
        paymentMethods.giftCard = false;
        paymentMethods.klarna = false;
    }

    return paymentMethods;
}

/**
 * Ensures ship to address shipment will be default shipment
 * @param {Object} req - the request object needed to access session.privacyCache
 */
function updateShipToAsDefaultShipment(req) {
    var AddressModel = require('*/cartridge/models/address');

    var currentBasket = BasketMgr.getCurrentBasket();
    var shipments = currentBasket.shipments;
    var defaultShipment = currentBasket.defaultShipment; // eslint-disable-next-line spellcheck/spell-checker
    if (defaultShipment.custom.shipmentType === 'instore' && shipments.length > 1) {
        Transaction.wrap(function () {
            var iter = shipments.iterator();
            while (iter.hasNext()) {
                var altShipment = iter.next(); // eslint-disable-next-line spellcheck/spell-checker
                if (altShipment.custom.shipmentType !== 'instore') {
                    // Move the valid marker with the shipment
                    var altValid = req.session.privacyCache.get(altShipment.UUID);
                    var defaultValid = req.session.privacyCache.get(defaultShipment.UUID);
                    req.session.privacyCache.set(currentBasket.defaultShipment.UUID, altValid);
                    req.session.privacyCache.set(altShipment.UUID, defaultValid);

                    // Swapping productLineItems
                    var defaultShipmentLineItems = defaultShipment.productLineItems;
                    for (let index = 0; index < altShipment.productLineItems.length; index++) {
                        altShipment.productLineItems[index].setShipment(currentBasket.defaultShipment);
                    }

                    for (let index = 0; index < defaultShipmentLineItems.length; index++) {
                        if ('custom' in defaultShipmentLineItems[index] && defaultShipmentLineItems[index].custom.fromStoreId) {
                            defaultShipmentLineItems[index].setShipment(altShipment);
                        }
                    }

                    // Swapping Shipping Address
                    var defaultShipmentShippingAddress = defaultShipment.shippingAddress;
                    if (altShipment.shippingAddress) {
                        // Copy from other address
                        var altShipmentAddressModel = new AddressModel(altShipment.shippingAddress);
                        copyShippingAddressToShipment(altShipmentAddressModel, defaultShipment);
                    } else {
                        // Or clear it out
                        defaultShipment.createShippingAddress();
                    }
                    if (defaultShipmentShippingAddress) {
                        // Copy from other address
                        var defaultShipmentAddressModel = new AddressModel(defaultShipmentShippingAddress);
                        copyShippingAddressToShipment(defaultShipmentAddressModel, altShipment);
                    } else {
                        // Or clear it out
                        altShipment.createShippingAddress();
                    }

                    // Swapping Shipment Attributes
                    var defaultShipmentAttributes = defaultShipment.custom;
                    var defaultShipmentAttributesKey = Object.keys(defaultShipmentAttributes);

                    var altShipmentAttributesKey = Object.keys(altShipment.custom);
                    for (let index = 0; index < altShipmentAttributesKey.length; index++) {
                        if (altShipmentAttributesKey[index] in defaultShipment.custom) {
                            defaultShipment.custom[altShipmentAttributesKey[index]] = altShipment.custom[altShipmentAttributesKey[index]];
                        }
                    }

                    for (let index = 0; index < defaultShipmentAttributesKey.length; index++) {
                        if (defaultShipmentAttributesKey[index] in defaultShipmentAttributes) {
                            altShipment.custom[defaultShipmentAttributesKey[index]] = defaultShipmentAttributes[defaultShipmentAttributesKey[index]];
                        }
                    }

                    delete defaultShipment.custom.fromStoreId;
                    delete defaultShipment.custom.shipmentType;

                    // Swapping Shipping Methods
                    var defaultShipmentShippingMethod = defaultShipment.shippingMethod;
                    currentBasket.defaultShipment.setShippingMethod(altShipment.shippingMethod);
                    altShipment.setShippingMethod(defaultShipmentShippingMethod);
                }
            }
        });
    }
}


/**
 * update billing state code from ApplePay & Paypal
 * @param {dw.order.Basket} basket - the basket object
 * @param {req} req - the req object
 */
function updateStateCode(basket) {
    try {
        var billingState = basket.billingAddress && basket.billingAddress.stateCode ? basket.billingAddress.stateCode.toLowerCase() : '';
        var billingCountry = basket.billingAddress && basket.billingAddress.countryCode ? basket.billingAddress.countryCode.value : '';
        if ((basket.getPaymentInstruments('DW_APPLE_PAY').length > 0 || basket.getPaymentInstruments('PayPal').length > 0)) {
            var mappingJSON = 'statesCodeMapping' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('statesCodeMapping') ? Site.current.getCustomPreferenceValue('statesCodeMapping') : null;
            var parseJSON = mappingJSON ? JSON.parse(mappingJSON) : null;
            if (parseJSON && billingState.length > 2) {
                let countryCodeMapping = parseJSON[billingCountry];
                let stateCode = countryCodeMapping && countryCodeMapping[billingState] ? countryCodeMapping[billingState] : billingState;
                if (stateCode) {
                    Transaction.wrap(function () {
                        basket.billingAddress.stateCode = stateCode;
                    });
                }
            } else {
                let stateCodeBilling = basket.billingAddress && basket.billingAddress.stateCode ? basket.billingAddress.stateCode : '';
                if (stateCodeBilling && (stateCodeBilling !== stateCodeBilling.toUpperCase())) {
                    stateCodeBilling = stateCodeBilling.toUpperCase();
                    Transaction.wrap(function () {
                        basket.billingAddress.stateCode = stateCodeBilling;
                    });
                }
            }
            var shipments = basket.shipments;
            var collections = require('*/cartridge/scripts/util/collections');
            collections.forEach(shipments, function (shipment) {
                var shippingAddress = shipment.shippingAddress;
                var shippingStateCode = shippingAddress && shippingAddress.stateCode ? shippingAddress.stateCode.toLowerCase() : '';
                var shippingCountry = shippingAddress && shippingAddress.countryCode ? shippingAddress.countryCode.value : '';
                if (parseJSON && shippingStateCode.length > 2 && (shippingCountry === 'CA' || shippingCountry === 'MX')) {
                    let countryCodeMapping = parseJSON[shippingCountry];
                    let stateCode = countryCodeMapping && countryCodeMapping[shippingStateCode] ? countryCodeMapping[shippingStateCode] : shippingStateCode;
                    if (stateCode) {
                        Transaction.wrap(function () {
                            shipment.shippingAddress.stateCode = stateCode;
                        });
                    }
                } else {
                    let stateCodeShipping = shipment.shippingAddress && shipment.shippingAddress.stateCode ? shipment.shippingAddress.stateCode : '';
                    if (stateCodeShipping && (stateCodeShipping !== stateCodeShipping.toUpperCase())) {
                        stateCodeShipping = stateCodeShipping.toUpperCase();
                        Transaction.wrap(function () {
                            shipment.shippingAddress.stateCode = stateCodeShipping;
                        });
                    }
                }
            });
        }
    } catch (e) {
        Logger.error('Error while executing updateStateCode() : ' + e);
    }
}

/**
 * updates phone number
 * @param {boolean} isEmployee - is customer an employee
 * @param {boolean} isVIP - is customer VIP
 * @param {boolean} orderContainsPreorder - basket contains orderContainsPreorder
 * @param {boolean} basketHasEGiftCard - basket contains egift cards
 * @returns {boolean} eligibleForShipToCollectionPoint
 */
function eligibleForShipToCollectionPoint(isEmployee, isVIP, orderContainsPreorder, basketHasEGiftCard) {
    var isShipTocollection = false;
    try {
        var shipToCollectionPoint = isHALShippingEnabled(); // set halShippingEnabled site preference true /false based cookie values
        if (shipToCollectionPoint && !isEmployee && !isVIP && !orderContainsPreorder && !basketHasEGiftCard) {
            isShipTocollection = true;
        }
        return isShipTocollection;
    } catch (e) {
        return isShipTocollection;
    }
}

/**
 * convert store working hours from 24 hour format to 12 hour format
 * @param {Object} pickupLocations - pick up collection points
 * @returns {boolean} eligibleForShipToCollectionPoint
 */
function convertStoreWorkingHours(pickupLocations) {
    try {
        var collectionPoints = pickupLocations;
        if (collectionPoints.count > 0) {
            for (let i = 0; i < collectionPoints.count; i++) {
                var location = collectionPoints.locations[i];
                var pickupHours = location.pickupHours;
                for (let j = 0; j < pickupHours.length; j++) {
                    var hours = pickupHours[j]; // eslint-disable-next-line
                    var openTime = hours.openTime.split(':'); // eslint-disable-next-line
                    var closeTime = hours.closeTime.split(':');

                    var openTimeHour = openTime[0];
                    var closeTimeHour = closeTime[0];

                    var openAmPm = (openTimeHour < 12 || openTimeHour === 24) ? ' AM' : ' PM';
                    var closeAmPm = (closeTimeHour < 12 || closeTimeHour === 24) ? ' AM' : ' PM';

                    if (openTimeHour > 12) { // eslint-disable-next-line
                        openTimeHour = (openTimeHour - 12);
                        // openTimeHour = openTimeHour < 10 ?  openTimeHour : openTimeHour;
                    }
                    if (closeTimeHour > 12) { // eslint-disable-next-line
                        closeTimeHour = (closeTimeHour - 12);
                        closeTimeHour = closeTimeHour < 10 ? closeTimeHour : closeTimeHour;
                    }
                    if (openTimeHour === '00') {
                        openTimeHour = 12;
                    }
                    if (closeTimeHour === '00') {
                        closeTimeHour = 12;
                    }
                    openTimeHour = openTimeHour < 10 && openTimeHour !== '00' ? openTimeHour[1] : openTimeHour;
                    var openFormat = openTime[2] === '00' ? '' : (':' + openTime[2]);
                    var closeFormat = closeTime[2] === '00' ? '' : ':' + closeTime[2];
                    hours.openTime = openTimeHour + openFormat + openAmPm;
                    hours.closeTime = closeTimeHour + closeFormat + closeAmPm;
                    collectionPoints.locations[i].pickupHours[j] = hours;
                }
            }
        }
        return collectionPoints;
    } catch (e) {
        return null;
    }
}
/**
 * updates phone number
 * @param {dw.order.Basket} currentBasket - the Basket object
 */
function autoCorrectPhonenumber(currentBasket) {
    try {
        var phone = currentBasket.billingAddress.phone;
        if (phone) {
            var updatedPhone = phone.split(' ').join('').replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
            Transaction.wrap(function () {
                currentBasket.billingAddress.phone = updatedPhone;
            });
        }
    } catch (e) {
        Logger.error('Error while executing autoCorrectPhonenumber() : ' + e);
    }
}

/**
 * replace PostalCode for CA
 * @param {string} postalCode - postal code
 * @returns {string} postalCode
 */
function replacePostalCodeCA(postalCode) {
    var regEx = '^(?!.*[DFIOQUdfioqu])[A-VXYa-vxy][0-9][A-Za-z][0-9][A-Za-z][0-9]$';
    var regExpression = new RegExp(regEx);
    var isvalid = regExpression.test(postalCode);
    if (isvalid) {
        postalCode = postalCode.replace(/^(.{3})(.*)$/, '$1 $2');
    }
    return postalCode;
}

/**
 * update postal code from ApplePay & Paypal
 * @param {dw.order.Basket} currentBasket - the Basket object
 * @param {req} req - the req object
 */
function updatePostalCode(currentBasket) {
    try {
        var shipments = currentBasket.shipments;
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(shipments, function (shipment) {
            if (shipment.shippingAddress && shipment.shippingAddress.countryCode && shipment.shippingAddress.countryCode.value === 'CA') {
                var shippingAddress = shipment.shippingAddress;
                var postalCode = shippingAddress.postalCode;
                var result = replacePostalCodeCA(postalCode);
                Transaction.wrap(function () {
                    shippingAddress.postalCode = result;
                });
            }
        });

        var billingpostalCode = currentBasket.billingAddress.postalCode;
        var billingCountry = currentBasket.billingAddress && currentBasket.billingAddress.countryCode ? currentBasket.billingAddress.countryCode.value : '';
        if (billingCountry === 'CA') {
            var resultPostal = replacePostalCodeCA(billingpostalCode);
            Transaction.wrap(function () {
                currentBasket.billingAddress.postalCode = resultPostal;
            });
        }
    } catch (e) {
        Logger.error('Error while executing updatePostalCode (): ' + e);
    }
}

/**
 * This method will check whether current basket has shipping,billing address and payment instrument are present or not
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {string} currentStage - The current Stage of checkout
 * @returns {boolean} - isShipBillPay
 */
function isShipBillPayExistInBasket(currentBasket, currentStage) {
    var isShipBillPay = false;
    if (currentStage === 'placeOrder' && currentBasket.defaultShipment.shippingAddress && currentBasket.billingAddress && !empty(currentBasket.getPaymentInstruments()) && currentBasket.getPaymentInstruments().length > 0) {
        isShipBillPay = true;
    } else if (currentStage === 'payment' && currentBasket.defaultShipment.shippingAddress) {
        isShipBillPay = true;
    }
    return isShipBillPay;
}

/**
 * validate payment card exists
 * @param {Object} currentBasket dw basket
 * @param {string} countryCode country code
 * @param {Object} currentCustomer current customer
 * @returns {Object} result returns status of payment card
 */
function validatePaymentCards(currentBasket, countryCode, currentCustomer) {
    var applicablePaymentCards;
    var applicablePaymentMethods;
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentAmount = currentBasket.totalGrossPrice.value;
    var paymentInstruments = currentBasket.paymentInstruments;
    var result = {};

    applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
        countryCode,
        paymentAmount
    );
    applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
        currentCustomer,
        countryCode,
        paymentAmount
    );

    var invalid = true;
    var paymentInfo = [];
    for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];

        if ((PaymentInstrument.METHOD_GIFT_CERTIFICATE) === (paymentInstrument.paymentMethod)) {
            invalid = false;
        }

        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
        paymentInfo.push('paymentMethod : ' + paymentMethod.ID);
        if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
            if ((PaymentInstrument.METHOD_CREDIT_CARD) === (paymentInstrument.paymentMethod)) {
                var card = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);
                paymentInfo.push('cardType : ' + (!empty(card) ? card.cardType : ''));
                // Checks whether payment card is still applicable.
                if (card && applicablePaymentCards.contains(card)) {
                    invalid = false;
                }
            } else {
                invalid = false;
            }
        }

        if (invalid) {
            var basketInfo = {
                cust_no: currentBasket.customerNo || customer.ID,
                basket_id: currentBasket.UUID,
                paymentInfo: paymentInfo, // It contains only card type and payment method ID
                totalGrossPrice: paymentAmount,
                shippingMethodID: !empty(currentBasket.defaultShipment) ? currentBasket.defaultShipment.shippingMethodID : ''
            };
            Logger.getLogger('validatePaymentCards').error('Invalid Payment Type :: {0}', JSON.stringify(basketInfo));
            break; // there is an invalid payment instrument
        }
    }

    result.error = invalid;
    return result;
}

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
    return validatePaymentCards(currentBasket, req.geolocation.countryCode, req.currentCustomer.raw);
}

/**
 * Loop through all shipments and make sure all not null for addressType and SAPcarriercodes
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @returns {boolean} - allValid
 */
function ensureValidAddressType(lineItemContainer) {
    var collections = require('*/cartridge/scripts/util/collections');
    const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    const basketHelper = require('*/cartridge/scripts/basketHelper');
    const giftCardShipmentID = 'EGiftCardShipment';
    var shipments = lineItemContainer.shipments;
    var allValid;
    if (giftcardHelper.basketHasGiftCardItems(lineItemContainer).onlyEGiftCards) {
        allValid = true;
    } else {
        allValid = collections.every(shipments, function (shipment) {
            if (shipment.ID !== giftCardShipmentID && !shipment.getProductLineItems().isEmpty()) {
                var address = shipment.shippingAddress;

                Transaction.wrap(function () {
                    if (address && empty(address.custom.addressType)) {
                        basketHelper.updateAddressType(address);
                    }
                });

                return !!(address && address.custom.addressType);
            }
            return true;
        });
    }
    return allValid;
}

/**
 * Save the pick up notification data to productLineItems
 * @param {Object} productLineItem - dw.order.ProductLineItem
 * @param {Object} form - pick up notification form
 * @param {Object} stage - pick up notification stage
 * @returns {Object} pickUpContactData
 */
function saveInstorePickUpContacts(productLineItem, form, stage) {
    var pickUpContactData = {};
    if (productLineItem) {
        if (!empty(form)) {
            pickUpContactData.firstName = form.personFirstName.value;
            pickUpContactData.lastName = form.personLastName.value;
            pickUpContactData.phone = form.personPhone.value;
            pickUpContactData.email = form.personEmail.value;
        }

        Transaction.wrap(function () {
            switch (stage) {
                case 'primary':
                    productLineItem.custom.primaryContactBOPIS = JSON.stringify(pickUpContactData);
                    break;
                case 'secondary':
                    productLineItem.custom.secondaryContactBOPIS = JSON.stringify(pickUpContactData);
                    break;
                default:
                    productLineItem.custom.primaryContactBOPIS = '';
                    productLineItem.custom.secondaryContactBOPIS = '';
                    break;
            }
        });
    }

    return pickUpContactData;
}

/**
 * Determines whether a Locale has atleast one corresponding address or not
 * @param {string} currentCountry - current locale
 * @param {Object} customerAddress - dw.customer.CustomerAddress
 * @returns {boolean} containsLocaleAddress
 */
function containsAtleastOneLocaleAddress(currentCountry, customerAddress) {
    var containsLocaleAddress = false;
    for (var i = 0; i < customerAddress.length; i++) {
        var addressCountry = customerAddress[i].countryCode.value;
        if (addressCountry === currentCountry) {
            containsLocaleAddress = true;
            break;
        } else {
            containsLocaleAddress = false;
        }
    }

    return containsLocaleAddress;
}

/**
 * Determines whether a Locale has atleast one corresponding address or not
 * @param {string} currentCountry - current locale
 * @param {Object} customerAddress - dw.customer.CustomerAddress
 * @returns {Object} address
 */
function getLocaleAddress(currentCountry, customerAddress) {
    var address = null;
    for (var i = 0; i < customerAddress.length; i++) {
        var addressCountry = customerAddress[i].countryCode.value;
        if (addressCountry === currentCountry) {
            address = customerAddress[i];
            break;
        }
    }

    return address;
}

/**
 * To copy customer address to Billing & Shipping
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {Object} currentCustomer current customer
 */
function copyCustomerAddressToBasket(currentBasket, currentCustomer) {
    var shipments = currentBasket.shipments;
    var billingAddress = currentBasket.billingAddress;
    var preferredAddress = null;
    var Locale = require('dw/util/Locale');
    var countryCode = Locale.getLocale(request.locale).country; // eslint-disable-line
    var containsLocaleAddress = null;
    if (currentCustomer && currentCustomer.addressBook && currentCustomer.addressBook.addresses.length > 0) {
        containsLocaleAddress = getLocaleAddress(countryCode, currentCustomer.addressBook.addresses);
    }
    if (currentCustomer && currentCustomer.addressBook && currentCustomer.addressBook.preferredAddress && currentCustomer.addressBook.preferredAddress.countryCode === countryCode) {
        preferredAddress = currentCustomer.addressBook.preferredAddress;
    } else if (containsLocaleAddress) {
        preferredAddress = containsLocaleAddress;
    }
    // only true if customer is registered
    if (preferredAddress) {
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(shipments, function (shipment) {
            if (!shipment.shippingAddress && preferredAddress.countryCode.value === countryCode) {
                copyCustomerAddressToShipment(preferredAddress, shipment);
            }
        });

        if (!billingAddress) {
            var isInternationalBillingAddress = 'isInternationalBillingAddressEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isInternationalBillingAddressEnabled');
            if (isInternationalBillingAddress || (preferredAddress && preferredAddress.countryCode && preferredAddress.countryCode.value === countryCode)) {
                copyCustomerAddressToBilling(preferredAddress);
            }
        }
    }
}

/**
 * update billing state code from ApplePay & Paypal
 * @param {dw.order.Order} order - the order object
 */
function updateBillingStateCode(order) {
    var billingState = order.billingAddress && order.billingAddress.stateCode ? order.billingAddress.stateCode.toLowerCase() : '';
    var billingCountry = order.billingAddress && order.billingAddress.countryCode ? order.billingAddress.countryCode.value : '';
    if ((order.getPaymentInstruments('DW_APPLE_PAY').length > 0 || order.getPaymentInstruments('PayPal').length > 0) && billingState.length > 2) {
        if ('statesCodeMapping' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('statesCodeMapping')) {
            var mappingJSON = Site.current.getCustomPreferenceValue('statesCodeMapping');
            mappingJSON = JSON.parse(mappingJSON);
            var countryCodeMapping = mappingJSON[billingCountry];
            var stateCode = countryCodeMapping && countryCodeMapping[billingState] ? countryCodeMapping[billingState] : billingState;
            if (stateCode) {
                Transaction.wrap(function () {
                    order.billingAddress.stateCode = stateCode;
                });
            }
        } else {
            let stateCodeBilling = order.billingAddress && order.billingAddress.stateCode ? order.billingAddress.stateCode : '';
            if (stateCodeBilling && (stateCodeBilling !== stateCodeBilling.toUpperCase())) {
                Transaction.wrap(function () {
                    order.billingAddress.stateCode = stateCodeBilling.toUpperCase();
                });
            }
        }
    }
}
/**
 * validate major input fields against xss valnability, non latin characters and regex pattern
 * @param {Object} addressObject - addressObject
 * @returns {Object} an error object
 */
function validateInputFieldsForShippingMethod(addressObject) {
    var checkCrossSiteScript = require('*/cartridge/scripts/utils/checkCrossSiteScript');
    var addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'city', 'stateCode', 'postalCode', 'countryCode'];
    var inputValidationErrors = {
        error: false,
        shippingAddressErrors: {},
        genericErrorMessage: ''
    };
    // Validate shipping address
    if (addressObject) {
        inputValidationErrors.shippingAddressErrors = checkCrossSiteScript.crossSiteScriptPatterns(addressObject, addressFieldsToVerify);
    }
    if (Object.keys(inputValidationErrors.shippingAddressErrors).length > 0) {
        inputValidationErrors.error = true;
        inputValidationErrors.genericErrorMessage = Resource.msg('checkout.nonlatincharacters.error', 'checkout', null);
    }
    return inputValidationErrors;
}

/**
 * validation to check for emoji characters, non latin characters and regex pattern
 * @param {Object} object - data object
 * @param {Object} addressFieldsToVerify - array of fields to validate
 * @param {string} countryCode - country code
 * @returns {Object} errors
 */
function checkEmptyEmojiNonLatinChars(object, addressFieldsToVerify, countryCode) {
    var errors = {};
    try {
        var regexToCheckEmojiNonLatinChars = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff]|[\u0250-\ue007])/;
        var emoRegex = /([#0-9]\u20E3)|[\xA9\xAE\u203C\u2047-\u2049\u2122\u2139\u3030\u303D\u3297\u3299][\uFE00-\uFEFF]?|[\u2190-\u21FF][\uFE00-\uFEFF]?|[\u2300-\u23FF][\uFE00-\uFEFF]?|[\u2460-\u24FF][\uFE00-\uFEFF]?|[\u25A0-\u25FF][\uFE00-\uFEFF]?|[\u2600-\u27BF][\uFE00-\uFEFF]?|[\u2900-\u297F][\uFE00-\uFEFF]?|[\u2B00-\u2BF0][\uFE00-\uFEFF]?|(?:\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDEFF])[\uFE00-\uFEFF]?/g;
        var patterns = {
            firstName: /^.{1,100}$/,
            lastName: /^.{1,100}$/,
            address1: /^([^_]){1,35}$/,
            address2: /^([^_]){0,35}$/,
            city: {
                US: /^([^0-9]){1,100}$/,
                CA: /^.{1,100}$/,
                AT: /^.{1,100}$/,
                BE: /^.{1,100}$/,
                DK: /^.{1,100}$/,
                FR: /^.{1,100}$/,
                DE: /^.{1,100}$/,
                GB: /^.{1,100}$/,
                IE: /^.{1,100}$/,
                IT: /^.{1,100}$/,
                NL: /^.{1,100}$/,
                ES: /^.{1,100}$/,
                SE: /^.{1,100}$/
            },
            stateCode: (!empty(countryCode) && countryCode !== 'US' && countryCode !== 'CA') ? /^.{1,100}$/ : /^[A-Z]{2}$/,
            countryCode: /^[A-Z]{2}$/,
            postalCode: {
                US: /^\d{5}$|^\d{5}-\d{4}|\d{5,9}\s*$/,
                CA: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( ){1}\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i,
                AT: /^\d{4}$/,
                BE: /^\d{4}$/,
                DK: /^\d{4}$/,
                FR: /^\d{5}$/,
                DE: /^\d{5}$/,
                GB: /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0A{2})$/i,
                IE: /(?:^[AC-FHKNPRTV-Y][0-9]{2}|D6W)[ -]?[0-9AC-FHKNPRTV-Y]{4}$/i,
                IT: /^\d{5}$/,
                NL: /^(?:NL-)?(\d{4})\s*([A-Z]{2})$/i,
                ES: /^\d{5}$/,
                SE: /^\d{3}\s*\d{2}$/
            },
            phone: /^[0-9]*$/,
            customerEmail: /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/,
            giftMessage: /^.{0,140}$/
        };
        var field = '';
        var value = '';
        var regex = '';
        var requiredFields = ['firstName', 'lastName', 'address1', 'city', 'postalCode', 'countryCode', 'stateCode'];
        for (var i = 0; i < addressFieldsToVerify.length; i++) {
            field = addressFieldsToVerify[i];
            value = object[field];
            regex = patterns[field];

            if (field === 'postalCode' || field === 'city') {
                regex = patterns[field][countryCode];
            } else if (field === 'countryCode') {
                value = object[field].value ? object[field].value : value;
            }

            // checking required fields from validateInputFields function
            if (empty(value) && requiredFields.indexOf(field) > -1) {
                errors[field] = field + ' is empty';
            }
            if ((!empty(value) && regexToCheckEmojiNonLatinChars.test(value)) || (!empty(value) && !empty(regex) && !regex.test(value)) || (!empty(value) && emoRegex.test(value))) {
                errors[field] = Resource.msg('checkout.nonlatincharacters.error', 'checkout', null);
            }
        }
    } catch (e) {
        // TODO:
    }
    return errors;
}

/**
 * validate if country is a supported shipping country
 * @param {string} countryCode - two letter country code
 * @returns {boolean} true if country is supported. Also true if attribute is not defined.
 */
function isCountryShippable(countryCode) {
    const prefName = 'shippableCountries';
    const shippableCountries = require('*/cartridge/scripts/utils/PreferencesUtil').getValue(prefName);

    // Account for instances that do not have this attribute defined.
    if (shippableCountries === null || empty(shippableCountries)) return true;

    if (countryCode) {
        for (let item of shippableCountries) {
            if (item.toLowerCase() === countryCode.toLowerCase()) return true;
        }
    }
    return false;
}

/**
 * validate major input fields against emoji characters, non latin characters and regex pattern
 * @param {dw.order.Basket} lineItemCtnr - Basket object
 * @returns {Object} an error object
 */
function validateInputFields(lineItemCtnr) {
    var checkCrossSiteScript = require('*/cartridge/scripts/utils/checkCrossSiteScript');
    var addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'city', 'stateCode', 'postalCode', 'countryCode'];
    var giftMessageFieldsToVerify = ['giftMessage'];
    var customerEmailField = ['customerEmail'];
    var phoneField = ['phone'];
    var inputValidationErrors = {
        error: false,
        shippingAddressErrors: {},
        billingAddressErrors: {},
        giftMessageErrors: {},
        contactInfoErrors: {},
        genericErrorMessage: ''
    };
    var countryCode = '';
    var shippingAddress = lineItemCtnr.defaultShipment.shippingAddress;
    // Validate shipping address
    if (shippingAddress) {
        countryCode = shippingAddress.countryCode.value;
        if (!isCountryShippable(countryCode)) {
            inputValidationErrors.shippingAddressErrors.countryCode = Resource.msg('invalid.country', 'checkout', null);
        } else {
            inputValidationErrors.shippingAddressErrors = checkEmptyEmojiNonLatinChars(shippingAddress, addressFieldsToVerify, countryCode);
            if (Object.keys(inputValidationErrors.shippingAddressErrors).length === 0) {
                inputValidationErrors.shippingAddressErrors = checkCrossSiteScript.crossSiteScriptPatterns(shippingAddress, addressFieldsToVerify);
            }
        }
    }
    // Validate billing address
    var billingAddress = lineItemCtnr.billingAddress;
    if (billingAddress) {
        countryCode = billingAddress.countryCode.value;
        inputValidationErrors.billingAddressErrors = checkEmptyEmojiNonLatinChars(billingAddress, addressFieldsToVerify, countryCode);
        if (Object.keys(inputValidationErrors.billingAddressErrors).length === 0) {
            inputValidationErrors.billingAddressErrors = checkCrossSiteScript.crossSiteScriptPatterns(billingAddress, addressFieldsToVerify);
        }
    }
    // Validate gift message Field
    if (lineItemCtnr.defaultShipment && lineItemCtnr.defaultShipment.giftMessage) {
        inputValidationErrors.giftMessageErrors = checkEmptyEmojiNonLatinChars(lineItemCtnr.defaultShipment, giftMessageFieldsToVerify);
        if (Object.keys(inputValidationErrors.giftMessageErrors).length === 0) {
            inputValidationErrors.giftMessageErrors = checkCrossSiteScript.crossSiteScriptPatterns(lineItemCtnr.defaultShipment, giftMessageFieldsToVerify);
        }
    }
    // Validate contact info Details
    if (lineItemCtnr.customerEmail) {
        var customerEmailValidation = checkEmptyEmojiNonLatinChars(lineItemCtnr, customerEmailField);
        if (Object.keys(customerEmailValidation).length > 0) {
            inputValidationErrors.contactInfoErrors.customerEmail = customerEmailValidation.customerEmail;
        } else if (Object.keys(customerEmailValidation).length === 0) {
            customerEmailValidation = checkCrossSiteScript.crossSiteScriptPatterns(lineItemCtnr, customerEmailField);
            if (Object.keys(customerEmailValidation).length > 0) {
                inputValidationErrors.contactInfoErrors.customerEmail = customerEmailValidation.customerEmail;
            }
        }
        if (billingAddress && billingAddress.phone) {
            var phoneValidation = checkEmptyEmojiNonLatinChars(billingAddress, phoneField, countryCode);
            if (Object.keys(phoneValidation).length > 0) {
                inputValidationErrors.contactInfoErrors.phone = phoneValidation.phone;
            } else if (Object.keys(phoneValidation).length === 0) {
                phoneValidation = checkCrossSiteScript.crossSiteScriptPatterns(billingAddress, phoneField);
                if (Object.keys(phoneValidation).length > 0) {
                    inputValidationErrors.contactInfoErrors.phone = phoneValidation.phone;
                }
            }
        }
    }
    if (Object.keys(inputValidationErrors.shippingAddressErrors).length > 0 || Object.keys(inputValidationErrors.billingAddressErrors).length > 0 || Object.keys(inputValidationErrors.giftMessageErrors).length > 0 || Object.keys(inputValidationErrors.contactInfoErrors).length > 0) {
        inputValidationErrors.error = true;
        if (Object.keys(inputValidationErrors.contactInfoErrors).length > 0) {
            inputValidationErrors.genericErrorMessage = Resource.msg('checkout.nonlatincharacters.specificerror', 'checkout', null);
        } else if (Object.keys(inputValidationErrors.billingAddressErrors).length > 0) {
            inputValidationErrors.genericErrorMessage = Resource.msg('billingaddress.invalid.errormessage', 'checkout', null);
        } else if (!empty(inputValidationErrors.shippingAddressErrors.countryCode) || !empty(inputValidationErrors.billingAddressErrors.countryCode)) {
            inputValidationErrors.genericErrorMessage = Resource.msg('invalid.country', 'checkout', null);
        } else {
            inputValidationErrors.genericErrorMessage = Resource.msg('checkout.nonlatincharacters.error', 'checkout', null);
        }
    }
    return inputValidationErrors;
}

/**
 * Determines whether Gift Card Form is Valid
 * @param {Object} giftCardForm - Gift Card Form
 * @returns {Object} Gift Card Form Errors
 */
function giftCardCharactersValidations(giftCardForm) {
    var checkCrossSiteScript = require('*/cartridge/scripts/utils/checkCrossSiteScript');
    var fieldsToVerify = ['gcRecipientName', 'gcMessage', 'gcFrom', 'gcRecipientEmail', 'gcAmount'];
    var inputValidationErrors = {
        error: false,
        giftCardErrors: {}
    };
    var countryCode = '';
    var giftCardErrors = checkEmptyEmojiNonLatinChars(giftCardForm, fieldsToVerify, countryCode);
    if (Object.keys(giftCardErrors).length > 0) {
        inputValidationErrors.error = true;
        inputValidationErrors.giftCardErrors = Resource.msg('checkout.nonlatincharacters.error', 'checkout', null);
    } else if (Object.keys(giftCardErrors).length === 0) {
        giftCardErrors = checkCrossSiteScript.crossSiteScriptPatterns(giftCardForm, fieldsToVerify);
        if (Object.keys(giftCardErrors).length > 0) {
            inputValidationErrors.error = true;
            inputValidationErrors.giftCardErrors = Resource.msg('checkout.nonlatincharacters.error', 'checkout', null);
        }
    }

    // Checks if eGift Card Amount is missing or invalid
    if (Object.keys(giftCardErrors).length === 0) {
        giftCardErrors = checkEGiftCardAmount(giftCardForm);
        if (Object.keys(giftCardErrors).length > 0) {
            inputValidationErrors.error = true;
            inputValidationErrors.giftCardErrors = Resource.msg('error.egiftcard.amount.missing.or.invalid', 'checkout', null);
        }
    }
    return inputValidationErrors;
}

/**
 * Check the current basket billing form
 * If HAL orders, Clears the Billing form fields
 * @param {Object} billingAddress searches for values exists or not
 * @param {Object} billingForms sets an empty
 */
function setEmptyValueBillingForm(billingAddress, billingForms) {
    Transaction.wrap(function () {
        if (!empty(billingAddress && billingForms)) {
            if (empty(billingForms.firstName)) {
                billingAddress.firstName = '';
            }
            if (empty(billingForms.lastName)) {
                billingAddress.lastName = '';
            }
            if (empty(billingForms.address1)) {
                billingAddress.address1 = '';
            }
            if (empty(billingForms.address2)) {
                billingAddress.address2 = '';
            }
            if (empty(billingForms.city)) {
                billingAddress.city = '';
            }
            if (empty(billingForms.postalCode)) {
                billingAddress.postalCode = '';
            }
            if (empty(billingForms.stateCode)) {
                billingAddress.stateCode = '';
            }
        }
    });
}

/**
 * Sets the shipping address fields empty
 * @param {dw.order.Basket} basket - The current basket
 */
function setEmptyShippingAddressFields(basket) {
    Transaction.wrap(function () {
        if (!empty(basket.defaultShipment.shippingAddress)) {
            var shippingAddress = basket.defaultShipment.shippingAddress;
            shippingAddress.firstName = '';
            shippingAddress.lastName = '';
            shippingAddress.address1 = '';
            shippingAddress.address2 = '';
            shippingAddress.city = '';
            shippingAddress.postalCode = '';
            shippingAddress.stateCode = '';
        }
    });
}

/**
 * Log capture Intermittent > Missing Product Details on BF Orders
 * @param {Object} productLineItemsObject product line items
 * @param {string} executeType using to detect before or after execution for BF
 * @return {string} isOPDMissing
 */
function bfOrdersMissingProductDetails(productLineItemsObject, executeType) {
    var collections = require('*/cartridge/scripts/util/collections');
    var BFOrderCreateLogger = Logger.getLogger('BFOrderCreate', 'BFOrderCreate');
    var isOPDMissing = false;
    var productLinItem;
    try {
        collections.forEach(productLineItemsObject, function (pli) {
            if (pli.product === null || typeof pli.product === undefined) {
                isOPDMissing = true;
                productLinItem = pli;
            }
        });
        if (isOPDMissing && executeType === 'bfBeforeSendBF') {
            BFOrderCreateLogger.error('Before send current basket to BF checking missing productID:' + productLinItem.productID + ' And product SKU:' + productLinItem.custom.sku);
        } else if (isOPDMissing && executeType === 'bfboc') {
            BFOrderCreateLogger.error('Before create BF Order checking missing productID:' + productLinItem.productID + ' And product SKU:' + productLinItem.custom.sku);
        } else if (isOPDMissing && executeType === 'bfaoc') {
            BFOrderCreateLogger.error('After create BF Order missing productID =>:' + productLinItem.productID + ' And product SKU:' + productLinItem.custom.sku);
        }
    } catch (e) {
        Logger.error('Error in checkoutHelper.js function execute bfOrdersMissingProductDetails()' + e.message);
    }
    return isOPDMissing;
}

/**
 * @param {dw.order.Order} order - Current order
 * @returns {Object} status
 */
function handlePendingKlarnaOrder(order) {
    var result = {
        error: false
    };
    try {
        if (order && order.getPaymentInstruments('KLARNA_PAYMENTS').length > 0) {
            const klarnaCheckoutHelper = require('int_klarna_payments_custom/cartridge/scripts/checkout/checkoutHelpers');
            const KlarnaPaymentsConstants = require('*/cartridge/scripts/util/klarnaPaymentsConstants.js');

            var klarnaPaymentTransaction = null;
            var kpFraudStatus = null;
            var KLARNA_FRAUD_STATUSES = KlarnaPaymentsConstants.FRAUD_STATUS;
            if (isKlarnaPaymentEnabled()) {
                klarnaPaymentTransaction = klarnaCheckoutHelper.findKlarnaPaymentTransaction(order);
                kpFraudStatus = klarnaPaymentTransaction && klarnaPaymentTransaction.custom ? klarnaPaymentTransaction.custom.kpFraudStatus : null;
            }
            if (kpFraudStatus === KLARNA_FRAUD_STATUSES.PENDING) {
                Transaction.wrap(function () {
                    order.trackOrderChange('Order Failed Reason: Klarna Fraud Status - Pending');
                });
                throw new Error();
            }
        }
    } catch (e) {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });
        result.error = true;
    }
    return result;
}

/**
 * Handle the processing of payment transaction
 *
 * @param {dw.order.LineItemCtnr} basket - Current basket
 * @param {string} paymentMethodID - Selected Payment Method
 * @returns {Object} Processor handling result
 */
function handlePaymentMethods(basket, paymentMethodID) {
    var methodId = paymentMethodID;

    var amount = basket.totalGrossPrice;

    var paymentInstrument = null;

    Transaction.wrap(function () {
        paymentInstrument = basket.createPaymentInstrument(methodId, amount);
    });

    return {
        success: true,
        paymentInstrument: paymentInstrument
    };
}

/**
 * Returns true if valid cookie is set to 1 or New Payment Experience site Preference is enabled
 * @returns {boolean} - true if valid cookie is set to 1 / fall back - site Preference enabled
 */
function isRadioPaymentExperienceEnabled() {
    try {
        var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
        var cookie928 = cookieHelper.read('ua_exp_gei_928');
        var isNewPaymentExperienceEnabled = 'isRadioPaymentExperienceEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isRadioPaymentExperienceEnabled');
        var enableRadioPaymentExp = false; // eslint-disable-next-line
        var validCookie = cookie928 && (cookie928.toString() === '1' || cookie928.toString() === '0' || cookie928.toString() === '99') ? true : false;
        if (validCookie && cookie928.toString() === '1') {
            enableRadioPaymentExp = true;
        } else if (validCookie && (cookie928.toString() === '0' || cookie928.toString() === '99')) {
            enableRadioPaymentExp = false;
        } else if (!validCookie && isNewPaymentExperienceEnabled) { // eslint-disable-next-line
            enableRadioPaymentExp = isNewPaymentExperienceEnabled;
        }
        return enableRadioPaymentExp;
    } catch (e) {
        Logger.error('Error in checkoutHelper.js function execute isRadioPaymentExperienceEnabled()' + e.message);
        return false;
    }
}
/**
 * fetches item from cartModel
 * @param {Object} cartModel - The current user's basket cartModel object
 * @param {Object} pli - lineItem from basket.
 * @returns {Object} - cartModel item
 */
function getDataItem(cartModel, pli) {
    var dataItem = {};
    try {
        var cartItem = cartModel.items.filter(function (item) {
            if (pli.product.ID === item.id) {
                return item;
            }
            return null;
        });
        dataItem.cartModelItem = cartItem[0];
        dataItem.storeInventory = pli.custom.storeInventory;
    } catch (e) {
        Logger.error('Error in getDataItem()' + e.message);
    }
    return dataItem;
}

/**
 * Moves pli to shipToAddress or remove based on the availability
 * @param {Object} cartModel - The current user's basket cartModel object
 * @param {dw.order.Basket} currentBasket - The current user's basket
 * @param {Object} validatedBOPISProducts - Validation status object return by basketValidation helper
 * @returns {Object} - An object holds array of fullyMoved, partiallyMoved, fullyRemoved and partiallyRemoved products.
 */
function handleInvalidBopisItems(cartModel, currentBasket, validatedBOPISProducts) {
    const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
    var collections = require('*/cartridge/scripts/util/collections');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    const AvailabilityHelper = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper') : {};
    var Availability = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailability') : {};
    var results = {
        fullyMovedToShipping: [],
        fullyRemovedItems: [],
        partiallyMovedToShipping: [],
        partiallyRemovedItems: [],
        bopisOOS: true
    };
    try {
        if (currentBasket && validatedBOPISProducts) {
            var items = validatedBOPISProducts.invalidItemsSku ? validatedBOPISProducts.invalidItemsSku : '';
            // Make MAO service call to check availability in web
            var realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
            var maoAvailability = null;
            if (isMAOEnabled) {
                var isCheckPointEnabled = AvailabilityHelper.isCheckPointEnabled('PlaceOrder');
                if (realTimeInventoryCallEnabled && isCheckPointEnabled) {
                    if (!empty(items)) {
                        maoAvailability = Availability.getMaoAvailability(items);
                    }
                }
            }
            var bopisShipment = collections.find(currentBasket.shipments, function (item) {
                return item.custom.fromStoreId;
            });
            if (bopisShipment) {
                var bopisLineItems = bopisShipment.productLineItems;
                if (validatedBOPISProducts.moveItemsToShipping) {
                    collections.forEach(bopisLineItems, function (pli) {
                        validatedBOPISProducts.moveItemsToShipping.forEach(function (moveItemToShipping) {
                            if (pli.product.ID === moveItemToShipping.id) {
                                // below code will move the whole product to ShipToAddress shipment or remove the product if completely OOS.
                                var moveBopisItemResult = cartHelper.moveItemFromBopisShipment(currentBasket, pli, maoAvailability);
                                Transaction.wrap(function () {
                                    pli.custom.storeInventory = moveItemToShipping.quantity;
                                });
                                if (moveBopisItemResult.movedToShipping) results.fullyMovedToShipping.push(getDataItem(cartModel, pli));
                                if (moveBopisItemResult.fullyRemoved) {
                                    results.fullyRemovedItems.push(getDataItem(cartModel, pli));
                                    Transaction.wrap(function () {
                                        currentBasket.removeProductLineItem(pli);
                                    });
                                }
                            }
                        });
                    });
                }
                if (validatedBOPISProducts.partiallyAvailableBopisItems) {
                    collections.forEach(bopisLineItems, function (pli) {
                        validatedBOPISProducts.partiallyAvailableBopisItems.forEach(function (partiallyAvailableBopisItem) {
                            if (pli.product.ID === partiallyAvailableBopisItem.id) {
                                // below code will split the qty of the item to BOPIS + ShipToAddress.
                                var splitResults = cartHelper.splitItemFromBopisShipment(currentBasket, pli, partiallyAvailableBopisItem.quantity, maoAvailability);
                                Transaction.wrap(function () {
                                    pli.custom.storeInventory = partiallyAvailableBopisItem.quantity;
                                });
                                if (splitResults.partiallyMovedToShipping) results.partiallyMovedToShipping.push(getDataItem(cartModel, pli));
                                if (splitResults.partiallyRemovedFromCart) results.partiallyRemovedItems.push(getDataItem(cartModel, pli));
                            }
                        });
                    });
                }
            }
        }
    } catch (e) {
        Logger.error('Error in checkoutHelper.js function execute handleInvalidBopisItems()' + e.message);
    }
    return results;
}

/**
 * renders the user's stored payment Instruments
 * @param {Object} req - The request object
 * @param {Object} accountModel - The account model for the current customer
 * @returns {string|null} newly stored payment Instrument
 */
function getRenderedPaymentInstruments(req, accountModel) {
    var result;
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();

    if (req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
        && req.currentCustomer.raw.profile.wallet.paymentInstruments.getLength()
    ) {
        var context;
        var template;
        if (isAurusEnabled) {
            template = 'checkout/billing/aurusStoredPaymentInstruments';
        } else {
            template = 'checkout/billing/storedPaymentInstruments';
        }

        context = { customer: accountModel };
        result = renderTemplateHelper.getRenderedHtml(
            context,
            template
        );
    }

    return result || null;
}

/**
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {string} orderNo - Order number
 * @returns {dw.order.Order} The order object created from the current basket
 */
function createOrder(currentBasket, orderNo) {
    var order;

    try {
        order = Transaction.wrap(function () {
            if (orderNo) {
                return OrderMgr.createOrder(currentBasket, orderNo);
            }
            return OrderMgr.createOrder(currentBasket);
        });

        Transaction.wrap(function () {
            order.addNote('session', session.sessionID.toString());
        });
    } catch (error) {
        Logger.error('Error during create an order from the current basket: createOrder() : ' + JSON.stringify(error));
        return;
    }
    return order;
}

/**
 * Helper function to set default billing address.
 * @param {dw.customer.Customer} customer - Customer SFCC API Object
 * @param {boolean} isInternationalBillingAddress - Boolean value with International Billing Address Enabled / Disabled
 */
function setDefaultBillingAddress(customer, isInternationalBillingAddress) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket && customer.authenticated && customer.addressBook) {
        var billingAddress = currentBasket.billingAddress;
        var preferredAddress = customer.addressBook.preferredAddress;
        var defaultBillingAddressID = !empty(customer) && customer.getProfile() && 'defaultBillingAddressID' in customer.getProfile().custom ? customer.getProfile().custom.defaultBillingAddressID : null;
        var Locale = require('dw/util/Locale');
        var countryCode = Locale.getLocale(request.locale).country;

        if (!empty(defaultBillingAddressID)) {
            var defaultBillingAddress = customer.getProfile().getAddressBook().getAddress(defaultBillingAddressID);

            if (!empty(defaultBillingAddress) && (isInternationalBillingAddress || countryCode === defaultBillingAddress.countryCode.value)) {
                copyCustomerAddressToBilling(defaultBillingAddress);
            }
        } else if (!billingAddress && (isInternationalBillingAddress || countryCode === preferredAddress.countryCode)) {
            copyCustomerAddressToBilling(preferredAddress);
        }
    }
}

/**
 * making order details json for datadog custom log
 * @param {dw.order.Order} order - current order
 * @param {boolean} paymentError - payment error
 * @param {string} paymentErrorMessage - payment error message
 * @param {string} paymentErrorCode - payment error code
 * @returns {Object} - orderDataDogDetails.
 */
function getOrderDataForDatadog(order, paymentError, paymentErrorMessage, paymentErrorCode) {
    var orderDataDogDetails = {};
    var collections = require('*/cartridge/scripts/util/collections');
    var isLoyalCouponApplied = false;
    try {
        orderDataDogDetails.orderid = order.orderNo;
        orderDataDogDetails.sessionid = session && session.sessionID;
        var orderCustomerInfo = [];
        var customerInfo = {};
        customerInfo.customerid = order.customer.registered && order.customerNo ? order.customerNo : '';
        customerInfo.registered = order.customer.registered ? 'registered' : 'unregistered';
        customerInfo.loyalty_flag = order.customer.registered && order.customer.isMemberOfCustomerGroup('Loyalty') ? order.customer.isMemberOfCustomerGroup('Loyalty') : '';
        customerInfo.customerEmail = order.customerEmail;
        orderCustomerInfo.push(customerInfo);
        orderDataDogDetails.customer_info = orderCustomerInfo;
        var orderPaymentInfo = [];
        var paymentInfo = {};
        var paymentInstuments = order.getPaymentInstruments();
        var paymentMethods = '';
        var cardType = '';
        var paymentOOT = '';
        collections.forEach(paymentInstuments, function (paymentInstrument) {
            if (paymentInstrument) {
                paymentMethods += empty(paymentMethods) ? paymentInstrument.getPaymentMethod() : ' , ' + paymentInstrument.getPaymentMethod();
                if (paymentInstrument.getPaymentMethod() !== 'GIFT_CARD' && paymentInstrument.getPaymentMethod() !== 'VIP_POINTS') {
                    cardType = !empty(paymentInstrument.creditCardType) ? paymentInstrument.creditCardType : '';
                    paymentOOT = paymentInstrument.paymentTransaction.custom && paymentInstrument.paymentTransaction.custom.aurusPayOOT ? paymentInstrument.paymentTransaction.custom.aurusPayOOT : '';
                }
            }
        });
        paymentInfo.payment_method = paymentMethods;
        paymentInfo.order_total = order.getTotalGrossPrice().value;
        paymentInfo.card_type = cardType;
        paymentInfo.error = paymentError;
        paymentInfo.OOT = paymentOOT;
        paymentInfo.message = paymentError ? Resource.msg('error.payment.msg', 'checkout', null) : '';
        paymentInfo.errorMessage = paymentError && paymentErrorMessage ? paymentErrorMessage : '';
        paymentInfo.errorReasonCode = paymentError && paymentErrorCode ? paymentErrorCode : '';
        if ('isCurrencyCodeRequired' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isCurrencyCodeRequired')) {
            paymentInfo.currencyCode = order.currencyCode ? order.currencyCode : '';
        }
        var promoCodeList = [];
        var couponIterator = order.couponLineItems ? order.couponLineItems.iterator() : '';
        while (!empty(couponIterator) && couponIterator.hasNext()) {
            promoCodeList.push(couponIterator.next().getCouponCode());
        }
        orderPaymentInfo.push(paymentInfo);
        orderDataDogDetails.payment_info = orderPaymentInfo;
        orderDataDogDetails.order_status = order.getStatus().displayValue;
        orderDataDogDetails.promo_code = !empty(promoCodeList) ? promoCodeList : '';
        orderDataDogDetails.confirmation_status = order.confirmationStatus.displayValue;
        orderDataDogDetails.source = order.custom.maoOrderType && !empty(order.custom.maoOrderType.value) ? order.custom.maoOrderType.value : '';
        orderDataDogDetails.site = Site.getCurrent().getID();
        orderDataDogDetails.is_employee_order = order.custom.isEmployeeOrder ? order.custom.isEmployeeOrder : '';
        orderDataDogDetails.vip_order = order.custom.isVipOrder ? order.custom.isVipOrder : '';
        orderDataDogDetails.bopis_only_order = order.custom.isBOPISOrder ? order.custom.isBOPISOrder : '';
        orderDataDogDetails.mixed_bopis_order = order.custom.isMixedBOPISOrder ? order.custom.isMixedBOPISOrder : '';
        orderDataDogDetails.aurusTerminalID = (order.custom.aurusTerminalID) ? order.custom.aurusTerminalID : '';
        if (Object.prototype.hasOwnProperty.call(order.custom, 'purchaseSite')) {
            orderDataDogDetails.purchase_site = order.custom.purchaseSite;
        }
        var isLoyaltyEnabled = 'isLoyaltyEnable' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isLoyaltyEnable');
        isLoyalCouponApplied = isLoyaltyEnabled ? !empty(require('*/cartridge/scripts/helpers/loyaltyHelper').getLoyaltyCouponsFromLineItemCtnr(order)) : false;
        if (isLoyaltyEnabled || ('isLoyaltyCouponLogEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isLoyaltyCouponLogEnabled'))) {
            orderDataDogDetails.isLoyalCouponApplied = isLoyalCouponApplied;
        }
    } catch (e) {
        Logger.error('Error in getOrderDataForDatadog()' + e.message);
    }
    return JSON.stringify(orderDataDogDetails);
}

/**
 * This method set and return CC value for order .
 * @param {dw.order.Order} order - the order object
 */
function setOrderPurchaseSite(order) {
    var siteId = Site.getCurrent().getID();

    if (!order) return;
    try {
        if (siteId === 'US' || siteId === 'CA' || siteId === 'MX') {
            if (order && 'custom' in order && !Object.prototype.hasOwnProperty.call(order.custom, 'purchaseSite')) {
                Transaction.wrap(function () {
                    order.custom.purchaseSite = 'CC'; // eslint-disable-line
                });
            }
        }
    } catch (e) {
        Logger.error('checkoutHelper.js - Error while setOrderPurchaseSite: ' + e.message);
    }
}

/**
 * Prepares and sends line item inventory to Constructor.IO.
 * @param {dw.util.Collection} productLineItems - product line items from order
 */
function sendInventoryToConstructor(productLineItems) {
    logger.info('BEGIN sendInventoryToConstructor');
    var constructor = {
        deltasEnabled: Site.current.getCustomPreferenceValue('Constructor_DeltaInventoryManager')
    };

    if (constructor.deltasEnabled) {
        const inventoryMgr = require('*/cartridge/scripts/constructorio/inventoryStateManager');
        var itemId;
        var styleId;
        var available;
        var availabilityModel;
        var inventoryRecord;

        // add each item to ConstructorIO custom object
        for (var i = 0; i < productLineItems.length; ++i) {
            itemId = productLineItems[i].product.custom.sku;
            logger.info('itemId: ' + itemId);
            styleId = productLineItems[i].product.custom.style;
            logger.info('styleId: ' + styleId);

            // get available inventory from SFCC
            available = 0;
            availabilityModel = productLineItems[i].product.getAvailabilityModel();
            inventoryRecord = availabilityModel.getInventoryRecord();
            logger.info('inventoryRecord: ' + inventoryRecord);
            if (typeof inventoryRecord !== 'undefined' && inventoryRecord !== null && inventoryRecord !== '' && inventoryRecord) {
                // if the inventory is perpetual, get the highest allowed value for positive integers
                if (inventoryRecord.isPerpetual()) {
                    available = 2147483647;
                } else {
                    // get inventory amount
                    available = inventoryRecord.ATS.value;
                }
            }
            logger.info('available: ' + available);

            // Send delta to Constructor.io
            inventoryMgr.addMAODeltas(styleId, itemId, available);
        }
    }
    logger.info('END sendInventoryToConstructor');
}

base.validatePayment = validatePayment;
module.exports = base;
module.exports = plugin;
module.exports.handlePayments = handlePayments;
module.exports.autoCorrectPhonenumber = autoCorrectPhonenumber;
module.exports.eligibleForShipToCollectionPoint = eligibleForShipToCollectionPoint;
module.exports.convertStoreWorkingHours = convertStoreWorkingHours;
module.exports.updateStateCode = updateStateCode;
module.exports.updatePostalCode = updatePostalCode;
module.exports.calculateNonGiftCertificateAmount = calculateNonGiftCertificateAmount;
module.exports.copyCustomerAddressToShipment = copyCustomerAddressToShipment;
module.exports.copyCustomerAddressToBilling = copyCustomerAddressToBilling;
module.exports.copyShippingAddressToShipment = copyShippingAddressToShipment;
module.exports.setDefaultBillingAddress = setDefaultBillingAddress;
module.exports.placeOrder = placeOrder;
module.exports.failOrder = failOrder;
module.exports.sendConfirmationEmail = sendConfirmationEmail;
module.exports.sendFraudNotificationEmail = sendFraudNotificationEmail;
module.exports.generateGiftCardNumbers = generateGiftCardNumbers;
module.exports.sendEGiftCardsEmail = sendEGiftCardsEmail;
module.exports.handleHoldStatus = handleHoldStatus;
module.exports.setExportedStatus = setExportedStatus;
module.exports.isPhoneNumberMandatory = isPhoneNumberMandatory;
module.exports.isHALShippingEnabled = isHALShippingEnabled;
module.exports.setGift = setGift;
module.exports.ensureValidShipments = ensureValidShipments;
module.exports.calculatePaymentTransaction = calculatePaymentTransaction;
module.exports.copyBillingAddressToShippingAddress = copyBillingAddressToShippingAddress;
module.exports.getEligiblePaymentMethods = getEligiblePaymentMethods;
module.exports.updateShipToAsDefaultShipment = updateShipToAsDefaultShipment;
module.exports.saveInstorePickUpContacts = saveInstorePickUpContacts;
module.exports.isPaymentAmountMatches = isPaymentAmountMatches;
module.exports.isShipBillPayExistInBasket = isShipBillPayExistInBasket;
module.exports.validateInputFieldsForShippingMethod = validateInputFieldsForShippingMethod;
module.exports.validatePaymentCards = validatePaymentCards;
module.exports.ensureValidAddressType = ensureValidAddressType;
module.exports.containsAtleastOneLocaleAddress = containsAtleastOneLocaleAddress;
module.exports.getLocaleAddress = getLocaleAddress;
module.exports.copyCustomerAddressToBasket = copyCustomerAddressToBasket;
module.exports.updateBillingStateCode = updateBillingStateCode;
module.exports.validateInputFields = validateInputFields;
module.exports.giftCardCharactersValidations = giftCardCharactersValidations;
module.exports.checkEmptyEmojiNonLatinChars = checkEmptyEmojiNonLatinChars;
module.exports.setEmptyValueBillingForm = setEmptyValueBillingForm;
module.exports.bfOrdersMissingProductDetails = bfOrdersMissingProductDetails;
module.exports.isKlarnaPaymentEnabled = isKlarnaPaymentEnabled;
module.exports.handlePendingKlarnaOrder = handlePendingKlarnaOrder;
module.exports.isRadioPaymentExperienceEnabled = isRadioPaymentExperienceEnabled;
module.exports.handlePaymentMethods = handlePaymentMethods;
module.exports.isHALEnabledForShopApp = isHALEnabledForShopApp;
module.exports.setEmptyShippingAddressFields = setEmptyShippingAddressFields;
module.exports.handleInvalidBopisItems = handleInvalidBopisItems;
module.exports.getRenderedPaymentInstruments = getRenderedPaymentInstruments;
module.exports.createOrder = createOrder;
module.exports.getOrderDataForDatadog = getOrderDataForDatadog;
module.exports.setOrderPurchaseSite = setOrderPurchaseSite;
module.exports.sendInventoryToConstructor = sendInventoryToConstructor;
module.exports.isCountryShippable = isCountryShippable;
module.exports.checkEGiftCardAmount = checkEGiftCardAmount;
