'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
server.extend(module.superModule);

server.append('CreateAccountModal',
    function (req, res, next) {
        var loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
        var pilotEnroll = req.querystring.pilotEnroll;
        var channel = req.querystring.channel;
        var subChannel = req.querystring.subChannel;
        var subChannelDetail = (!empty(req.querystring.subChannelDetail) ? req.querystring.subChannelDetail : loyaltyHelper.getCampaignID('externalCampaignID'));
        var target = req.querystring.rurl || 1;
        var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', target, 'channel', channel, 'subChannel', subChannel, 'subChannelDetail', subChannelDetail).relative().toString();

        if (!loyaltyHelper.isLoyaltyEnabled()) {
            return next();
        }

        if (empty(pilotEnroll)) {
            return next();
        }

        var viewData = res.getViewData();

        res.setViewData(viewData);

        res.render('account/createAccountModal', {
            showLoyaltyEnroll: pilotEnroll,
            createAccountUrl: createAccountUrl,
            channel: channel,
            subChannel: subChannel,
            subChannelDetail: subChannelDetail
        });

        return next();
    }
);


server.append('Show',
    function (req, res, next) {
        var loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
        var pilotEnroll = req.querystring.pilotEnroll;
        var channel = req.querystring.channel;
        var subChannel = req.querystring.subChannel;
        var subChannelDetail = (!empty(req.querystring.subChannelDetail) ? req.querystring.subChannelDetail : loyaltyHelper.getCampaignID('externalCampaignID'));
        var target = req.querystring.rurl || 1;
        var actionUrl = URLUtils.url('Account-Login', 'rurl', target, 'channel', channel, 'subChannel', subChannel, 'subChannelDetail', subChannelDetail);

        if (!loyaltyHelper.isLoyaltyEnabled()) {
            return next();
        }

        if (empty(pilotEnroll)) {
            return next();
        }

        res.setViewData({
            showLoyaltyEnroll: true,
            actionUrl: actionUrl,
            channel: channel,
            subChannel: subChannel,
            subChannelDetail: subChannelDetail
        });

        return next();
    }
);

module.exports = server.exports();
