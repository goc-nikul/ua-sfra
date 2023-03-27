import Component from '../forms/FormGeneric';

export default class IDME extends Component {
    init() {
        super.init();
        this.$body = $('body');
        // eslint-disable-next-line spellcheck/spell-checker
        this.eventDelegate('click', '.login-trigger', this.onTriggerIdmeLogin.bind(this));
        // eslint-disable-next-line spellcheck/spell-checker
        this.eventDelegate('click', '#idme-refresh', this.refreshIDMEContent.bind(this));
        this.eventDelegate('click', '.js-delete-idme-coupon-confirmation-btn', this.onRemoveIDMEPromo.bind(this));
    }

    // eslint-disable-next-line spellcheck/spell-checker
    onTriggerIdmeLogin(event) {
        event.preventDefault();
        var $target = $(event.target);
        var scopes = $target.closest('.login-trigger').prop('name');
        var top = ($(document).height() - 780) / 4;
        var left = ($(document).width() - 750) / 2;
        // eslint-disable-next-line spellcheck/spell-checker
        var clientId = $('#IDMEclientID').val();
        var redirectUri = $('#IDMEReturn').val();
        // eslint-disable-next-line spellcheck/spell-checker
        var apiUri = $('#IDMEauthorizeURI').val();
        $('body').trigger('modalShown', { name: 'idmeLogin' });
        // eslint-disable-next-line spellcheck/spell-checker
        window.open(apiUri + '?scopes=' + scopes + '&client_id=' + clientId + '&redirect_uri=' + redirectUri + '&response_type=code&scopes=' + scopes + '&display=popup', '', 'scrollbars=yes,menubar=no,status=no,location=no,toolbar=no,width=550,height=680,top=' + top + ',left=' + left);
    }

    refreshIDMEContent(event) {
        event.preventDefault();
        var $target = $(event.target);
        var url = $target.data('action');
        $('body > .modal-backdrop').remove();
        $.spinner().start();
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            context: this,
            success: function (data) {
                $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                $('.idme-content').empty().append(data.totals.idmePromosHtml);
                this.$body.trigger('cart:updateCartTotals', [data, this]);
                this.$body.trigger('cart:validateBasket', [data, this]);
                $('body').removeClass('modal-open');
                $.spinner().stop();
                $('.coupon-code-field').removeClass('is-invalid');
                $('body').trigger('idme:loginAttempt', {
                    idmeLoginStatus: (data.analytics && data.analytics.idmeVerified) ? data.analytics.idmeVerified : '',
                    idmeGroup: (data.analytics && data.analytics.idmeScope) ? data.analytics.idmeScope : ''
                });
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
    onRemoveIDMEPromo(event) {
        event.preventDefault();
        var $target = $(event.target);
        var url = $target.data('action');
        $('body > .modal-backdrop').remove();
        $.spinner().start();
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            context: this,
            success: function (data) {
                $('.idme-content').empty().append(data.totals.idmePromosHtml);
                $('.b-promo').show();
                this.$body.trigger('cart:updateCartTotals', [data, this]);
                this.$body.trigger('cart:validateBasket', [data, this]);
                $('body').removeClass('modal-open');
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    $.spinner().stop();
                }
            }
        });
    }
}
