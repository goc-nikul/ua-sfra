'use strict';

import QuickView from 'org/components/product/QuickView';

export default class EditShareBasketProduct extends QuickView {
    init() {
        super.init();

        this.selectors = {
            updateCartProduct: '.js-update-cart-product-global',
            quantitySelect: '.js-quantity-select-control',
            updateCartProductCart: '.js-cart-add-to-cart'
        };
    }

    openModal(event) {
        event.preventDefault();
        $('#' + this.targetID).remove();
        this.createTarget();
        super.fillModalElement();
    }

    onUpdateCartProduct() {
        var cardTileComponent = $('[data-target-id="' + this.targetID + '"]').closest('.card').data().cmpInstance;
        cardTileComponent.onUpdateCartProduct.apply(cardTileComponent, arguments);
    }

    onQuantityChanged(event) {
        $('.update-cart-url').data('selected-quantity', parseInt($(event.target).val(), 10));
    }

    onAJAXSuccess(data) {
        var parsedHtml = this.parseHtml(data.renderedTemplate);
        var targetIdSelector = '#' + this.targetID;

        $(targetIdSelector).modal('show');
        $(targetIdSelector).find('.g-modal-content').spinner().start();
        $(targetIdSelector + ' .g-modal-body').empty();
        $(targetIdSelector + ' .g-modal-body').html(parsedHtml.$body);
        $(targetIdSelector + ' .g-modal-footer').html(parsedHtml.$footer);
        $(targetIdSelector + ' .g-modal-header .close .sr-only').text(data.closeButtonText);
        $(targetIdSelector + ' .enter-message').text(data.enterDialogMessage);

        $('body').trigger('editModalShown', {
            name: 'edit-cart-product',
            product: data.product
        });

        setTimeout(function () {
            $.spinner().stop();
        }, 1000);
    }

    createTarget() {
        super.createTarget();

        this.eventDelegate('click', this.selectors.updateCartProduct, this.onUpdateCartProduct.bind(this), this.$target);
        this.eventDelegate('click', this.selectors.updateCartProductCart, this.onUpdateCartProduct.bind(this), this.$target);
        this.eventDelegate('change', this.selectors.quantitySelect, this.onQuantityChanged.bind(this), this.$target);
    }

    get modalWrapperHTML() {
        return '<!-- Modal -->'
        + '<div id="' + this.targetID + '" class="g-modal" tabindex="-1" role="dialog">'
        + '<span class="enter-message sr-only" ></span>'
        + '<div class="g-modal-dialog g-modal-quick-view" role="document">'
        + '<!-- Modal content-->'
        + '<div class="g-modal-content g-modal-quick-view-content bfx-price-product">'
        + '<div class="g-modal-header g-modal-quick-view-header">'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        <span class="sr-only"> </span>'
        + '    </button>'
        + '</div>'
        + '<div class="g-modal-body g-modal-quick-view-body"></div>'
        + '<div class="g-modal-footer g-modal-quick-view-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    }
}
