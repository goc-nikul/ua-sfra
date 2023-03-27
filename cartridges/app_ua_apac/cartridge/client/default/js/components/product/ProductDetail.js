'use strict';

import ProductDetailEMEA from 'falcon/components/product/ProductDetailEMEA';

var scrollAnimate = require('org/components/scrollAnimate');
var savedItem = true;
var productId;
var isVisible = require('org/components/isVisible');

export default class ProductDetail extends ProductDetailEMEA {
    onupdateAddToCartModal(e, responseData) {
        var url = $('.added-tocart-confirmation-modal-url').val();
        var form = {};
        form = {
            pid: $('.l-pdp.product-detail').data('pid'),
            qty: $('.js-quantity-select').val()
        };
        var lineItem = responseData.cart.items.find(item => responseData.pliUUID === item.UUID);
        form.isPersonalizationEligible = lineItem.isPersonalizationEligible;
        if (lineItem.isPersonalizationEligible) {
            form.personalizationDetail = lineItem.personalizationDetail;
            form.optionalItemPrice = lineItem.priceTotal.optionalItemPrice;
        }
        if ($('.js-cmp-productDetail form.e-giftcard').length) {
            var amount = $('.js-cmp-productDetail form.e-giftcard').find('.js-giftcard-amount').val();
            form.gcAmount = parseFloat(amount).toFixed(2);
        }
        if ($('.b-size_pdp .b-select-size-outer ul li a.selected').length > 0 && $('.b-size_pdp .b-select-size-outer ul li a.selected').attr('data-size-attr')) {
            form.gcAmount = $('.b-size_pdp .b-select-size-outer ul li a.selected').attr('data-size-attr');
        }
        $.spinner().start();
        if (url) {
            $.ajax({
                url: url,
                type: 'get',
                data: form,
                success: function (response) {
                    $('#cartConfirmationModal .js-product-detailsConfirmation').html(response);
                    $('#cartConfirmationModal').modal('show');
                    if ($('.b-add-to-cart-confirmation-modal-container').data('giftcard') === true) {
                        $('.b-cart-added-confirmation-modal').find('.b-cart-content-recommendation').hide();
                    }
                    $('.js-confirmation-modal-recommendation-tiles').removeClass('hide');
                    $('.b-cart-added-confirmation-modal').find('.product-listing').trigger('mainCarousel:update');
                    $.spinner().stop();
                    setTimeout(function () {
                        $('body').trigger('components:init');
                    }, 500);
                },
                error: function (err) {
                    console.log(err);
                }
            });
        }
    }

    onAddToCart(event) {
        var addToCartUrl;
        var pidsObj;
        var setPids;
        var requiredSelections = ['color', 'length', 'size', 'amount'];

        if ($('.b-add_to_bag .js-add-to-cart', this.$el).attr('exclusive-oos') === 'true') {
            return;
        }

        var $target;
        if (event !== undefined) {
            $target = $(event.target);
            if ($target.hasClass('js-update-cart-product-global js-add-to-cart')) {
                return;
            }
        }

        if (savedItem || productId !== this.$el.data('pid')) {
            $('.b-add_to_bag', this.$el).spinner().start();
            $('.b-add_to_bag .js-add-to-cart', this.$el).html('');
            this.$el.trigger('product:beforeAddToCart', this.$addToCartButton);

            if ($('.set-items').length && this.$addToCartButton.hasClass('add-to-cart-global')) {
                setPids = [];

                $('.product-detail', this.$el).each(function () {
                    if (!this.$addToCartButton.hasClass('product-set-detail')) {
                        setPids.push({
                            pid: this.$addToCartButton.find('.product-id').text(),
                            qty: this.$addToCartButton.find('.js-quantity-select').val(),
                            options: this.getOptions(this.$addToCartButton)
                        });
                    }
                });
                pidsObj = JSON.stringify(setPids);
            }

            addToCartUrl = this.getAddToCartUrl($target);
            var form;
            if (event !== undefined && event.currentTarget.closest('.b-cart-btn_savelater') !== null) {
                savedItem = false;
                productId = this.$el.data('pid');
                form = {
                    pid: this.$el.data('pid'),
                    pidsObj: pidsObj,
                    childProducts: this.getChildProducts(),
                    quantity: 1
                };
            } else {
                form = {
                    pid: this.$el.data('pid'),
                    pidsObj: pidsObj,
                    childProducts: this.getChildProducts(),
                    quantity: this.getQuantitySelected(this.$addToCartButton) || 1
                };
            }

            if (!$('.bundle-item', this.$el).length) {
                form.options = this.getOptions();
            }

            if ($('input[type="hidden"][name="personalizationName"]').length > 0) form.personalizationName = $('input[name="personalizationName"]').val();
            if ($('input[type="hidden"][name="personalizationNumber"]').length > 0) form.personalizationNumber = $('input[name="personalizationNumber"]').val();
            if ($('input[type="hidden"][name="personalizationSponsors"]').length > 0) form.personalizationSponsors = $('input[name="personalizationSponsors"]').val();

            var eGiftCardFormData = {};
            if (this.$eGiftCardForm.length > 0) {
                var eGiftCardData = this.$eGiftCardForm.serializeArray();
                eGiftCardData.forEach(function (data) {
                    eGiftCardFormData[data.name] = data.value;
                });
                form.eGiftCardData = JSON.stringify(eGiftCardFormData);
            } else if (this.$el.find('.b-cart-btn_savelater').length > 0) {
                eGiftCardFormData.gcRecipientName = this.$el.find('p.t-lineitem_attributes.gcrecipientname').data('gcrecipientname');
                eGiftCardFormData.gcRecipientEmail = this.$el.find('p.t-lineitem_attributes.gcrecipientemail').data('gcrecipientemail');
                eGiftCardFormData.gcFrom = this.$el.find('p.t-lineitem_attributes.gcfrom').data('gcfrom');
                eGiftCardFormData.gcDeliveryDate = this.$el.find('p.t-lineitem_attributes.gcdeliverydate').data('gcdeliverydate');
                eGiftCardFormData.gcMessage = this.$el.find('.gcmessage').data('gcmessage');
                eGiftCardFormData.gcAmount = this.$el.find('.gcamount').data('gcamount');
                form.eGiftCardData = JSON.stringify(eGiftCardFormData);
            }

            this.$addToCartButton.trigger('updateAddToCartFormData', form);
            $('.error-message-text').empty();
            const self = this;
            if (addToCartUrl) {
                var missingSelection = [];
                $.each(requiredSelections, function (index, attributeKey) {
                    var attribute = self.$attrsContainer.find('.b-product_attrs-item[data-attr="' + attributeKey + '"]');
                    if (self.config && self.config.cmp === 'productQuickView') {
                        attribute = self.$attrsContainer.find('.b-product_qvattrs-item[data-attr="' + attributeKey + '"]');
                        attribute.find('.selected.disabled').addClass('m-active');
                    }
                    if (attribute.length) {
                        if (attribute.find('.m-active').length === 0 && attribute.find('.selected').length === 0) {
                            missingSelection.push(attributeKey);
                            attribute.addClass('has-error');
                            if (attribute.find('.invalid-feedback').length) {
                                attribute.find('.invalid-feedback').show();
                            } else {
                                attribute.append('<div class="invalid-feedback">' + attribute.data('error-label') + '</div>');
                            }
                            $('body').trigger('addtobag:error', { errorMsg: attribute.data('error-label') });
                            if (!isVisible(attribute)) {
                                scrollAnimate(attribute);
                            }
                        } else if (attribute.find('.m-active.disabled').length && attribute.find('.selected.disabled').length) {
                            missingSelection.push(attributeKey);
                            var oosMsg = attribute.find('.m-' + attribute.data('attr')).data('error-message-label');
                            if (attribute.find('.selection-error-message').length) {
                                attribute.find('.selection-error-message').show();
                            } else if (self.config && self.config.cmp === 'productQuickView') {
                                attribute.find('.b-product_attribute').append('<div class="selection-error-message">' + oosMsg + '</div>');
                            } else {
                                attribute.append('<div class="selection-error-message">' + oosMsg + '</div>');
                            }
                            $('body').trigger('addtobag:error', {
                                errorMsg: oosMsg
                            });
                        } else {
                            attribute.removeClass('has-error');
                            attribute.find('.invalid-feedback').hide();
                            attribute.find('.selection-error-message').hide();
                        }
                    }
                });
                if (missingSelection.length === 0) {
                    var dateExceeded = $(this.$el).find('.earlierdate').val();
                    var egcUrl = $(this.$el).find('.js-add-to-cart').data('egc-editurl');
                    var isTrueSet = (dateExceeded === 'true');
                    if ((this.$el.hasClass('egiftcardlineitem') || this.$el.hasClass('cart-savelater-product')) && isTrueSet) {
                        $('.eGCModal').modal('show');
                        $('.eGCModal').find('.js-edit-saveforlater').attr('href', egcUrl);
                        savedItem = true;
                        $.spinner().stop();
                        $('.b-add_to_bag').spinner().stop();
                        $('.js-add-to-cart').text($('.js-add-to-cart').data('addto-bag'));
                    } else {
                        $.ajax({
                            url: addToCartUrl,
                            method: 'POST',
                            data: form,
                            context: this,
                            success: this.onSuccessAddToCart.bind(this),
                            error: function () {
                                $.spinner().stop();
                                $('.js-add-to-cart').text($('.js-add-to-cart').data('has-error'));
                            }
                        });
                        event.stopPropagation();
                    }
                } else {
                    $.spinner().stop();
                    $('.b-add_to_bag').spinner().stop();
                    $('.js-add-to-cart').text($('.js-add-to-cart').data('addto-bag'));
                }
            }
        }
    }

    getOptions() {
        var options = this.$el.find('.product-option')
            .map((index, option) => {
                var $elOption = $(option).find('.options-select');
                var urlValue = $elOption.val();
                var selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                    .data('value-id');
                return {
                    optionId: $(option).data('option-id'),
                    selectedValueId: selectedValueId
                };
            }).toArray();

        return JSON.stringify(options);
    }
}
