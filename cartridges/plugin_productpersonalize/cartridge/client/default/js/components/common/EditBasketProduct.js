'use strict';

import ParentEditBasketProduct from 'org/components/common/EditBasketProduct';

export default class EditBasketProduct extends ParentEditBasketProduct {
    openModal(event) {
        event.preventDefault();
        $('#' + this.targetID).remove();
        if ($('.g-modal-cart-quickview').length > 0) {
            $('.g-modal-cart-quickview').remove();
        }
        super.createTarget();
        super.fillModalElement();
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

        $('body').trigger('modalShown', {
            name: 'edit-cart-product',
            product: data.product
        });

        $('body').trigger('personlize:editcart');
        setTimeout(function () {
            $.spinner().stop();
        }, 1000);
    }

    get modalWrapperHTML() {
        return '<!-- Modal -->'
        + '<div id="' + this.targetID + '" class="g-modal g-modal-cart-quickview" tabindex="-1" role="dialog">'
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
