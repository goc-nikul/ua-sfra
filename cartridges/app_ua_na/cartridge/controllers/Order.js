var server = require('server');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site').getCurrent().getID().toUpperCase();

server.extend(module.superModule);

server.append(
    'GuestReturns',
    function (req, res, next) {
        if (!empty(Site) && Site === 'MX') {
            var returnRetailForm = server.forms.getForm('uareturns');
            var contentHelpers = require('*/cartridge/scripts/helpers/contentHelpers');
            var breadcrumbs = [
                {
                    // eslint-disable-next-line spellcheck/spell-checker
                    htmlValue: Resource.msg('customerservice.title', 'content', null),
                    url: URLUtils.url('Page-Show', 'cid', 'customer-service').toString()
                },
                {
                    htmlValue: Resource.msg('label.returns', 'account', null), // eslint-disable-line spellcheck/spell-checker
                    url: URLUtils.url('Order-GuestReturns').toString()
                }
            ];
            res.render('refund/uareturns', {
                returnRetailForm: returnRetailForm,
                orderReturnsFormError: '',
                contentBody: contentHelpers.provideExchangeAndReturnsContent(),
                breadcrumbs: breadcrumbs
            });
        }
        next();
    });

module.exports = server.exports();
