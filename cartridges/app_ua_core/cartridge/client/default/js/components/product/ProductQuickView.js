'use strict';

import Product from './Product';

var focusHelper = require('base/components/focus');

export default class ProductQuickView extends Product {
    init() {
        super.init();

        this.$body = $('body');

        this.$target = this.$el.closest('.g-modal');
        this.targetID = this.$target.attr('id');
        this.modalSelector = '#' + this.targetID;
        this.$closeButton = this.$el.closest('.g-modal-content').find('.close');
        this.initializeQVEvents();
    }

    initializeQVEvents() {
        this.event('click', this.onClose.bind(this), this.$closeButton);

        this.event('keydown', this.onKeydownWhenModalIsOpen.bind(this), this.$target);
        this.event('shown.bs.modal', this.onFocusProductQuickViewModal.bind(this), this.$target);

        this.event('product:afterAttributeSelect', this.onAfterAttributeSelect.bind(this));
        this.event('product:beforeAttributeSelect', this.onBeforeAttributeSelect);

        this.event('product:updateAddToCart', this.onUpdateAddToCart, this.$target);
        this.event('product:updateAvailability', this.onUpdateAvailability);
    }

    onFocusProductQuickViewModal() {
        $('.close', this.$target).focus();
    }

    onKeydownWhenModalIsOpen(event) {
        var focusParams = {
            event: event,
            containerSelector: this.modalSelector,
            firstElementSelector: '.full-pdp-link',
            lastElementSelector: '.add-to-cart-global',
            nextToLastElementSelector: '.g-modal-footer .quantity-select'
        };
        focusHelper.setTabNextFocus(focusParams);
    }

    onBeforeAttributeSelect(event, response) {
        var $el = response && response.container ? response.container : this.$el;
        $el.closest('.g-modal.show .g-modal-content').spinner().start();
    }

    onAfterAttributeSelect(event, response) {
        if ($('.g-modal.show .product-quickview>.bundle-items').length) {
            $('.g-modal.show').find(response.container).data('pid', response.data.product.id);
            $('.g-modal.show').find(response.container)
                .find('.product-id').text(response.data.product.id);
        } else if ($('.set-items').length) {
            response.container.find('.product-id').text(response.data.product.id);
        } else {
            $('.product-id', this.$el).text(response.data.product.id);
            $('.g-modal.show .product-quickview').data('pid', response.data.product.id);
            $('.g-modal.show .full-pdp-link')
                .attr('href', response.data.product.selectedProductUrl);
            if (this.$el.hasClass('product-recommendation-quickview')) {
                this.$el = $('.product-recommendation-quickview');
                this.$el.attr('data-pid', response.data.product.id);
            }
        }
    }

    onUpdateAddToCart(event, response) {
        // update global add to cart (single products, bundles)
        var dialog = $(response.$productContainer)
            .closest('.quick-view-dialog');

        $('.add-to-cart-global', dialog).attr('disabled',
            !$('.global-availability', dialog).data('ready-to-order')
            || !$('.global-availability', dialog).data('available')
        );
    }

    onUpdateAvailability(event, response) {
        // bundle individual products
        $('.product-availability', response.$productContainer)
            .data('ready-to-order', response.product.readyToOrder)
            .data('available', response.product.available)
            .find('.availability-msg')
            .empty()
            .html(response.message);


        var dialog = $(response.$productContainer)
            .closest('.quick-view-dialog');

        if ($('.product-availability', dialog).length) {
            // bundle all products
            var allAvailable = $('.product-availability', dialog).toArray()
                .every(function (item) { return $(item).data('available'); });

            var allReady = $('.product-availability', dialog).toArray()
                .every(function (item) { return $(item).data('ready-to-order'); });

            $('.global-availability', dialog)
                .data('ready-to-order', allReady)
                .data('available', allAvailable);

            $('.global-availability .availability-msg', dialog).empty()
                .html(allReady ? response.message : response.resources.info_selectforstock);
        } else {
            // single product
            $('.global-availability', dialog)
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available)
                .find('.availability-msg')
                .empty()
                .html(response.message);
        }
    }

    afterAddToCart() {
        this.onClose();
    }

    onClose() {
        if ($('[data-target-id="' + this.targetID + '"]').data()) {
            $('[data-target-id="' + this.targetID + '"]').data().cmpInstance.onClose();
        }
    }
}
