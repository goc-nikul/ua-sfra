'use strict';

/**
 *
 * @module controllers/UniformRequest
 */


var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');


server.get('Show', server.middleware.https, csrfProtection.generateToken,
    function (req, res, next) {
        var groupinquiryForm = server.forms.getForm('uniformrequest');
        var inquirySubmit = URLUtils.url('UniformRequest-Submit');
        res.render('uniform/uniformRequest', {
            groupinquiryForm: groupinquiryForm,
            inquirySubmit: inquirySubmit
        });
        next();
    });

server.post(
    'Submit', server.middleware.https, csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var inquiryForm = server.forms.getForm('uniformrequest');
        var groupName = inquiryForm.personalinfo.groupname.value;
        var applicantName = inquiryForm.personalinfo.requestername.value;
        var applicantEmail = inquiryForm.personalinfo.requesteremail.value;
        var applicantMobile = inquiryForm.personalinfo.requesterphone.value;
        var qty = inquiryForm.personalinfo.quantity.value;
        var region = inquiryForm.personalinfo.location.value;

        var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers.js');
        var templateData = {
            TeamName: groupName,
            ApplicantName: applicantName,
            ApplicantEmail: applicantEmail,
            ApplicantMobile: applicantMobile,
            Quantity: qty,
            Region: region
        };
        var recipientEmails = PreferencesUtil.getValue('uniformInquiryEmail');
        var customerServiceEmail = Site.getCurrent().getCustomPreferenceValue('customerServiceEmail');
        var emailData = {
            to: recipientEmails,
            from: customerServiceEmail,
            type: emailHelpers.emailTypes.uniformInquiry
        };

        var emailObj = {
            templateData: templateData,
            emailData: emailData
        };

        require('*/cartridge/modules/providers').get('Email', emailObj).send();

        inquiryForm.clear();

        // next();
        res.json({
            success: true
        });

        return next();
    });

module.exports = server.exports();
