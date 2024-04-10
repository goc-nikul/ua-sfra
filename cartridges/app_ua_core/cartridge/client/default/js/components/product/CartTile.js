'use strict';

import Product from './Product';
import util from '../../util';
import ToastMessage from 'org/components/common/ToastMessage';

var promotionSummary = require('../../checkout/promotionSummary');
var freeShippingBar = require('org/components/cart/FreeShippingBar');

export default class CartTile extends Product {
    init() {
        super.init();

        this.selectors = Object.assign({}, this.selectors, {
            removeProduct: '.remove-product-item',
            eGiftCardForm: 'form.e-giftcard',
            cartRemoveCouponButton: '.js-delete-coupon-confirmation-btn'
        });

        this.initEditeGiftCardFromSaved();
        this.eventDelegate('change', '.b-quantity > .js-quantity-select', this.onQuantityChangeFromProductLineSection.bind(this));
        this.eventDelegate('click', '.js-remove-saveforlater', this.onRemoveSaveLater.bind(this));
        this.eventDelegate('click', '.js-add-saveforlater', this.onAddToCart.bind(this));
        this.initAddClassForCart();
        this.event('submit', this.onPromoSubmitResponse.bind(this));
        this.eventDelegate('click', '.js-checkout-button', this.onCartOutOfStockCheck.bind(this));
        this.eventDelegate('click', '.js-cart-buttons', this.onCartActionsButtons.bind(this));
        this.initLoyaltyEvents();
        this.eventDelegate('click', this.selectors.cartRemoveCouponButton, this.onCouponRemove.bind(this));
        this.event('click', this.onDisplayPromoCodeFormBtn.bind(this), $('.display-promo-code-form-btn'));

        if (this.$el.hasClass('cart-display-listener')) {
            this.event('cart:updateCartTotals', this.updateCartTotalsListener.bind(this), this.$body);
            this.event('cart:updateAvailability', this.updateAvailabilityListener.bind(this), this.$body);
            this.event('cart:validateBasket', this.validateBasketListener.bind(this), this.$body);
        }

        this.event('update:animateShippingProgressBar', this.animateShippingProgressBar, this.$body);
        this.animateShippingProgressBar();

        var closeBranch = setInterval(function () {
            util.branchCloseJourney();
        }, 2000);
        setTimeout(function () { clearInterval(closeBranch); }, 8000);
    }

    initAddClassForCart() {
        if ($('.nonEmptyCart').length) {
            $('#bodyPage').addClass('adjustIosFooter');
            var iOSDevices = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
            if ((window.dw && window.dw.applepay && window.dw.applepay.inject && window.dw.applepay.inject.directives) && iOSDevices) {
                window.dw.applepay.inject.directives.forEach(function (applePay) {
                    if (applePay.query === 'button[name=dwfrm_cart_checkoutCart]') {
                        $('#bodyPage').addClass('ios-footer-adjustments');
                    }
                });
            }
        }
    }

    initLoyaltyEvents() {
        $('body').on('loyalty:minihub:redeemReward', (e) => {
            this.loyaltyRedeemReward(e.evData);
        });
        $('body').on('loyalty:minihub:removeReward', (e) => {
            this.loyaltyRemoveReward(e.evData);
        });
    }

    initPromoCodeForm() {
        if (sessionStorage.getItem('show-promo-code-form')) {
            $('.display-promo-code-form-btn').addClass('hidden');
            $('.b-promo_code').removeClass('hidden');
        }
    }

    loyaltyRedeemReward(data) {
        if (data.res.cartModel) {
            this.updateCartTotals(data.res.cartModel);
            this.updateCouponHTML(data.res.cartModel);
            setTimeout(function () {
                $('body').trigger('components:init');
            }, 500);
            if (data.reload) {
                $('#minihubmodal').spinner().start();
                window.location.reload();
            }
        }
    }

    loyaltyRemoveReward(data) {
        if (data.res.cartModel) {
            this.updateCartTotals(data.res.cartModel);
            this.updateCouponHTML(data.res.cartModel);
            setTimeout(function () {
                $('body').trigger('components:init');
            }, 500);
            if (data.reload) {
                $('#minihubmodal').spinner().start();
                window.location.reload();
            }
        }
    }

    updateCartTotalsListener(event, data) {
        this.updateCartTotals(data);
        this.updateApproachingDiscounts(data.approachingDiscounts);
        freeShippingBar.methods.updateShippingBar(data.freeShippingBar);
        if (data.totals) {
            freeShippingBar.methods.getShippingPromo(data.totals);
        }
    }

    updateCouponHTML(data) {
        $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
        // eslint-disable-next-line spellcheck/spell-checker
        $('.idme-content').empty().append(data.totals.idmePromosHtml);
    }

    initEditeGiftCardFromSaved() {
        this.eventDelegate('click', '.js-edit-saveforlater', this.onEditFromSaveLater.bind(this));
    }

    updateAvailabilityListener(event, data) {
        this.updateAvailability(data);
    }

    validateBasketListener(event, data) {
        this.validateBasket(data);
    }

    onQuantityChangeFromProductLineSection(event) {
        var $target = $(event.target);
        var quantity = $target.val();
        var productID = $target.data('pid');
        var url = $target.data('action');
        var uuid = $target.data('uuid');
        var self = this;
        var urlParams = {
            pid: productID,
            quantity: quantity,
            uuid: uuid
        };
        url = util.appendParamsToUrl(url, urlParams);

        $target.parents('.card').spinner().start();

        $.ajax({
            url: url,
            type: 'get',
            context: this,
            dataType: 'json',
            success: function (data) {
                var $updatedQuantity = $('.js-quantity-' + uuid);
                $('.js-quantity-select[data-uuid="' + uuid + '"]').val(quantity);

                if (data && data.errorEstimateMsg) {
                    new ToastMessage(data.errorEstimateMsg, {
                        duration: 3000,
                        type: 'error'
                    }).show();
                }

                $updatedQuantity.empty().html(quantity);
                $updatedQuantity.parent().addClass('hide');
                if (quantity > 1) {
                    $updatedQuantity.parent().removeClass('hide');
                }

                if (data.totals) {
                    $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                }

                this.updateCartTotals(data);
                this.updateApproachingDiscounts(data.approachingDiscounts);
                freeShippingBar.methods.updateShippingBar(data.freeShippingBar);
                this.updateAvailability(data, uuid);
                this.validateBasket(data);

                if (data.totals) {
                    freeShippingBar.methods.getShippingPromo(data.totals);
                }

                setTimeout(function () {
                    $('body').trigger('components:init');
                }, 500);

                $target.data('pre-select-qty', quantity);

                if (data.items) {
                    data.items.forEach(function (item) {
                        const $availabilitySection = $('.availability-' + item.uuid);
                        if (item.bonusProductLineItemUUID === 'bonus') {
                            $target.parents('.card-product-info').addClass('bonus-product-line-item');
                        }
                        $availabilitySection.empty();
                    });
                }
                $.spinner().stop();
                $('body').trigger('cart:afterQtyChange', {
                    productUUID: uuid,
                    productID: productID,
                    basket: data
                });
                $('body').trigger('cart:update');
                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                }
                if ($target.parents('.card-product-info').hasClass('bonus-product-line-item') && $('.b-cart-content_left').length) {
                    location.reload();
                }
            }.bind(this),
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    if (err.responseJSON && err.responseJSON.inventoryError && err.responseJSON.inventoryError.length > 0) {
                        err.responseJSON.inventoryError.forEach(function (errorObj) {
                            const $availabilitySection = $('.availability-' + errorObj.uuid);
                            $availabilitySection.empty();
                            if (errorObj.error) {
                                $availabilitySection.empty().html(self.generateAvailabilityHtml(errorObj));
                            }
                        });
                    }
                    $.spinner().stop();
                    window.location.href = err.responseJSON.redirectUrl;
                }
            }
        });
    }

    /**
     * re-renders the order totals and the number of items in the cart
     * @param {Object} data - AJAX response from the server
     */
    updateCartTotals(data) {
        super.updateCartTotals(data);

        if (data.items) {
            data.items.forEach(function (item) {
                if (item.renderedPromotions) {
                    $('.item-' + item.UUID).empty().append(item.renderedPromotions);
                } else {
                    $('.item-' + item.UUID).empty();
                }
                if (item.priceTotal && item.priceTotal.renderedPrice) {
                    $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
                }
                if (typeof item.bfPriceTotal !== 'undefined' && item.bfPriceTotal.adjustedUnitPrice !== null && item.bfPriceTotal.adjustedUnitPrice !== '') {
                    $('cart-item-list-' + item.UUID).empty().append(item.bfPriceTotal.adjustedUnitPrice);
                } else {
                    $('.cart-item-list-' + item.UUID).empty().append(item.price.sales.formatted);
                }
            });
        }
        if (data.totals && data.totals.klarnaTotal) {
            $('klarna-placement').attr('data-purchase-amount', data.totals.klarnaTotal);
            window.KlarnaOnsiteService = window.KlarnaOnsiteService || [];
            window.KlarnaOnsiteService.push({ eventName: 'refresh-placements' });
        }
        if (data && data.nonGCPaymentRemainingBalance) {
            $('.order-summary_remaing_amount.active .order-remaing_amount').html(data.nonGCPaymentRemainingBalance);
        }
        if ($('.js-giftcard-form').length > 0) {
            var giftCardFormInstance = $('.js-giftcard-form').data().cmpInstance;
            giftCardFormInstance.handleGiftCardSectionDisplay(data);
        }

        promotionSummary.updatePromotionInformation(data);
    }

    /**
     * re-renders the approaching discount messages
     * @param {Object} approachingDiscounts - updated approaching discounts for the cart
     */
    updateApproachingDiscounts(approachingDiscounts) {
        var html = '';
        var promoHash = {};
        $('.approaching-discounts:last').find('.b-header_progress-bar').each(function () {
            promoHash[$(this).find('.approchingPromotionID').val()] = $(this).find('.meter span').attr('data-promo-width');
        });
        $('.approaching-discounts').empty();
        if (approachingDiscounts && approachingDiscounts.length > 0) {
            approachingDiscounts.forEach(function (item) {
                if (item.progressBarEnabled) {
                    html += '<div class="b-header_progress-bar">';
                    html += `<h4 class="${item.approachingPromoPercentage === '100' ? 't-order_greentick' : 't-orderamount'}"><span></span>${item.discountMsg}</h4>`;
                    html += `<div class="meter nostripes ${item.approachingPromoPercentage === '100' ? 'green' : 'black'}">`;
                    html += `<span style="width: ${promoHash[item.promotionID] ? promoHash[item.promotionID] : '0%' }" data-promo-width="${item.approachingPromoPercentage + '%'}" data-previous-promo-width="${promoHash[item.promotionID] ? promoHash[item.promotionID] : '0%' }"></span>`;
                    html += '</div>';
                    html += `<input class="approchingPromotionID" type="hidden" value="${item.promotionID}"/>`;
                    html += '</div>';
                } else {
                    html += `<div class="single-approaching-discount text-center">${item.discountMsg}</div>`;
                }
            });
        }
        $('.approaching-discounts').append(html);
        $('.approaching-discounts').trigger('update:progressBar');
    }

    animateShippingProgressBar() {
        $('.shipping-bar-container').find('.meter > span').each(function () {
            if ($(this).attr('data-previous-bar-width') !== $(this).attr('data-bar-width')) {
                var previousPromoWidth = $(this).attr('data-previous-bar-width');
                var currentPromoWidth = $(this).attr('data-bar-width');
                $(this).width(previousPromoWidth).animate({
                    width: currentPromoWidth
                }, 1200);
                $(this).attr('data-previous-bar-width', currentPromoWidth);
            }
        });
    }

    /**
     * Checks whether the basket is valid. if invalid displays error message and disables
     * checkout button
     * @param {Object} data - AJAX response from the server
     */
    validateBasket(data) {
        if (data.valid && data.valid.error) {
            if (data.valid.message) {
                var errorHtml = `<div class="b-header_minicart-item-check">
                <p class="b-header_minicart-check-icon cart-icon"></p>
                <p class="line-item-attributes">${data.valid.message}</p></div>`;

                $('.valid-cart-error-msg').empty();
                $('.valid-cart-error-msg').append(errorHtml);
            } else if (data.valid.message === 'vip error') {
                $('.checkout-btn').addClass('disabled');
                $('.js_paypal_button').addClass('hide');
            } else {
                $('.b-cart-content').empty().append(`<div class="row">
                    <div class="col-12 text-center">
                    <h1>${data.resources.emptyCartMsg}</h1>
                    </div>
                    </div>`
                );
                $('.number-of-items').empty().append('(' + data.resources.numberOfItems + ')');
                $('.minicart-quantity').empty().append(data.numItems);
                $('.minicart-link').attr({
                    'aria-label': data.resources.minicartCountOfItems,
                    title: data.resources.minicartCountOfItems
                });
                $('.minicart .b-header_minicart-container').empty();
                $('.minicart .b-header_minicart-container').removeClass('show');
                $('.minicart .b-header_minicart-modal-backdrop').removeClass('show');
            }
        } else {
            $('.checkout-btn').removeClass('disabled');
            if (data.hasEGiftCards || data.hasPreOrder) {
                $('.js_paypal_button').addClass('hide');
            } else {
                $('.js_paypal_button').removeClass('hide');
            }
        }
    }

    generateAvailabilityHtml(data) {
        var availabilityMessages = [];
        var availabilityValue = '';
        if (data.messages) {
            availabilityMessages = data.messages;
        }
        availabilityValue = '<div class="b-header_minicart-item-check"><p class="b-header_minicart-check-icon"></p><div class="line-item-attributes">';
        availabilityMessages.forEach((message) => {
            availabilityValue += `<div>${message}</div>`;
        });
        availabilityValue += '</div></div>';
        return availabilityValue;
    }

    onAppendToUrl(url, params) {
        var newUrl = url;
        newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
            return key + '=' + encodeURIComponent(params[key]);
        }).join('&');

        return newUrl;
    }

    updateGcRemoveUUID(data) {
        data.forEach((gcInfo) => {
            $('.js-giftcard_' + gcInfo.gcLastFourDigits).find('.remove-link').attr('data-uuid', gcInfo.paymentInstrumentUUID);
        });
    }

    onCouponRemove(event) {
        event.preventDefault();
        var url = this.$el.find(this.selectors.cartRemoveCouponButton).data('action');
        var uuid = this.$el.find(this.selectors.cartRemoveCouponButton).data('uuid'); // eslint-disable-line
        var couponCode = this.$el.find(this.selectors.cartRemoveCouponButton).data('code'); // eslint-disable-line
        var urlParams = {
            code: couponCode,
            uuid: uuid
        };

        url = this.onAppendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            context: this,
            success: function (data) {
                if (data && data.errorEstimateMsg) {
                    new ToastMessage(data.errorEstimateMsg, {
                        duration: 3000,
                        type: 'error'
                    }).show();
                }

                $('.coupon-uuid-' + uuid).remove();
                // eslint-disable-next-line spellcheck/spell-checker
                $('.idme-content').empty().append(data.totals.idmePromosHtml);
                this.updateCartTotals(data);
                this.updateApproachingDiscounts(data.approachingDiscounts);
                freeShippingBar.methods.updateShippingBar(data.freeShippingBar);
                this.validateBasket(data);
                freeShippingBar.methods.getShippingPromo(data.totals);

                if (!data.orderTotalRedeemed && $('#checkout-main').attr('data-checkout-stage') === 'payment') {
                    $('.payment-information .g-tabs-chip .nav-link:first').trigger('click');
                    if ($(window).width() < 1024) {
                        $('.b-payment-tab_content .tab-pane:first .b-payment-accordion-head').trigger('click');
                        $('.g-accordion-item.g-tabs-pane.tab-pane.active').each(function () {
                            $(this).children('.b-payment-accordion-head').removeClass('collapsed');
                            $(this).children('.b-payment-accordion-head').attr('aria-expanded', true);
                            $(this).children('.g-accordion-content').addClass('show');
                        });
                    }
                    $('.b-payment-tab').removeClass('hide');
                    $('.b-payment-heading').removeClass('hide');
                    $('.payment-information').removeClass('gc-pay');
                }
                if ($('.b-giftcard_applied_card').length) {
                    this.updateGcRemoveUUID(data.gcUUID);
                }
                $('body').removeClass('modal-open');
                $('body').trigger('cart:couponRemoved', {
                    basket: data
                });
                $('body').trigger('checkout:updateCheckoutView',
                    {
                        order: data.order,
                        customer: data.customer,
                        options: { keepOpen: true }
                    }
                );
                $('.coupon-code-field').removeClass('is-invalid');
                $('.b-input_row-error_message').empty();
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    this.createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    }

    onPromoSubmitResponse(event) {
        event.preventDefault();
        $.spinner().start();
        $('.coupon-missing-error').hide();
        $('.coupon-error-message').empty();
        if (!$('.coupon-code-field').val()) {
            $('.js-promo-code-form .form-control').addClass('m-error');
            $('.js-promo-code-form .form-control').closest('.b-input_row').addClass('m-error');
            $('.js-promo-code-form .form-control').attr('aria-describedby', 'missingCouponCode');
            $('.coupon-missing-error').show();
            $('.coupon-missing-error').addClass('b-input_row-error_message');
            $.spinner().stop();
            return false;
        }
        var $form = $('.js-promo-code-form');
        $('.js-promo-code-form .form-control').removeClass('is-invalid');
        $('.coupon-error-message').empty();
        $('.js-promo-code-form .form-control').removeClass('m-error');
        $('.js-promo-code-form .form-control').closest('.b-input_row').removeClass('m-error');

        var couponCode = $form.find('[name=couponCode]').val();

        $.ajax({
            url: $form.attr('action'),
            type: 'GET',
            dataType: 'json',
            data: $form.serialize(),
            context: this,
            success: function (data) {
                if (data && data.errorEstimateMsg) {
                    new ToastMessage(data.errorEstimateMsg, {
                        duration: 3000,
                        type: 'error'
                    }).show();
                }

                if (data.error) {
                    $('.js-promo-code-form .form-control').addClass('is-invalid');
                    $('.js-promo-code-form .form-control').attr('aria-describedby', 'invalidCouponCode');
                    $('.coupon-error-message').empty().append(data.errorMessage);
                    $('.coupon-error-message').addClass('b-input_row-error_message');
                    $('body').trigger('cart:afterPromoAttempt', {
                        analytics: data && data.analytics,
                        couponCode: couponCode,
                        errorResponse: data
                    });
                } else {
                    this.updateCouponHTML(data);
                    this.updateCartTotals(data);
                    this.updateApproachingDiscounts(data.approachingDiscounts);
                    freeShippingBar.methods.updateShippingBar(data.freeShippingBar);
                    this.validateBasket(data);
                    setTimeout(function () {
                        $('body').trigger('components:init');
                    }, 500);
                    freeShippingBar.methods.getShippingPromo(data.totals);

                    if (data.orderTotalRedeemed && $('#checkout-main').attr('data-checkout-stage') === 'payment') {
                        $('.credit-card-selection-new .tab-pane').removeClass('active');
                        $('.payment-information .g-tabs-chip.nav-item .nav-link').removeClass('active');
                        $('.b-payment-tab').addClass('hide');
                        $('.b-payment-heading').addClass('hide');
                        $('.payment-information').addClass('gc-pay');
                    } else if (!data.orderTotalRedeemed && $('#checkout-main').attr('data-checkout-stage') === 'payment') {
                        $('.payment-information .g-tabs-chip .nav-link:first').click();
                        if ($(window).width() < 1024) {
                            $('.b-payment-tab_content .tab-pane:first .b-payment-accordion-head').click();
                            $('.g-accordion-item.g-tabs-pane.tab-pane.active').each(function () {
                                $(this).children('.b-payment-accordion-head').removeClass('collapsed');
                                $(this).children('.b-payment-accordion-head').attr('aria-expanded', true);
                                $(this).children('.g-accordion-content').addClass('show');
                            });
                        }
                    }
                    if (!data.couponApplied) {
                        $('.coupon-code-field').addClass('is-invalid');
                    }
                    if ($('.b-giftcard_applied_card').length) {
                        this.updateGcRemoveUUID(data.gcUUID);
                    }
                    $('body').trigger('cart:afterPromoAttempt', {
                        basket: data,
                        analytics: data && data.analytics
                    });
                    $('body').trigger('checkout:updateCheckoutView',
                        {
                            order: data.order,
                            customer: data.customer,
                            options: { keepOpen: true }
                        }
                    );
                }
                $('.coupon-code-field').val('');
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    this.createErrorNotification(err.errorMessage);
                    $.spinner().stop();
                }
            }
        });
        return false;
    }

    /**
     * Retrieves the relevant pid value
     * @param {jquery} $el - DOM container for a given add to cart button
     * @return {string} - value to be used when adding product to cart
     */
    getPidValue($el) {
        var pid;

        if ($('#' + this.targetID).hasClass('show') && !$('.product-set').length) {
            pid = $($el).closest('.modal-content').find('.product-quickview').data('pid');
        } else if ($el.closest('.js-cmp-productQuickView:visible').length > 0 && !$('.product-set').length) {
            pid = $el.closest('.js-cmp-productQuickView:visible').data('pid');
        } else if ($('.product-set-detail').length || $('.product-set').length) {
            pid = $($el).closest('.product-detail').find('.product-id').text();
        } else {
            pid = $('.product-detail:not(".bundle-item")').data('pid');
        }

        return pid;
    }

    /**
     * Updates the availability of a product line item
     * @param {Object} data - AJAX response from the server
     * @param {string} uuid - The uuid of the product line item to update
     */
    updateAvailability(data, uuid) {
        if ((typeof data.items !== 'undefined') && (data.items) && (data.items.length)) {
            const lineItem = data.items.find(productLineItem => productLineItem.UUID === uuid);
            const $availabilitySection = $('.availability-' + lineItem.UUID);

            $availabilitySection.empty();

            if (!lineItem.availability || lineItem.priceTotal.price === 'N/A') {
                $availabilitySection.html(
                    `<p class="line-item-attributes">${$availabilitySection.data('labelnotavailable')}</p>`
                );
            }
        }
    }

    /**
     * Finds an element in the array that matches search parameter
     * @param {array} array - array of items to search
     * @param {function} match - function that takes an element and returns a boolean indicating if the match is made
     * @returns {Object|null} - returns an element of the array that matched the query.
     */
    findItem(array, match) {
        for (var i = 0, l = array.length; i < l; i++) {
            if (match.call(this, array[i])) {
                return array[i];
            }
        }
        return null;
    }

    /**
     * Updates details of a product line item
     * @param {Object} data - AJAX response from the server
     * @param {string} uuid - The uuid of the product line item to update
     */
    updateProductDetails(data, uuid) {
        var lineItem = this.findItem(data.cartModel.items, function (item) {
            return item.UUID === uuid;
        });

        var skuSelector = $('.card.card-product-info.uuid-' + uuid).find('.product-sku');
        var skuText = '';
        if (skuSelector && skuSelector.text() && skuSelector.text().split('-').length > 0) {
            skuText = skuSelector.text().split('-')[0];
        } else {
            skuText = lineItem.id;
        }

        if (lineItem.variationAttributes) {
            var colorAttr = this.findItem(lineItem.variationAttributes, function (attr) {
                return attr.attributeId === 'color';
            });

            if (colorAttr) {
                var colorSelector = '.Color-' + uuid;
                var displayColorWay = '<span>';
                var colorWay = lineItem.custom.colorway;
                if (colorWay) {
                    let colorBuckets = colorWay.split('/').map(function (item) {
                        return item.trim();
                    });
                    if (colorBuckets.length > 1) {
                        displayColorWay += colorBuckets[0];
                        if (colorBuckets[1] !== '' && colorBuckets[0] !== colorBuckets[1]) {
                            displayColorWay += ' / ' + colorBuckets[1];
                        } else if (colorBuckets[2] && colorBuckets[2] !== '' && colorBuckets[2] !== colorBuckets[1]) {
                            displayColorWay += ' / ' + colorBuckets[2];
                        }
                        displayColorWay += '</span>';
                    } else {
                        displayColorWay += colorWay + '</span>';
                    }
                    displayColorWay += '<span> - ' + lineItem.custom.color + '</span>';
                } else {
                    displayColorWay = '<span>' + colorAttr.displayValue + '</span><span> - ' + lineItem.custom.color + '</span>';
                }
                $(colorSelector).html('Color: ' + displayColorWay);
                skuText += '-' + lineItem.custom.color;
            }

            var sizeAttr = this.findItem(lineItem.variationAttributes, function (attr) {
                return attr.attributeId === 'size';
            });

            if (sizeAttr) {
                var sizeSelector = '.' + sizeAttr.displayName + '-' + uuid;
                var newSize = sizeAttr.displayName + ': ' + sizeAttr.displayValue;
                $(sizeSelector).text(newSize);
                skuText += (lineItem.custom && lineItem.custom.size) ? '-' + lineItem.custom.size : '-' + sizeAttr.displayValue;
            }

            var imageSelector = `.card.card-product-info.uuid-${uuid} .line-item-image .line-item-product-image`;
            $(imageSelector).attr('src', lineItem.images.cartFullDesktop[0].url);
            $(imageSelector).attr('alt', lineItem.images.cartFullDesktop[0].alt);
            $(imageSelector).attr('title', lineItem.images.cartFullDesktop[0].title);
        }

        skuSelector.text(skuText);

        if ($('.uuid-' + uuid).hasClass('egiftcardlineitem') && lineItem.custom.gcRecipientName !== null && lineItem.custom.gcRecipientEmail !== null && lineItem.custom.gcFrom !== null && lineItem.custom.gcDeliveryDate !== null) {
            var egiftCardLineitem = $('.uuid-' + uuid + '.egiftcardlineitem');
            $(egiftCardLineitem).find('.gcrecipientname').children('.egiftcard-value').text(lineItem.custom.gcRecipientName);
            $(egiftCardLineitem).find('.gcrecipientemail').children('.egiftcard-value').text(lineItem.custom.gcRecipientEmail);
            $(egiftCardLineitem).find('.gcfrom').children('.egiftcard-value').text(lineItem.custom.gcFrom);
            $(egiftCardLineitem).find('.gcdeliverydate').children('.egiftcard-value').text(new Date(Date.parse(lineItem.custom.gcDeliveryDate)).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }));
        }

        var qtySelector = `.js-quantity-select[data-uuid="${uuid}"]`;
        if (lineItem.quantity > 10) {
            $(qtySelector).empty();
            for (var optionNum = 0; optionNum < lineItem.quantity; optionNum++) {
                $(qtySelector).append('<option>' + (optionNum + 1) + '</option>');
            }
        }
        $(qtySelector).val(lineItem.quantity);
        $(qtySelector).data('pid', data.newProductId);

        var $updatedSpanQuantity = $('.js-quantity-' + uuid);
        $updatedSpanQuantity.empty().html(lineItem.quantity);
        if (lineItem.quantity > 1) {
            $('.b-cartlineitem_quantity-update').removeClass('hide');
        }

        $(`.remove-product-item[data-uuid="${uuid}"]`).attr('data-pid', data.newProductId);
        $(`.edit-link.js-save-later[data-uuid="${uuid}"]`).attr('data-pid', data.newProductId);
        $(`.card.card-product-info.uuid-${uuid}`).attr('data-pid', data.newProductId);

        var priceSelector = `.line-item-price-${uuid} .sales .value`;
        $(priceSelector).text(lineItem.price.sales.formatted);
        $(priceSelector).attr('content', lineItem.price.sales.decimalPrice);

        if (lineItem.price.list) {
            var listPriceSelector = `.line-item-price-${uuid} .list .value`;
            $(listPriceSelector).text(lineItem.price.list.formatted);
            $(listPriceSelector).attr('content', lineItem.price.list.decimalPrice);
        }
        // update OOS
        var currentProductDiv = $(`.b-cartlineitem.card-product-info.card.uuid-${uuid}`);
        if (lineItem.availabilityError && !lineItem.isPartiallyAvailable && !currentProductDiv.hasClass('b-cartlineitem_outofstock')) {
            currentProductDiv.addClass('b-cartlineitem_outofstock');
        } else if (currentProductDiv.hasClass('b-cartlineitem_outofstock')) {
            currentProductDiv.removeClass('b-cartlineitem_outofstock');
        }
    }

    getQuantitySelector(uuid) {
        return ((this.$el && $('.set-items').length)) || ((this.$el && this.$el.closest('.g-modal-quick-view').length) || $('.b-cartlineitem').length)
            ? this.$el.find('#quantity-' + uuid)
            : $('.js-quantity-select');
    }
    updateQuantities(quantities, uuid) {
        if (!(this.$el.parent('.bonus-product-item').length > 0)) {
            if (!(this.$el.parent('.g-modal-quick-view-body').length > 0) || (this.$el.closest('.g-modal-quick-view').length)) {
                var optionsHtml = quantities.map((quantity) => {
                    var selected = quantity.selected ? ' selected ' : '';
                    return `<option value="${quantity.value}"  data-url="${quantity.url}"
                        ${selected}>${quantity.value}</option>`;
                }).join('');
                this.getQuantitySelector(uuid).empty().html(optionsHtml);
            }
        }
    }

    onUpdateCartProduct(event) {
        event.preventDefault();

        var $target = $(event.target);

        var updateProductUrl = $target.closest('.cart-and-ipay').find('.update-cart-url').val();
        var selectedQuantity = $target.closest('.cart-and-ipay').find('.update-cart-url').data('selected-quantity');
        var uuid = $target.closest('.cart-and-ipay').find('.update-cart-url').data('uuid');

        var form = {
            uuid: uuid,
            pid: this.getPidValue($target),
            quantity: selectedQuantity
        };

        if ($(this.selectors.eGiftCardForm).length > 0) {
            var eGiftCardData = $(this.selectors.eGiftCardForm).serializeArray();
            var eGiftCardFormData = {};
            eGiftCardData.forEach(function (data) {
                eGiftCardFormData[data.name] = data.value;
            });
            form.eGiftCardData = JSON.stringify(eGiftCardFormData);
        }

        $target.parents('.card').spinner().start();
        if (updateProductUrl) {
            $.ajax({
                url: updateProductUrl,
                type: 'post',
                context: this,
                data: form,
                dataType: 'json',
                success: function (data) {
                    $target.closest('.g-modal').modal('hide');
                    if ($('.b-cart-bopis_shipping').length > 0 || $('.b-cart-pickup-heading').length > 0) {
                        window.location.reload();
                    } else {
                        var $updatedQuantity = $('.js-quantity-' + uuid);
                        var lineItem = this.findItem(data.cartModel.items, function (item) {
                            return item.UUID === uuid;
                        });
                        if (!$.isEmptyObject(lineItem.quantities) && lineItem.quantities.quantities !== null) {
                            this.updateQuantities(lineItem.quantities, uuid);
                        }
                        $('.coupons-and-promos').empty().append(data.cartModel.totals.discountsHtml);
                        $updatedQuantity.empty().html(selectedQuantity);
                        $updatedQuantity.parent().addClass('hide');
                        if (selectedQuantity > 1) {
                            $updatedQuantity.parent().removeClass('hide');
                        }
                        this.updateCartTotals(data.cartModel);
                        this.updateApproachingDiscounts(data.cartModel.approachingDiscounts);
                        freeShippingBar.methods.updateShippingBar(data.cartModel.freeShippingBar);
                        this.updateAvailability(data.cartModel, uuid);
                        this.updateProductDetails(data, uuid);
                        freeShippingBar.methods.getShippingPromo(data.cartModel.totals);
                        if (data.uuidToBeDeleted) {
                            $('.uuid-' + data.uuidToBeDeleted).remove();
                        }
                        this.validateBasket(data.cartModel);
                        $('body').trigger('cart:lineItemEdited', {
                            basket: data.cartModel
                        });
                        $('body').trigger('cart:update');
                        if (lineItem && Object.hasOwnProperty.call(lineItem.custom, 'masterQtyLimit') && lineItem.custom.masterQtyLimit) {
                            $('#quantity-' + uuid).attr('disabled', true);
                        }
                        $.spinner().stop();
                    }
                }.bind(this),
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        if (err.responseJSON.messages && !err.responseJSON.masterQtyLimitError) {
                            var availabilityMessages = [];
                            var availabilityValue = '';
                            availabilityMessages = err.responseJSON.messages;
                            if (availabilityMessages.length === 2) {
                                availabilityValue = '<div class="b-product-quickview-stock_icon"></div><div class="b-product-quickview-stock_text">';
                            }
                            availabilityMessages.forEach((message) => {
                                availabilityValue += `<div>${message}</div>`;
                            });
                            if (availabilityMessages.length === 2) {
                                availabilityValue += '</div>';
                            }
                            $('.b-product-quickview-stock_Message').removeClass('hide');
                            $('.b-product-quickview-stock_Message').empty().html(availabilityValue);
                        } else if (err.responseJSON.masterQtyLimitError) {
                            var masterQtyLimitErrorMessage = '';
                            masterQtyLimitErrorMessage = '<div class="selection-error-message"><div>' + err.responseJSON.errorMessage + '</div></div>';
                            $('.selection-error-message').removeClass('hide');
                            $('.selection-error-message').empty().html(masterQtyLimitErrorMessage);
                        } else {
                            this.createErrorNotification(err.responseJSON.errorMessage, $target);
                        }
                        $.spinner().stop();
                    }
                }
            });
        }
    }


    onRemoveSaveLater(event) {
        event.preventDefault();
        var $target = this.$el.find('.js-remove-saveforlater');
        var url = $target.attr('href');

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            context: this,
            success: function (data) {
                $('.cart-saved-items').empty().html(data.renderedTemplate);
                $('body').trigger('wishlist:removeItemSuccess', {
                    style: $target.attr('data-style')
                });
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    this.createErrorNotification(err.responseJSON.errorMessage, $target);
                    $.spinner().stop();
                }
            }
        });
    } // eslint-disable-next-line

    onEditFromSaveLater(event) {
        event.preventDefault();
        var $target = this.$el.find('.js-edit-saveforlater');
        var url = $target.attr('href');


        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            context: this,
            success: function (data) {
                window.location.href = data.redirectUrl;
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    this.createErrorNotification(err.responseJSON.errorMessage, $target);
                    $.spinner().stop();
                }
            }
        });
    } // eslint-disable-next-line

    onCartOutOfStockCheck(event) {
        event.preventDefault();
        var $target = $(event.target);
        var url = $target.data('action-url');
        $('body > .modal-backdrop').remove();
        $target.find('.b-cart-loader').removeClass('hide');
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            context: $target,
            success: function (data) {
                if (data && data.renderedTemplate && data.error) {
                    var parseHtml = $.parseHTML(data.renderedTemplate);
                    $('.cartAvailabilityModal-content').empty().append(parseHtml);
                    $(`#${data.modalId}`).modal('show');
                    if (data.modalId === 'cartAvailabilityModal') {
                        // OOS Modal Shown on clicking 'Checkout'
                        $('body').trigger('modalShown', {
                            name: 'cart: product out of stock'
                        });
                    } else if (data.modalId === 'noChargeOrderModal') {
                        $target.addClass('disabled');
                    }
                    $target.find('.b-cart-loader').addClass('hide');
                } else {
                    $target.closest('.js-checkoutbuttons-container').find('.js-bfx-checkout-button')[0].click();
                }
            },
            error: function (err) {
                if (err && err.error) {
                    window.location.href = err.redirectURL;
                }
                $target.find('.b-cart-loader').addClass('hide');
            }
        });
    }

    onCartActionsButtons(event) {
        event.preventDefault();
        var $target = $(event.target);
        var $targetURL = $target.data('href');
        var query = $('.cartAvailabilityModal-content').find('.fullyRemoveitems').val();
        var url = $targetURL + '?fullyRemoveItems=' + query;
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            context: $target,
            success: function (data) {
                $.spinner().stop();
                $('#cartAvailabilityModal').modal('hide');
                if (!(data && data.error)) {
                    window.location.href = data.redirectURL;
                }
            },
            error: function (err) {
                if (err && err.error) {
                    window.location.href = err.redirectURL;
                }
                $.spinner().stop();
            }
        });
    }

    onDisplayPromoCodeFormBtn(event) {
        if (!sessionStorage.getItem('show-promo-code-form')) {
            sessionStorage.setItem('show-promo-code-form', true);
            this.initPromoCodeForm();

            var $target = $(event.currentTarget);
            var url = $target.data('action-url');
            $.ajax({
                type: 'post',
                url: url,
                dataType: 'json',
                context: this,
                error: function () {
                    sessionStorage.removeItem('show-promo-code-form');
                }
            });
        }
    }
}
