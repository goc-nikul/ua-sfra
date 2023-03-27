'use strict';

import Modal from './Modal';

export default class RemoveProductModal extends Modal {
    init() {
        super.init();
        this.selectors = {
            cartDeleteConfirmationButton: '.js-confirm-product-remove',
            removeProduct: '.remove-product-item',
            productToRemove: '.product-to-remove'
        };
        this.event('click', this.onRemoveProduct.bind(this), this.$el.find(this.selectors.removeProduct));
    }

    onCartDeleteConfirmationButton() {
        var cardTileComponent = $(this.$el).closest('.card').data().cmpInstance;
        cardTileComponent.onCartDeleteConfirmation.apply(cardTileComponent, arguments);
    }

    createTarget() {
        this.$target = $('#removeProductModal').clone().attr('id', this.targetID);
        $('body').append(this.$target);
        this.$el.attr('data-target-id', this.targetID);
        this.eventDelegate('click', this.selectors.cartDeleteConfirmationButton, this.onCartDeleteConfirmationButton.bind(this), this.$target);
    }

    onRemoveProduct() {
        var $productToRemoveSpan = $(this.selectors.productToRemove);
        $productToRemoveSpan.empty().append(this.$el.data('name'));
    }
}
