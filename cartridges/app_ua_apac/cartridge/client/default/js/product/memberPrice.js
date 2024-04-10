'use strict';

var util = require('org/util');

/**
 * Creates Member Pricing Modal
 */
function getMemberPricingModalDiv() {
    if ($('#memberPricingModal').length) {
        $('#memberPricingModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal g-modal g-modal-memberpricing" id="memberPricingModal" role="dialog" data-backdrop="static">'
        + '<div class="modal-dialog g-modal-dialog ">'
        + '<!-- Modal content-->'
        + '<div class="modal-content g-modal-content">'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

/**
 * Triggered when Unlock Access CTA is clicked. Will load a popup
 */
function onAddMemberPriceProduct() {
    $('body').on('memberpricing:unlock', function (e, data) {
        if (data.pid && $('.member-price-guest-modal-content').length) {
            var pid = data.pid;
            window.memberPricePid = pid;
            $.spinner().stop();
            $('.l-pdp.product-detail .b-add_to_bag').spinner().stop();
            $('.l-pdp.product-detail .js-add-to-cart').text($('.js-add-to-cart').attr('data-memberpricing-text'));
            getMemberPricingModalDiv();
            $('body').find('.modal-backdrop.show').remove();
            $('#memberPricingModal .g-modal-content').empty();
            $('#memberPricingModal .g-modal-content').html($('.member-price-guest-modal-content').html());
            $('#memberPricingModal').modal('show');
            $('#memberPricingModal').next('.modal-backdrop.show').css('z-index', '999');
        }
    });
}

/**
 * Triggered after login/registration. Shows success popup for each.
 */
function onSuccessLoginRegister() {
    $('body').on('memberpricing:successpopup', function (e, data) {
        if (data.memberPriceModalContent) {
            getMemberPricingModalDiv();
            $('body').find('.modal-backdrop.show').remove();
            $('#memberPricingModal .g-modal-content').empty();
            $('#memberPricingModal .g-modal-content').html(data.memberPriceModalContent);
            $('#memberPricingModal').modal('show');
            $('#memberPricingModal').next('.modal-backdrop.show').css('z-index', '999');
        }
    });
}

/**
 * Handle Guest popup buttons
 */
function handleGuestPopupButtons() {
    $('body').on('click', '#memberPricingModal .member-pricing-buttons a', function (e) {
        e.preventDefault();
        var $target = $(e.target);
        if ($target.hasClass('js-member-cta-register')) {
            $('.js-register').eq(0).trigger('click');
        } else if ($target.hasClass('js-member-cta-login')) {
            $('.js-login').eq(0).trigger('click');
        } else if ($target.hasClass('js-add-without-memberprice')) {
            window.memberPriceATC = true;
            delete window.memberPricePid;
            $('.l-pdp.product-detail .b-product_actions-inner .js-add-to-cart').trigger('click');
        }
        window.keepMemberPricingVar = true;
        $('#memberPricingModal').modal('hide');
    });
}

/**
 * Handle success popup buttons
 */
function handleSuccessPopupButtons() {
    $('body').on('click', '#memberPricingModal .member-pricing-success-buttons a', function (e) {
        e.preventDefault();
        var $target = $(e.target);
        if ($target.hasClass('js-login-register-success')) {
            if ($('body').find('#memberPricingModal .member-pricing-eligible').length && $('body').find('#memberPricingModal .member-pricing-eligible').attr('data-eligible') === 'false') {
                var currentPage = window.location.href;
                currentPage = util.appendParamsToUrl(currentPage, { memberPriceIneligible: true });
                history.replaceState({}, '', currentPage);
            }
            window.location.reload();
        }
    });
}

/**
 * Displays guest/ineligible popup on page load if query param exists
 */
function displayPopupOnPageLoad() {
    if ($('.l-pdp').length > 0 && $('.js-login').length === 0) {
        $(window).on('load', function () {
            var urlParams = new URLSearchParams(window.location.search);
            if ($('#consentPopUpModal').length === 0 && (urlParams.has('memberPriceLoginPopup') || urlParams.has('memberPriceIneligible'))) {
                getMemberPricingModalDiv();
                $('body').find('.modal-backdrop.show').remove();
                $('#memberPricingModal .g-modal-content').empty();
                if (urlParams.has('memberPriceLoginPopup') && $('.member-price-login-modal-content').length > 0) {
                    $('#memberPricingModal .g-modal-content').html($('.member-price-login-modal-content').html());
                } else if (urlParams.has('memberPriceIneligible') && $('.member-price-ineligible-modal-content').length > 0) {
                    $('#memberPricingModal .g-modal-content').html($('.member-price-ineligible-modal-content').html());
                }
                $('#memberPricingModal').modal('show');
                $('#memberPricingModal').next('.modal-backdrop.show').css('z-index', '999');
                urlParams.delete('memberPriceIneligible');
                urlParams.delete('memberPriceLoginPopup');
                history.replaceState({}, '', window.location.pathname + '?' + urlParams.toString());
            }
        });
    }
}

/**
 * Handles window variable if login, registration or member pricing modals are closed
 */
function onPopupClose() {
    $('body').on('hidden.bs.modal', '#loginModal, #newUserRegisterModal, #memberPricingModal', function () {
        if ($('.l-pdp').length > 0 && window.memberPricePid) {
            if (window.keepMemberPricingVar) {
                delete window.keepMemberPricingVar;
            } else {
                delete window.memberPricePid;
            }
        }
    });
}

module.exports = {
    onAddMemberPriceProduct: onAddMemberPriceProduct,
    onSuccessLoginRegister: onSuccessLoginRegister,
    handleGuestPopupButtons: handleGuestPopupButtons,
    handleSuccessPopupButtons: handleSuccessPopupButtons,
    displayPopupOnPageLoad: displayPopupOnPageLoad,
    onPopupClose: onPopupClose
};
