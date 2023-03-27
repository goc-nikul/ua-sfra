'use strict';

var storeLocator = require('../storeLocator/storeLocator');

/**
 * Add required attribute for input fields
 * input button
 * @param {Object} data - validate the fields
 */
function addRequiredAttribute(data) {
    var $this = data;
    var primaryPickup = $this.find('.js-primary-pickup');
    var secondaryPickup = $this.find('.js-secondary-pickup');

    if (primaryPickup.is(':visible') && primaryPickup.length > 0) {
        primaryPickup.find('.js-form-group').addClass('required');
        primaryPickup.find('.js-input_row-input').prop('required', true);
    } else {
        primaryPickup.find('.js-form-group').removeClass('required');
        primaryPickup.find('.js-input_row-input').prop('required', false);
    }

    if (secondaryPickup.is(':visible') && secondaryPickup.length > 0) {
        secondaryPickup.closest('.pickup-primary-body').find('input.js-pickup').prop('checked', true);
        secondaryPickup.find('.js-form-group').addClass('required');
        secondaryPickup.find('.js-input_row-input').prop('required', true);
    } else {
        secondaryPickup.closest('.pickup-primary-body').find('input.js-pickup').prop('checked', false);
        secondaryPickup.find('.js-form-group').removeClass('required');
        secondaryPickup.find('.js-input_row-input').prop('required', false);
    }
}

/**
 * Populate store finder html
 * @param {Object} target - Dom element that needs to be populated with store finder
 */
function loadStoreLocator(target) {
    $.ajax({
        url: target.data('url'),
        method: 'GET',
        success: function (response) {
            target.html(response.storesResultsHtml);
            storeLocator.search();
            storeLocator.changeRadius();
            storeLocator.selectStore();
            storeLocator.updateSelectStoreButton();
            if (!$('.results').data('has-results')) {
                $('.store-locator-no-results').show();
            }
        }
    });
}

/**
 * Show store locator when appropriate shipping method is selected
 * @param {Object} shippingForm - DOM element that contains current shipping form
 */
function showStoreFinder(shippingForm) {
    // hide address panel
    shippingForm.find('.shipment-selector-block').addClass('hide');
    shippingForm.find('.shipping-address-block').addClass('hide');
    shippingForm.find('.change-store').addClass('hide');
    shippingForm.find('.b-pickup-store').addClass('hide');
    addRequiredAttribute(shippingForm.find('.b-pickup-store'));

    shippingForm.find('.gift-message-block').addClass('hide');
    shippingForm.find('.gift').prop('checked', false);
    shippingForm.find('.gift-message').addClass('hide');

    shippingForm.find('.pickup-in-store').empty().removeClass('hide');

    loadStoreLocator(shippingForm.find('.pickup-in-store'));
}

/**
 * Hide store finder and restore address form
 * @param {Object} shippingForm - DOM element with current form
 * @param {Object} data - data containing customer and order objects
 */
function hideStoreFinder(shippingForm, data) {
    var isShipToCollectionEnabled = $('#ship-to-collectionPoint').is(':checked');

    if ($(shippingForm).find('.store-locator-container').is(':visible') || $(shippingForm).find('.store-details').is(':visible')) {
        $('body').trigger('shipping:clearForm', { form: shippingForm });
    }

    if (data.order.usingMultiShipping) {
        $('body').trigger('instore:hideMultiShipStoreFinder', {
            form: shippingForm,
            customer: data.customer,
            order: data.order
        });
    } else {
        $('body').trigger('instore:hideSingleShipStoreFinder', {
            form: shippingForm,
            customer: data.customer,
            order: data.order
        });
    }

    shippingForm.find('.pickup-in-store').addClass('hide');
    shippingForm.find('.change-store').addClass('hide');
    shippingForm.find('.b-pickup-store').addClass('hide');
    addRequiredAttribute(shippingForm.find('.b-pickup-store'));
    shippingForm.find('.gift-message-block').removeClass('hide');

    shippingForm.find('input[name="storeId"]').remove();

    if (isShipToCollectionEnabled) {
        shippingForm.find('.shipping-address-block').addClass('hide');
        shippingForm.find('.gift-message-block').addClass('hide');
        shippingForm.find('.shipment-selector-block').addClass('hide');
    }
}

/**
 * Handles the initial state of single shipping on page load
 */
function handleInitialSingleship() {
    var pickupSelected = $(':checked', '.shipping-method-list').data('pickup');
    var storeSelected = $('.store-details').length;
    var shippingForm = $('.single-shipping .shipping-form');
    var storeID = storeSelected ? $('.store-details').data('store-id') : null;

    if (pickupSelected && !storeSelected) {
        showStoreFinder(shippingForm);
    } else if (pickupSelected && storeSelected) {
        shippingForm
            .find('.pickup-in-store')
            .removeClass('hide')
            .append('<input type="hidden" name="storeId" value="' + storeID + '" />');

        shippingForm.find('.shipment-selector-block').addClass('hide');
    }
}

/**
 * Handles the initial state of multi-shipping on page load
 */
function handleInitialMultiship() {
    $(':checked', '.multi-shipping .shipping-method-list').each(function () {
        var pickupSelected = $(this).data('pickup');
        var shippingForm = $(this).closest('form');
        var store = shippingForm.find('.store-details');
        var storeSelected = store.length;
        var storeID = storeSelected ? store.data('store-id') : null;

        if (pickupSelected && !storeSelected) {
            showStoreFinder(shippingForm);
        } else if (pickupSelected && storeSelected) {
            shippingForm
                .find('.pickup-in-store')
                .removeClass('hide')
                .append('<input type="hidden" name="storeId" value="' + storeID + '" />');
        } else {
            shippingForm.find('.pickup-in-store').addClass('hide');
            shippingForm.find('.shipping-address-block').removeClass('hide');
        }
    });
}

module.exports = {
    watchForInStoreShipping: function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            if (!data.urlParams || !data.urlParams.shipmentUUID) {
                data.order.shipping.forEach(function (shipment) {
                    var form = $('.shipping-form input[name="shipmentUUID"][value="' + shipment.UUID + '"]').closest('form');
                    form.find('.pickup-in-store').data('url', shipment.pickupInstoreUrl);
                });

                return;
            }

            var shipment = data.order.shipping.find(function (s) {
                return s.UUID === data.urlParams.shipmentUUID;
            });

            var shippingForm = $('.shipping-form input[name="shipmentUUID"][value="' + shipment.UUID + '"]').closest('form');
            shippingForm.find('.pickup-in-store').data('url', shipment.pickupInstoreUrl);

            if (shipment.selectedShippingMethod.storePickupEnabled) {
                showStoreFinder(shippingForm);
            } else {
                hideStoreFinder(shippingForm, data);
            }
        });
    },
    watchForStoreSelection: function () {
        $('body').on('store:selected', function (e, data) {
            var pickupInStorePanel = $(data.event.target).parents('.pickup-in-store');
            var card = pickupInStorePanel.parents('.card');
            if ($(window).scrollTop() > card.offset().top) {
                $('html, body').animate({
                    scrollTop: card.offset().top
                }, 200);
            }
            var newLabel = $(data.storeDetailsCheckoutHtml);
            var content = $('<div class="selectedStore store-details" data-store-id="' + data.storeID + '"></div>').html(newLabel)
                .append('<input type="hidden" name="storeId" value="' + data.storeID + '" />');

            pickupInStorePanel.empty().append(content);
            pickupInStorePanel.siblings('.change-store').removeClass('hide');
            pickupInStorePanel.siblings('.b-pickup-store').removeClass('hide');
            addRequiredAttribute(pickupInStorePanel.siblings('.b-pickup-store'));
        });
    },
    initialStoreMethodSelected: function () {
        $(document).ready(function () {
            var isMultiship = $('#checkout-main').hasClass('multi-ship');
            if (isMultiship) {
                handleInitialMultiship();
            } else {
                handleInitialSingleship();
            }
        });
    },
    updateAddressLabelText: function () {
        $('body').on('shipping:updateAddressLabelText', function (e, data) {
            var addressLabelText = (data.selectedShippingMethod && data.selectedShippingMethod.storePickupEnabled) ? data.resources.storeAddress : data.resources.shippingAddress;
            if ($('#ship-to-collectionPoint').is(':checked')) {
                addressLabelText = $('.js-hal-summary .single-shipping').attr('data-pickupaddress');
                $('.shipping-summary .card-header h2.b-shipping-summary_header').text($('.shipping-summary .card-header').attr('data-pickupheading'));
                $('.shipping-summary').addClass('hal-shipping-summary');
            } else {
                $('.shipping-summary .card-header h2.b-shipping-summary_header').text($('.shipping-summary .card-header').attr('data-shippingheading'));
                $('.shipping-summary').removeClass('hal-shipping-summary');
            }
            data.shippingAddressLabel.text(addressLabelText);
        });
    },
    changeStore: function () {
        $('body').on('click', '.change-store', (function (e) {
            e.preventDefault();
            showStoreFinder($(this).closest('form'));
            $(this).addClass('hide');
            $(this).closest('.shipping-address').find('.b-pickup-store').addClass('hide');
            addRequiredAttribute($(this).closest('.shipping-address').find('.b-pickup-store'));
        }));
    },
    updateAddressButtonClick: function () {
        $('body').on('click', '.btn-show-details', (function () {
            $(this).closest('.shipment-selector-block').siblings('.shipping-address-block').removeClass('hide');
        }));
    },
    hideMultiShipStoreFinder: function () {
        $('body').on('instore:hideMultiShipStoreFinder', function (e, data) {
            data.form.find('.shipping-address-block').removeClass('hide');
            data.form.find('.shipment-selector-block').removeClass('hide');

            if (!data.customer.registeredUser) {
                data.form.attr('data-address-mode', 'new');
            } else {
                data.form.attr('data-address-mode', 'edit');
            }
        });
    },
    hideSingleShipStoreFinder: function () {
        $('body').on('instore:hideSingleShipStoreFinder', function (e, data) {
            if (data.customer.registeredUser) {
                if (data.customer.addresses.length) {
                    data.form.find('.shipment-selector-block').removeClass('hide');
                    if (!data.order.shipping[0].matchingAddressId) {
                        data.form.find('.shipping-address-block').removeClass('hide');
                    } else {
                        data.form.attr('data-address-mode', 'edit');

                        var addressSelectorDropDown = data.form.find('.addressSelector option[value="ab_' + data.order.shipping[0].matchingAddressId + '"]');
                        $(addressSelectorDropDown).prop('selected', true);
                    }
                } else {
                    data.form.find('.shipping-address-block').removeClass('hide');
                }
            } else {
                data.form.find('.shipping-address-block').removeClass('hide');
                data.form.find('.shipment-selector-block').removeClass('hide');
            }
        });
    },
    actionEditMultiShip: function () {
        $('body').on('shipping:editMultiShipAddress', function (e, data) {
            var shippingForm = data.form;
            var pickupSelected = shippingForm.find('.shipping-method-list :checked').data('pickup');
            if (pickupSelected && (shippingForm.find('input[name=storeId]').val() === null || shippingForm.find('input[name=storeId]').val() === '')) {
                showStoreFinder(shippingForm);
            }
        });
    },
    showPickupAlternative: function () {
        $('body').on('click', '.js-pickup', function () {
            var $content = $(this).closest('.pickup-primary-body');
            var secondaryPickup = $content.find('.js-secondary-pickup');
            if (!($(this).is(':checked'))) {
                $content.find('.js-shipping-pickup').addClass('hide');
                secondaryPickup.find('.js-form-group').removeClass('required');
                secondaryPickup.find('.js-input_row-input').prop('required', false);
            } else {
                $content.find('.js-shipping-pickup').removeClass('hide');
                secondaryPickup.find('.js-form-group').addClass('required').removeClass('error-field');
                secondaryPickup.find('.js-input_row-input').prop('required', true);
                secondaryPickup.find('.js-input_row-input').removeClass('is-invalid');
                secondaryPickup.find('.invalid-feedback').text('');
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
        });
    }
};
