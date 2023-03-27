'use strict';


/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} button - button that was clicked to add a product to the wishlist
 */
function displayMessage(data, button) {
    if (button.hasClass('product-added')) {
        button.removeClass('b-product_name-fav_button').addClass('b-product_name-fav_selectButton');
    } else {
        button.removeClass('b-product_name-fav_selectButton').addClass('b-product_name-fav_button');
    }
}

module.exports = {
    addToWishlist: function () {
        $('body').on('click', '.add-to-wish-list', function (e) {
            e.preventDefault();
            var url = $(this).attr('href');
            var button = $(this).find('.js-whislist-icon');
            var style = $(this).attr('data-analytics-style');
            var pidUrl = $('.b-quantity-select').find(':selected').attr('data-url');
            var result = {};
            if (pidUrl !== null && pidUrl !== undefined) {
                pidUrl.replace(/[?&amp;]+([^=&amp;]+)=([^&amp;]*)/gi, function (str, key, value) {
                    result[key] = value;
                }
                );
            }
            var pid = $(this).attr('data-pid');
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
                        displayMessage(data, button);
                        $('body').trigger('wishlist:removeItemSuccess', {
                            style: style
                        });
                    },
                    error: function (err) {
                        displayMessage(err, button);
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
                        displayMessage(data, button);
                        $('body').trigger('wishlist:addItemSuccess', {
                            style: style
                        });
                    },
                    error: function (err) {
                        displayMessage(err, button);
                    }
                });
            }
        });
    }
};
