'use strict';

const { createModal, fillModalBody } = require('./helpers');

/**
 * fireEventLoyaltyEnroll - trigger uaDataLayer on success enrollment to loyalty for new customer
 * @param {boolean} modalStatus - boolean value for the loyaltyGatedModal url param
 * @param {string} memberStatus - string value for the member url param
 */
const fireEventLoyaltyEnroll = ({ modalStatus, memberStatus }) => {
    $('body').trigger('loyalty:enroll', {
        type: 'modalOpened',
        loyalty: modalStatus,
        action: modalStatus ? 'joined-yes' : 'joined-no',
        member: memberStatus,
        points_earned: 0
    });
};

/**
 * renderLoyaltySuccessModal - helper function to render success modal
 */
const renderLoyaltySuccessModal = ({ params }) => {
    const modalurl = $('#gated-enrollment-url').val() + params;
    $.get(modalurl, function (data) {
        $('body').append(data);
        $('#loyalty-enrolled-success').modal('show');
    });
};

/**
 * appendSearchParamsToHref - append channel params to Login/Registration URL
 * @param {el} el - Element Object
 */
function appendSearchParamsToHref(el) {
    const $el = $(el);
    if (!$el.length) { return; }
    const elURL = new URL($(el).data('href'));
    const windowParams = new URLSearchParams(window.location.search);
    const neededParams = ['channel', 'subChannel', 'subChannelDetail'];
    neededParams.forEach((i) => {
        const val = windowParams.get(i);
        if (i && val) {
            elURL.searchParams.set(i, val);
        }
    });
    $(el).data('href', elURL.toString());
}

/**
 * showGatedEnrollModal - helper function to render Loyalty Success Modal if url param `loyaltyGatedModal` exist
 */
const showGatedEnrollModal = () => {
    const url = new URL(location.href);
    const modalStatus = url.searchParams.get('loyaltyGatedModal');
    const enrollFailed = url.searchParams.get('enrollFailed');
    if (enrollFailed && enrollFailed === 'true') return;

    switch (modalStatus) {
        case 'true': {
            const memberStatus = url.searchParams.get('member');
            renderLoyaltySuccessModal({
                params: url.search
            });
            // setTimeout required for delay before event handler bound
            setTimeout(() => {
                fireEventLoyaltyEnroll({
                    modalStatus,
                    memberStatus
                });
            }, 300);
            break;
        }
        case 'false': {
            const modalID = 'loyalty-gated-enroll-repeat';
            url.searchParams.set('enrollRepeat', true);
            createModal({
                id: modalID,
                className: 'g-modal-loyalty-enroll-repeat',
                targetClass: 'b-gated-enrollment'
            });
            fillModalBody({
                url: $('#gated-enrollment-url').val() + url.search,
                el: '#gated-enrollment-form'
            });
            $('#' + modalID).modal('show');
            break;
        }
        default:
            break;
    }
};

/**
 * gatedEnrollmentSubmit - handle AJAX gatted enrollement form submit
 * @param {Event} e - Event Object
 */
const gatedEnrollmentSubmit = (e) => {
    e.preventDefault();
    const $enrollmentWrapper = $('.b-gated-enrollment');
    const $formEnroll = $(e.target);
    const url = $formEnroll.attr('action');

    // Exit if invalid
    if ($formEnroll.find('.is-invalid').length) {
        return;
    }

    $formEnroll.spinner().start();
    if ($('input[name$=_pilotCheck_postalCode]').length === 0) {
        $('body').trigger('loyalty:enroll', {
            type: 'genericLink',
            loyalty: true,
            action: 'joined-yes',
            member: 'current_member',
            points_earned: 0
        });
    } else {
        $('body').trigger('loyalty:pilot:zipcode', { zipCode: $('input[name$=_pilotCheck_postalCode]').val() });
    }

    $.ajax({
        url: url,
        type: 'post',
        data: $formEnroll.serialize(),
        success: function (data) {
            $formEnroll.spinner().stop();
            if (!data.success) {
                if (data.errorModal) {
                    const { title, msg, btnText } = data;
                    const currentURL = new URL(location.href);
                    currentURL.searchParams.delete('enrollFailed');
                    createModal({
                        id: 'enroll-error-modal',
                        bodyText: msg,
                        title,
                        btnText,
                        btnActionURL: currentURL
                    });
                    $('#enroll-error-modal').modal('show');
                }
            } else {
                if ('userEnrolled' in data) {
                    const userEnrolledURL = new URL(location.href);
                    userEnrolledURL.search = new URLSearchParams({
                        loyaltyGatedModal: 'true',
                        alreadyEnrolled: 'true'
                    });
                    renderLoyaltySuccessModal({
                        params: userEnrolledURL.search
                    });

                    return;
                }
                $enrollmentWrapper.html(data.template);
                appendSearchParamsToHref('.b-gated-enrollment .js-login');
                appendSearchParamsToHref('.b-gated-enrollment .js-register');
            }
        },
        error: function (err) {
            $formEnroll.spinner().stop();
            if (err.responseJSON.redirectUrl) {
                location.href = err.responseJSON.redirectUrl;
            }
        }
    });
};

/**
 * gatedWaitlistSubmit - handle AJAX gatted wait list form submit
 * @param {Event} e - Event Object
 */
const gatedWaitlistSubmit = (e) => {
    e.preventDefault();
    const formValidation = require('base/components/formValidation');
    const $enrollmentWrapper = $('.b-gated-enrollment');
    const $formWaitlist = $(e.target);
    const url = $formWaitlist.attr('action');

    // Exit if invalid
    if ($formWaitlist.find('.is-invalid').length) {
        return;
    }

    $formWaitlist.spinner().start();

    $.ajax({
        url: url,
        type: 'post',
        data: $formWaitlist.serialize(),
        success: function (data) {
            $formWaitlist.spinner().stop();
            if (!data.success) {
                formValidation($formWaitlist, data);
                $formWaitlist.find('.form-group').addClass('error-field');

                if (data.errorModal) {
                    const { title, msg, btnText } = data;
                    createModal({
                        id: 'waitlist-error-modal',
                        bodyText: msg,
                        title,
                        btnText,
                        btnActionURL: location.href
                    });
                    $('#waitlist-error-modal').modal('show');
                }
            } else {
                $enrollmentWrapper.html(data.template);
            }
        },
        error: function (err) {
            $formWaitlist.spinner().stop();
            if (err.responseJSON.redirectUrl) {
                location.href = err.responseJSON.redirectUrl;
            }
        }
    });
};

module.exports = {
    init: function () {
        $(document).on('submit', '#gated-enrollment-form', gatedEnrollmentSubmit);
        $(document).on('submit', '#gated-waitlist-form', gatedWaitlistSubmit);
        showGatedEnrollModal();

        // Delegate blur event for ajaxed in form
        const checkMandatoryField = require('org/components/common/clientSideValidation').checkMandatoryField;
        $('body').on('blur', '#gated-enrollment-form, #gated-waitlist-form', function () {
            checkMandatoryField($(this));
        });
    }
};
