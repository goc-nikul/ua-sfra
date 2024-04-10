'use strict';

var clientSideValidation = require('../components/common/clientSideValidation');
var util = require('org/util');
const consents = require('../consent/consents');

/**
 * Set Email domain value from Domain Selector
 */
function setEmailDomain() {
    $('body').on('change', '.emailaddressDomainSelect', function () {
        var domainVal = $(this).val();
        var isReadOnly = domainVal !== '';
        var $domainField = $(this).closest('form').find('.emailaddressDomain');

        $domainField.prop({ readOnly: isReadOnly }).val(domainVal);
        $domainField.trigger('blur');
    }).on('change', '.emailAddressDomainSelectConfirm', function () {
        var domainVal = $(this).val();
        var isReadOnly = domainVal !== '';
        var $domainField = $(this).closest('form').find('.emailAddressDomainConfirm');

        $domainField.prop({ readOnly: isReadOnly }).val(domainVal);
        $domainField.trigger('blur');
    }).on('change', '.billingEmailaddressDomainSelect', function () {
        var domainVal = $(this).val();
        var isReadOnly = domainVal !== '';
        var $domainField = $(this).closest('form').find('.billingEmailaddressDomain');

        $domainField.prop({ readOnly: isReadOnly }).val(domainVal);
        $domainField.trigger('blur');
    })
    .on('change', '.emailaddressDomainSelect2', function () {
        var domainVal = $(this).val();
        var isReadOnly = domainVal !== '';
        var $domainField = $(this).closest('form').find('.contactEmailaddressDomain');

        $domainField.prop({ readOnly: isReadOnly }).val(domainVal);
        $domainField.trigger('blur');
    });
}

/**
 * Get cookie value by cookie name from browser
 * @param {string} cookieName - name of the cookie
 * @returns {string} cookie value of the found cookie name
 */
function getCookie(cookieName) {
    var name = cookieName + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieArray = decodedCookie.split(';');
    for (var i = 0; i < cookieArray.length; i++) {
        var cookieItem = cookieArray[i];
        while (cookieItem.charAt(0) === ' ') {
            cookieItem = cookieItem.substring(1);
        }
        if (cookieItem.indexOf(name) === 0) {
            return cookieItem.substring(name.length, cookieItem.length);
        }
    }
    return '';
}

/**
 * sets the 'registered' cookie
 */
function setRegisteredCookie() {
    var d = new Date();
    d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
    var expires = 'expires=' + d.toGMTString();

    document.cookie = `showRegisteredModal=true; ${expires}; secure='on'; path=/;`;
}

/**
 * deletes the 'registered' cookie
 */
function deleteRegisteredCookie() {
    var d = new Date();
    d.setTime(d.getTime() + (0 * 24 * 60 * 60 * 1000));
    var expires = 'expires=' + d.toGMTString();

    document.cookie = `showRegisteredModal=false; ${expires}; secure='on'; path=/;`;
}

/**
 * Open create account modal
 * @param {Object} $this current element
 */
function getModalHtmlElement() {
    if ($('#newUserRegisterModal').length !== 0) {
        $('#newUserRegisterModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal g-modal g-modal-registerUser" id="newUserRegisterModal" role="dialog">'
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
 * handles create account submission ajax
 * @param {Object} form create account form
 * @param {boolean} membersonEnabled is memberson enabled
 * @param {string} membersonSearchResponse search response of email and mobile in memberson
 */
function handleCreateAccountSubmission(form, membersonEnabled, membersonSearchResponse) {
    var url = form.attr('action');
    var type = form.attr('method');
    var formdata = form.serialize();

    if (membersonEnabled && typeof membersonSearchResponse !== 'undefined') {
        formdata += '&membersonSearchResponse=' + membersonSearchResponse;
    }

    if ($('.l-pdp').length > 0 && window.memberPricePid) {
        formdata += '&memberPricePid=' + window.memberPricePid;
    }

    $.ajax({
        url: url,
        type: type,
        data: formdata,
        success: function (data) {
            form.spinner().stop();
            if (!data.success) {
                if (data.invalidForm) {
                    $('.js-createaccount-button').removeAttr('disabled');
                    var formValidation = require('base/components/formValidation');
                    formValidation(form, data);
                    form.trigger('login:error', data);
                } else {
                    $('.b-registration-error').removeClass('hide');
                    var errorMsg = $('[data-analytics-track="error-span"]').text().trim() + ' ' + $('[data-analytics-track="error-link"]').text().trim();
                    $('body').trigger('register:error', { errorMsg: errorMsg });
                }
                $('input[name="initializeRegisterForm"]').val(false);
                $('.js-createaccount-button').removeAttr('disabled');
            } else if (data.validationEmailMessage) {
                $('.js-createaccount-button').removeAttr('disabled');
                $('#newUserRegisterModal').find('#register').html(data.validationEmailMessage);
                $('#newUserRegisterModal').find('.free-shipping-promotion').addClass('d-none');
            } else {
                form.trigger('login:success', data);
                $('body').trigger('register:success:analytics', {
                    customerNo: data && data.customerNo,
                    addToEmailList: data && data.addToEmailList,
                    email: form.find('[name="dwfrm_profile_customer_email"]').val()
                });

                if ($('.l-pdp').length > 0 && window.memberPricePid && data.memberPriceModalContent) {
                    window.keepMemberPricingVar = true;
                    $('#newUserRegisterModal').modal('hide');
                    $('body').trigger('memberpricing:successpopup', {
                        memberPriceModalContent: data.memberPriceModalContent
                    });
                    return;
                }

                if ('loyaltyGatedModal' in data) {
                    $('body').trigger('loyalty:enroll', {
                        type: 'genericLink',
                        loyalty: data.loyaltyGatedModal,
                        action: data.loyaltyGatedModal ? 'joined-yes' : 'joined-no',
                        member: 'new_member',
                        points_earned: 0
                    });
                }
                if (data.shouldRedirect || $('.js-login-in-page').length > 0 || $('.b-order-confirmation').length > 0 || 'loyaltyGatedModal' in data) {
                    location.href = data.redirectUrl;
                } else if ($('.register-in-page').length > 0) {
                    setRegisteredCookie();
                    location.href = data.redirectUrl;
                } else {
                    setRegisteredCookie();
                    window.location.reload();
                }
            }
        },
        error: function (data) {
            $('.js-createaccount-button').removeAttr('disabled');
            if (data.responseJSON.redirectUrl) {
                window.location.href = data.responseJSON.redirectUrl;
            } else {
                $('form.login').trigger('login:error', data);
                form.spinner().stop();
            }
        }
    });
}

/**
 * Populate the days present in a month
 * @param {string} parentSelector - finding the days
 * @param {Object} month ID - passing the month ID
 */

function getKeyByValue(object, value) { // eslint-disable-line
    for (var prop in object) { // eslint-disable-line
        if (prop === value) {
            return object[prop];
        }
    }
}

/**
 * Function to show number of days according to the month selected.
 */
function updateDays() {
    $('body').on('change', 'select[name $= "customer_birthMonth"]', function () {
        var monthCode = $(this).val();
        var arrayHtml = '';
        const obj = { 1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 }; // eslint-disable-line

        var days = getKeyByValue(obj, monthCode);
        for (var i = 0; i <= days; i++) { // eslint-disable-line
            if (i === 0) {
                arrayHtml += '<option value=""> Select </option>';
            } else {
                arrayHtml += '<option value="' + i + '">' + i + '</option>';
            }
        }
        $('.b-day-select').empty();
        $('.b-day-select').append(arrayHtml);
    });
}

/**
 * On Submitting login on modal
 */
function submitCreateAccount() {
    $('body').find('.js-createaccount-button').off('click').on('click', function (e) {
        e.preventDefault();
        $('.b-registration-error').addClass('hide');
        if ($('.b-memberson-error').length) {
            $('.b-memberson-error').addClass('hide');
        }
        var form = $(this).closest('form');
        var registerForm = $('input[name="initializeRegisterForm"]');
        var inputFeedback = $(this).parents().find('#form-password-rules');
        inputFeedback.hide();
        form.spinner().start();

        if (clientSideValidation.checkPasswordContainsEmail(form) === false) {
            clientSideValidation.checkMandatoryField(form);
            clientSideValidation.validateMinimumAgeRestriction(form);
        }

        if (!form.find('input.is-invalid, select.is-invalid').length && (registerForm.length > 0 ? registerForm.val() === 'false' : true)) {
            registerForm.val(true);
            if (form.data('membersonenabled') === true && $('.memberson-underarmour-employee').length && $('.memberson-underarmour-employee').data('eligible-loyalty') === true) {
                var membersonUrl = form.data('membersonurl');
                var email = form.find('#registration-form-email').val();
                var mobile = form.find('#phone').val();
                var mobileCountryCode = form.find('#countryDialingCode').val();
                var birthMonth = form.find('#birthMonth').val();
                var birthYear = form.find('#birthYear').val();

                var membersonData = {
                    email: email,
                    mobile: mobile,
                    birthMonth: birthMonth,
                    birthYear: birthYear,
                    mobileCountryCode: mobileCountryCode
                };
                $('.js-createaccount-button').attr('disabled', true);

                $.ajax({
                    url: membersonUrl,
                    type: 'POST',
                    data: membersonData,
                    success: function (data) {
                        if (!data.success) {
                            $('.js-createaccount-button').removeAttr('disabled');
                            if (data.searchResponse && data.searchResponse.errorMessage) {
                                $('.b-memberson-error').html(data.searchResponse.errorMessage);
                                $('.b-memberson-error').removeClass('hide');
                            } else if (data.invalidForm) {
                                var formValidation = require('base/components/formValidation');
                                formValidation(form, data);
                                form.trigger('login:error', data);
                            } else {
                                $('.b-registration-error').removeClass('hide');
                            }
                            var errorMsg = $('[data-analytics-track="error-span"]').text().trim() + ' ' + $('[data-analytics-track="error-link"]').text().trim();
                            $('body').trigger('register:error', { errorMsg: errorMsg });
                        } else if (data.searchResponse) {
                            handleCreateAccountSubmission(form, true, JSON.stringify(data.searchResponse));
                        }
                    },
                    error: function () {
                        $('.js-createaccount-button').removeAttr('disabled');
                        $('.b-registration-error').removeClass('hide');
                        var errorMsg = $('[data-analytics-track="error-span"]').text().trim() + ' ' + $('[data-analytics-track="error-link"]').text().trim();
                        $('body').trigger('register:error', { errorMsg: errorMsg });
                    }
                });
            } else {
                $('.js-createaccount-button').attr('disabled', true);
                handleCreateAccountSubmission(form, false);
            }
        }
        form.spinner().stop();
        return false;
    });
}

/**
 * Events after open modal
 */
function registerCreateAccountEvents() {
    $('body').on('login:afterCreateAccountModal', function () {
        submitCreateAccount();
    });
}

/**
 * @param {Object} $this current element
 * request to render the create acccount modal
 */
function openCreateAccount($this) {
    $.spinner().start();
    $('body').find('.b-loader').css('z-index', '999');
    var naverRedirectURL = !$('.b-order-confirmation').length ? window.location.href : null;
    $.ajax({
        url: $this.data('href') || $this.attr('href'),
        data: { format: 'ajax', naverRedirectURL: naverRedirectURL },
        error: function (err) {
            $.spinner().stop();
            console.log(err);
        },
        success: function (data) {
            $.spinner().stop();
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
                return;
            }
            $('body').find('.modal-backdrop.show').remove();
            $('.modal-body').empty();
            $('.modal-body').html(data);
            // Handle NaverSSO Error
            if ($('input[name="showNaverValidationMessage"]').length && $('input[name="showNaverValidationMessage"]').val() !== '') {
                var naverValidateRes = $('input[name="showNaverValidationMessage"]').val();
                // Handle NaverSSO Error
                $('<div class="validateMsg invalid-feedback"><p>' + naverValidateRes + '</p></div>').prependTo('#newUserRegisterModal .g-modal-content');
                $('input[name="showNaverValidationMessage"]').val('');
            }
            if ($('span#mobileauth-register').length && $('#mobileauth-register').attr('data-mobileauth-enabled') === 'true') {
                $('#newUserRegisterModal').attr('data-backdrop', 'static');
            }
            $('body').trigger('login:afterCreateAccountModal');
            util.branchCloseJourney();
            $('#newUserRegisterModal').modal('show');
            $('body').trigger('modalShown', { name: 'register' });
            $('#newUserRegisterModal').next('.modal-backdrop.show').css('z-index', '999');
        }
    });
}


/**
 * Register event to open create account modal
 */
function openCreateAccountModal() {
    $('body').on('click', '.js-register', function (e) {
        e.preventDefault();
        $('#newUserRegisterModal').remove();
        if ($('#loginModal').length > 0) {
            $('html').removeClass('modal-open');
            $('#loginModal').remove();
        }
        if ($(this).closest('.js-login-page').length > 0) {
            var loginUrl = $(this).attr('data-href');
            window.location.href = loginUrl;
            return false;
        } else if ($('.js-register-in-page').length > 0) {
            return false;
        }
        getModalHtmlElement();
        openCreateAccount($(this));
        return true;
    });
}

/**
 * Register event to open account created modal
 */
function openAccountCreatedModal() {
    $(document).ready(function () {
        if (getCookie('showRegisteredModal') === 'true') {
            if ($('#userRegisteredModal').length !== 0) {
                $('#userRegisteredModal').remove();
            }
            var htmlString = '<!-- Modal -->'
                + '<div class="modal g-modal g-modal-userRegistered" id="userRegisteredModal" role="dialog">'
                + '<div class="modal-dialog g-modal-dialog ">'
                + '<!-- Modal content-->'
                + '<div class="modal-content g-modal-content g-modal-content-user-registered">'
                + '<div class="modal-body g-modal-body"></div>'
                + '</div>'
                + '</div>'
                + '</div>';
            $('body').append(htmlString);

            $.spinner().start();
            $('body').find('.b-loader').css('z-index', '999');

            $.ajax({
                url: $('#account-created-modal-url').val(),
                method: 'GET',
                error: function () {
                    $.spinner().stop();
                },
                success: function (data) {
                    $.spinner().stop();
                    deleteRegisteredCookie();
                    $('body').find('.modal-backdrop.show').remove();
                    $('body').addClass('m-no-scroll');
                    $('.modal-body').empty();
                    $('.modal-body').html(data);
                    $('#userRegisteredModal').modal('show');
                    $('body').trigger('modalShown', { name: 'registered' });
                    $('#userRegisteredModal').next('.modal-backdrop.show').css('z-index', '999');
                }
            });
        }
    });

    $('body').on('click', '.continue-shopping-container, .g-registered-modal-close_button', function (e) {
        e.preventDefault();
        $('#userRegisteredModal').modal('hide');
        $('body').removeClass('m-no-scroll');
    });
}
/**
 * Register event consecutive space validator
 */
function consecutiveSpaceValidator() {
    var counter = 0;
    $('body').on('keydown', '#registration-form-email, #registration-form-password', function (e) {
        if (e.which === 32 || e.keyCode === 32) {
            counter += 1;
            if (counter > 1) {
                e.preventDefault();
            }
        } else {
            counter = 0;
        }
    });
}

/**
 * validate email for underarmour employees
 */
function isEligibleForLoyalty() {
    $('body').on('change', '#registration-form-email', function () {
        var email = $(this).val();
        if (email.endsWith('@underarmour.com')) {
            $('.memberson-underarmour-employee').removeClass('d-none');
            $('.memberson-underarmour-employee').data('eligible-loyalty', false);
        } else {
            $('.memberson-underarmour-employee').addClass('d-none');
            $('.memberson-underarmour-employee').data('eligible-loyalty', true);
        }
    });
}

/**
 * Open register popup if page redirect from header section
 */
function openRegisterOnPageLoad() {
    if ($('input[name="showRegisterModal"]').val() === 'true') {
        if ($('.b-header_account-link.js-init-mobileauth').length > 0) {
            $('.b-header_account-link.js-init-mobileauth').eq(0).trigger('click');
        } else {
            $('.b-header_account-link.js-register').trigger('click');
        }
    }
}

module.exports = {
    consentModal: consents.consentClickmodal(),
    registerCreateAccountEvents: registerCreateAccountEvents,
    openCreateAccountModal: openCreateAccountModal,
    openAccountCreatedModal: openAccountCreatedModal,
    updateDays: updateDays,
    consecutiveSpaceValidator: consecutiveSpaceValidator,
    openRegisterOnPageLoad: openRegisterOnPageLoad,
    isEligibleForLoyalty: isEligibleForLoyalty,
    setEmailDomain: setEmailDomain,
    submitCreateAccount: submitCreateAccount
};
