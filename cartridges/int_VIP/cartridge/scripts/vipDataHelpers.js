'use strict';

const VIPCustomerService = require('~/cartridge/scripts/init/VIPCustomerService');
const VIPAuthTokenHelper = require('~/cartridge/scripts/util/VIPAuthTokenHelper');
var VIPCustomerHelper = require('~/cartridge/scripts/util/VIPCustomerHelper');
const Transaction = require('dw/system/Transaction');
const VIPPaymentMethodId = 'VIP_POINTS';
const Resource = require('dw/web/Resource');

/**
 * Main function of the script to process the VIP customer service.
 * @param {Object} params - request params like customer no, request type.
 * @param {string} requestType - mention about the type of request to be process
 * @return {Object} Return orders list
 */
function processRequest(params) {
    var tokenHelper = new VIPAuthTokenHelper();
    const accessToken = tokenHelper && tokenHelper.getValidToken() ? tokenHelper.getValidToken().accessToken : null;

    if (accessToken) {
        var graphQLPayload = VIPCustomerHelper.prepareGraphQLRequest(params);
        var graphQLService = VIPCustomerService.getGraphQL();

        var graphQLResponse = graphQLService.call({
            payload: graphQLPayload,
            token: 'Bearer ' + accessToken
        });
        if (graphQLResponse && graphQLResponse.ok && graphQLResponse.object) {
            return graphQLResponse.object;
        }
    }
    return null;
}

/**
 * function of the script to get the balance
 * @param {number} accountNumber - mention account number to get the balance
 * @return {Object} Return orders list
 */
function checkBalance(accountNumber) {
    var params = {};
    params.requestType = 'account';
    var variables = {};
    variables = {};
    variables.accountNumber = accountNumber ? accountNumber.toString() : accountNumber;
    params.variables = JSON.stringify(variables);
    return processRequest(params);
}

/**
 * function of the script to get the balance
 * @param {number} accountNumber - mention account number to authorize
 * @param {number} amount -mention amount to be authorized
 * @return {Object} Return orders list
 */
function authorize(accountNumber, amount) {
    var params = {};
    params.requestType = 'authorize';
    var variables = {};
    variables.input = {};
    variables.input.accountNumber = accountNumber ? accountNumber.toString() : accountNumber;
    variables.input.amount = amount;
    params.variables = JSON.stringify(variables);

    return processRequest(params);
}

/**
 * function of the script to redeem or capture the points
 * @param {string} authorizationId - mention account number to get the balance
 * @param {number} amount -mention amount to be capture
 * @return {Object} Return orders list
 */
function capture(authorizationId, amount) {
    var params = {};
    params.requestType = 'capture';
    var variables = {};
    variables.input = {};
    variables.input.authorizationId = authorizationId;
    variables.input.amount = amount;
    params.variables = JSON.stringify(variables);

    return processRequest(params);
}

/**
 * function of the script to redeem or capture the points
 * @param {string} authorizationId - mention account number to get the balance
 * @param {number} amount -mention amount to be capture
 * @return {Object} Return orders list
 */
function voidAuthorization(authorizationId) {
    var params = {};
    params.requestType = 'voidAuthorization';
    var variables = {};
    variables.input = {};
    variables.input.authorizationId = authorizationId;
    params.variables = JSON.stringify(variables);

    return processRequest(params);
}

/**
 *
 * This method applies the vip allotment points to basket. It will create payment instrument for vip points
 * @param {number} amount - amount to be applied
 * @param {dw.order.Basket} currentBasket - The account model for the current customer
 * @returns {Object} vipPaymentInstrument - vip payment instrument
 */
function applyVIPAllotmentPoints(amount, currentBasket) {
    let vipPaymentInstrument;
    Transaction.wrap(function () {
        vipPaymentInstrument = currentBasket.createPaymentInstrument(VIPPaymentMethodId, amount);
    });
    return vipPaymentInstrument;
}


/**
 * Removes all payment instruments from basket
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {void}
 *
 */
function removeVipPaymentInstruments(lineItemCtnr) {
    if (!empty(lineItemCtnr)) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            Transaction.wrap(function () {
                while (paymentInstrumentsIt.hasNext()) {
                    var paymentInstrument = paymentInstrumentsIt.next();
                    if (paymentInstrument.getPaymentMethod().equalsIgnoreCase(VIPPaymentMethodId)) {
                        lineItemCtnr.removePaymentInstrument(paymentInstrument);
                    }
                }
            });
        }
    }
}
/**
 * Removes all payment instruments from basket except GC
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {void}
 *
 */
function removeNonGiftCardPaymentInstruments(lineItemCtnr) {
    if (!empty(lineItemCtnr)) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            Transaction.wrap(function () {
                while (paymentInstrumentsIt.hasNext()) {
                    var paymentInstrument = paymentInstrumentsIt.next();
                    if (!paymentInstrument.getPaymentMethod().equalsIgnoreCase('GIFT_CARD') && !paymentInstrument.getPaymentMethod().equalsIgnoreCase('AURUS_CREDIT_CARD') && !paymentInstrument.getPaymentMethod().equalsIgnoreCase('KLARNA_PAYMENTS')) {
                        lineItemCtnr.removePaymentInstrument(paymentInstrument);
                    }
                }
            });
        }
    }
}

/**
 * gets the vip payment instruments from basket
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {Object} vipPaymentInstrument - vip paymentInstrument
 *
 */
function getVipPaymentInstrument(lineItemCtnr) {
    var vipPaymentInstrument;
    if (!empty(lineItemCtnr)) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            Transaction.wrap(function () {
                while (paymentInstrumentsIt.hasNext()) {
                    var paymentInstrument = paymentInstrumentsIt.next();
                    if (paymentInstrument.getPaymentMethod().equalsIgnoreCase(VIPPaymentMethodId)) {
                        vipPaymentInstrument = paymentInstrument;
                        break;
                    }
                }
            });
        }
    }
    return vipPaymentInstrument;
}

/**
 * Removes all payment instruments from basket
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {void}
 *
 */
function removeAllPaymentInstruments(lineItemCtnr) {
    if (!empty(lineItemCtnr)) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            Transaction.wrap(function () {
                while (paymentInstrumentsIt.hasNext()) {
                    var paymentInstrument = paymentInstrumentsIt.next();
                    lineItemCtnr.removePaymentInstrument(paymentInstrument);
                }
            });
        }
    }
}

/**
 * Calculates and returns gift card redeemed amount
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {number} returns gift card redeemed amount
 *
 */
function getVipRedeemedAmount(lineItemCtnr) {
    let vipRedeemedAmount = 0;
    const vipPaymentInstruments = lineItemCtnr.getPaymentInstruments(VIPPaymentMethodId);
    if (vipPaymentInstruments.size() > 0) {
        var vipPaymentInstrumentsIt = vipPaymentInstruments.iterator();
        while (vipPaymentInstrumentsIt.hasNext()) {
            var vipInstrument = vipPaymentInstrumentsIt.next();
            if (vipInstrument.paymentTransaction && vipInstrument.paymentTransaction.amount) {
                vipRedeemedAmount += vipInstrument.paymentTransaction.amount.value;
            }
        }
    }
    return vipRedeemedAmount;
}


/**
 * This method returns vip payment points object
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {Object} result - vipPoints result object
 *
 */
function getVipPoints(lineItemCtnr) {
    var vipPaymentInstrument = getVipPaymentInstrument(lineItemCtnr);
    var result;
    if (vipPaymentInstrument) {
        result = JSON.parse(vipPaymentInstrument.custom.vipPaymentDetails);
    }
    return result;
}

/**
 * This method handles the vip payment points
 * @param {Object} currentCustomer - Current customer
 * @param {dw.order.Basket} currentBasket - The account model for the current customer
 * @returns {void}
 */
function handleVIPPayment(currentCustomer, currentBasket) {
    const Money = require('dw/value/Money');
    const Site = require('dw/system/Site');
    const currencyCode = currentBasket.getCurrencyCode();
    var HookMgr = require('dw/system/HookMgr');
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    const giftCardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    var isVipCustomer = !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);
    var orderTotal = currentBasket.totalGrossPrice;
    if (isVipCustomer) {
        var cartHasgiftCards = giftCardHelper.basketHasGiftCardItems(currentBasket);
        var isCartHasgiftCards = false;
        if (cartHasgiftCards && cartHasgiftCards.giftCards) {
            isCartHasgiftCards = true;
        }
        var accountNumber = 'vipAccountId' in currentCustomer.profile.custom && currentCustomer.profile.custom.vipAccountId;
        var vipPoints = checkBalance(accountNumber);
        if (vipPoints.success && vipPoints.response) {
            var availablePoints = (vipPoints.response.availableBalance && new Money(vipPoints.response.availableBalance, currencyCode)) || new Money(0, currencyCode);
            var promoGroup = (vipPoints.response.activeContract && vipPoints.response.activeContract.promoGroup) ? vipPoints.response.activeContract.promoGroup : null;
            Transaction.wrap(function () {
                // eslint-disable-next-line no-param-reassign
                currentCustomer.profile.custom.promoGroup = promoGroup;
            });

            // To make sure there is no vip related promotions applied to basket and get the actual total
            session.custom.insufficientVipPoints = false;
            session.custom.suppressVipPointsCheck = true;
            HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);

            orderTotal = currentBasket.totalGrossPrice;
            // Check the available points sufficient to cover order total
            if (availablePoints.value > 0 && availablePoints.value >= orderTotal.value && !isCartHasgiftCards) {
                removeAllPaymentInstruments(currentBasket);
                var vipPaymentInstrument = applyVIPAllotmentPoints(orderTotal, currentBasket);
                if (vipPaymentInstrument) {
                    var result = {};
                    result.availablePoints = formatMoney(availablePoints);
                    result.usedPoints = formatMoney(orderTotal);
                    result.remainingPoints = formatMoney(availablePoints.subtract(orderTotal));
                    result.pointsApplied = true;
                    result.partialPointsApplied = false;
                    result.vipPromotionEnabled = false;
                    Transaction.wrap(function () {
                        vipPaymentInstrument.custom.vipAccountId = accountNumber;
                        vipPaymentInstrument.custom.vipPaymentDetails = JSON.stringify(result);
                    });
                    session.custom.currentOrderTotal = currentBasket.totalGrossPrice.value;
                    session.custom.suppressVipPointsCheck = false;
                }
            } else {
                if (Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP') && availablePoints.value > 0 && availablePoints.value < orderTotal.value && !isCartHasgiftCards) {
                    removeNonGiftCardPaymentInstruments(currentBasket);
                } else {
                    removeVipPaymentInstruments(currentBasket);
                }
                session.custom.insufficientVipPoints = true;
                session.custom.suppressVipPointsCheck = true;
                dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
                session.custom.currentOrderTotal = currentBasket.totalGrossPrice.value;
                session.custom.suppressVipPointsCheck = false;
            }
        }
    } else {
        removeVipPaymentInstruments(currentBasket);
    }
}

/**
 * Returns whether the order total is redeemed by vip points or not
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {boolean} returns whether the order total is redeemed by vip points or not
 *
 */
function isOrderTotalRedeemedByVipPoints(lineItemCtnr) {
    if (empty(lineItemCtnr)) {
        return false;
    }
    var orderTotal = lineItemCtnr.getTotalGrossPrice().value;
    const vipRedeemedAmount = getVipRedeemedAmount(lineItemCtnr);
    return (vipRedeemedAmount >= orderTotal);
}

/**
 * Removes all payment instruments from basket
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {void}
 *
 */
function removeNonVipPaymentInstruments(lineItemCtnr) {
    if (!empty(lineItemCtnr)) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            Transaction.wrap(function () {
                while (paymentInstrumentsIt.hasNext()) {
                    var paymentInstrument = paymentInstrumentsIt.next();
                    if (!paymentInstrument.getPaymentMethod().equalsIgnoreCase(VIPPaymentMethodId)) {
                        lineItemCtnr.removePaymentInstrument(paymentInstrument);
                    }
                }
            });
        }
    }
}

/**
 * Returns the vip template string for ajax responses
 * @param {Object} vipPoints - vip points object
 * @returns {string} templateContent - vip template string
 *
 */
function getVipRenderingTemplate(vipPoints) {
    var templateContent = null;
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    if (vipPoints.pointsApplied || vipPoints.partialPointsApplied) {
        var results = {
            vipPoints: {
                availablePoints: vipPoints.availablePoints,
                usedPoints: vipPoints.usedPoints,
                remainingPoints: vipPoints.remainingPoints
            }
        };
        // eslint-disable-next-line spellcheck/spell-checker
        templateContent = renderTemplateHelper.getRenderedHtml(results, '/checkout/vip/vipallotmentpoints');
    }
    return templateContent;
}

/**
 * Handle VIP Payments In CheckoutServices-SubmitPayment call.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} result - Response object
 */
function handleVipPaymentMethod(req, res) {
    var HookMgr = require('dw/system/HookMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Locale = require('dw/util/Locale');
    var OrderModel = require('*/cartridge/models/order');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var AccountModel = require('*/cartridge/models/account');
    var BasketMgr = require('dw/order/BasketMgr');
    var server = require('server');
    var currentBasket = BasketMgr.getCurrentBasket();
    var billingForm = server.forms.getForm('billing');
    var viewData = {};
    var paymentMethodID = VIPPaymentMethodId;
    var billingFormErrors = COHelpers.validateBillingForm(billingForm.addressFields);
    if (Object.keys(billingFormErrors).length) {
        return {
            form: '',
            fieldErrors: [],
            serverErrors: [],
            error: true,
            paymentMethod: ''
        };
    }
    viewData.address = {
        firstName: {
            value: billingForm.addressFields.firstName.value
        },
        lastName: {
            value: billingForm.addressFields.lastName.value
        },
        address1: {
            value: billingForm.addressFields.address1.value
        },
        address2: {
            value: billingForm.addressFields.address2.value
        },
        city: {
            value: billingForm.addressFields.city.value
        },
        postalCode: {
            value: billingForm.addressFields.postalCode.value
        },
        countryCode: {
            value: billingForm.addressFields.country.value
        }
    };
    if (Object.prototype.hasOwnProperty.call(billingForm.addressFields, 'states')) {
        viewData.address.stateCode = {
            value: billingForm.addressFields.states.stateCode.value
        };
    }
    var email = billingForm.creditCardFields.email ? billingForm.creditCardFields.email.value : billingForm.contactInfoFields.email.value;
    viewData.email = {
        value: email
    };
    res.setViewData(viewData);
    var billingAddress = currentBasket.billingAddress;
    Transaction.wrap(function () {
        if (!billingAddress) {
            billingAddress = currentBasket.createBillingAddress();
        }
        billingAddress.setFirstName(billingForm.addressFields.firstName.value);
        billingAddress.setLastName(billingForm.addressFields.lastName.value);
        billingAddress.setAddress1(billingForm.addressFields.address1.value);
        billingAddress.setAddress2(billingForm.addressFields.address2.value);
        billingAddress.setCity(billingForm.addressFields.city.value);
        billingAddress.setPostalCode(billingForm.addressFields.postalCode.value);
        billingAddress.setCountryCode(billingForm.addressFields.country.value);
        if (Object.prototype.hasOwnProperty.call(billingForm.addressFields, 'states')) {
            billingAddress.setStateCode(billingForm.addressFields.states.stateCode.value);
        }
        currentBasket.setCustomerEmail(email);
    });
    Transaction.wrap(function () {
        HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
    });
    var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();
    if (!processor) {
        throw new Error(Resource.msg('error.payment.processor.missing', 'checkout', null));
    }
    var processorResult = null;
    if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
        processorResult = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(), 'Handle', currentBasket);
    } else {
        // eslint-disable-next-line spellcheck/spell-checker
        throw new Error('vip/hooks/vipHooks.js file is missing or "app.payment.processor.vip_points" hook is wrong setted');
    }
    if (processorResult.error) {
        var result = {
            form: billingForm,
            fieldErrors: [],
            serverErrors: [],
            error: true
        };
        return result;
    }
    var currentLocale = Locale.getLocale(req.locale.id);
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
        req.session.privacyCache.set('usingMultiShipping', false);
        usingMultiShipping = false;
    }
    var basketModel = new OrderModel(currentBasket, {
        countryCode: currentLocale.country,
        containerView: 'basket'
    });
    var accountModel = new AccountModel(req.currentCustomer);
    var renderedStoredPaymentInstrument = COHelpers.getRenderedPaymentInstruments(
        req,
        accountModel
    );
    return {
        renderedPaymentInstruments: renderedStoredPaymentInstrument,
        customer: accountModel,
        order: basketModel,
        vipProcessorResult: processorResult,
        form: billingForm,
        error: false
    };
}

/**
 * Returns the vip authorization id
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {string} authorizationId - Authorization id of vip points
 */
function getVipAuthorizationId(lineItemCtnr) {
    var authorizationId;
    if (!empty(lineItemCtnr)) {
        const vipPaymentInstruments = lineItemCtnr.getPaymentInstruments(VIPPaymentMethodId);
        if (vipPaymentInstruments.size() > 0) {
            var vipPaymentInstrumentsIt = vipPaymentInstruments.iterator();
            while (vipPaymentInstrumentsIt.hasNext()) {
                var vipInstrument = vipPaymentInstrumentsIt.next();
                if (vipInstrument.paymentTransaction && vipInstrument.paymentTransaction.amount && vipInstrument.paymentTransaction.transactionID) {
                    authorizationId = vipInstrument.paymentTransaction.transactionID;
                }
            }
        }
    }
    return authorizationId;
}

/**
 * Returns whether the order is VIP order or not
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {boolean} result - Returns whether order has VIP payment or not
 */
function isVIPOrder(lineItemCtnr) {
    var result = false;
    if (lineItemCtnr) {
        const vipPaymentInstruments = lineItemCtnr.getPaymentInstruments(VIPPaymentMethodId);
        result = vipPaymentInstruments.size() > 0;
    }
    return result;
}

/**
 * Returns whether the order is VIP order or not
 * @param {dw.customer.Customer} currentCustomer - currentCustomer object
 * @returns {boolean} result - Returns whether order has VIP payment or not
 */
function isVIPCustomerOrder(currentCustomer) {
    var result = false;
    var customer = currentCustomer && currentCustomer.raw ? currentCustomer.raw : null;
    if (customer) {
        var isVIP = !empty(customer.profile) && customer.profile.custom && 'vipAccountId' in customer.profile.custom && !empty(customer.profile.custom.vipAccountId);
        result = isVIP;
    }
    return result;
}

/**
 * Return the remaining balance other than vip payment
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {number} remainingBalance - Returns the remaining balance amount
 */
function getRemainingBalance(lineItemCtnr) {
    var orderTotal = lineItemCtnr.totalGrossPrice;
    var vipAmount = getVipRedeemedAmount(lineItemCtnr);
    if (orderTotal && vipAmount) {
        return orderTotal.value - vipAmount;
    }
    return orderTotal.value;
}
/**
 * check partial vip point applied for current payment instrument or not for VIP user.
 * @param {dw.order.PaymentInstrument} paymentInstrument - paymentInstrument
 * @returns {boolean} isVipPartialPointsApplied - return vip Points Details
 */
function vipPartialPointsApplied(paymentInstrument) {
    var isVipPartialPointsApplied = false;
    if (paymentInstrument.getPaymentMethod().equalsIgnoreCase(VIPPaymentMethodId) && !empty(paymentInstrument.custom.vipPaymentDetails)) {
        var vipPointsDetails = JSON.parse(paymentInstrument.custom.vipPaymentDetails);
        if (Object.hasOwnProperty.call(vipPointsDetails, 'partialPointsApplied') && vipPointsDetails.partialPointsApplied) {
            isVipPartialPointsApplied = true;
        }
    }
    return isVipPartialPointsApplied;
}
/**
 * Return the applied partial vip point for  vip payment instrument
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {number} partialVipPointApplied - Returns the Applied partial Vip Applied
 */
function calculatePartialVipAmount(lineItemCtnr) {
    var partialVipPointApplied = 0;
    if (lineItemCtnr) {
        var vipPaymentInstrument = getVipPaymentInstrument(lineItemCtnr);
        if (vipPaymentInstrument && vipPartialPointsApplied(vipPaymentInstrument)) {
            if (vipPaymentInstrument.paymentTransaction && vipPaymentInstrument.paymentTransaction.amount) {
                partialVipPointApplied = vipPaymentInstrument.paymentTransaction.amount.value;
            }
        }
    }
    return partialVipPointApplied;
}
/**
 * check partial vip point applied for basket payment instrument or not for VIP user.
 * @param {dw.order.LineItemCtnr} lineItemCtnr - lineItemCtnr
 * @returns {boolean} isPartialVipAmount - isPartialVipAmount
 */
function isPartialVipPointsApplied(lineItemCtnr) {
    var isPartialVipAmount = false;
    var appliedVipInfoObj = getVipPoints(lineItemCtnr);
    if (!empty(appliedVipInfoObj) && appliedVipInfoObj.partialPointsApplied) {
        isPartialVipAmount = true;
    }
    return isPartialVipAmount;
}
module.exports = {
    VIPPaymentMethodId: VIPPaymentMethodId,
    checkBalance: checkBalance,
    authorize: authorize,
    capture: capture,
    voidAuthorization: voidAuthorization,
    handleVIPPayment: handleVIPPayment,
    handleVipPaymentMethod: handleVipPaymentMethod,
    isOrderTotalRedeemedByVipPoints: isOrderTotalRedeemedByVipPoints,
    removeNonVipPaymentInstruments: removeNonVipPaymentInstruments,
    getVipRenderingTemplate: getVipRenderingTemplate,
    getVipAuthorizationId: getVipAuthorizationId,
    isVIPOrder: isVIPOrder,
    getVipPoints: getVipPoints,
    getRemainingBalance: getRemainingBalance,
    getVipPaymentInstrument: getVipPaymentInstrument,
    isVIPCustomerOrder: isVIPCustomerOrder,
    vipPartialPointsApplied: vipPartialPointsApplied,
    calculatePartialVipAmount: calculatePartialVipAmount,
    isPartialVipPointsApplied: isPartialVipPointsApplied,
    getVipRedeemedAmount: getVipRedeemedAmount
};
