'use strict';

import Modal from './Modal';
var focusHelper = require('base/components/focus');

/**
 * Retrieve contextual quantity selector
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {jquery} - quantity selector DOM container
 */
function getQuantitySelector($el) {
    var quantitySelected;
    if ($el && $('.set-items').length) {
        quantitySelected = $($el).closest('.product-detail').find('.quantity-select');
    } else if ($el && $('.product-bundle').length) {
        var quantitySelectedModal = $($el).closest('.modal-footer').find('.quantity-select');
        var quantitySelectedPDP = $($el).closest('.bundle-footer').find('.quantity-select');
        if (quantitySelectedModal.val() === undefined) {
            quantitySelected = quantitySelectedPDP;
        } else {
            quantitySelected = quantitySelectedModal;
        }
    } else {
        quantitySelected = $('.quantity-select');
    }
    return quantitySelected;
}

/**
 * Process the attribute values for an attribute that has image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 * @param {Object} msgs - object containing resource messages
 */
function processSwatchValues(attr, $productContainer, msgs) {
    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer.find('[data-attr-variation="' + attr.id + '"] [data-attr-value="' +
            attrValue.value + '"]');
        var $swatchButton = $attrValue.parent();

        if (attrValue.selected) {
            $attrValue.addClass('selected');
            $attrValue.siblings('.selected-assistive-text').text(msgs.assistiveSelectedText);
        } else {
            $attrValue.removeClass('selected');
            $attrValue.siblings('.selected-assistive-text').empty();
        }

        if (attrValue.url) {
            $swatchButton.attr('data-url', attrValue.url);
        } else {
            $swatchButton.removeAttr('data-url');
        }

        // Disable if not selectable
        $attrValue.removeClass('selectable unselectable');

        $attrValue.addClass(attrValue.selectable ? 'selectable' : 'unselectable');
    });
}

/**
 * Process attribute values associated with an attribute that does not have image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function processNonSwatchValues(attr, $productContainer) {
    var $attr = '[data-attr-variation="' + attr.id + '"]';
    var $defaultOption = $productContainer.find($attr + ' .select-' + attr.id + ' option:first');
    $defaultOption.attr('value', attr.resetUrl);

    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer
            .find($attr + ' [data-attr-value="' + attrValue.value + '"]');
        $attrValue.attr('value', attrValue.url)
            .removeAttr('disabled');

        if (!attrValue.selectable) {
            $attrValue.attr('disabled', true);
        }
    });
}

/**
 * Routes the handling of attribute processing depending on whether the attribute has image
 *     swatches or not
 *
 * @param {Object} attrs - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {jQuery} $productContainer - DOM element for a given product
 * @param {Object} msgs - object containing resource messages
 */
function updateAttrs(attrs, $productContainer, msgs) {
    // Currently, the only attribute type that has image swatches is Color.
    var attrsWithSwatches = ['color'];

    attrs.forEach(function (attr) {
        if (attrsWithSwatches.indexOf(attr.id) > -1) {
            processSwatchValues(attr, $productContainer, msgs);
        } else {
            processNonSwatchValues(attr, $productContainer);
        }
    });
}

/**
 * Updates the availability status in the Product Detail Page
 *
 * @param {Object} response - Ajax response object after an
 *                            attribute value has been [de]selected
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function updateAvailability(response, $productContainer) {
    var availabilityValue = '';
    var availabilityMessages = response.product.availability.messages;
    if (!response.product.readyToOrder) {
        availabilityValue = '<li><div>' + response.resources.info_selectforstock + '</div></li>';
    } else {
        availabilityMessages.forEach(function (message) {
            availabilityValue += '<li><div>' + message + '</div></li>';
        });
    }

    $($productContainer).trigger('product:updateAvailability', {
        product: response.product,
        $productContainer: $productContainer,
        message: availabilityValue,
        resources: response.resources
    });
}

/**
 * Generates html for product attributes section
 *
 * @param {array} attributes - list of attributes
 * @return {string} - Compiled HTML
 */
function getAttributesHtml(attributes) {
    if (!attributes) {
        return '';
    }

    var html = '';

    attributes.forEach(function (attributeGroup) {
        if (attributeGroup.ID === 'mainAttributes') {
            attributeGroup.attributes.forEach(function (attribute) {
                html += '<div class="attribute-values">' + attribute.label + ': '
                    + attribute.value + '</div>';
            });
        }
    });

    return html;
}

/**
 * @typedef UpdatedOptionValue
 * @type Object
 * @property {string} id - Option value ID for look up
 * @property {string} url - Updated option value selection URL
 */

/**
 * @typedef OptionSelectionResponse
 * @type Object
 * @property {string} priceHtml - Updated price HTML code
 * @property {Object} options - Updated Options
 * @property {string} options.id - Option ID
 * @property {UpdatedOptionValue[]} options.values - Option values
 */

/**
 * Updates DOM using post-option selection Ajax response
 *
 * @param {OptionSelectionResponse} optionsHtml - Ajax response optionsHtml from selecting a product option
 * @param {jQuery} $productContainer - DOM element for current product
 */
function updateOptions(optionsHtml, $productContainer) {
	// Update options
    $productContainer.find('.product-options').empty().html(optionsHtml);
}

/**
 * Dynamically creates Bootstrap carousel from response containing images
 * @param {Object[]} imgs - Array of large product images,along with related information
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function createCarousel(imgs, $productContainer) {
    var carousel = $productContainer.find('.b-product_carousel-wrapper');
    var parendDiv = $productContainer.find('.b-product_carousel');
    $(carousel).carousel('dispose');
    $(carousel).empty();
    for (var i = 0; i < imgs.length; i++) {
        $('<div class="b-product_carousel-slide js-product_carousel-slide swiper-slide" style="width: 100%; margin-right: 1px;" role="group" aria-label="1 / 6"><img src="' + imgs[i].url + '" class="class="b-product_carousel-image js-product_carousel-image"" alt="' + imgs[i].alt + ' image number ' + parseInt(imgs[i].index, 10) + '" title="' + imgs[i].title + '" itemprop="image" /></div>').appendTo($(parendDiv).find('.b-product_carousel-wrapper'));
    }
    $($(carousel).find('.b-product_carousel-slide')).first().addClass('swiper-slide-active');
    $($(carousel).find('.carousel-indicators > li')).first().addClass('active');
    if (imgs.length === 1) {
        $($(carousel).find('.carousel-indicators, a[class^="carousel-control-"]')).detach();
    }
    $(carousel).carousel();
    $($(carousel).find('.carousel-indicators')).attr('aria-hidden', true);
}

/**
 * Parses JSON from Ajax call made whenever an attribute value is [de]selected
 * @param {Object} response - response from Ajax call
 * @param {Object} response.product - Product object
 * @param {string} response.product.id - Product ID
 * @param {Object[]} response.product.variationAttributes - Product attributes
 * @param {Object[]} response.product.images - Product images
 * @param {boolean} response.product.hasRequiredAttrsSelected - Flag as to whether all required
 *     attributes have been selected.  Used partially to
 *     determine whether the Add to Cart button can be enabled
 * @param {jQuery} $productContainer - DOM element for a given product.
 */
function handleVariantResponse(response, $productContainer) {
    var isChoiceOfBonusProducts =
        $productContainer.parents('.choose-bonus-product-dialog').length > 0;
    var isVaraint;
    if (response.product.variationAttributes) {
        updateAttrs(response.product.variationAttributes, $productContainer, response.resources);
        isVaraint = response.product.productType === 'variant';
        if (isChoiceOfBonusProducts && isVaraint) {
            $productContainer.parent('.bonus-product-item')
                .data('pid', response.product.id);

            $productContainer.parent('.bonus-product-item')
                .data('ready-to-order', response.product.readyToOrder);
        }
    }

    // Update primary images
    var primaryImageUrls = response.product.images.pdpMainDesktop;
    createCarousel(primaryImageUrls, $productContainer);

    // Update pricing
    if (!isChoiceOfBonusProducts) {
        var $priceSelector = $('.prices .price', $productContainer).length
            ? $('.prices .price', $productContainer)
            : $('.prices .price');
        $priceSelector.replaceWith(response.product.price.html);
    }

    // Update promotions
    $productContainer.find('.promotions').empty().html(response.product.promotionsHtml);

    updateAvailability(response, $productContainer);

    if (isChoiceOfBonusProducts) {
        var $selectButton = $productContainer.find('.select-bonus-product');
        $selectButton.trigger('bonusproduct:updateSelectButton', {
            product: response.product, $productContainer: $productContainer
        });
    } else {
        // Enable "Add to Cart" button if all required attributes have been selected
        $('button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global').trigger('product:updateAddToCart', {
            product: response.product, $productContainer: $productContainer
        }).trigger('product:statusUpdate', response.product);
    }

    // Update attributes
    $productContainer.find('.main-attributes').empty()
        .html(getAttributesHtml(response.product.attributes));
}

/**
 * @typespec UpdatedQuantity
 * @type Object
 * @property {boolean} selected - Whether the quantity has been selected
 * @property {string} value - The number of products to purchase
 * @property {string} url - Compiled URL that specifies variation attributes, product ID, options,
 *     etc.
 */

/**
 * Updates the quantity DOM elements post Ajax call
 * @param {UpdatedQuantity[]} quantities -
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function updateQuantities(quantities, $productContainer) {
    if ($productContainer.parent('.bonus-product-item').length <= 0) {
        var optionsHtml = quantities.map(function (quantity) {
            var selected = quantity.selected ? ' selected ' : '';
            return '<option value="' + quantity.value + '"  data-url="' + quantity.url + '"' +
                selected + '>' + quantity.value + '</option>';
        }).join('');
        getQuantitySelector($productContainer).empty().html(optionsHtml);
    }
}

/**
 * updates the product view when a product attribute is selected or deselected or when
 *         changing quantity
 * @param {string} selectedValueUrl - the Url for the selected variation value
 * @param {jQuery} $productContainer - DOM element for current product
 */
function attributeSelect(selectedValueUrl, $productContainer) {
    if (selectedValueUrl) {
        $('body').trigger('product:beforeAttributeSelect',
            { url: selectedValueUrl, container: $productContainer });

        $.ajax({
            url: selectedValueUrl,
            method: 'GET',
            success: function (data) {
                handleVariantResponse(data, $productContainer);
                updateOptions(data.product.optionsHtml, $productContainer);
                updateQuantities(data.product.quantities, $productContainer);
                $('body').trigger('product:afterAttributeSelect',
                    { data: data, container: $productContainer });
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
}

export default class BonusProductModal extends Modal {
    init() {
        super.init();
        this.selectors = {
            addBonusProducts: '.add-bonus-products',
            selectBonusProduct: '.select-bonus-product',
            removeBonusProduct: '.selected-pid',
            showMoreBonusProducts: '.show-more-bonus-products',
            colorAttribute: '[data-attr-variation="color"] button',
            selectAttribute: 'select[class*="selectvariation-"], .options-select'
        };
    }

    createTarget() {
        super.createTarget();

        this.eventDelegate('click', this.selectors.addBonusProducts, this.addBonusProductsToCart.bind(this), this.$target);

        var $body = $('body');
        this.eventDelegate('shown.bs.modal', '#' + this.targetID, this.focusChooseBonusProductModal.bind(this), $body);
        this.eventDelegate('hidden.bs.modal', '#' + this.targetID, this.onClosingChooseBonusProductModal.bind(this), $body);
        this.eventDelegate('keydown', '#' + this.targetID, this.trapChooseBonusProductModalFocus.bind(this), $body);

        this.eventDelegate('click', this.selectors.selectBonusProduct, this.selectBonusProduct.bind(this), this.$target);
        this.eventDelegate('click', this.selectors.removeBonusProduct, this.removeBonusProduct.bind(this), this.$target);
        this.eventDelegate('click', this.selectors.showMoreBonusProducts, this.showMoreBonusProducts.bind(this), this.$target);
        this.eventDelegate('click', this.selectors.colorAttribute, this.colorAttribute.bind(this), this.$target);
        this.eventDelegate('change', this.selectors.selectAttribute, this.selectAttribute.bind(this), this.$target);
    }

    parseHtml(html) {
        var $html = $('<div>').append($.parseHTML(html));
        var body = $html.find('.choice-of-bonus-product');
        var footer = $html.find('.modal-footer').children();

        return { body: body, footer: footer };
    }

    onAJAXSuccess(data) {
        var parsedHtml = this.parseHtml(data.renderedTemplate);
        var targetIdSelector = '#' + this.targetID;

        $(targetIdSelector + ' .modal-body').empty();
        $(targetIdSelector + ' .enter-message').text(data.enterDialogMessage);
        $(targetIdSelector + ' .modal-header .close .sr-only').text(data.closeButtonText);
        $(targetIdSelector + ' .modal-body').html(parsedHtml.body);
        $(targetIdSelector + ' .modal-footer').html(parsedHtml.footer);
        $(targetIdSelector).modal('show');

        $.spinner().stop();
    }

    focusChooseBonusProductModal() {
        $(this.selectors.chooseBonusProductModal).siblings().attr('aria-hidden', 'true');
        $(this.selectors.chooseBonusProductModal + ' .close').focus();
    }

    onClosingChooseBonusProductModal() {
        $(this.selectors.chooseBonusProductModal).siblings().attr('aria-hidden', 'false');
    }

    trapChooseBonusProductModalFocus(event) {
        var focusParams = {
            event: event,
            containerSelector: this.selectors.chooseBonusProductModal,
            firstElementSelector: '.close',
            lastElementSelector: this.selectors.addBonusProducts
        };
        focusHelper.setTabNextFocus(focusParams);
    }

    colorAttribute() {
        $(document).off('click').on('click', '[data-attr-variation="color"] button', function (e) {
            e.preventDefault();
            if ($(this).attr('disabled')) {
                return;
            }
            var $productContainer = $(this).closest('.product-detail');
            if ($productContainer.length) {
                $productContainer = $(this).closest('.product-detail');
                attributeSelect($(this).attr('data-url'), $productContainer);
            }
        });
    }

    selectAttribute() {
        $(document).off('change').on('change', 'select[class*="selectvariation-"], .options-select', function (e) {
            e.preventDefault();
            var $productContainer = $(this).closest('.product-detail');
            if ($productContainer.length) {
                $productContainer = $(this).closest('.product-detail');
                attributeSelect(e.currentTarget.value, $productContainer);
            }
        });
    }

    addBonusProductsToCart() {
        var $readyToOrderBonusProducts = $('.choose-bonus-product-dialog .selected-pid');
        var queryString = '?pids=';
        var url = $('.choose-bonus-product-dialog').data('addtocarturl');
        var pidsObject = {
            bonusProducts: []
        };

        $.each($readyToOrderBonusProducts, function () {
            var qtyOption =
                parseInt($(this)
                    .data('qty'), 10);

            var option = null;
            if (qtyOption > 0) {
                if ($(this).data('optionid') && $(this).data('option-selected-value')) {
                    option = {};
                    option.optionId = $(this).data('optionid');
                    option.productId = $(this).data('pid');
                    option.selectedValueId = $(this).data('option-selected-value');
                }
                pidsObject.bonusProducts.push({
                    pid: $(this).data('pid'),
                    qty: qtyOption,
                    options: [option]
                });
                pidsObject.totalQty = parseInt($('.pre-cart-products').html(), 10);
            }
        });

        if (!pidsObject.bonusProducts.length) {
            return;
        }

        try {
            queryString += JSON.stringify(pidsObject);
        } catch (error) {
            throw new Error(error.message);
        }

        queryString = queryString + '&uuid=' + $('.choose-bonus-product-dialog').data('uuid');
        queryString = queryString + '&pliuuid=' + $('.choose-bonus-product-dialog').data('pliuuid');

        $.spinner().start();
        $.ajax({
            url: url + queryString,
            method: 'POST',
            success: function (data) {
                $.spinner().stop();
                if (data.error) {
                    $('.error-choice-of-bonus-products')
                        .html(data.errorMessage);
                } else {
                    $('.configure-bonus-product-attributes').html(data);
                    $('.bonus-products-step2').removeClass('hidden-xl-down');
                    this.$target.modal('hide');

                    if ($('.add-to-cart-messages').length === 0) {
                        $('body').append(
                            '<div class="add-to-cart-messages"></div>'
                        );
                    }
                    $('.minicart-quantity').html(data.totalQty);
                    $('.add-to-cart-messages').append(
                        `<div class="alert alert-success add-to-basket-alert text-center"
                         role="alert">${data.msgSuccess}</div>`
                    );
                    if ($('.card-product-info').hasClass('bonus-product-line-item') && $('.b-cart-content_left').length) {
                        location.reload();
                    }

                    $('.add-to-basket-alert').remove();
                    if ($('.cart-page').length) {
                        location.reload();
                    }
                }
            }.bind(this),
            error: function () {
                $.spinner().stop();
            }
        });
    }

    selectBonusProduct(event) {
        var $clickedElement = $(event.target);
        var $choiceOfBonusProduct = $clickedElement.parents('.choice-of-bonus-product');
        var pid = $clickedElement.data('pid');
        var maxPids = $('.choose-bonus-product-dialog').data('total-qty');
        var submittedQty = parseInt($clickedElement.parents('.choice-of-bonus-product').find('.bonus-quantity-select').val(), 10);
        var totalQty = 0;
        $.each($(`#${this.targetID} .selected-bonus-products .selected-pid`), function () {
            totalQty += $(this).data('qty');
        });
        totalQty += submittedQty;
        var optionID = $clickedElement.parents('.choice-of-bonus-product').find('.product-option').data('option-id');
        var valueId = $clickedElement.parents('.choice-of-bonus-product').find('.options-select option:selected').data('valueId');
        if (totalQty <= maxPids) {
            var selectedBonusProductHtml = `
            <div class="selected-pid row"
            data-pid="${pid}"
            data-qty="${submittedQty}"
            data-optionID="${optionID || ''}"
            data-option-selected-value="${valueId || ''}"
            >
            <div class="col-sm-11 col-9 bonus-product-name" >
            ${$choiceOfBonusProduct.find('.product-name').html()}
            </div>
            <div class="col-1"><i class="fa fa-times" aria-hidden="true"></i></div>
            </div>`
            ;
            $(`#${this.targetID} .selected-bonus-products`).append(selectedBonusProductHtml);
            $('.pre-cart-products').html(totalQty);
            $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');
        } else {
            $('.selected-bonus-products .bonus-summary').addClass('alert-danger');
        }
    }

    removeBonusProduct(event) {
        $(event.target).closest(this.selectors.removeBonusProduct).remove();
        var $selected = $(`${this.selectors.chooseBonusProductModal} .selected-bonus-products ${this.selectors.removeBonusProduct}`);
        var count = 0;
        if ($selected.length) {
            $selected.each(function () {
                count += parseInt($(this).data('qty'), 10);
            });
        }

        $('.pre-cart-products').html(count);
        $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');
    }

    showMoreBonusProducts(event) {
        var url = $(event.target).data('url');
        $('.modal-content').spinner().start();
        $.ajax({
            url: url,
            method: 'GET',
            success: function (html) {
                var parsedHtml = this.parseHtml(html);
                $('.modal-body').append(parsedHtml.body);
                $('.show-more-bonus-products:first').remove();
                $('.modal-content').spinner().stop();
            }.bind(this),
            error: function () {
                $('.modal-content').spinner().stop();
            }
        });
    }
}
