'use strict';

var addressHelpers = require('./address');
var formHelpers = require('./formErrors');
var scrollAnimate = require('../components/scrollAnimate');
var addressSuggestionHelpers = require('./qasAddressSuggesstion');
var clientSideValidation = require('../components/common/clientSideValidation');
var debounce = require('lodash/debounce');

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
        $shippingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
            null,
            false,
            order
        ));

        if (customer.addresses && customer.addresses.length > 0) {
            $shippingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
                order.resources.accountAddresses,
                false,
                order
            ));

            customer.addresses.forEach(function (address) {
                var isSelected = shipping.matchingAddressId === address.ID;
                $shippingAddressSelector.append(
                    addressHelpers.methods.optionValueForAddress(
                        { UUID: 'ab_' + address.ID, shippingAddress: address },
                        isSelected,
                        order
                    )
                );
            });
        }
        // Separator -
        $shippingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
            order.resources.shippingAddresses, false, order, { className: 'multi-shipping' }
        ));
        shippings.forEach(function (aShipping) {
            var isSelected = shipping.UUID === aShipping.UUID;
            hasSelectedAddress = hasSelectedAddress || isSelected;
            var addressOption = addressHelpers.methods.optionValueForAddress(
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
        addressObject.city ? $('input[name$=_city]', form).val(addressObject.city) : $('input[name$=_city]', form).val(); // eslint-disable-line
        addressObject.postalCode ? $('input[name$=_postalCode]:first', form).val(addressObject.postalCode) : $('input[name$=_postalCode]:first', form).val(); // eslint-disable-line
        addressObject.stateCode ? $('select[name$=_stateCode],input[name$=_stateCode]', form) // eslint-disable-line
            .val(addressObject.stateCode) : $('select[name$=_stateCode],input[name$=_stateCode]', form)
                .val();

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
 * updates the shipping method radio buttons within shipping forms
 * @param {Object} shipping - the shipping (shipment model) model
 * @param {Object} order - the order model
 */
function updateShippingMethods(shipping, order) {
    var uuidEl = $('input[value=' + shipping.UUID + ']');
    if (uuidEl && uuidEl.length > 0) {
        $.each(uuidEl, function (shipmentIndex, el) {
            var form = el.form;
            if (!form) return;

            var $shippingMethodList = $('.shipping-method-list', form);
            $('.b-shipping-method_sub-heading.d-none').removeClass('d-none');
            if (shipping.selectedShippingMethod) $('.b-shipping-method_sub-heading').addClass('d-none');
            if ($shippingMethodList && $shippingMethodList.length > 0) {
                $shippingMethodList.empty();
                var shippingMethods = shipping.applicableShippingMethods;
                var selected = shipping.selectedShippingMethod || {};
                var shippingMethodFormID = form.name + '_shippingAddress_shippingMethodID';

                //
                // Create the new rows for each shipping method
                //
                $.each(shippingMethods, function (methodIndex, shippingMethod) {
                    var tmpl = $('#shipping-method-template').clone();
                    var shippingCostVal = shippingMethod.shippingCost;
                    var shippingCostID = $('.shippingCostID').val();
                    var freeTextID = $('.freeTextID').val();
                    var isPreOrder = $('.shipping-method-list').data('is-preorder');

                    if (shippingMethod.ID === 'shoprunner' && isPreOrder === true) return;


                    // set analytics
                    $('.b-shipping-method_column', tmpl)
                        .attr('data-analytics-track', 'shipping option : ' + shippingMethod.ID);
                    if (shippingMethod.ID === 'standard-usps-pob') {
                        selected = {
                            ID: 'standard-usps-pob',
                            selected: true
                        };
                    }
                    // set input
                    $('input.b-shipping-method_input', tmpl)
                        .prop('id', 'shippingMethod-' + shippingMethod.ID + '-' + shipping.UUID)
                        .prop('name', shippingMethodFormID)
                        .prop('value', shippingMethod.ID)
                        .attr('checked', shippingMethod.ID === selected.ID)
                        .attr('data-pickup', shippingMethod.storePickupEnabled);

                    $('label', tmpl)
                        .prop('for', 'shippingMethod-' + shippingMethod.ID + '-' + shipping.UUID);
                    // set shipping method name
                    $('.display-name', tmpl).text(shippingMethod.displayName);
                    // set or hide arrival time
                    if (shippingMethod.shippingDeliveryDates) {
                        $('.display-name-delivery', tmpl).text('วันที่ได้รับสินค้า').show();
                        $('.arrival-time', tmpl)
                            .text(shippingMethod.shippingDeliveryDates)
                            .show();
                    }
                    // set shipping cost
                    $('.shipping-method-cost', tmpl).text(shippingCostVal);
                    if (shippingCostVal === shippingCostID || (order && order.totals.shippingLevelDiscountTotal.value === shippingMethod.shippingCostVal)) {
                        $('.shipping-method-cost', tmpl).text(freeTextID);
                    }
                    if (shippingMethod.selected === selected.selected) {
                        $('.b-shipping-method_column', tmpl).addClass('selected');
                    } else {
                        $('.b-shipping-method_column', tmpl).removeClass('selected');
                    }
                    if (shippingMethod.ID === 'shoprunner' || shippingMethod.ID === 'shoprunner_HAL') {
                        $('.b-shipping-method_column', tmpl).addClass('sr-shipping-method-content');
                    }
                    $shippingMethodList.append(tmpl.html());
                });
            }
        });
    }

    $('body').trigger('shipping:updateShippingMethods', { shipping: shipping, order: order });
}

/**
 * Update list of available shipping methods whenever user modifies shipping address details.
 * @param {jQuery} $shippingForm - current shipping form
 */
function updateShippingMethodList($shippingForm) {
    // delay for autocomplete!
    setTimeout(function () {
        var $shippingMethodList;
        if ($shippingForm.find('.shipping-method-list').length) {
            $shippingMethodList = $shippingForm.find('.shipping-method-list');
        } else if ($shippingForm.find('.b-shipping-method.shipping-method-block #paazl-checkout').length) {
            $shippingMethodList = $shippingForm.find('.b-shipping-method.shipping-method-block #paazl-checkout');
        }
        var urlParams = addressHelpers.methods.getAddressFieldsFromUI($shippingForm);
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
        var giftMessageSummary = $container.find('.gift-summary');

        var address = shipping.shippingAddress;
        var selectedShippingMethod = shipping.selectedShippingMethod;
        var isGift = shipping.isGift;
        var shippingCostID = $('.shippingCostID').val();
        var freeTextID = $('.freeTextID').val();
        var shippingCostVal;
        var promotionalShippingCostVal;

        var primaryContact = JSON.parse(shipping.productLineItems.items[0].custom.primaryContactBOPIS);
        var secondaryContact = JSON.parse(shipping.productLineItems.items[0].custom.secondaryContactBOPIS);
        var tmpl = $('#pickup-information-data').clone();

        $addressContainer.find('.pickup-primary-contact').remove();
        $addressContainer.find('.pickup-primary-contact-text').remove();
        $addressContainer.find('.pickup-secondary-contact').remove();
        $addressContainer.find('.pickup-secondary-contact-text').remove();

        if (primaryContact
            && primaryContact.firstName
            && primaryContact.lastName
            && primaryContact.phone
            && primaryContact.email) {
            $('.ship-to-primary-firstname', tmpl).text(primaryContact.firstName);
            $('.ship-to-primary-lastname', tmpl).text(primaryContact.lastName);
            $('.ship-to-primary-email', tmpl).text(primaryContact.email);
            $('.ship-to-primary-number', tmpl).text(primaryContact.phone);
        } else {
            $('.pickup-primary-contact', tmpl).hide();
            $('.pickup-primary-contact-text', tmpl).hide();
        }

        if (secondaryContact
            && secondaryContact.firstName
            && secondaryContact.lastName
            && secondaryContact.phone
            && secondaryContact.email) {
            $('.ship-to-secondary-firstname', tmpl).text(secondaryContact.firstName);
            $('.ship-to-secondary-lastname', tmpl).text(secondaryContact.lastName);
            $('.ship-to-secondary-email', tmpl).text(secondaryContact.email);
            $('.ship-to-secondary-number', tmpl).text(secondaryContact.phone);
        } else {
            $('.pickup-secondary-contact', tmpl).hide();
            $('.pickup-secondary-contact-text', tmpl).hide();
        }

        addressHelpers.methods.populateAddressSummary($addressContainer, address);

        $addressContainer.append(tmpl.html());

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
            if (shippingCostVal === shippingCostID || (order && order.totals.shippingLevelDiscountTotal.value === selectedShippingMethod.shippingCostVal) ||
                (promotionalShippingCostVal !== undefined && promotionalShippingCostVal !== null && promotionalShippingCostVal === 0)) {
                $methodPrice.text(freeTextID);
            }
        }

        if (isGift) {
            giftMessageSummary.find('.gift-message-summary').text(shipping.giftMessage);
            giftMessageSummary.removeClass('hide');
        } else {
            giftMessageSummary.addClass('hide');
        }
    });

    $('body').trigger('shipping:updateShippingSummaryInformation', { shipping: shipping, order: order });
}

/**
 * Update the read-only portion of the shipment display (per PLI)
 * @param {Object} productLineItem - the productLineItem model
 * @param {Object} shipping - the shipping (shipment model) model
 * @param {Object} order - the order model
 * @param {Object} [options] - options for updating PLI summary info
 * @param {Object} [options.keepOpen] - if true, prevent changing PLI view mode to 'view'
 */
function updatePLIShippingSummaryInformation(productLineItem, shipping, order, options) {
    var $pli = $('input[value=' + productLineItem.UUID + ']');
    var form = $pli && $pli.length > 0 ? $pli[0].form : null;

    if (!form) return;

    var $viewBlock = $('.view-address-block', form);

    var address = shipping.shippingAddress || {};
    var selectedMethod = shipping.selectedShippingMethod;

    var nameLine;
    if (shipping.storeName) {
        nameLine = shipping.storeName;
    } else {
        nameLine = address.firstName ? address.firstName + ' ' : '';
        if (address.lastName) nameLine += address.lastName;
    }

    var address1Line = address.address1;
    var address2Line = address.address2;

    var phoneLine = address.phone;

    var shippingCost = selectedMethod ? selectedMethod.shippingCost : '';
    var methodNameLine = selectedMethod ? selectedMethod.displayName : '';
    var methodArrivalTime = selectedMethod && selectedMethod.estimatedArrivalTime
        ? '(' + selectedMethod.estimatedArrivalTime + ')'
        : '';

    var tmpl = $('#pli-shipping-summary-template').clone();

    var primaryContact = JSON.parse(productLineItem.custom.primaryContactBOPIS);
    var secondaryContact = JSON.parse(productLineItem.custom.secondaryContactBOPIS);

    // Updating Quantity
    $pli.closest('.card').find('.qty-card-quantity-count').text(productLineItem.quantity);

    // Updating Price
    $pli.closest('.card').find('.line-item-total-price-amount').text(productLineItem.price.sales.formatted + ' x ' + productLineItem.quantity);

    if (primaryContact
        && primaryContact.firstName
        && primaryContact.lastName
        && primaryContact.phone
        && primaryContact.email) {
        $('.ship-to-primary-firstname', tmpl).text(primaryContact.firstName);
        $('.ship-to-primary-lastname', tmpl).text(primaryContact.lastName);
        $('.ship-to-primary-email', tmpl).text(primaryContact.email);
        $('.ship-to-primary-number', tmpl).text(primaryContact.phone);
    } else {
        $('.pickup-primary-contact', tmpl).hide();
        $('.pickup-primary-contact-text', tmpl).hide();
    }

    if (secondaryContact
        && secondaryContact.firstName
        && secondaryContact.lastName
        && secondaryContact.phone
        && secondaryContact.email) {
        $('.ship-to-secondary-firstname', tmpl).text(secondaryContact.firstName);
        $('.ship-to-secondary-lastname', tmpl).text(secondaryContact.lastName);
        $('.ship-to-secondary-email', tmpl).text(secondaryContact.email);
        $('.ship-to-secondary-number', tmpl).text(secondaryContact.phone);
    } else {
        $('.pickup-secondary-contact', tmpl).hide();
        $('.pickup-secondary-contact-text', tmpl).hide();
    }

    $('.ship-to-name', tmpl).text(nameLine);
    $('.ship-to-address1', tmpl).text(address1Line);
    $('.ship-to-address2', tmpl).text(address2Line);
    $('.ship-to-city', tmpl).text(address.city);
    if (address.stateCode) {
        $('.ship-to-st', tmpl).text(address.stateCode);
    }
    $('.ship-to-zip', tmpl).text(address.postalCode);
    $('.ship-to-phone', tmpl).text(phoneLine);

    if (!address2Line) {
        $('.ship-to-address2', tmpl).hide();
    }

    if (!phoneLine) {
        $('.ship-to-phone', tmpl).hide();
    }

    var shippingCostID = $('.shippingCostID').val();
    var freeTextID = $('.freeTextID').val();

    if (shipping.selectedShippingMethod) {
        $('.display-name', tmpl).text(methodNameLine);
        $('.arrival-time', tmpl).text(methodArrivalTime);
        $('.price', tmpl).text(shippingCost);

        if (shippingCostID === shippingCost) {
            $('.price', tmpl).text(freeTextID);
        }
    }

    if (shipping.isGift) {
        $('.gift-message-summary', tmpl).text(shipping.giftMessage);
        var shipment = $('.gift-message-' + shipping.UUID);
        $(shipment).val(shipping.giftMessage);
    } else {
        $('.gift-summary', tmpl).addClass('hide');
    }
    // checking h5 title shipping to or pickup
    var $shippingAddressLabel = $('.shipping-header-text', tmpl);
    if (selectedMethod) {
        $('body').trigger('shipping:updateAddressLabelText',
            { selectedShippingMethod: selectedMethod, resources: order.resources, shippingAddressLabel: $shippingAddressLabel });
    }
    $viewBlock.html(tmpl.html());

    $('body').trigger('shipping:updatePLIShippingSummaryInformation', {
        productLineItem: productLineItem,
        shipping: shipping,
        order: order,
        options: options
    });
}

/**
 * Update the hidden form values that associate shipping info with product line items
 * @param {Object} productLineItem - the productLineItem model
 * @param {Object} shipping - the shipping (shipment model) model
 */
function updateProductLineItemShipmentUUIDs(productLineItem, shipping) {
    $('input[value=' + productLineItem.UUID + ']').each(function (key, pli) {
        var form = pli.form;
        $('[name=shipmentUUID]', form).val(shipping.UUID);
        $('[name=originalShipmentUUID]', form).val(shipping.UUID);

        $(form).closest('.card').attr('data-shipment-uuid', shipping.UUID);
    });

    $('body').trigger('shipping:updateProductLineItemShipmentUUIDs', {
        productLineItem: productLineItem,
        shipping: shipping
    });
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
            updateProductLineItemShipmentUUIDs(productLineItem, aShipping);
        });
    });

    // Now update shipping information, based on those associations
    updateShippingMethods(shipping, order);
    updateShippingAddressFormValues(shipping);
    updateShippingSummaryInformation(shipping, order);

    // And update the PLI-based summary information as well
    shipping.productLineItems.items.forEach(function (productLineItem) {
        // Commented as part of BOPIS MuiltiShipment Scenario, Since its overriding UA customization with SFRA behaviour.
        // updateShippingAddressSelector(productLineItem, shipping, order, customer);
        updatePLIShippingSummaryInformation(productLineItem, shipping, order, options);
    });

    $('body').trigger('shipping:updateShippingInformation', {
        order: order,
        shipping: shipping,
        customer: customer,
        options: options
    });
}

/**
 * Update the checkout state (single vs. multi-ship)
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updateMultiShipInformation(order) {
    var $checkoutMain = $('#checkout-main');
    var $checkbox = $('[name=usingMultiShipping]');

    $('.shipping-error .alert-danger').remove();

    if (order.usingMultiShipping) {
        $checkoutMain.addClass('multi-ship');
        $checkbox.prop('checked', true);
    } else {
        $checkoutMain.removeClass('multi-ship');
        $checkbox.prop('checked', null);
    }

    $('body').trigger('shipping:updateMultiShipInformation', { order: order });
}

/**
  * Create an alert to display the error message
  * @param {Object} message - Error message to display
  */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.shipping-error').append(errorHtml);
    scrollAnimate($('.shipping-error'));
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

    // check if address is changed and save value in window.addressVerificationChanged
    $('body').trigger('qas:checkIfAddressChanged');

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
                createErrorNotification(element);
            });

            defer.reject(data);
        }

        if (data.cartError) {
            window.location.href = data.redirectUrl;
            defer.reject();
        }
    } else if (window.sitePreferences.AddressVerificationEnabled && window.addressVerificationChanged && !(window.addressVerificationDone) && ((data.shippingMethod !== 'store-pickup' && !isMultiShip && !isShipToCollectionEnabled) || isMultiShip) && !data.order.isOfficeAddress) {
        $('body').trigger('qas:AddressValidation');

        if (window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
            defer.resolve(data);
        }
    } else {
        window.addressVerificationDone = false;
        // Populate the Address Summary

        $('body').trigger('checkout:updateCheckoutView', {
            order: data.order,
            customer: data.customer
        });
        setTimeout(function () {
            scrollAnimate($('.js-payment-form-info'));
        }, 300);
        defer.resolve(data);
    }
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
            $('input[name$=_postalCode]', form).val('');
            $('select[name$=_stateCode],input[name$=_stateCode]', form).val('');
            // $('select[name$=_country]', form).val('');

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
 * Does Ajax call to create a server-side shipment w/ pliUUID & URL
 * @param {string} url - string representation of endpoint URL
 * @param {Object} shipmentData - product line item UUID
 * @returns {Object} - promise value for async call
 */
function createNewShipment(url, shipmentData) {
    $.spinner().start();
    return $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: shipmentData
    });
}

/**
 * Does Ajax call to select shipping method
 * @param {string} url - string representation of endpoint URL
 * @param {Object} urlParams - url params
 * @param {Object} el - element that triggered this call
 */
function selectShippingMethodAjax(url, urlParams, el) {
    $(el).closest('.shipping-method-block').spinner().start();
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: urlParams
    })
        .done(function (data) {
            if (data.error) {
                window.location.href = data.redirectUrl;
            } else {
                $('body').trigger('checkout:updateCheckoutView',
                    {
                        order: data.order,
                        customer: data.customer,
                        options: { keepOpen: true },
                        urlParams: urlParams
                    }
                );
                if ($('.js-ship-to-personal').length > 0 && $('.js-ship-to-personal').find('.shipping-address-section').length === 0) {
                    $('.js-ship-to-personal').closest('.shipping-form').attr('data-address-mode', 'new');
                    $('.js-ship-to-personal').closest('.shipping-form').find('.continue-buttons').remove();
                    if ($('.js-ship-to-office').is(':visible')) {
                        $('.b-shipping.shipping-address-block').addClass('hide');
                    }
                } else if ($('.js-ship-to-personal').find('.shipping-address-section').length > 0 && $('.js-ship-to-personal').closest('.shipping-form').data('address-mode') === 'new') {
                    $('.js-ship-to-personal').closest('.shipping-form').attr('data-address-mode', 'edit');
                }
                $('body').trigger('checkout:postUpdateCheckoutView',
                    {
                        el: el
                    }
                );
            }
            $(el).closest('.shipping-method-block').spinner().stop();
        })
        .fail(function () {
            $(el).closest('.shipping-method-block').spinner().stop();
        });
}

/**
 * Hide and show to appropriate elements to show the multi ship shipment cards in the enter view
 * @param {jQuery} element - The shipping content
 */
function enterMultishipView(element) { // eslint-disable-line
    element.find('.btn-enter-multi-ship').removeClass('hide');

    element.find('.view-address-block').addClass('hide');
    element.find('.shipping-address').addClass('hide');
    element.find('.btn-save-multi-ship.save-shipment').addClass('hide');
    element.find('.btn-edit-multi-ship').addClass('hide');
    element.find('.multi-ship-address-actions').addClass('hide');
}

/**
 * Hide and show to appropriate elements to show the multi ship shipment cards in the view mode
 * @param {jQuery} element - The shipping content
 */
function viewMultishipAddress(element) { // eslint-disable-line
    element.find('.view-address-block').removeClass('hide');
    element.find('.btn-edit-multi-ship').removeClass('hide');

    element.find('.shipping-address').addClass('hide');
    element.find('.btn-save-multi-ship.save-shipment').addClass('hide');
    element.find('.btn-enter-multi-ship').addClass('hide');
    element.find('.multi-ship-address-actions').addClass('hide');
}

/**
 * Hide and show to appropriate elements that allows the user to edit multi ship address information
 * @param {jQuery} element - The shipping content
 */
function editMultiShipAddress(element) {
    // Show
    element.find('.shipping-address').removeClass('hide');
    element.find('.btn-save-multi-ship.save-shipment').removeClass('hide');

    // Hide
    element.find('.view-address-block').addClass('hide');
    element.find('.btn-enter-multi-ship').addClass('hide');
    element.find('.btn-edit-multi-ship').addClass('hide');
    element.find('.multi-ship-address-actions').addClass('hide');

    $('body').trigger('shipping:editMultiShipAddress', { element: element, form: element.find('.shipping-form') });
}

/**
 * perform the proper actions once a user has clicked enter address or edit address for a shipment
 * @param {jQuery} element - The shipping content
 * @param {string} mode - the address mode
 */
function editOrEnterMultiShipInfo(element, mode) {
    var form = $(element).closest('form');
    var root = $(element).closest('.shipping-content');
    var scrollPosition = $(element).closest('.card');

    if ($(window).scrollTop() > scrollPosition.offset().top) {
        $('html, body').animate({
            scrollTop: scrollPosition.offset().top
        }, 200);
    }

    $('body').trigger('shipping:updateDataAddressMode', { form: form, mode: mode });

    editMultiShipAddress(root);

    var addressInfo = addressHelpers.methods.getAddressFieldsFromUI(form);

    var savedState = {
        UUID: $('input[name=shipmentUUID]', form).val(),
        shippingAddress: addressInfo
    };

    if (window.sitePreferences.qasAddressSuggestion) {
        var inputField = $(element).closest('.shipping-form').find('input[name$=_address1]')[0];
        var options = {
            token: document.querySelector('#qasToken').value,
            elements: {
                input: inputField,
                countryList: document.querySelector('#billingCountry').value,
                addressLine1: $(element).closest('.shipping-form').find('input[name$=_address1]')[0],
                addressLine2: $(element).closest('.shipping-form').find('input[name$=_address2]')[0],
                locality: $(element).closest('.shipping-form').find('input[name$=_city]')[0],
                province: $(element).closest('.shipping-form').find('select[name$=_states_stateCode]')[0],
                postalCode: $(element).closest('.shipping-form').find('input[name$=_postalCode]')[0]
            }
        };
        if (window.sitePreferences.qasCurrentLocation) {
            options.elements.location = window.sitePreferences.qasCurrentLocation;
        }
        addressSuggestionHelpers.addressSuggestion(options);
        $('#qasShipping').val(true);

        // Hide autocomplete until a manual input is made. If no keyup has happened, then its autofill and no QAS should load
        inputField.on('input', function () {
            $(this).parents('.form-group').addClass('manual-input-init');
        });
    }

    root.data('saved-state', JSON.stringify(savedState));
}

/**
 * Calculate the maximum height of the gift product image
 * @param {jQuery} element - The shipping gift content
 */
function giftImageSyncHeight() {
    if ($(window).width() > 767) {
        $('.b-tile .b-tile-images_container').removeAttr('style');
        $('.b-tile .b-tile-images_container').each(function () {
            var highestImage = 0;
            $('.b-tile .b-tile-images_container').each(function () {
                if ($(this).height() > highestImage) {
                    highestImage = $(this).height();
                }
            });
            $('.b-tile .b-tile-images_container').height(highestImage);
        });
    }
}

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
        secondaryPickup.find('.js-form-group').addClass('required');
        secondaryPickup.find('.js-input_row-input').prop('required', true);
    } else {
        secondaryPickup.find('.js-form-group').removeClass('required');
        secondaryPickup.find('.js-input_row-input').prop('required', false);
    }
}

/**
 * Single shipping address event handler
 * @param {Object} scope event trigger subject
 * @returns {void}
 */
function singleShippingAddressSelect(scope) {
    var form = $(scope).parents('form')[0];
    var selectedOption = $(scope);
    var attrs = selectedOption.data();
    var shipmentUUID = $(selectedOption[0]).attr('value');
    var originalUUID = $('input[name=shipmentUUID]', form).val();
    var element;
    var $shippingAddressBlock = $(form).find('.shipping-address-block');

    Object.keys(attrs).forEach(function (attr) {
        element = attr === 'countryCode' ? 'country' : attr;
        $('[name$=' + element + ']', form).val(attrs[attr]);
    });

    if (!(selectedOption.hasClass('shipping-address-section-new'))) {
        $('.shipping-address-section').removeClass('default-address');
        $(scope).closest('.shipping-address-section').addClass('default-address');
    }

    if (shipmentUUID === 'new') {
        $(form).attr('data-address-mode', 'new');
    } else if (shipmentUUID === originalUUID) {
        $(form).attr('data-address-mode', 'shipment');
    } else if (shipmentUUID.indexOf('ab_') === 0) {
        $(form).attr('data-address-mode', 'customer');
    } else {
        $(form).attr('data-address-mode', 'edit');
    }

    $shippingAddressBlock.find('input, select').removeClass('is-invalid');
    $shippingAddressBlock.find('.form-group').removeClass('error-field');
    $shippingAddressBlock.find('.invalid-feedback').empty();

    if ($('.employee-address-selector').length > 0) {
        $('body').trigger('shipping:updateShipToOfficeView');
        $('.js-shipto-office-error').addClass('hide');
    }

    if (!(selectedOption.hasClass('shipping-address-section-new'))) {
        $('[name$=stateCode]', form).trigger('change');
    }

    if (!($('#hal-postal-code', form).length > 0 && $('#hal-postal-code', form).is(':visible'))) {
        $('#hal-postal-code', form).val('');
    }
}

var debouncedShippingAddressSelect = debounce(singleShippingAddressSelect, 100);

module.exports = {
    methods: {
        updateShippingAddressSelector: updateShippingAddressSelector,
        updateShippingAddressFormValues: updateShippingAddressFormValues,
        updateShippingMethods: updateShippingMethods,
        updateShippingSummaryInformation: updateShippingSummaryInformation,
        updatePLIShippingSummaryInformation: updatePLIShippingSummaryInformation,
        updateProductLineItemShipmentUUIDs: updateProductLineItemShipmentUUIDs,
        updateShippingInformation: updateShippingInformation,
        updateMultiShipInformation: updateMultiShipInformation,
        shippingFormResponse: shippingFormResponse,
        createNewShipment: createNewShipment,
        selectShippingMethodAjax: selectShippingMethodAjax,
        updateShippingMethodList: updateShippingMethodList,
        clearShippingForms: clearShippingForms,
        editMultiShipAddress: editMultiShipAddress,
        editOrEnterMultiShipInfo: editOrEnterMultiShipInfo,
        createErrorNotification: createErrorNotification,
        viewMultishipAddress: viewMultishipAddress // eslint-disable-line
    },

    disablePaymentButton: function () {
        if (($('.shipment-selector-block .btn-add-new').is(':visible') && $('.shipment-selector-block:visible').find('.shipping-address-section.default-address').length > 0) ||
            ($('.shipping-address-block').is(':visible') && $('.shipping-address-section').is(':visible')) ||
            ($('.js-ship-to-office .shipping-address-section-selected').is(':visible') && $('.js-ship-to-office .shipping-address-section-selected').find('.shipping-address-option').length > 0)) {
                // TODO: Remove this if disable logic is no longer needed
        }

        if ($('.shipping-form.js-checkout-forms').length) {
            $('#shippingAddressTwodefault').trigger('focusout');
        }
    },

    selectShippingMethod: function () {
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
            var urlParams = addressHelpers.methods.getAddressFieldsFromUI($shippingForm);
            urlParams.shipmentUUID = shipmentUUID;
            urlParams.methodID = methodID;
            urlParams.isShipToCollectionEnabled = isShipToCollectionEnabled;
            urlParams.isGift = $shippingForm.find('.gift').prop('checked');
            urlParams.giftMessage = $shippingForm.find('textarea[name$=_giftMessage]').val(); // eslint-disable-line

            var url = $(this).data('select-shipping-method-url');

            if (baseObj.methods && baseObj.methods.selectShippingMethodAjax) {
                baseObj.methods.selectShippingMethodAjax(url, urlParams, $(this));
            } else {
                selectShippingMethodAjax(url, urlParams, $(this));
            }
        });
    },

    toggleMultiship: function () { // eslint-disable-line
        var baseObj = this;

        $('input[name="usingMultiShipping"]').on('change', function () {
            var url = $('.multi-shipping-checkbox-block form').attr('action');
            var usingMultiShip = this.checked;
            $.spinner().start();

            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: { usingMultiShip: usingMultiShip },
                success: function (response) {
                    if (response.error) {
                        window.location.href = response.redirectUrl;
                    } else {
                        $('body').trigger('checkout:updateCheckoutView', {
                            order: response.order,
                            customer: response.customer
                        });

                        if ($('#checkout-main').data('customer-type') === 'guest') {
                            if (baseObj.methods && baseObj.methods.clearShippingForms) {
                                baseObj.methods.clearShippingForms(response.order);
                            } else {
                                clearShippingForms(response.order);
                            }
                        } else {
                            response.order.shipping.forEach(function (shipping) {
                                $('input[value=' + shipping.UUID + ']').each(function (formIndex, el) {
                                    var form = el.form;
                                    if (!form) return;

                                    $(form).attr('data-address-mode', 'edit');
                                    var addressSelectorDropDown = $(form).find('.addressSelector option[value="ab_' + shipping.matchingAddressId + '"]');
                                    $(addressSelectorDropDown).prop('selected', true);
                                    $('input[name$=_isGift]', form).prop('checked', false);
                                    $('textarea[name$=_giftMessage]', form).val(''); // eslint-disable-line
                                    $(form).find('.gift-message').addClass('d-none');
                                });
                            });
                        }

                        if (usingMultiShip) {
                            $('body').trigger('shipping:selectMultiShipping', { data: response });
                        } else {
                            $('body').trigger('shipping:selectSingleShipping', { data: response });
                        }
                    }

                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    selectSingleShipping: function () {
        $('body').on('shipping:selectSingleShipping', function () {
            $('.single-shipping .shipping-address').removeClass('hide');

            if ($('.b-gift-message-block').length > 0) {
                setTimeout(function () {
                    $('.b-gift-message-section').removeAttr('style');
                    $('.b-gift-message-section').css('width', $('form.shipping-form').width());
                    giftImageSyncHeight();
                    $('.b-gift-message-block').find('.product-listing').trigger('mainCarousel:update');
                }, 1000);
            }
        });
    },

    selectMultiShipping: function () {
        var baseObj = this;

        $('body').on('shipping:selectMultiShipping', function (e, data) {
            $('.multi-shipping .shipping-address').addClass('hide');

            data.data.order.shipping.forEach(function (shipping) {
                var element = $('.multi-shipping .card[data-shipment-uuid="' + shipping.UUID + '"]');

                if (shipping.shippingAddress) {
                    if (baseObj.methods && baseObj.methods.viewMultishipAddress) { // eslint-disable-line
                        baseObj.methods.viewMultishipAddress($(element)); // eslint-disable-line
                    } else {
                        viewMultishipAddress($(element)); // eslint-disable-line
                    }
                } else {
                    /* eslint-disable no-lonely-if */
                    if (baseObj.methods && baseObj.methods.enterMultishipView) { // eslint-disable-line
                        baseObj.methods.enterMultishipView($(element)); // eslint-disable-line
                    } else {
                        enterMultishipView($(element)); // eslint-disable-line
                    }
                    /* eslint-enable no-lonely-if */
                }
            });
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
            return;
        });
    },

    deleteShippingAddress: function () {
        $('body').on('click', '.btn-delete-address', function () {
            var $form = $(this).closest('form');
            var addressID;
            if ($(this).parents('#dwfrm_billing').length > 0) {
                addressID = $('#deleteBillingAddressModal').attr('data-addr-id');
            } else {
                addressID = $('#deleteAddressModal').attr('data-addr-id');
            }
            var url = $(this).attr('data-action-url') + '?addressId=' + addressID;
            var isDefault = $('#deleteAddressModal').attr('data-default');

            if (isDefault) {
                url = url + '&isDefault=' + isDefault;
            }

            $.ajax({
                url: url,
                type: 'get',
                data: $form.serialize(),
                context: $(this),
                success: function success(data) {
                    var resAddrID = data.addressID;
                    if ($('.shipping-address-section').find('[data-addr-id=' + resAddrID + ']').closest('.shipping-address-section').hasClass('default-address')) {
                        $('.shipping-address:visible').find('.btn-add-new').trigger('click');
                    }

                    $('.shipping-address-section').find('[data-addr-id=' + resAddrID + ']').closest('.shipping-address-section').remove();
                    $('.billing-address-section').find('[data-addr-id=' + resAddrID + ']').closest('.billing-address-section').remove();

                    if ($('#dwfrm_shipping').find('.personal-address').length === 1) {
                        $('#dwfrm_shipping').find('.personal-address').addClass('default-shipping-address');
                    }
                }
            });

            return;
        });
    },

    showDeleteShippingAddressModal: function () {
        $('body').on('click', '.button-delete-address', function (e) {
            e.preventDefault();
            var addressID;
            var isdefault;
            if ($(this).parents('#dwfrm_billing').length > 0) {
                addressID = $(this).closest('.billing-address-section').find('.billing-address-option').attr('data-addr-id');
                isdefault = $(this).closest('.billing-address-section').find('.billing-address-option').attr('default-address');
                $('#deleteBillingAddressModal').attr('data-addr-id', addressID);
                $('#deleteAddressModal').attr('data-default', isdefault);
                $('#deleteBillingAddressModal').modal('show');
            } else {
                addressID = $(this).closest('.shipping-address-section').find('.shipping-address-option').attr('data-addr-id');
                isdefault = $(this).closest('.shipping-address-section').find('.shipping-address-option').attr('default-address');
                $('#deleteAddressModal').attr('data-addr-id', addressID);
                $('#deleteAddressModal').attr('data-default', isdefault);
                $('#deleteAddressModal').modal('show');
            }
        });
    },

    updateShippingAddress: function () {
        $('.shipping-save-button').on('click', function (e) {
            e.preventDefault();
            var $this = $(this);
            var $form = $this.closest('form');
            var addressID = $form.attr('data-addr-ID');
            var url = $this.attr('data-action-url') + '?addressId=' + addressID;
            clientSideValidation.checkMandatoryField($form);
            if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
                $this.closest('.shipping-address-block').spinner().start();
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
                            $.spinner().stop();
                        }

                        addressID = typeof data.address !== 'undefined' ? data.address.ID : '';
                        var editLink = $('input.editAddrURL').val();
                        var deleteLabel = $('input.deleteLabel').val();
                        var editLabel = $('input.editLabel').val();
                        $form.find('.shipping-address-section').removeClass('default-address');
                        if (data.newAddress) {
                            var newDiv = `<div class='shipping-address-section personal-address default-address'>
                                <div class='shipping-address-option' value="ab_${addressID}" data-addr-id="${addressID}" 
                                data-first-name="" data-last-name="" data-address1="" 
                                data-address2="" data-city="e" data-state-code="" data-country-code="" data-postal-code="02138" data-phone="" 
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
                        $(selectedAddr).attr('data-address1', (data.address.address1 || ''));
                        addressLi += '<div>' + (data.address.address1 || '') + '</div>';
                        if (data.address.address2 !== null && data.address.address2) {
                            $(selectedAddr).attr('data-address2', data.address.address2);
                            addressLi += '<div>' + data.address.address2 + '</div>';
                        }
                        $(selectedAddr).attr('data-city', (data.address.city || ''));
                        addressLi += (data.address.city || '') + ', ';
                        $(selectedAddr).attr('data-state-code', (data.address.stateCode || ''));
                        addressLi += (data.address.stateCode || '') + ' ';
                        $(selectedAddr).attr('data-postal-code', (data.address.postalCode || ''));
                        addressLi += (data.address.postalCode || '');
                        $(selectedAddr).html(addressLi);
                        $(selectedAddr).attr('data-country-code', (data.address.countryCode.value || ''));
                        $(selectedAddr).attr('data-phone', (data.address.phone || ''));
                        form.attr('data-address-mode', 'edit');
                        window.addressVerificationDone = false;
                        if ($form.find('.personal-address').length > 1) {
                            $form.find('.personal-address').removeClass('default-shipping-address');
                        }
                        $.spinner().stop();
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
    },

    selectSingleShipAddress: function () {
        $('body').on('click', '.single-shipping .addressSelector .shipping-address-option', function (e) {
            debouncedShippingAddressSelect(this, e);
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
            var createNewShipmentScoped = baseObj.methods && baseObj.methods.createNewShipment ? baseObj.methods.createNewShipment : createNewShipment;

            var element;
            Object.keys(attrs).forEach(function (attr) {
                if (attr === 'isGift') {
                    $('[name$=' + attr + ']', form).prop('checked', attrs[attr]);
                    $('[name$=' + attr + ']', form).trigger('change');
                } else {
                    element = attr === 'countryCode' ? 'country' : attr;
                    $('[name$=' + element + ']', form).val(attrs[attr]);
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
                        editMultiShipAddress($rootEl);
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
    },

    updateShippingList: function () {
        var baseObj = this;

        $('select[name$="shippingAddress_addressFields_states_stateCode"]').on('change', function (e) {
            if (baseObj.methods && baseObj.methods.updateShippingMethodList) {
                baseObj.methods.updateShippingMethodList($(e.currentTarget.form));
            } else {
                updateShippingMethodList($(e.currentTarget.form));
            }
        });

        $('input[name$="shippingAddress_addressFields_postalCode"]').on('change', function (e) {
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

    updateDataAddressMode: function () {
        $('body').on('shipping:updateDataAddressMode', function (e, data) {
            $(data.form).attr('data-address-mode', data.mode);
        });
    },

    enterMultiShipInfo: function () {
        var baseObj = this;

        $('.btn-enter-multi-ship').on('click', function (e) {
            e.preventDefault();

            if (baseObj.methods && baseObj.methods.editOrEnterMultiShipInfo) {
                baseObj.methods.editOrEnterMultiShipInfo($(this), 'new');
            } else {
                editOrEnterMultiShipInfo($(this), 'new');
            }
        });
    },

    editMultiShipInfo: function () {
        var baseObj = this;

        $('.btn-edit-multi-ship').on('click', function (e) {
            e.preventDefault();

            var $this = $(this);
            var $form = $this.closest('form.shipping-form');

            if (baseObj.methods && baseObj.methods.editOrEnterMultiShipInfo) {
                baseObj.methods.editOrEnterMultiShipInfo($(this), 'details');
            } else {
                editOrEnterMultiShipInfo($(this), 'details');
            }

            if ($form.find('.btn-add-new').is(':visible') && $form.find('.btn-add-new').length > 0) {
                editOrEnterMultiShipInfo($(this), 'edit');
            }

            if (!($form.find('.shipping-address-section').is(':visible') && $form.find('.shipping-address-section').length > 0)) {
                editOrEnterMultiShipInfo($(this), 'new');
            }

            if ($('.b-gift-message-block').length > 0) {
                setTimeout(function () {
                    $form.find('.b-gift-message-section').removeAttr('style');
                    $form.find('.b-gift-message-section').css('width', $form.width());
                    giftImageSyncHeight();
                    $form.find('.b-gift-message-block .product-listing').trigger('mainCarousel:update');
                }, 1000);
            }
        });
    },

    saveMultiShipInfo: function () {
        var baseObj = this;

        $('.btn-save-multi-ship').on('click', function (e) {
            e.preventDefault();

            // Save address to checkoutAddressBook
            var form = $(this).closest('form');
            var $rootEl = $(this).closest('.shipping-content');
            var data = $(form).serialize();
            var url = $(form).attr('action');

            var checkedShippingMethod = $('input[name=dwfrm_shipping_shippingAddress_shippingMethodID]:checked', form);
            var isStorePickUpMethod = checkedShippingMethod.attr('data-pickup');
            var storeId = $("input[name='storeId']", form).val();
            var errorMsg = 'Before you can continue to the next step, you must select a store.';

            addRequiredAttribute(form);
            clientSideValidation.checkMandatoryField(form);
            if (!form.find('input.is-invalid').length && !form.find('select.is-invalid').length) {
                if (isStorePickUpMethod === 'true' && (storeId === undefined)) {
                    createErrorNotification(errorMsg);
                } else {
                    $rootEl.spinner().start();
                    $.ajax({
                        url: url,
                        type: 'post',
                        dataType: 'json',
                        data: data
                    })
                        .done(function (response) {
                            formHelpers.clearPreviousErrors(form);
                            if (response.error) {
                                if (response.fieldErrors && response.fieldErrors.length) {
                                    response.fieldErrors.forEach(function (error) {
                                        if (Object.keys(error).length) {
                                            formHelpers.loadFormErrors(form, error);
                                        }
                                    });
                                } else if (response.serverErrors && response.serverErrors.length) {
                                    $.each(response.serverErrors, function (index, element) {
                                        createErrorNotification(element);
                                    });
                                }
                            } else {
                                // Remove the deleted product from the response
                                $('input[name="productLineItemUUID"]').each(function () {
                                    var productLineItemUUID = $(this).val();
                                    if (productLineItemUUID === response.deletedProductLiUUID
                                        && response.deletedProductLiUUID !== undefined && response.deletedProductLiUUID !== '') {
                                        $(this).closest('.card').remove();
                                        $('.b-header_minicart-product-item[data-product-line-item=' + productLineItemUUID + ']').closest('.shipment-block').remove();
                                    }
                                });
                                // Update UI from response
                                $('body').trigger('checkout:updateCheckoutView',
                                    {
                                        order: response.order,
                                        customer: response.customer
                                    }
                                );

                                if (baseObj.methods && baseObj.methods.viewMultishipAddress) { // eslint-disable-line
                                    baseObj.methods.viewMultishipAddress($rootEl); // eslint-disable-line
                                } else {
                                    viewMultishipAddress($rootEl); // eslint-disable-line
                                }
                            }

                            $rootEl.spinner().stop();
                        })
                        .fail(function (err) {
                            if (err.responseJSON.redirectUrl) {
                                window.location.href = err.responseJSON.redirectUrl;
                            }

                            $rootEl.spinner().stop();
                        });
                }
            }

            return false;
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
                        editMultiShipAddress($rootEl);
                    }
                }
            }

            return false;
        });
    },

    isGift: function () {
        $('.gift').on('change', function (e) {
            e.preventDefault();
            var form = $(this).closest('form');

            if ($(this).is(':checked')) {
                $(form).find('.b-gift-message-section').removeAttr('style');
                $(form).find('.b-gift-message-section').css('width', $(form).width());
                $(this).prop('checked', true);
                $(form).find('.gift-message').removeClass('d-none');
                $(this).closest('.b-gift-message-block').find('.product-listing').trigger('mainCarousel:update');
                $('.gift-item').each(function () {
                    if ($(this).hasClass('selected') && $(this).hasClass('clear-item')) {
                        $(this).removeClass('clear-item');
                        $(this).prop('checked', true);
                    }
                });
                giftImageSyncHeight();
            } else {
                $(this).prop('checked', false);
                $(form).find('.gift-message').addClass('d-none');
                $(form).find('.gift-message').val('');
                $('.gift-item').each(function () {
                    if ($(this).hasClass('selected')) {
                        $(this).addClass('clear-item');
                        $(this).prop('checked', false);
                    }
                });
            }
        });

        $('.gift-item').on('click', function () {
            if ($(this).is(':checked')) {
                $(this).prop('checked', true);
                if ($(this).hasClass('selected') && $(this).hasClass('clear-item')) {
                    $(this).removeClass('clear-item');
                }
            } else {
                $(this).prop('checked', false);
                if ($(this).hasClass('selected')) {
                    $(this).addClass('clear-item');
                }
            }
        });

        $(window).on('load', function () {
            if ($('.b-gift-message-block').length > 0) {
                $('.b-gift-message-section').removeAttr('style');
                $('.b-gift-message-section').css('width', $('form.shipping-form').width());
                $('.b-gift-message-block').find('.product-listing').trigger('mainCarousel:update');
                giftImageSyncHeight();
            }
            if ($('#checkoutAvailabilityModal').length > 0) {
                $('#checkoutAvailabilityModal').modal('show');
            }
        });

        $(window).resize(function () {
            if ($('.b-gift-message-block').length > 0 && !$('.multi-ship').length > 0) {
                $('.b-gift-message-section').removeAttr('style');
                $('.b-gift-message-section').css('width', $('form.shipping-form').width());
            }
        });
    },

    employeeCheckout: function () {
        $(document).off('click', '.js-shiptopersonal, .js-shiptooffice').on('click', '.js-shiptopersonal, .js-shiptooffice', function (e) {
            e.preventDefault();
            if (!$(this).hasClass('active')) {
                $('.js-shiptopersonal').toggleClass('active');
                $('.js-shiptooffice').toggleClass('active');
                $('.js-ship-to-personal').toggleClass('hide');
                $('.js-ship-to-office').toggleClass('hide');
                var form = $(this).parent().find('form');
                form.attr('data-address-mode', 'edit');
                if ($('.js-shiptopersonal').hasClass('active')) {
                    $('.b-shipping.shipping-address-block input[name$=_firstName]').val('');
                    $('.b-shipping.shipping-address-block input[name$=_lastName]').val('');
                    $('.b-shipping.shipping-address-block input[name$=_address1]').val('');
                    $('.b-shipping.shipping-address-block input[name$=_address2]').val('');
                    $('.b-shipping.shipping-address-block input[name$=_suburb').val('');
                    $('.b-shipping.shipping-address-block input[name$=_city').val('');
                    $('.b-shipping.shipping-address-block select[name$=_stateCode]').val('');
                    $('.b-shipping.shipping-address-block input[name$=_postalCode]').val('');
                    $('.b-shipping.shipping-address-block select[name$=_country]').val('');
                }
                if ($('.js-ship-to-personal').find('.shipping-address-section').length === 0) {
                    $('.b-shipping.shipping-address-block').toggleClass('hide');
                    if ($(this).hasClass('js-shiptopersonal') && $('.js-ship-to-office').find('.default-address').length > 0) {
                        $('.shipping-form').find('.btn-add-new').trigger('click');
                        $('.shipping-form').find('.js-new-shipping-address').addClass('hide');
                        $('.shipping-form').find('input[name$=_address1]').trigger('change');
                    }
                }
                if ($(this).hasClass('js-shiptopersonal') && $('.js-ship-to-personal').find('.shipping-address-section').length > 0) {
                    $('.js-ship-to-personal').find('.shipping-address-section .shipping-address-option:first').trigger('click');
                } else if ($(this).hasClass('js-shiptooffice') && $('.js-ship-to-office').find('.shipping-address-section').length > 0) {
                    $('.js-ship-to-office').find('.shipping-address-option:first').trigger('click');
                    $('.js-shipto-office-error').addClass('hide');
                }
            }
        });

        $('.js-officeisclosed').on('click', function () {
            $('#officeisclosed').modal('show');
        });

        $('body').on('shipping:updateShipToOfficeView', function () {
            $('.employee-address-selector .shipping-address-section').removeClass('hide');
            $('.shipping-address-section-selected').html($('.employee-address-selector .shipping-address-section.default-address').clone());
            if ($('.shipping-address-section-selected .shipping-address-section.default-address').length > 0) {
                $('.js-btn-toggle-more-few').removeClass('hide');
            } else {
                $('.js-btn-toggle-more-few').addClass('hide');
                $('.employee-address-selector').removeClass('hide');
            }
            $('.employee-address-selector .shipping-address-section.default-address').addClass('hide');
            if ($('.employee-address-selector .shipping-address-section.default-address').length > 0 && $('.employee-address-selector').is(':visible')) {
                $('.js-btn-toggle-more-few').trigger('click');
            }
            if ($('.employee-address-selector .shipping-address-section.default-address').length && $('.next-step-button').find('button[disabled]:visible').length) {
                $('.next-step-button').find('button[disabled]:visible').removeAttr('disabled');
            }
            if ($('.js-ship-to-personal').length > 0 && $('.js-ship-to-personal').find('.shipping-address-section').length === 0) {
                $('.js-ship-to-personal').closest('.shipping-form').attr('data-address-mode', 'new');
                $('.js-ship-to-personal').closest('.shipping-form').find('.continue-buttons').remove();
                if ($('.js-ship-to-office').is(':visible')) {
                    $('.b-shipping.shipping-address-block').addClass('hide');
                }
            } else if ($('.js-ship-to-personal').find('.shipping-address-section').length > 0 && $('.js-ship-to-personal').closest('.shipping-form').data('address-mode') === 'new') {
                $('.js-ship-to-personal').closest('.shipping-form').attr('data-address-mode', 'edit');
            }
        });

        $('.js-btn-toggle-more-few').on('click', function (e) {
            e.preventDefault();
            $('.employee-address-selector').toggleClass('hide');
            if ($('.employee-address-selector').is(':visible')) {
                $(this).text($(this).data('text'));
            } else {
                $(this).text($(this).data('alt-text'));
            }
        });

        $('.shipping-address').find('#saveAsDefault').on('click', function () {
            $(this).val($('.b-shipping_saveas-default').is(':checked'));
        });
        $('body').trigger('shipping:updateShipToOfficeView');
    }
};
