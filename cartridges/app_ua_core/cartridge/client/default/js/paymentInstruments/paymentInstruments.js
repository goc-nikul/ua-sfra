'use strict';

var formValidation = require('base/components/formValidation');
var cleave = require('base/components/cleave');
var url;
var width = $(window).width();
var height = $(window).height();

/**
 * Create an scroll position to display the address container
 */
function scrollPosition() {
    var headrHeight = $('.js-header').height();
    var addressContainer = $('.payment-form-container');
    if ($('.payment-form-container').length > 0) {
        $('html, body').animate({
            scrollTop: addressContainer.offset().top - headrHeight
        }, 500);
    }
}

/**
 * ViewMore and ViewLess to display the payment container Fields
 * @param {Object} count - the count object which will get the count after the success
 */
function viewMoreLessfunction(count) {
    var $paymentContainer = $('.b-account-payment_book-container').find('.js-payment_book-section');
    var $payment = $('.b-account-payment');
    if ($(window).width() < 1024) {
        var paymentCount = (count === undefined && count !== '' && count !== null) ? 3 : count;

        var paymentLenght = $('.b-account-payment_book-container').find('.js-payment_book-section').length;
        if (paymentLenght > 3) {
            $paymentContainer.addClass('hide');

            if ($payment.find('.viewLess').is(':visible')) {
                $payment.find('.viewLess').removeClass('hide');
                $payment.find('.viewMore').addClass('hide');
            } else {
                $payment.find('.viewLess').addClass('hide');
                $payment.find('.viewMore').removeClass('hide');
            }
        } else {
            $payment.find('.viewLess').addClass('hide');
            $payment.find('.viewMore').addClass('hide');
        }
        $('.b-account-payment_book-container').find('.js-payment_book-section:lt(' + paymentCount + ')').removeClass('hide');

        $payment.on('click', '.viewMore', function () {
            paymentCount = (paymentCount + 3 <= paymentLenght) ? paymentCount + 3 : paymentLenght;
            $('.b-account-payment_book-container').find('.js-payment_book-section:lt(' + paymentCount + ')').removeClass('hide');

            if (paymentCount === paymentLenght) {
                $(this).addClass('hide');
                $payment.find('.viewLess').removeClass('hide');
            }
        });

        $payment.on('click', '.viewLess', function () {
            paymentCount = (paymentCount - 3 <= 0) ? 3 : paymentCount - 3;
            $('.b-account-payment_book-container').find('.js-payment_book-section').not(':lt(' + paymentCount + ')').addClass('hide');
            var paymentScrollPosition = $('.b-account-payment_book-container').find('.js-payment_book-section:not(.hide)').last().offset().top - 60;

            $('html, body').animate({ scrollTop: 0 }, 0);
            $('html, body').animate({
                /* eslint-disable */
                'scrollTop': paymentScrollPosition
                /* eslint-enable */
            }, 0);

            if (paymentCount <= 3) {
                $(this).addClass('hide');
                $payment.find('.viewMore').removeClass('hide');
            }
        });
    } else {
        $paymentContainer.removeClass('hide');
    }
}

module.exports = {
    removePayment: function () {
        $('body').on('click', '.remove-payment', function (e) {
            e.preventDefault();
            url = $(this).data('url') + '?UUID=' + $(this).data('id');
            $('.payment-to-remove').empty().append($(this).data('card'));

            $('body').on('click', '.delete-confirmation-btn', function (f) {
                f.preventDefault();
                $('.remove-payment').trigger('payment:remove', f);
                $.ajax({
                    url: url,
                    type: 'get',
                    dataType: 'json',
                    success: function (data) {
                        $('div#uuid-' + data.UUID).parent('div.js-payment_book-section').remove();
                        if (data && data.makeDefault) {
                            $('div#uuid-' + data.makeDefault).click();
                        }
                        var count = $('.b-account-payment_book-container').find('.js-payment_book-section:visible').length + 1;
                        viewMoreLessfunction(count);
                        if (data.message) {
                            var toInsert =
                            '<div class="b-account-payment_book-heading b-account-payment_book-noaddress"><h3>'
                            + data.message +
                            '</h3></div>';
                            $('.b-account-payment_book .address-right-container .no-payment').after(toInsert);
                            $('.b-account-payment .js-content-hidden').addClass('hide');
                        } else {
                            $('.b-account-payment .js-content-hidden').removeClass('hide');
                        }
                    },
                    error: function (err) {
                        if (err.responseJSON.redirectUrl) {
                            window.location.href = err.responseJSON.redirectUrl;
                        }
                        $.spinner().stop();
                    }
                });
            });
        });
    },

    submitPayment: function () {
        $('form.payment-form').submit(function (e) {
            var $form = $(this);
            e.preventDefault();
            url = $form.attr('action');
            $form.spinner().start();
            $('form.payment-form').trigger('payment:submit', e);

            var formData = cleave.serializeData($form);

            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: formData,
                success: function (data) {
                    $form.spinner().stop();
                    if (!data.success) {
                        formValidation($form, data);
                    } else {
                        location.href = data.redirectUrl;
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
        });
    },

    editPayment: function () {
        $('body').on('click', '.address-right-container .edit-payment', function (e) {
            e.preventDefault();
            var selectedOption = $(this);
            var $form = $('form.update-payment-form');
            $('#updatePaymentButton').attr('data-id', selectedOption.data('id'));
            $('form.update-payment-form').attr('data-action', 'edit');
            var paymentID = selectedOption.closest('.js-payment_book-section').find('.js-payment_book-option').attr('id');
            $('form.update-payment-form').attr('data-paymentid', paymentID);

            if ($('.address-right-container .payment-form-container').hasClass('hide')) {
                $('.address-right-container .payment-form-container').removeClass('hide');
                $('.address-right-container .btn-add-new').addClass('hide');
            }
            if ($(this).attr('data-default') === 'true') {
                $('input#makeDefaultPayment').prop('checked', true);
                $('#makeDefaultPayment').attr('checked', 'checked');
            } else {
                $('input#makeDefaultPayment').prop('checked', false);
                $('#makeDefaultPayment').removeAttr('checked');
            }

            $('.address-right-container .payment-form-container .add-payment').addClass('hide');
            $('.address-right-container .payment-form-container .edit-payment').removeClass('hide');
            $form.find('.form-control.is-invalid').removeClass('is-invalid');
            $form.find('.invalid-feedback').empty();
            var attrs = selectedOption.closest('.js-payment_book-section').find('.js-payment_book-option').data();
            var element;

            Object.keys(attrs).forEach(function (attr) {
                element = attr === 'cardname' ? 'cardOwner' : attr;
                $form.find('[name$=' + element + ']').val(attrs[attr]);
            });

            scrollPosition();
        });
    },

    handleCreditCardNumber: function () {
        if ($('#cardNumber').length && $('#cardType').length) {
            cleave.handleCreditCardNumber('#cardNumber', '#cardType');
        }
    },

    showDeletePaymentModal: function () {
        $('body').on('click', '.remove-payment', function (e) {
            e.preventDefault();
            var addressID = $(this).closest('.js-payment_book-section').find('.js-payment_book-option').attr('id');
            var addressContent = $(this).closest('.js-payment_book-section').html();
            $('#deletePaymentModal').attr('data-payment-id', addressID);
            $('#deletePaymentModal').find('.js-remove-payment').empty().append(addressContent);
            $('#deletePaymentModal').modal('show');
        });
    },

    cancelAddress: function () {
        $('body').on('click', '.account-cancel-button', function () {
            var $this = $(this);
            var form = $this.closest('form');
            form.attr('data-action', 'new');
            $this.closest('.payment-form-container').addClass('hide');
            $('.address-right-container .btn-add-new').removeClass('hide');
            form.find('.form-control.is-invalid').removeClass('is-invalid');
            form.find('.invalid-feedback').empty();
            $('html, body').animate({
                scrollTop: 0
            }, 500);
            return;
        });
    },

    sameAsDefault: function () {
        $('body').on('click', '#makeDefaultPayment', function () {
            if (!($('#makeDefaultPayment').is(':checked'))) {
                $('#makeDefaultPayment').removeAttr('checked');
            } else {
                $('#makeDefaultPayment').attr('checked', 'checked');
            }
        });
    },

    inputExpirationDateValidation: function () {
        $('body').on('blur', 'input#expirationDate', function () {
            var $this = $(this);
            var expDate = $this.val();
            var validationMessage;
            if (expDate.search('/') === -1) {
                validationMessage = $this.data('pattern-mismatch');
                $this.addClass('is-invalid');
                $this.parent().addClass('error-field');
                $this.parents('.form-group').find('.invalid-feedback')
                .text(validationMessage);
            } else {
                $this.removeClass('is-invalid');
                $this.parent().removeClass('error-field');
                $this.closest('div').find('.invalid-feedback').text('');
            }
            var expMonth = expDate.split('/')[0];
            var expYear = expDate.split('/')[1];
            var currentYear = parseInt(new Date().getFullYear().toString().substr(2, 2), 10);
            var currentMonth = parseInt(new Date().getMonth() + 1, 10);
            if ((expYear == currentYear && expMonth < currentMonth) || (expYear < currentYear) || (expMonth > 12) || (expYear > (currentYear + 20)) || (expYear == (currentYear + 20) && expMonth > currentMonth)) {// eslint-disable-line
                validationMessage = $this.data('pattern-mismatch');
                $this.addClass('is-invalid');
                $this.parent().addClass('error-field');
                $this.parents('.form-group').find('.invalid-feedback')
                .text(validationMessage);
            } else if (($this.val().length === 5) && ((expYear > currentYear) || (expYear == currentYear && expMonth >= currentMonth))) {// eslint-disable-line
                $this.removeClass('is-invalid');
                $this.parent().removeClass('error-field');
                $this.closest('div').find('.invalid-feedback').text('');
            }
        }).on('keyup', 'input#expirationDate', function () {
            var $this = $(this);
            var expDate = $this.val();
            expDate = expDate.split('/').join('');
            if (expDate.length > 0) {
                expDate = expDate.match(new RegExp('.{1,2}', 'g')).join('/');
            }
            $(this).val(expDate);
        });
    },

    viewMoreLess: function (count) {
        viewMoreLessfunction(count);
    },

    resizeFunction: function () {
        $(window).resize(function () {
            if ($(window).width() !== width || $(window).height() !== height) {
                viewMoreLessfunction();
            }
        });
    },

    makingDefaultPaymentOnClick: function () {
        $('body').on('click', '.js-payment_book-option', function () {
            var $this = $(this);
            var defaultUrl = $this.data('make-default-url');
            var uuid = $this.data('id');
            var $form = $('form.update-payment-form');
            var formData = cleave.serializeData($form);
            var optionUrl = defaultUrl + '?UUID=' + uuid;

            $this.spinner().start();

            $.ajax({
                url: optionUrl,
                type: 'post',
                dataType: 'json',
                data: formData,
                success: function (data) {
                    $this.spinner().stop();
                    $('.js-payment_book-section').removeClass('default-card');
                    $('.js-payment_book-section').find('.edit-payment').attr('data-default', false);
                    $('#uuid-' + data.paymentInstrument.UUID).closest('.js-payment_book-section').addClass('default-card');
                    $('#uuid-' + data.paymentInstrument.UUID).closest('.js-payment_book-section').find('.edit-payment').attr('data-default', true);
                },
                error: function () {
                    $this.spinner().stop();
                }
            });
            return false;
        });
    }
};
