'use strict';
var base = require('base/product/base');
var focusHelper = require('base/components/focus');

/**
 * Generates the modal window on the first call.
 *
 * @param {string} $container - Rendered HTML from quickview template
 */
function getModalHtmlElement($container = null) {
    if ($('#quickViewModal').length !== 0) {
        $('#quickViewModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal g-modal fade" id="quickViewModal" role="dialog">'
        + '<span class="enter-message sr-only" ></span>'
        + '<div class="modal-dialog g-modal-dialog quick-view-dialog">'
        + '<!-- Modal content-->'
        + '<div class="modal-content g-modal-content">'
        + '<div class="modal-header">'
        + '    <a class="full-pdp-link" href=""></a>'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        <span aria-hidden="true">&times;</span>'
        + '        <span class="sr-only"> </span>'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    if ($container && $container.length) {
        $container.append(htmlString);
    } else {
        $('body').append(htmlString);
    }
}

/**
 * @typedef {Object} QuickViewHtml
 * @property {string} body - Main Quick View body
 * @property {string} footer - Quick View footer content
 */

/**
 * Parse HTML code in Ajax response
 *
 * @param {string} html - Rendered HTML from quickview template
 * @return {QuickViewHtml} - QuickView content components
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var header = $html.find('.g-quickview-modal-header');
    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer, header: header };
}

/**
 * Positions modal element within containing product tile
 * @param {Object} $modal - jQuery object for the modal
 */
function setModalPosition($modal) {
    const tileImageHeight = $modal.closest('.b-tile').find('.b-tile-main_image').outerHeight();
    let modalContent = $modal.find('.modal-content')[0];
    const modalStyle = window.getComputedStyle(modalContent);
    const modalMarginTop = Number(modalStyle.marginTop.split('px')[0]);

    // set top
    let top = 0;
    if ($modal.find('.b-product_attrs-item[data-attr="length"]').length) {
        $modal.find('.modal-content').outerHeight(tileImageHeight, true);
    } else {
        top = Math.floor(($modal.closest('.b-tile').find('.b-tile-image').innerHeight() - $modal.find('.modal-content').outerHeight()) / 2) - modalMarginTop;
        top = Math.max(top, 0);
    }

    modalContent.style.top = top + 'px';

    // set modal container's height. this allows the visible modal content to be centered above the tile image.
    $modal.find('.modal-dialog').height(tileImageHeight);

    // set the height of the modal body (attr swatches and A2B CTA). since this element's container has a variable height this can't be achieved with CSS 'max-height' property.
    $modal.find('.modal-body').height($('.b-tile-quickview .modal-content').height() - $('.b-tile-quickview .modal-header').height());
}

/**
 * sets the text of a product tile's Quick View CTA
 * @param {string} $modal - Quick View modal jQuery object
 */
function updateQuickViewAddToCartText($modal) {
    // update add to cart text based on attribute
    $('.b-product_attrs-item:visible', $modal).each((i, el) => {
        const $attr = $(el);
        if ($('a.selected', $attr).length) {
            $('button.add-to-cart', $modal).removeAttr('disabled');
            return;
        }

        const attrName = $attr.data('attr');
        $('button.add-to-cart', $modal).attr('data-content', 'Select A ' + attrName);
        return false;   // eslint-disable-line consistent-return
    });
}

/**
 * replaces the content in the modal window on for the selected product variation.
 * @param {string} selectedValueUrl - url to be used to retrieve a new product model
 */
function fillModalElement(selectedValueUrl) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: selectedValueUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            var parsedHtml = parseHtml(data.renderedTemplate);

            $('.modal-header').html(parsedHtml.header);
            $('.modal-body').empty();
            $('.modal-body').html(parsedHtml.body);
            $('.modal-footer').html(parsedHtml.footer);
            $('.full-pdp-link').text(data.quickViewFullDetailMsg);
            $('#quickViewModal .full-pdp-link').attr('href', data.productUrl);
            $('#quickViewModal .size-chart').attr('href', data.productUrl);
            $('#quickViewModal .modal-header .close .sr-only').text(data.closeButtonText);
            $('#quickViewModal .enter-message').text(data.enterDialogMessage);
            $('#quickViewModal').modal('show');

            // quickview within product tile
            if ($('#quickViewModal').closest('.b-tile-quickview').length) {
                setModalPosition($('#quickViewModal'));
                updateQuickViewAddToCartText($('#quickViewModal'));
            }

            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * returns the variant param string for a color swatch link (e.g. 'dwvar_123456_color=001')
 * @param {Object} $swatchLink - swatch link jQuery object
 * @returns {string} variant param string
 */
function getColorVariantUrlParam($swatchLink) {
    let params = '';
    const url = $swatchLink.closest('.b-swatches_circle-item').attr('data-url');

    if (typeof url !== 'undefined') {
        const pidMatch = url.match(/\/(\d+)\.html/);

        if (pidMatch && pidMatch.length > 1) {
            const pid = pidMatch[1];
            const color = $swatchLink.attr('data-attr-value');
            params = `dwvar_${pid}_color=${color}`;
        }
    }

    return params;
}

/**
 * sets the URL of a product tile's Quick View CTA
 * @param {string} tile - Product tile DOM Node object
 * @returns {boolean|string} the Quick View CTA url, or the empty string if it couldn't be constructed properly
 */
function updateQuickViewAddToCart(tile) {
    const $swatchLink = $(tile).find('.js-swatch-link.m-active').length ? $(tile).find('.js-swatch-link.m-active') : $(tile).find('.js-swatch-link').eq(0);
    const dwvarParam = getColorVariantUrlParam($swatchLink);
    if (!dwvarParam) {
        return '';
    }

    let qvURL = $(tile).find('.js-tile-quickView_button').attr('href');
    if (qvURL.indexOf('dwvar_') > -1) {
        const regex = /dwvar_[\d]*_color=\d*/g;
        qvURL = qvURL.replace(regex, dwvarParam);
    } else {
        qvURL += '&' + dwvarParam;
    }
    $(tile).find('.js-tile-quickView_button').attr('href', qvURL);
    return qvURL;
}
module.exports = {
    showQuickview: function () {
        $('body').on('click', '.quickview', function (e) {
            e.preventDefault();
            var $qvButton = $(this).closest('a.quickview');
            var selectedValueUrl = $qvButton.attr('href');
            var $container = $qvButton.closest($qvButton.attr('data-modal-container')) || null;
            $(e.target).trigger('quickview:show');
            getModalHtmlElement($container);
            fillModalElement(selectedValueUrl);
        });
    },
    focusQuickview: function () {
        $('body').on('shown.bs.modal', '#quickViewModal', function () {
            $('#quickViewModal .close').focus();
        });
    },
    trapQuickviewFocus: function () {
        $('body').on('keydown', '#quickViewModal', function (e) {
            var focusParams = {
                event: e,
                containerSelector: '#quickViewModal',
                firstElementSelector: '.full-pdp-link',
                lastElementSelector: '.add-to-cart-global',
                nextToLastElementSelector: '.modal-footer .quantity-select'
            };
            focusHelper.setTabNextFocus(focusParams);
        });
    },
    availability: base.availability,
    addToCart: base.addToCart,
    updateAttribute: function () {
        $('body').on('product:afterAttributeSelect', function (e, response) {
            if ($('.modal.show .product-quickview>.bundle-items').length) {
                $('.modal.show').find(response.container).data('pid', response.data.product.id);
                $('.modal.show').find(response.container)
                    .find('.product-id').text(response.data.product.id);
            } else if ($('.set-items').length) {
                response.container.find('.product-id').text(response.data.product.id);
            } else {
                $('.modal.show .product-quickview').data('pid', response.data.product.id);
                $('.modal.show .full-pdp-link')
                    .attr('href', response.data.product.selectedProductUrl);
            }
        });
    },
    updateAddToCart: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            // update local add to cart (for sets)
            $('button.add-to-cart', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available));

            // update global add to cart (single products, bundles)
            var $dialog = $(response.$productContainer)
                .closest('.quick-view-dialog');

            $('.add-to-cart-global', $dialog).attr('disabled',
                !$('.global-availability', $dialog).data('ready-to-order')
                || !$('.global-availability', $dialog).data('available')
            );

            updateQuickViewAddToCartText($dialog);
        });
    },
    updateAvailability: function () {
        $('body').on('product:updateAvailability', function (e, response) {
            // bundle individual products
            $('.product-availability', response.$productContainer)
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available)
                .find('.availability-msg')
                .empty()
                .html(response.message);


            var dialog = $(response.$productContainer)
                .closest('.quick-view-dialog');

            if ($('.product-availability', dialog).length) {
                // bundle all products
                var allAvailable = $('.product-availability', dialog).toArray()
                    .every(function (item) { return $(item).data('available'); });

                var allReady = $('.product-availability', dialog).toArray()
                    .every(function (item) { return $(item).data('ready-to-order'); });

                $('.global-availability', dialog)
                    .data('ready-to-order', allReady)
                    .data('available', allAvailable);

                $('.global-availability .availability-msg', dialog).empty()
                    .html(allReady ? response.message : response.resources.info_selectforstock);
            } else {
                // single product
                $('.global-availability', dialog)
                    .data('ready-to-order', response.product.readyToOrder)
                    .data('available', response.product.available)
                    .find('.availability-msg')
                    .empty()
                    .html(response.message);
            }
        });
    },
    selectDefaultVariant: function () {
        var tiles = document.getElementsByClassName('b-tile-quickview');
        if (!tiles.length) {
            return;
        }
        Array.from(tiles).forEach(tile => {
            const $firstSwatch = $(tile).find('.js-swatch-link').eq(0);
            if (!$firstSwatch.hasClass('m-active')) {
                $firstSwatch.addClass('m-active');
                updateQuickViewAddToCart(tile);
            }
        });
    },
    recommendationEvents: function () {
        // swatch click on rec tile w/ quick view
        Array.from(document.querySelectorAll('.b-tile-quickview .js-swatch-link')).forEach(swatchLink => swatchLink.addEventListener('click', function (e) {
            e.preventDefault();
            if (!$(this).hasClass('m-active')) {
                $('.b-tile-quickview .js-swatch-link').removeClass('m-active');
                $(this).addClass('m-active');
                const tile = $(this).closest('.b-tile-recommendation');
                updateQuickViewAddToCart(tile);
            }
        }));

        $('body').on('click', '.b-tile-quickview .js-size-select', function (e) {
            e.preventDefault();
        });

        $('body').on('click', '.b-tile-quickview button.add-to-cart, .b-tile-quickview button.add-to-cart-global', function (e) {
            // prevent base add to cart handler from firing
            e.preventDefault();
            e.stopImmediatePropagation();
        });
    }
};
