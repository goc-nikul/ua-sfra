'use strict';

$(document).ready(function () {
    var groupNumber = $('.js-bsgroupNumber').val();
    var profileData = $('.js-bookaSession').val();
    var customerData = {};
    if (profileData) {
        customerData = JSON.parse(profileData);
    }
    window.Brauz.initializeBrauzBookAStylist(groupNumber);
    var el = document.getElementById('book-an-appointment');
    if (el) {
        el.addEventListener('click', function () {
            window.Brauz_open_book_a_stylist_dialog(); // eslint-disable-line
        });
    }

    // 5. Pre-fill customer info into the form (if needed)
    window.Brauz_book_a_stylist_customer_data = {
        first_name: customerData.firstName ? customerData.firstName : '',
        last_name: customerData.lastName ? customerData.lastName : '',
        email: customerData.email ? customerData.email : '',
        phone: customerData.phone ? customerData.phone : ''
    };
});
