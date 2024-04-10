'use strict';

var shippingHelpers = require('org/checkout/shipping');
var addressHelpers = require('org/checkout/address');
var formHelpers = require('org/checkout/formErrors');
var clientSideValidation = require('../components/common/clientSideValidation');

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

        var address = shipping.pickupPointAddress ? shipping.pickupPointAddress : shipping.shippingAddress;
        var selectedShippingMethod = shipping.selectedShippingMethod;
        var isGift = shipping.isGift;
        var shippingCostID = $('.shippingCostID').val();
        var freeTextID = $('.freeTextID').val();
        var shippingCostVal;
        var promotionalShippingCostVal;

        addressHelpers.methods.populateAddressSummary($addressContainer, address);

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

    // Updating Quantity
    $pli.closest('.card').find('.qty-card-quantity-count').text(productLineItem.quantity);

    // Updating Price
    $pli.closest('.card').find('.line-item-total-price-amount').text(productLineItem.price.sales.formatted + ' x ' + productLineItem.quantity);


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
            shippingHelpers.methods.updateProductLineItemShipmentUUIDs(productLineItem, aShipping);
        });
    });

    // Now update shipping information, based on those associations
    shippingHelpers.methods.updateShippingMethods(shipping);
    shippingHelpers.methods.updateShippingAddressFormValues(shipping);
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

shippingHelpers.updateShippingAddress = function () {
    $('.shipping-save-button').on('click', function (e) {
        e.preventDefault();
        var $this = $(this);
        var $form = $this.closest('form');
        var addressID = $form.attr('data-addr-ID');
        var url = $(this).attr('data-action-url') + '?addressId=' + addressID;
        clientSideValidation.checkMandatoryField($form);
        if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
            // Data Validations - PO BOX / apo / cpo / special characters
            clientSideValidation.validateFields($this);
            if ($form.find('input.is-invalid').length) {
                return;
            }

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
                        var newDiv = `<div class='shipping-address-section default-address'>
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
                    $.spinner().stop();
                }
            });
        }
        return;
    });
};

shippingHelpers.modifyPostalCode = function () {
    const updatePostalCode = (target) => {
        const currentCountry = $('#shippingCountrydefault').val();
        if (currentCountry !== 'IE' || !target || !target.value) return;
        let val = target.value.replace(/\s/g, '');
        let targetValLength = target.value.length;
        if (targetValLength > 3) {
            const firstPart = val.substr(0, 3).toUpperCase();
            const secondPart = val.substr(3).toUpperCase();
            const concat = secondPart ? [firstPart, secondPart].join(' ') : firstPart;
            $(target).val(concat);
        }
    };
    $('input[name$="shippingAddress_addressFields_postalCode"], input[name$="billing_addressFields_postalCode"]').on('change', function (e) {
        updatePostalCode(e.target);
    });
    [...$('input[name$="shippingAddress_addressFields_postalCode"]'), $('input[name$="billing_addressFields_postalCode"]')].forEach(target => updatePostalCode(target));
};

shippingHelpers.methods.updateShippingInformation = updateShippingInformation;
shippingHelpers.methods.updateShippingSummaryInformation = updateShippingSummaryInformation;
shippingHelpers.methods.updatePLIShippingSummaryInformation = updatePLIShippingSummaryInformation;
module.exports = shippingHelpers;

