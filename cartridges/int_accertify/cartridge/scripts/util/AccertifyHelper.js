'use strict';

/**
 * Helper Script, used to construct XML request body with given order data
 */

/* API Includes */
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Logger = require('dw/system/Logger');
var Log = Logger.getLogger('int.accertify');

/* eslint-disable no-undef */
/* eslint-disable block-scoped-var */
/* eslint-disable dot-notation */

var AccertifyHelper = function () {
    var self = this;
    var shipmentData = {};

    /**
     * Construct Body of the Accertify request
     * @param {dw.order.Order} order - Current order
     * @returns {XML} requestBody - Body of the Accertify request
     */
    this.createAccertifyProcessRequest = function (order) {
        var customerInformation = self.getCustomerInfo(order);
        var orderInformation = self.getOrderInformation(order);
        var deliveryDetailInformation = self.getDeliveryDetailInformation(order);
        var paymentDetailInformation = self.getPaymentDetailInformation(order);
        var orderDetailInformation = self.getOrderDetailInformation(order);

        var requestBody = new XML('<transactionRequest></transactionRequest>');
        requestBody.appendChild(customerInformation);
        requestBody.appendChild(orderInformation);
        requestBody.appendChild(deliveryDetailInformation);
        requestBody.appendChild(paymentDetailInformation);
        requestBody.appendChild(orderDetailInformation);

        return requestBody;
    };

    /**
     * Parse Accertify Service Response
     * @param {dw.svc} svc - SVC service
     * @param {XML} result - Accertify response body
     * @returns {Object} - Parsed response data
     */
    this.parseAccertifyResponse = function (svc, result) {
        var xml = new XML(result.text);

        return {
            accertifyTransactionID: xml.descendants('transaction-id'),
            accertifyRules: xml.descendants('rules-tripped'),
            accertifyScore: xml.descendants('total-score'),
            accertifyRecCode: xml.descendants('recommendation-code'),
            remarks: xml.descendants('remarks'),
            accertifyActionType: xml.descendants('action-type')
        };
    };

    /**
     * Mock Accertify Service Response
     * @param {dw.svc} svc - SVC service
     * @returns {Object} - mocked response data
     */
    this.getMockedAccertifyResponse = function (svc) {
        var profile = svc.getConfiguration().getProfile();
        var profileData = self.getServiceConfig(profile);
        var text = '<transaction-results><transaction-id>00000804</transaction-id><recommendation-code>ACCEPT</recommendation-code></transaction-results>';

        if (profileData && ('accertifyTransactionID' in profileData) && ('accertifyRecCode' in profileData)) {
            text = '<transaction-results><transaction-id>' + profileData.accertifyTransactionID + '</transaction-id><recommendation-code>' + profileData.accertifyRecCode + '</recommendation-code></transaction-results>';
        }

        return {
            statusCode: 200,
            statusMessage: 'Success',
            text: text
        };
    };

    /**
     * Returns service configuration
     * @param {Object} profile - Service profile
     * @returns {Object} data - Parsed service profile data
     */
    this.getServiceConfig = function (profile) {
        var data = {};

        try {
            data = JSON.parse(profile.custom.data);
        } catch (e) {
            Log.error('Can not parse JSON config from Service: {0}', e.message);
        }

        return data;
    };

    /**
     * Returns service configuration
     * @param {dw.order.Order} order - Current order
     * @returns {Object} shipmentData - Shipping info
     */
    this.getShipment = function (order) {
        if (!Object.keys(shipmentData).length) {
            var shipments = order.getShipments().iterator();

            // there is assumption that only one shipment
            while (shipments.hasNext()) {
                var shipment = shipments.next();
                var shippingAddress = shipment.getShippingAddress();
                var shippingMethodID = shipment.shippingMethodID;
                var giftMessage = shipment.getGiftMessage();
                break;
            }

            shipmentData = {
                shippingAddress: shippingAddress,
                shippingMethodID: shippingMethodID,
                giftMessage: giftMessage
            };
        }

        return shipmentData;
    };

    /**
     * Build XML Address data
     * @param {string} rootName - XML root name
     * @param {Object} addressObject - Address
     * @returns {XML} - Address data
     */
    this.getAddress = function (rootName, addressObject) {
        var address = new XML('<' + rootName + '></' + rootName + '>');

        address['addressFirstName'] = addressObject.firstName;
        address['addressLastName'] = (addressObject.fullName).substring(addressObject.firstName.length);
        address['addressAddress1'] = addressObject.address1;
        address['addressAddress2'] = addressObject.address2 || ('interiorNumber' in addressObject.custom && addressObject.custom.interiorNumber) || '';
        address['addressCity'] = addressObject.city;
        address['addressRegion'] = addressObject.stateCode;
        address['addressPostalCode'] = addressObject.postalCode;
        address['addressCountry'] = addressObject.countryCode;
        address['addressPhone'] = addressObject.phone || '';
        address['colony'] = ('colony' in addressObject.custom && addressObject.custom.colony) || '';
        address['dependentLocality'] = ('dependentLocality' in addressObject.custom && addressObject.custom.dependentLocality) || '';
        address['exteriorNumber'] = ('exteriorNumber' in addressObject.custom && addressObject.custom.exteriorNumber) || '';
        address['isOfficeAddress'] = ('isOfficeAddress' in addressObject.custom && addressObject.custom.isOfficeAddress) ? 'true' : 'false';

        return address;
    };

    this.getGiftCardType = function (giftCardNumber, giftCardClass) {
        // eslint-disable-next-line spellcheck/spell-checker
        // ZGC1 = electronic card, ZGC2 = physical card, ZGC3 = incomm card
        if (giftCardClass && giftCardClass.equals(190)) {
            return 'ZGC1';
        } else if (giftCardNumber && giftCardNumber >= 6065103375390000 && giftCardNumber <= 6065103511089999) {
            return 'ZGC3';
        } else if (giftCardNumber && giftCardNumber >= 6065142400630000 && giftCardNumber <= 6065142415679999) {
            return 'ZGC3';
        }
        return 'ZGC2';
    };

    /**
     * Build XML Customer data
     * @param {dw.order.Order} order - Current order
     * @returns {XML} customerInfo - Customer data
     */
    this.getCustomerInfo = function (order) {
        var orderCustomer = order.getCustomer();
        var customerProfile = orderCustomer.profile;
        var shippingAddress = self.getShipment(order).shippingAddress;
        var firstName = customerProfile ? customerProfile.firstName : shippingAddress.firstName;
        var lastName = customerProfile ? customerProfile.lastName : shippingAddress.lastName || (shippingAddress.fullName).substring(shippingAddress.firstName.length);
        var email = !empty(order.getCustomerEmail()) ? order.getCustomerEmail() : customerProfile.email;
        var phone = shippingAddress.phone;

        var customerInfo = new XML('<customerInformation></customerInformation>');
        customerInfo['customerId'] = customerProfile ? customerProfile.customerNo : '';
        customerInfo['customerCreationDate'] = customerProfile ? self.getFormattedDate(customerProfile.creationDate) : '';
        customerInfo['customerFirstName'] = firstName;
        customerInfo['customerLastName'] = lastName;
        customerInfo['customerEmailAddress'] = email;
        customerInfo['customerPhone'] = phone;

        return customerInfo;
    };

    /**
     * Build XML Order data
     * @param {dw.order.Order} order - Current order
     * @returns {XML} orderInformation - Basic order data
     */
    this.getOrderInformation = function (order) {
        var orderInformation = new XML('<orderInformation></orderInformation>');
        orderInformation['orderNumber'] = order.orderNo;
        orderInformation['orderType'] = self.getOrderType(order);
        orderInformation['orderCustomerSource'] = 'customer';
        orderInformation['orderDateTime'] = self.getFormattedDateInSiteTimeZone(order.creationDate);
        orderInformation['orderTotalOrderTax'] = order.totalTax;
        orderInformation['orderTotalOrderAmount'] = order.totalGrossPrice;
        orderInformation['orderTotalShippingAmount'] = order.shippingTotalGrossPrice;
        orderInformation['orderPromotionAmount'] = order.merchandizeTotalPrice.subtract(order.adjustedMerchandizeTotalPrice);
        orderInformation['orderPromotionCodeClass'] = self.getPromotionClasses(order);
        orderInformation['orderCurrencyCode'] = order.currencyCode;
        orderInformation['orderSiteId'] = order.custom.customerCountry;
        orderInformation['orderCsrId'] = '';
        orderInformation['orderIpAddress'] = order.custom.customerIPAddress || order.remoteHost || '';
        orderInformation['orderSessionId'] = '';
        orderInformation['inAuthTransactionId'] = 'accertifyInAuthTransactionID' in order.custom ? order.custom.accertifyInAuthTransactionID : '';
        orderInformation['orderGiftMessage'] = self.getShipment(order).giftMessage || '';

        return orderInformation;
    };

    /**
     * This method returns the date in 'yyyy-MM-DD HH:mm:ss' format
     * @param {Date} date - date
     * @returns {string} formatted date
     */
    this.getFormattedDate = function (date) {
        var Calendar = require('dw/util/Calendar');
        var StringUtils = require('dw/util/StringUtils');
        var calendar = new Calendar(date);
        return StringUtils.formatCalendar(calendar, 'yyyy-MM-dd HH:mm:ss');
    };
    // eslint-disable-next-line spellcheck/spell-checker
    /**
     * This method returns the date in site time zone in 'yyyy-MM-DD HH:mm:ss' format
     * @param {Date} date - date
     * @returns {string} formatted date
     */
    this.getFormattedDateInSiteTimeZone = function (date) {
        var Calendar = require('dw/util/Calendar');
        var StringUtils = require('dw/util/StringUtils');
        var Site = require('dw/system/Site');
        var dateInSiteTimeZone = new Date(date.valueOf() + Site.getCurrent().timezoneOffset);
        var calendar = new Calendar(dateInSiteTimeZone);
        return StringUtils.formatCalendar(calendar, 'yyyy-MM-dd HH:mm:ss');
    };

    /**
     * Build XML Delivery data
     * @param {dw.order.Order} order - Current order
     * @returns {XML} deliveryDetailInformation - Delivery details data
     */
    this.getDeliveryDetailInformation = function (order) {
        var deliveryDetailInformation;
        var deliveryDestination;

        deliveryDetailInformation = new XML('<deliveryDetailInformation></deliveryDetailInformation>');
        deliveryDestination = new XML('<deliveryDestination></deliveryDestination>');
        deliveryDestination.appendChild(self.getAddress('deliveryAddress', self.getShipment(order).shippingAddress));
        deliveryDestination['deliveryDeadline'] = '';
        deliveryDestination['deliveryTransitTime'] = '';
        deliveryDestination['deliveryId'] = 1;
        deliveryDestination['deliveryMethod'] = self.getShipment(order).shippingMethodID;
        var instorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
        var bopisShipment = instorePickupStoreHelpers.getBopisShipment(order.shipments);
        var storeId = '';
        if (bopisShipment && !empty(bopisShipment.custom.fromStoreId)) {
            // remove first char(leading zero) from the string. Leading zero is added while importing stores
            // As per Accertify requirement, we need to send 3 digit store ID
            storeId = bopisShipment.custom.fromStoreId.substring(1);
        }
        deliveryDestination['storeId'] = storeId;
        return deliveryDetailInformation.appendChild(deliveryDestination);
    };

    /**
     * Build XML Payment data
     * @param {dw.order.Order} order - Current order
     * @returns {XML} paymentDetailInformation - Payment details data
     */
    this.getPaymentDetailInformation = function (order) {
        var collections = require('*/cartridge/scripts/util/collections');
        var paymentInstruments = order.getPaymentInstruments();
        var billingAddress = order.getBillingAddress();
        var paymentDetailInformation = new XML('<paymentDetailInformation></paymentDetailInformation>');
        var paymentSource;
        collections.forEach(paymentInstruments, function (paymentInstrument) {
            if (PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstrument.paymentMethod) || paymentInstrument.paymentMethod === 'Paymetric' || paymentInstrument.paymentMethod === 'AURUS_CREDIT_CARD') {
                paymentSource = new XML('<paymentSource></paymentSource>');
                paymentSource['creditCardToken'] = paymentInstrument.creditCardToken;
                paymentSource['creditCardholderName'] = paymentInstrument.creditCardHolder;
                paymentSource['creditCardType'] = paymentInstrument.creditCardType;
                paymentSource['creditCardBinRange'] = paymentInstrument.custom.creditCardBinRange;
                paymentSource['creditCardExpireDate'] = paymentInstrument.creditCardExpirationMonth + '/' + paymentInstrument.creditCardExpirationYear;
                paymentSource['creditCardBilledAmount'] = paymentInstrument.paymentTransaction.amount;
                paymentSource['creditCardAuthorizationCode'] = paymentInstrument.paymentTransaction.custom.authCode || '';
                paymentSource['creditCardCvvResponse'] = paymentInstrument.paymentTransaction.custom.cvvResponseCode || '';
                paymentSource['creditCardAvsResponse'] = paymentInstrument.paymentTransaction.custom.avsCode || '';
                paymentSource.appendChild(self.getAddress('creditCardBillingAddress', billingAddress));
            }

            if (paymentInstrument.paymentMethod.equals('AdyenComponent')) {
                if (paymentInstrument.custom.adyenPaymentMethod === 'PayPal') {
                    paymentSource = new XML('<paymentSource></paymentSource>');
                    paymentSource['paypalUserId'] = paymentInstrument.custom.paypalPayerID;
                    paymentSource['paypalUserEmail'] = order.getCustomerEmail();
                    paymentSource['paypalStatus'] = paymentInstrument.paymentTransaction.custom.authCode || '';
                    paymentSource['paypalAmount'] = paymentInstrument.paymentTransaction.amount.value;
                    paymentSource.appendChild(self.getAddress('paypalBillingAddress', billingAddress));
                } else if (paymentInstrument.custom.adyenPaymentMethod === 'Oxxo') {
                    paymentSource = new XML('<paymentSource></paymentSource>');
                    paymentSource['paymentType'] = paymentInstrument.custom.adyenPaymentMethod;
                    paymentSource.appendChild(self.getAddress('creditCardBillingAddress', billingAddress));
                } else {
                    var additionalDataJson = JSON.parse(paymentInstrument.paymentTransaction.custom.Adyen_additionalData || '{}');
                    paymentSource = new XML('<paymentSource></paymentSource>');
                    paymentSource['creditCardToken'] = additionalDataJson.alias;
                    paymentSource['creditCardholderName'] = additionalDataJson.cardHolderName;
                    paymentSource['creditCardType'] = paymentInstrument.creditCardType || additionalDataJson.paymentMethod;
                    paymentSource['creditCardBinRange'] = additionalDataJson.cardBin;
                    paymentSource['creditCardExpireDate'] = additionalDataJson.expiryDate;
                    paymentSource['creditCardBilledAmount'] = paymentInstrument.paymentTransaction.amount;
                    paymentSource['creditCardAuthorizationCode'] = paymentInstrument.paymentTransaction.custom.authCode || '';
                    paymentSource['creditCardCvvResponse'] = additionalDataJson.cvcResultRaw || '';
                    paymentSource['creditCardAvsResponse'] = paymentInstrument.paymentTransaction.custom.avsCode || '';
                    paymentSource['threeDAuthenticated'] = additionalDataJson.threeDAuthenticated || '';
                    paymentSource['cardSummary'] = additionalDataJson.cardSummary || '';
                    paymentSource.appendChild(self.getAddress('creditCardBillingAddress', billingAddress));
                }
            }

            if (PaymentInstrument.METHOD_DW_APPLE_PAY.equals(paymentInstrument.paymentMethod)) {
                paymentSource = new XML('<paymentSource></paymentSource>');
                paymentSource['creditCardholderName'] = self.getCreditCardHolderForApplePay(paymentInstrument, billingAddress);
                paymentSource['creditCardType'] = 'APAY';
                paymentSource['creditCardBilledAmount'] = paymentInstrument.paymentTransaction.amount.value;
                paymentSource['creditCardCvvResponse'] = '';
                paymentSource.appendChild(self.getAddress('creditCardBillingAddress', billingAddress));
            }

            if (paymentInstrument.paymentMethod.equals('PayPal')) {
                paymentSource = new XML('<paymentSource></paymentSource>');
                paymentSource['paypalUserId'] = paymentInstrument.custom.paypalPayerID;
                paymentSource['paypalUserEmail'] = order.getCustomerEmail();
                paymentSource['paypalStatus'] = paymentInstrument.custom.paypalPaymentStatus;
                paymentSource['paypalAmount'] = paymentInstrument.paymentTransaction.amount.value;
                paymentSource.appendChild(self.getAddress('paypalBillingAddress', billingAddress));
            }

            if (paymentInstrument.paymentMethod.equals('GIFT_CARD')) {
                paymentSource = new XML('<paymentSource></paymentSource>');
                paymentSource['giftCardNumber'] = paymentInstrument.custom.gcNumber;
                paymentSource['giftCardAmount'] = paymentInstrument.paymentTransaction.amount;
                var gcClass = ('gcClass' in paymentInstrument.custom && paymentInstrument.custom.gcClass) || '';
                paymentSource['giftCardType'] = self.getGiftCardType(paymentInstrument.custom.gcNumber, gcClass);
                paymentSource['giftCardPurchaseDate'] = '';
                paymentSource.appendChild(self.getAddress('giftCardBillingAddress', billingAddress));
            }
            if (paymentInstrument.paymentMethod.equals('VIP_POINTS')) {
                paymentSource = new XML('<paymentSource></paymentSource>');
                paymentSource['athleteId'] = paymentInstrument.custom.vipAccountId;
                paymentSource['athleteAmount'] = paymentInstrument.paymentTransaction.amount;

                paymentSource.appendChild(self.getAddress('athleteBillingAddress', billingAddress));
            }

            if (paymentInstrument.paymentMethod.equals('KLARNA_PAYMENTS')) {
                paymentSource = new XML('<paymentSource></paymentSource>');
                paymentSource['creditCardholderName'] = paymentInstrument.creditCardHolder || billingAddress.fullName;
                paymentSource['creditCardType'] = 'KLARNA';
                paymentSource['creditCardBilledAmount'] = paymentInstrument.paymentTransaction.amount.value;
                paymentSource['creditCardCvvResponse'] = '';
                paymentSource.appendChild(self.getAddress('creditCardBillingAddress', billingAddress));
            }
            paymentDetailInformation.appendChild(paymentSource);
        });
        return paymentDetailInformation;
    };

    /**
     * Build promotionClassIds string
     * @param {dw.order.Order} order - Current order
     * @returns {string} promotionClassIds - promotionClassIds
     */
    this.getPromotionClasses = function (order) {
        var collections = require('*/cartridge/scripts/util/collections');
        var promotionClassIds = '';
        if (order.getPriceAdjustments().size() > 0) {
            promotionClassIds = self.getPromotionIds(order.getPriceAdjustments(), promotionClassIds);
        }
        if (order.getAllShippingPriceAdjustments().size() > 0) {
            promotionClassIds = self.getPromotionIds(order.getAllShippingPriceAdjustments(), promotionClassIds);
        }

        collections.forEach(order.getProductLineItems(), function (lineItem) {
            if (lineItem.getPriceAdjustments().size() > 0) {
                promotionClassIds = self.getPromotionIds(lineItem.getPriceAdjustments(), promotionClassIds);
            }
        });
        return promotionClassIds;
    };

    this.getPromotionIds = function (priceAdjustments, promotionClassIds) {
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(priceAdjustments, function (priceAdjustment) {
            if (promotionClassIds) {
                // eslint-disable-next-line no-param-reassign
                promotionClassIds = promotionClassIds + ';' + priceAdjustment.promotionID;
            } else {
                // eslint-disable-next-line no-param-reassign
                promotionClassIds = priceAdjustment.promotionID;
            }
        });
        return promotionClassIds;
    };

    /**
     * Build XML OrderDetail data
     * @param {dw.order.Order} order - Current order
     * @returns {XML} information - Order details information data
     */
    this.getOrderDetailInformation = function (order) {
        var information = new XML('<orderDetailInformation></orderDetailInformation>');
        var shipments = order.getShipments().iterator();
        while (shipments.hasNext()) {
            var shipment = shipments.next();
            var prodLineItemIt = shipment.getProductLineItems().iterator();
            while (prodLineItemIt.hasNext()) {
                var productLineItem = prodLineItemIt.next();
                var item = new XML('<item></item>');
                item['itemGiftCardMessage'] = !empty(productLineItem.custom.gcMessage) ? productLineItem.custom.gcMessage : '';
                item['itemGiftCardRecipientEmail'] = !empty(productLineItem.custom.gcRecipientEmail) ? productLineItem.custom.gcRecipientEmail : '';
                item['itemIsGiftCard'] = (productLineItem.custom.giftCard == 'GIFT_CARD' || productLineItem.custom.giftCard == 'EGIFT_CARD') ? 'Y' : 'N'; // eslint-disable-line
                item['itemNumber'] = 'sku' in productLineItem.custom ? productLineItem.custom.sku : (!empty(productLineItem.product) && 'sku' in productLineItem.product.custom) ? productLineItem.product.custom.sku : null;
                item['itemDescription'] = !empty(productLineItem.productName) ? productLineItem.productName : !empty(productLineItem.product) ? productLineItem.product.name : null;
                item['itemBrand'] = 'Under Armour';
                item['itemQuantity'] = productLineItem.quantity.value;
                item['itemPrice'] = productLineItem.price.value;
                item['itemTax'] = productLineItem.tax.value;
                item['itemDeliveryId'] = 1;

                information.appendChild(item);
            }
        }
        return information;
    };

    /**
     * Provide CardHolder info
     * @param {dw.order.PaymentInstrument} paymentInstrument - Order payment instrument
     * @param {dw.order.OrderAddress} billingAddress - order billing address
     * @returns {string} - CreditCard holder info
     */
    this.getCreditCardHolderForApplePay = function (paymentInstrument, billingAddress) {
        return paymentInstrument.creditCardHolder || billingAddress.fullName;
    };

    /**
     * Provide order channel type
     * @param {dw.order.Order} order - Current order
     * @returns {string} channelType - Type of the order
     */
    this.getOrderType = function (order) {
        return order.custom.maoOrderType.value || 'web';
    };
};

module.exports = AccertifyHelper;
