'use strict';

import BonusProductModal from './BonusProductModal';

export default class CartBonusProductModal extends BonusProductModal {
    init() {
        super.init();
    }

    get modalWrapperHTML() {
        $.spinner().start();
        var data = {};

        $.ajax({
            url: this.$el.data('url'),
            method: 'GET',
            dataType: 'json',
            async: false,
            success: function (response) {
                data = response;
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });

        var bonusUrl;
        if (data.bonusChoiceRuleBased) {
            bonusUrl = data.showProductsUrlRuleBased;
        } else {
            bonusUrl = data.showProductsUrlListBased;
        }

        this.$el.attr('href', bonusUrl);

        return `<div class="modal fade bonusProductModel" id="${this.targetID}" tabindex="-1" role="dialog">
        <span class="enter-message sr-only" ></span>
        <div class="modal-dialog choose-bonus-product-dialog" 
        data-total-qty="${data.maxBonusItems}"
        data-UUID="${data.uuid}"
        data-pliUUID="${data.pliUUID}"
        data-addToCartUrl="${data.addToCartUrl}"
        data-pageStart="0"
        data-pageSize="${data.pageSize}"
        data-moreURL="${data.showProductsUrlRuleBased}"
        data-bonusChoiceRuleBased="${data.bonusChoiceRuleBased}">
        <!-- Modal content-->
        <div class="modal-content">
        <div class="modal-header">
            <span class="">${data.labels.selectprods}</span>
            <button type="button" class="close pull-right" data-dismiss="modal">
                <span aria-hidden="true">&times;</span>
                <span class="sr-only"> </span>
            </button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer"></div>
        </div>
        </div>
        </div>`;
    }
}
