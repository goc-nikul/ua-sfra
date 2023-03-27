import Component from '../components/forms/FormGeneric';

var formValidation = require('base/components/formValidation');
var addressBook = require('falcon/addressBook/addressBook');

export default class addressFromGeneric extends Component {
    init() {
        super.init();
        this.event('submit', this.addressFromGenericSubmit.bind(this));
    }

    addressFromGenericSubmit(event) {
        event.preventDefault();
        var $form = this.$el;
        var addressID = $form.attr('data-addressID');
        var url = $form.attr('action') + '?addressID=' + addressID;
        $form.spinner().start();
        $('form.address-form').trigger('address:submit', event);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: $form.serialize(),
            success: function (data) {
                $form.spinner().stop();
                if (!data.success) {
                    formValidation($form, data);
                } else {
                    var dataHtml = data.renderedTemplate;
                    var count = $('.b-account-address_book-container').find('.js-address_book-section:visible').length;
                    $('body').find('.b-account-address_book-updated').remove();
                    $('body').find('.b-account-address_book-heading').remove();
                    $('.b-account-address').find('.address-right-container').empty().append(dataHtml);
                    addressBook.viewMoreLess(count);
                    $('html, body').animate({
                        scrollTop: 0
                    }, 500);
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                $form.spinner().stop();
            }
        });
        return false;
    }
}
