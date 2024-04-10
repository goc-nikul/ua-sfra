'use strict';

var server = require('server');
server.extend(module.superModule);
const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
var Logger = require('dw/system/Logger').getLogger('Loyalty');
var URLUtils = require('dw/web/URLUtils');

server.prepend('Login', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var isMarketingModal = 'marketingModal' in req.form ? req.form.marketingModal : false;
        var isEnrollLoyalty = 'enrollloyalty' in req.form ? req.form.enrollloyalty : false;
        if (!loyaltyHelper.isLoyaltyEnabled() || !customer.authenticated) {
            return;
        }
        var enrollFailed = false;
        let alreadyEnrolled = customer.isMemberOfCustomerGroup('Loyalty');
        var enrollResponse = {
            enrolled: false
        };
        if (isMarketingModal) {
            if (alreadyEnrolled) {
                enrollResponse.enrolled = true;
            } else if (isEnrollLoyalty === 'true') {
                enrollResponse = loyaltyHelper.enroll(req);
                enrollFailed = !enrollResponse.enrolled;
            }
        }
        const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
        if (customer.isMemberOfCustomerGroup('Loyalty') && !empty(currentBasket)) {
            loyaltyHelper.estimate(currentBasket);
            loyaltyHelper.checkCustomerReconcile(currentBasket);
        }
        if (!isMarketingModal) {
            return;
        }
        var marketingLandingContentID = loyaltyHelper.getMarketingLandingContentID();
        res.setViewData({
            redirectUrl: URLUtils.url('Page-Show', 'cid', marketingLandingContentID, 'loyaltyGatedModal', enrollResponse.enrolled, 'alreadyEnrolled', alreadyEnrolled, 'enrollFailed', enrollFailed, 'member', 'current_member').toString(),
            loyaltyGatedModal: enrollResponse.enrolled
        });
    });
    next();
});

server.append('SubmitRegistration', function (req, res, next) {
    var isEnrollLoyalty = 'enrollloyalty' in req.form ? req.form.enrollloyalty : false;
    var isMarketingModal = 'marketingModal' in req.form ? req.form.marketingModal : false;
    if (!loyaltyHelper.isLoyaltyEnabled() || !customer.authenticated) {
        return next();
    }
    var enrollFailed = false;
    var enrollResponse = {
        enrolled: false
    };
    if (isEnrollLoyalty === 'true') {
        enrollResponse = loyaltyHelper.enroll(req);
        enrollFailed = !enrollResponse.enrolled;
    }
    if (isMarketingModal) {
        var marketingLandingContentID = loyaltyHelper.getMarketingLandingContentID();
        let responseJSON = res.viewData;
        responseJSON.redirectUrl = URLUtils.url('Page-Show', 'cid', marketingLandingContentID, 'loyaltyGatedModal', enrollResponse.enrolled, 'enrollFailed', enrollFailed, 'member', 'new_member').toString();
        responseJSON.loyaltyGatedModal = enrollResponse.enrolled;
        res.json(responseJSON);
    }

    return next();
});
server.append('SaveProfile', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        if (loyaltyHelper.isLoyaltyEnabled() && loyaltyHelper.isLoyalCustomer() && res.viewData.success === true) {
            var profile = {
                birthday: {
                    birthDay: (!empty(res.viewData.birthDay) && res.viewData.birthDay !== null) ? res.viewData.birthDay : '',
                    birthMonth: (!empty(res.viewData.birthMonth) && res.viewData.birthMonth !== null) ? res.viewData.birthMonth : ''
                },
                firstName: !empty(res.viewData.firstName) ? res.viewData.firstName : '',
                lastName: !empty(res.viewData.lastName) ? res.viewData.lastName : ''
            };
            var updateProfileResponse = loyaltyHelper.updateCustomerProfileIntoLoyalty(profile);
            if (updateProfileResponse.object.customerUpdated) {
                Logger.info('Profile Status updated successfully');
            } else {
                Logger.error(`Profile status couldnt be updated: ${updateProfileResponse.object.errorMessage}`);
            }
        }
    });
    return next();
});

server.append('Header', server.middleware.include, function (req, res, next) {
    loyaltyHelper.appendLoyaltyUrl(res);

    next();
});

server.append('Show', function (req, res, next) {
    loyaltyHelper.appendLoyaltyUrl(res);

    next();
});


server.append('EditProfile', function (req, res, next) {
    loyaltyHelper.appendLoyaltyUrl(res);

    next();
});

module.exports = server.exports();
