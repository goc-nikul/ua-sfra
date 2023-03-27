  /* eslint-disable no-lonely-if */
'use strict';

var shippingHelpersCore = require('org/checkout/shipping');
var addressAPAC = require('./address');
var formHelpers = require('org/checkout/formErrors');
var clientSideValidation = require('falcon/components/common/clientSideValidation');
var clientSideValidationAPAC = require('../components/common/clientSideValidation');
var debounce = require('lodash/debounce');

/**
 * updates the shipping address form values within shipping forms
 * @param {Object} shipping - the shipping (shipment model) model
 */
function updateShippingAddressFormValues(shipping) {
    var addressObject = $.extend({}, shipping.shippingAddress);

    if (!addressObject) {
        addressObject = {
            firstName: null,
            lastName: null,
            address1: null,
            address2: null,
            city: null,
            postalCode: null,
            stateCode: null,
            countryCode: null,
            phone: null
        };
    }

    addressObject.isGift = shipping.isGift;
    addressObject.giftMessage = shipping.giftMessage;

    $('input[value=' + shipping.UUID + ']').each(function (formIndex, el) {
        var form = el.form;
        if (!form || (form && ($(form).attr('data-address-mode') === 'new' || $(form).attr('data-address-mode') === 'details'))) return;
        var countryCode = addressObject.countryCode;

        addressObject.firstName ? $('input[name$=_firstName]', form).val(addressObject.firstName) : $('input[name$=_firstName]', form).val(); // eslint-disable-line
        addressObject.lastName ? $('input[name$=_lastName]', form).val(addressObject.lastName) : $('input[name$=_lastName]', form).val(); // eslint-disable-line
        addressObject.address1 ? $('input[name$=_address1]', form).val(addressObject.address1) : $('input[name$=_address1]', form).val(); // eslint-disable-line
        addressObject.address2 ? $('input[name$=_address2]', form).val(addressObject.address2) : $('input[name$=_address2]', form).val(); // eslint-disable-line
        addressObject.city ? $('input[name$=_city],select[name$=city]:first', form).val(addressObject.city) : $('input[name$=_city],select[name$=city]:first', form).val(); // eslint-disable-line
        addressObject.postalCode ? $('input[name$=_postalCode]:first,select[name$=_postalCode]:first', form).val(addressObject.postalCode) : $('input[name$=_postalCode]:first,select[name$=_postalCode]:first', form).val(); // eslint-disable-line
        addressObject.stateCode ? $('select[name$=_stateCode],input[name$=_stateCode]', form) // eslint-disable-line
            .val(addressObject.stateCode) : $('select[name$=_stateCode],input[name$=_stateCode]', form)
                .val();
        addressObject.district ? $('input[name$=_district]:first,select[name$=_district]:first', form).val(addressObject.district) : $('input[name$=_district]:first,select[name$=_district]:first', form).val(); // eslint-disable-line


        if (countryCode && typeof countryCode === 'object') {
            $('select[name$=_country]', form).val(addressObject.countryCode.value);
        } else if (addressObject.countryCode) {
            $('select[name$=_country]', form).val(addressObject.countryCode);
        }

        $('input[name$=_phone]', form).val(addressObject.phone);

        $('input[name$=_isGift]', form).prop('checked', addressObject.isGift);
        $('textarea[name$=_giftMessage]', form).val(addressObject.isGift && addressObject.giftMessage ? addressObject.giftMessage : ''); // eslint-disable-line
    });

    $('body').trigger('shipping:updateShippingAddressFormValues', { shipping: shipping });
}

/**
 * updates the order shipping summary for an order shipment model
 * @param {Object} shipping - the shipping (shipment model) model
 * @param {Object} order - the order model
 */
function updateShippingSummaryInformation(shipping, order) {
    $('[data-shipment-summary=' + shipping.UUID + ']').each(function (i, el) {
        var $container = $(el);
        var $shippingAddressLabel = $container.find('.shipping-addr-label'); // eslint-disable-line
        var $addressContainer = $container.find('.address-summary');
        var $shippingPhone = $container.find('.shipping-phone');
        var $methodTitle = $container.find('.shipping-method-title');
        var $methodArrivalTime = $container.find('.shipping-method-arrival-time');
        var $methodPrice = $container.find('.shipping-method-price');
        var $shippingSummaryLabel = $container.find('.shipping-method-label');
        var $summaryDetails = $container.find('.row.summary-details');

        var address = shipping.shippingAddress;
        var selectedShippingMethod = shipping.selectedShippingMethod;
        var shippingCostID = $('.shippingCostID').val();
        var freeTextID = $('.freeTextID').val();
        var shippingCostVal;
        var promotionalShippingCostVal;

        addressAPAC.methods.populateAddressSummary($addressContainer, address);

        if (address && address.phone) {
            $shippingPhone.text(address.phone);
        } else {
            $shippingPhone.empty();
        }

        if (selectedShippingMethod) {
            shippingCostVal = selectedShippingMethod.shippingCost;
            promotionalShippingCostVal = selectedShippingMethod.promotionShippingCost;
            $('body').trigger('shipping:updateAddressLabelText',
                { selectedShippingMethod: selectedShippingMethod, resources: order.resources, shippingAddressLabel: $shippingAddressLabel });
            $shippingSummaryLabel.show();
            $summaryDetails.show();
            $methodTitle.text(selectedShippingMethod.displayName);
            if (selectedShippingMethod.shippingDeliveryDates) {
                $methodArrivalTime.text(
                    selectedShippingMethod.shippingDeliveryDates
                );
            } else {
                $methodArrivalTime.empty();
            }
            $methodPrice.text(shippingCostVal);
            if (shippingCostVal === shippingCostID || (promotionalShippingCostVal !== undefined && promotionalShippingCostVal !== null && promotionalShippingCostVal === 0)) {
                $methodPrice.text(freeTextID);
            }
        }
    });

    $('body').trigger('shipping:updateShippingSummaryInformation', { shipping: shipping, order: order });
}
/**
 * Update the shipping UI for a single shipping info (shipment model)
 * @param {Object} shipping - the shipping (shipment model) model
 * @param {Object} order - the order/basket model
 * @param {Object} customer - the customer model
 * @param {Object} [options] - options for updating PLI summary info
 * @param {Object} [options.keepOpen] - if true, prevent changing PLI view mode to 'view'
 */
function updateShippingInformation(shipping, order, customer, options) {
    // First copy over shipmentUUIDs from response, to each PLI form
    order.shipping.forEach(function (aShipping) {
        aShipping.productLineItems.items.forEach(function (productLineItem) {
            shippingHelpersCore.methods.updateProductLineItemShipmentUUIDs(productLineItem, aShipping);
        });
    });

    // Now update shipping information, based on those associations
    shippingHelpersCore.methods.updateShippingMethods(shipping);
    updateShippingAddressFormValues(shipping);
    updateShippingSummaryInformation(shipping, order);

    // And update the PLI-based summary information as well
    shipping.productLineItems.items.forEach(function (productLineItem) {
        // Commented as part of BOPIS MuiltiShipment Scenario, Since its overriding UA customization with SFRA behaviour.
        // updateShippingAddressSelector(productLineItem, shipping, order, customer);
        shippingHelpersCore.methods.updatePLIShippingSummaryInformation(productLineItem, shipping, order, options);
    });

    $('body').trigger('shipping:updateShippingInformation', {
        order: order,
        shipping: shipping,
        customer: customer,
        options: options
    });
}

/**
 * Clear out all the shipping form values and select the new address in the drop down
 * @param {Object} order - the order object
 */
function clearShippingForms(order) {
    order.shipping.forEach(function (shipping) {
        $('input[value=' + shipping.UUID + ']').each(function (formIndex, el) {
            var form = el.form;
            if (!form) return;

            $('input[name$=_firstName]', form).val('');
            $('input[name$=_lastName]', form).val('');
            $('input[name$=_address1]', form).val('');
            $('input[name$=_address2]', form).val('');
            $('input[name$=_city]', form).val('');
            $('input[name$=_district]', form).val('');
            $('input[name$=_postalCode]', form).val('');
            $('input[name$=_stateCode]', form).val('');
            // $('select[name$=_country]', form).val('');

            $('select[name$=_stateCode]').val($('select[name$=_stateCode] option:first').val());
            $('select[name$=_postalCode]').val($('select[name$=_postalCode] option:first').val());
            $('select[name$=_city]').val($('select[name$=_city] option:first').val());

            $('input[name$=_phone]', form).val('');

            $('input[name$=_isGift]', form).prop('checked', false);
            $('textarea[name$=_giftMessage]', form).val(''); // eslint-disable-line
            $(form).find('.gift-message').addClass('d-none');

            $(form).attr('data-address-mode', 'new');
            var addressSelectorDropDown = $('.addressSelector option[value=new]', form);
            $(addressSelectorDropDown).prop('selected', true);
        });
    });

    $('body').trigger('shipping:clearShippingForms', { order: order });
}

/**
 * to check value is inside select option list or not
 * @param {Object} select - select dom element
 * @param {string} value - value to check
 * @returns {boolean} value is on select option list or not
 */
function dropDownValuecheck(select, value) {
    var isIN = select.find('option[value="' + value + '"]').length;
    var result = false;

    if (isIN > 0) {
        result = true;
    }

    return result;
}

/**
 * Single shipping address event handler
 * @param {Object} scope event trigger subject
 * @returns {void}
 */
function singleShippingAddressSelect(scope) {
    var form = $(scope).parents('form')[0];
    var selectedOption = $(scope);
    var postCodeVal;
    var attrs = selectedOption.data();
    var shipmentUUID = $(selectedOption[0]).attr('value');
    var originalUUID = $('input[name=shipmentUUID]', form).val();
    var element;
    var $shippingAddressBlock = $(form).find('.shipping-address-block');
    if (!(selectedOption.hasClass('shipping-address-section-new'))) {
        $('.shipping-address-section').removeClass('default-address');
        $(scope).closest('.shipping-address-section').addClass('default-address');
    }
    Object.keys(attrs).forEach(function (attr) {
        element = attr === 'countryCode' ? 'country' : attr;
        if ($('[name$=' + element + ']', form).is('select')) {
            if (element !== 'stateCode') {
                $('[name$=' + element + ']', form).val(attrs[attr]).trigger('change');
            }
            if (element === 'postalCode') {
                postCodeVal = attrs[attr];
            }
            if (element === 'stateCode') {
                $('[name$=' + element + ']', form).val(attrs[attr]);
            }
        } else {
            if (element === 'state') {
                $('[name$=' + element + ']', form).val(attrs.stateCode);
            } else {
                $('[name$=' + element + ']', form).val(attrs[attr]);
            }
        }
    });

    if ($('#shippingZipCodedefault').val() === null || $('#shippingZipCodedefault').val() === '') {
        $('#shippingZipCodedefault').empty().append($('<option value="' + postCodeVal + '"></option>').html(postCodeVal));
    }

    if (!(selectedOption.hasClass('shipping-address-section-new'))) {
        $('.shipping-address-section').removeClass('default-address');
        $(scope).closest('.shipping-address-section').addClass('default-address');
    }

    if (shipmentUUID === 'new') {
        $(form).attr('data-address-mode', 'new');
        // clear field values when in add mode
        addressAPAC.methods.clearValuesOnAddMode();
    } else if (shipmentUUID === originalUUID) {
        $(form).attr('data-address-mode', 'shipment');
    } else if (shipmentUUID.indexOf('ab_') === 0) {
        if (window.sitePreferences && window.sitePreferences.isKRCustomCheckoutEnabled && $('form.shipping-form').attr('data-validation-error') === 'error') {
            $(form).attr('data-address-mode', 'details');
            var phone1 = $(form).find('#phone1');
            var phone1Val = $('.default-address .shipping-address-option').attr('data-phone1');
            var valInDropDown = dropDownValuecheck(phone1, phone1Val);
            if (!valInDropDown) {
                phone1.val('').change();
            }
        } else {
            $(form).attr('data-address-mode', 'customer');
        }
    } else {
        $(form).attr('data-address-mode', 'edit');
    }

    if ($('form.shipping-form').attr('data-validation-error') !== 'error') {
        $shippingAddressBlock.find('input, select').removeClass('is-invalid');
        $shippingAddressBlock.find('.form-group').removeClass('error-field');
        $shippingAddressBlock.find('.invalid-feedback').empty();
    }

    if (window.sitePreferences && window.sitePreferences.isKRCustomCheckoutEnabled) {
        $('form.shipping-form').attr('data-validation-error', 'no-error');
        var phone1Sel = $(form).find('#phone1');
        var phone1SelVal = $('.default-address .shipping-address-option').attr('data-phone1');
        var phone2Sel = $(form).find('#phone2');
        var phone2SelVal = $('.default-address .shipping-address-option').attr('data-phone2');
        var phone3Sel = $(form).find('#phone3');
        var phone3SelVal = $('.default-address .shipping-address-option').attr('data-phone3');

        var valInDropDownSel = dropDownValuecheck(phone1Sel, phone1SelVal);
        if (!valInDropDownSel) {
            phone1Sel.val('').change();
        } else {
            phone1Sel.val(phone1SelVal).change();
        }

        phone2Sel.val(phone2SelVal);
        phone3Sel.val(phone3SelVal);
    }

    if ($('.employee-address-selector').length > 0) {
        $('body').trigger('shipping:updateShipToOfficeView');
        $('.js-shipto-office-error').addClass('hide');
    }

    var selectOption = $('.selectLabel').val();

    if (!(selectedOption.hasClass('shipping-address-section-new'))) {
        $('[name$=stateCode]', form).trigger('change');
    } else {
        $('input[name$=_district]', form).val('');
        $('[name$=postalCode]').empty();
        $('select[name$=postalCode]').val(selectOption);
        $('[name$=postalCode]').append($('<option value></option>').html(selectOption));
        if ($('select[name$=stateCode] option[value=" + selectOption + "]').length) {
            $('[name$=stateCode]').prepend($('<option value></option>').html(selectOption));
        }
    }

    if (!($('#hal-postal-code', form).length > 0 && $('#hal-postal-code', form).is(':visible'))) {
        $('#hal-postal-code', form).val('');
    }
}

var debouncedShippingAddressSelect = debounce(singleShippingAddressSelect, 500);

/**
 * Update list of available shipping methods whenever user modifies shipping address details.
 * @param {jQuery} $shippingForm - current shipping form
 */
function updateShippingMethodList($shippingForm) {
    // delay for autocomplete!
    setTimeout(function () {
        var $shippingMethodList = $shippingForm.find('.shipping-method-list');
        var urlParams = addressAPAC.methods.getAddressFieldsFromUI($shippingForm);
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
 * Handle response from the server for valid or invalid form fields.
 * @param {Object} defer - the deferred object which will resolve on success or reject.
 * @param {Object} data - the response data with the invalid form fields or
 *  valid model data.
 */
function shippingFormResponse(defer, data) {
    var isMultiShip = $('#checkout-main').hasClass('multi-ship');
    var isShipToCollectionEnabled = $('#ship-to-collectionPoint').is(':checked');
    var formSelector = isMultiShip
        ? '.multi-shipping .active form'
        : '.single-shipping form';

    // highlight fields with errors
    if (data.error) {
        if (data.fieldErrors.length) {
            data.fieldErrors.forEach(function (error) {
                if (Object.keys(error).length) {
                    formHelpers.loadFormErrors(formSelector, error);
                }
            });
            defer.reject(data);
        }

        if (data.serverErrors && data.serverErrors.length) {
            $.each(data.serverErrors, function (index, element) {
                shippingHelpersCore.createErrorNotification(element);
            });

            defer.reject(data);
        }

        if (data.cartError) {
            window.location.href = data.redirectUrl;
            defer.reject();
        }
    } else if (window.sitePreferences.AddressVerificationEnabled && window.AddressVerificationCountryEnabled && !(window.addressVerificationDone) && ((!isMultiShip && !isShipToCollectionEnabled) || isMultiShip) && !data.order.isOfficeAddress) {
        $('body').trigger('qas:AddressValidation');
    } else {
        window.addressVerificationDone = false;
        // Populate the Address Summary

        $('body').trigger('checkout:updateCheckoutView', {
            order: data.order,
            customer: data.customer
        });
        setTimeout(function () {
            if (!(window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments())) {
                if (!window.ApplePaySession) {
                    var scrollAnimate = require('org/components/scrollAnimate');
                    scrollAnimate($('.js-payment-form-info'));
                }
            }
        }, 300);
        defer.resolve(data);
    }
}

module.exports = {
    methods: {
        updateShippingAddressFormValues: updateShippingAddressFormValues,
        updateShippingInformation: updateShippingInformation,
        clearShippingForms: clearShippingForms,
        updateShippingSummaryInformation: updateShippingSummaryInformation,

        updateShippingAddressSelector: shippingHelpersCore.updateShippingAddressSelector,
        updateShippingMethods: shippingHelpersCore.updateShippingMethods,
        updatePLIShippingSummaryInformation: shippingHelpersCore.updatePLIShippingSummaryInformation,
        updateProductLineItemShipmentUUIDs: shippingHelpersCore.updateProductLineItemShipmentUUIDs,
        updateMultiShipInformation: shippingHelpersCore.updateMultiShipInformation,
        shippingFormResponse: shippingFormResponse,
        createNewShipment: shippingHelpersCore.createNewShipment,
        selectShippingMethodAjax: shippingHelpersCore.selectShippingMethodAjax,
        updateShippingMethodList: updateShippingMethodList,
        editMultiShipAddress: shippingHelpersCore.editMultiShipAddress,
        editOrEnterMultiShipInfo: shippingHelpersCore.editOrEnterMultiShipInfo,
        createErrorNotification: shippingHelpersCore.createErrorNotification,
        viewMultishipAddress: shippingHelpersCore.viewMultishipAddress // eslint-disable-line
    },
    disablePaymentButton: shippingHelpersCore.disablePaymentButton,
    selectSingleShipping: shippingHelpersCore.selectSingleShipping,
    deleteShippingAddress: shippingHelpersCore.deleteShippingAddress,
    showDeleteShippingAddressModal: shippingHelpersCore.showDeleteShippingAddressModal,
    updateDataAddressMode: shippingHelpersCore.updateDataAddressMode,
    employeeCheckout: shippingHelpersCore.employeeCheckout,
    selectShippingMethod: shippingHelpersCore.selectShippingMethod,

    updateShippingList: function () {
        var baseObj = this;

        $('select[name$="shippingAddress_addressFields_states_stateCode"]').on('change', function (e) {
            if (baseObj.methods && baseObj.methods.updateShippingMethodList) {
                baseObj.methods.updateShippingMethodList($(e.currentTarget.form));
            } else {
                updateShippingMethodList($(e.currentTarget.form));
            }
        });

        $('input[name$="shippingAddress_addressFields_address1"]').on('change', function (e) {
            if (!($('.address-picklist-container').length > 0 && $('.address-picklist-container').find('.selected').length > 0)) {
                if (baseObj.methods && baseObj.methods.updateShippingMethodList) {
                    baseObj.methods.updateShippingMethodList($(e.currentTarget.form));
                } else {
                    updateShippingMethodList($(e.currentTarget.form));
                }
            }
        });

        $('input[name$="shippingAddress_addressFields_address2"]').on('change', function (e) {
            if (!($('.address-picklist-container').length > 0 && $('.address-picklist-container').find('.selected').length > 0)) {
                if (baseObj.methods && baseObj.methods.updateShippingMethodList) {
                    baseObj.methods.updateShippingMethodList($(e.currentTarget.form));
                } else {
                    updateShippingMethodList($(e.currentTarget.form));
                }
            }
        });

        $('body').on('mouseenter', '.address-picklist div', function () {
            $('body').find('.address-picklist-container .address-picklist div').removeClass('selected');
            $(this).addClass('selected');
        });
    },

    cancelMultiShipAddress: function () {
        var baseObj = this;

        $('.btn-cancel-multi-ship-address').on('click', function (e) {
            e.preventDefault();

            var form = $(this).closest('form');
            var $rootEl = $(this).closest('.shipping-content');
            var restoreState = $rootEl.data('saved-state');

            // Should clear out changes / restore previous state
            if (restoreState) {
                var restoreStateObj = JSON.parse(restoreState);
                var originalStateCode = restoreStateObj.shippingAddress.stateCode;
                var stateCode = $('[name$=_stateCode]', form).val();

                if (baseObj.methods && baseObj.methods.updateShippingAddressFormValues) {
                    baseObj.methods.updateShippingAddressFormValues(restoreStateObj);
                } else {
                    updateShippingAddressFormValues(restoreStateObj);
                }

                if (stateCode !== originalStateCode) {
                    $('[data-action=save]', form).trigger('click');
                } else {
                    $(form).attr('data-address-mode', 'edit');
                    if (baseObj.methods && baseObj.methods.editMultiShipAddress) {
                        baseObj.methods.editMultiShipAddress($rootEl);
                    } else {
                        shippingHelpersCore.methods.editMultiShipAddress($rootEl);
                    }
                }
            }

            return false;
        });
    },

    updateShippingAddress: function () {
        $('.shipping-save-button').on('click', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $form = $this.closest('form');
            var addressID = $form.attr('data-addr-ID');
            var url = $(this).attr('data-action-url') + '?addressId=' + addressID;
            clientSideValidation.checkMandatoryField($form);
            if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
                // Data Validations - PO BOX / apo / cpo / special characters
                clientSideValidationAPAC.validateFields($this);
                if ($form.find('input.is-invalid').length) {
                    return;
                }

                $this.closest('.shipping-address-block').spinner().start();
                // QAS Address validation
                if (window.sitePreferences.AddressVerificationEnabled && window.AddressVerificationCountryEnabled && !(window.addressVerificationDone) && typeof e.isTrigger === 'undefined') {
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
                            $.spinner().stop();
                        }

                        addressID = typeof data.address !== 'undefined' ? data.address.ID : '';
                        var editLink = $('input.editAddrURL').val();
                        var deleteLabel = $('input.deleteLabel').val();
                        var editLabel = $('input.editLabel').val();
                        $form.find('.shipping-address-section').removeClass('default-address');
                        if (data.newAddress) {
                            var newDiv = `<div class='shipping-address-section default-address'>
                                <div class='shipping-address-option' value="ab_${addressID}" data-addr-id="${addressID}" 
                                data-first-name="" data-last-name="" data-business-name="" data-address1="" 
                                data-address2="" data-suburb="" data-district="" data-city="e" data-state-code="" data-state="" data-country-code="" data-postal-code="02138" data-phone="" 
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

                        var addressLi = '';
                        $(selectedAddr).attr('data-first-name', (data.address.firstName || ''));
                        if (!data.isShowOnlyLastNameAsNameFieldEnabled) {
                            addressLi += '<span>' + (data.address.firstName || '') + ' ' + '</span>'; // eslint-disable-line
                        }
                        $(selectedAddr).attr('data-last-name', (data.address.lastName || ''));
                        addressLi += '<span>' + (data.address.lastName || '') + '</span>';
                        $(selectedAddr).attr('data-business-name', (data.address.businessName || ''));
                        addressLi += '<span>' + (data.address.businessName ? ' ' + data.address.businessName : '') + '</span>';
                        $(selectedAddr).attr('data-address1', (data.address.address1 || ''));
                        addressLi += '<div>' + (data.address.address1 || '') + '</div>';
                        if (data.address.address2 !== null && data.address.address2) {
                            $(selectedAddr).attr('data-address2', data.address.address2);
                            addressLi += '<div>' + data.address.address2 + '</div>';
                        }
                        $(selectedAddr).attr('data-suburb', (data.address.suburb || ''));
                        addressLi += (data.address.suburb ? data.address.suburb + ', ' : '');
                        if (data.address.district !== null && data.address.district) {
                            $(selectedAddr).attr('data-district', (data.address.district || ''));
                            addressLi += (data.address.district + ',' || '') + '';
                        }
                        var country = $('#billingCountry').val();
                        if (country !== 'AU') {
                            $(selectedAddr).attr('data-city', (data.address.city || ''));
                            if (data.address.cityLabel) {
                                addressLi += (data.address.cityLabel ? data.address.cityLabel + ', ' : '');
                            } else if (!data.address.hideCityAndPostalCode) {
                                addressLi += (data.address.city ? data.address.city + ', ' : '');
                            }
                        }
                        if (country !== 'NZ') {
                            $(selectedAddr).attr('data-state-code', (data.address.stateCode || ''));
                            addressLi += (data.address.stateCodeLabel ? data.address.stateCodeLabel : data.address.stateCode || '') + ' ';
                        }
                        $(selectedAddr).attr('data-postal-code', (data.address.postalCode || ''));
                        if (!data.address.hideCityAndPostalCode) {
                            addressLi += (data.address.postalCode || '');
                        }
                        $(selectedAddr).attr('data-phone1', (data.address.phone1 || ''));
                        $(selectedAddr).attr('data-phone2', (data.address.phone2 || ''));
                        $(selectedAddr).attr('data-phone3', (data.address.phone3 || ''));
                        $(selectedAddr).attr('data-phone', (data.address.phone || ''));
                        if (data.locale === 'ko_KR' && data.address.phone !== null && data.address.phone) {
                            addressLi += '<div>' + data.address.phone + '</div>';
                            $('#phone1').val(data.address.phone1).change();
                            $('#phone2').val(data.address.phone2);
                            $('#phone3').val(data.address.phone3);
                            $('form.shipping-form').attr('data-validation-error', 'no-error');
                        }
                        $(selectedAddr).html(addressLi);
                        $(selectedAddr).attr('data-country-code', (data.address.countryCode.value || ''));
                        form.attr('data-address-mode', 'edit');
                        if (form.find('.btn-add-new').hasClass('disabled')) {
                            form.find('.btn-add-new').removeClass('disabled');
                        }
                        window.addressVerificationDone = false;
                        $.spinner().stop();
                    }
                });
            }
            return;
        });
    },

    selectSingleShipAddress: function () {
        $('body').on('click', '.single-shipping .addressSelector .shipping-address-option', function (e) {
            debouncedShippingAddressSelect(this, e);
        });
    },

    cancelShippingAddress: function () {
        $('.shipping-cancel-button').on('click', function () {
            var form = $(this).closest('form');
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
    },

    selectMultiShipAddress: function () {
        var baseObj = this;

        $('body').on('click', '.multi-shipping .addressSelector .shipping-address-option', function () {
            var form = $(this).closest('form');
            var selectedOption = $(this);
            var attrs = selectedOption.data();
            var shipmentUUID = $(selectedOption[0]).attr('value');
            var originalUUID = $('input[name=shipmentUUID]', form).val();
            var pliUUID = $('input[name=productLineItemUUID]', form).val();
            var createNewShipmentScoped = baseObj.methods && baseObj.methods.createNewShipment ? baseObj.methods.createNewShipment : shippingHelpersCore.createNewShipment;

            var element;
            Object.keys(attrs).forEach(function (attr) {
                if (attr === 'isGift') {
                    $('[name$=' + attr + ']', form).prop('checked', attrs[attr]);
                    $('[name$=' + attr + ']', form).trigger('change');
                } else {
                    element = attr === 'countryCode' ? 'country' : attr;
                    if ($('[name$=' + element + ']', form).is('select')) {
                        $('[name$=' + element + ']', form).val(attrs[attr]).trigger('change');
                    } else {
                        $('[name$=' + element + ']', form).val(attrs[attr]);
                    }
                }
            });

            if (!(selectedOption.hasClass('shipping-address-section-new'))) {
                $('[name$=stateCode]', form).trigger('change');

                $('.shipping-address-section').removeClass('default-address');
                $(this).closest('.shipping-address-section').addClass('default-address');
            }

            if ($(this).hasClass('shipping-address-section-new')) {
                $(form).attr('data-address-mode', 'new');
            } else if (shipmentUUID === 'new' && pliUUID) {
                var createShipmentUrl = $(this).parent('.addressSelector').attr('data-create-shipment-url');
                createNewShipmentScoped(createShipmentUrl, { productLineItemUUID: pliUUID })
                    .done(function (response) {
                        $.spinner().stop();
                        if (response.error) {
                            if (response.redirectUrl) {
                                window.location.href = response.redirectUrl;
                            }
                            return;
                        }

                        $('body').trigger('checkout:updateCheckoutView',
                            {
                                order: response.order,
                                customer: response.customer,
                                options: { keepOpen: true }
                            }
                        );

                        $(form).attr('data-address-mode', 'new');
                    })
                    .fail(function () {
                        $.spinner().stop();
                    });
            } else if (shipmentUUID === originalUUID) {
                $('select[name$=stateCode]', form).trigger('change');
                $(form).attr('data-address-mode', 'shipment');
            } else if (shipmentUUID.indexOf('ab_') === 0) {
                var url = $(form).attr('action');
                var serializedData = $(form).serialize();
                createNewShipmentScoped(url, serializedData)
                    .done(function (response) {
                        $.spinner().stop();
                        if (response.error) {
                            if (response.redirectUrl) {
                                window.location.href = response.redirectUrl;
                            }
                            return;
                        }

                        $('body').trigger('checkout:updateCheckoutView',
                            {
                                order: response.order,
                                customer: response.customer,
                                options: { keepOpen: true }
                            }
                        );

                        $(form).attr('data-address-mode', 'customer');
                        var $rootEl = $(form).closest('.shipping-content');
                        shippingHelpersCore.methods.editMultiShipAddress($rootEl);
                    })
                    .fail(function () {
                        $.spinner().stop();
                    });
            } else {
                var updatePLIShipmentUrl = $(form).attr('action');
                var serializedAddress = $(form).serialize();
                createNewShipmentScoped(updatePLIShipmentUrl, serializedAddress)
                    .done(function (response) {
                        $.spinner().stop();
                        if (response.error) {
                            if (response.redirectUrl) {
                                window.location.href = response.redirectUrl;
                            }
                            return;
                        }

                        $('body').trigger('checkout:updateCheckoutView',
                            {
                                order: response.order,
                                customer: response.customer,
                                options: { keepOpen: true }
                            }
                        );

                        $(form).attr('data-address-mode', 'edit');
                    })
                    .fail(function () {
                        $.spinner().stop();
                    });
            }
        });
    }
};

