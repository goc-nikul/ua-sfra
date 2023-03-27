import Component from '../core/Component';

export default class LocaleSelector extends Component {
    init() {
        this.$page = $('.js-page');
        this.$locales = $('.js-locale-item', this.$el);
        this.$locales.click(this.selectLocale.bind(this));
    }

    selectLocale(event) {
        event.preventDefault();
        var $selectedLocale = $(event.target);
        var action = this.$page.data('action');
        var queryString = this.$page.data('querystring');
        var localeCode = $selectedLocale.data('locale');
        var localeCurrencyCode = $selectedLocale.data('currencycode');
        var url = this.config.url;

        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            data: {
                code: localeCode,
                queryString: queryString,
                CurrencyCode: localeCurrencyCode,
                action: action
            },
            success: this.onSuccess,
            error: this.onError
        });
    }

    onSuccess(response) {
        $.spinner().stop();
        if (response && response.redirectUrl) {
            window.location.href = response.redirectUrl;
        }
    }

    onError() {
        $.spinner().stop();
    }
}
