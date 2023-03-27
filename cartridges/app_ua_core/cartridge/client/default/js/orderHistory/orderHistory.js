'use strict';

module.exports = function () {
    $('body').on('change', '.order-history-select', function (e) {
        var $ordersContainer = $('.order-list-container');
        $ordersContainer.empty();
        $.spinner().start();
        $('.order-history-select').trigger('orderHistory:sort', e);
        $.ajax({
            url: e.currentTarget.value,
            method: 'GET',
            success: function (data) {
                $ordersContainer.html(data);
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                $.spinner().stop();
            }
        });
    });

    // eslint-disable-next-line spellcheck/spell-checker
    $('.js-account-main-section').on('click', '.account-orderhistory-showmore', function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        var data = { after: $(this).data('after') };
        var $orderListContainer = $('.js-account-main-section .order-list-container .account-orderlist-container');
        // eslint-disable-next-line spellcheck/spell-checker
        var $showMore = $('.js-account-main-section .account-orderhistory-showmore-container');
        $.ajax({
            url: url,
            data: data,
            success: function (response) {
                // eslint-disable-next-line spellcheck/spell-checker
                if ($(response).find('.account-orderlist-container').length > 0) {
                    // eslint-disable-next-line spellcheck/spell-checker
                    $orderListContainer.append($(response).find('.account-orderlist-container').html());
                    $showMore.html('');
                }
                // eslint-disable-next-line spellcheck/spell-checker
                if ($(response).find('.account-orderhistory-showmore-container').length > 0) {
                    // eslint-disable-next-line spellcheck/spell-checker
                    $showMore.html($(response).find('.account-orderhistory-showmore-container').html());
                }
            }
        });
    });

    /**
    * Update the order or return history
    * @param {string} url - order history or return history page url
    */
    function orderSummary(url) {
        var $orderListContainer = $('.js-account-main-section .account-orders-container');
        $.spinner().start();
        $.ajax({
            url: url,
            success: function (response) {
                $.spinner().stop();
                if ($(response).find('.account-orders-container').length > 0) {
                    $orderListContainer.empty();
                    $orderListContainer.html($(response).find('.account-orders-container').html());
                } else if (response.errorInResponse) {
                    $orderListContainer.empty();
                    $orderListContainer.html($(response.renderedTemplate).html());
                }
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
    $('.js-account-main-section').on('click', '.account-history-orders', function (e) {
        e.preventDefault();
        $('.account-history-returns').removeClass('active');
        $(this).addClass('active');
        var url = $(this).attr('href');
        orderSummary(url);
    });
    $('.js-account-main-section').on('click', '.account-history-returns', function (e) {
        e.preventDefault();
        $('.account-history-orders').removeClass('active');
        $(this).addClass('active');
        var url = $(this).attr('href');
        orderSummary(url);
    });
};

