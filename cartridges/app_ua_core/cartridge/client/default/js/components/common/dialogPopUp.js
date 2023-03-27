'use strict';

import Modal from './Modal';

export default class dialogPopUp extends Modal {
    init() {
        super.init();
        this.selectors = {
            dialogPopUp: '.termsAndConditions',
            orderItemRemove: '.js-confirm-orderItem-remove'
        };
    }
    onOrderRemoveConfirmationButton() {
        if ($('.js-order-return-items').length === 1) {
            window.location.href = $('.editbtn').data('href');
        } else {
            var url = $('.js-confirm-orderItem-remove').data('url');
            var pid = $('.js-confirm-orderItem-remove').data('product');
            var returnItems = $('.order-return-reason-form').data('return-items');
            var selectedPidsArray = returnItems.data;
            var returnItemsArray = [];
            for (var i = 0; i < selectedPidsArray.length; i++) {
                if (pid && selectedPidsArray[i] && selectedPidsArray[i] !== pid.toString()) {
                    returnItemsArray.push(selectedPidsArray[i]);
                }
            }
            var returnInfo = {};
            returnInfo.data = returnItemsArray;
            if (url) {
                url += ('&pids=' + JSON.stringify(returnInfo));
            }

            $.spinner().start();
            $.ajax({
                url: url,
                method: 'POST',
                dataType: 'json',
                success: function (data) {
                    var responseHtml = $.parseHTML(data.renderedTemplate);
                    $('.b-order_track-details').addClass('js-select-reason');
                    $('.order-items').empty().append(responseHtml);
                    $('body').find('.b-order-view_section').addClass('hide');
                    $('body').find('.editbtn').removeClass('hide');
                    $('body').find('.b-order-col-right').addClass('hide');
                    $('body').find('.return-exchange-static').addClass('hide');
                    $('body').find('.order-return-reason-tab').addClass('active');
                    $('body').find('.card.checkout-order-total-summary').addClass('hide');
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    }

    createTarget() {
        if (this.$el.hasClass('btn-modal-dialog')) {
            this.$target = $('#termsAndConditions').clone();
            $('body').append(this.$target);
        } else {
            this.$target = $('#js-orderItemRemoveModal').clone();
            $('body').append(this.$target);
            var removeItemImgSrc = $('body').find(this.$el).parents('div.b-order-col-left').children('div.order-item-image')
            .find('img')
            .attr('src');
            var productID = $('body').find(this.$el).parents('div.b-order-col-left').children('div.order-item-image')
            .data('product');
            this.$target.find('img.itemRemove-img').attr('src', removeItemImgSrc);
            $('.js-confirm-orderItem-remove').attr('data-product', productID);
            this.eventDelegate('click', this.selectors.orderItemRemove, this.onOrderRemoveConfirmationButton.bind(this), this.$target);
        }
    }
}
