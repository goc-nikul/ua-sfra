'use strict';
/*
 * API Includes
 */
const Logger = require('dw/system/Logger').getLogger('GiftCard');
const StringUtils = require('dw/util/StringUtils');
const Money = require('dw/value/Money');
const Site = require('dw/system/Site');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const gcPaymentMethodId = 'GIFT_CARD';
const ccPaymentMethodId = 'Paymetric';
const aurusCCPaymentMethodId = 'AURUS_CREDIT_CARD';
var collections = require('*/cartridge/scripts/util/collections');
const eGiftCard = 'EGIFT_CARD';
const physicalGiftCard = 'GIFT_CARD';
const giftCardShipmentID = 'EGiftCardShipment';

/**
 * Calculates and returns gift card redeemed amount
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {number} returns gift card redeemed amount
 *
 */
function getGcRedeemedAmount(lineItemCtnr) {
    let gcRedeemedAmount = 0;
    const gcPaymentInstruments = lineItemCtnr.getPaymentInstruments(gcPaymentMethodId);
    if (gcPaymentInstruments.size() > 0) {
        var gcPaymentInstrumentsIt = gcPaymentInstruments.iterator();
        while (gcPaymentInstrumentsIt.hasNext()) {
            var gcInstrument = gcPaymentInstrumentsIt.next();
            if (gcInstrument.paymentTransaction && gcInstrument.paymentTransaction.amount) {
                gcRedeemedAmount += gcInstrument.paymentTransaction.amount.value;
            }
        }
    }
    return gcRedeemedAmount;
}
/**
 * Calculates and returns if order total is redeemed by gift cards.
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {boolean} returns true if order total is redeemed by gift cards, else false
 *
 */
function isOrderTotalRedeemed(lineItemCtnr) {
    if (empty(lineItemCtnr)) {
        return false;
    }
    var orderTotal = lineItemCtnr.getTotalGrossPrice();
    const gcRedeemedAmount = getGcRedeemedAmount(lineItemCtnr);
    if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
        var vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
        var partialVipAmount = vipDataHelpers.calculatePartialVipAmount(lineItemCtnr);
        if (partialVipAmount) {
            orderTotal = orderTotal.subtract(new Money(partialVipAmount, lineItemCtnr.getCurrencyCode()));
        }
    }
    return (gcRedeemedAmount >= orderTotal.value);
}

/**
 * Return the remaining balance other than GC payment excluing VIP points
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {number} remainingBalance - Returns the remaining balance amount
 */
function getRemainingBalance(lineItemCtnr) {
    var orderTotal = lineItemCtnr.totalGrossPrice;
    var gcRedeemedAmount = getGcRedeemedAmount(lineItemCtnr);
    if (orderTotal && gcRedeemedAmount) {
        if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
            var vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
            var partialVipAmount = vipDataHelpers.calculatePartialVipAmount(lineItemCtnr);
            if (partialVipAmount) {
                orderTotal = orderTotal.subtract(new Money(partialVipAmount, lineItemCtnr.getCurrencyCode()));
            }
        }
        return orderTotal.value - gcRedeemedAmount;
    }
    return orderTotal.value;
}

/**
 * Removes payment instruments which does not support mixed payment
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {void}
 *
 */
function removeNotSupportedPaymentInstruments(lineItemCtnr) {
    if (!empty(lineItemCtnr)) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var vipDataHelper;
            if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
                vipDataHelper = require('*/cartridge/scripts/vipDataHelpers');
            }
            var paymentInstrumentsIt = paymentInstruments.iterator();
            Transaction.wrap(function () {
                while (paymentInstrumentsIt.hasNext()) {
                    var isVipPartialPointsApplied = false;
                    var paymentInstrument = paymentInstrumentsIt.next();
                    if (vipDataHelper) {
                        isVipPartialPointsApplied = vipDataHelper.vipPartialPointsApplied(paymentInstrument);
                    }
                    if (!(paymentInstrument.getPaymentMethod().equalsIgnoreCase(gcPaymentMethodId) || paymentInstrument.getPaymentMethod().equalsIgnoreCase(ccPaymentMethodId) || paymentInstrument.getPaymentMethod().equalsIgnoreCase(aurusCCPaymentMethodId) || isVipPartialPointsApplied)) {
                        lineItemCtnr.removePaymentInstrument(paymentInstrument);
                    }
                }
            });
        }
    }
}
/**
 * Removes payment instruments other than gift cards
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {void}
 *
 */
function removeNonGcPaymentInstruments(lineItemCtnr) {
    if (!empty(lineItemCtnr)) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            var vipDataHelpers;
            if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
                vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
            }
            Transaction.wrap(function () {
                while (paymentInstrumentsIt.hasNext()) {
                    var paymentInstrument = paymentInstrumentsIt.next();
                    if (!paymentInstrument.getPaymentMethod().equalsIgnoreCase(gcPaymentMethodId) && !(vipDataHelpers && vipDataHelpers.vipPartialPointsApplied(paymentInstrument))) {
                        lineItemCtnr.removePaymentInstrument(paymentInstrument);
                    }
                }
            });
        }
    }
}
/**
 * Removes gift card payment instrument
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @param {string} maskedgckastfournumber - gift card last four numbers
 * @returns {void}
 *
 */
function removeGcPaymentInstrument(lineItemCtnr, maskedgckastfournumber) {
    if (!empty(lineItemCtnr) && maskedgckastfournumber) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            Transaction.wrap(function () {
                while (paymentInstrumentsIt.hasNext()) {
                    var paymentInstrument = paymentInstrumentsIt.next();
                    if (paymentInstrument.custom.gcNumber && maskedgckastfournumber === paymentInstrument.custom.gcNumber.slice(-4) && paymentInstrument.getPaymentMethod().equalsIgnoreCase(gcPaymentMethodId)) {
                        lineItemCtnr.removePaymentInstrument(paymentInstrument);
                        break;
                    }
                }
            });
        }
    }
}

/**
 * Removes gift card payment instrument
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @param {string} uuid - gift card uuid
 * @returns {void}
 *
 */
function removeGcPaymentInstruments(lineItemCtnr) {
    if (!empty(lineItemCtnr)) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            Transaction.wrap(function () {
                while (paymentInstrumentsIt.hasNext()) {
                    var paymentInstrument = paymentInstrumentsIt.next();
                    if (paymentInstrument.getPaymentMethod().equalsIgnoreCase(gcPaymentMethodId)) {
                        lineItemCtnr.removePaymentInstrument(paymentInstrument);
                    }
                }
            });
        }
    }
}

/**
 * Create payment instrument if gift card balance is greater than 0
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @param {string} gcNumber - gift card number.
 * @param {string} gcPin - gift card pin.
 * @param {Object} giftCardDataCached - gift card service response.
 * @returns {Object} returns json object
 * Example Response
 *  {
 *      success: true,
 *      message: '',
 *      maskedGcNumber: '',
 *      gcNumber: '',
 *      balanceApplied: '',
 *      balanceRemaining: '',
 *      displayNonGcPayments:'',
 *      maskedGcLastFourNumber: ''
 *  }
 *
 */
function applyGiftCard(lineItemCtnr, gcNumber, gcPin, giftCardDataCached) {
    const firstDataHelper = require('*/cartridge/scripts/firstDataHelper');
    const giftCardResponse = {
        success: false,
        message: '',
        maskedGcNumber: '',
        maskedGcPin: '',
        gcNumber: '',
        balanceApplied: '',
        balanceRemaining: '',
        isOrderTotalRedeemed: false,
        maskedGcLastFourNumber: ''
    };
    try {
        var orderTotal = lineItemCtnr.getTotalGrossPrice().value;
        if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
            var vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
            var partialVipAmount = vipDataHelpers.calculatePartialVipAmount(lineItemCtnr);
            if (partialVipAmount) {
                var orderTotalPrice = new Money(orderTotal, lineItemCtnr.getCurrencyCode()).subtract(new Money(partialVipAmount, lineItemCtnr.getCurrencyCode()));
                orderTotal = orderTotalPrice.value;
            }
        }
        var gCRedeemedAmount = getGcRedeemedAmount(lineItemCtnr);
        if (!(orderTotal > gCRedeemedAmount)) {
            giftCardResponse.success = true;
            giftCardResponse.isOrderTotalRedeemed = true;
            return giftCardResponse;
        }
        // Call service only when cached values are not provided
        var gcBalanceResponse = {};
        if (!empty(giftCardDataCached)) {
            gcBalanceResponse.success = true;
            gcBalanceResponse.giftCardData = giftCardDataCached;
        } else {
            gcBalanceResponse = firstDataHelper.checkBalance(gcNumber, gcPin);
        }
        if (!gcBalanceResponse.success) {
            giftCardResponse.message = Resource.msg('giftcards.default.error', 'giftcards', 'Please check gift card details and try again.');
            return giftCardResponse;
        }
        if (!empty(gcBalanceResponse.giftCardData) && gcBalanceResponse.giftCardData.currentBalance > 0) {
            // Once Gift Card gets applied, Remove payment instrument which does not support mixed payment
            removeNotSupportedPaymentInstruments(lineItemCtnr);
            const currencyCode = lineItemCtnr.getCurrencyCode();
            let gcRedeemedAmount = 0.0;
            const gcPaymentInstruments = lineItemCtnr.getPaymentInstruments(gcPaymentMethodId);
            if (gcPaymentInstruments.size() > 0) {
                var gcPaymentInstrumentsIt = gcPaymentInstruments.iterator();
                Transaction.wrap(function () {
                    while (gcPaymentInstrumentsIt.hasNext()) {
                        var gcInstrument = gcPaymentInstrumentsIt.next();
                        if (gcInstrument.custom.gcNumber.equals(gcNumber)) {
                            lineItemCtnr.removePaymentInstrument(gcInstrument); // remove duplicate payment instrument for same card number .
                        } else if (gcInstrument.paymentTransaction && gcInstrument.paymentTransaction.amount) {
                            gcRedeemedAmount += gcInstrument.paymentTransaction.amount.value;
                        }
                    }
                });
            }
            if (gcRedeemedAmount > 0) {
                orderTotal -= gcRedeemedAmount;
            }
            const availableBalance = gcBalanceResponse.giftCardData.currentBalance;
            let balanceApplied;
            if (orderTotal < availableBalance) {
                balanceApplied = new Money(orderTotal, currencyCode);
            } else {
                balanceApplied = new Money(availableBalance, currencyCode);
            }
            if (balanceApplied && balanceApplied.value > 0) {
                Transaction.wrap(function () {
                    const gcPaymentInstrument = lineItemCtnr.createPaymentInstrument(gcPaymentMethodId, balanceApplied);
                    gcPaymentInstrument.custom.gcAvailableBalance = Number(availableBalance);
                    gcPaymentInstrument.custom.gcNumber = gcNumber;
                    gcPaymentInstrument.custom.gcPin = gcPin;
                    gcPaymentInstrument.custom.gcClass = gcBalanceResponse.giftCardData.cardClass || '';
                    gcPaymentInstrument.custom.gcRemainingBalance = StringUtils.formatMoney(new Money(availableBalance - balanceApplied.value, currencyCode));
                });
                giftCardResponse.success = true;
                giftCardResponse.message = Resource.msg('giftcards.apply.success.message', 'giftcards', 'Gift card applied successfully');
                giftCardResponse.gcNumber = gcNumber;
                giftCardResponse.maskedGcNumber = '************' + gcNumber.slice(12, gcNumber.length);
                giftCardResponse.maskedGcPin = '******' + gcPin.slice(6, gcNumber.length);
                giftCardResponse.balanceApplied = StringUtils.formatMoney(balanceApplied);
                giftCardResponse.balanceRemaining = StringUtils.formatMoney(new Money(availableBalance - balanceApplied.value, currencyCode));
                giftCardResponse.isOrderTotalRedeemed = (orderTotal <= availableBalance);
                giftCardResponse.maskedGcLastFourNumber = gcNumber.slice(12, gcNumber.length);
            }
        } else {
            giftCardResponse.message = Resource.msg('giftcards.apply.insufficient.balance', 'giftcards', 'Insufficient balance or invalid gift card.');
            giftCardResponse.success = false;
            return giftCardResponse;
        }
    } catch (e) {
        giftCardResponse.message = Resource.msg('giftcards.default.error', 'giftcards', 'Please check gift card details and try again.');
        Logger.error('Error while applying gift card :: error :: {0}', JSON.stringify(e));
    }
    return giftCardResponse;
}

/**
 * Handle Gift Cards Payments In CheckoutServices-SubmitPayment call.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} result - Response object
 */
function handleGiftCardPayment(req, res) {
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
    var paymentMethodID = gcPaymentMethodId;
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
        throw new Error('giftcard/hooks/giftcardsHooks.js file is missing or "app.payment.processor.gift_card" hook is wrong setted');
    }
    // Check for vip partial case
    var vipDataHelpers;
    if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
        vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
    }
    if (vipDataHelpers && vipDataHelpers.isPartialVipPointsApplied(currentBasket) && processorResult && !processorResult.error) {
        const VIPPaymentMethodId = 'VIP_POINTS';
        Transaction.wrap(function () {
            HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
        });
        var vipProcessor = PaymentMgr.getPaymentMethod(VIPPaymentMethodId).getPaymentProcessor();
        if (!vipProcessor) {
            throw new Error(Resource.msg('error.payment.processor.missing', 'checkout', null));
        }
        if (HookMgr.hasHook('app.payment.processor.' + vipProcessor.ID.toLowerCase())) {
            processorResult = HookMgr.callHook('app.payment.processor.' + vipProcessor.ID.toLowerCase(), 'Handle', currentBasket);
        } else {
            // eslint-disable-next-line spellcheck/spell-checker
            throw new Error('vip/hooks/vipHooks.js file is missing or "app.payment.processor.vip_points" hook is wrong setted');
        }
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
        giftcardProcessorResult: processorResult,
        form: billingForm,
        error: false
    };
}
/**
 * Returns all applied gift cards data
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {Object} - Gift cards data.
 *
 */
function getGcPaymentInstruments(lineItemCtnr) {
    var gcPaymentInstruments = [];
    if (!empty(lineItemCtnr)) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments(gcPaymentMethodId);
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            while (paymentInstrumentsIt.hasNext()) {
                var gcPaymentInstrument = paymentInstrumentsIt.next();
                gcPaymentInstruments.push({
                    gcNumber: gcPaymentInstrument.custom.gcNumber,
                    gcPin: gcPaymentInstrument.custom.gcPin,
                    maskedGcNumber: '**** **** **** ' + gcPaymentInstrument.custom.gcNumber.slice(12, gcPaymentInstrument.custom.gcNumber.length),
                    maskedGcPin: '**** **' + gcPaymentInstrument.custom.gcPin.slice(6, gcPaymentInstrument.custom.gcNumber.length),
                    uuid: gcPaymentInstrument.UUID,
                    appliedAmount: StringUtils.formatMoney(new Money(gcPaymentInstrument.paymentTransaction.amount.value, lineItemCtnr.currencyCode)),
                    gcBalanceRemaining: 'gcRemainingBalance' in gcPaymentInstrument.custom && gcPaymentInstrument.custom.gcRemainingBalance,
                    maskedGcLastFourNumber: gcPaymentInstrument.custom.gcNumber.slice(12, gcPaymentInstrument.custom.gcNumber.length)
                });
            }
        }
    }
    return gcPaymentInstruments;
}
/**
 * This method checks whether basket has gift card, e-gift card, only E-gift card and gift card count
 * @param {dw.order.Basket} currentBasket - currentBasket
 * @returns {boolean} - returns json object
 */
function basketHasGiftCardItems(currentBasket) {
    var giftCardItemsCount = 0;
    var eGiftCards = false;
    var giftCards = false;
    var onlyEGiftCards = true;
    var eGiftCardTotal = 0;
    if (currentBasket) {
        collections.forEach(currentBasket.getAllProductLineItems(), function (lineItem) {
            if (lineItem.product && 'giftCard' in lineItem.product.custom && (lineItem.product.custom.giftCard.value === eGiftCard || lineItem.product.custom.giftCard.value === physicalGiftCard)) {
                giftCardItemsCount++;
            }
            if (lineItem.product && 'giftCard' in lineItem.product.custom && lineItem.product.custom.giftCard.value === eGiftCard) {
                eGiftCards = true;
                eGiftCardTotal += lineItem.basePrice.value;
            } else {
                onlyEGiftCards = false;
            }
        });
        if (giftCardItemsCount > 0) {
            giftCards = true;
        }
    }
    var result = {
        giftCardItemsCount: giftCardItemsCount,
        eGiftCards: eGiftCards,
        giftCards: giftCards,
        onlyEGiftCards: onlyEGiftCards,
        eGiftCardTotal: eGiftCardTotal
    };
    return result;
}
/**
 * This method checks whether basket has only e-giftCard items or even physical items
 * !Deprecated function, instead use function basketHasGiftCardItems to check if basket has only e-giftCard
 * @param {dw.order.Basket} currentBasket - currentBasket
 * @returns {boolean} - returns whether basket contains only eGift-items or not
 */
function basketHasOnlyEGiftCards(currentBasket) {
    if (currentBasket) {
        var eGiftCardCount = 0;
        var hasOnlyEGiftCards = true;
        collections.forEach(currentBasket.getAllProductLineItems(), function (lineItem) {
            if (lineItem.product && 'giftCard' in lineItem.product.custom && lineItem.product.custom.giftCard.value === eGiftCard) {
                eGiftCardCount++;
            } else {
                hasOnlyEGiftCards = false;
            }
        });

        if (eGiftCardCount > 0 && hasOnlyEGiftCards) {
            return true;
        }
    }
    return false;
}

/**
 * This method checks whether basket has e-giftCard items or not
 * !Deprecated function, instead use function basketHasGiftCardItems to check if basket has egift card
 * @param {dw.order.Basket} currentBasket - currentBasket
 * @returns {boolean} - returns whether basket contains eGift-items or not
 */
function basketHasEGiftCards(currentBasket) {
    var hasGiftCards = false;
    if (currentBasket) {
        collections.forEach(currentBasket.getAllProductLineItems(), function (lineItem) {
            if (lineItem.product && 'giftCard' in lineItem.product.custom && lineItem.product.custom.giftCard.value === eGiftCard) {
                hasGiftCards = true;
                return;
            }
        });
    }
    return hasGiftCards;
}

/**
 * This method checks gets the e-giftCard items from lineItemCtnr
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {boolean} - returns whether basket contains eGift-items or not
 */
function getEGiftCardLineItems(lineItemCtnr) {
    var eGiftCardLineItems = [];
    if (lineItemCtnr) {
        collections.forEach(lineItemCtnr.getAllProductLineItems(), function (lineItem) {
            if (lineItem.product && 'giftCard' in lineItem.product.custom && lineItem.product.custom.giftCard.value === eGiftCard) {
                eGiftCardLineItems.push(lineItem);
            }
        });
    }
    return eGiftCardLineItems;
}

/**
 * Cleans the shipments of the current basket by putting all gift certificate line items to single, possibly
 * new, shipments, with one shipment per gift certificate line item.
 * @param {dw.order.Basket} currentBasket - The account model for the current customer
 *
 */
var updateGiftCardShipments = function (currentBasket) {
    var shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var ArrayList = require('dw/util/ArrayList');
    // List of line items.
    var giftCertificatesLI = new ArrayList();

    // Finds gift certificates in shipments that have
    // product line items and gift certificate line items merged.
    var shipments = currentBasket.getShipments().iterator();
    var shipToShipment = null;
    var shipToLineItems = new ArrayList();

    while (shipments.hasNext()) {
        var shipment = shipments.next();
        var giftCertificateLineItems = new ArrayList();

        // eslint-disable-next-line no-loop-func
        collections.forEach(shipment.getProductLineItems(), function (lineItem) {
            if ('giftCard' in lineItem.product.custom && lineItem.product.custom.giftCard.value === eGiftCard) {
                giftCertificateLineItems.add(lineItem);
            } else if (!lineItem.shipment.custom.fromStoreId) {
                shipToLineItems.add(lineItem);
                if (!shipToShipment) {
                    shipToShipment = shipment;
                }
            }
        });
        // Skips shipment if no gift certificates are contained.
        if (giftCertificateLineItems.size() === 0) {
            // eslint-disable-next-line no-continue
            continue;
        }

        // If there are gift certificates, add them to the list.
        if (giftCertificateLineItems.size() > 0) {
            giftCertificatesLI.addAll(giftCertificateLineItems);
        }
    }

    var giftCardShipment = currentBasket.getShipment(giftCardShipmentID);
    var shippingMethod = shippingHelper.getShippingMethodByID('eGift_Card');
    // Create a shipment for each gift certificate line item.
    if (giftCertificatesLI.length === currentBasket.getAllProductLineItems().size()) {
        giftCardShipment = currentBasket.getDefaultShipment();
        for (let n = 0; n < giftCertificatesLI.length; n++) {
            giftCertificatesLI.get(n).setShipment(giftCardShipment);
            if (shippingMethod) {
                giftCardShipment.setShippingMethod(shippingMethod);
                giftCardShipment.getShippingLineItem('STANDARD_SHIPPING').setPriceValue(parseFloat(0, 10));
            }
        }
    } else {
        for (let n = 0; n < giftCertificatesLI.length; n++) {
            if (empty(giftCardShipment)) {
                giftCardShipment = currentBasket.createShipment(giftCardShipmentID);
                giftCertificatesLI.get(n).setShipment(giftCardShipment);
            } else {
                giftCertificatesLI.get(n).setShipment(giftCardShipment);
            }

            if (shippingMethod) {
                giftCardShipment.setShippingMethod(shippingMethod);
                giftCardShipment.getShippingLineItem('STANDARD_SHIPPING').setPriceValue(parseFloat(0, 10));
            }
        }
        if (currentBasket.shipments.length > 1 && shipToLineItems.size() > 0 && shipToShipment && shipToShipment.shippingMethodID === 'eGift_Card') {
            var shipToShippingMethod = shippingHelper.getShippingMethodByID('standard');
            var shipmentFromBasket = currentBasket.getShipment(shipToShipment.ID);
            if (shipmentFromBasket && shipToShippingMethod) {
                shipmentFromBasket.setShippingMethod(shipToShippingMethod);
            }
        }
    }
};

/**
 * The function removes all empty shipments of the currentBasket.
 *
 * @param {dw.order.Basket} currentBasket - The account model for the current customer
 */
function removeEmptyShipments(currentBasket) {
    // Gets the list of shipments.
    var shipments = currentBasket.getShipments().iterator();
    Transaction.wrap(function () {
        while (shipments.hasNext()) {
            var shipment = shipments.next();
            if (!shipment.isDefault()) {
                if (shipment.getProductLineItems().isEmpty()) {
                    currentBasket.removeShipment(shipment);
                }
            }
        }
    });
}

/**
 * This method updates eGiftCard Data to ProductLineItem attributes
 * @param {string} productId - Product ID value
 * @param {string} uuid - ProductLineItem UUID value
 * @param {string} eGiftCardFormData - submitted eGift card data
 */
function updateEGiftCardData(productId, uuid, eGiftCardFormData) {
    try {
        var BasketMgr = require('dw/order/BasketMgr');
        var TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');
        var productLineItems = BasketMgr.getCurrentBasket().getProductLineItems(productId);
        var eGiftCardData = JSON.parse(eGiftCardFormData);
        var timezoneHelper = new TimezoneHelper();
        collections.forEach(productLineItems, function (pli) {
            var productLineItem = pli;
            if (productLineItem.getUUID() === uuid) {
                Transaction.wrap(function () {
                    productLineItem.custom.gcRecipientName = eGiftCardData.gcRecipientName || '';
                    productLineItem.custom.gcRecipientEmail = decodeURIComponent(eGiftCardData.gcRecipientEmail || '');
                    productLineItem.custom.gcFrom = eGiftCardData.gcFrom || '';
                    if (eGiftCardData.gcDeliveryDate) {
                        var dateElements = eGiftCardData.gcDeliveryDate.split('-');
                        var deliveryDate = timezoneHelper.getCurrentSiteTime();
                        deliveryDate.setFullYear(dateElements[0]);
                        deliveryDate.setMonth(dateElements[1] - 1, dateElements[2]);
                        productLineItem.custom.gcDeliveryDate = deliveryDate;
                    }
                    productLineItem.custom.gcMessage = eGiftCardData.gcMessage || '';
                    productLineItem.setPriceValue(parseFloat(eGiftCardData.gcAmount || 0, 10));
                });
            }
        });
    } catch (e) {
        Logger.error('Error updating EGiftCard ProductLineItem: ' + e.message);
        return;
    }
    return;
}

/**
 * Returns Price Range in string format to display in storefront for eGiftCard
 * @returns {string} contains eGiftCard Price Range
 */
function getEGiftCardAmountRange() {
    var minAmount = Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMin');
    var maxAmount = Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMax');
    var range = '';

    if (minAmount < maxAmount) {
        range = new Money(minAmount, Site.current.getDefaultCurrency()).toFormattedString() + ' - ' + new Money(maxAmount, Site.current.getDefaultCurrency()).toFormattedString();
    } else if (minAmount === maxAmount) {
        range = new Money(0, Site.current.getDefaultCurrency()).toFormattedString() + ' - ' + new Money(maxAmount, Site.current.getDefaultCurrency()).toFormattedString();
    }
    return range;
}

/**
 * The function removes all empty shipments of the currentBasket.
 *
 * @param {Object} csrf - csrf token name and value
 * @returns {Object} returns json object
 */
function giftCardFormData(csrf) {
    const currentSite = require('dw/system/Site').getCurrent();
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var gcPaymentInstruments = null;
    var orderTotalRedeemed = null;
    var giftCardsLimitExceeded = false;
    var GCRedeemedAmount = null;
    var remainingBalance = null;
    const currencyCode = currentBasket.getCurrencyCode();
    const maxGiftcards = currentSite.getCustomPreferenceValue('firstDataMaxGiftcards') ? currentSite.getCustomPreferenceValue('firstDataMaxGiftcards') : 2;
    if (!empty(currentBasket)) {
        gcPaymentInstruments = this.getGcPaymentInstruments(currentBasket);
        orderTotalRedeemed = this.isOrderTotalRedeemed(currentBasket);
        if (gcPaymentInstruments && gcPaymentInstruments.length >= maxGiftcards) {
            giftCardsLimitExceeded = true;
        }
    }
    GCRedeemedAmount = this.getGcRedeemedAmount(currentBasket) ? StringUtils.formatMoney(new Money(this.getGcRedeemedAmount(currentBasket), currencyCode)) : '$0.00';
    remainingBalance = getRemainingBalance(currentBasket);
    var nonGCPaymentInstrumentsBalance = remainingBalance ? StringUtils.formatMoney(new Money(remainingBalance, currentBasket.getCurrencyCode())) : '$0.00';
    var results = {
        gcPaymentInstruments: gcPaymentInstruments,
        isOrderTotalRedeemed: orderTotalRedeemed,
        giftCardsLimitExceeded: giftCardsLimitExceeded,
        getGcRedeemedAmount: GCRedeemedAmount,
        csrf: csrf,
        getRemaingBalance: nonGCPaymentInstrumentsBalance
    };
    var templateContent = renderTemplateHelper.getRenderedHtml(results, '/checkout/giftcard/giftcardForm');
    return {
        gcResults: results,
        templateContent: templateContent
    };
}


/**
 * This method return the giftCards balance from first data by using giftCardPaymentInstruments
 *
 * @param {Object} giftCardPaymentInstruments - giftCardPaymentInstruments available in cart
 * @returns{Object} - returns the result of the gift card balance
 */
function getGiftCardsBalanceFromFirstData(giftCardPaymentInstruments) {
    const firstDataHelper = require('*/cartridge/scripts/firstDataHelper');
    var giftCards = [];
    var giftCardsBalanceFirstData = null;
    var giftCardsBalanceAvailableAtFirstData = 0;
    var giftCardsData = [];
    var result = {
        giftCardsData: [],
        giftCardsBalanceAvailableAtFirstData: 0
    };
    if (giftCardPaymentInstruments.length > 0) {
        giftCardPaymentInstruments.forEach(function (giftCardPaymentInstrument) {
            giftCards.push({
                gcNumber: giftCardPaymentInstrument.gcNumber,
                gcPin: giftCardPaymentInstrument.gcPin
            });
        });
        giftCardsBalanceFirstData = firstDataHelper.checkGiftCardsBalance(giftCards);
    }

    if (giftCardsBalanceFirstData && giftCardsBalanceFirstData.success) {
        giftCardsData = giftCardsBalanceFirstData.giftCardsData;

        // Sort the giftCards Ascending to Descending
        giftCardsData.sort(function (obj1, obj2) {
            return obj1.amount - obj2.amount;
        });

        // Get the zero balance cards
        var giftCardsWithZeroBalance = giftCardsData.filter(function (giftCard) {
            return giftCard.currentBalance <= 0;
        });

        // Remove the 0 balance gift cards
        var giftCardsDataWithBalance = giftCardsData.filter(function (giftCard) {
            return giftCard.currentBalance > 0;
        });

        giftCardsDataWithBalance = giftCardsDataWithBalance.sort(function (obj1, obj2) {
            return obj1.currentBalance > obj2.currentBalance;
        });

        giftCardsDataWithBalance.forEach(function (giftCard) {
            var actualGiftCard = giftCards.filter(function (gc) {
                return giftCard.cardNumber === gc.gcNumber;
            });
            // eslint-disable-next-line no-param-reassign
            giftCard.gcNumber = actualGiftCard[0].gcNumber;
            // eslint-disable-next-line no-param-reassign
            giftCard.gcPin = actualGiftCard[0].gcPin;
            giftCardsBalanceAvailableAtFirstData += giftCard.currentBalance;
        });
        return {
            error: false,
            giftCardsData: giftCardsDataWithBalance,
            giftCardsWithZeroBalance: giftCardsWithZeroBalance,
            giftCardsBalanceAvailableAtFirstData: giftCardsBalanceAvailableAtFirstData
        };
    }
    result.error = true;
    return result;
}

/**
 * This method validates payment instruments in the current basket if any issues it will re-arrange the payment instruments
 *
* @param {dw.order.Basket} currentBasket - The account model for the current customer
* @param {boolean} fromPromo - Called from promo field or not
* @returns {Object} giftCardsBalanceFirstData - firstData response
 */
function updatePaymentTransaction(currentBasket, fromPromo) {
    var giftCardsBalanceAvailableAtFirstData = 0;
    var orderTotal = currentBasket.totalGrossPrice;
    var giftCardsBalanceFirstData;
    var cartGiftCardsTotal = new Money(getGcRedeemedAmount(currentBasket), currentBasket.getCurrencyCode());
    var isRemoveGCPInstruments = false;
    var currentUser = currentBasket.customer;
    var isVIP = currentUser && !empty(currentUser.profile) && 'vipAccountId' in currentUser.profile.custom && !empty(currentUser.profile.custom.vipAccountId);
    if (isVIP && Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
        isRemoveGCPInstruments = true;
    }
    if ((this.basketHasGiftCardItems(currentBasket).giftCards) || isRemoveGCPInstruments) {
        removeGcPaymentInstruments(currentBasket);
    }

    var giftCardPaymentInstruments = getGcPaymentInstruments(currentBasket);
    if (giftCardPaymentInstruments.length > 0) {
        giftCardsBalanceFirstData = getGiftCardsBalanceFromFirstData(giftCardPaymentInstruments);
        giftCardsBalanceAvailableAtFirstData = giftCardsBalanceFirstData.giftCardsBalanceAvailableAtFirstData;
        if (giftCardsBalanceAvailableAtFirstData > 0 && cartGiftCardsTotal.value !== orderTotal.value) {
            if (fromPromo) {
                var paymentInstruments = currentBasket.getPaymentInstruments(); // eslint-disable-line
                if (paymentInstruments.size() > 0) { // eslint-disable-line
                    var paymentInstrumentsIt = paymentInstruments.iterator(); // eslint-disable-line
                    while (paymentInstrumentsIt.hasNext()) { // eslint-disable-line
                        var paymentInstrument = paymentInstrumentsIt.next(); // eslint-disable-line
                        if (paymentInstrument.getPaymentMethod().equalsIgnoreCase('GIFT_CARD')) {
                            var gcNumber = paymentInstrument.custom.gcNumber;
                            var gcPin = paymentInstrument.custom.gcPin;
                            Transaction.wrap(function () { // eslint-disable-line
                                currentBasket.removePaymentInstrument(paymentInstrument);
                            });
                            applyGiftCard(currentBasket, gcNumber, gcPin);
                        }
                    }
                }
            } else {
                removeGcPaymentInstruments(currentBasket);
                // Re-Apply giftcards
                giftCardsBalanceFirstData.giftCardsData.forEach(function (giftCard) {
                    // Use cached data from previous giftCardsBalanceFirstData server call.
                    applyGiftCard(currentBasket, giftCard.gcNumber, giftCard.gcPin, giftCard);
                });
            }
        }
    }

    var remainingBalance = getRemainingBalance(currentBasket);
    if (remainingBalance <= 0) {
        removeNonGcPaymentInstruments(currentBasket);
    } else {
        // Adjust if the amount of the paymetric payment method if it is already available
        // eslint-disable-next-line no-lonely-if
        if (!empty(currentBasket)) {
            var paymentInstruments = currentBasket.getPaymentInstruments(); // eslint-disable-line
            if (paymentInstruments.size() > 0) { // eslint-disable-line
                var paymentInstrumentsIt = paymentInstruments.iterator(); // eslint-disable-line
                Transaction.wrap(function () {
                    while (paymentInstrumentsIt.hasNext()) { // eslint-disable-line
                        var paymentInstrument = paymentInstrumentsIt.next(); // eslint-disable-line
                        if (paymentInstrument.getPaymentMethod().equalsIgnoreCase('Paymetric') || paymentInstrument.getPaymentMethod().equalsIgnoreCase('AURUS_CREDIT_CARD')) { // eslint-disable-line
                            paymentInstrument.paymentTransaction.setAmount(new Money(remainingBalance, currentBasket.getCurrencyCode()));
                            break;
                        }
                    }
                });
            }
        }
    }
    return giftCardsBalanceFirstData;
}


/**
 * This method return the number of giftCard items available in the current basket
 * !Deprecated function, instead use function basketHasGiftCardItems to get the count of gift card items in basket
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @returns {number} giftCardItemsCount
 */
function getTotalGiftCardsItems(lineItemCtnr) {
    var giftCardItemsCount = 0;
    if (lineItemCtnr !== null) {
        collections.forEach(lineItemCtnr.getAllProductLineItems(), function (lineItem) {
            if ('giftCard' in lineItem.product.custom && (lineItem.product.custom.giftCard.value === eGiftCard || lineItem.product.custom.giftCard.value === physicalGiftCard)) {
                giftCardItemsCount++;
            }
        });
    }
    return giftCardItemsCount;
}

/**
* This method checks whether basket has giftCard item or not
* !Deprecated function, instead use function basketHasGiftCardItems to check if basket has gift card items
* @param {dw.order.Basket} currentBasket - currentBasket
* @returns {boolean} - returns whether basket contains eGift-items or not
*/
function basketHasGiftCard(currentBasket) {
    var hasGiftCard = getTotalGiftCardsItems(currentBasket) > 0;
    return hasGiftCard;
}

/**
 * Returns the list applied gift cards
 * @param {dw.order.LineItemCtnr} lineItemCtnr - LineItemCtnr/lineItemCtnr object
 * @param {boolean} isAuthReverseCall - To return result based on boolean value
 * @returns{Object} - returns the result of the gift card balance
 *
 */
function getAppliedGiftCards(lineItemCtnr, isAuthReverseCall) {
    var result = [];
    let gcAmount = 0;
    if (!empty(lineItemCtnr)) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            Transaction.wrap(function () {
                while (paymentInstrumentsIt.hasNext()) {
                    var params = {};
                    var paymentInstrument = paymentInstrumentsIt.next();
                    if (paymentInstrument && paymentInstrument.getPaymentMethod().equalsIgnoreCase(gcPaymentMethodId) && paymentInstrument.paymentTransaction && (paymentInstrument.paymentTransaction.transactionID || !isAuthReverseCall)) {
                        params.gcNumber = paymentInstrument.custom.gcNumber;
                        params.gcPin = paymentInstrument.custom.gcPin;
                        if (paymentInstrument.paymentTransaction && paymentInstrument.paymentTransaction.amount) {
                            gcAmount = paymentInstrument.paymentTransaction.amount.value;
                        }
                        params.amount = gcAmount;
                        result.push(params);
                    }
                }
            });
        }
    }
    return result;
}

/**
* This method checks whether basket has applied gift card or not
*
* @param {dw.order.Basket} lineItemCtnr - currentBasket
* @returns {boolean} - returns whether basket contains eGift-items or not
*/
function basketHasGCPaymentInstrument(lineItemCtnr) {
    var result = false;
    if (!empty(lineItemCtnr)) {
        const paymentInstruments = lineItemCtnr.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            while (paymentInstrumentsIt.hasNext()) {
                var paymentInstrument = paymentInstrumentsIt.next();
                if (paymentInstrument.getPaymentMethod().equalsIgnoreCase(gcPaymentMethodId)) {
                    result = true;
                    break;
                }
            }
        }
    }
    return result;
}

/**
* This method returns the gift card data from order object
*
* @param {dw.order.Order} lineItemCtnr - currentBasket
* @returns {Object} returns json object
*/
function giftCardOrderData(lineItemCtnr) {
    var gcPaymentInstruments = null;
    var GCRedeemedAmount = null;
    const currencyCode = lineItemCtnr.getCurrencyCode();
    var remainingBalance = getRemainingBalance(lineItemCtnr);
    var nonGCPaymentInstrumentsBalance = remainingBalance ? StringUtils.formatMoney(new Money(remainingBalance, lineItemCtnr.getCurrencyCode())) : '$0.00';
    if (!empty(lineItemCtnr)) {
        gcPaymentInstruments = this.getGcPaymentInstruments(lineItemCtnr);
    }
    GCRedeemedAmount = this.getGcRedeemedAmount(lineItemCtnr) ? StringUtils.formatMoney(new Money(this.getGcRedeemedAmount(lineItemCtnr), currencyCode)) : '$0.00';

    return {
        gcPaymentInstruments: gcPaymentInstruments,
        getGcRedeemedAmount: GCRedeemedAmount,
        getRemaingBalance: nonGCPaymentInstrumentsBalance
    };
}

/**
 * Get Giftcard bage in shipment selection
 * @param {Object} basket DW basket object
 * @returns {Object} shipmentBadges returns list of shipment badge
 */
function getGCShipmentBadge(basket) {
    var shipmentBadges;
    if (getEGiftCardLineItems(basket).length > 0) {
        shipmentBadges = getEGiftCardLineItems(basket)[0].product.name;
    }
    return shipmentBadges;
}

/**
 * Authorizes payments using multiple gift card..
 * @param {dw.order} order - The current order
 * @return {Object} returns an status object
 */
function authorizeGiftCards(order) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var HashMap = require('dw/util/HashMap');
    var dwOrder = require('dw/order/Order');
    const firstDataHelper = require('*/cartridge/scripts/firstDataHelper');
    var result = {
        error: true,
        errorMessage: Resource.msg('firstData.service.response.code.default.2', 'firstData', 'Something went wrong!')
    };
    var Order = order;
    try {
        // Get the List Of Applied Gift card Payment instrument Info
        var appliedGCList = getAppliedGiftCards(Order, false);
        if (!(appliedGCList.length > 0)) {
            return result;
        }
        // Initialize gcCardAmountMap to hold Card no. and Amount in Key value Pair
        var gcCardAmountMap = new HashMap();
        for (var i = 0; i < appliedGCList.length; i++) {
            var appliedGC = appliedGCList[i];
            gcCardAmountMap.put(appliedGC.gcNumber, appliedGC.amount);
        }

        // Check Balance call before making Auth
        var gcBalanceResponse = firstDataHelper.checkGiftCardsBalance(appliedGCList);

        /** Check if the returned giftcards list is same as sent in request to validate balance. If there is any error in any of the card then redirect user
         *  to payment page to update the payment.
         *  If any of the card is having low balance then the transaction amount, we will return the result as false and redirect the user to Payment
         *  to update payment details.
         */
        if (gcBalanceResponse.success && gcBalanceResponse.giftCardsData.length > 0 && gcBalanceResponse.giftCardsData.length === appliedGCList.length) {
            for (var n = 0; n < gcBalanceResponse.giftCardsData.length; n++) {
                var gcCardNo = gcBalanceResponse.giftCardsData[n].cardNumber;
                var gcAmount = gcCardAmountMap.get(gcCardNo);
                var gcResponseBalance = gcBalanceResponse.giftCardsData[n].currentBalance ? parseFloat((gcBalanceResponse.giftCardsData[n].currentBalance) || 0, 10).toFixed(2) : null;
                if (gcResponseBalance == null || gcResponseBalance < gcAmount || (gcResponseBalance === gcAmount && gcAmount === 0)) {
                    return result;
                }
            }
        } else {
            return result;
        }

        // If Check Balance is success for all GCs then make Auth Call
        var authResult = firstDataHelper.authorizeGiftCards(appliedGCList, order.orderNo, order.customerEmail);
        if (!authResult.success) {
            return result;
        }
        // Save the Transaction no. to the Payment Instrument
        if (authResult.success && authResult.giftCardsData.length > 0) {
            Transaction.wrap(function () {
                var giftCardsData = authResult.giftCardsData;
                var giftCardPaymentInstruments = Order.getPaymentInstruments(gcPaymentMethodId);
                var gcPaymentInstrumentsIt = giftCardPaymentInstruments.iterator();

                while (gcPaymentInstrumentsIt.hasNext()) {
                    var gcInstrument = gcPaymentInstrumentsIt.next();
                    var paymentProcessor = PaymentMgr.getPaymentMethod(gcInstrument.getPaymentMethod()).getPaymentProcessor();
                    var giftCardData = giftCardsData.filter(function (giftCard) { // eslint-disable-line no-loop-func
                        return gcInstrument.custom.gcNumber === giftCard.cardNumber;
                    });
                    var paymentTransaction = gcInstrument.paymentTransaction;
                    paymentTransaction.transactionID = giftCardData.length > 0 ? giftCardData[0].transactionNumber : '';
                    paymentTransaction.paymentProcessor = paymentProcessor;
                }
                // eslint-disable-next-line no-undef
                Order.custom.customerLocale = request.locale;
                // eslint-disable-next-line no-undef
                Order.custom.customerCountry = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
                Order.setPaymentStatus(dwOrder.PAYMENT_STATUS_PAID);
            });
        } else {
            // Return the result with error true so that it should execute Auth Cancel
            return result;
        }
        // In the edge case if suppose any of the card is not authorized return error and reverse the auth.
        if (authResult.giftCardsData.length > 0 && authResult.giftCardsData.length < appliedGCList.length) {
            return result;
        }
        return authResult;
    } catch (e) {
        Logger.error('Error while gift cards authorization. :: {0}', e.message);
        return result;
    }
}
//eslint-disable-next-line
/**
 * Validating the egift card Delivery Date return true when gcDate is more than current Date..
 * params {eGiftCardDeliveryDate} provide the gcDate
 * @return {Object} returns an status object
 */
function eGiftCardDateValidatation(eGiftCardDeliveryDate) {
    // fetching the current Date
    var currentYear = new Date().getFullYear();
    var currentDay = new Date().getDate();
    if (currentDay < 10) {
        currentDay = '0' + currentDay;
    }
    var currentMonth = new Date().getMonth() + 1;
    if (currentMonth < 10) {
        currentMonth = '0' + currentMonth;
    }
    var currentDate = new Date(currentMonth + '/' + currentDay + '/' + currentYear);
    // fetching the GiftCard Date
    var eGiftCardDate = new Date(eGiftCardDeliveryDate);

    var validate = false;
    if (eGiftCardDate >= currentDate) {
        validate = true;
    }
    return validate;
}

// eslint-disable-next-line
/**
 *  Assigning the values to eGC form from wishlistItems..
 * @params {eGiftCardsForm} - egift form to hold the egc values
 * @params {uuidToRemove} - product UUID
 * @params {wishlistItems} - items in the wishlist to copy
 * @return {Object} returns an status object
 */
function eGCDataToeGiftForm(wishlistItems, eGiftCardsForm) {
    var lineItem = wishlistItems;
    if (!empty(lineItem) && !empty(eGiftCardsForm)) {
        eGiftCardsForm.egiftcard.gcRecipientName.setValue(lineItem.custom.gcRecipientName);
        eGiftCardsForm.egiftcard.gcRecipientEmail.setValue(lineItem.custom.gcRecipientEmail);
        eGiftCardsForm.egiftcard.gcFrom.setValue(lineItem.custom.gcFrom);
        eGiftCardsForm.egiftcard.gcDeliveryDate.setValue(new Date(lineItem.custom.gcDeliveryDate));
        eGiftCardsForm.egiftcard.gcMessage.setValue(lineItem.custom.gcMessage);
        eGiftCardsForm.egiftcard.gcAmount.setValue(parseFloat(lineItem.custom.gcAmount || 0).toFixed(2));
    } else {
        eGiftCardsForm.clear();
    }
    return eGiftCardsForm;
}
// eslint-disable-next-line
/**
 * Assigning the values to eGC form from wishlistItems.
 * @params {list} - EGC details in list to be copy into wishlist
 * @params {wishlistModel} - wishlistModel to copy the data from list
 * @return {Object} returns an eGC details into WL
 */
function copyeGiftCardFromListToWishlist(list, wishlistModel) {
    for (var n = 0; n < list.items.length; n++) {
        if (!empty(list.items[n].product) && 'giftCard' in list.items[n].product.custom && !empty(list.items[n].product.custom.giftCard.value) && list.items[n].product.custom.giftCard.value === 'EGIFT_CARD') { // eslint-disable-next-line
            wishlistModel.items[n].custom.gcRecipientName = list.items[n].custom.gcRecipientName || ''; // eslint-disable-next-line
            wishlistModel.items[n].custom.gcRecipientEmail = list.items[n].custom.gcRecipientEmail || ''; // eslint-disable-next-line
            wishlistModel.items[n].custom.gcFrom = list.items[n].custom.gcFrom || ''; // eslint-disable-next-line
            wishlistModel.items[n].custom.gcDeliveryDate = list.items[n].custom.gcDeliveryDate || ''; // eslint-disable-next-line
            wishlistModel.items[n].custom.gcMessage = list.items[n].custom.gcMessage || ''; // eslint-disable-next-line
            wishlistModel.items[n].custom.gcAmount = list.items[n].custom.gcAmount || ''; // eslint-disable-next-line
            wishlistModel.items[n].custom.gcValidDate = eGiftCardDateValidatation(wishlistModel.items[n].custom.gcDeliveryDate);
        }
    }
}
//eslint-disable-next-line
/**
 * @param {dw.order.Basket} currentBasket - currentBasket
 * @returns {Object} - returns GC Object
 */
function orderTotalGCCouponAmount(currentBasket) {
    var gcObj = {};
    gcObj.nonGCPaymentRemainingBalance = 0;
    gcObj.gcAmount = 0;
    gcObj.gcUUID = [];
    if (!empty(currentBasket)) {
        this.updatePaymentTransaction(currentBasket, true);
        var paymentInstruments = currentBasket.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            while (paymentInstrumentsIt.hasNext()) {
                var paymentInstrument = paymentInstrumentsIt.next();
                if (paymentInstrument.getPaymentMethod().equalsIgnoreCase('GIFT_CARD')) {
                    gcObj.gcAmount += paymentInstrument.paymentTransaction.amount.value;
                    var gcLastFourDigits = paymentInstrument.custom.gcNumber ? (paymentInstrument.custom.gcNumber).substr(-4) : '';
                    if (gcLastFourDigits) {
                        gcObj.gcUUID.push({
                            gcLastFourDigits: gcLastFourDigits,
                            paymentInstrumentUUID: paymentInstrument.UUID
                        });
                    }
                }
            }
        }
        gcObj.nonGCPaymentRemainingBalance = currentBasket.getTotalGrossPrice().value - gcObj.gcAmount;
        gcObj.nonGCPaymentRemainingBalance = StringUtils.formatMoney(new Money(gcObj.nonGCPaymentRemainingBalance, currentBasket.getCurrencyCode()));
        gcObj.orderTotalRedeemed = this.isOrderTotalRedeemed(currentBasket);
        gcObj.gcAmount = StringUtils.formatMoney(new Money(gcObj.gcAmount, currentBasket.getCurrencyCode()));
    }
    return gcObj;
}

module.exports = {
    gcPaymentMethodId: gcPaymentMethodId,
    applyGiftCard: applyGiftCard,
    isOrderTotalRedeemed: isOrderTotalRedeemed,
    getGcRedeemedAmount: getGcRedeemedAmount,
    handleGiftCardPayment: handleGiftCardPayment,
    getGcPaymentInstruments: getGcPaymentInstruments,
    removeNonGcPaymentInstruments: removeNonGcPaymentInstruments,
    basketHasOnlyEGiftCards: basketHasOnlyEGiftCards,
    basketHasEGiftCards: basketHasEGiftCards,
    updateGiftCardShipments: updateGiftCardShipments,
    removeEmptyShipments: removeEmptyShipments,
    removeGcPaymentInstrument: removeGcPaymentInstrument,
    updateEGiftCardData: updateEGiftCardData,
    getEGiftCardAmountRange: getEGiftCardAmountRange,
    giftCardFormData: giftCardFormData,
    updatePaymentTransaction: updatePaymentTransaction,
    getTotalGiftCardsItems: getTotalGiftCardsItems,
    basketHasGiftCard: basketHasGiftCard,
    getAppliedGiftCards: getAppliedGiftCards,
    basketHasGCPaymentInstrument: basketHasGCPaymentInstrument,
    giftCardOrderData: giftCardOrderData,
    removeGcPaymentInstruments: removeGcPaymentInstruments,
    getEGiftCardLineItems: getEGiftCardLineItems,
    getGCShipmentBadge: getGCShipmentBadge,
    authorizeGiftCards: authorizeGiftCards,
    getRemainingBalance: getRemainingBalance,
    eGiftCardDateValidatation: eGiftCardDateValidatation,
    eGCDataToeGiftForm: eGCDataToeGiftForm,
    copyeGiftCardFromListToWishlist: copyeGiftCardFromListToWishlist,
    basketHasGiftCardItems: basketHasGiftCardItems,
    orderTotalGCCouponAmount: orderTotalGCCouponAmount
};

