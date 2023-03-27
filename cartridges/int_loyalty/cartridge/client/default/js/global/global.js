'use strict';
const { createModal, fillModalBody, handleEnrollError } = require('int_loyalty/components/helpers');

const showZipCheckModal = () => {
    const loadModalBody = $('#loyalty-ingrid-url').val();
    createModal({
        id: 'gatingModal'
    });

    fillModalBody({
        url: loadModalBody,
        el: '.content-wrapper'
    });
    $('#gatingModal').modal('show');
};

module.exports = {
    init: function () {
        $('body').on('loyalty:showZipCheckModal', showZipCheckModal);
        handleEnrollError();

        // Registration modal email sign up with loyalty enroll
        $('body').on('change', '.loyalty-enroll--js', (e) => {
            const emailMarketingInput = $('.g-checkbox_loyalty-hide #add-to-email-list');

            if (emailMarketingInput) {
                $(emailMarketingInput).prop('checked', e.target.checked);
            }
        });

        $('.js-open-checkout-qualtrics').on('click', (e) => {
            if (window.matchMedia('(max-width: 1024px)').matches) {// eslint-disable-line
                e.preventDefault();
                $('#qualtricsCheckoutModal').modal('show');
            }
        });
    }
};
