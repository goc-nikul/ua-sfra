'use strict';

import Product from './Product';
import util from '../../util';
var debounce = require('lodash/debounce');
var viewPortFunc = require('../../utils/globalUtils');
var bvEventTriggered = false;

export default class ProductDetail extends Product {
    init() {
        super.init();

        this.$body = $('body');
        this.$sizeChart = $('.size-chart-collapsible');

        this.$storeButton = $('.btn-get-in-store-inventory, .change-store', this.$el);
        this.initProductDetailEvents();
    }

    initProductDetailEvents() {
        this.event('product:statusUpdate', this.onUpdateAttributesAndDetails);
        this.event('product:afterAttributeSelect', this.onAfterAttributeSelect);
        this.event('product:updateAddToCart', this.onUpdateAddToCart);
        this.event('product:updateAvailability', this.onUpdateAvailability);
        this.event('click touchstart', this.onTouchStart.bind(this));
        this.eventDelegate('click', '#fa-link', this.onFaLinkClick.bind(this));
        $(window).on('scroll', this.onWindowScroll.bind(this));
        $(window).on('load', this.onPageLoad.bind(this));
        $(window).on('resize', this.onPageOrientationChange.bind(this));
        this.event('product:updateAddToCartModal', this.onupdateAddToCartModal, this.$body);
        this.eventDelegate('click', '.model-shop-this-outfit .js-shop-this-outfit', this.onShopThisOutfit.bind(this));
        this.$storeButton.on('click', this.onPdpStore.bind(this));
        this.event('keydown', this.onKeydownWhenModalIsOpen.bind(this), this.$body);
    }

    onPdpStore() {
        util.branchCloseJourney();
    }

    // update the min-height of PDP description sec.
    updateMinHeightPdpDesc() {
        if ($(window).width() > 1023 && $('.g-accordion-item.g-tabs-pane.tab-pane').length) {
            var heights = [];
            $('.g-accordion-item.g-tabs-pane.tab-pane').each(function () {
                if ($(this).height() !== 0) {
                    heights.push($(this).height());
                }
            });
            var getMinHeight = Math.max.apply(null, heights);
            $('.b-product_description-items.g-accordion--mobile.g-tabs-content', this.$el).css('min-height', getMinHeight);
        }
    }

    // toggle the min-height between mobile and desktop view.
    onPageOrientationChange() {
        if ($(window).width() < 1024 && $('.b-product_description-items.g-accordion--mobile.g-tabs-content').length) {
            $('.b-product_description-items.g-accordion--mobile.g-tabs-content', this.$el).removeAttr('style');
        } else {
            this.updateMinHeightPdpDesc();
        }
    }

    bvData() {
        if (!bvEventTriggered) { // This should only fire once.
            if ($('.bv-section-summary-table').length > 0) {
                if (viewPortFunc.viewPort('.bv-section-summary-table')) {
                    $('body').trigger('view:review');
                    bvEventTriggered = true;
                }
            }
        }
    }
    onWindowScroll(e) {
        var debounceScroll = debounce(this.bvData, 300);
        debounceScroll(this.$el, e);
        // when scrolling past product details, move Add to Cart CTA to top
        if ($('.b-physicalgiftcard_outer').length < 1 && (!$('.b-header_minicart-container.show').length > 0)) {
            var $scrollTrigger = $('.b-product_attrs .prices-add-to-cart-actions');
            var $stickyAddToCart = $('.sticky-cta');
            var $header = $('.b-header');
            var showHeaderCta = ($(window).scrollTop() >= ($scrollTrigger.offset().top + $scrollTrigger.outerHeight()) - $header.outerHeight());
            if (showHeaderCta) {
                $stickyAddToCart.addClass('cta-expanded');
            } else {
                $stickyAddToCart.removeClass('cta-expanded');
            }
        }
    }

    // update model size and min-height to product description on PDP page load
    onPageLoad() {
        this.updateMinHeightPdpDesc();
        var urlParam = window.location.href.split('?')[1];
        if (urlParam && urlParam.indexOf('viewPreference') > -1) {
            var modelSize = util.getParameterValueFromUrl('viewPreference', window.location.href);
            $('body').find('.js-pdp-select-model', this.$el).val(modelSize).trigger('change', [true]);
        }
        if ($('.js-pdp-select-model:visible', this.$el).length > 0) {
            var modelSizeData = $('body').find('.b-plp-sidebar-modelSize.b-pdp-modelSize', this.$el).data('fitmodel-availability');
            if (modelSizeData) {
                $('body').trigger('product:updateModelSizeOptions', modelSizeData);
            }
        }
        var url = $('.l-pdp.product-detail').attr('data-pricehoverurl');
        if (url) {
            $.ajax({
                url: url,
                type: 'get',
                success: function (response) {
                    var variantsDetails = $('body').find('input[name = variantionsPrice]', this.$el);
                    if (response.variationsPrice && variantsDetails) {
                        variantsDetails.attr('value', response.variationsPrice);
                    }
                },
                error: function (err) {
                    console.log(err);
                }
            });
        }
    }

    onFaLinkClick(event) {
        event.preventDefault();

        var $temp = $('<input>');
        this.$el.append($temp);
        $temp.val($('#shareUrl').val()).select();
        document.execCommand('copy');
        $temp.remove();

        $('.copy-link-message').attr('role', 'alert');
        $('.copy-link-message').removeClass('d-none');

        setTimeout(function () {
            $('.copy-link-message').addClass('d-none');
        }, 3000);
    }

    onTouchStart(event) {
        if ($('.size-chart').has(event.target).length <= 0) {
            this.$sizeChart.removeClass('active');
        }
    }

    onAfterAttributeSelect(e, response) {
        if ($('.product-detail>.bundle-items').length) {
            response.container.data('pid', response.data.product.id);
            response.container.find('.product-id').text(response.data.product.id);
        } else if ($('.product-set-detail').eq(0)) {
            response.container.data('pid', response.data.product.id);
            response.container.find('.product-id').text(response.data.product.id);
        } else {
            $('.product-id').text(response.data.product.id);
            $('.product-detail:not(".bundle-item")').data('pid', response.data.product.id);
        }
    }

    onUpdateAvailability(event, response) {
        $('div.availability', response.$productContainer)
            .data('ready-to-order', response.product.readyToOrder)
            .data('available', response.product.available);

        $('.b-product_availability-message', response.$productContainer)
            .empty().html(response.message);

        if ($('.global-availability').length) {
            var allAvailable = $('.product-availability').toArray()
                .every(function (item) { return $(item).data('available'); });

            var allReady = $('.product-availability').toArray()
                .every(function (item) { return $(item).data('ready-to-order'); });

            $('.global-availability')
                .data('ready-to-order', allReady)
                .data('available', allAvailable);

            $('.global-availability .availability-msg').empty()
                .html(allReady ? response.message : response.resources.info_selectforstock);
        }
    }

    onUpdateAddToCart(e, response) {
        // update local add to cart (for sets)
        if ((response.product.readyToOrder && response.product.price.actualListPrice === null) || response.product.hasEGiftCards || response.hasPreOrder || response.isVIP) {
            $('.js_paypal_button').addClass('hide');
            $('.js_paypal_button', this.$el).parents('.b-product_actions-inner').addClass('btn-align-mobile');
        } else {
            $('.js_paypal_button').removeClass('hide');
            $('.js_paypal_button', this.$el).parents('.b-product_actions-inner').removeClass('btn-align-mobile');
        }

        var enable = $('.product-availability').toArray().every(function (item) {
            return $(item).data('available') && $(item).data('ready-to-order');
        });
        $('.add-to-cart-global').prop('disabled', !enable);
    }

    onUpdateAttributesAndDetails(e, data) {
        var $productContainer = $('.product-detail');

        $productContainer.find('.description-and-detail .product-attributes')
            .empty()
            .html(data.attributesHtml);

        if (data.shortDescription) {
            $productContainer.find('.description-and-detail .description')
                .removeClass('hidden-xl-down');
            $productContainer.find('.description-and-detail .description .content')
                .empty()
                .html(data.shortDescription);
        } else {
            $productContainer.find('.description-and-detail .description')
                .addClass('hidden-xl-down');
        }

        if (data.longDescription) {
            $productContainer.find('.description-and-detail .details')
                .removeClass('hidden-xl-down');
            $productContainer.find('.description-and-detail .details .content')
                .empty()
                .html(data.longDescription);
        } else {
            $productContainer.find('.description-and-detail .details')
                .addClass('hidden-xl-down');
        }
    }

    // Open confirmation Modal after product added to cart
    onupdateAddToCartModal() {
        var url = $('.added-tocart-confirmation-modal-url').val();
        var form = {};
        form = {
            pid: $('.l-pdp.product-detail').data('pid'),
            qty: $('.js-quantity-select').val()
        };
        if ($('.js-cmp-productDetail form.e-giftcard').length) {
            var amount = $('.js-cmp-productDetail form.e-giftcard').find('.js-giftcard-amount').val();
            form.gcAmount = parseFloat(amount).toFixed(2);
        }
        if ($('.b-size_pdp .b-select-size-outer ul li a.selected').length > 0 && $('.b-size_pdp .b-select-size-outer ul li a.selected').attr('data-size-attr')) {
            form.gcAmount = $('.b-size_pdp .b-select-size-outer ul li a.selected').attr('data-size-attr');
        }
        if (url) {
            $.ajax({
                url: url,
                type: 'get',
                data: form,
                success: function (response) {
                    $('#cartConfirmationModal .js-product-detailsConfirmation').html(response);
                    if (!$('.modal').is(':visible')) {
                        $('#cartConfirmationModal').modal('show');
                    }
                    if ($('.b-add-to-cart-confirmation-modal-container').data('giftcard') === true) {
                        $('.b-cart-added-confirmation-modal').find('.b-cart-content-recommendation').hide();
                    }
                    $('.js-confirmation-modal-recommendation-tiles').removeClass('hide');
                    util.branchCloseJourney();
                    $('.b-cart-added-confirmation-modal').find('.product-listing').trigger('mainCarousel:update');
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
    onShopThisOutfit(e) {
        e.preventDefault();
        var shopThisOutfitUrl = $('.model-shop-this-outfit .js-shop-this-outfit').data('shopthisoutfit-url');
        var shopThisOutfitSize = $('.model-shop-this-outfit .js-shop-this-outfit').data('shopthisoutfit-size');
        var selectedColor = $('.b-product_attrs-item[data-attr="color"]', this.$el).find('.m-active').data('attr-value');
        $('#shopThisOutfitModal.shop-this-outfit-modal').empty();
        if (shopThisOutfitUrl) {
            $.ajax({
                url: shopThisOutfitUrl,
                type: 'get',
                data: { selectedColor: selectedColor, selectedSize: shopThisOutfitSize },
                success: function (response) {
                    $('#shopThisOutfitModal.shop-this-outfit-modal').html(response);
                    $('#shopThisOutfitModal.shop-this-outfit-modal').find('.b-tile.hide').parent('.js-product_carousel-slide').remove();
                    $('#shopThisOutfitModal').modal('show');
                    $('.shop-this-outfit-models').trigger('mainCarousel:update');
                    setTimeout(function () {
                        $('body').trigger('components:init');
                        $('.shop-this-outfit-models .b-product_carousel-control').removeClass('hidden-on-load');
                    }, 500);
                },
                error: function (err) {
                    console.log(err);
                }
            });
        }
    }

    onKeydownWhenModalIsOpen(event) {
        if (event.keyCode === 27 && $('#shopThisOutfitModal').is(':visible')) {
            $('#shopThisOutfitModal').find('.close').trigger('click');
        }
    }
}
