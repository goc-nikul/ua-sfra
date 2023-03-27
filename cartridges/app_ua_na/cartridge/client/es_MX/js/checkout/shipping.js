'use strict';

var shippingHelpersCore = require('org/checkout/shipping');
var clientSideValidation = require('org/components/common/clientSideValidation');
var clientSideValidationMX = require('../components/common/clientSideValidation');
var addressHelpersNA = require('./address');
var formHelpers = require('org/checkout/formErrors');
var isLegendSoftEnabled = $('div[data-is-legendsoft]').data('is-legendsoft');
var legendSoft;

if (isLegendSoftEnabled) {
    legendSoft = require('legendsoft/checkout/suggestions');
}

/**
 * updates the shipping address selector within shipping forms
 * @param {Object} productLineItem - the productLineItem model
 * @param {Object} shipping - the shipping (shipment model) model
 * @param {Object} order - the order model
 * @param {Object} customer - the customer model
 */
function updateShippingAddressSelector(productLineItem, shipping, order, customer) {
    var uuidEl = $('input[value=' + productLineItem.UUID + ']');
    var shippings = order.shipping;

    var form;
    var $shippingAddressSelector;
    var hasSelectedAddress = false;

    if (uuidEl && uuidEl.length > 0) {
        form = uuidEl[0].form;
        $shippingAddressSelector = $('.addressSelector', form);
    }

    if ($shippingAddressSelector && $shippingAddressSelector.length === 1) {
        $shippingAddressSelector.empty();
        // Add New Address option
        $shippingAddressSelector.append(addressHelpersNA.methods.optionValueForAddress(
            null,
            false,
            order
        ));

        if (customer.addresses && customer.addresses.length > 0) {
            $shippingAddressSelector.append(addressHelpersNA.methods.optionValueForAddress(
                order.resources.accountAddresses,
                false,
                order
            ));

            customer.addresses.forEach(function (address) {
                var isSelected = shipping.matchingAddressId === address.ID;
                $shippingAddressSelector.append(
                    addressHelpersNA.methods.optionValueForAddress(
                        { UUID: 'ab_' + address.ID, shippingAddress: address },
                        isSelected,
                        order
                    )
                );
            });
        }
        // Separator -
        $shippingAddressSelector.append(addressHelpersNA.methods.optionValueForAddress(
            order.resources.shippingAddresses, false, order, { className: 'multi-shipping' }
        ));
        shippings.forEach(function (aShipping) {
            var isSelected = shipping.UUID === aShipping.UUID;
            hasSelectedAddress = hasSelectedAddress || isSelected;
            var addressOption = addressHelpersNA.methods.optionValueForAddress(
                aShipping,
                isSelected,
                order,
                { className: 'multi-shipping' }
            );

            var newAddress = addressOption.html() === order.resources.addNewAddress;
            var matchingUUID = aShipping.UUID === shipping.UUID;
            if ((newAddress && matchingUUID) || (!newAddress && matchingUUID) || (!newAddress && !matchingUUID)) {
                $shippingAddressSelector.append(addressOption);
            }
            if (newAddress && !matchingUUID) {
                $(addressOption[0]).remove();
            }
        });
    }

    if (!hasSelectedAddress) {
        // show
        $(form).addClass('hide-details');
    } else {
        $(form).removeClass('hide-details');
    }

    $('body').trigger('shipping:updateShippingAddressSelector', {
        productLineItem: productLineItem,
        shipping: shipping,
        order: order,
        customer: customer
    });
}

/**
 * Update list of available shipping methods whenever user modifies shipping address details.
 * @param {jQuery} $shippingForm - current shipping form
 */
function updateShippingMethodList($shippingForm) {
    // delay for autocomplete!
    setTimeout(function () {
        var $shippingMethodList = $shippingForm.find('.shipping-method-list');
        var urlParams = addressHelpersNA.methods.getAddressFieldsFromUI($shippingForm);
        var shipmentUUID = $shippingForm.find('[name=shipmentUUID]').val();
        var url = $shippingMethodList.data('actionUrl');
        if (url) {
            urlParams.shipmentUUID = shipmentUUID;
            if ($('.employee-address-selector').find('.default-address').length > 0) {
                urlParams.isOfficeAddress = true;
                urlParams.sapCarrierCode = $('.employee-address-selector').find('.default-address .shipping-address-option').data('sap-carrier-code');
            }

            $('.shipment-selector-block .btn-add-new').addClass('disabled');
            var isShipToCollectionEnabled = $('#ship-to-collectionPoint').is(':checked');
            if (!isShipToCollectionEnabled) {
                $('.hal-address-summary .address1').empty();
            }
            urlParams.isShipToCollectionEnabled = isShipToCollectionEnabled;
            $shippingMethodList.spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: urlParams,
                success: function (data) {
                    if (data.error) {
                        window.location.href = data.redirectUrl;
                    } else {
                        if ($('.gift').length > 0) {
                            data.order.shipping.forEach(function (aShipping) {
                                var shipping = aShipping;
                                shipping.isGift = $('.gift').is(':checked');
                                shipping.giftMessage = $('input[name$=_shippingAddress_giftMessage]').length ? $('input[name$=_shippingAddress_giftMessage]').val() : '';
                            });
                        }
                        $('body').trigger('checkout:updateCheckoutView',
                            {
                                order: data.order,
                                customer: data.customer,
                                options: { keepOpen: true }
                            });

                        $shippingMethodList.spinner().stop();
                        $('.shipment-selector-block .btn-add-new').removeClass('disabled');
                    }
                }
            });
        }
    }, 300);
}

/**
 * Select shipping Method address event handler
**/
function selectShippingMethod() {
    var baseObj = this;

    $('.shipping-method-list').change(function () {
        var $shippingForm = $(this).parents('form');
        var methodID = $(':checked', this).val();
        var shipmentUUID = $shippingForm.find('[name=shipmentUUID]').val();
        var isShipToCollectionEnabled = $('#ship-to-collectionPoint').is(':checked');
        if (isShipToCollectionEnabled) {
            $('.shipping-address-block').addClass('hide');
        } else {
            $('.hal-address-summary .address1').empty();
        }
        var urlParams = addressHelpersNA.methods.getAddressFieldsFromUI($shippingForm);
        urlParams.shipmentUUID = shipmentUUID;
        urlParams.methodID = methodID;
        urlParams.isShipToCollectionEnabled = isShipToCollectionEnabled;
        urlParams.isGift = $shippingForm.find('.gift').prop('checked');
        urlParams.giftMessage = $shippingForm.find('textarea[name$=_giftMessage]').val(); // eslint-disable-line

        var url = $(this).data('select-shipping-method-url');

        if (baseObj.methods && baseObj.methods.selectShippingMethodAjax) {
            baseObj.methods.selectShippingMethodAjax(url, urlParams, $(this));
        } else {
            shippingHelpersCore.methods.selectShippingMethodAjax(url, urlParams, $(this));
        }
    });
}

shippingHelpersCore.updateShippingAddress = function () {
    $('.shipping-save-button').on('click', function (e) {
        e.preventDefault();
        var $this = $(this);
        var $form = $(this).closest('form');
        var addressID = $form.attr('data-addr-ID');
        var url = $(this).attr('data-action-url') + '?addressId=' + addressID;
        clientSideValidation.checkMandatoryField($form);
        if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
            clientSideValidationMX.validateFields($this);
            if ($form.find('input.is-invalid').length) {
                return;
            }
            // QAS Address validation
            if (window.sitePreferences.AddressVerificationEnabled && !(window.addressVerificationDone) && typeof e.isTrigger === 'undefined') {
                window.notSubmitShippingForm = true;
                $('body').trigger('qas:AddressValidation');
                e.stopImmediatePropagation();
                return;
            }
            $.ajax({
                url: url,
                type: 'post',
                data: $form.serialize(),
                context: $(this),
                success: function success(data) {
                    // enable the next:Payment button here
                    var form = $(this).closest('form');
                    if (data.error) {
                        if (data.fieldErrors && data.fieldErrors.length) {
                            data.fieldErrors.forEach(function (error) {
                                if (Object.keys(error).length) {
                                    formHelpers.loadFormErrors(form, error);
                                    form.attr('data-address-mode', 'details');
                                }
                            });
                        }
                    }

                    addressID = typeof data.address !== 'undefined' ? data.address.ID : '';
                    var editLink = $('input.editAddrURL').val();
                    var deleteLabel = $('input.deleteLabel').val();
                    var editLabel = $('input.editLabel').val();
                    $form.find('.shipping-address-section').removeClass('default-address');
                    if (data.newAddress) {
                        var newDiv = `<div class='shipping-address-section default-address'>
                            <div class='shipping-address-option' value="ab_${addressID}" data-addr-id="${addressID}"
                            data-first-name="" data-last-name="" data-address1=""
                            data-address2="" data-exterior-number="" data-interior-number="" data-additional-information="" data-city="e" data-state-code="" data-country-code="" data-colony="" data-dependent-locality="" data-postal-code="02138" data-phone="" 
                            data-is-gift="" data-gift-message=""></div>
                            <a class='col-6 text-center btn-show-details' data-action-url='${editLink}'>${editLabel}</a>
                            <span class="icon"></span></div>`;
                        $($form.find('.shipment-selector-block .addressSelector').not('.employee-address-selector')[0]).append(newDiv);
                    }

                    var selectedAddr = $(this).closest('form').find('.shipment-selector-block').find(`[data-addr-id='${addressID}']`);
                    if (data.newAddress === true) {
                        $('.shipping-address-section').find('.button-delete-address').removeClass('hide');
                        $(selectedAddr).closest('.shipping-address-section').append('<a class="col-6 text-center button-delete-address' + (data.preferredAddress ? ' hide' : '') + '">' + deleteLabel + '</a>');
                    } else {
                        $(selectedAddr).parent().addClass('default-address');
                    }
                    $(selectedAddr).attr('data-first-name', (data.address.firstName || ''));
                    var addressLi = '<span>' + (data.address.firstName || '') + ' ' + '</span>'; // eslint-disable-line
                    $(selectedAddr).attr('data-last-name', (data.address.lastName || ''));
                    addressLi += '<span>' + (data.address.lastName || '') + '</span>';
                    addressLi += '<div>';
                    $(selectedAddr).attr('data-address1', (data.address.address1 || ''));
                    addressLi += (data.address.address1 + ' ' || '');
                    if (data.address.address2 !== null && data.address.address2) {
                        $(selectedAddr).attr('data-address2', data.address.address2);
                        addressLi += '<div>' + data.address.address2 + '</div> ';
                    }
                    if (data.address.exteriorNumber !== null && data.address.exteriorNumber) {
                        $(selectedAddr).attr('data-exterior-number', data.address.exteriorNumber);
                        addressLi += '<span>' + data.address.exteriorNumber + '</span>, ';
                    }
                    if (data.address.interiorNumber !== null && data.address.interiorNumber) {
                        $(selectedAddr).attr('data-interior-number', data.address.interiorNumber);
                        addressLi += '<span>' + data.address.interiorNumber + '</span>, ';
                    }
                    addressLi += '</div>';
                    addressLi += '<div>';
                    if (data.address.additionalInformation !== null && data.address.additionalInformation) {
                        $(selectedAddr).attr('data-additional-information', data.address.additionalInformation);
                        addressLi += '<span>' + data.address.additionalInformation + '</span>';
                    }
                    addressLi += '</div>';
                    addressLi += '<div>';
                    if (data.address.colony !== null && data.address.colony) {
                        $(selectedAddr).attr('data-colony', data.address.colony);
                        addressLi += '<span>' + data.address.colony + '</span> ';
                    }
                    if (data.address.dependentLocality !== null && data.address.dependentLocality) {
                        $(selectedAddr).attr('data-dependent-locality', data.address.dependentLocality);
                        addressLi += '<span>' + data.address.dependentLocality + '</span> ';
                    }
                    addressLi += '</div>';
                    $(selectedAddr).attr('data-city', (data.address.city || ''));
                    addressLi += '<div>' + (data.address.city || '') + ', ';
                    $(selectedAddr).attr('data-state-code', (data.address.stateCode || ''));
                    addressLi += (data.address.stateCode || '') + ', ';
                    $(selectedAddr).attr('data-postal-code', (data.address.postalCode || ''));
                    addressLi += (data.address.postalCode || '') + ', </div>';
                    var localizedCountryLabel = $('input[name=localizedCountryLabel]').val();
                    if (localizedCountryLabel !== null && localizedCountryLabel !== '') {
                        $(selectedAddr).attr('data-country', (localizedCountryLabel));
                        addressLi += (localizedCountryLabel);
                    }
                    $(selectedAddr).html(addressLi);
                    $(selectedAddr).attr('data-country-code', (data.address.countryCode.value || ''));
                    $(selectedAddr).attr('data-phone', (data.address.phone || ''));
                    form.attr('data-address-mode', 'edit');
                    window.addressVerificationDone = false;
                }
            });
        }
        return;
    });
    if ($('.js-ship-to-personal').find('.personal-address').length === 1) {
        $('.js-ship-to-personal').find('.personal-address:first').addClass('default-shipping-address');
    } else if ($('.shipping-address-container').find('.personal-address').length === 1) {
        $('.shipping-address-container').find('.personal-address:first').addClass('default-shipping-address');
    }
};

shippingHelpersCore.cancelShippingAddress = function () {
    $('.shipping-cancel-button').on('click', function () {
        var form = $(this).closest('form');
        legendSoft.updateFieldsBackToNormal();
        var addressID = $(this).attr('data-addr-id');
        if (form.find('.shipping-address-section').length > 0) {
            form.find('.shipping-address-section').each(function () {
                if ($(this).find('.shipping-address-option').data('addr-id') === addressID) {
                    $(this).find('.shipping-address-option').trigger('click');
                }
            });
        }
        form.attr('data-address-mode', 'edit');
        form.find('.multi-ship-address-actions').addClass('hide');
        form.find('.multi-ship-action-buttons .col-12.btn-save-multi-ship').removeClass('d-none');
        if (form.find('.btn-add-new').hasClass('disabled')) {
            form.find('.btn-add-new').removeClass('disabled');
        }
        return;
    });
};

shippingHelpersCore.methods.updateShippingMethodList = updateShippingMethodList;
shippingHelpersCore.methods.selectShippingMethod = selectShippingMethod;
shippingHelpersCore.methods.updateShippingAddressSelector = updateShippingAddressSelector;
module.exports = shippingHelpersCore;
