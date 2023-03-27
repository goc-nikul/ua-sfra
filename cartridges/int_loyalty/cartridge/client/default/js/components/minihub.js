'use strict';
const $mhmodal = $('#minihubmodal');
const token = $('#minihub-csrf').val();
const { createModal } = require('./helpers');

const updatePoints = (points) => {
    const pointsFormatted = Number(points).toLocaleString('en-us');
    $('.js--mhpoints-update').text(pointsFormatted);
};

const checkAvailableReward = (pointsBalance) => {
    $('.g-reward-card').each(function () {
        const rewardCost = $(this).data('pointsCost');

        if (rewardCost > pointsBalance && $(this).hasClass('active') !== true) {
            $(this).addClass('g-reward-card_hide');
        } else {
            $(this).removeClass('g-reward-card_hide');
        }
    });
};

/**
 * Function that builds request for redeem/remove reward
 * @param {string} csrfToken - csrf token to be passed to BE
 * @param {string} rewardId - reward id
 * @param {string} rewardFlowType - the type of reward redemption flow to use
 * @param {string} productId - product id
 * @returns {Object} - request object for redeem and remove reward
 */
function requestBuilder(csrfToken, rewardId, rewardFlowType, productId) {
    return {
        csrf_token: csrfToken,
        productId: productId,
        rewardId: rewardId,
        rewardFlowType: rewardFlowType
    };
}

const rewardRedeem = (_, data) => {
    const currentCard = data.el.closest('.g-reward-card');
    const url = currentCard.closest('.mhmodal__body-content').data('redeemAction');
    const rewardId = currentCard.find('.g-reward-card_cta-wrapper').data('rewardid');
    const rewardFlowType = currentCard.find('.g-reward-card_cta-wrapper').data('rewardFlowType');
    let productId = null;
    let reload = false;
    if (rewardFlowType === 'FREE_PRODUCT') {
        productId = currentCard.find('.b-product-quickview').data('pid');
        reload = true;
    }

    const dataObj = requestBuilder(token, rewardId, rewardFlowType, productId);
    $mhmodal.spinner().start();

    $.ajax({
        url: url,
        method: 'POST',
        data: dataObj,
        success: function (res) {
            $.spinner().stop();
            if (res.success) {
                currentCard.addClass('active');
                updatePoints(res.cartModel.loyaltyPointsBalance);
                checkAvailableReward(res.cartModel.loyaltyPointsBalance);
                $('.coupon-code-field').removeClass('is-invalid');
                $('body').trigger({
                    type: 'loyalty:minihub:redeemReward',
                    evData: {
                        res,
                        reload
                    }
                });
                if (res.isInvalidCoupon) {
                    const { bodyText, title, icon, btnText, btnActionURL = location.href } = res.error;
                    $('.coupon-code-field').addClass('is-invalid');
                    createModal({
                        id: 'g-modal-minihub-error',
                        bodyText,
                        title,
                        btnText,
                        btnActionURL,
                        icon
                    });
                    $('#minihubmodal').modal('hide');
                    $('#g-modal-minihub-error').modal('show');
                }
            } else {
                const { bodyText, title, btnText, btnActionURL = location.href } = res.error;
                createModal({
                    id: 'g-modal-minihub-error',
                    bodyText,
                    title,
                    btnText,
                    btnActionURL
                });
                $('#minihubmodal').modal('hide');
                $('#g-modal-minihub-error').modal('show');
            }
        },
        error: function (err) {
            $.spinner().stop();
            if (err.responseJSON.redirectUrl) {
                location.href = err.responseJSON.redirectUrl;
            }
        }
    });
};

const rewardRemove = (_, data) => {
    const currentCard = data.el.closest('.g-reward-card');
    const url = currentCard.closest('.mhmodal__body-content').data('removeAction');
    const rewardId = currentCard.find('.g-reward-card_cta-wrapper').data('rewardid');
    const rewardFlowType = currentCard.find('.g-reward-card_cta-wrapper').data('reward-flow-type');
    let productId = null;
    let reload = false;
    if (rewardFlowType === 'FREE_PRODUCT') {
        productId = currentCard.find('.b-product-quickview').data('pid');
        reload = true;
    }
    const dataObj = requestBuilder(token, rewardId, rewardFlowType, productId);

    $mhmodal.spinner().start();
    $.ajax({
        url: url,
        method: 'POST',
        data: dataObj,
        success: function (res) {
            $mhmodal.spinner().stop();
            if (res.success) {
                currentCard.removeClass('active');
                updatePoints(res.cartModel.loyaltyPointsBalance);
                checkAvailableReward(res.cartModel.loyaltyPointsBalance);
                $('body').trigger({
                    type: 'loyalty:minihub:removeReward',
                    evData: {
                        res,
                        reload
                    }
                });
            } else {
                const { bodyText, title, btnText } = res.error;
                createModal({
                    id: 'g-modal-minihub-error',
                    bodyText,
                    title,
                    btnText,
                    btnActionURL: location.href
                });
                $('#minihubmodal').modal('hide');
                $('#g-modal-minihub-error').modal('show');
            }
        },
        error: function (err) {
            $mhmodal.spinner().stop();
            if (err.responseJSON.redirectUrl) {
                location.href = err.responseJSON.redirectUrl;
            }
        }
    });
};

const initEmbedApparelReward = () => {
    const options = {
        root: document.querySelector('.js-mhmodal__body-content'),
        rootMargine: '0'
    };

    const minihubObserver = new IntersectionObserver(entries => {
        const oosMsg = $('.js-mhmodal__body-content').data('oosMsg');
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const $entryCard = $(entry.target);
                const $productSelection = $entryCard.find('.js-minihub-embed-pdp');
                const url = $productSelection.data('quickview-url');
                $productSelection.html('');
                $.ajax(url, {
                    success: function (result) {
                        if (!result.error) {
                            $entryCard.addClass('loaded');
                            $productSelection.html(result.renderedTemplate);
                        }
                    },
                    error: function () {
                        $entryCard.find('.g-reward-card_cta-wrapper').remove();
                        $productSelection.html(`<p class="mhmodal__oos-msg">${oosMsg}</p>`);
                        $entryCard.addClass('loaded');
                    }
                });
                minihubObserver.unobserve(entry.target);
            }
        });
    }, options);

    const freeProductcards = document.querySelectorAll('.b-free-product-card');
    freeProductcards.forEach(card => {
        minihubObserver.observe(card);
    });
};

module.exports = {
    init: () => {
        initEmbedApparelReward();
        $(document).on('click', '.js-minihub-action', function () {
            const action = $(this).data('actionType');
            $(document).trigger(action, [{
                el: $(this)
            }]);
        });

        if ($('#minihub-error-handler').length) {
            const { bodyText, title, icon, btnText, btnActionURL = location.href } = JSON.parse($('#minihub-error-handler').val());
            createModal({
                id: 'g-modal-minihub-error',
                bodyText,
                title,
                btnText,
                btnActionURL,
                icon
            });

            $('#g-modal-minihub-error').modal('show');
        }

        $(document).on('minihub:redeem', rewardRedeem);
        $(document).on('minihub:remove', rewardRemove);
    }
};
