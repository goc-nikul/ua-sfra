'use strict';

import Component from '../core/Component';
import util from '../../util';
import ToastMessage from 'org/components/common/ToastMessage';

var scrollAnimate = require('../scrollAnimate');
var isVisible = require('../isVisible');
var savedItem = true;
var productId;
var carouselWrapperWidth;
var defaultImageUrl;
var defaultVideoPosterUrl;
var defaultModelSpec;
var freeShippingBar = require('org/components/cart/FreeShippingBar');

export default class Product extends Component {
    init() {
        super.init();

        this.$addToCartButton = $(`.js-add-to-cart[data-pid="${this.$el.data('pid')}"]`, this.$el);
        this.$eGiftCardForm = $('.js-cmp-productDetail form.e-giftcard');
        this.$colorSwatchButtons = $('.js-swatch-link');
        this.$sizeSwatchButtons = $('body').find('.js-size-select');
        this.$quantitySelect = $('.js-quantity-select');
        this.$body = $('body');
        this.$productImageModal = $('body').find('.zoomImageCount');
        this.$productImageModalHide = $('body').find('.js-productZoom-modal-hide');
        this.$productGalleryIndex = $('body').find('.l-pdp-gallery .b-product_carousel-slide');
        this.$productGalleryIndexMobile = $('body').find('.b-product_carousel-pdp .js-product_carousel-slide');
        this.$eGiftCardDate = $('body').find('.js-deliverydate');
        this.$eGiftCardAmount = $('body').find('.js-giftcard-amount');
        this.$eGiftCardFields = $('body').find('#gc-recipient-name, #gc-from');
        this.$attrsContainer = $('.b-product_attrs', this.$el);
        this.initEvents();
        this.updateSizeVal();
        this.showMoreLess();
        this.videoHover();
        this.showMoreLessColor();
        this.initSaveLaterEvents();
        this.zoomModalPaginationScroll();
        // this.updateDate();
        this.$mainImage = $('.js-product_carousel-image', this.$el);
        this.$swatchesContainer = $('.b-product_attribute', this.$el);
        this.prepopulateSize();
    }

    initEvents() {
        this.$addToCartButton.on('click', this.onAddToCart.bind(this));
        this.event('submit', this.eGiftCardAddToCart.bind(this), this.$eGiftCardForm);
        this.eventDelegate('click', '.js-swatch-link', this.onColorChange.bind(this));
        this.eventDelegate('click', '.js-size-select', this.onSizeChange.bind(this));
        this.eventDelegate('change', '.js-quantity-select', this.onQuantityChange.bind(this));
        this.eventDelegate('click', '.js-open-qualtrics', this.onQualtricModal.bind(this));

        this.event('bonusproduct:updateSelectButton', this.enableBonusProductSelection, this.$body);
        this.eventDelegate('click', '.zoomImageCount', this.productImageModal.bind(this));
        this.eventDelegate('click', '.js-productZoom-modal-hide', this.productImageModalHide.bind(this));
        this.eventDelegate('click', '.l-pdp-gallery .b-product_carousel-slide', this.productGalleryIndex.bind(this));
        this.eventDelegate('click', '.b-product_carousel-pdp .js-product_carousel-slide', this.productGalleryIndexMobile.bind(this));
        this.eventDelegate('click', '.l-pdp-images .js-pdp-open-zoommodal', this.productPdpZoomModal.bind(this));
        this.eventDelegate('click', '.pdp-modal-zoom .b-product_carousel-pagination-dot', this.productZoomModalPagination.bind(this));
        this.event('change', this.checkDateCheck.bind(this), this.$eGiftCardDate);
        this.event('change', this.checkAmountCheck.bind(this), this.$eGiftCardAmount);
        this.event('keypress keyup keydown textInput', this.checkSpaceForFields.bind(this), this.$eGiftCardFields);
        this.event('blur focusout', this.checkSpaceForFieldsBlur.bind(this), this.$eGiftCardFields);
        this.eventDelegate('mouseenter', '.js-swatch-link', this.onColorChangeImage.bind(this));
        defaultImageUrl = $('.js-product_carousel-image', this.$el).attr('src');
        defaultVideoPosterUrl = $('.js-product-360-video', this.$el).attr('poster');
        defaultModelSpec = $('.js-swatch-link.m-active', this.$el).attr('data-product-modelspec');
        this.eventDelegate('change', '.js-pdp-select-model', this.onColorChange.bind(this));
        this.event('product:updateModelSizeOptions', this.updateAvailableModelSize, this.$body);
        this.event('product:updateNotifyMe', (e, data) => this.updateNotifyMe(data), this.$body);
    }

    initSaveLaterEvents() {
        this.eventDelegate('click', '.js-save-later', this.isWishListItemExist.bind(this));
    }

    getAddToCartUrl(target) {
        var addToCart = $(this.$el).find('.add-to-cart-url').val();
        if (target !== undefined && $('.b-cart-content.cart').length > 0 && target.hasClass('js-save-to-cart')) {
            addToCart += '?isfromSaveForLater=true';
        }
        return addToCart;
    }

    onSelectAttribute() {
        var variationOuter = this.$el.find('.b-product_attrs-item');
        if ($(this.$el).hasClass('product-quickview')) {
            variationOuter = this.$el.find('.b-product_qvattrs-item');
        }
        variationOuter.each(function () {
            if ($(this).hasClass('has-error')) {
                $(this).removeClass('has-error')
                    .find('.invalid-feedback').hide();
            }
        });

        var $element = variationOuter.find('.selection-error-message');
        if ($element.is(':visible')) {
            $element.hide();
        }
    }

    zoomModalPaginationScroll() {
        carouselWrapperWidth = $('.pdp-modal-zoom .b-product_carousel-wrapper .b-product_carousel-slide', this.$el).outerWidth();
        $('.pdp-modal-zoom .b-product_carousel-wrapper', this.$el).on('scroll', function () {
            var scrollPos = $(document).scrollTop();
            $('.b-product_carousel-pagination .b-product_carousel-pagination-dot', this.$el).each(function () {
                var $this = $(this);
                var scrollElement = $($this.attr('href'));
                var carouselPagination = $('.b-product_carousel-pagination .b-product_carousel-pagination-dot');
                if (scrollElement.position().top <= scrollPos && scrollElement.position().top + scrollElement.height() > scrollPos && $(window).width() > 1023) {
                    carouselPagination.removeClass('b-product_carousel-pagination-active');
                    $this.addClass('b-product_carousel-pagination-active');
                } else if ($(window).width() < 1024) {
                    var activeDot = Math.round(Math.abs($('.pdp-modal-zoom .b-product_carousel-wrapper .b-product_carousel-slide').position().left / carouselWrapperWidth)) + 1;
                    carouselPagination.removeClass('b-product_carousel-pagination-active');
                    $('.b-product_carousel-pagination .b-product_carousel-pagination-dot:nth-child(' + activeDot + ')').addClass('b-product_carousel-pagination-active');
                } else {
                    $this.removeClass('b-product_carousel-pagination-active');
                }
            });
        });
    }

    /* updateDate() {
        var giftcardPage = $('.b-physicalgiftcard_outer');
        if (giftcardPage) {
            var nowDate = new Date();
            if ($('.line-item-date').length > 0) {
                var lineItemDate = $('.line-item-date').val();
                nowDate = new Date(lineItemDate);
            }
            var day = ('0' + nowDate.getDate()).slice(-2);
            var month = ('0' + (nowDate.getMonth() + 1)).slice(-2);
            var today = nowDate.getFullYear() + '-' + (month) + '-' + (day);
            $('.js-deliverydate').val(today);
            $('.js-deliverydate').attr('value', today);
        }
    } */
    updateSizeVal() {
        var $swatchSizeVaraint = $('.b-size_outer .js-sizeAttributes', this.$el);
        var self = this;
        $('.b-select-size-outer .b-swatches_sizes', this.$el).each(function () {
            var siteValue = $('#size-selected', self.$el).attr('data-attr-site') ? $('#size-selected', self.$el).attr('data-attr-site') : '';
            var sizeSelect = $('.b-size_outer .js-sizeAttributes a.selected', self.$el).parent('li');
            var lengthSelected = $('.b-length_outer .js-sizeAttributes a.selected', self.$el).parent('li');
            var sizeSelectValue = $('.b-size_outer .js-sizeAttributes a.selected', self.$el).attr('data-size-attr');

            if (siteValue !== 'EU' && siteValue !== 'UKIE' && lengthSelected.length > 0 && sizeSelect.length > 0) {
                $('.js-selected-size', self.$el).html(sizeSelectValue);
            } else if (siteValue !== 'EU' && siteValue !== 'UKIE' && sizeSelect.length > 0) {
                $('.js-selected-size', self.$el).html(sizeSelectValue);
            }
        });

        var $sizeMoreLess = $('.b-size-more_less', this.$el);
        if ($(window).width() >= 1024) {
            if ($swatchSizeVaraint.length > 30) {
                $sizeMoreLess.show();
            }
        } else if ($(window).width() < 1024) {
            if ($swatchSizeVaraint.length > 20) {
                $sizeMoreLess.show();
            }
        }
    }
    showMoreLessColor() {
        const lastVisibleClassName = 'last-visible';
        const visibleMobileRows = 3;
        const visibleDesktopRows = 4;

        $(this.$el).find('.b-product_attribute.m-color').each((i, el) => {
            const $colorSwatchBlock = $(el);
            const $swatchesListContainer = $colorSwatchBlock.find('.b-swatches_circle');
            const $colorSwatchItems = $colorSwatchBlock.find('.b-swatches_circle-item');
            const $colorSwatchActionCTAs = $colorSwatchBlock.find('.b-color-more_less');
            let initial = true;

            const calculateVisibleSwatches = () => {
                // in order to skip desktop version for mobile view
                if (!$colorSwatchItems.is(':visible')) {
                    return;
                }
                const showMoreLessWidth = Math.ceil($colorSwatchActionCTAs.width() || 0);
                const swatchWidth = Math.ceil($colorSwatchItems.eq(0).width() || 0);
                const cssGap = $swatchesListContainer.css('column-gap') || '';
                const gap = Number(cssGap.replace(/[\D]/g, '')) || 0;
                const swatchesListContainerWidth = Math.floor($swatchesListContainer.width() || 0);
                let leftFreeRowSpace = swatchesListContainerWidth;
                let itemsInTheRow = 0;
                while (leftFreeRowSpace > swatchWidth) {
                    leftFreeRowSpace -= (swatchWidth + gap);
                    itemsInTheRow++;
                }

                const visibleRows = $(window).width() < 1025 ? visibleMobileRows : visibleDesktopRows;
                const totalVisibleSwatches = visibleRows * itemsInTheRow;

                $colorSwatchItems.filter(`.${lastVisibleClassName}`).removeClass(lastVisibleClassName);
                if ($colorSwatchItems.length > totalVisibleSwatches) {
                    let overlappedWidth = showMoreLessWidth - leftFreeRowSpace;
                    let overlappedSwatchCount = 0;

                    while (overlappedWidth > 0) {
                        overlappedWidth -= (swatchWidth + gap);
                        overlappedSwatchCount++;
                    }

                    const lastVisibleIndex = (visibleRows * itemsInTheRow) - overlappedSwatchCount - 1;
                    $colorSwatchItems.eq(lastVisibleIndex).addClass(lastVisibleClassName);

                    if (initial && lastVisibleIndex < $colorSwatchItems.filter('.swiper-slide-activated').eq(0).index()) {
                        $colorSwatchBlock.addClass('show-all');
                        $('body').trigger('product:showMoreFired', {
                            type: 'color',
                            name: 'product: showMoreFired'
                        });
                    }
                }
            };

            $(window).on('resize', () => {
                calculateVisibleSwatches();
            });
            calculateVisibleSwatches();

            $colorSwatchBlock.on('click', '.js-color-show-more', function () {
                $colorSwatchBlock.addClass('show-all');
                initial = false;

                $('body').trigger('product:showMoreFired', {
                    type: 'color',
                    name: 'product: showMoreFired'
                });
            });
            $colorSwatchBlock.on('click', '.js-color-show-less', function () {
                $colorSwatchBlock.removeClass('show-all');
                initial = false;
            });
        });
    }

    showMoreLess() {
        $(this.$el).on('click', '.js-show-more', function (e) {
            var element = $('.b-size-more_less', this.$el);
            var parent = $('.b-swatches_sizes', this.$el);
            if (!e.isTrigger) {
                parent.find('li').removeClass('colorChange sizeChange');
            }
            var isColorOrSizeChange = parent.find('li').hasClass('colorChange') || parent.find('li').hasClass('sizeChange');
            if (!isColorOrSizeChange) {
                if ($(window).width() < 1025) {
                    parent.find('li.hideNowMobile').addClass('showNowMobile');
                    element.find('.js-show-more').addClass('hide');
                    element.find('.js-show-more').removeClass('show');
                    element.find('.js-show-less').addClass('show');
                    element.find('.js-show-less').removeClass('hide');
                } else {
                    parent.find('li.hideNow').addClass('showNow');
                    element.find('.js-show-more').addClass('hide');
                    element.find('.js-show-more').removeClass('show');
                    element.find('.js-show-less').addClass('show');
                    element.find('.js-show-less').removeClass('hide');
                }
                $('body').trigger('product:showMoreFired', {
                    type: 'size',
                    name: 'product: showMoreFired'
                });
            }
        });
        $(this.$el).on('click', '.js-show-less', function (e) {
            var element = $('.b-size-more_less', this.$el);
            var parent = $('.b-swatches_sizes', this.$el);
            if (!e.isTrigger) {
                parent.find('li').removeClass('colorChange sizeChange');
            }
            var isColorOrSizeChange = parent.find('li').hasClass('colorChange') || parent.find('li').hasClass('sizeChange');
            if (!isColorOrSizeChange) {
                if ($(window).width() < 1025) {
                    parent.find('li.showNowMobile').removeClass('showNowMobile');
                    element.find('.js-show-less').addClass('hide');
                    element.find('.js-show-less').removeClass('show');
                    element.find('.js-show-more').addClass('show');
                    element.find('.js-show-more').removeClass('hide');
                } else {
                    parent.find('li.hideNow.showNow').removeClass('showNow');
                    element.find('.js-show-less').addClass('hide');
                    element.find('.js-show-less').removeClass('show');
                    element.find('.js-show-more').addClass('show');
                    element.find('.js-show-more').removeClass('hide');
                }
            }
        });
    }

    /**
* A function that handles the hover event of a specific element and plays the video contained within it.
*
* @function
* @returns {void}
*/
    videoHover() {
/**
* A nested function that plays the video when the user hovers over it.
*
* @function
* @returns {void}
*/
        function hoverVideo() {
            const videoEl = $('video', this).get(0);
            if (videoEl) {
                videoEl.play();
            }
        }
    // Attach the hoverVideo function to the mouseenter event of the ".js-pdp-open-zoommodal" element.
        $('.product-detail .js-pdp-open-zoommodal').on('mouseenter', hoverVideo);
    }

    onQualtricModal(e) {
        if (window.matchMedia('(max-width: 1024px)').matches) {// eslint-disable-line
            e.preventDefault();
            $('#qualtricsModal').modal('show');
        }
    }

    onAddToCart(event) {
        var addToCartUrl;
        var pidsObj;
        var setPids;
        var requiredSelections = ['color', 'length', 'size', 'amount'];

        if ($('.b-add_to_bag .js-add-to-cart', this.$el).attr('exclusive-oos') === 'true' || $('.b-add_to_bag .js-add-to-cart', this.$el).data('is-coming-soon') === true) {
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
                    quantity: 1,
                    mpid: this.$el.data('pid')
                };
            } else {
                form = {
                    pid: this.$el.data('pid'),
                    pidsObj: pidsObj,
                    childProducts: this.getChildProducts(),
                    quantity: this.getQuantitySelected(this.$addToCartButton) || 1,
                    mpid: this.$el.data('mpid')
                };
            }

            if (!$('.bundle-item', this.$el).length) {
                form.options = this.getOptions();
            }

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

            form.isPickupItem = false;
            if (this.$el.find('.b-store-choose-link').find('.b-ship-pick.selected').data('delivery') === 'storepickup') {
                form.isPickupItem = true;
            }

            form.isQuickAdd = false;
            if ($('.b-add_to_bag .js-add-to-cart', this.$el).attr('data-quickadd') === 'true') {
                form.isQuickAdd = $('.b-add_to_bag .js-add-to-cart', this.$el).attr('data-quickadd');
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
                        if (event) {
                            event.stopPropagation();
                        }
                    }
                } else {
                    $.spinner().stop();
                    $('.b-add_to_bag').spinner().stop();
                    $('.js-add-to-cart').text($('.js-add-to-cart').data('addto-bag'));
                }
            }
        }
    }

    onSuccessAddToCart(data) {
        if (data && data.pdpRedirect) {
            // Redirect to Early Access Product PDP
            window.location.href = data.pdpRedirect;
        }
        this.handlePostCartAdd(data);
        var addedToCart = $('.js-add-to-cart', this.$el).data('added-msg');
        var addAnother = $('.js-add-to-cart', this.$el).data('add-another');
        var addToBagMsg = $('.js-add-to-cart').data('addto-bag');
        var hasError = $('.js-add-to-cart', this.$el).data('has-error') || addToBagMsg;
        var resetQuantity = true;

        if ($('.b-cart-content.cart').length > 0) {
            if (data && data.savedItemAvailabilityError) {
                $('.availability-err', this.$el).removeClass('hide');
                $.spinner().stop();
                $('.b-add_to_bag', this.$el).spinner().stop();
                $('.js-add-to-cart', this.$el).text(addToBagMsg);
                return;
            }

            if (data && data.cart.freeShippingBar) {
                freeShippingBar.methods.updateShippingBar(data.cart.freeShippingBar);
                freeShippingBar.methods.getShippingPromo(data.cart.totals);
            }

            if (!this.$el.hasClass('product-recommendation-quickview')) {
                this.onAddToCartRemoveSaveFromLater(data);
                if (data.cart.hasPreOrder) {
                    $('.js_paypal_button').addClass('hide');
                    $('.js_paypal_button', this.$el).parents('.b-product_actions-inner').addClass('btn-align-mobile');
                } else {
                    $('.js_paypal_button').removeClass('hide');
                    $('.js_paypal_button', this.$el).parents('.b-product_actions-inner').removeClass('btn-align-mobile');
                }
            } else if (data.renderedTemplate) {
                this.$body.trigger('cart:updateCartTotals', [data.cart, this]);
                if ($('.cart').find('.b-cartlineitem').length === 0) {
                    window.location.reload();
                } else {
                    // update cart product cards markup
                    $('.js-cart-items').replaceWith(data.renderedTemplate);
                    // set quantity select values for new product cards
                    Array.from($('.b-cart-content .b-cartlineitem .b-quantity-select')).map(function (select) {
                        $(select).val(parseInt($(select).data().preSelectQty, 10));
                        return select.value;
                    });
                    resetQuantity = false;
                    $('body').trigger('cart:update');
                }
            }
            if ((data.cart.hasGiftCards || data.cart.hasPreOrder) && $('.b-cart_klarna-placement').length > 0) {
                $('.b-cart_klarna-placement').addClass('hide');
            } else {
                $('.b-cart_klarna-placement').removeClass('hide');
            }
        }
        var srContainer = $('.b-cart-content_right .b-cart_shoprunner').closest('div');
        if (data.cart && data.cart.srEligible && srContainer.hasClass('hide')) {
            srContainer.removeClass('hide');
        }
        var analyticsData = {
            analytics: {
                isWishlist: true,
                quantityAdded: this.getQuantitySelected(this.$addToCartButton) || 1,
                isQuickAdd: this.$addToCartButton.closest('.quick-add-dialog, .js-tile-quickAdd_buttonn').length > 0
            }
        };
        $('body').trigger('product:afterAddToCart', $.extend(data, analyticsData));
        this.afterAddToCart();
        $.spinner().stop();
        $('.b-add_to_bag').spinner().stop();
        if (!data.error) {
            this.$el.find('.js-add-to-cart').addClass('f-added-check').html(addedToCart);
            var self = this;
            setTimeout(function () {
                self.$el.find('.js-add-to-cart.f-added-check').removeClass('f-added-check').html(addAnother);
            }, 5000);
        } else {
            this.$el.find('.js-add-to-cart').html(hasError);
        }
        if (resetQuantity) {
            const resetDelay = 3000;

            setTimeout(() => {
                if (this.$el.length && this.$el.is(':visible')) {
                    var $qtySelect = $('.js-quantity-select', this.$el);
                    $qtySelect.find('option:selected').removeAttr('selected');
                    $qtySelect.val($('.js-quantity-select option:first').attr('selected', 'selected').val());
                    if ($('.b-cart-content.cart').length === 0) {
                        $qtySelect.trigger('change');
                    }
                }
            }, resetDelay);
        }
    }

    isWishListItemExist(event) {
        event.preventDefault();
        var $target = this.$el.find('.js-save-later');
        $target.css('pointer-events', 'none');
        var url = $target.attr('data-wishlistexist');
        var productID = $target.attr('data-pid');
        var uuid = $target.data('uuid');
        var urlParams = {
            pid: productID,
            uuid: uuid
        };

        url = util.appendParamsToUrl(url, urlParams);
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            context: this,
            success: function (data) {
                $target.css('pointer-events', '');
                if (data !== null && data.isWishListItem) {
                    var status = 'b-alert-success js-alert-success';
                    var msg = $target.data('msg');
                    $('.add-to-wishlist-messages').remove();
                    if ($('.add-to-wishlist-messages b-alert-container').length === 0) {
                        $('body').append(
                            '<div class="add-to-wishlist-messages b-alert-container"></div>'
                        );
                    }
                    $('.add-to-wishlist-messages')
                        .append('<div class="add-to-wishlist-alert text-center ' + status + '">' + msg + '</div>');

                    setTimeout(function () {
                        $('.add-to-wishlist-messages').remove();
                    }, 3000);
                    // this.$el.find('.is-wishlist-item').text('This Product Already Exists in WishList');
                } else {
                    this.onSaveLater(event);
                }
            },
            error: function (err) {
                $target.css('pointer-events', '');
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    this.createErrorNotification(err.responseJSON.errorMessage, $target);
                    $.spinner().stop();
                }
            }
        });
    }

    /**
     * re-renders the order totals and the number of items in the cart
     * @param {Object} message - Error message to display
     * @param {Object} $target - Error message to display in the cart row
     */
    createErrorNotification(message, $target) {
        var errorHtml = `<div class="error-handling alert alert-danger alert-dismissible
            fade show" role="alert">
            <span class="error-handling-icon"></span>
            <span class="error-handling-text">${message}</span>
            <button type="button" class="close error-handling-close" data-dismiss="alert" aria-label="Close">
            </button></div>`;
        if ($target !== undefined) {
            $target.closest('.card.card-product-info').append(errorHtml);
        }
    }

    onSaveLater(event) {
        event.preventDefault();
        var $target = this.$el.find('.js-save-later');
        var url = $target.attr('href');
        var productID = $target.attr('data-pid');
        var uuid = $target.data('uuid');
        var urlParams = {
            pid: productID,
            uuid: uuid
        };

        url = util.appendParamsToUrl(url, urlParams);
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            context: this,
            success: function (data) {
                savedItem = true;
                $(document).find('.cart-saved-items').empty().html(data.renderedTemplate);
                this.removeLineItem(event, uuid);
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    this.createErrorNotification(err.responseJSON.errorMessage, $target);
                    $.spinner().stop();
                }
            }
        });
    }

    removeLineItem(event, uuid) {
        var cardTileComponent = $(`.b-cartlineitem[data-uuid="${uuid}"]`).data().cmpInstance;
        cardTileComponent.onCartDeleteConfirmation.apply(cardTileComponent, arguments, event);
    }

    onCartDeleteConfirmation(event) {
        event.preventDefault();
        var $target = this.$el.find(this.selectors.removeProduct);
        var productID = $target.attr('data-pid');
        var url = $target.data('action');
        var uuid = $target.data('uuid');
        var urlParams = {
            pid: productID,
            uuid: uuid
        };

        url = util.appendParamsToUrl(url, urlParams);

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            context: this,
            success: function (data) {
                if (data && data.errorEstimateMsg) {
                    new ToastMessage(data.errorEstimateMsg, {
                        duration: 3000,
                        type: 'error'
                    }).show();
                }

                $('body').trigger('product:removed', { productID: productID });
                var $bopis = false;
                if ($('.b-cart-bopis_shipping').length > 0 || $('.b-cart-pickup-heading').length > 0) {
                    $bopis = true;
                }
                if (data.basket.items.length === 0) {
                    var emptyContent = $('.b-cart_empty_basket.js-only_when_empty').removeClass('js-only_when_empty');
                    var contentAssetOuter = $('.b-cart_empty_basket_outer');
                    $('.cart .b-cart-content_left').empty().append(emptyContent);
                    $('.cart .b-cart-content_right').empty();
                    contentAssetOuter.append($.parseHTML(data.emptyCartContent));
                    $('.number-of-items').empty().append('(' + data.basket.resources.numberOfItems + ')');
                    $('.minicart-quantity').empty().append(data.basket.numItems);
                    if (data.basket.numItems === 0) {
                        $('.minicart-quantity').css('display', 'none');
                    } else {
                        $('.minicart-quantity').css('display', 'block');
                    }
                    $('.minicart-link').attr({
                        'aria-label': data.basket.resources.minicartCountOfItems,
                        title: data.basket.resources.minicartCountOfItems
                    });
                    $('.minicart .b-header_minicart-container').empty();
                    $('.minicart .b-header_minicart-container').removeClass('show');
                    $('.minicart .b-header_minicart-modal-backdrop').removeClass('show');
                    $('body').removeClass('modal-open');
                    $('html').removeClass('veiled');
                    $('#bodyPage').removeClass('adjustIosFooter ios-footer-adjustments');
                } else {
                    if (data.toBeDeletedUUIDs && data.toBeDeletedUUIDs.length > 0) {
                        for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
                            $('.uuid-' + data.toBeDeletedUUIDs[i]).remove();
                        }
                    }
                    $('.uuid-' + uuid).remove();
                    if (!data.basket.hasBonusProduct) {
                        $('.bonus-product').remove();
                    }
                    $('.coupons-and-promos').empty().append(data.basket.totals.discountsHtml);
                    this.updateCartTotals(data.basket);
                    this.updateApproachingDiscounts(data.basket.approachingDiscounts);
                    if ((data.basket.hasGiftCards || data.basket.hasPreOrder) && $('.b-cart_klarna-placement').length > 0) {
                        $('.b-cart_klarna-placement').addClass('hide');
                    } else {
                        $('.b-cart_klarna-placement').removeClass('hide');
                    }
                    $('body').trigger('setShippingMethodSelection', data.basket);
                    this.validateBasket(data.basket);
                    if (data.isVIP) {
                        $('.js_paypal_button').addClass('hide');
                        $('.js_paypal_button', this.$el).parents('.b-product_actions-inner').addClass('btn-align-mobile');
                    }
                }

                $('body').trigger('cart:afterItemRemove', {
                    removedProductUUID: uuid,
                    removedProductID: productID,
                    basket: data.basket
                });
                $('body').trigger('cart:update');

                var srContainer = $('.b-cart-content_right .b-cart_shoprunner').closest('div');
                if (data.basket && !data.basket.srEligible && !srContainer.hasClass('hide')) {
                    srContainer.addClass('hide');
                }
                if (data && data.basket.freeShippingBar) {
                    freeShippingBar.methods.updateShippingBar(data.basket.freeShippingBar);
                    freeShippingBar.methods.getShippingPromo(data.basket.totals);
                }
                $.spinner().stop();
                if ($bopis) { // eslint-disable-line
                    window.location.reload();
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else if ($('.b-cartlineitem.uuid-' + uuid).find('.error-handling').length > 0) {
                    $.spinner().stop();
                } else {
                    this.createErrorNotification(err.responseJSON.errorMessage, $target);
                    $.spinner().stop();
                }
            }
        });
    }
    afterAddToCart() {
        // Clear eGift Card form
        if (this.$eGiftCardForm.length > 0) {
            this.$eGiftCardForm[0].reset();
        }
    }

    eGiftCardAddToCart(event) {
        event.preventDefault();
        this.onAddToCart();
    }

    onAddToCartSaveFromLater(pliUUID) {
        var url = $('.cart-url').val();
        url = url + '?pliUUID=' + pliUUID;
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            context: this,
            success: function (data) {
                this.updateCartTotals(data.basket);
                this.updateApproachingDiscounts(data.basket.approachingDiscounts);
                $('body').trigger('setShippingMethodSelection', data.basket);
                this.validateBasket(data.basket);
                if ($('.cart').find('.b-cartlineitem').length === 0) {
                    window.location.reload();
                } else {
                    // eslint-disable-next-line no-lonely-if
                    if (data.hasOnlyItem) {
                        $('.b-cart-content.cart').find('.b-cart-inner-content_left').empty().append(data.renderedTemplate);
                    } else {
                        $('.b-cart-content.cart').find('.cart-left-inner').empty().append(data.renderedTemplate);
                    }
                }
            },
            error: function (err) {
                if (err.responseJSON) {
                    window.location.href = err.responseJSON;
                } else {
                    this.createErrorNotification(err.responseJSON);
                    $.spinner().stop();
                }
            }
        });
    }

    // eslint-disable-next-line no-unused-vars
    onAddToCartRemoveSaveFromLater(data) {
        var url = $(`.js-add-to-cart[data-pid="${this.config.mpid ? this.config.mpid : this.config.pid}"]`).parents('div.b-add_to_bag_container').siblings('div.wishlist-cart-remove').find('.js-remove-saveforlater').attr('href'); // eslint-disable-line

        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            context: this,
            // eslint-disable-next-line no-shadow
            success: function (data) {
                $('.cart-saved-items').empty().html(data.renderedTemplate);
                this.updateCartTotals(data.basket);
                this.updateApproachingDiscounts(data.basket.approachingDiscounts);
                $('body').trigger('setShippingMethodSelection', data.basket);
                this.validateBasket(data.basket);
                if (data && data.basket.freeShippingBar) {
                    freeShippingBar.methods.updateShippingBar(data.basket.freeShippingBar);
                    freeShippingBar.methods.getShippingPromo(data.basket.totals);
                }
                if ($('.cart').find('.b-cartlineitem').length === 0) {
                    window.location.reload();
                } else {
                    // eslint-disable-next-line no-lonely-if
                    if (data && data.isBopisEnabled) {
                        window.location.reload();
                    } else if (data.hasOnlyItem) {
                        $('.b-cart-content.cart').find('.b-cart-inner-content_left').empty().append(data.cartItemsRenderedTemplate);
                    } else {
                        $('.b-cart-content.cart').find('.cart-left-inner').empty().append(data.cartItemsRenderedTemplate);
                    }
                }
            },
            error: function (err) {
                if (err.responseJSON) {
                    window.location.href = err.responseJSON;
                } else {
                    this.createErrorNotification(err.responseJSON);
                    $.spinner().stop();
                }
            }
        });
    }

    /**
     * re-renders the approaching discount messages
     * @param {Object} approachingDiscounts - updated approaching discounts for the cart
     */
    updateApproachingDiscounts(approachingDiscounts) {
        var html = '';
        var promoHash = {};
        $('.approaching-discounts:last').find('.b-header_progress-bar').each(function () {
            promoHash[$(this).find('.approchingPromotionID').val()] = $(this).find('.meter span').attr('data-promo-width');
        });
        $('.approaching-discounts').empty();
        if (approachingDiscounts.length > 0) {
            approachingDiscounts.forEach(function (item) {
                if (item.progressBarEnabled) {
                    html += '<div class="b-header_progress-bar">';
                    html += `<h4 class="${item.approachingPromoPercentage === '100' ? 't-order_greentick' : 't-orderamount'}"><span></span>${item.discountMsg}</h4>`;
                    html += `<div class="meter nostripes ${item.approachingPromoPercentage === '100' ? 'green' : 'black'}">`;
                    html += `<span style="width: ${promoHash[item.promotionID] ? promoHash[item.promotionID] : '0%'}" data-promo-width="${item.approachingPromoPercentage + '%'}" data-previous-promo-width="${promoHash[item.promotionID] ? promoHash[item.promotionID] : '0%'}"></span>`;
                    html += '</div>';
                    html += `<input class="approchingPromotionID" type="hidden" value="${item.promotionID}"/>`;
                    html += '</div>';
                } else {
                    html += `<div class="single-approaching-discount text-center">${item.discountMsg}</div>`;
                }
            });
        }
        $('.approaching-discounts').append(html);
        $('.approaching-discounts').trigger('update:progressBar');
    }

    /**
     * Checks whether the basket is valid. if invalid displays error message and disables
     * checkout button
     * @param {Object} data - AJAX response from the server
     */
    validateBasket(data) {
        if (data.valid.error) {
            if (data.valid.message) {
                var errorHtml = `<div class="alert alert-danger alert-dismissible valid-cart-error
                    fade show" role="alert">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>${data.valid.message}</div>`;

                $('.cart-error').append(errorHtml);
            } else {
                $('.b-cart-content').empty().append(`<div class="row">
                    <div class="col-12 text-center">
                    <h1>${data.resources.emptyCartMsg}</h1>
                    </div>
                    </div>`
                );
                $('.number-of-items').empty().append('(' + data.resources.numberOfItems + ')');
                $('.minicart-quantity').empty().append(data.numItems);
                $('.minicart-link').attr({
                    'aria-label': data.resources.minicartCountOfItems,
                    title: data.resources.minicartCountOfItems
                });
                $('.minicart .b-header_minicart-container').empty();
                $('.minicart .b-header_minicart-container').removeClass('show');
                $('.minicart .b-header_minicart-modal-backdrop').removeClass('show');
            }

            $('.checkout-btn').addClass('disabled');
        } else {
            $('.checkout-btn').removeClass('disabled');
        }
    }

    /**
     * re-renders the order totals and the number of items in the cart
     * @param {Object} data - AJAX response from the server
     */
    updateCartTotals(data) {
        var freeText = $('#freeText').val();
        if (data.resources) {
            $('.number-of-items').empty().append('(' + data.resources.numberOfItems + ')');
        }
        $('.number-of-items-summary').empty().append('(' + data.numItems + ')');
        $('.shipping-cost').not('.shipping-bopis').closest('.order-summary_itemsvalue').removeClass('order-summary_discount');
        if (!data.totals) {
            return;
        }
        if (data.totals.totalShippingCostNonFormated === 0) {
            $('.shipping-cost').empty().append(freeText);
            $('.shipping-cost').closest('.order-summary_itemsvalue').addClass('order-summary_discount');
        } else {
            $('.shipping-cost').not('.shipping-bopis').empty().append(data.totals.totalShippingCost);
        }
        $('.tax-total').empty().append(data.totals.totalTax);
        $('.grand-total').empty().append(data.totals.grandTotal);
        if ($('.afterpay-data').data('isafterpayenabled')) {
            $('.afterPayCartPrice').empty().append($('.afterpay-data').data('afterpaydata1') + ' ' + data.totals.afterPayCartPrice + ' ' + $('.afterpay-data').data('afterpaydata2'));
        }

        if ($('.sub-total-na').length > 0) {
            $('.sub-total-na').empty().append(data.totals.newSubTotalWithoutCoupon.formatted);
        } else if ($('.sub-total-emea').length > 0) {
            $('.sub-total-emea').text(data.totals.subTotal);
        } else {
            $('.sub-total').text(data.totals.totalListPrice.formatted);
        }

        $('.minicart-quantity').empty().append(data.numItems);
        $('.minicart-link').attr({
            'aria-label': data.resources.minicartCountOfItems,
            title: data.resources.minicartCountOfItems
        });
        if (data.totals.estimatedLoyaltyPoints > 0) {
            $('.order-loyalty').removeClass('hide-order-discount');
            $('.order-loyalty').show();
            $('.order-loyalty-points').empty()
                .append('+' + data.totals.estimatedLoyaltyPoints);
        } else {
            $('.order-loyalty').addClass('hide-order-discount');
            $('.order-loyalty').hide();
        }
        if (data.totals.orderLevelDiscountTotal.value > 0) {
            if ('discountDistribution' in data.totals) {
                if (typeof data.totals.discountDistribution.isEmployeeDiscount !== undefined && data.totals.discountDistribution.isEmployeeDiscount && data.totals.discountDistribution.employeeDiscountTotalValue !== 0) {
                    $('.order-employee-discount').removeClass('hide-order-discount');
                    $('.order-employee-discount').show();
                    $('.order-employee-discount-total').empty()
                        .append(data.totals.discountDistribution.employeeDiscountTotal);
                } else {
                    $('.order-employee-discount').addClass('hide-order-discount');
                    $('.order-employee-discount').hide();
                }
                if (typeof data.totals.discountDistribution.isLoyaltyDiscount !== undefined && data.totals.discountDistribution.isLoyaltyDiscount && data.totals.discountDistribution.loyaltyDiscountTotalValue !== 0) {
                    $('.order-loyalty-discount').removeClass('hide-order-discount');
                    $('.order-loyalty-discount').show();
                    $('.order-loyalty-discount-total').empty()
                        .append(data.totals.discountDistribution.loyaltyDiscountTotal);
                } else {
                    $('.order-loyalty-discount').addClass('hide-order-discount');
                    $('.order-loyalty-discount').hide();
                }
                if (data.totals.discountDistribution.orderLevelDiscountValue > 0) {
                    $('.order-discount').removeClass('hide-order-discount');
                    $('.order-discount').show();
                    $('.order-discount-total').empty()
                        .append('- ' + data.totals.discountDistribution.orderLevelDiscountFormatted);
                } else {
                    $('.order-discount').addClass('hide-order-discount');
                    $('.order-discount').hide();
                }
            } else {
                $('.order-discount').removeClass('hide-order-discount');
                $('.order-discount').show();
                $('.order-discount-total').empty()
                    .append('- ' + data.totals.orderLevelDiscountTotal.formatted);
            }
        } else {
            $('.order-discount').addClass('hide-order-discount');
            $('.order-discount').hide();
            $('.order-employee-discount').addClass('hide-order-discount');
            $('.order-employee-discount').hide();
            $('.order-loyalty-discount').addClass('hide-order-discount');
            $('.order-loyalty-discount').hide();
        }
        if (data.totals.totalDiscount && data.totals.totalDiscount > 0) {
            $('.order-discount-total').empty().append('- ' + data.totals.totalDiscount.formatted);
        }
        if (data.totals.totalEmployeeDiscount && data.totals.totalEmployeeDiscount.value > 0) {
            $('.order-discount-total').empty().append('- ' + data.totals.totalEmployeeDiscount.formatted);
        }
        if (data.totals.saveTotal) {
            $('.order-saved-total').empty().append(data.totals.saveTotal.formatted);
        }

        if (data.totals.shippingLevelDiscountTotal.value > 0) {
            $('.shipping-discount').removeClass('hide-shipping-discount');
            $('.shipping-discount-total').empty().append('- ' +
                data.totals.shippingLevelDiscountTotal.formatted);
        } else {
            $('.shipping-discount').addClass('hide-shipping-discount');
        }

        $('.b-cart-order-promo').empty();
        if (data.totals.orderLevelDiscountTotal.value > 0 && 'discountDistribution' in data.totals) {
            const isEmployee = data.totals.discountDistribution.isEmployeeDiscount ? 'orderEmployee' : 'orderNonemployee';
            const discountLabel = $('.b-cart-order-promo').length > 0 ? $('.b-cart-order-promo').data(isEmployee).trim() : '';
            if (typeof data.totals.discountDistribution.isEmployeeDiscount !== undefined && data.totals.discountDistribution.isEmployeeDiscount && data.totals.discountDistribution.employeeDiscountTotalValue !== 0) {
                $('.b-cart-order-promo').append(`<div class=b-promotion-information><span class=b-promotion-name>${discountLabel}:</span><span class=b-promotion-value>${data.totals.discountDistribution.employeeDiscountTotal}</span></div>`);
            } else {
                $('.b-cart-order-promo').append(`<div class=b-promotion-information><span class=b-promotion-name>${discountLabel}:</span><span class=b-promotion-value>- ${data.totals.orderLevelDiscountTotal.formatted}</span></div>`);
            }
        }

        data.items.forEach(function (item) {
            if (item.renderedPromotions) {
                $('.item-' + item.UUID).empty().append(item.renderedPromotions);
            } else {
                $('.item-' + item.UUID).empty();
            }
            if (item.priceTotal && item.priceTotal.renderedPrice) {
                $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
            }
        });

        if (data.totals.klarnaTotal) {
            $('klarna-placement').attr('data-purchase-amount', data.totals.klarnaTotal);
            window.KlarnaOnsiteService = window.KlarnaOnsiteService || [];
            window.KlarnaOnsiteService.push({ eventName: 'refresh-placements' });
        }

        if ('shouldReloadPage' in data && data.shouldReloadPage) {
            window.location.reload();
        }
    }

    removeSizeParameterFromUrl(url) {
        var regex = /^\b(\w*dwvar_\w*_size=\w*)\b/;
        var urlValues = url.split('&');
        var updatedUrl;
        urlValues.forEach(function (value) {
            if (value.match(regex) === null) {
                updatedUrl = updatedUrl ? updatedUrl + '&' + value : value;
            }
        });
        return updatedUrl;
    }

    onColorChange(event, isTriggered) {
        event.preventDefault();

        var $link = $(event.target);
        if ($link.prop('disabled') || $link.hasClass('m-active')) {
            return;
        }

        if (isTriggered && $(event.currentTarget).hasClass('js-pdp-select-model')) {
            return;
        }
        this.onSelectAttribute($link);
        $link.parent('li').siblings().addClass('colorChange');
        var url = $link.parent('li').attr('data-url');
        var selectedValue = $link.data('attr-value');
        /* var isExchanOrderProducts = this.$el.parent().hasClass('order-exchange-product-details');
        if ($('.b-product_attribute.m-length').length === 1 && !isExchanOrderProducts) {
            url = this.removeSizeParameterFromUrl($link.closest('li').attr('data-url'));
        }*/

        if (selectedValue === undefined) {
            selectedValue = $('.b-swatches_circle-link.m-active', this.$el).data('attr-value');
        }
        if (url === undefined) {
            url = $('.b-swatches_circle-link.m-active', this.$el).parent('li').attr('data-url');
            // Add the color value to the selected color URL
            url = url.replace('color=', 'color=' + selectedValue);
        }

        if ($('.js-pdp-select-model', this.$el).val() !== '' && $('.js-pdp-select-model', this.$el).length > 0) {
            var selectedSize = $('.js-pdp-select-model', this.$el).val();
            var urlParams = {
                viewPreference: selectedSize
            };
            url = util.appendParamsToUrl(url, urlParams);
        }
        this.attributeSelect({
            option: 'color',
            value: selectedValue,
            valueUrl: url
        });
    }

    onSizeChange(event) {
        event.preventDefault();
        var $link = $(event.target).closest('a');
        var option = 'size';
        if ($link.prop('disabled') || $link.hasClass('m-active') || $link.hasClass('selected')) {
            return;
        }
        $link.parent('li').siblings().addClass('sizeChange');
        this.onSelectAttribute($link);
        var url = $link.closest('li').attr('data-url');
        if ($link.closest('.b-product_attribute').hasClass('m-length')) {
            option = 'length';
            url = this.removeSizeParameterFromUrl(url);
        }

        this.attributeSelect({
            option: option,
            value: $link.data('attr-value'),
            valueUrl: url
        });
    }

    onQuantityChange(event) {
        event.preventDefault();

        if ($('.bundle-items', this.$el).length === 0) {
            this.attributeSelect({
                option: 'quantity',
                value: event.currentTarget.value,
                valueUrl: $(event.currentTarget).find('option:selected').data('url')
            });
        }
    }

    enableBonusProductSelection(event, response) {
        $('button.select-bonus-product', response.$productContainer).prop('disabled',
            (!response.product.readyToOrder || !response.product.available));
        var pid = response.product.id;
        $('button.select-bonus-product').data('pid', pid);
    }

    productImageModal() {
        var $productZoomModal = $('#productZoomModal', this.$el);
        var productZoomNav = $productZoomModal.attr('data-navigate');
        util.branchCloseJourney();
        $('body').addClass('modal-opacity');
        $productZoomModal.modal('show');
        $('body').trigger('modalShown', {
            name: 'product: gallery zoom'
        });
        $('body').addClass('gallery-show');
        var $productZoomModalPagination = $productZoomModal.find('.b-product_carousel-pagination');
        carouselWrapperWidth = $productZoomModal.find('.b-product_carousel-wrapper .b-product_carousel-slide').outerWidth();
        if (productZoomNav) {
            if ($productZoomModalPagination.length > 0) {
                $productZoomModalPagination.find('a[href="#index-' + productZoomNav + '"]')[0].click();
            }
            $productZoomModal.removeAttr('data-navigate');
        } else if ($productZoomModalPagination.length > 0) {
            $productZoomModalPagination.find('a:first-child')[0].click();
        }
        if ($productZoomModal.length > 0 && $productZoomModal.is(':visible')) {
            $('body').addClass('m-accessible-on');
            $productZoomModal.on('mouseenter', '.js-productZoom-modal-hide', function () {
                $(this).focus();
            });
            $productZoomModal.find('.js-productZoom-modal-hide').trigger('mouseenter');
            setTimeout(function () {
                $('body').removeClass('modal-opacity');
            }, 300);
        }
    }

    productImageModalHide() {
        $('#productZoomModal').modal('hide');
        $('body').removeClass('gallery-show');
    }

    productGalleryIndex(event) {
        event.preventDefault();
        var productImageIndex = $(event.target).closest('.b-product_carousel-slide').attr('data-index');
        $('#productZoomModal').attr('data-navigate', productImageIndex);
        $('body').find('.zoomImageCount').trigger('click');
    }

    productGalleryIndexMobile(event) {
        if ($(window).width() < 1024 && !$(event.target).hasClass('js-shop-this-outfit')) {
            event.preventDefault();
            var productImageIndex = $(event.target).closest('.js-product_carousel-slide.swiper-slide-active').index();
            if ($('.js-product_carousel-slide.b-product-360-carousel-slide', this.$el).length > 0) {
                productImageIndex = productImageIndex - 1; // eslint-disable-line
            } else {
                productImageIndex = productImageIndex; // eslint-disable-line
            }
            productImageIndex = productImageIndex === -1 ? '0' : productImageIndex;
            $('#productZoomModal', this.$el).attr('data-navigate', productImageIndex);
            $('body').find('.zoomImageCount').trigger('click');
        }
    }

    productPdpZoomModal(event) {
        if (!$(event.target).hasClass('js-shop-this-outfit')) {
            if ($(window).width() > 1025) {
                event.preventDefault();
                $('body').find('.zoomImageCount').trigger('click');
                $('body').trigger('modalShown', {
                    name: 'product: gallery zoom'
                });
            }
        }
    }

    productZoomModalPagination(event) {
        var $target = $(event.target);
        $target.closest('.b-product_carousel-pagination').find('.b-product_carousel-pagination-dot').removeClass('b-product_carousel-pagination-active');
        $target.addClass('b-product_carousel-pagination-active');
    }

    getChildProducts() {
        var childProducts = [];
        $('.bundle-item').each(function () {
            childProducts.push({
                pid: $(this).find('.product-id').text(),
                quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
            });
        });

        return childProducts.length ? JSON.stringify(childProducts) : [];
    }

    getQuantitySelected() {
        if (this.$el.hasClass('product-recommendation-quickview')) {
            return 1;
        }
        return this.getQuantitySelector().val();
    }

    getQuantitySelector() {
        return (this.$el && $('.set-items').length) || (this.$el && this.$el.closest('.g-modal-quick-view, .quick-add-dialog').length)
            ? this.$el.closest('.product-detail').find('.js-quantity-select')
            : $('.js-quantity-select');
    }

    getOptions() {
        var options = this.$el.find('.product-option')
            .map(() => {
                var $elOption = $(this).find('.options-select');
                var urlValue = $elOption.val();
                var selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                    .data('value-id');
                return {
                    optionId: $(this).data('option-id'),
                    selectedValueId: selectedValueId
                };
            }).toArray();

        return JSON.stringify(options);
    }

    handlePostCartAdd(response) {
        if (!response.error) {
            $('.minicart').trigger('count:update', response);

            if (response.isQuickAdd !== 'true') {
                $('body').trigger('product:updateAddToCartModal', response);
            }
        }
        // show add to cart toast
        if (response.newBonusDiscountLineItem && Object.keys(response.newBonusDiscountLineItem).length !== 0) {
            $('[data-cmp="detailBonusProductModal"]').trigger('product:showBonusProducts', response.newBonusDiscountLineItem);
        } else {
            if (response && response.error && response.message) {
                var availabilityMessages = JSON.parse(response.message);
                var availabilityValue = '';
                var outOfStockValue = '';
                if (availabilityMessages.giftCardError) {
                    $('.error-message-text').html(availabilityMessages.giftCardError);
                } else if (availabilityMessages.outOfStockMsg && availabilityMessages.isNotAvailable) {
                    availabilityValue = '<div>' + availabilityMessages.outOfStockMsg + '</div>';
                    $('body').trigger('addtobag:error', {
                        errorMsg: availabilityMessages.outOfStockMsg
                    });
                } else if (Array.isArray(availabilityMessages) && availabilityMessages.length) {
                    if (availabilityMessages.length === 1) {
                        availabilityValue = '<div>' + availabilityMessages[0] + '</div>';
                    } else {
                        outOfStockValue =
                        '<div class="b-product-stock_message_content">' +
                        '<div class="b-product-quickview-stock_icon"></div>' +
                        '<div class="b-product-quickview-stock_text">' +
                        availabilityMessages.reduce((a, message) => `${a}<div>${message}</div>`, '') +
                        '</div></div>';
                    }
                }
                $('.b-product_availability').empty();
                $('.inventory-message').html(availabilityValue);
                var attribute = $('.b-product_attrs-item[data-attr]:last, .b-product_qvattrs-item[data-attr]:last', this.$el);
                attribute.find('.selection-error-message').remove();
                if (Array.isArray(availabilityMessages) && availabilityMessages.length > 0 && availabilityMessages[0] === 'masterQtyLimitError') {
                    attribute.append('<div class="selection-error-message">' + attribute.find('.m-' + attribute.data('attr')).data('error-limitedmasterquantity-message-label') + '</div>');
                } else {
                    attribute.append('<div class="selection-error-message">' + attribute.find('.m-' + attribute.data('attr')).data('error-message-label') + '</div>');
                }
                attribute.find('li a.m-active').addClass('disabled');
                $('.js_paypal_button').addClass('disabled');
                $('.error-msg').append(outOfStockValue);
            }
            setTimeout(function () {
                $('.add-to-basket-alert').remove();
            }, 5000);
        }
    }

    parseHtml(html) {
        var $html = $('<div>').append($.parseHTML(html));
        var body = $html.find('.choice-of-bonus-product');
        var footer = $html.find('.g-modal-footer').children();

        return { body: body, footer: footer };
    }

    processSwatchValues(attr, msgs) {
        attr.values.forEach((attrValue) => {
            var $attrValue = this.$el.find(`[data-attr="${attr.id}"] [data-attr-value="${attrValue.value}"]`);
            var $swatchButton = $attrValue.parent();
            $attrValue.removeClass('m-active').addClass('disabled unselectable');

            if (attrValue.selected || attrValue.selectable) {
                $attrValue.removeClass('disabled unselectable').addClass('selectable');
                $attrValue.siblings('.selected-assistive-text').empty();
                if ($attrValue.hasClass('m-disabled') && attrValue.selectable) {
                    $attrValue.removeClass('m-disabled');
                }
            }
            if (attrValue.selected) {
                $attrValue.addClass('m-active selectable').removeClass('disabled unselectable');
                $attrValue.siblings('.selected-assistive-text').text(msgs.assistiveSelectedText);
            }

            if (attrValue.url) {
                $swatchButton.attr('data-url', attrValue.url);
                $attrValue.attr('href', $('.pdp-open-new-tab', this.$el).attr('href'));
            }

            // Disable if not selectable
            $attrValue.removeClass('selectable unselectable');

            $attrValue.addClass(attrValue.selectable ? 'selectable' : 'unselectable');
        });
    }

    processSizeValues(attrSize) {
        attrSize.values.forEach(size => {
            const $option = $(this.$el).find(`[data-attr="${attrSize.id}"] [data-attr-value="${size.value}"]`);
            $($option).removeClass('m-active selected remove-swatch').addClass('unselectable disabled');
            if (!size.selectable && size.selected && attrSize.id === 'size') {
                $option.removeClass('unselectable').addClass('selectable');
            } else if (size.selected || size.selectable) {
                var removeClasses = 'unselectable disabled';
                var addClasses = 'selectable';
                if (attrSize.id.toLowerCase !== 'size' && !size.selectable) {
                    removeClasses = 'selectable unselectable';
                    addClasses = '';
                }
                $option.removeClass(removeClasses).addClass(addClasses);
            }
            if (size.selected) {
                $option.addClass('m-active selected');
            }
            $($option).parent('li').attr('data-url', size.url);
            $($option).attr({
                href: size.url,
                'data-attr-value': size.value
            });
            $($option).attr({
                href: $('.pdp-open-new-tab', this.$el).attr('href')
            });
        });
        $('div[data-attr="size"] li a.remove-swatch', this.$el).parent('li').remove();
    }

    processLengthValues(attrSize) {
        attrSize.values.forEach(length => {
            const $option = $(this.$el).find(`[data-attr="${attrSize.id}"] [data-attr-value="${length.value}"]`);
            $($option).removeClass('m-active selected').addClass('unselectable disabled');
            if (length.selected || length.selectable) {
                $option.removeClass('unselectable disabled').addClass('selectable');
            }
            if (length.selected) {
                $option.addClass('m-active selected');
            }
            $($option).parent('li').attr('data-url', length.url);
            $($option).attr({
                href: length.url,
                'data-attr-value': length.value
            });
            $($option).attr({
                href: $('.pdp-open-new-tab', this.$el).attr('href')
            });
        });
    }

    processMoreLessClasses() {
        if ($('.b-select-size-outer .js-sizeAttributes').length > 19) {
            $('.js-show-more').css('display', 'block !important');
            $('.js-show-less').css('display', 'none !important');
        }

        $('.b-select-size-outer .js-sizeAttributes').each(function () {
            var siteValue = $('#size-selected').attr('data-attr-site') ? $('#size-selected').attr('data-attr-site') : '';
            var num = $('.b-size_outer .js-sizeAttributes a.selected').parent('li');
            var lengthSelected = $('.b-length_outer .js-sizeAttributes a.selected').parent('li');
            var sizeSelectValue = $('.b-size_outer .js-sizeAttributes a.selected').attr('data-size-attr');
            var sizeSelected = num.index();
            var numOfSizes = $(this).index();
            if (numOfSizes > 29) {
                $(this).addClass('hideNow');
            } else if (numOfSizes > 19) {
                $(this).addClass('hideNowMobile');
            }

            if ($(window).width() > 1024) {
                if (sizeSelected > 29) {
                    if ($('.js-show-less.show:visible').length > 0) {
                        $('.js-show-more').trigger('click');
                    }
                } else {
                    $('.js-show-less.show:visible').trigger('click');
                }
            } else if (sizeSelected > 19) {
                if ($('.js-show-less.show:visible').length > 0) {
                    $('.js-show-more').trigger('click');
                }
            } else {
                $('.js-show-less.show:visible').trigger('click');
            }
            if (siteValue === 'EU' || siteValue === 'UKIE') {
                if (sizeSelectValue !== undefined && ((lengthSelected.length > 0 && num.length > 0) || num.length > 0)) {
                    $('#size-not-selected').hide();
                    $('#size-selected').show();
                    $('.js-selected-size-emea').html(sizeSelectValue);
                } else if (sizeSelectValue !== undefined && num.length === 0) {
                    $('#size-not-selected').hide();
                    $('#size-selected').show();
                    $('.js-selected-size-emea').html('');
                }
            } else if (siteValue !== 'EU' && siteValue !== 'UKIE' && lengthSelected.length > 0 && num.length > 0) {
                $('.js-selected-size').html(sizeSelectValue);
            } else if (siteValue !== 'EU' && siteValue !== 'UKIE' && num.length > 0) {
                $('.js-selected-size').html(sizeSelectValue);
            } else if (siteValue !== 'EU' && siteValue !== 'UKIE' && num.length === 0) {
                $('.js-selected-size').html('');
            }
        });
    }

    updateAttrs(attrs, msgs) {
        // Currently, the only attribute type that has image swatches is Color.
        var attrsWithSwatches = ['color', 'size', 'length'];
        var $el = this.$el;
        attrs.forEach((attr) => {
            $el.find('div[data-attr="' + attr.attributeId + '"] li a').addClass('unselectable disabled');
            if ($('.exchange-items-container.selected').length > 0) {
                $('.exchange-items-container.selected').find('div[data-attr="' + attr.attributeId + '"] li a').removeClass('unselectable disabled');
            }
            if (attrsWithSwatches.indexOf(attr.attributeId) > -1) {
                if (attr.attributeId === 'color') {
                    this.processSwatchValues(attr, msgs);
                }

                if (attr.attributeId === 'size') {
                    $('div[data-attr="' + attr.attributeId + '"] li a', this.$el).addClass('remove-swatch');
                    this.processSizeValues(attr, msgs);
                }

                if (attr.attributeId === 'length') {
                    this.processLengthValues(attr, msgs);
                }
            } else {
                this.processNonSwatchValues(attr);
            }
        });
    }

    processNonSwatchValues(attr) {
        var $attr = `[data-attr="${attr.id}"]`;
        var $defaultOption = this.$el.find(`${$attr} .select- ${attr.id} option:first`);
        $defaultOption.attr('value', attr.resetUrl);

        attr.values.forEach((attrValue) => {
            var $attrValue = this.$el.find(`${$attr} [data-attr-value="${attrValue.value}"]`);
            $attrValue.attr('value', attrValue.url)
                .removeAttr('disabled');

            if (!attrValue.selectable) {
                $attrValue.prop('disabled', true);
            }
        });
    }

    updateAvailability(response) {
        var availabilityValue = '';
        var availabilityMessages = response.product.availability.messages;
        if (response.product.available) {
            availabilityValue = '';
        } else {
            if (availabilityMessages.length === 2) {
                availabilityValue = '<div class="b-product-stock_message_content"><div class="b-product-quickview-stock_icon"></div><div class="b-product-quickview-stock_text">';
            }
            availabilityMessages.forEach((message) => {
                availabilityValue += `<div>${message}</div>`;
            });
            if (availabilityMessages.length === 2) {
                availabilityValue += '</div></div>';
            }
        }

        $('.b-product_availability').empty().html(availabilityValue);

        this.$el.trigger('product:updateAvailability', {
            product: response.product,
            $productContainer: this.$el,
            message: availabilityValue,
            resources: response.resources
        });
    }

    getPromotionsHtml(promotions) {
        if (!promotions) {
            return '';
        }

        var html = '';

        promotions.forEach((promotion) => {
            html += `<div class="b-promo-tooltip-content ${promotion.calloutMsg && promotion.calloutMsg === '' ? 'hide' : ''}">
                <span class="hide-mobile">
                    <span class="b-promo-tooltip-content-text">
                        ${promotion.calloutMsg}
                    </span>
                    <span class="g-tooltip-icon g-tooltip bfx-remove-element ${promotion.details ? '' : 'hide'}">
                        <span class="g-tooltip-text">
                            ${promotion.details}
                        </span>
                    </span>
                  </span>
                 <span class="hide-desktop">
                     <span class="b-promo-tooltip-content-text">
                          ${promotion.calloutMsg}
                     </span>
                     <span class="${promotion.details ? '' : 'hide'}">
                         <span class="g-tooltip-icon g-tooltip bfx-remove-element">
                             <span class="g-tooltip-arrow"></span>
                         </span>
                         <span class="g-tooltip-text">
                             ${promotion.details}
                         </span>
                     </span>
                </span>
             </div>`;
        });

        return html;
    }

    getAttributesHtml(attributes) {
        if (!attributes) {
            return '';
        }

        var html = '';

        attributes.forEach((attributeGroup) => {
            if (attributeGroup.ID === 'mainAttributes') {
                attributeGroup.attributes.forEach((attribute) => {
                    html += `<div class="attribute-values">${attribute.label}: ${attribute.value}</div>`;
                });
            }
        });

        return html;
    }

    getSizeAttributesHtml(product) {
        if (!product.variationAttributes) {
            return '';
        }
        var html = '';
        var attrSelected = 'selectable m-active selected';
        var varitionTab = $('.pdp-open-new-tab', this.$el).attr('href');
        var sizeMsg = $('.b-select-size-outer ul.b-swatches_sizes').data('attrsizemsg');
        product.variationAttributes.forEach((attributeGroup) => {
            if (attributeGroup.attributeId === 'size') {
                attributeGroup.values.forEach((attribute) => {
                    html += `<li class="js-sizeAttributes swiper-slide" data-url="${attribute.url}">
                    <a href="${varitionTab || ''}" data-size-attr="${attribute.displayValue}" data-attr-value="${attribute.id}" role="button" title="${sizeMsg + ' ' + attribute.value}" class="js-size-select ${!attribute.selectable ? 'disabled' : ''} ${attribute.selected ? attrSelected : ''}`;
                    if (product.custom.gender && (product.custom.gender.toLowerCase() === 'unisex' || product.custom.gender.toLowerCase() === 'adult_unisex' || product.custom.gender.toLowerCase() === 'youth_unisex')) { // size chips values for unisex products
                        var useValue = attribute.value.toLowerCase() === 'osfa'; // if unisex product is of size osfa ,use the value instead and Removing the displayValue length check as it always takes the value and DisplayValue will be empty.
                        if (useValue) { // When using value, include displayValue as title.
                            html += ` f-unisex_sizechips">${attribute.displayValue ? attribute.displayValue : attribute.value}</a></li>`;
                        } else {
                            html += ` f-unisex_sizechips">${attribute.displayValue ? attribute.displayValue : attribute.value}</a></li>`;
                        }
                    } else { // for products with gender other than unisex
                        html += `">${attribute.displayValue ? attribute.displayValue : attribute.value}</a></li>`;
                    }
                });
            }
        });

        return html;
    }

    updateOptions(options) {
        options.forEach((option) => {
            var $optionEl = this.$el.find(`.product-option[data-option-id*="${option.id}"]`);
            option.values.forEach((value) => {
                var valueEl = $optionEl.find(`option[data-value-id*="${value.id}"]`);
                valueEl.val(value.url);
            });
        });
    }

    // update the model size color swatch hover images
    updateAvailableModelSizeImg(data) {
        data.product.variationAttributes.forEach(attr => {
            if (attr.attributeId === 'color') {
                attr.values.forEach(image => {
                    if (image.sizeModelImageMain && image.sizeModelImageMain.URL) {
                        $(`.js-swatch-link[data-attr-value="${image.id}"]`).attr('data-product-sizemodel', image.sizeModelImageMain.URL);
                    } else {
                        const defaultElement = $(`.js-swatch-link selectable[data-attr-value="${image.id}"]`);
                        // There are occasions defaultElement[image.id] is declared more than 1 time, in those situations [1] is accurate
                        const defaultImg = $(defaultElement.length > 1 ? defaultElement[1] : defaultElement).attr('data-product-hoverImageDefault');
                        $(`.js-swatch-link[data-attr-value="${image.id}"]`).attr('data-product-sizemodel', defaultImg);
                    }
                });
            }
        });
    }

    // update the model size select options
    updateAvailableModelSize(event, availableModelSize) {
        var notAvailableText = $('.b-plp-sidebar-modelSize.b-pdp-modelSize', this.$el).data('not-availability');
        var selectedValue = $('body').find('.js-pdp-select-model', this.$el).val();
        var selectedOpt = $('body').find('.js-pdp-select-model option:selected', this.$el).text();
        var region = $('.l-pdp.product-detail').attr('data-region');
        $('.b-pdp-modelSize .g-selectric .label', this.$el).removeClass('not-available');
        if (availableModelSize.fitModelAvailable) {
            Object.keys(availableModelSize.fitModelImageViewType).forEach((size) => {
                var labelText = $(`.b-plp-sidebar-modelSize .g-selectric-items .select-option.${size}`, this.$el).text();
                if (!availableModelSize.fitModelImageViewType[size]) {
                    var emNotAvailableText = notAvailableText;
                    if (labelText.indexOf(notAvailableText) === -1) {
                        if (region === 'emea') {
                            emNotAvailableText = '';
                        }
                        $(`.b-plp-sidebar-modelSize .g-selectric-items .select-option.${size}`, this.$el).text(labelText + ' ' + emNotAvailableText);
                        $(`.b-plp-sidebar-modelSize .g-selectric-items .select-option.${size}`, this.$el).addClass('disabled');
                    }
                    if (size === selectedValue) {
                        if (region === 'emea') {
                            emNotAvailableText = '';
                        }
                        $('.b-pdp-modelSize .g-selectric .label', this.$el).text(selectedOpt + ' ' + emNotAvailableText);
                        $('.b-pdp-modelSize .g-selectric .label', this.$el).addClass('not-available');
                    }
                } else {
                    if (labelText.indexOf(notAvailableText) > -1) {
                        var updatedLabel = labelText.replace(notAvailableText, '');
                        $(`.b-plp-sidebar-modelSize .g-selectric-items .select-option.${size}`, this.$el).text(updatedLabel);
                        $(`.b-plp-sidebar-modelSize .g-selectric-items .select-option.${size}`, this.$el).removeClass('disabled');
                    }
                    if (size === selectedValue && $('.b-pdp-modelSize .g-selectric .label', this.$el).text().indexOf(notAvailableText) > -1) {
                        $('.b-pdp-modelSize .g-selectric .label', this.$el).text(selectedOpt);
                        $('.b-pdp-modelSize .g-selectric .label', this.$el).removeClass('not-available');
                    }
                }
            });
            if ($('.b-plp-sidebar-modelSize.b-pdp-modelSize', this.$el).hasClass('disabled')) {
                $('.b-plp-sidebar-modelSize.b-pdp-modelSize', this.$el).removeClass('disabled');
                $('.b-plp-sidebar-modelSize.b-pdp-modelSize .pdp-modelSize-text', this.$el).addClass('hide');
            }
        } else {
            $('.b-plp-sidebar-modelSize.b-pdp-modelSize', this.$el).addClass('disabled');
            $('.b-plp-sidebar-modelSize.b-pdp-modelSize .pdp-modelSize-text', this.$el).removeClass('hide');
            if (selectedValue) {
                $('.b-pdp-modelSize .g-selectric .label', this.$el).text(selectedOpt + ' ' + notAvailableText);
            }
        }
    }

    handleVariantResponse(option, response) {
        if (!response || !response.product) {
            return;
        }

        var isChoiceOfBonusProducts =
            this.$el.closest('.choose-bonus-product-dialog').length > 0;
        var isVariant;
        var isExchanOrderProducts = this.$el.parent().hasClass('order-exchange-product-details');
        if (response.product.variationAttributes) {
            this.updateAttrs(response.product.variationAttributes, response.resources);
            isVariant = response.product.productType === 'variant';
            if (isChoiceOfBonusProducts && isVariant) {
                this.$el.parent('.bonus-product-item')
                    .data('pid', response.product.id);

                this.$el.parent('.bonus-product-item')
                    .data('ready-to-order', response.product.readyToOrder);
            }
        }
        if (response.product.custom.exclusive === 'coming-soon') {
            $('.b-add_to_bag .js-add-to-cart', this.$el).attr('data-is-coming-soon', true);
        } else {
            $('.b-add_to_bag .js-add-to-cart', this.$el).attr('data-is-coming-soon', false);
        }
        if (response.product.custom.exclusive !== 'coming-soon') {
            if ($('.b-add_to_bag .js-add-to-cart').find('disabled')) {
                $('.b-add_to_bag .js-add-to-cart', this.$el).removeAttr('disabled');
            }
        }
        if (response.product.custom.exclusive === 'out-of-stock') {
            $('.b-add_to_bag .js-add-to-cart', this.$el).attr('exclusive-oos', true);
        } else {
            $('.b-add_to_bag .js-add-to-cart', this.$el).attr('exclusive-oos', false);
        }
        /* if (isVariant) {
            $('.product-sku').html(response.product.custom.sku);
        } */
        if (response.product.custom && response.product.custom.isPreOrder) {
            $('.b-product_klarna-placement', this.$el).addClass('hide');
            $('.paypal-container', this.$el).addClass('hide');
        } else {
            $('.b-product_klarna-placement', this.$el).removeClass('hide');
            $('.paypal-container', this.$el).removeClass('hide');
        }

        if (response.isShopThisOutfitEnabled && response.product.custom.enableShopTheLook) {
            $('.shop-this-outer', this.$el).removeClass('hide').addClass('show');
            $('.model-shop-this-outfit .js-shop-this-outfit', this.$el).attr('data-shopthisoutfit-size', response.shopThisOutfitSize);
        } else {
            $('.shop-this-outer', this.$el).removeClass('show');
        }

        if ($(this.$el).find('.l-pdp-info .l-style_name .value').length > 0 && response.product.custom && response.product.custom.style) {
            $(this.$el).find('.l-pdp-info .l-style_name .value').html(response.product.custom.style);
        }

        // Update primary images
        if (option && option.option === 'color') {
            if (response.product.images.pdpMainDesktop.length > 0) {
                var primaryImageUrls = response.product.images.pdpMainDesktop;
                var forceMobileUpdate = $(window).width() < 1023 && isExchanOrderProducts;
                var shopThisOuterFlag = response.isShopThisOutfitEnabled && response.product.custom.enableShopTheLook;
                this.updateMainImages(primaryImageUrls, forceMobileUpdate, shopThisOuterFlag);
                let videoMaterial = response.product.video360Material;
                if (videoMaterial && videoMaterial.length > 0) {
                    this.update360DegreeVideo(videoMaterial);
                }

                $(this.$el).find('.js-main-image-carousel').trigger('mainCarousel:update');
                if (isExchanOrderProducts) {
                    var imagesLoaded = require('imagesloaded');
                    imagesLoaded('.order-exchange-product-details .js-thumb-image-carousel').on('always', function () {
                        $('body').find('.order-exchange-product-details .js-thumb-image-carousel').trigger('mainCarousel:update');
                    });
                }
            }
        }

        // Update gallery primary images
        if (option && option.option === 'color') {
            if (response.product.images.pdpZoomDesktop.length > 0) {
                var primaryZoomImageUrls = response.product.images.pdpZoomDesktop;
                this.updateZoomMainImages(primaryZoomImageUrls);
                if (!(response.product.video360Material) && (response.product.video360Material.length > 0)) {
                    $(this.$el).find('.l-pdp-gallery .b-product_carousel-slide:first').addClass('pdp-images-hide');
                    $(this.$el).find('.l-pdp-gallery .b-product_carousel-slide:first.pdp-images-hide').remove();
                    $(this.$el).find('.l-pdp-gallery .b-product_carousel-wrapper').addClass('pdp-images-show');
                }
                $(this.$el).find('.zoom-image-count').html(response.product.images.pdpZoomDesktop.length);
            }
        }

        // update the model size dropdown and address URL
        if (option && option.option === 'color') {
            var windowUrl = window.location.href;
            if (response.queryString.indexOf('viewPreference') !== -1) {
                var modelSize = new RegExp('[?&]' + 'viewPreference' + '=([^&]*)').exec(response.queryString); // eslint-disable-line
                var urlParams = {
                    viewPreference: modelSize[1]
                };
                if (windowUrl.indexOf('viewPreference') === -1) {
                    windowUrl = util.appendParamsToUrl(windowUrl, urlParams);
                } else {
                    windowUrl = windowUrl.indexOf('#index-') > -1 ? windowUrl.replace('#index-', '') : windowUrl; // eslint-disable-line
                    windowUrl = util.removeParamFromURL(windowUrl, 'viewPreference');
                    windowUrl = util.appendParamsToUrl(windowUrl, urlParams);
                }
                history.replaceState({}, '', windowUrl);
            } else if (windowUrl.indexOf('viewPreference') > -1) {
                windowUrl = windowUrl.indexOf('#index-') > -1 ? windowUrl.replace('#index-', '') : windowUrl; // eslint-disable-line
                windowUrl = util.removeParamFromURL(windowUrl, 'viewPreference');
                history.replaceState({}, '', windowUrl);
            }
            // update choose your size options on color change
            if (response && response.chooseYourSizeOptions) {
                var optionData = response.chooseYourSizeOptions;
                var $option;
                var $el = $('.js-pdp-select-model', this.$el);
                var modelValueDefault = response.selectedModelSize;
                $el.find('option:gt(0)').remove(); // remove old options
                optionData.forEach(optionVal => {
                    $option = $('<option></option>').attr({ value: optionVal.id, class: 'select-option ' + optionVal.id + '' }).text(optionVal.label);
                    $el.append($option);
                });
                $el.trigger('Update:CustomSelect');
                $el.val(modelValueDefault).trigger('change', [true]);
            }
            this.updateAvailableModelSizeImg(response);
            if (response.product.fitModelImagesAvailability) {
                $('body').trigger('product:updateModelSizeOptions', response.product.fitModelImagesAvailability);
            }
        }

        if (response.product.images.pdpMainDesktop.length > 0 && $(window).width() < 1024) {
            $(this.$el).find('.l-pdp-images').removeAttr('style');
            $(this.$el).find('.l-pdp-images').css('height', $(this.$el).find('.l-pdp-images').height() + 'px');
        } else {
            $(this.$el).find('.l-pdp-images').removeAttr('style');
        }

        // Update pricing
        if (!isChoiceOfBonusProducts) {
            var $priceSelector = $('.b-product_prices .b-price', this.$el).length
                ? $('.b-product_prices .b-price', this.$el)
                : ($('.b-product-quickview-prices .b-price', this.$el).length ? $('.b-product-quickview-prices .b-price', this.$el) : $('.b-product_prices .b-price'));
            $priceSelector.replaceWith(response.product.price.html);
            if ($('.sticky-cta .b-product_actions .product-details .b-price-header .b-price ', this.$el).length) {
                $('.sticky-cta .b-product_actions .product-details .b-price-header .b-price ', this.$el).replaceWith(response.product.price.html);
            }
        }

        // Update exchange button
        if ($('.js-exchange-items-info').length > 0 && response.product.readyToOrder === false) {
            $('.js-save-exchange-item').prop('disabled', true);
        } else {
            $('.js-save-exchange-item').prop('disabled', false);
        }

        // Update exchange product main image
        if (isExchanOrderProducts) {
            var imgsrcfirst = $(this.$el).find('.b-product_carousel-slide:first-child img').attr('src');
            this.$el.find('.b-selectexchange-mainImg').attr('src', imgsrcfirst); // eslint-disable-line
            $('.b-product_carousel-slide img').on('click', function () {
                var imgsrc = $(this).attr('src');
                $(this).closest('.b-product-quickview-images').siblings().filter('.mainImg').find('img').attr('src', imgsrc); // eslint-disable-line
            });
        }

        // Update promotions
        $('.b-product_promo.b-promo-tooltip-information').empty().html(this.getPromotionsHtml(response.product.promotions));
        this.updateAvailability(response);

        if (isChoiceOfBonusProducts) {
            var $selectButton = this.$el.find('.select-bonus-product');
            $selectButton.trigger('bonusproduct:updateSelectButton', {
                product: response.product, $productContainer: this.$el
            });
        } else {
            // Enable "Add to Cart" button if all required attributes have been selected
            $('.js-add-to-cart, button.add-to-cart-global, button.update-cart-product-global, .js-update-cart-product-global').trigger('product:updateAddToCart', {
                product: response.product, $productContainer: this.$el, hasPreOrder: response.hasPreOrder
            }).trigger('product:statusUpdate', response.product);
        }

        if (option) {
            // update the color
            var displayColorWay = '';
            if (response.product.custom.team && response.product.custom.team !== 'N/A') {
                displayColorWay = response.product.custom.team + ' - ' + response.product.custom.color;
            } else if (response.product.custom.colorway != null && response.product.custom.colorway !== '' && response.product.custom.color != null && response.product.custom.color !== '') {
                let colorBuckets = response.product.custom.colorway.split('/').map(function (item) {
                    return item.trim();
                });
                if (colorBuckets.length > 1) {
                    displayColorWay += colorBuckets[0];
                    if (colorBuckets[1] !== '' && colorBuckets[0] !== colorBuckets[1]) {
                        displayColorWay += ' / ' + colorBuckets[1];
                    } else if (colorBuckets[2] && colorBuckets[2] !== '' && colorBuckets[2] !== colorBuckets[1]) {
                        displayColorWay += ' / ' + colorBuckets[2];
                    }
                } else {
                    displayColorWay = response.product.custom.colorway;
                }
                displayColorWay += ' - ' + response.product.custom.color;
            } else if (response.product.custom.colorway != null || response.product.custom.color != null) {
                displayColorWay = response.product.custom.colorway ? response.product.custom.colorway : response.product.custom.color;
            }
            if (displayColorWay) {
                $('.js-selected-color').html(displayColorWay);
            } else if ($(this.$el).hasClass('product-quickview')) {
                $('.js-selected-color').html($(this.$el).find('.b-product_attribute.m-color a.m-active').attr('title').replace(/-/, ' - '));
            } else {
                $('.js-selected-color').html($(this.$el).find('.b-product_attrs-item[data-attr="color"] a.m-active').attr('title').replace(/-/, ' - '));
            }
        }

        // Update Sold Out Text
        if (response.product.custom.exclusive === 'out-of-stock') {
            $('.b-product_availability-pdp-outofstock').removeClass('hide');
        } else {
            $('.b-product_availability-pdp-outofstock').addClass('hide');
        }

        // Update app exclusive Text
        if (response.product.custom.exclusive === 'app-exclusive') {
            $('.varition-app-exclusive').empty().html($('.js-app-exclusive').html());
        }

        // Update Size Attributes
        if (option && option.option !== 'size') {
            this.$el.find('.b-product_attribute.m-size .input-select').empty()
                .html(this.getSizeAttributesHtml(response.product));
        }

        if ($('.exchange-items-container .save-exchange-item').length > 0 && response.product.custom) {
            this.$el.find('.b-product-quickview-info .save-exchange-item').attr('data-product-id', response.product.custom.sku);
        }
        // Update attributes
        this.$el.find('.main-attributes').empty()
            .html(this.getAttributesHtml(response.product.attributes));
        var addToBag = $('.js-add-to-cart').attr('data-addto-bag');
        var preOrderBag = $('.js-add-to-cart').attr('data-pre-order');
        var comingSoon = $('.js-add-to-cart').attr('data-coming-soon');
        var OOS = $('.js-add-to-cart').attr('data-oos');
        var isCartEdit = $('.js-add-to-cart').hasClass('js-update-cart-product-global');
        var memberPrice = response.product.memberPricing && response.product.memberPricing.hasMemberPrice && response.product.memberPricing.guestUser && response.product.memberPricing.memberPricingUnlockCTA;
        if (!isCartEdit && !$('.js-add-to-cart').hasClass('add-to-cart-global') && memberPrice) {
            $('.js-add-to-cart').removeClass('g-button_tertiary f-added-check').html(response.product.memberPricing.memberPricingUnlockCTA);
            $('.js-add-to-cart').toggleClass('g-button_primary--black js-unlock-access', true);
        } else if ((response.product.custom.exclusive === 'coming-soon')) {
            $('.js-add-to-cart').html(comingSoon);
            $('.b-product_preorder').empty().html('<p class="b-product_preorder-maskpdp">' + response.product.custom.comingSoonMessage + '</p>');
            $('.b-add_to_bag .js-add-to-cart').prop('disabled', true);
            $('.js_paypal_button').addClass('disabled');
            $('.b-product_availability').empty();
        } else if (response.product.custom.isPreOrder) {
            $('.js-add-to-cart').removeClass('f-added-check').html(preOrderBag);
            $('.b-product_preorder').empty().html('<p class="b-product_preorder-maskpdp">' + response.product.custom.preOrderPDPMessage + '</p>');
        } else if (response.product.custom.exclusive === 'out-of-stock') {
            $('.js-add-to-cart').html(OOS);
            $('.js_paypal_button').addClass('disabled');
        } else {
            $('.js-add-to-cart').removeClass('f-added-check').html(addToBag);
            $('.b-product_preorder').empty();
        }

        if (!isCartEdit && !$('.js-add-to-cart').hasClass('add-to-cart-global') && !memberPrice) {
            $('.js-add-to-cart').removeClass('g-button_primary--black js-unlock-access').addClass('g-button_tertiary');
        }

        // Update member pricing badge and text above ATC CTA
        var memberPricingModel;
        if (response.product.productType === 'master' && response.variantModel && response.variantModel.memberPricing) {
            memberPricingModel = response.variantModel.memberPricing;
        } else if (response.product.memberPricing) {
            memberPricingModel = response.product.memberPricing;
        }
        if (memberPricingModel && !memberPricingModel.hasMemberPrice) {
            $('.pdp-member-pricing-message, .pdp-member-price').empty();
        } else if (memberPricingModel) {
            if (memberPricingModel.memberPricingTextAboveCTA) {
                $('.pdp-member-pricing-message').html(memberPricingModel.memberPricingTextAboveCTA);
            }
            if (memberPricingModel.hasMemberPrice && memberPricingModel.pricing) {
                $('.pdp-member-price').html(memberPricingModel.pricing.priceHtml);
            }
        }

        // enable the selected variation if prodcut has inventory for store pickup
        var isProductAvailableForInStore = response && response.selectedStore && response.selectedStore.enableStore && response.selectedStore.productInStoreInventory;
        if (isProductAvailableForInStore) {
            this.$el.find('.b-product_attribute.m-size .js-size-select.selected').removeClass('disabled');
            this.$el.find('.b-product_attribute.m-color .js-swatch-link.m-active').removeClass('m-disabled');
        }
        this.updateNotifyMe(response);

        // Update Early Access data
        if (response.product.custom.earlyAccess) {
            var earlyAccess = require('./earlyAccess');
            earlyAccess.updateEarlyAccessAttributes(response.product.custom.earlyAccess);
        }
    }

    toggleNotifyMe(showNotiyMe) {
        this.$el.find('.js-notify-product-actions, .js-add_to_bag_notify').toggleClass('hide', showNotiyMe);
        this.$el.find('.js-notify_product').toggleClass('hide', !showNotiyMe);
    }

    updateNotifyMe(response) {
        var $notifyMeButton = $('.b-notify-cta');
        var $shippingMethogCTA = $('.js-ship-pick-check.selected');
        var isAvaliableForSelectedShippingMethod = ($shippingMethogCTA.length === 0 && response && response.product && response.product.available) || $shippingMethogCTA.data('availability');
        var showNotiyMe = (response && response.isNotifyMeEnabled && response.isNotifyMeEnabled != null) || (!response && $notifyMeButton.length);
        this.toggleNotifyMe(!isAvaliableForSelectedShippingMethod && showNotiyMe);
    }

    tabsUpdate(response) {
        $('.b-product_description').empty().html(response);
    }

    updateQuantities(quantities) {
        if (!(this.$el.parent('.bonus-product-item').length > 0)) {
            if (!(this.$el.parent('.g-modal-quick-view-body').length > 0) || (this.$el.closest('.g-modal-quick-view').length)) {
                var optionsHtml = quantities.map((quantity) => {
                    var selected = quantity.selected ? ' selected ' : '';
                    return `<option value="${quantity.value}"  data-url="${quantity.url}"
                        ${selected}>${quantity.value}</option>`;
                }).join('');
                this.getQuantitySelector().empty().html(optionsHtml);
            }
        }
    }

    // update Price and text based on hovered color Swatch.
    updateVariantPrice(swatchDetails, swatchValue) {
        var hoveredSwatch = swatchDetails.find(function (ele) {
            return ele.colorID === swatchValue.toString();
        });
        var selectedColor = $('.b-product_attrs-item[data-attr="color"]', this.$el).find('.m-active').length;
        var selectedLength = $('.b-length_outer .js-sizeAttributes a.selected', this.$el).length;
        var selectedSize = $('.b-size_outer .js-sizeAttributes a.selected', this.$el).length;
        var attrLength = $('.l-pdp.product-detail').data('attr-length');
        if (hoveredSwatch.price && ((attrLength === 2 && selectedColor && selectedSize) || (attrLength === 3 && selectedColor && selectedSize && selectedLength))) {
            var $priceSelector = $('.b-product_prices .b-price', this.$el);
            $priceSelector.replaceWith(hoveredSwatch.price);
        }

        if (hoveredSwatch.colorName) {
            $('.js-selected-color').html(hoveredSwatch.colorName);
        }
    }

    attributeSelect({ option, value, valueUrl }) {
        $('.js_paypal_button').removeClass('disabled');
        if (valueUrl) {
            this.$el.trigger('product:beforeAttributeSelect', {
                url: valueUrl,
                container: this.$el
            });
            $.ajax({
                url: valueUrl,
                method: 'GET',
                success: this.onAttributeSelectSuccess.bind(this, { option, value })
            }).always(this.$el.spinner().stop);
        }
    }

    onColorChangeImage(event) {
        var $target = $(event.target);
        var swatchImageUrl = $target.data('product-imgmain');
        var modelSizeImgUrl = $target.attr('data-product-sizemodel');
        var modelSpecification = $target.attr('data-product-modelSpec');
        var modelSpecificationSelection = this.$el.find('.model-specification-content .model-specification-selection');

        if (swatchImageUrl) {
            this.$el.find('.js-main-image-carousel .js-product_carousel-image').attr('src', swatchImageUrl);
            this.$el.find('.js-main-image-carousel .js-product-360-video').attr('poster', swatchImageUrl);
            if (modelSizeImgUrl) {
                this.$el.find('.js-main-image-carousel .js-product_carousel-image').attr('src', modelSizeImgUrl);
            }
            if ($(window).width() > 1023) {
                if (modelSpecification !== null) {
                    if (modelSpecificationSelection.length === 0) {
                        this.$el.find('.model-specification-content').empty().html(`<div class="model-specification-selection">${modelSpecification}</div>`);
                    } else {
                        modelSpecificationSelection.html(modelSpecification);
                    }
                } else {
                    this.$el.find('.model-specification-content').empty();
                }
            }

            this.$swatchesContainer.find('.js-swatch-link').on('mouseleave', this.onChangeToDefault.bind(this));
        }

        if ($(window).width() > 1023) {
            var selectedSwatch = $(event.target).parents('.b-swatches_circle').find('.m-active').data('attr-value');
            var hoveredSwatch = $(event.target).data('attr-value');
            var variantsDetails = $('body').find('input[name = variantionsPrice]', this.$el).attr('value');
            if (hoveredSwatch !== selectedSwatch && variantsDetails) {
                var variantionsPrice = JSON.parse(variantsDetails);
                this.updateVariantPrice(variantionsPrice, hoveredSwatch);
                $target.on('mouseleave', function (e) {
                    selectedSwatch = $(e.target).parents('.b-swatches_circle').find('.m-active').data('attr-value');
                    this.updateVariantPrice(variantionsPrice, selectedSwatch);
                }.bind(this));
            }
        }
    }

    onChangeToDefault() {
        this.$el.find('.js-main-image-carousel .js-product_carousel-image').attr('src', defaultImageUrl);
        this.$el.find('.js-main-image-carousel .js-product-360-video').attr('poster', defaultVideoPosterUrl);
        if ($(window).width() > 1023) {
            if (defaultModelSpec === '') {
                this.$el.find('.model-specification-content').empty();
            } else if (defaultModelSpec !== '' && this.$el.find('.model-specification-content .model-specification-selection').length === 0) {
                this.$el.find('.model-specification-content').empty().html(`<div class="model-specification-selection">${defaultModelSpec}</div>`);
            } else {
                this.$el.find('.model-specification-content .model-specification-selection').html(defaultModelSpec);
            }
        }
        this.$swatchesContainer.off('mouseleave');
    }

    onAttributeSelectSuccess(option, attributeData) {
        var data = attributeData;
        data.option = option.option;
        this.handleVariantResponse(option, data);
        this.updateOptions(data.product.options);
        this.updateQuantities(data.product.quantities);
        this.updateLowInventoryMessaging(data.hasLowInventory);
        this.processMoreLessClasses();
        this.tabsUpdate(data.productCustomDescriptionHtml);
        this.$body.trigger('product:attributeChanged', option);
        this.$el.trigger('product:afterAttributeSelect', { data, container: this.$el });
        $('.product-quickview').attr('data-pid', data.product.id);
        if (this.$el.hasClass('product-quickview') && data.selectedStore && data.selectedStore.name) {
            $(this.$el).find('.b-choose-store').html(data.selectedStore.name);
        } else if (this.$el.hasClass('product-quickview') && data.pickUpInStoreHtml && $(this.$el).find('.b-store-choose-link .select-store').length) {
            var noStoreText = $(this.$el).attr('data-nostoreselected');
            $(this.$el).find('.b-store-choose-link .b-choose-store').addClass('no-store').html(noStoreText);
        } else {
            $(this.$el).find('.b-store-choose-link .b-choose-store').removeClass('no-store');
        }
        $('body').find('.add-to-wish-list').attr('data-pid', data.product.id);
        if (data.isItemExistsInWishList !== null && data.isItemExistsInWishList) {
            this.$el.find('.b-product_info .js-whislist-icon').addClass('product-added b-product_name-fav_selectButton').removeClass('b-product_name-fav_button');
        } else {
            this.$el.find('.b-product_info .js-whislist-icon').removeClass('product-added b-product_name-fav_selectButton').addClass('b-product_name-fav_button');
        }
        this.$el.spinner().stop();
    }

    updateLowInventoryMessaging(isLow) {
        var msgBlock = $('.b-product_availability-lowInventory');
        if (isLow) {
            msgBlock.removeClass('hide');
        } else {
            msgBlock.addClass('hide');
        }
    }

    updateMainImages(images = [], forceMobileUpdate = false, shopThisOuterFlag) {
        const slides = [];
        const slidesGallery = [];
        var countryCode = $(this.$el).attr('data-country-code');
        var region = $(this.$el).attr('data-region');
        var modelHeightText = $(this.$el).attr('data-model-height');
        var prdSizeText = $(this.$el).attr('data-prd-size');
        var wearingSizeTxt = $(this.$el).attr('data-model-size');
        var modelHeightText2 = $(this.$el).attr('data-model-heightIn');
        var gallaryImgSizeText = $(this.$el).attr('data-prdImg-size');
        var mainImgSize = '';
        var htmlString = '';
        var isQuickView = $(this.$el).hasClass('product-quickview');
        var slidesCount = images.length;
        var modelSpecUpdate;

        images.forEach(image => {
            var modelSpecs = '';
            if (!isQuickView) {
                if (image.index === '0') {
                    mainImgSize = image.modelSpec.modelSize ? image.modelSpec.modelSize : '';
                    if (countryCode === 'CA' && image.modelSpec && image.modelSpec.showModelInfo === true && image.modelSpec.modelSize && image.modelSpec.modelHeightCm) {
                        modelSpecs = `${modelHeightText} ${image.modelSpec.modelHeightCm} ${modelHeightText2} ${image.modelSpec.modelHeightFtIn})
                        ${prdSizeText} ${image.modelSpec.modelSize}`;
                    } else if (countryCode === 'GB' && image.modelSpec && image.modelSpec.showModelInfo === true && image.modelSpec.modelSize && image.modelSpec.modelHeightFtIn) {
                        modelSpecs = `${modelHeightText} ${image.modelSpec.modelHeightFtIn}
                        ${prdSizeText} ${image.modelSpec.modelSize}`;
                    } else if ((region === 'emea') && image.modelSpec && image.modelSpec.showModelInfo === true && image.modelSpec.modelSize && image.modelSpec.modelHeightCm) {
                        modelSpecs = `${modelHeightText} ${image.modelSpec.modelHeightCm} cm
                        ${prdSizeText} ${image.modelSpec.modelSize}`;
                    } else if (image.modelSpec && image.modelSpec.showModelInfo === true && image.modelSpec.modelSize && image.modelSpec.modelHeightFtIn) {
                        modelSpecs = `${modelHeightText} ${image.modelSpec.modelHeightFtIn}
                        ${prdSizeText} ${image.modelSpec.modelSize}`;
                    } else if (image.modelSpec && image.modelSpec.showModelInfo === true && image.modelSpec.modelSize) {
                        modelSpecs = `${wearingSizeTxt} ${image.modelSpec.modelSize}`;
                    }
                    if (modelSpecs !== '') {
                        $('.model-specification-content', this.$el).removeClass('hide');
                        modelSpecUpdate = `<div class="model-specification-selection">${modelSpecs}</div>`;
                        defaultModelSpec = modelSpecs;
                    } else {
                        defaultModelSpec = '';
                    }
                    if (shopThisOuterFlag) {
                        htmlString = '<div class="shop-this-outer show">' + $('.shop-this-outer-html', this.$el).html() + '</div>';
                    }
                } else if (image.modelSpec && image.modelSpec.showModelInfo === true && image.modelSpec.modelSize) {
                    if (mainImgSize !== image.modelSpec.modelSize) {
                        modelSpecs = `<div class="b-model-specs-altImg model-specification">
                            <span>
                                    ${gallaryImgSizeText} ${image.modelSpec.modelSize}
                            </span>
                            </div>`;
                    }
                }
            }
            slides.push(
                `<div class="b-product_carousel-slide ${(image.index > 3) ? 'pdp-images-hide' : ''} js-product_carousel-slide swiper-slide" data-index="${image.index}" data-spec="${mainImgSize !== image.modelSpec.modelSize ? 'notSame' : 'same'}">
                    ${(image.index === '0') ? htmlString : ''}
                    <img src="${image.url}"
                         class="b-product_carousel-image ${(image.index === '0') ? 'js-product_carousel-image' : ''}"
                         alt="${image.alt} image number ${image.index}"
                         itemprop="image">
                         ${(image.index !== '0') ? modelSpecs : ''}
                  </div>`
            );
            if (image.index !== '0') {
                slidesGallery.push(
                    `<div class="b-product_carousel-slide ${(image.index > 4) ? 'pdp-images-hide' : ''} js-product_carousel-slide swiper-slide" data-index="${image.index}">
                        <img src="${image.url}"
                             class="b-product_carousel-image"
                             alt="${image.alt} image number ${image.index}"
                             itemprop="image">
                             ${modelSpecs}
                      </div>`
                );
            }
        });

        if ($(window).width() > 1023 || forceMobileUpdate) {
            $(this.$el).find('.b-product_carousel .b-product_carousel-wrapper').empty().html(slidesGallery);
            var flatMainImgSpec = $(this.$el).find('.b-product_carousel .b-product_carousel-wrapper .b-product_carousel-slide[data-index="0"] .model-specification span').length;
            if (mainImgSize && !isQuickView) {
                if (flatMainImgSpec) {
                    if (($(window).width() > 1023)) {
                        $(this.$el).find('.b-product_carousel .b-product_carousel-wrapper .b-product_carousel-slide[data-index="0"] .model-specification span').replaceWith('');
                    } else {
                        $(this.$el).find('.b-product_carousel .b-product_carousel-wrapper .b-product_carousel-slide[data-index="0"] .model-specification span').replaceWith(gallaryImgSizeText + ' ' + mainImgSize);
                    }
                } else {
                    if (($(window).width() > 1023)) { // eslint-disable-line
                        $(this.$el).find('.b-product_carousel .b-product_carousel-wrapper .b-product_carousel-slide[data-index="0"]').append('');
                    } else {
                        var flatImgSizeText = `<div class="b-model-specs-altImg model-specification">
                        <span>
                        ${gallaryImgSizeText} ${mainImgSize}
                        </span>
                        </div>`;
                        $(this.$el).find('.b-product_carousel .b-product_carousel-wrapper .b-product_carousel-slide[data-index="0"]').append(flatImgSizeText);
                    }
                }
            }
        }
        $(this.$el).find('.js-main-image-carousel.b-product_carousel-pdp .js-swiper-wrapper').empty().html(slides);

        if (slidesCount > 5) {
            $('.b-product_carousel-pdp.js-main-image-carousel', this.$el).addClass('pdpMainImage');
            $('.b-product_carousel-pdp.js-main-image-carousel', this.$el).removeClass('pdpMainFiveImage');
        } else {
            $('.b-product_carousel-pdp.js-main-image-carousel', this.$el).addClass('pdpMainFiveImage');
            $('.b-product_carousel-pdp.js-main-image-carousel', this.$el).removeClass('pdpMainImage');
        }
        $(this.$el).find('.model-specification-content').empty().html(modelSpecUpdate);
        defaultImageUrl = $(this.$el).find('.js-main-image-carousel.b-product_carousel-pdp .js-product_carousel-image').attr('src');
    }

    updateZoomMainImages(images = []) {
        const slides = [];
        const slidesPagination = [];
        images.forEach(image => {
            slides.push(
                `<div class="b-product_carousel-slide" data-index="${image.index}" id="index-${image.index}">
                    <img src="${image.url}"
                         class="b-product_carousel-image"
                         alt="${image.alt} image number ${image.index}"
                         itemprop="image">
                  </div>`
            );
            slidesPagination.push(
                `<a href="#index-${image.index}" class="b-product_carousel-pagination-dot">
                     <span class="hide">index-${image.index}</span>
                 </a>`
            );
        });

        $(this.$el).find('#productZoomModal .b-product_carousel-wrapper').empty().html(slides);
        $(this.$el).find('#productZoomModal .b-product_carousel-pagination').empty().html(slidesPagination);
    }

    update360DegreeVideo(video360Material) {
        /*eslint-disable */
        var videoDiv = `<div class='b-product_carousel-slide js-product_carousel-slide swiper-slide b-product-360-carousel-slide'>
        <div class="b-product-360_video" id="product-360-video--${video360Material[0].masterID_selectedColor}">
            <div class="b-product-360_video-player">
                <video poster="${video360Material[0].poster_url}" class="js-product-360-video" preload="none" loop muted playsinline>
                    <source src="${video360Material[0].video_url_mp4}" type="video/mp4">
                </video>
            </div>
        </div>
        </div>`;
        /*eslint-enable */
        $(this.$el).find('.js-main-image-carousel.b-product_carousel-pdp .js-swiper-wrapper').prepend(videoDiv);
        defaultVideoPosterUrl = $(this.$el).find('.js-main-image-carousel.b-product_carousel-pdp .js-product-360-video').attr('poster');
    }

    checkDateCheck(event) {
        event.preventDefault();
        var dateField = $('.js-deliverydate');
        var dateAndAmount = $('.js-giftcard-amount-date');
        var addToBagButton = $('.b-egiftcard-button');
        var date = new Date($('.js-deliverydate').val());
        var now = new Date();
        var oneYearFromNow = new Date();
        var timestamp = oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        if (timestamp < date) {
            dateField.addClass('is-invalid');
            dateField.parent().find('.invalid-feedback').html(dateField.data('max-dateerror'));
            dateField.parent('.b-input_row').addClass('error-field');
            addToBagButton.attr('disabled', 'disabled');
        } else if (date < (now.setDate(now.getDate() - 1))) {
            dateField.addClass('is-invalid');
            dateField.parent().find('.invalid-feedback').html(dateField.data('valid-error'));
            dateField.parent('.b-input_row').addClass('error-field');
            addToBagButton.attr('disabled', 'disabled');
        } else {
            dateField.removeClass('is-invalid');
            dateField.parent().find('.invalid-feedback').html('');
            dateField.parent('.b-input_row').removeClass('error-field');
            if (!dateAndAmount.hasClass('is-invalid')) {
                addToBagButton.removeAttr('disabled');
            }
        }
    }

    checkAmountCheck(event) {
        event.preventDefault();
        var dateAndAmount = $('.js-giftcard-amount-date');
        var amountField = $('.js-giftcard-amount');
        var addToBagButton = $('.b-egiftcard-button');
        var amountFieldVal = amountField.val();
        var minimumAmount = parseInt(amountField.data('min-amount'), 10);
        var maxAmount = parseInt(amountField.data('max-amount'), 10);
        var regex = /^[0-9]+(\.[0-9]{1,2})?$/;

        if (isNaN(amountFieldVal)) {
            amountField.addClass('is-invalid');
            amountField.parent().find('.invalid-feedback').html(amountField.data('pattern-mismatch'));
            amountField.parent('.b-input_row').addClass('error-field');
            addToBagButton.attr('disabled', 'disabled');
            return;
        } else if (amountFieldVal.match(regex) === null) {
            amountField.addClass('is-invalid');
            amountField.parent('.b-input_row').addClass('error-field');
            if (!((amountFieldVal >= minimumAmount) && (amountFieldVal <= maxAmount))) {
                amountField.parent().find('.invalid-feedback').html(amountField.data('valid-error'));
            } else {
                amountField.parent().find('.invalid-feedback').html(amountField.data('decimal-error'));
            }
            addToBagButton.attr('disabled', 'disabled');
        } else if ((amountFieldVal >= minimumAmount) && (amountFieldVal <= maxAmount)) {
            amountField.removeClass('is-invalid');
            amountField.parent().find('.invalid-feedback').html('');
            amountField.parent('.b-input_row').removeClass('error-field');
            if (!dateAndAmount.hasClass('is-invalid')) {
                addToBagButton.removeAttr('disabled');
            }
        } else {
            amountField.addClass('is-invalid');
            amountField.parent().find('.invalid-feedback').html(amountField.data('valid-error'));
            amountField.parent('.b-input_row').addClass('error-field');
            addToBagButton.attr('disabled', 'disabled');
        }
    }

    checkSpaceForFields(event) {
        var $target = $(event.target);
        var $inputFieldVal = $target.val().trim();
        var isAndroid = /android/i.test(navigator.userAgent.toLowerCase());
        if (isAndroid) {
            var keyCode = event.originalEvent.data.charCodeAt(0);
            if (keyCode === 32 && $inputFieldVal === '') {
                event.preventDefault();
                $target.val('');
            }
        }

        if (event.which === 32 && $inputFieldVal === '') {
            event.preventDefault();
            $target.val('');
        }
    }

    checkSpaceForFieldsBlur(event) {
        var $target = $(event.target);
        var $inputFieldVal = $target.val().trim();
        if ($inputFieldVal === '') {
            event.preventDefault();
            $target.val('');
        }
    }

    isPrePopulateSizeEligible() {
        return this.$el && this.$el.find('input[name="sizePrefrencesurl"]').length > 0;
    }

    getPrepopulateSizeUrl() {
        return this.$el && this.$el.find('input[name="sizePrefrencesurl"]').val();
    }

    prepopulateSize() {
        if (this.isPrePopulateSizeEligible()) {
            var pid = this.$el.data('pid');
            var url = this.getPrepopulateSizeUrl();
            var isAlreadySelected = this.$el && this.$el.find('ul[id^="size"] a.js-size-select').hasClass('selected');
            if (isAlreadySelected || !pid || !url) {
                return;
            }
            $.spinner().start();
            $.ajax({
                url: url,
                method: 'POST',
                data: { pid: pid },
                context: this,
                success: function (data) {
                    if (data && data.sizePreferences) {
                        var el = this.$el && this.$el.find(`a.js-size-select[data-attr-value="${data.sizePreferences}"]`);
                        if (el.length > 0) {
                            el.trigger('click');
                        }
                        $.spinner().stop();
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    }
}
