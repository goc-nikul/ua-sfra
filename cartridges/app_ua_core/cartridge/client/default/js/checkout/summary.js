'use strict';

var promotionSummary = require('./promotionSummary');

/**
 * updates the totals summary
 * @param {Array} totals - the totals data
 */
function updateTotals(totals) {
    var shippingCostVal = totals.totalShippingCost;
    var shippingCostID = $('.shippingCostID').val();
    var freeTextShippingID = $('.freeTextShippingID').val();
    $('.shipping-total-cost').text(shippingCostVal);
    $('.shipping-total-cost').closest('.order-summary_itemsvalue').removeClass('order-summary_discount');
    if (shippingCostVal === shippingCostID) {
        $('.shipping-total-cost').text(freeTextShippingID);
        $('.shipping-total-cost').closest('.order-summary_itemsvalue').addClass('order-summary_discount');
    }

    $('.tax-total').text(totals.totalTax);

    if ($('.sub-total-na').length > 0) {
        $('.sub-total-na').empty().append(totals.newSubTotalWithoutCoupon.formatted);
    } else if ($('.sub-total-emea').length > 0) {
        $('.sub-total-emea').text(totals.subTotal);
    } else {
        $('.sub-total').text(totals.totalListPrice.formatted);
    }

    $('.grand-total-sum').text(totals.grandTotal);

    if (totals.estimatedLoyaltyPoints > 0) {
        $('.order-loyalty').show();
        $('.order-loyalty-points').text('+' + totals.estimatedLoyaltyPoints);
    } else {
        $('.order-loyalty').hide();
    }

    if (totals.orderLevelDiscountTotal.value > 0) {
        if ('discountDistribution' in totals) {
            if (typeof totals.discountDistribution.isEmployeeDiscount !== undefined && totals.discountDistribution.isEmployeeDiscount && totals.discountDistribution.employeeDiscountTotalValue !== 0) {
                $('.order-employee-discount').show();
                $('.order-employee-discount-total').empty()
                    .append(totals.discountDistribution.employeeDiscountTotal);
            } else {
                $('.order-employee-discount').hide();
            }
            if (typeof totals.discountDistribution.isLoyaltyDiscount !== undefined && totals.discountDistribution.isLoyaltyDiscount && totals.discountDistribution.loyaltyDiscountTotalValue !== 0) {
                $('.order-loyalty-discount').show();
                $('.order-loyalty-discount-total').empty()
                    .append(totals.discountDistribution.loyaltyDiscountTotal);
            } else {
                $('.order-loyalty-discount').hide();
            }
            if (totals.discountDistribution.orderLevelDiscountValue > 0) {
                $('.order-discount').show();
                $('.order-discount-total').text('- ' + totals.discountDistribution.orderLevelDiscountFormatted);
            } else if (!($('.order-employee-discount').is(':visible') || $('.order-loyalty-discount').is(':visible')) && totals.orderLevelDiscountTotal && totals.orderLevelDiscountTotal.value && totals.orderLevelDiscountTotal.value > 0) {
                $('.order-discount').show();
                $('.order-discount-total').text('- ' + totals.orderLevelDiscountTotal.formatted);
            } else {
                $('.order-discount').hide();
            }
        } else {
            $('.order-discount').show();
            $('.order-discount-total').text('- ' + totals.orderLevelDiscountTotal.formatted);
        }
    } else {
        $('.order-discount').hide();
        $('.order-employee-discount').hide();
        $('.order-loyalty-discount').hide();
    }

    if (totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').show();
        $('.shipping-discount-total').text('- ' +
            totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').hide();
    }

    var $klarnaTooltip = $('.klarna-payment-tooltip');
    var klarnaMinimumThreshold = $('.klarna-min-threshold').length > 0 ? $('.klarna-min-threshold').val() : 1000;
    var klarnaMaximumThreshold = $('.klarna-max-threshold').length > 0 ? $('.klarna-max-threshold').val() : 100000;
    var isApplePaySupport = window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments();
    if (totals.klarnaTotal < klarnaMinimumThreshold || totals.klarnaTotal > klarnaMaximumThreshold) {
        $klarnaTooltip.find('.payment-error').addClass('hide');
        $klarnaTooltip.find('.threshold-error').removeClass('hide');
        $('.js-klarna-payments-link, .js-klarna-payment').addClass('hide');
        $klarnaTooltip.removeClass('hide');
        $('.klarna-button').addClass('hide');
        $('.express-checkout-container').addClass('only-one-button');
        $('.b-checkout_subheader-express-login:not(.vip-user)').removeClass('hide');
        if ($('.applepay-enabled').val() === 'true' && isApplePaySupport) {
            $('.b-checkout_subheader-express-login').removeClass('hide');
        } else if ($('.klarna-enabled').val() === 'true') {
            $('.b-checkout_subheader-express-login').addClass('hide');
        }
        if (totals.klarnaTotal > klarnaMaximumThreshold) {
            $klarnaTooltip.find('.klarnaMaximumThreshold-content').removeClass('hide');
            $klarnaTooltip.find('.klarnaMinimumThreshold-content').addClass('hide');
            if ($('.vip-account').val() === 'true') {
                $('.b-checkout_subheader-express-login').addClass('hide');
            }
        } else {
            $klarnaTooltip.find('.klarnaMinimumThreshold-content').removeClass('hide');
            $klarnaTooltip.find('.klarnaMaximumThreshold-content').addClass('hide');
            if (totals.klarnaTotal < klarnaMinimumThreshold && $('.vip-account').val() === 'true') {
                $('.b-checkout_subheader-express-login').addClass('hide');
            } else if ($('.vip-account').val() === 'true') {
                $('.b-checkout_subheader-express-login').removeClass('hide');
            }
        }
    } else {
        $klarnaTooltip.find('.payment-error').addClass('hide');
        $klarnaTooltip.find('.threshold-error').addClass('hide');
        $('.js-klarna-payments-link, .js-klarna-payment').removeClass('hide');
        $klarnaTooltip.addClass('hide');
        $('.klarna-button').removeClass('hide');
        if ($('.paypal.button').is(':visible') && $('.klarna-button').is(':visible')) {
            $('.express-checkout-container').removeClass('only-one-button');
        }
        if (!$('.gift_card_applied_amount.active').length) {
            $('.b-checkout_subheader-express-login:not(.vip-user)').removeClass('hide');
        }
    }
}

/**
 * updates promotion information in checkout summary
 * @param {Object} data - the order model
 */
function updatePromotionSummaryInformation(data) {
    promotionSummary.updatePromotionInformation(data);
}

/**
 * updates the order product shipping summary for an order model
 * @param {Object} order - the order model
 */
function updateOrderProductSummaryInformation(order) {
    var $productSummary = $('<div />');
    order.shipping.forEach(function (shipping, index) {
        shipping.productLineItems.items.forEach(function (lineItem) {
            var pli = $('[data-product-line-item=' + lineItem.UUID + ']');
         // Split the store pickup items
            if (order.hasBopisItems) {
                pli.find('.qty-card-quantity-count').text(lineItem.quantity);
                pli.find('.line-item-total-price-amount').text((lineItem.bfPriceTotal && lineItem.bfPriceTotal.adjustedUnitPrice ? lineItem.bfPriceTotal.adjustedUnitPrice : (lineItem.price.sales.formatted ? lineItem.price.sales.formatted : lineItem.priceTotal.price)) + ' x ' + lineItem.quantity);
            } else {
            // Updating Quantity
                pli.find('.qty-card-quantity-count').text(lineItem.quantity);

            // Updating Price
                var pricePli;
                if (lineItem.custom.giftCard && lineItem.custom.giftCard === 'EGIFT_CARD') {
                    pricePli = lineItem.priceTotal.price;
                } else if (lineItem.bfPriceTotal && lineItem.bfPriceTotal.adjustedUnitPrice) {
                    pricePli = lineItem.bfPriceTotal.adjustedUnitPrice;
                } else if (lineItem.price.sales.formatted) {
                    pricePli = lineItem.price.sales.formatted;
                } else {
                    pricePli = lineItem.priceTotal.price;
                }
                pli.find('.line-item-total-price-amount').text(pricePli + ' x ' + lineItem.quantity);

                $productSummary.append(pli);
            }
        });
        if (order.hasBopisItems && index === (order.shipping.length) - 1) {
            $productSummary.append($('.product-summary-block').html());
        }

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
            ? '( ' + selectedMethod.estimatedArrivalTime + ' )'
            : '';

        var tmpl = $('#pli-shipping-summary-template').clone();

        if (shipping.productLineItems.items && shipping.productLineItems.items.length > 1) {
            $('h5 > span').text(' - ' + shipping.productLineItems.items.length + ' '
                + order.resources.items);
        } else {
            $('h5 > span').text('');
        }

        var stateRequiredAttr = $('#shippingState').attr('required');
        var isRequired = stateRequiredAttr !== undefined && stateRequiredAttr !== false;
        var stateExists = (shipping.shippingAddress && shipping.shippingAddress.stateCode)
            ? shipping.shippingAddress.stateCode
            : false;
        var stateBoolean = false;
        if ((isRequired && stateExists) || (!isRequired)) {
            stateBoolean = true;
        }

        var shippingForm = $('.multi-shipping input[name="shipmentUUID"][value="' + shipping.UUID + '"]').parent();

        shipping.productLineItems.items.forEach(function (lineItem) {
            var primaryContact = JSON.parse(lineItem.custom.primaryContactBOPIS);
            var secondaryContact = JSON.parse(lineItem.custom.secondaryContactBOPIS);

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
        });

        if (shipping.shippingAddress
            && shipping.shippingAddress.firstName
            && shipping.shippingAddress.address1
            && shipping.shippingAddress.city
            && stateBoolean
            && shipping.shippingAddress.countryCode) {
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

            shippingForm.find('.ship-to-message').text('');
        } else {
            shippingForm.find('.ship-to-message').text(order.resources.addressIncomplete);
        }

        if (shipping.isGift) {
            $('.gift-message-summary', tmpl).text(shipping.giftMessage);
        } else {
            $('.gift-summary', tmpl).addClass('hide');
        }

        // checking h5 title shipping to or pickup
        var $shippingAddressLabel = $('.shipping-header-text', tmpl);
        $('body').trigger('shipping:updateAddressLabelText',
            { selectedShippingMethod: selectedMethod, resources: order.resources, shippingAddressLabel: $shippingAddressLabel });

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

        var $shippingSummary = $('<div class="multi-shipping-summary" data-shipment-summary="'
            + shipping.UUID + '" />');
        $shippingSummary.html(tmpl.html());
        $productSummary.append($shippingSummary);
    });

    $('.product-summary-block').html($productSummary.html());
}

/**
 * removes deleted shipments summary structure
 * @param {Object} shippingData - shipping data
 */
function updateShippingSummarySection(shippingData) {
    $('.b-shipping-summary').find('.single-shipping').each(function (i, el) {
        var $summaryElement = $(el);
        var shippingFound = false;
        shippingData.forEach(function (shipping) {
            if (shipping.UUID === $summaryElement.data('shipment-summary')) {
                shippingFound = true;
            }
        });
        if (!shippingFound) {
            $summaryElement.remove();
        }
    });
}

module.exports = {
    updateTotals: updateTotals,
    updateOrderProductSummaryInformation: updateOrderProductSummaryInformation,
    updateShippingSummarySection: updateShippingSummarySection,
    updatePromotionSummaryInformation: updatePromotionSummaryInformation
};
