'use strict';

var server = require('server');
/* Script Modules */
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get('Show', server.middleware.https, csrfProtection.generateToken, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var customerNo = req.querystring.customerNo;
    var URLUtils = require('dw/web/URLUtils');
    var currentCustomer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    var currentProfile = currentCustomer.profile;
    var currentLoggedInCustomer = req.currentCustomer.profile;
    if (empty(currentLoggedInCustomer) || (!empty(currentLoggedInCustomer) && currentLoggedInCustomer.customerNo === customerNo) && !empty(currentProfile) && ('isSleptAccount' in currentProfile.custom && currentProfile.custom.isSleptAccount)) {    // eslint-disable-line no-mixed-operators
        res.render('sleepingInfo/sleepingAccountInfo', {
            customerNo: customerNo,
            userName: currentProfile.email,
            isNaverSSOUser: currentProfile.custom.isNaverUser,
            actionUrl: URLUtils.url('Account-Login', 'rurl', '1', 'reactivateAccount', true).toString()
        });
    } else {
        res.redirect(URLUtils.url('Home-Show'));
    }
    next();
});

server.post('Reactivate', server.middleware.https, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var customerNo = req.httpParameterMap.customerNo.stringValue;
    if (!empty(customerNo)) {
        var currentCustomer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
        var currentProfile = currentCustomer.profile;
        if (empty(currentProfile)) {
            res.json({
                success: false
            });
            next();
        }
        if (currentProfile.custom.isNaverUser) {
            Transaction.wrap(function () {
                currentProfile.custom.isSleptAccount = false;
            });
        }
        res.json({
            success: true,
            isNaverUser: currentProfile.custom.isNaverUser
        });
    }
    next();
});

module.exports = server.exports();
