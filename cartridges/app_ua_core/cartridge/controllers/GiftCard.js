'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const firstDataPreferences = require('*/cartridge/scripts/firstDataPreferences');
var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.get(
    'Show',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var countryCode = res.viewData.locale ? res.viewData.locale.split('_')[1] : '';
        var giftCardForm = server.forms.getForm('giftcards');
        var content = ContentMgr.getContent('gift-card-landing');
        if (content) {
            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        }
        giftCardForm.clear();
        // eslint-disable-next-line spellcheck/spell-checker
        res.render('/giftcards/giftcardslandingpage', {
            giftCardForm: giftCardForm,
            countryCode: countryCode,
            pageContext: {
                ns: 'giftCard'
            }
        });
        next();
    }, pageMetaData.computedPageMetaData);

server.get(
    'ShowEgiftCardsForm',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var Site = require('dw/system/Site');
        var TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');
        var eGiftCardsForm = server.forms.getForm('giftcards');
        var params = req.querystring;
        var ProductFactory = require('*/cartridge/scripts/factories/product');
        var product = ProductFactory.get(params);
        var currentCustomer = req.currentCustomer.raw;
        var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);
        var eGiftCardEdit = params.eGiftCardEdit;
        if (eGiftCardEdit !== 'EGIFT_CARD') { // eslint-disable-next-line
        	eGiftCardsForm.clear();
        }
        session.forms.giftcards.egiftcard.gcDeliveryDate.setValue(new TimezoneHelper().getCurrentSiteTime());
        res.render('giftcards/egiftcardsform', {
            eGiftCardsForm: eGiftCardsForm,
            product: product,
            eGiftCardMinAmount: Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMin'),
            eGiftCardMaxAmount: Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMax'),
            eGiftCardDeliveryTimeLine: Site.getCurrent().getCustomPreferenceValue('eGiftCardDelivery'),
            addToCartUrl: URLUtils.url('Cart-AddProduct'),
            isVIP: isVIP
        });
        next();
    });

server.post(
    'ApplyGiftCard',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        const BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        const Resource = require('dw/web/Resource');
        const Logger = require('dw/system/Logger').getLogger('GiftCard');
        const Transaction = require('dw/system/Transaction');
        const HookMgr = require('dw/system/HookMgr');
        const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
        const maxGiftcards = firstDataPreferences.maxGiftcards;
        let responseJson = {
            success: false,
            message: Resource.msg('giftcards.default.error', 'giftcards', 'Please check gift card details and try again.')
        };
        if (!empty(currentBasket)) {
            try {
                Transaction.wrap(function () {
                    HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
                });
                if (currentBasket.getPaymentInstruments(giftcardHelper.gcPaymentMethodName).size() >= maxGiftcards) {
                    responseJson.success = false;
                    responseJson.message = Resource.msgf('giftcard.maxnumberapplied', 'checkout', null, maxGiftcards);
                } else {
                    var firstDataHelper = require('*/cartridge/scripts/firstDataHelper');
                    if (req.form.gcNumber && req.form.gcPin) {
                        var giftCardResponse = firstDataHelper.checkBalance(req.form.gcNumber, req.form.gcPin);
                        if (giftCardResponse.success) {
                            responseJson = giftcardHelper.applyGiftCard(currentBasket, req.form.gcNumber, req.form.gcPin);
                        } else {
                            responseJson = giftCardResponse;
                        }
                    }
                }
            } catch (e) {
                Logger.error('Error in GiftCard.js -> ApplyGiftCard !! ' + e.message);
            }
        }

        var OrderModel = require('*/cartridge/models/order');
        var AccountModel = require('*/cartridge/models/account');
        var Locale = require('dw/util/Locale');
        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        var currentLocale = Locale.getLocale(req.locale.id);
        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );
        responseJson.order = basketModel;
        responseJson.customer = new AccountModel(req.currentCustomer);
        var giftCardFormData = giftcardHelper.giftCardFormData(res.viewData.csrf);
        res.json({
            renderedTemplate: giftCardFormData.templateContent,
            data: responseJson,
            gcResults: giftCardFormData.gcResults
        });
        next();
    });
server.post(
    'RemovePaymentInstrument',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
        giftcardHelper.removeGcPaymentInstrument(currentBasket, req.form.maskedgckastfournumber);
        giftcardHelper.updatePaymentTransaction(currentBasket);
        var giftCardFormData = giftcardHelper.giftCardFormData(res.viewData.csrf);

        var OrderModel = require('*/cartridge/models/order');
        var AccountModel = require('*/cartridge/models/account');
        var Locale = require('dw/util/Locale');
        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        var currentLocale = Locale.getLocale(req.locale.id);
        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );
        res.json({
            renderedTemplate: giftCardFormData.templateContent,
            gcResults: giftCardFormData.gcResults,
            order: basketModel,
            customer: new AccountModel(req.currentCustomer)
        });
        next();
    });

server.post(
        'CheckGiftCardBalance',
        server.middleware.https,
        csrfProtection.validateAjaxRequest,
        function (req, res, next) {
            var giftCardForm = server.forms.getForm('giftcards');
            var giftcardHelper = require('*/cartridge/scripts/firstDataHelper');
            var giftCardNumber = giftCardForm.balance.cardNumber.htmlValue;
            var giftCardPinNumber = giftCardForm.balance.pin.htmlValue;
            var giftCardResponse = {};
            if (giftCardNumber != null && giftCardPinNumber != null && giftCardNumber.toString().length === 16 && giftCardPinNumber.toString().length === 8) {
                giftCardResponse = giftcardHelper.checkBalance(giftCardNumber, giftCardPinNumber);
            }
            res.json(giftCardResponse);
            next();
        });

server.post(
    'RemoveAllGiftCardPaymentInstrument',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
        giftcardHelper.removeGcPaymentInstruments(currentBasket);
        giftcardHelper.updatePaymentTransaction(currentBasket);
        var giftCardFormData = giftcardHelper.giftCardFormData(res.viewData.csrf);
        res.json({
            renderedTemplate: giftCardFormData.templateContent,
            gcResults: giftCardFormData.gcResults
        });
        next();
    });

module.exports = server.exports();
