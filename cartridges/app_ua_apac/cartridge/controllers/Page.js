'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var cid = req.querystring.cid;
    if (!empty(cid)) {
        var viewData = res.getViewData();
        var ContentMgr = require('dw/content/ContentMgr');
        var Content = ContentMgr.getContent(cid);
        var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        var bookSessionEnabled = PreferencesUtil.isCountryEnabled('bookSessionEnabled');
        if (cid === 'book-your-expert-fit' && bookSessionEnabled) {
            var brauzBookasession = require('*/cartridge/scripts/utils/brauzBookaSessionHelper');
            viewData.customer = brauzBookasession.customer(req);
            viewData.bookSessionSDK = brauzBookasession.bookSessionSDK;
            viewData.bsgroupNumber = brauzBookasession.bsgroupNumber;
            viewData.Content = Content;
            viewData.breadcrumbs = [
                {
                    // eslint-disable-next-line spellcheck/spell-checker
                    htmlValue: Resource.msg('customerservice.title', 'content', null),
                    url: URLUtils.url('Page-Show', 'cid', 'customer-service').toString()
                },
                {
                    htmlValue: empty(Content) ? null : Content.name,
                    url: URLUtils.url('Page-Show', 'cid', Content.ID).toString()
                }
            ];
        }
        if (cid === 'customer-inquiry') {
            viewData.breadcrumbs = [
                {
                    // eslint-disable-next-line spellcheck/spell-checker
                    htmlValue: Resource.msg('customerservice.title', 'content', null),
                    url: URLUtils.url('Page-Show', 'cid', 'customer-service').toString()
                },
                {
                    // eslint-disable-next-line spellcheck/spell-checker
                    htmlValue: Resource.msg('customerservice.contactus', 'content', null),
                    url: URLUtils.url('Page-Show', 'cid', 'contact-us').toString()
                },
                {
                    htmlValue: empty(Content) ? null : Content.name,
                    url: URLUtils.url('Page-Show', 'cid', Content.ID).toString()
                }
            ];
        }
        res.setViewData(viewData);
    }
    next();
});

module.exports = server.exports();
