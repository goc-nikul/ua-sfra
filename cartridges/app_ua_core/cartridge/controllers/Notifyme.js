/* eslint-disable consistent-return */
'use strict';

var server = require('server');

var Site = require('dw/system/Site');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get('Modal', csrfProtection.generateToken, function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    // var viewData = res.getViewData();
    var params = { pid: req.querystring.pid };
    var product = ProductFactory.get(params);
    var customer = req.currentCustomer;

    var productNotifymeForm = server.forms.getForm('notifyMe');
    var isNotifyMeEnabled = Site.getCurrent().getCustomPreferenceValue('IsNotifyMeEnabled');
    var isSubmodal = req.querystring.submodal === 'true';

    if (customer && customer.profile) {
        productNotifymeForm.email.value = customer.profile.email;
        productNotifymeForm.firstname.value = customer.profile.firstName;
    }

    if (product && isNotifyMeEnabled) {
        res.json({
            success: true,
            renderedTemplate: renderTemplateHelper.getRenderedHtml({
                product: product,
                profile: customer ? customer.profile : null,
                isSubmodal: isSubmodal,
                // csrf: viewData.csrf,
                productNotifymeForm: productNotifymeForm,
                isNotifyMeEnabled: isNotifyMeEnabled
            }, 'product/components/productNotifyMeModal')
        });
    } else {
        res.json({});
    }
    next();
});

server.post('Submit', server.middleware.https, function (req, res, next) { // eslint-disable-line
    var Resource = require('dw/web/Resource');
    var emailHelper = require('*/cartridge/scripts/helpers/emailHelpers');
    var form = req.form;
    var email = form.productNotifyMeEmail;
    var firstName = form.productNotifyMeFirstName;
    var pid = form.pid;
    var product = dw.catalog.ProductMgr.getProduct(pid);
    var isValidEmailid = emailHelper.validateEmail(email);

    if (isValidEmailid && product) {
        var HookMgr = require('dw/system/HookMgr');
        var Calendar = require('dw/util/Calendar');
        var StringUtils = require('dw/util/StringUtils');
        var date = StringUtils.formatCalendar(new Calendar(new Date()), 'EEEE, MMMMM dd, yyyy h:mm a');

        var data = {
            keys: {
                EmailAddress: email,
                DateRequested: date,
                SKUID: product.custom.sku
            },
            values: {
                FirstName: firstName,
                EmailAddress: email,
                DateRequested: date,
                PhoneNumber: null,
                HasConsented: true,
                SKUID: product.custom.sku
            }
        };

        if (HookMgr.hasHook('app.communication.product.notifyMe')) {
            var statusResponse = HookMgr.callHook('app.communication.product.notifyMe', 'addBackInStockDataEvent', data);

            if (statusResponse && statusResponse.status === 'OK') {
                res.json({
                    success: true,
                    msg: Resource.msgf('productnotification.success', 'product', null, email)
                });
                return next();
            }
        }
    }

    res.json({
        success: false,
        msg: Resource.msg('product.notifyme.error.message', 'common', null)
    });
    next();
});

module.exports = server.exports();
