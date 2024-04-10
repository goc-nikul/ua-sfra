'use strict';

import Component from '../core/Component';

import cart from './cart';

var updateMiniCart = true;

export default class MiniCart extends Component {
    init() {
        super.init();
        cart();
        this.$minicart = $('.minicart');
        this.$body = $('body');
        this.$minicartBackdrop = $('.b-header_minicart-modal-backdrop');
        this.isCartPage = $('#bodyPage').is('[data-action="Cart-Show"]');
        this.initEvents();
        this.onProgressBar();
    }

    initEvents() {
        this.event('count:update', this.onCountUpdate.bind(this), this.$minicart);
        this.event('mouseenter focusin touchstart', this.onShowMiniCart.bind(this), this.$minicart);
        this.event('mouseleave focusout', this.onHideMiniCart.bind(this), this.$minicart);
        this.event('mouseenter focusin touchstart click', this.onHideMiniCart.bind(this), this.$minicartBackdrop);
        this.event('change', this.onQuantityChange, $(this.$minicart).find('.quantity'));
        this.event('cart:update', this.onUpdateMiniCart, this.$body);
        this.event('product:afterAddToCart', this.onUpdateMiniCart, this.$body);
        this.event('update:progressBar', this.onProgressBar, this.$body);
    }

    onCountUpdate(event, count) {
        if (count && $.isNumeric(count.quantityTotal)) {
            if (this.isCartPage) {
                window.location.reload();
                return;
            }
            if (!this.$minicart.find('.minicart-quantity').length) {
                this.$minicart.find('.b-header_minicart-icon').append(
                    '<span class="b-header_minicart-quantity minicart-quantity"></span>'
                );
            }

            this.$minicart.find('.minicart-quantity').css('display', count.quantityTotal > 0 ? 'block' : 'none');
            this.$minicart.find('.minicart-link').attr({
                'aria-label': count.minicartCountOfItems,
                title: count.minicartCountOfItems
            });

            this.$minicart.find('.minicart-quantity').text(count.quantityTotal);

            if (window.matchMedia('(min-width: 1024px)').matches && $('.b-cart-content.cart').length === 0) {// eslint-disable-line
                this.$minicart.trigger('focusin', [true]);
            }
        }
    }

    onShowMiniCart(e, isTriggered) {
        if (window.matchMedia('(min-width: 1024px)').matches && !isTriggered) {// eslint-disable-line
            let url = this.$minicart.data('action-url');
            let count = parseInt($(this.$minicart).find('.minicart-quantity').text(), 10);

            if (count > 0 && $(this.$minicart).find('.b-header_minicart-container.show').length === 0) {
                if (!updateMiniCart) {
                    $(this.$minicart).find('.b-header_minicart-container').addClass('show');
                    $(this.$minicart).find('.b-header_minicart-modal-backdrop').addClass('show');
                }

                $(this.$minicart).find('.b-header_minicart-container')
                    .addClass('show')
                    .spinner()
                    .start();
                $(this.$minicart).find('.b-header_minicart-modal-backdrop').addClass('show');
                $.get(url, data => {
                    if (!updateMiniCart) {
                        return;
                    }
                    $(this.$minicart).find('.b-header_minicart-container')
                    .spinner()
                    .start();
                    $(this.$minicart).find('.b-header_minicart-container')
                        .empty()
                        .append(data);
                    $.spinner().stop();
                    this.onProgressBar();
                    $(this.$minicart).find('.checkout-btn').on('click', this.onAddToCart.bind(this));
                });
            }
        }
    }

    onHideMiniCart(event) {
        if ((event.type === 'focusout' && $(this.$minicart).has(event.target).length > 0)
            || (event.type === 'mouseleave' && $(event.target).is('.minicart .quantity'))
            || ($(this.$body).hasClass('modal-open') && (!$(event.target).hasClass('b-header_minicart-modal-backdrop') || event.type !== 'mouseenter'))) {
            event.stopPropagation();
            return;
        }
        $(this.$minicart).find('.b-header_minicart-container').removeClass('show');
        $(this.$minicart).find('.b-header_minicart-modal-backdrop').removeClass('show');
    }

    onQuantityChange() {
        if ($(this).parents('.bonus-product-line-item').length && $('.cart-page').length) {
            location.reload();
        }
    }

    onUpdateMiniCart() {
        updateMiniCart = true;
    }

    onProgressBar() {
        $('.approaching-discounts').find('.meter > span').each(function () {
            if ($(this).attr('data-previous-promo-width') !== $(this).attr('data-promo-width')) {
                var previousPromoWidth = $(this).attr('data-previous-promo-width');
                var currentPromoWidth = $(this).attr('data-promo-width');
                $(this).width(previousPromoWidth).animate({
                    width: currentPromoWidth
                }, 1200);
                $(this).attr('data-previous-promo-width', currentPromoWidth);
            }
        });

        var $productSummary = $(this.$minicart).find('.b-header_minicart-product-summary');
        var minicartHeader = $(this.$minicart).find('.b-header_minicart-header').outerHeight();
        var minicartFooter = $(this.$minicart).find('.b-header_minicart-footer').outerHeight();
        var progressBarHeight = $(this.$minicart).find('.approaching-discounts').outerHeight();
        var shippingPromotionHeight = $(this.$minicart).find('.b-header_minicart-shipping-promotion').outerHeight();
        var headrHeight = $('.js-header').outerHeight();
        var applePayValue = 0;
        var iOSDevices = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
        if ((window.dw && window.dw.applepay && window.dw.applepay.inject && window.dw.applepay.inject.directives) && iOSDevices) {
            window.dw.applepay.inject.directives.forEach(function (applePay) {
                if (applePay.query === '.mini-cart-totals') {
                    applePayValue = 60;
                }
            });
        }
        var totalHeight = minicartHeader + minicartFooter + headrHeight + shippingPromotionHeight + applePayValue + 50;
        if (window.matchMedia('(min-width: 1024px)').matches && $(this.$minicart).find('.approaching-discounts-content').length > 0) {// eslint-disable-line
            totalHeight = minicartHeader + minicartFooter + progressBarHeight + headrHeight + applePayValue + 90;
        }
        $productSummary.css('max-height', 'calc(100vh - ' + totalHeight + 'px)');
    }

    onAddToCart(event) {
        event.preventDefault();
        var redirectUrl = event.currentTarget.href;
        $(event.currentTarget).spinner().start();
        window.location.href = redirectUrl;
    }
}
