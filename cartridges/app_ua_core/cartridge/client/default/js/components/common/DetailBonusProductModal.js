'use strict';

import BonusProductModal from './BonusProductModal';

export default class DetailBonusProductModal extends BonusProductModal {
    init() {
        super.init();

        this.initDetailBonusProductEvents();
    }

    initDetailBonusProductEvents() {
        this.event('product:showBonusProducts', function (e, data) {
            this.config.data = data;
            this.$el.trigger('click');
        }.bind(this));
    }

    get modalWrapperHTML() {
        $.spinner().start();
        var data = this.config.data;

        var bonusUrl;
        if (data.bonusChoiceRuleBased) {
            bonusUrl = data.showProductsUrlRuleBased;
        } else {
            bonusUrl = data.showProductsUrlListBased;
        }

        this.$el.attr('href', bonusUrl);

        return `<div class="modal fade bonusProductModel bonusProductModelPdp" id="${this.targetID}" tabindex="-1" role="dialog">
        <span class="enter-message sr-only" ></span>
        <div class="modal-dialog choose-bonus-product-dialog pdp-bonus-product-model"
        data-total-qty="${data.maxBonusItems}"
        data-UUID="${data.uuid}"
        data-pliUUID="${data.pliUUID}"
        data-addToCartUrl="${data.addToCartUrl}"
        data-pageStart="0"
        data-pageSize="${data.pageSize}"
        data-moreURL="${data.showProductsUrlRuleBased}"
        data-bonusChoiceRuleBased="${data.bonusChoiceRuleBased}">
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
