'use strict';

var shippingHelpers = require('./shipping');
var scrollAnimate = require('../components/scrollAnimate');

/**
 * Search for stores with new zip code
 * @param {HTMLElement} element - the target html element
 * @returns {boolean} false to prevent default event
 */
function search(element) {
    var $searchInput = $(element).find('#hal-postal-code').length ? $(element).find('#hal-postal-code') : $(element).find('#collection-point-postal-code');
    var regex = /^\d{5}$/;
    var zipCodeError = $searchInput.data('pattern-mismatch');
    var zipCodeMissing = $searchInput.data('missing-error');
    if (regex.test($searchInput.val())) {
        $searchInput.removeClass('is-invalid');
        $searchInput.parents().find('.invalid-feedback').html('');
    } else if ($searchInput.val() === '') {
        $searchInput.addClass('is-invalid');
        $searchInput.closest('.js-form-group').addClass('error-field');
        $searchInput.closest('.js-form-group').find('.invalid-feedback').html(zipCodeMissing);
    } else {
        $searchInput.addClass('is-invalid');
        $searchInput.closest('.js-form-group').addClass('error-field');
        $searchInput.closest('.js-form-group').find('.invalid-feedback').html(zipCodeError);
    }
    return false;
}

module.exports = {
    toggleAdressandCollectionPoint: function () {
        $('body').off('click', '.ship-options .g-radio').on('click', '.ship-options .g-radio', function (e) {
            if (!$(this).hasClass('activeState') && !$(e.target).hasClass('g-tooltip')) {
                $('.ship-options .g-radio').removeClass('activeState');
                $(this).addClass('activeState');
                var $shiptoaddress = $('.ship-to-address-wrap-content');
                var $shiptoPoint = $('.ship-to-point-wrap-content');
                var $halWrap = $('.js-hal-summary');
                var $addressNotPresent = $.trim($('.js-hal-summary').find('.hal-address-summary .address1').text()) === '';
                var $checkoutbutton = $('.b-checkout_nextStep');
                var $shippingAddressBlock = $('.shipping-address-block');
                var $shippingMethodBlock = $('.shipping-method-block');
                var $active = $('.ship-options .g-radio.activeState').hasClass('ship-to-address');
                var shippingForm = $shiptoaddress.closest('.shipping-form');
                var checkoutStage = $('div#checkout-main').attr('data-checkout-stage');
                var $shippingPrivacyLink = $('.b-shipping-privacy_links');
                if (checkoutStage === 'payment' || checkoutStage === 'placeOrder') {
                    $('.b-shipping-summary_edit').trigger('click');
                    if (!$active) {
                        $shippingAddressBlock.addClass('hide');
                        $shippingPrivacyLink.addClass('hide');
                        $checkoutbutton.addClass('hide');
                        $('.gift-message-block, .shipment-selector-block').addClass('hide');
                        if ($addressNotPresent) {
                            $shiptoPoint.removeClass('hide');
                            $shippingMethodBlock.addClass('hide');
                            $('.b-checkout_nextStep').addClass('hide');
                        } else {
                            $halWrap.removeClass('hide');
                            $shippingMethodBlock.removeClass('hide');
                            $('.b-checkout_nextStep').removeClass('hide');
                        }
                    }
                } else {
                    if ($active) { //eslint-disable-line
                        $shippingAddressBlock.removeClass('hide');
                        $shippingPrivacyLink.removeClass('hide');
                        $shippingMethodBlock.removeClass('hide');
                        $checkoutbutton.removeClass('hide');
                        $shiptoPoint.addClass('hide');
                        $halWrap.addClass('hide');
                        $('.gift-message-block, .shipment-selector-block').removeClass('hide');
                        $('body').trigger('shipping:clearForm', { form: shippingForm });
                        var isRegistered = $('#checkout-main').data('customer-type');
                        if (isRegistered === 'registered' && $('.single-shipping .shipping-address-section.default-address').length > 0 && !($('#checkout-main').hasClass('multi-ship'))) {
                            $('.single-shipping .shipping-address-section.default-address').find('.shipping-address-option').trigger('click');
                        } else if (isRegistered === 'registered' && $('.multi-shipping .shipping-address-section.default-address').length > 0 && $('#checkout-main').hasClass('multi-ship')) {
                            $('.multi-shipping .shipping-address-section.default-address').find('.shipping-address-option').trigger('click');
                        }
                    } else {
                        $shippingAddressBlock.addClass('hide');
                        $shippingPrivacyLink.addClass('hide');
                        $checkoutbutton.addClass('hide');
                        $('.gift-message-block, .shipment-selector-block').addClass('hide');
                        if ($addressNotPresent) {
                            $shiptoPoint.removeClass('hide');
                            $shippingMethodBlock.addClass('hide');
                            $('.b-checkout_nextStep').addClass('hide');
                        } else {
                            $halWrap.removeClass('hide');
                            $shippingMethodBlock.removeClass('hide');
                            $('.b-checkout_nextStep').removeClass('hide');
                        }
                    }
                }
            }
        });
    },

    search: function () {
        $('body').on('click', '.js-collection-point-locator-search', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $form = $this.closest('.collection-point-locator');
            var $targetURL = $form.attr('action');
            var radius = $form.find('#radius').val();
            var postalCode = $form.find('#collection-point-postal-code').val();
            if ($this.hasClass('page-search')) {
                $form = $this.closest('.ship-to-point-wrap-content');
                $targetURL = $this.data('action');
                radius = $form.find('#radius').val();
                postalCode = $form.find('#hal-postal-code').val();
            } else if ($this.hasClass('edit-search')) {
                $form = $this.closest('.js-hal-summary');
                $targetURL = $this.data('href');
                radius = $this.closest('.js-hal-summary').find('.selceted-collection-point-radius').val();
                postalCode = $this.closest('.js-hal-summary').find('.selceted-collection-point-postal').val();
            }
            var url = $targetURL + '?radius=' + radius + '&postalCode=' + postalCode;
            search($form);
            if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
                $form.spinner().start();
                $.ajax({
                    url: url,
                    type: 'get',
                    dataType: 'json',
                    context: $(this),
                    success: function (data) {
                        var radiusVal = $('#collectionPointLocator').find('#radius').val();
                        var poatalCodeVal = $('#collectionPointLocator').find('#collection-point-postal-code').val();
                        if ($(this).hasClass('page-search')) {
                            radiusVal = $(this).closest('.ship-to-point-wrap-content').find('#radius').val();
                            poatalCodeVal = $(this).closest('.ship-to-point-wrap-content').find('#hal-postal-code').val();
                        } else if ($(this).hasClass('edit-search')) {
                            radiusVal = $(this).closest('.js-hal-summary').find('.selceted-collection-point-radius').val();
                            poatalCodeVal = $(this).closest('.js-hal-summary').find('.selceted-collection-point-postal').val();
                        }
                        $('#collectionPointLocator').remove();
                        if (data && data.storesResultsHtml) {
                            $('body').append(data.storesResultsHtml);
                            $('#collectionPointLocator').modal('show');
                            $('body').addClass('m-no-scroll');
                            $('#collectionPointLocator').find('.results').addClass('hide-button');
                            $('body').trigger('modalShown', {
                                name: 'commercial location: find a location'
                            });
                            $('#collectionPointLocator').find('#collection-point-postal-code').val(poatalCodeVal);
                            $('#collectionPointLocator').find('#radius').val(radiusVal).change();
                            $('#collectionPointLocator').find('.error-message-text').remove();
                            if ($('#collectionPointLocator').find('.store-locator-no-results').length > 0) {
                                var postalContent = $('#collectionPointLocator').find('#collection-point-postal-code');
                                postalContent.addClass('is-invalid');
                                $('#collectionPointLocator').find('.b-store-zipcode').addClass('error-field');
                                $('#collectionPointLocator').find('.b-store-zipcode .invalid-feedback').html(postalContent.data('noresult'));
                            }
                        }
                        $.spinner().stop();
                    },
                    error: function (err) {
                        if (err && err.error) {
                            window.location.href = err.redirectURL;
                        }
                        $.spinner().stop();
                    }
                });
            }
        });
    },

    collectionPointLocatorEvents: function () {
        $('body').on('click', '.select-collection-point', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $container = $this.closest('.js-collection-point-locator-container');
            var $targetURL = $this.data('href');
            var queryParam = $this.closest('#collectionPointLocator').find('.selceted-collection-point').val();
            var $halWrap = $('.js-hal-summary');
            var urlParams = {
                selectedCollectionPoint: queryParam
            };
            var url = $targetURL;
            $container.find('.collection-pick-message').addClass('hide');
            $container.find('.js-find-store-form').removeClass('collection-pick-message-shown');
            if ($container.find('.js-input-radio:checked').length === 0) {
                $container.find('.collection-pick-message').removeClass('hide');
                $container.find('.js-find-store-form').addClass('collection-pick-message-shown');
            } else {
                $this.closest('.js-collection-point-locator-container').spinner().start();
                $.ajax({
                    url: url,
                    type: 'post',
                    dataType: 'json',
                    data: urlParams,
                    context: $(this),
                    success: function (data) {
                        if (!(data && data.success)) {
                            $(this).closest('.b-collectionpoint-buttons').find('.error-message-text').remove();
                            var htmlContent = '<div class="error-message-text">' + data.errorMessage + '</div>';
                            $(this).closest('.b-collectionpoint-buttons').append(htmlContent);
                        } else {
                            $halWrap.find('.hal-address-summary .address1').text(data.result.address.address1);
                            $halWrap.find('.hal-address-summary .address2').text(data.result.address.address2);
                            $halWrap.find('.hal-address-summary .city').text(data.result.address.city + ',');
                            $halWrap.find('.hal-address-summary .stateCode').text(data.result.address.stateCode);
                            $halWrap.find('.hal-address-summary .postalCode').text(data.result.address.postalCode);
                            var $form = $('form.shipping-form:visible');
                            shippingHelpers.methods.updateShippingMethodList($form);
                            $halWrap.removeClass('hide');
                            $('.ship-to-point-wrap-content').addClass('hide');
                            $('.shipping-address-block').addClass('hide');
                            $('.b-shipping-privacy_links').addClass('hide');
                            $('.b-checkout_nextStep, .shipping-method-block').removeClass('hide');
                            $('#collectionPointLocator').modal('hide');
                            $('body').removeClass('m-no-scroll');
                            scrollAnimate($('.shipping-method-block'));
                        }
                        $.spinner().stop();
                    },
                    error: function (err) {
                        if (!(err && err.success)) {
                            window.location.href = err.redirectUrl;
                        }
                        $.spinner().stop();
                    }
                });
            }
        });

        $('body').on('change', '.js-input-radio', function () {
            var $this = $(this);
            var $container = $this.closest('.js-collection-point-locator-container');
            var storeDetails = $this.closest('.collection-point').find('.collection-point-store');
            var stringContent = JSON.stringify([{ address: { HALLocationID: storeDetails.find('.store-name').data('hal-location-id'), HALLocationType: storeDetails.find('.store-name').data('hal-location-type'), address1: storeDetails.find('.store-name').text(), address2: storeDetails.find('.store-address').text(), city: storeDetails.find('.store-city').text(), stateCode: storeDetails.find('.store-state').text(), zipCode: storeDetails.find('.store-postalcode').text() } }]);
            var postalValue = storeDetails.find('.store-postalcode').text();
            var radiusValue = $(this).closest('#collectionPointLocator').find('#radius').val();
            $(this).closest('#collectionPointLocator').find('.selceted-collection-point').val(stringContent);
            $('body').find('.selceted-collection-point-postal').val(postalValue);
            $('body').find('.selceted-collection-point-radius').val(radiusValue);
            $(this).closest('#collectionPointLocator').find('.error-message-text').remove();
            $container.find('.collection-pick-message').addClass('hide');
            $container.find('.js-find-store-form').removeClass('collection-pick-message-shown');
            $this.closest('.b-stores-results').find('.collection-point').removeClass('selected');
            if ($this.is(':checked')) {
                $this.closest('.collection-point').addClass('selected');
                $(this).closest('#collectionPointLocator').find('.results').removeClass('hide-button');
            }
        });
    },

    clearShippingForm: function () {
        $('body').on('shipping:clearForm', function (e, data) {
            var form = data.form;
            if (!form) return;

            $('input[name$=_firstName]', form).val('');
            $('input[name$=_lastName]', form).val('');
            $('input[name$=_address1]', form).val('');
            $('input[name$=_address2]', form).val('');
            $('input[name$=_city]', form).val('');
            $('input[name$=_postalCode]', form).val('');
            $('select[name$=_stateCode],input[name$=_stateCode]', form).val('');
            $(form).find('input, select').removeClass('is-invalid');
            $(form).find('.form-group').removeClass('error-field');
            $(form).find('.invalid-feedback').empty();
        });
    },

    closeCollectionPointModal: function () {
        $('body').on('click', '#collectionPointLocator .g-modal-close, #collectionPointLocator .btn-collection-point-close', function () {
            $('body').removeClass('m-no-scroll');
        });
    }
};
