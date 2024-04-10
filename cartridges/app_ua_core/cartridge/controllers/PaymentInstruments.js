'use strict';

var server = require('server');
server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
/**
 * Creates an object from form values
 * @param {Object} paymentForm - form object
 * @returns {Object} a plain object of payment instrument
 */
function getDetailsObject(paymentForm) {
    return {
        name: paymentForm.cardOwner.value,
        expirationMonth: paymentForm.expirationMonth.value,
        expirationYear: paymentForm.expirationYear.value,
        paymentForm: paymentForm
    };
}

/**
 * Set the default payment instrument
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment Instrument
 */
function makeDefaultCard(paymentInstrument) {
    var dwOrderPaymentInstrument = require('dw/order/PaymentInstrument');
    var Transaction = require('dw/system/Transaction');

    var wallet = customer.getProfile().getWallet();
    var paymentInstruments = wallet.getPaymentInstruments(isAurusEnabled ? 'AURUS_CREDIT_CARD' : dwOrderPaymentInstrument.METHOD_CREDIT_CARD);
    Transaction.wrap(function () {
        for (var i = 0; i < paymentInstruments.length; i++) {
            if (paymentInstruments[i].UUID === paymentInstrument.UUID) {
                paymentInstruments[i].custom.defaultPaymentCard = true;
            } else {
                paymentInstruments[i].custom.defaultPaymentCard = false;
            }
        }
    });

    return;
}

/**
 * returns default payment instrument's UUID
 * @returns {string} default payment instrument's UUID
 */
function getDefaultPaymentInstrument() {
    var dwOrderPaymentInstrument = require('dw/order/PaymentInstrument');
    var defaultPI;

    var wallet = customer.getProfile().getWallet();
    var paymentInstruments = wallet.getPaymentInstruments(isAurusEnabled ? 'AURUS_CREDIT_CARD' : dwOrderPaymentInstrument.METHOD_CREDIT_CARD);
    if (paymentInstruments) {
        for (var i = 0; i < paymentInstruments.length; i++) {
            if ('defaultPaymentCard' in paymentInstruments[i].custom && paymentInstruments[i].custom.defaultPaymentCard) {
                defaultPI = paymentInstruments[i].UUID;
                return defaultPI;
            }
        }
    }
    return defaultPI;
}

server.prepend('List', userLoggedIn.validateLoggedIn, csrfProtection.generateToken, consentTracking.consent, function (req, res, next) {
    var addressHelper = require('*/cartridge/scripts/helpers/addressHelpers');
    var Site = require('dw/system/Site');
    var lastUpdatedDate = addressHelper.calenderHelper(req);
    var viewData = res.getViewData();
    var paymentForm = server.forms.getForm('creditCard');
    paymentForm.clear();

    viewData.paymentForm = paymentForm;
    viewData.lastUpdated = lastUpdatedDate;
    viewData.pageContext = {
        ns: 'paymentInstruments'
    };

    // VIP Customer points and promotion
    const customer = req.currentCustomer;
    const accountNumber = customer && customer.raw.profile && customer.raw.profile.custom.vipAccountId ? customer.raw.profile.custom.vipAccountId : '';
    if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && accountNumber) {
        var vipData = require('*/cartridge/scripts/vipDataHelpers').checkBalance(accountNumber);
        vipData = vipData ? vipData.response : null;
        if (vipData && vipData.availableBalance >= 0 && vipData.activeContract && vipData.activeContract.promoGroup) {
            var promo = dw.campaign.PromotionMgr.getPromotion(vipData.activeContract.promoGroup);
            var promoDescription = promo && promo.active && promo.calloutMsg ? promo.calloutMsg.source : '';
            viewData.vipCustomerData = {
                availableBalance: vipData.availableBalance,
                promoDescription: promoDescription
            };
        }
    }
    res.setViewData(viewData);
    // set page meta-data
    var ContentMgr = require('dw/content/ContentMgr');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var contentObj = ContentMgr.getContent('payment-methods-page-meta');
    if (contentObj) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
    }
    next();
}, pageMetaData.computedPageMetaData);

server.post('UpdatePayment', csrfProtection.validateAjaxRequest, csrfProtection.generateToken, userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var array = require('*/cartridge/scripts/util/array');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var Site = require('dw/system/Site');

    var data = res.getViewData();
    if (data && !data.loggedin) {
        res.json();
        return next();
    }

    var UUID = req.querystring.UUID;
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var paymentToDelete = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });

    if (!paymentToDelete) {
        res.json();
        return next();
    }
    var paymentForm = server.forms.getForm('creditCard');
    var result = getDetailsObject(paymentForm);
    // Server side validation against xss regex
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var inputFieldsValidation = accountHelpers.validateLoginInputFields(result);
    if (inputFieldsValidation.error && (Object.keys(inputFieldsValidation.customerAccountErrors).length > 0)) {
        paymentForm.valid = false;
        paymentForm.cardOwner.valid = false;
        paymentForm.cardOwner.error = inputFieldsValidation.customerAccountErrors.name;
    }
    if (paymentForm.valid) {
        res.setViewData({
            paymentToDelete: paymentToDelete,
            result: result
        });

        this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var URLUtils = require('dw/web/URLUtils');
            var dwOrderPaymentInstrument = require('dw/order/PaymentInstrument');
            var Transaction = require('dw/system/Transaction');

            var AccountModel = require('*/cartridge/models/account');

            var payment = res.getViewData();
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var wallet = customer.getProfile().getWallet();
            var paymentInstrument = null;

            Transaction.wrap(function () {
                paymentInstrument = wallet.createPaymentInstrument(isAurusEnabled ? 'AURUS_CREDIT_CARD' : dwOrderPaymentInstrument.METHOD_CREDIT_CARD);
                paymentInstrument.setCreditCardHolder(payment.result.name);
                paymentInstrument.setCreditCardNumber(payment.paymentToDelete.raw.creditCardNumber);
                paymentInstrument.setCreditCardType(payment.paymentToDelete.raw.creditCardType);
                paymentInstrument.setCreditCardExpirationMonth(payment.result.expirationMonth);
                paymentInstrument.setCreditCardExpirationYear(payment.result.expirationYear);
                paymentInstrument.setCreditCardToken(payment.paymentToDelete.raw.creditCardToken);

                var customPaymentInfo = payment.paymentToDelete.raw && payment.paymentToDelete.raw.custom ? payment.paymentToDelete.raw.custom : null;
                paymentInstrument.custom.creditCardBinRange = customPaymentInfo && 'creditCardBinRange' in payment.paymentToDelete.raw.custom ? payment.paymentToDelete.raw.custom.creditCardBinRange : null;
                paymentInstrument.custom.internalToken = customPaymentInfo && 'internalToken' in payment.paymentToDelete.raw.custom ? payment.paymentToDelete.raw.custom.internalToken : null;

                wallet.removePaymentInstrument(payment.paymentToDelete.raw);
            });

            if (payment && payment.paymentToDelete &&
                result.paymentForm &&
                payment.result.paymentForm.defaultCard &&
                payment.result.paymentForm.defaultCard.checked) {
                makeDefaultCard(paymentInstrument);
            }

         // VIP Customer points and promotion
            const currentCustomer = req.currentCustomer;
            const accountNumber = currentCustomer && currentCustomer.raw.profile && currentCustomer.raw.profile.custom.vipAccountId ? currentCustomer.raw.profile.custom.vipAccountId : '';
            var vipCustomerData = null;
            if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && accountNumber) {
                var vipData = require('*/cartridge/scripts/vipDataHelpers').checkBalance(accountNumber);
                vipData = vipData ? vipData.response : null;
                if (vipData && vipData.availableBalance >= 0 && vipData.activeContract && vipData.activeContract.promoGroup) {
                    var promo = dw.campaign.PromotionMgr.getPromotion(vipData.activeContract.promoGroup);
                    var promoDescription = promo && promo.active && promo.calloutMsg ? promo.calloutMsg.source : '';
                    vipCustomerData = {
                        availableBalance: vipData.availableBalance,
                        promoDescription: promoDescription
                    };
                }
            }
            var Calendar = require('dw/util/Calendar');
            var StringUtils = require('dw/util/StringUtils');
            var calendar = new Calendar(new Date(req.currentCustomer.raw.profile.getLastModified()));
            var lastUpdated = StringUtils.formatCalendar(calendar, 'MM/dd/yyyy');
            var actionUrl = URLUtils.url('PaymentInstruments-DeletePayment').toString();
            var creditCardForm = server.forms.getForm('creditCard');
            var customerPaymentInstruments = AccountModel.getCustomerPaymentInstruments(req.currentCustomer.wallet.paymentInstruments);
            var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
            var template = 'account/payment/paymentSaveAjax.isml';
            var renderedTemplate = renderTemplateHelper.getRenderedHtml({ lastUpdated: lastUpdated, actionUrls: actionUrl, vipCustomerData: vipCustomerData, paymentForm: creditCardForm, paymentInstruments: customerPaymentInstruments, csrf: data.csrf }, template);

            res.json({
                paymentInstruments: AccountModel.getCustomerPaymentInstruments(
                    req.currentCustomer.wallet.paymentInstruments),
                success: true,
                renderedTemplate: renderedTemplate
            });
        });
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(paymentForm)
        });
    }
    return next();
});
server.post('MakeDefaultCard', csrfProtection.validateAjaxRequest, userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var array = require('*/cartridge/scripts/util/array');
    var viewData = res.getViewData();
    if (viewData && !viewData.loggedin) {
        res.json();
        return next();
    }

    var UUID = req.querystring.UUID;
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var paymentToUpdate = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });

    if (!paymentToUpdate) {
        res.json();
        return next();
    } else { // eslint-disable-line
        makeDefaultCard(paymentToUpdate);
        res.json({
            paymentInstrument: paymentToUpdate,
            success: true
        });
    }
    return next();
});

server.append('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var viewData = res.getViewData();
    if (viewData && !viewData.loggedin) {
        res.json();
        return next();
    }
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var defaultPI = getDefaultPaymentInstrument();
    var PItoDelete = viewData.UUID;
    var nextDefault;
    if (paymentInstruments.length > 1) {
        for (var i = 0; i < paymentInstruments.length; i++) {
            if (PItoDelete && defaultPI && defaultPI === PItoDelete) {
                if (paymentInstruments[i].UUID !== PItoDelete) {
                    nextDefault = paymentInstruments[i];
                    break;
                }
            } else if (PItoDelete && defaultPI && paymentInstruments[i].UUID === defaultPI) {
                nextDefault = paymentInstruments[i];
                break;
            }
        }
        if (!empty(nextDefault)) {
            makeDefaultCard(nextDefault);
            res.json({
                makeDefault: nextDefault.UUID
            });
        }
    }
    return next();
});

module.exports = server.exports();
module.exports.getDefaultPaymentInstrument = getDefaultPaymentInstrument;
module.exports.makeDefaultCard = makeDefaultCard;
