'use strict';

import ParentCartTile from 'org/components/product/CartTile';

export default class CartTile extends ParentCartTile {

    /**
     * Updates details of a product line item
     * @param {Object} data - AJAX response from the server
     * @param {string} uuid - The uuid of the product line item to update
     */
    updateProductDetails(data, uuid) {
        var lineItem = this.findItem(data.cartModel.items, function (item) {
            return item.UUID === uuid;
        });

        var skuSelector = $('.card.card-product-info.uuid-' + uuid).find('.product-sku');
        var skuText = '';
        if (skuSelector && skuSelector.text() && skuSelector.text().split('-').length > 0) {
            skuText = skuSelector.text().split('-')[0];
        } else {
            skuText = lineItem.id;
        }

        if (lineItem.variationAttributes) {
            var colorAttr = this.findItem(lineItem.variationAttributes, function (attr) {
                return attr.attributeId === 'color';
            });

            if (colorAttr) {
                var colorSelector = '.Color-' + uuid;
                var displayColorWay = '<span>';
                var colorWay = lineItem.custom.colorway;
                if (colorWay) {
                    let colorBuckets = colorWay.split('/').map(function (item) {
                        return item.trim();
                    });
                    if (colorBuckets.length > 1) {
                        displayColorWay += colorBuckets[0];
                        if (colorBuckets[1] !== '' && colorBuckets[0] !== colorBuckets[1]) {
                            displayColorWay += ' / ' + colorBuckets[1];
                        } else if (colorBuckets[2] && colorBuckets[2] !== '' && colorBuckets[2] !== colorBuckets[1]) {
                            displayColorWay += ' / ' + colorBuckets[2];
                        }
                        displayColorWay += '</span>';
                    } else {
                        displayColorWay += colorWay + '</span>';
                    }
                    displayColorWay += '<span> - ' + lineItem.custom.color + '</span>';
                } else {
                    displayColorWay = '<span>' + colorAttr.displayValue + '</span><span> - ' + lineItem.custom.color + '</span>';
                }
                $(colorSelector).html('Color: ' + displayColorWay);
                skuText += '-' + lineItem.custom.color;
            }

            var sizeAttr = this.findItem(lineItem.variationAttributes, function (attr) {
                return attr.attributeId === 'size';
            });

            if (sizeAttr) {
                var sizeSelector = '.' + sizeAttr.displayName + '-' + uuid;
                var newSize = sizeAttr.displayName + ': ' + sizeAttr.displayValue;
                $(sizeSelector).text(newSize);
                skuText += (lineItem.custom && lineItem.custom.size) ? '-' + lineItem.custom.size : '-' + sizeAttr.displayValue;
            }

            var imageSelector = `.card.card-product-info.uuid-${uuid} .line-item-image .line-item-product-image`;
            $(imageSelector).attr('src', lineItem.images.cartFullDesktop[0].url);
            $(imageSelector).attr('alt', lineItem.images.cartFullDesktop[0].alt);
            $(imageSelector).attr('title', lineItem.images.cartFullDesktop[0].title);
        }

        skuSelector.text(skuText);

        if ($('.uuid-' + uuid).hasClass('egiftcardlineitem') && lineItem.custom.gcRecipientName !== null && lineItem.custom.gcRecipientEmail !== null && lineItem.custom.gcFrom !== null && lineItem.custom.gcDeliveryDate !== null) {
            var egiftCardLineitem = $('.uuid-' + uuid + '.egiftcardlineitem');
            $(egiftCardLineitem).find('.gcrecipientname').children('.egiftcard-value').text(lineItem.custom.gcRecipientName);
            $(egiftCardLineitem).find('.gcrecipientemail').children('.egiftcard-value').text(lineItem.custom.gcRecipientEmail);
            $(egiftCardLineitem).find('.gcfrom').children('.egiftcard-value').text(lineItem.custom.gcFrom);
            $(egiftCardLineitem).find('.gcdeliverydate').children('.egiftcard-value').text(new Date(Date.parse(lineItem.custom.gcDeliveryDate)).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }));
        }

        var qtySelector = `.js-quantity-select[data-uuid="${uuid}"]`;
        if (lineItem.quantity > 10) {
            $(qtySelector).empty();
            for (var optionNum = 0; optionNum < lineItem.quantity; optionNum++) {
                $(qtySelector).append('<option>' + (optionNum + 1) + '</option>');
            }
        }
        $(qtySelector).val(lineItem.quantity);
        $(qtySelector).data('pid', data.newProductId);

        var $updatedSpanQuantity = $('.js-quantity-' + uuid);
        $updatedSpanQuantity.empty().html(lineItem.quantity);
        if (lineItem.quantity > 1) {
            $('.b-cartlineitem_quantity-update').removeClass('hide');
        }

        $(`.remove-product-item[data-uuid="${uuid}"]`).attr('data-pid', data.newProductId);
        $(`.edit-link.js-save-later[data-uuid="${uuid}"]`).attr('data-pid', data.newProductId);
        $(`.card.card-product-info.uuid-${uuid}`).attr('data-pid', data.newProductId);

        var priceSelector = `.line-item-price-${uuid} .sales .value`;
        $(priceSelector).text(lineItem.price.sales.formatted);
        $(priceSelector).attr('content', lineItem.price.sales.decimalPrice);

        if (lineItem.price.list) {
            var listPriceSelector = `.line-item-price-${uuid} .list .value`;
            $(listPriceSelector).text(lineItem.price.list.formatted);
            $(listPriceSelector).attr('content', lineItem.price.list.decimalPrice);
        }
        // update OOS
        var currentProductDiv = $(`.b-cartlineitem.card-product-info.card.uuid-${uuid}`);
        if (lineItem.availabilityError && !lineItem.isPartiallyAvailable && !currentProductDiv.hasClass('b-cartlineitem_outofstock')) {
            currentProductDiv.addClass('b-cartlineitem_outofstock');
        } else if (currentProductDiv.hasClass('b-cartlineitem_outofstock')) {
            currentProductDiv.removeClass('b-cartlineitem_outofstock');
        }

        // update personlization
        currentProductDiv.find('div.personalize-detail').html('');
        if (lineItem.personalizationDetail && currentProductDiv.find('div.personalize-detail').length > 0) currentProductDiv.find('div.personalize-detail').html(lineItem.personalizationDetail);
        var optionName = lineItem.options ? lineItem.options.find(option => option.optionId === 'personalizations') : null;
        var displayName = currentProductDiv.find('div[data-option-id="personalizations"]').find('p.t-lineitem_attributes');
        if (optionName && displayName.length > 0) displayName.html(optionName.displayName);
    }

    onUpdateCartProduct(event) {
        event.preventDefault();

        var $target = $(event.target);

        var updateProductUrl = $target.closest('.cart-and-ipay').find('.update-cart-url').val();
        var selectedQuantity = $target.closest('.cart-and-ipay').find('.update-cart-url').data('selected-quantity');
        var uuid = $target.closest('.cart-and-ipay').find('.update-cart-url').data('uuid');

        var form = {
            uuid: uuid,
            pid: this.getPidValue($target),
            quantity: selectedQuantity
        };

        if ($('input[type="hidden"][name="personalizationName"]').length > 0) form.personalizationName = $('input[name="personalizationName"]').val();
        if ($('input[type="hidden"][name="personalizationNumber"]').length > 0) form.personalizationNumber = $('input[name="personalizationNumber"]').val();
        if ($('input[type="hidden"][name="personalizationSponsors"]').length > 0) form.personalizationSponsors = $('input[name="personalizationSponsors"]').val();

        form.selectedOptionValueId = $('div[data-option-id="personalizations"]').find('option:selected').data('value-id');

        if ($(this.selectors.eGiftCardForm).length > 0) {
            var eGiftCardData = $(this.selectors.eGiftCardForm).serializeArray();
            var eGiftCardFormData = {};
            eGiftCardData.forEach(function (data) {
                eGiftCardFormData[data.name] = data.value;
            });
            form.eGiftCardData = JSON.stringify(eGiftCardFormData);
        }

        $target.parents('.card').spinner().start();
        if (updateProductUrl) {
            $.ajax({
                url: updateProductUrl,
                type: 'post',
                context: this,
                data: form,
                dataType: 'json',
                success: function (data) {
                    $target.closest('.g-modal').modal('hide');
                    if ($('.b-cart-bopis_shipping').length > 0 || $('.b-cart-pickup-heading').length > 0) {
                        window.location.reload();
                    } else {
                        var lineItem = this.findItem(data.cartModel.items, function (item) {
                            return item.UUID === uuid;
                        });
                        var $updatedQuantity = $('.js-quantity-' + uuid);
                        if (lineItem.quantities.quantities !== null) {
                            this.updateQuantities(lineItem.quantities, uuid);
                        }
                        $('.coupons-and-promos').empty().append(data.cartModel.totals.discountsHtml);
                        $updatedQuantity.empty().html(selectedQuantity);
                        $updatedQuantity.parent().addClass('hide');
                        if (selectedQuantity > 1) {
                            $updatedQuantity.parent().removeClass('hide');
                        }
                        this.updateCartTotals(data.cartModel);
                        this.updateApproachingDiscounts(data.cartModel.approachingDiscounts);
                        this.updateAvailability(data.cartModel, uuid);
                        this.updateProductDetails(data, uuid);
                        if (data.uuidToBeDeleted) {
                            $('.uuid-' + data.uuidToBeDeleted).remove();
                        }
                        this.validateBasket(data.cartModel);
                        $('body').trigger('cart:lineItemEdited', {
                            basket: data.cartModel
                        });
                        $('body').trigger('cart:update');
                        $.spinner().stop();
                    }
                }.bind(this),
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        if (err.responseJSON.messages) {
                            var availabilityMessages = [];
                            var availabilityValue = '';
                            availabilityMessages = err.responseJSON.messages;
                            if (availabilityMessages.length === 2) {
                                availabilityValue = '<div class="b-product-quickview-stock_icon"></div><div class="b-product-quickview-stock_text">';
                            }
                            availabilityMessages.forEach((message) => {
                                availabilityValue += `<div>${message}</div>`;
                            });
                            if (availabilityMessages.length === 2) {
                                availabilityValue += '</div>';
                            }
                            $('.b-product-quickview-stock_Message').removeClass('hide');
                            $('.b-product-quickview-stock_Message').empty().html(availabilityValue);
                        } else {
                            this.createErrorNotification(err.responseJSON.errorMessage, $target);
                        }
                        $.spinner().stop();
                    }
                }
            });
        }
    }


}

