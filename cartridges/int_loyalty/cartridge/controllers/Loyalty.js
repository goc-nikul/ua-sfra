'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var URLUtils = require('dw/web/URLUtils');
var formErrors = require('*/cartridge/scripts/formErrors');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
var Resource = require('dw/web/Resource');
const Logger = require('dw/system/Logger');


server.get(
    'PilotZipCheckInclude',
    server.middleware.https,
    csrfProtection.generateToken,
    server.middleware.include,
    function (req, res, next) {
        if (!loyaltyHelper.isLoyaltyPilotEnabled()) {
            if (!customer.isAuthenticated()) {
                res.render('components/pilotZipCheck/pilotZipCheckAccountLogin');
            } else if (!customer.isMemberOfCustomerGroup('Loyalty')) {
                res.render('components/pilotGatedEnrollRegistred', {
                    pageData: {
                        formActions: {
                            enrollRegistred: URLUtils.url('Loyalty-Enroll', 'marketing', 'true').toString()
                        }
                    }
                });
            } else {
                const rewardsLockerURL = loyaltyHelper.getRewardsLockerURL();

                res.render('components/loyaltyAlreadyEnrolled', {
                    pageData: {
                        rewardsLockerURL: rewardsLockerURL
                    }
                });
            }
        } else {
            const pilotForm = server.forms.getForm('pilotCheck');
            pilotForm.clear();
            res.render('loyalty/pilotZipCheck', {
                forms: {
                    pilot: pilotForm
                },
                formActions: {
                    pilot: URLUtils.url('Loyalty-PilotZipCheckEnrollment').toString()
                }
            });
        }
        return next();
    }
);

server.post('PilotZipCheckEnrollment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        var pilotForm = server.forms.getForm('pilotCheck');

        if (pilotForm.valid) {
            var paramsMap = new HashMap();
            var data = {};
            var template;

            if (loyaltyHelper.isLoyaltyPilotZipCode(pilotForm.toObject().postalCode)) {
                if (customer.isAuthenticated()) {
                    var alreadyEnrolled = customer.isMemberOfCustomerGroup('Loyalty');
                    if (alreadyEnrolled) {
                        res.json({
                            success: true,
                            userEnrolled: true
                        });

                        return next();
                    }

                    template = new Template('components/pilotGatedEnrollRegistred');
                    data = {
                        csrf: res.viewData.csrf,
                        formActions: {
                            enrollRegistred: URLUtils.url('Loyalty-Enroll', 'marketing', 'true').toString()
                        }
                    };
                } else {
                    template = new Template('components/pilotZipCheck/pilotZipCheckAccountLogin');
                }
            } else {
                var pilotWaitListForm = server.forms.getForm('pilotWaitList');
                data = {
                    csrf: res.viewData.csrf,
                    forms: {
                        waitList: pilotWaitListForm
                    },
                    formActions: {
                        waitList: URLUtils.url('Loyalty-PilotZipWaitListSubmit').toString()
                    },
                    zipCode: pilotForm.toObject().postalCode
                };
                pilotWaitListForm.clear();
                template = new Template('components/pilotZipCheck/pilotZipCheckWaitList');
            }

            paramsMap.put('pageData', data);

            res.json({
                success: true,
                template: template.render(paramsMap).text
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(pilotForm)
            });
        }
        return next();
    }
);

server.post(
    'RedeemReward',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        if (!loyaltyHelper.isLoyaltyEnabled() || !customer.isMemberOfCustomerGroup('Loyalty')) {
            return next();
        }

        let success = false;
        let isInvalidCoupon = false;
        const rewardsHelper = require('*/cartridge/scripts/helpers/rewardsHelper');
        const reward = rewardsHelper.getReward(req.form);
        const currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
        const { LOYALTY_PREFIX } = require('*/cartridge/scripts/LoyaltyConstants');
        try {
            success = reward.redeem();
            if (success) {
                if (!empty(currentBasket) && 'couponLineItems' in currentBasket && currentBasket.couponLineItems.length > 0) {
                    for (var i = 0; i < currentBasket.couponLineItems.length; i++) {
                        if (currentBasket.couponLineItems[i].couponCode.indexOf(LOYALTY_PREFIX) !== -1 && !currentBasket.couponLineItems[i].applied) {
                            isInvalidCoupon = true;
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            success = false;
            Logger.error('Error while executing Loyalty-RedeemReward: {0}', e.message);
        }

        const CartModel = require('*/cartridge/models/cart');
        const cartModel = new CartModel(currentBasket);

        if (!success && !isInvalidCoupon) {
            res.setViewData({
                error: {
                    errorModal: true,
                    title: Resource.msg('loyalty.error', 'loyalty', null),
                    bodyText: Resource.msg('error.minihub.redeem', 'minihub', ''),
                    btnText: Resource.msg('loyalty.error.refresh.page', 'loyalty', null)
                }
            });
        } else if (success && isInvalidCoupon) {
            res.setViewData({
                error: {
                    errorModal: true,
                    bodyText: Resource.msg('error.minihub.invalidcoupon', 'minihub', ''),
                    btnText: Resource.msg('loyalty.error.btn.ok', 'loyalty', null),
                    btnActionURL: null,
                    icon: Resource.msg('loyalty.icon.alert', 'loyalty', null)
                }
            });
        }

        res.json({
            success: success,
            isInvalidCoupon: isInvalidCoupon,
            cartModel: cartModel
        });

        return next();
    }
);

server.post(
    'RemoveReward',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        if (!loyaltyHelper.isLoyaltyEnabled() || !customer.isMemberOfCustomerGroup('Loyalty')) {
            return next();
        }

        let success = false;
        const rewardsHelper = require('*/cartridge/scripts/helpers/rewardsHelper');
        const reward = rewardsHelper.getReward(req.form);
        try {
            success = reward.removeAndReject();
        } catch (e) {
            success = false;
            Logger.error('Error while executing Loyalty-RemoveReward: {0}', e.message);
        }

        const currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
        const CartModel = require('*/cartridge/models/cart');
        const cartModel = new CartModel(currentBasket);

        if (!success) {
            res.setViewData({
                error: {
                    errorModal: true,
                    title: Resource.msg('loyalty.error', 'loyalty', null),
                    bodyText: Resource.msg('error.minihub.remove', 'minihub', ''),
                    btnText: Resource.msg('loyalty.error.refresh.page', 'loyalty', null)
                }
            });
        }

        res.json({
            success: success,
            cartModel: cartModel
        });

        return next();
    }
);

server.post(
    'Enroll',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        const paramsMap = new HashMap();
        let template;
        if (!loyaltyHelper.isLoyaltyEnabled()) {
            res.json({
                success: false
            });
            return next();
        }
        var enrollResponse = loyaltyHelper.enroll(req);
        const rewardsLockerURL = loyaltyHelper.getRewardsLockerURL();

        if (enrollResponse.enrolled) {
            if (req.querystring.marketing === 'true') {
                template = new Template('components/pilotEnrollRegistredSuccess');
                paramsMap.put('pageData', {
                    rewardsLockerURL: rewardsLockerURL
                });
                res.json({
                    success: true,
                    template: template.render(paramsMap).text
                });

                return next();
            }

            if (req.form.checkout !== 'true') {
                res.json({
                    success: true
                });
                return next();
            }
            const OrderMgr = require('dw/order/OrderMgr');
            let order = req.form.order ? OrderMgr.getOrder(req.form.order) : null;
            if (order) {
                loyaltyHelper.estimate(order);
                if (!empty(order.custom.estimatedLoyaltyPoints)) {
                    let loyaltyPointsDescription = Resource.msg('loyalty.earn.legal', 'loyalty', null);
                    if ('hasBopisItems' in order) {
                        loyaltyPointsDescription = loyaltyHelper.getLoyaltyPointsDescription(order);
                    }
                    template = new Template('components/loyaltyPointsEarn');
                    paramsMap.put('pageData', {
                        estimationPoints: order.custom.estimatedLoyaltyPoints,
                        rewardsLockerURL: rewardsLockerURL,
                        loyaltyPointsDescription: loyaltyPointsDescription
                    });
                    res.json({
                        success: true,
                        template: template.render(paramsMap).text,
                        estimationPoints: order.custom.estimatedLoyaltyPoints
                    });
                } else {
                    res.json({
                        success: false,
                        errorModal: true,
                        title: Resource.msg('loyalty.error', 'loyalty', null),
                        msg: Resource.msg('loyalty.error.no.points', 'loyalty', null),
                        btnText: Resource.msg('loyalty.error.refresh.page', 'loyalty', null)
                    });
                }
            }
        } else {
            res.json({
                success: false,
                errorModal: true,
                error: enrollResponse.errorMessage,
                title: Resource.msg('loyalty.error', 'loyalty', null),
                msg: Resource.msg('loyalty.error.unable.enroll', 'loyalty', null),
                btnText: Resource.msg('loyalty.error.refresh.page', 'loyalty', null)
            });
        }
        return next();
    }
);

server.get('EnrollmentSuccessModal', function (req, res, next) {
    res.render('/modals/loyaltyEnrolledSuccess');
    next();
});

server.get('GatedEnrollmentModal',
    csrfProtection.generateToken,
    function (req, res, next) {
        const rewardsLockerURL = loyaltyHelper.getRewardsLockerURL();
        var template;
        var modalStatus = 'loyaltyGatedModal' in req.querystring ? req.querystring.loyaltyGatedModal : false;
        var data = {};

        if (modalStatus === 'true') {
            template = '/modals/loyaltyEnrolledSuccess';
            data = {
                rewardsLockerURL: rewardsLockerURL
            };
        } else {
            template = 'components/pilotGatedEnrollRegistred';
            data = {
                pageData: {
                    csrf: res.viewData.csrf,
                    formActions: {
                        enrollRegistred: URLUtils.url('Loyalty-Enroll', 'marketing', 'true').toString()
                    }
                }
            };
        }

        res.render(template, data);
        next();
    }
);

server.get(
    'HandleEnrollFail',
    server.middleware.https,
    function (req, res, next) {
        res.json({
            errorModal: true,
            title: Resource.msg('loyalty.error', 'loyalty', null),
            msg: Resource.msg('loyalty.error.unable.enroll', 'loyalty', null),
            btnText: Resource.msg('loyalty.error.refresh.page', 'loyalty', null),
            btnActionURL: null
        });

        return next();
    }
);

server.post(
    'PilotZipWaitListSubmit',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var pilotWaitListForm = server.forms.getForm('pilotWaitList');
        if (!pilotWaitListForm.valid) {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(pilotWaitListForm)
            });
            return next();
        }

        let success = false;
        const waitlistService = require('int_loyalty/cartridge/scripts/services/waitlistService');
        const getTokenService = waitlistService.getToken();
        const getTokenResponse = getTokenService.call();
        let token;

        if (getTokenResponse.ok && getTokenResponse.object && getTokenResponse.object.text) {
            const tokenResponseObj = JSON.parse(getTokenResponse.object.text);
            token = tokenResponseObj.access_token;
        }

        const params = {
            token: token,
            email: pilotWaitListForm.email.value,
            zip: pilotWaitListForm.postalCode.value
        };
        const addToWaitlistService = waitlistService.setEvent(params);
        const addToWaitlistResponse = addToWaitlistService.call();
        if (addToWaitlistResponse.ok && addToWaitlistResponse.object && addToWaitlistResponse.object.text) {
            success = true;
        }
        if (success === false) {
            res.json({
                success: false,
                errorModal: true,
                title: Resource.msg('loyalty.error', 'loyalty', null),
                msg: Resource.msg('waitlist.error.sfmc', 'loyalty', null),
                btnText: Resource.msg('loyalty.error.refresh.page', 'loyalty', null)
            });
        }
        const template = new Template('components/pilotZipCheck/pilotZipCheckWaitListSuccess');
        res.json({
            success: success,
            template: template.render().text
        });

        return next();
    }
);

module.exports = server.exports();
