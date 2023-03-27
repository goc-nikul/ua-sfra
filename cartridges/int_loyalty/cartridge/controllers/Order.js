'use strict';

var server = require('server');
const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
server.extend(module.superModule);

server.append('Confirm',
    function (req, res, next) {
        if (!loyaltyHelper.isLoyaltyEnabled()) {
            return next();
        }
        const Resource = require('dw/web/Resource');
        const viewData = res.getViewData();
        const rewardsLockerURL = loyaltyHelper.getRewardsLockerURL();
        let loyaltyPointsDescription = Resource.msg('loyalty.earn.legal', 'loyalty', null);
        if ('order' in viewData && 'hasBopisItems' in viewData.order) {
            loyaltyPointsDescription = loyaltyHelper.getLoyaltyPointsDescription(viewData.order);
        }

        res.setViewData({
            pageData: {
                rewardsLockerURL: rewardsLockerURL,
                loyaltyPointsDescription: loyaltyPointsDescription
            }
        });
        return next();
    }
);

server.append('CreateAccount', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var isEnrollLoyalty = 'enrollloyalty' in req.form ? req.form.enrollloyalty : false;
        if (!loyaltyHelper.isLoyaltyEnabled() || !customer.authenticated || !isEnrollLoyalty) {
            let responseJSON = res.viewData;
            responseJSON.rewardsEnroll = false;
            res.json(responseJSON);
            return;
        }

        var enrollResponse = {
            enrolled: false
        };
        enrollResponse = loyaltyHelper.enroll(req);

        if (enrollResponse.enrolled) {
            const OrderMgr = require('dw/order/OrderMgr');
            let order = OrderMgr.getOrder(req.querystring.ID);
            if (!loyaltyHelper.estimate(order)) {
                res.setViewData({
                    errorEstimateMsg: require('dw/web/Resource').msg('loyalty.error.earning.basket', 'loyalty', '')
                });
            }

            if (!empty(order.custom.estimatedLoyaltyPoints)) {
                let viewData = res.getViewData();
                if (!empty(viewData.redirectUrl)) {
                    delete viewData.redirectUrl;
                }
                const rewardsLockerURL = loyaltyHelper.getRewardsLockerURL();
                const Template = require('dw/util/Template');
                const HashMap = require('dw/util/HashMap');
                const template = new Template('components/loyaltyPointsEarn');
                const paramsMap = new HashMap();
                paramsMap.put('pageData', {
                    estimationPoints: order.custom.estimatedLoyaltyPoints,
                    rewardsLockerURL: rewardsLockerURL
                });
                res.setViewData({
                    rewardsEnroll: true,
                    template: template.render(paramsMap).text,
                    estimationPoints: order.custom.estimatedLoyaltyPoints
                });
            } else {
                res.viewData = {}; // eslint-disable-line
                res.json({ error: 'No estimated Loyalty points' });
            }
        } else {
            res.viewData = {}; // eslint-disable-line
            res.json({ error: enrollResponse.errorMessage });
        }
    });

    return next();
}
);


server.append('History', function (req, res, next) {
    loyaltyHelper.appendLoyaltyUrl(res);

    next();
});

module.exports = server.exports();
