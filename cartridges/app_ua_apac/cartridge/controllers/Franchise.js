'use strict';

/**
 *
 * @module controllers/Franchise
 */


var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

server.get('Show', server.middleware.https, csrfProtection.generateToken,
    function (req, res, next) {
        var daumAddressLookupEnabled = require('*/cartridge/config/preferences').isDaumAddressLookupEnabled;
        var franchiseinquiry = server.forms.getForm('franchise');
        var franchiseSubmit = URLUtils.url('Franchise-Submit');
        res.render('franchise/franchise', {
            franchiseinquiry: franchiseinquiry,
            franchiseSubmit: franchiseSubmit,
            daumAddressLookupEnabled: daumAddressLookupEnabled
        });
        next();
    });

server.post(
    'Submit', server.middleware.https, csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var franchiseForm = server.forms.getForm('franchise');
        var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers.js');
        var templateData = {

            Email_Address: franchiseForm.storeinquiry.email.value,
            Name: franchiseForm.storeinquiry.name.value,
            Mobile_number: franchiseForm.storeinquiry.phone.value,
            dateofbirth: franchiseForm.storeinquiry.dob.value,
            Postal_Code: franchiseForm.storeinquiry.postalCode.value,
            Address_line1: franchiseForm.storeinquiry.address1.value,
            Address_line2: franchiseForm.storeinquiry.address2.value,
            Sales_Square_Pyeong: franchiseForm.storeinquiry.sellingspace.value,
            Warehouse_acreage_pyeong: franchiseForm.storeinquiry.storagespace.value,
            Front_M: franchiseForm.storeinquiry.frontwidth.value,
            Height_m: franchiseForm.storeinquiry.height.value,
            Parking_Availability: franchiseForm.storeinquiry.parking.value,
            Number_of_floors: franchiseForm.storeinquiry.stories.value,
            Lease_Lease_Classification: franchiseForm.storeinquiry.lease.value,
            Deposit_won: franchiseForm.storeinquiry.deposit.value,
            Rights_won: franchiseForm.storeinquiry.premium.value,
            Monthly_Rent_won: franchiseForm.storeinquiry.rent.value,
            Management_fee_won: franchiseForm.storeinquiry.maintenance.value
        };
        var recipientEmails = PreferencesUtil.getValue('franchiseInquiryEmail');
        var customerServiceEmail = Site.getCurrent().getCustomPreferenceValue('customerServiceEmail');
        var emailData = {
            to: recipientEmails,
            from: customerServiceEmail,
            type: emailHelpers.emailTypes.franchiseInquiry
        };

        var emailObj = {
            templateData: templateData,
            emailData: emailData
        };

        require('*/cartridge/modules/providers').get('Email', emailObj).send();

        franchiseForm.clear();

        res.json({
            success: true
        });


        return next();
    });

module.exports = server.exports();
