'use strict';

import Component from '../forms/FormGeneric';

export default class giftCard extends Component {
    init() {
        super.init();
        this.checkBalanceForm = $('.js-check-balance-form');
        this.event('submit', this.checkGiftBalance.bind(this), this.checkBalanceForm);
    }

    checkGiftBalance(event) {
        event.preventDefault();
        var giftForm = $('.gift-card__balance-form').serialize();
        var url = this.checkBalanceForm.attr('action');
        var balanceShow = $('.js-check-balance-result-wrapper');
        var errorShow = $('.giftCard-available-balance-errormsg');

        $.ajax({
            url: url,
            method: 'POST',
            dataType: 'json',
            data: giftForm,
            success: function (data) {
                if (data.success !== true && data.errorMessage) {
                    errorShow.text(data.errorMessage);
                    errorShow.show();
                    balanceShow.hide();
                } else {
                    if (data.giftCardData && data.giftCardData.currentBalance) {
                        balanceShow.show();
                        balanceShow.find('.js-result-value').text(data.giftCardData.currentBalance);
                    }
                    errorShow.hide();
                }
            }
        });
        return false;
    }
}
