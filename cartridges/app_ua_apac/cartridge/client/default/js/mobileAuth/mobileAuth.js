'use strict';

var mobileAuthWin;
var mobileAuthWinAutoClosed = false;
var clearEarlyAccess = true;
var mobileAuthInitiator = '';

/**
 * Removes login, registration and mobile auth modals
 */
function removeModals() {
    if ($('#mobileAuthModal').length !== 0) {
        $('#mobileAuthModal').remove();
    }
    if ($('#loginModal').length > 0) {
        $('#loginModal').remove();
    }
    if ($('#newUserRegisterModal').length > 0) {
        $('#newUserRegisterModal').remove();
    }
    $('html').removeClass('modal-open');
}

/**
 * Open create account modal
 * @param {Object} $this current element
 */
function getModalHtmlElement() {
    removeModals();
    var htmlString = '<!-- Modal -->'
        + '<div class="modal g-modal g-modal-mobileAuth" id="mobileAuthModal" role="dialog">'
        + '<div class="modal-dialog g-modal-dialog ">'
        + '<!-- Modal content-->'
        + '<div class="modal-content g-modal-content">'
        + '<div class="modal-body g-modal-body"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

/**
 * Closes the popup and the spinner on the window opener
 */
function closeMobileAuthPopup() {
    if (mobileAuthWin && !mobileAuthWin.closed) {
        mobileAuthWinAutoClosed = true;
        mobileAuthWin.close();
        $.spinner().stop();
    }
}

/**
 * Initiate Mobile Authentication
 */
function initiateMobileAuth() {
    // eslint-disable-next-line consistent-return
    $('body').on('click', '.js-init-mobileauth, .js-init-mobileauth-login, .js-account-mobile-update', function (e) {
        e.preventDefault();
        if ($('.register-in-page').length > 0 && $(e.target).hasClass('js-init-mobileauth')) {
            if ($(e.target).closest('#loginModal').length > 0) {
                $('#loginModal').modal('hide');
            }
            return false;
        }
        if ($('.b-order-confirmation').length > 0) {
            if ($(e.target).hasClass('js-init-mobileauth-login')) {
                mobileAuthInitiator = 'login';
            } else {
                mobileAuthInitiator = 'register';
            }
        }
        var url = $(this).data('href');
        getModalHtmlElement();
        $.spinner().start();
        $('body').find('.b-loader').css('z-index', '999');
        var currentPage = !$('.b-order-confirmation').length ? window.location.href : null;
        if ($('.l-pdp').length && window.earlyAccessPid && !(new URLSearchParams(window.location.href).has('earlyAccessPid'))) {
            var eaQty = $('.js-quantity-select').val();
            var currentPageURL;
            if (currentPage.indexOf('#' !== -1)) {
                var noHashURL = currentPage.split('#')[0];
                var hash = currentPage.split('#')[1];
                currentPageURL = new URL(noHashURL);
                currentPageURL.searchParams.set('earlyAccessPid', window.earlyAccessPid);
                currentPageURL.searchParams.set('eaQty', eaQty);
                currentPageURL.searchParams.set('triggerATC', true);
                currentPage = currentPageURL.href + '#' + hash;
            } else {
                currentPageURL = new URL(currentPage);
                currentPageURL.searchParams.set('earlyAccessPid', window.earlyAccessPid);
                currentPageURL.searchParams.set('eaQty', eaQty);
                currentPageURL.searchParams.set('triggerATC', true);
                currentPage = currentPageURL.href;
            }
            window.history.replaceState(null, null, currentPage); // or pushState
        }
        $.ajax({
            url: url,
            data: { format: 'ajax', currentPage: currentPage },
            error: function (err) {
                $.spinner().stop();
                console.log(err);
            },
            success: function (data) {
                $.spinner().stop();
                $('body').find('.modal-backdrop.show').remove();
                $('.modal-body').empty();
                $('.modal-body').html(data);
                if ($('.disableOuterClick').length) {
                    $('#mobileAuthModal').attr('data-backdrop', 'static');
                }
                $('#mobileAuthModal').modal('show');
                $('#mobileAuthModal').next('.modal-backdrop.show').css('z-index', '999');
            }
        });
    });
}

/**
 * Open Mobile Authentication Popup
 */
function openMobileAuthModal() {
    // eslint-disable-next-line consistent-return
    $('body').on('click', '.js-trigger-mobile-auth', function (e) {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            return false;
        }
        if ($('.b-order-confirmation-mobileauth_card').length && $(e.target).closest('.b-order-confirmation').length) {
            $('.b-order-confirmation-mobileauth_card').attr('data-clicked', 'true');
        }
        clearEarlyAccess = false;
        $('#mobileAuthModal').modal('hide');
        $.spinner().start();
        $('body').find('.b-loader').css('z-index', '999');
        var url = $(this).data('href') || $(this).attr('href');
        var centeredPopUp = require('../utils/centeredPopUp');
        mobileAuthWin = centeredPopUp.openPopUp(url, '', 550, 680);
        $(window).on('beforeunload', function () {
            // Close the popup window when the main window is closed
            closeMobileAuthPopup();
            if (mobileAuthWinAutoClosed) {
                $.spinner().stop();
            }
        });

        var checkPopup = setInterval(function () {
            if (mobileAuthWin && mobileAuthWin.closed) {
                if (!mobileAuthWinAutoClosed) {
                    if ($('.b-order-confirmation').length > 0) {
                        if ($('.b-order-confirmation-mobileauth_card').attr('data-clicked') === 'true') {
                            $('.b-order-confirmation-mobileauth_card').attr('data-clicked', 'false');
                            $.spinner().stop();
                        } else if (mobileAuthInitiator === 'login' && $('.b-order-confirmation-mobileauth-url').attr('data-homepage-url')) {
                            window.location.href = $('.b-order-confirmation-mobileauth-url').attr('data-homepage-url');
                        } else if (mobileAuthInitiator === 'register' && $('.b-order-confirmation-mobileauth-url').attr('data-homepage-url-mobileauth')) {
                            window.location.href = $('.b-order-confirmation-mobileauth-url').attr('data-homepage-url-mobileauth');
                        }
                    } else {
                        window.location.reload();
                    }
                } else {
                    $.spinner().stop();
                }
                mobileAuthInitiator = '';
                clearInterval(checkPopup);
            }
        }, 1000);
    }).on('contextmenu', '.js-trigger-mobile-auth', function (e) {
        e.preventDefault();
    });
}

/**
 * Overwrites the values on the registration form with data from NiceID and disables the fields
 * @param {Object} decryptedRetData decrypted Data returned from NiceID
 */
function updateValuesOnConfirmationPage(decryptedRetData) {
    var splitPhone = decryptedRetData.splitPhone.split('-');
    $('.b-order-confirmation_card .phoneMobile1').val(splitPhone[0]);
    $('.b-order-confirmation_card .phoneMobile1').attr('disabled', true);
    $('.b-order-confirmation_card .phoneMobile2').val(splitPhone[1]);
    $('.b-order-confirmation_card .phoneMobile2').attr('readonly', true);
    $('.b-order-confirmation_card .phoneMobile3').val(splitPhone[2]);
    $('.b-order-confirmation_card .phoneMobile3').attr('readonly', true);
    $('.b-order-confirmation_card #birthYear').val(decryptedRetData.birthYear);
    $('.b-order-confirmation_card #birthYear').attr('disabled', true);
    $('.b-order-confirmation_card #birthMonth').val(parseInt(decryptedRetData.birthMonth, 10));
    $('.b-order-confirmation_card #birthMonth').attr('disabled', true);
    $('.b-order-confirmation_card #birthDay').val(parseInt(decryptedRetData.birthDay, 10));
    $('.b-order-confirmation_card #birthDay').attr('disabled', true);
    if (decryptedRetData.gender === '0') {
        $('.b-order-confirmation_card #gender').val('2'); // Setting female gender
    } else {
        $('.b-order-confirmation_card #gender').val(decryptedRetData.gender);
    }
    $('.b-order-confirmation_card #gender').attr('disabled', true);
}

/**
 * Handle message from popup
 */
function handleMessageFromPopup() {
    window.addEventListener('message', function (event) {
        if (event.origin !== window.location.origin) {
            return;
        }
        if (event.data) {
            var messageData = event.data;
            if (messageData.reloadPage) {
                closeMobileAuthPopup(mobileAuthWin);
                window.location.reload();
            } else if (messageData.triggerRegistration) {
                closeMobileAuthPopup(mobileAuthWin);
                removeModals();
                if (messageData.decryptedRetData && $('.b-order-confirmation').length > 0 && $('.b-order-confirmation-mobileauth_card').attr('data-clicked') === 'true') {
                    $('.b-order-confirmation-mobileauth_card').attr('data-clicked', 'false');
                    updateValuesOnConfirmationPage(messageData.decryptedRetData);
                    $('.b-order-confirmation-mobileauth_card').addClass('d-none');
                    $('.b-order-confirmation_account .b-order-confirmation_card').removeClass('d-none');
                } else {
                    $('.b-header_account-link.js-register').eq(0).trigger('click');
                }
            } else if (messageData.containerHTML) {
                closeMobileAuthPopup(mobileAuthWin);
                getModalHtmlElement();
                $('body').find('.modal-backdrop.show').remove();
                $('.modal-body').empty();
                $('.modal-body').html(messageData.containerHTML);
                if (messageData.disableOuterClose) {
                    $('#mobileAuthModal').attr('data-backdrop', 'static');
                }
                $('#mobileAuthModal').modal('show');
                $('#mobileAuthModal').next('.modal-backdrop.show').css('z-index', '999');
            }
        }
    });
}

/**
 * Handles buttons for mobile authentication completion popup
 */
function handleCompleteAuthPopup() {
    $('body').on('click', '.js-complete-mobileauth, .js-cancel-mobileauth', function (e) {
        e.preventDefault();
        var requestData = {
            format: 'ajax'
        };
        if ($(e.target).hasClass('js-complete-mobileauth')) {
            var $requiredCheckbox = $('#mobile-auth-update-checkbox');
            if (!$requiredCheckbox.is(':checked')) {
                $requiredCheckbox.closest('.form-group').find('.invalid-feedback').html($requiredCheckbox.data('missing-error'));
                return;
            }
            if ($('#add-to-addsmsto-list').length) {
                requestData.smsOptIn = $('#add-to-addsmsto-list').is(':checked');
            }
        }
        $.ajax({
            url: $(this).data('href'),
            type: 'POST',
            data: requestData,
            error: function (err) {
                console.log(err);
            },
            success: function (data) {
                if (data.success) {
                    window.location.reload();
                }
            }
        });
    });
}

/**
 * Open mobile auth popup on page load
 */
function initiateMobileAuthOnPageLoad() {
    var homepagePendingMobileAuth = $('input[name="initiateMobileAuth"]').val() === 'true' && $('.js-login').length === 0 && $('.js-header-mobileauth-pending').length > 0;
    if (homepagePendingMobileAuth || ($('.l-pdp').length && $('.pdp-mobile-auth').length && $('.pdp-mobile-auth').attr('data-mobileauth-enabled') === 'true' && $('.pdp-mobile-auth').attr('data-mobileauth-pending') === 'true')) {
        $('.js-init-mobileauth-login').eq(0).trigger('click');
    }
}

/**
 * Removes early access window variables and search parameters when mobile auth modal is closed
 */
function clearEarlyAccessSelections() {
    $('body').on('hidden.bs.modal', '#mobileAuthModal', function () {
        if ($('#mobileAuthModal').find('.mobile-auth-duplicate').length !== 0) {
            clearEarlyAccess = false;
        }
        if ($('.l-pdp').length > 0 && (!mobileAuthWin || mobileAuthWin.closed) && clearEarlyAccess === true) {
            var urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('triggerATC') || urlParams.has('earlyAccessPid')) {
                urlParams.delete('earlyAccessPid');
                urlParams.delete('triggerATC');
                urlParams.delete('eaQty');
                delete window.earlyAccessPid;
                var url = window.location.pathname + '?' + urlParams.toString();
                history.replaceState({}, '', url);
            }
        }
        clearEarlyAccess = true;
    });
}

module.exports = {
    initiateMobileAuth: initiateMobileAuth,
    openMobileAuthModal: openMobileAuthModal,
    handleMessageFromPopup: handleMessageFromPopup,
    handleCompleteAuthPopup: handleCompleteAuthPopup,
    initiateMobileAuthOnPageLoad: initiateMobileAuthOnPageLoad,
    clearEarlyAccessSelections: clearEarlyAccessSelections
};
