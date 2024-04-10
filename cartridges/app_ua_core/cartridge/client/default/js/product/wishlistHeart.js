'use strict';

let $body;

/**
 * Updating Wishlist Indicator for respective products
 *
 * @param {Array} rawProductIDs - Wishlist Product IDs Array
 */
const updateWishlistIndicator = (rawProductIDs) => {
    const productIDs = rawProductIDs;
    const selectorArray = productIDs.map(function (productID) {
        return '.wishlistTile[data-pid=' + productID + '] span.b-tile-fav_button';
    });
    const selectorString = selectorArray.join(', ');
    $(selectorString).addClass('product-added b-tile-fav_selectButton');
    $(selectorString).removeClass('b-tile-fav_button');
};

/**
 * Retrieves/Update the user's wishlist by making a GET request to the wishlist AJAX URL.
 * @function updateWishList
 * @param {string} [response] - A string of product IDs separated by '|'. If not provided,
 *     the function makes a GET request to retrieve the wishlist.
*/
const updateWishList = (response) => {
    const getWishListURL = $('#bodyPage').data('wishlist');

    if (response && 'data' in response && response.data) {
        const productIDs = response.data.split('|');
        if (productIDs.length > 0) {
            updateWishlistIndicator(productIDs);
        }
    } else if (getWishListURL) {
        $.ajax({
            url: getWishListURL,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if (data && 'wishlistProductIDsArray' in data && data.wishlistProductIDsArray.length > 0) {
                    updateWishlistIndicator(data.wishlistProductIDsArray);
                }
            }
        });
    }
};

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} icon - icon that was clicked to add a product to the wishlist
 */
function displayMessageAndChangeIcon(data, icon) {
    if (icon.hasClass('product-added')) {
        icon.removeClass('b-tile-fav_button').addClass('b-tile-fav_selectButton');
    } else {
        icon.removeClass('b-tile-fav_selectButton').addClass('b-tile-fav_button');
    }
}

/**
 * @description init all components manager events
 */
function initEvents() {
    $body.on('wishlistSuggestion:update', (response) => {
        updateWishList(response);
    });
}

module.exports = {
    init: function () {
        $body = $('body');

        initEvents();
    },
    addToWishlist: function () {
        $body.on('click', '.wishlistTile', function (e) {
            e.preventDefault();
            var icon = $(this).find('.js-whislist-icon');
            var url = $(this).attr('href');
            var pid = $(this).closest('.product').data('pid');
            var style = $(this).attr('data-analytics-style');
            var optionId = $(this).closest('.product-detail').find('.product-option').attr('data-option-id');
            var optionVal = $(this).closest('.product-detail').find('.options-select option:selected').attr('data-value-id');
            optionId = optionId || null;
            optionVal = optionVal || null;
            if (!url || !pid) {
                return;
            }

            if ($(this).find('.js-whislist-icon').hasClass('product-added')) {
                url = $(this).attr('remove-href');
                $(this).find('.js-whislist-icon').removeClass('product-added');
                $.ajax({
                    url: url,
                    type: 'get',
                    dataType: 'json',
                    data: {
                        pid: pid,
                        optionId: optionId,
                        optionVal: optionVal
                    },
                    success: function (data) {
                        displayMessageAndChangeIcon(data, icon);
                        $body.trigger('wishlist:removeItemSuccess', {
                            style: style
                        });
                    },
                    error: function (err) {
                        displayMessageAndChangeIcon(err, icon);
                    }
                });
            } else {
                $(this).find('.js-whislist-icon').addClass('product-added');
                $.ajax({
                    url: url,
                    type: 'post',
                    dataType: 'json',
                    data: {
                        pid: pid,
                        optionId: optionId,
                        optionVal: optionVal
                    },
                    success: function (data) {
                        displayMessageAndChangeIcon(data, icon);
                        $body.trigger('wishlist:addItemSuccess', {
                            style: style
                        });
                    },
                    error: function (err) {
                        displayMessageAndChangeIcon(err, icon);
                    }
                });
            }
        });
    },

    wishlistAddtoCart: function () {
        $('body').on('click', '.js-wishlist-tile-quickAdd_button', function (e) {
            const $btn = $(this);
            const addToCartUrl = $btn.data('url');
            const earlyAccessProduct = $btn.data('is-ea-product');
            e.preventDefault();

            const qty = $btn.data('qty');

            $btn.trigger('product:beforeAddToCart', $btn);

            const form = {
                options: [],
                pid: $btn.data('pid'),
                quantity: qty,
                mpid: $btn.data('mpid') || $btn.data('pid')
            };

            if (earlyAccessProduct) {
                window.location.href = $btn.data('redirect');
                return;
            }
            $.ajax({
                url: addToCartUrl,
                method: 'POST',
                data: form,
                success: (data) => {
                    if (data.error) {
                        var availabilityMessages = '';
                        try {
                            availabilityMessages = JSON.parse(data.message);
                        } catch (error) {
                            availabilityMessages = '';
                        }
                        // if (availabilityMessages.outOfStockMsg && availabilityMessages.isNotAvailable) {
                        if (availabilityMessages) {
                            $btn.siblings('.b-notify-cta').eq(0).removeClass('hide').trigger('click');
                        }
                        return;
                    }
                    $('.minicart').trigger('count:update', data);
                    $('body').trigger('product:updateAddToCartModal', data);

                    // show add to cart toast
                    if (data.newBonusDiscountLineItem && Object.keys(data.newBonusDiscountLineItem).length !== 0) {
                        $('[data-cmp="detailBonusProductModal"]').trigger('product:showBonusProducts', data.newBonusDiscountLineItem);
                    }
                    if ($('.b-cart-content.cart').length > 0) {
                        if (data.renderedTemplate) {
                            $('body').trigger('cart:updateCartTotals', [data.cart, this]);
                            if ($('.cart').find('.b-cartlineitem').length === 0) {
                                window.location.reload();
                            } else {
                                // update cart product cards markup
                                $('.js-cart-items').replaceWith(data.renderedTemplate);

                                $('body').trigger('cart:update');
                            }
                        }
                        $('.b-cart_klarna-placement').toggleClass('hide', (data.cart.hasGiftCards || data.cart.hasPreOrder));
                    }

                    var srContainer = $('.b-cart-content_right .b-cart_shoprunner').closest('div');
                    if (data.cart && data.cart.srEligible && srContainer.hasClass('hide')) {
                        srContainer.removeClass('hide');
                    }
                    var analyticsData = {
                        analytics: {
                            isWishlist: true,
                            quantityAdded: qty
                        }
                    };
                    $('body').trigger('product:afterAddToCart', $.extend(data, analyticsData));
                },
                beforeSend: function () {
                    $btn.parent().addClass('active');
                    $btn.children('i').removeClass('icon-qatc').addClass('icon-qatcg');
                },
                complete: function (data) {
                    $btn.parent().removeClass('active');
                    $btn.children('i').removeClass('icon-qatcg').addClass('icon-qatcr');
                    var lineItems = data.responseJSON.lineItems;
                    var lineItem = lineItems.find(item => item.id === $btn.data('pid').toString());
                    setTimeout(function () {
                        if (lineItem.quantity === lineItem.quantityOptions.maxOrderQuantity) {
                            $btn.addClass('d-none');
                        }
                        $btn.children('i').removeClass('icon-qatcr').addClass('icon-qatc');
                    }, 500);
                },
                error: function () {
                    $('.js-add-to-cart').text($('.js-add-to-cart').data('has-error'));
                }
            });
        });
    }
};
