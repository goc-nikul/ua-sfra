'use strict';

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

module.exports = {
    addToWishlist: function () {
        $('body').on('click', '.wishlistTile', function (e) {
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
                        $('body').trigger('wishlist:removeItemSuccess', {
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
                        $('body').trigger('wishlist:addItemSuccess', {
                            style: style
                        });
                    },
                    error: function (err) {
                        displayMessageAndChangeIcon(err, icon);
                    }
                });
            }
        });
    }
};
