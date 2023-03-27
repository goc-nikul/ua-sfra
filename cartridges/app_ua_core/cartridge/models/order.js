/* eslint-disable spellcheck/spell-checker */
'use strict';
var base = module.superModule;

/**
 * Order class that represents the current order
 * @param {Date} date - Order creation date
 * @returns {string} date - Date in string format
 *
 */
function getEtcDate(date) {
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var System = require('dw/system/System');
    if (date) {
        var currentCalendar = new Calendar(date);
        currentCalendar.setTimeZone(System.getInstanceTimeZone());
        return StringUtils.formatCalendar(currentCalendar, 'MMMM dd, yyyy, hh:mm aa z').replace('am', 'AM').replace('pm', 'PM');
    }
    return date;
}

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    const Site = require('dw/system/Site');
    const giftCardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    var cartHelpers = require('*/cartridge/scripts/cart/cartHelpers');
    const currentSite = require('dw/system/Site').getCurrent();
    const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
    const StringUtils = require('dw/util/StringUtils');
    const Money = require('dw/value/Money');
    var isUACAPIActive = currentSite.getCustomPreferenceValue('orderHistoryDetailsProvider') && currentSite.getCustomPreferenceValue('orderHistoryDetailsProvider').value === 'UACAPI';
    // DEBUG: For UA only, if config includes numberOfLineItems: 'single',
    // this triggers an error when viewing My Account profile page. (PHX-2021)
    // Thus, remove numberOfLineItems from the config if it is set to 'single'.
    if (options.config && options.config.numberOfLineItems === 'single') {
        var configOptions = options; // Assigning to local variable to fix the lint error
        delete configOptions.config.numberOfLineItems;
    }
    base.call(this, lineItemContainer, options);
    if (!lineItemContainer) {
        this.formatedCreationDate = null;
        this.currencyCode = null;
        this.vertexTaxCalculated = false;
    } else {
        var creationDate = Object.hasOwnProperty.call(lineItemContainer, 'creationDate')
        ? lineItemContainer.creationDate
        : null;
        this.formatedCreationDate = getEtcDate(creationDate);
        this.customerEmail = lineItemContainer.customerEmail;
        this.currencyCode = lineItemContainer.getCurrencyCode();
        this.vertexTaxCalculated = ('custom' in lineItemContainer && 'vertex_Taxation_Details' in lineItemContainer.custom && !empty(lineItemContainer.custom.vertex_Taxation_Details)) || false;
        var safeOptions = options || {};
        this.usingMultiShipping = (safeOptions.usingMultiShipping);
        var Resource = require('dw/web/Resource');
        this.resources.salesTax = Resource.msg('label.sales.tax', 'cart', null);
        this.resources.shippingCost = Resource.msg('label.shipping.cost', 'cart', null);
        this.resources.estimatedTax = Resource.msg('label.estimated.sales.tax', 'cart', null);
        this.resources.estimatedTotal = Resource.msg('label.estimatedtotal', 'cart', null);
        this.resources.estimatedShipping = Resource.msg('label.estimatedShipping.cost', 'cart', null);
        this.resources.total = Resource.msg('label.total', 'cart', null);
        this.resources.promoResourceMessage = Resource.msg('placholder.text.promo.code.input', 'cart', null);
        this.resources.multiplePromoResourceMessage = Resource.msg('placholder.text.promo.codes.input', 'cart', null);
        this.resources.productDiscount = Resource.msg('label.genericDiscount', 'common', null);
        var basketHasGiftCardItems = giftCardHelper.basketHasGiftCardItems(lineItemContainer);
        this.hasEGiftCards = basketHasGiftCardItems.eGiftCards;
        this.hasGiftCards = basketHasGiftCardItems.giftCards;
        this.hasOnlyEGiftCards = basketHasGiftCardItems.onlyEGiftCards;
        this.estimatedLoyaltyPoints = ('custom' in lineItemContainer && 'estimatedLoyaltyPoints' in lineItemContainer.custom && lineItemContainer.custom.estimatedLoyaltyPoints > 0) ? lineItemContainer.custom.estimatedLoyaltyPoints : 0;
        var currentCustomer = lineItemContainer.customer;
        var gcpaymentInstruments = lineItemContainer.getPaymentInstruments('GIFT_CARD');
        var isPartialVipPointsApplied = false;
        var vipDataHelpers;
        var isVipUser = false;
        var vipRenderedTemplate;
        var isEmployee = currentCustomer && !empty(currentCustomer.profile) && 'isEmployee' in currentCustomer.profile.custom && currentCustomer.profile.custom.isEmployee;
        this.isEmployee = isEmployee;
        if (currentSite.getCustomPreferenceValue('enableVIPCheckoutExperience')) {
            vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
            this.isVIPOrder = vipDataHelpers.isVIPOrder(lineItemContainer);
            this.vipPoints = vipDataHelpers.getVipPoints(lineItemContainer);
            isVipUser = currentCustomer && !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);
            this.isVipUser = isVipUser;
            this.enableGiftCardPaymentForVIP = currentSite.getCustomPreferenceValue('enableGiftCardPaymentForVIP');
            if (currentSite.getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
                isPartialVipPointsApplied = vipDataHelpers.isPartialVipPointsApplied(lineItemContainer);
            }
            if (this.vipPoints) {
                vipRenderedTemplate = (this.vipPoints && vipDataHelpers.getVipRenderingTemplate(this.vipPoints)) || null;
            }
        }
        this.vipRenderedTemplate = vipRenderedTemplate;
        if (gcpaymentInstruments && gcpaymentInstruments.length > 0) {
            var remainingBalance = giftCardHelper.getRemainingBalance(lineItemContainer);
            if (this.totals) {
                this.totals.grandTotal = remainingBalance ? StringUtils.formatMoney(new Money(remainingBalance, lineItemContainer.getCurrencyCode())) : '$0.00';
            }
        } else if (vipDataHelpers && isPartialVipPointsApplied) {
            let partialVipPoint = vipDataHelpers.calculatePartialVipAmount(lineItemContainer);
            var orderTotalPrice = lineItemContainer.totalGrossPrice;
            if (this.totals) {
                this.totals.grandTotal = StringUtils.formatMoney(orderTotalPrice.subtract(new Money(partialVipPoint, lineItemContainer.getCurrencyCode())));
            }
        }
        if (!empty(this.shipping) && this.shipping.length > 0 && !empty(this.shipping[0].shippingAddress) && customer.authenticated && !empty(customer.profile) && customer.profile.custom.isEmployee === true) {
            this.shipping[0].shippingAddress.isOfficeAddress = lineItemContainer.defaultShipment.shippingAddress.custom.isOfficeAddress;
            this.isOfficeAddress = lineItemContainer.defaultShipment.shippingAddress.custom.isOfficeAddress;
        }
        if ('isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled')) {
            const inStorePickUpHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
            this.hasBopisItems = inStorePickUpHelpers.basketHasInStorePickUpShipment(lineItemContainer.shipments);
            this.hasOnlyBopisItems = inStorePickUpHelpers.basketHasOnlyBOPISProducts(lineItemContainer.shipments);
            var countResult = inStorePickUpHelpers.getCountOfBopisItems(lineItemContainer);
            this.numberOfBopisItems = countResult.numberOfBopisItems;
            this.numberOfNonBopisItems = countResult.numberOfNonBopisItems;
        }
        if (isMAOEnabled && isUACAPIActive) {
            var OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
            this.cancelReasons = OrderHelpers.getCancelReasons();
        }
        if (this.totals && !empty(this.totals.saveTotal)) {
            this.showSavingExperience = cartHelpers.savedExperience(this.totals.saveTotal.value);
        }
    }
}

module.exports = OrderModel;
