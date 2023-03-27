'use strict';

var base = module.superModule;
var URLUtils = require('dw/web/URLUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var accountHelper = require('*/cartridge/scripts/helpers/accountHelpers');

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} userPaymentInstruments - current customer's paymentInstruments
 * @returns {Object} object that contains info about the current customer's payment instruments
 */
function getCustomerPaymentInstruments(userPaymentInstruments) {
    // To support other payment methods which allows to create customer wallet
    var HookMgr = require('dw/system/HookMgr');
    var paymentInstruments;
    paymentInstruments = userPaymentInstruments.map(function (paymentInstrument) {
        if (paymentInstrument.raw.paymentMethod && HookMgr.hasHook('app.customer.paymentinstruments.' + paymentInstrument.raw.paymentMethod.toLowerCase())) return HookMgr.callHook('app.customer.paymentinstruments.' + paymentInstrument.raw.paymentMethod.toLowerCase(), 'getCustomerPaymentInstruments', paymentInstrument);
        var paymetricData = paymentInstrument.raw.getCustom();
        var paymetricCardTypeMapping = PreferencesUtil.getJsonValue('paymetricCardTypeMapping');
        var BMCardType = !empty(paymetricCardTypeMapping) ? paymetricCardTypeMapping[paymentInstrument.creditCardType] : null;
        var result = {
            creditCardHolder: paymentInstrument.creditCardHolder,
            maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
            creditCardType: accountHelper.getCardType(paymentInstrument.creditCardType),
            creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
            creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
            creditCardToken: paymentInstrument.raw && paymentInstrument.raw.creditCardToken ? paymentInstrument.raw.creditCardToken : '',
            paymetricCardType: 'CreditCardTokenized',
            creditCardTokenInt: 'internalToken' in paymetricData ? paymetricData.internalToken : '',
            creditCardBinRange: 'creditCardBinRange' in paymetricData ? paymetricData.creditCardBinRange : '',
            creditCardLastFour: paymentInstrument.maskedCreditCardNumber.slice(-4),
            defaultPaymentCard: paymentInstrument.raw &&
                paymentInstrument.raw.custom &&
                'defaultPaymentCard' in paymentInstrument.raw.custom &&
                paymentInstrument.raw.custom.defaultPaymentCard ?
                paymentInstrument.raw.custom.defaultPaymentCard : false,
            isCreditCardEnable: !empty(PaymentMgr.getPaymentCard(BMCardType)) ? PaymentMgr.getPaymentCard(BMCardType).isActive() : false,
            UUID: paymentInstrument.UUID
        };

        result.cardTypeImage = {
            src: URLUtils.staticURL('/images/' +
                paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, '') +
                '-dark.svg'),
            alt: paymentInstrument.creditCardType
        };

        return result;
    });

    return paymentInstruments;
}

/**
 * Creates a plain object that contains profile information
 * @param {Object} currentCustomer - current customer's
 * @returns {Object} an object that contains information about the current customer's profile
 */
function getProfile(currentCustomer) {
    var result;
    var profile = currentCustomer.profile;
    var zipCode = currentCustomer.raw && currentCustomer.raw.profile && currentCustomer.raw.profile.custom.zipCode ? currentCustomer.raw.profile.custom.zipCode : '';

    if (profile) {
        result = {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone,
            password: '********',
            zipCode: zipCode
        };
    } else {
        result = null;
    }
    return result;
}

/**
 * Account class that represents the current customer's profile dashboard
 * @param {dw.customer.Customer} currentCustomer - Current customer
 * @param {Object} addressModel - The current customer's preferred address
 * @param {Object} orderModel - The current customer's order history
 * @constructor
 */
function account(currentCustomer, addressModel, orderModel) {
    base.call(this, currentCustomer, addressModel, orderModel);
    this.profile = getProfile(currentCustomer);
    this.customerPaymentInstruments = currentCustomer.wallet &&
        currentCustomer.wallet.paymentInstruments ?
        getCustomerPaymentInstruments(currentCustomer.wallet.paymentInstruments) :
        null;
    if (currentCustomer && currentCustomer.raw && currentCustomer.raw.profile && currentCustomer.raw.profile.custom && currentCustomer.raw.profile.custom.profilePictureUri) {
        this.profile.profilePictureUri = currentCustomer.raw.profile.custom.profilePictureUri;
    }
    var customerAllCreditCardsDisable = false;
    if (currentCustomer.wallet && currentCustomer.wallet.paymentInstruments) {
        // eslint-disable-next-line no-use-before-define
        customerAllCreditCardsDisable = checkCreditCardDisable(currentCustomer.wallet.paymentInstruments);
    }
    this.customerAllCreditCardsDisable = customerAllCreditCardsDisable;
}

/**
 * Check credit cards disable in  payment instruments
 * @param {Object} customerPaymentInstruments - current customer's paymentInstruments
 * @returns {boolean} allCreditCardDisable that contains info about the  payment instruments credit cart disable or enable
 */
function checkCreditCardDisable(customerPaymentInstruments) {
    var allCreditCardDisable = false;
    var paymetricCardMapping = PreferencesUtil.getJsonValue('paymetricCardTypeMapping');
    if (customerPaymentInstruments.length > 0 && !empty(paymetricCardMapping)) {
        var count = 0;
        for (var i = 0; i < customerPaymentInstruments.length; i++) {
            var cardType = paymetricCardMapping[customerPaymentInstruments[i].creditCardType];
            if (!empty(PaymentMgr.getPaymentCard(cardType)) && !PaymentMgr.getPaymentCard(cardType).isActive()) {
                ++count;
            }
        }
        if (customerPaymentInstruments.length === count) {
            allCreditCardDisable = true;
        }
    }
    return allCreditCardDisable;
}

account.getCustomerPaymentInstruments = getCustomerPaymentInstruments;
account.getProfile = getProfile;
module.exports = account;
