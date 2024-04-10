'use strict';

/**
 * @namespace Order
 */

var server = require('server');

var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var ContentMgr = require('dw/content/ContentMgr');

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
var contentHelpers = require('*/cartridge/scripts/helpers/contentHelpers');
var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
var BVConstants = require('bm_bazaarvoice/cartridge/scripts/lib/libConstants').getConstants();
var BVHelper = require('bm_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
var countrySupportedReturnBox = ['SEA', 'TH'];
var country = Site.getCurrent().getID();
var returnBox = true;

if (countrySupportedReturnBox.includes(country)) {
    returnBox = false;
}

server.extend(module.superModule);

/**
 * Order-History : This endpoint is invoked to get Order History for the logged in shopper
 * @name Base/Order-History
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.replace(
    'History',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var ordersResult = orderHelpers.getOrders(
            req.currentCustomer,
            req.querystring,
            req.locale.id
        );
        var orders = ordersResult.orders;
        var filterValues = ordersResult.filterValues;
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            }
        ];

        var returnOrders = orderHelpers.getReturnOrders(
            req.currentCustomer,
            req.querystring,
            req.locale.id
        );

        res.render('account/order/history', {
            orders: orders,
            totalOrdersCount: ordersResult.totalOrdersCount,
            returnOrdersCount: returnOrders.totalreturnCounts,
            filterValues: filterValues,
            orderFilter: req.querystring.orderFilter,
            accountlanding: false,
            breadcrumbs: breadcrumbs,
            orderHistory: true,
            returnsHistory: false,
            returnsOnly: true,
            pageInfo: ordersResult.pageInfo,
            contentBody: contentHelpers.provideExchangeAndReturnsContent()
        });
        // set page meta-data
        var contentObj = ContentMgr.getContent('my-order-history-page-meta');
        if (contentObj) {
            pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
        }
        next();
    }, pageMetaData.computedPageMetaData
);

server.replace(
    'RMAHistory',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        try {
            var ordersResult = orderHelpers.getReturnOrders(
                req.currentCustomer,
                req.querystring,
                req.locale.id
            );

            res.render('account/order/history', {
                returnOrdersCount: ordersResult.totalreturnCounts,
                orders: ordersResult.orders,
                accountlanding: false,
                orderHistory: false,
                returnsHistory: true,
                returnsOnly: true,
                pageInfo: ordersResult.pageInfo
            });
        } catch (e) {
            var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
            var template = 'account/order/error';
            Logger.error('Order.js - Error while rendering Return Tab: ' + e.message);
            var renderedTemplate = renderTemplateHelper.getRenderedHtml({
                orderHistory: false
            }, template);
            res.json({
                renderedTemplate: renderedTemplate,
                errorInResponse: true
            });
        }
        next();
    }
);

/**
 * Order-Details : This endpoint is called to get Order Details
 * @name Base/Order-Details
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {querystringparameter} - orderID - Order ID
 * @param {querystringparameter} - orderFilter - Order Filter ID
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.replace(
    'Details',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var order = OrderMgr.getOrder(req.querystring.orderID);
        var orderCustomerNo = req.currentCustomer.profile.customerNo;
        var currentCustomerNo = order.customer.profile.customerNo;
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.orderhistory', 'account', null),
                url: URLUtils.url('Order-History').toString()
            }
        ];
        // set page meta-data
        var contentObj = ContentMgr.getContent('order-details-page-meta');
        if (contentObj) {
            pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
        }

        if (order && orderCustomerNo === currentCustomerNo) {
            var orderModel = orderHelpers.getOrderDetails(req, true);
            var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
            var exitLinkUrl = URLUtils.https('Order-History', 'orderFilter', req.querystring.orderFilter);
            var viewData = res.getViewData();
            if (BVHelper.isRREnabled() || BVHelper.isQAEnabled()) {
                viewData.bvScout = BVHelper.getBvLoaderUrl();
            }
            res.setViewData(viewData);
            res.render('account/orderDetails', {
                order: orderModel,
                exitLinkText: exitLinkText,
                exitLinkUrl: exitLinkUrl,
                breadcrumbs: breadcrumbs,
                exchangeDetailsPage: false,
                orderDetailsPage: true,
                exchangeOrder: null,
                rmaDetailsPage: false,
                orderReturnItems: null
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }, pageMetaData.computedPageMetaData);

server.replace(
    'RMADetails',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var rmaNumber = req.querystring.rmaNumber;
        var orderNumber = req.querystring.orderNumber;
        var order = OrderMgr.getOrder(orderNumber);
        var currentCustomerNo = req.currentCustomer.profile.customerNo;

        var breadcrumbs = [
            {
                // eslint-disable-next-line spellcheck/spell-checker
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.orderhistory', 'account', null), // eslint-disable-line spellcheck/spell-checker
                url: URLUtils.url('Order-History').toString()
            }
        ];

        if (order && order.customer.profile.customerNo === currentCustomerNo) {
            var ReturnModel = require('*/cartridge/models/returnOrder');
            var returnCase = order.getReturnCase(rmaNumber);
            if (returnCase) {
                var rmaModel = new ReturnModel(returnCase, { containerView: 'orderDetails' });
                // eslint-disable-next-line spellcheck/spell-checker
                var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
                var exitLinkUrl = URLUtils.https('Order-History', 'orderFilter', req.querystring.orderFilter);
                res.render('account/orderDetails', {
                    order: rmaModel,
                    exitLinkText: exitLinkText,
                    exitLinkUrl: exitLinkUrl,
                    breadcrumbs: breadcrumbs,
                    orderTracking: false,
                    rmaDetailsPage: true,
                    hideOrderSummary: false,
                    displayOrderDetailsInfo: false
                });
            } else {
                res.redirect(URLUtils.url('Account-Show'));
            }
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }
);

server.replace(
    'ReturnItems',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var orderID = req.querystring.orderID;
        var editURL = URLUtils.url('Order-ReturnItems', 'orderID', orderID);
        var order = OrderMgr.getOrder(orderID);
        var currentCustomerNo = req.currentCustomer.profile.customerNo;

        if (order && order.customer.profile.customerNo === currentCustomerNo) {
            var orderModel = orderHelpers.getOrderDetails(req, false);
            var breadcrumbs = [
                {
                    // eslint-disable-next-line spellcheck/spell-checker
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                },
                {
                    htmlValue: Resource.msg('label.orderhistory', 'account', null), // eslint-disable-line spellcheck/spell-checker
                    url: URLUtils.url('Order-History').toString()
                },
                {
                    htmlValue: Resource.msg('heading.orderproduct.summary.confirmation', 'confirmation', null),
                    url: URLUtils.url('Order-Details', 'orderID', order.orderNo).toString()
                }
            ];
            res.render('account/orderDetails', {
                order: orderModel,
                orderTracking: false,
                orderReturnItems: 'select',
                hideOrderSummary: true,
                returnItemsDetailsPage: true,
                editReturnItems: editURL,
                displayOrderDetailsInfo: false,
                paypal: {
                    summaryEmail: null,
                    currency: orderModel && orderModel.currencyCode ? orderModel.currencyCode : null
                },
                breadcrumbs: breadcrumbs,
                exchangeOrder: false
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }
);

server.replace(
    'ContinueReturn',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
        var customerNo = req.currentCustomer.profile.customerNo;
        var orderID = req.querystring.orderID;
        var pidQtyObj = [];
        if (req.querystring.pidQtyObj) {
            pidQtyObj = JSON.parse(req.querystring.pidQtyObj);
        }
        var order = OrderMgr.getOrder(orderID);
        var returnRefreshURL = URLUtils.url('Order-ContinueReturn', 'orderID', req.querystring.orderID, 'customerNo', customerNo);
        var selectedPids = req.querystring.pids;

        var selectedPidsArray = [];
        try {
            selectedPidsArray = JSON.parse(selectedPids);
        } catch (e) {
            Logger.error('Error in Return Flow: ' + e.message);
        }
        var viewData = res.getViewData();
        var template = 'account/order/orderReturnReasonCard';
        if (order) {
            if (!req.querystring.qty && req.querystring.pid) {
                for (var i = selectedPidsArray.length - 1; i >= 0; i--) {
                    if (selectedPidsArray[i].pid === req.querystring.pid) {
                        selectedPidsArray.splice(i, 1);
                        selectedPids = {};
                        selectedPids = JSON.stringify(selectedPidsArray);
                        break;
                    }
                }
            } else {
                selectedPids = req.querystring.pids;
            }
            var hideReturnCommentsSection = Site.getCurrent().getCustomPreferenceValue('hideReturnCommentsSection');
            var orderModel = orderHelpers.getReturnOrderDetails(req, selectedPidsArray, pidQtyObj);
            var renderedTemplate;
            try {
                if ((Site.getCurrent().getID() === 'SEA' || Site.getCurrent().getID() === 'TH')) {
                    var orderCountryCode = order.getDefaultShipment().shippingAddress.countryCode.value;
                    var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
                    var customObjectdefinition = returnHelpers.getCustomObject('ReturnMethodsConfigurations', orderCountryCode);
                    if (!empty(customObjectdefinition)) {
                        renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: selectedPids, order: orderModel, returnRefreshURL: returnRefreshURL, hideReturnCommentsSection: hideReturnCommentsSection, returnReasonObj: customObjectdefinition.returnReasonCodes }, template);
                    } else {
                        renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: selectedPids, order: orderModel, returnRefreshURL: returnRefreshURL, hideReturnCommentsSection: hideReturnCommentsSection }, template);
                    }
                } else {
                    renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: selectedPids, order: orderModel, returnRefreshURL: returnRefreshURL, hideReturnCommentsSection: hideReturnCommentsSection }, template);
                }
            } catch (e) {
                Logger.error('Error while generate template for Autoreturn registered: ' + e.message);
            }
            var resources = {
                return_page_header: Resource.msg('heading.returns.reason', 'confirmation', null)
            };
            res.json({ renderedTemplate: renderedTemplate, resources: resources, pidQty: pidQtyObj });
        }
        next();
    }
);

server.replace(
    'ContinueReason',
    userLoggedIn.validateLoggedInAjax,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        if (res.getViewData().loggedin) {
            var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
            var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
            var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
            var order = OrderMgr.getOrder(req.querystring.orderID);
            var printLabelURL = URLUtils.url('Order-PrintLabel', 'orderID', order.orderNo);
            var returnObj = req.form.reason_value;
            var analyticsProductObj = req.form.analytics_reason_value;
            returnHelpers.setReturnDetails(returnObj);
            var template = 'account/order/orderReturnPrintCard';
            var returnInstructionText = printLabelHelpers.getReturnInstructionText(order);
            var generateLabel = Resource.msg('order.generate.button', 'account', null);
            var renderedTemplate = renderTemplateHelper.getRenderedHtml({ orderReturnItems: 'print', order: order, customerEmail: req.currentCustomer.profile.email, printLabelURL: printLabelURL, isExchangeItems: req.form.isExchangeItems, exchangeTealiumItems: analyticsProductObj, returnInstructionText: returnInstructionText, generateLabel: generateLabel }, template);
            var resources = {
                return_page_header: Resource.msg('heading.returns.print', 'confirmation', null)
            };
            res.json({ renderedTemplate: renderedTemplate, resources: resources });
        }
        next();
    }
);

// Guest Returns and Refunds
server.replace(
    'GuestReturns',
    csrfProtection.generateToken,
    server.middleware.https,
    function (req, res, next) {
        var returnRetailForm = server.forms.getForm('uareturns');
        var content = ContentMgr.getContent('guest-returns');
        if (content) {
            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        }
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
            returnBox: returnBox,
            returnRetailForm: returnRetailForm,
            orderReturnsFormError: '',
            contentBody: contentHelpers.provideExchangeAndReturnsContent(),
            breadcrumbs: breadcrumbs
        });
        next();
    }, pageMetaData.computedPageMetaData);

server.replace(
    'TrackReturns',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.validateRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        var OrderModel = require('*/cartridge/models/order');
        var order;
        var validForm = true;
        var orderReturnsTrackingURL = null;
        var returnRetailForm = server.forms.getForm('uareturns');
        returnRetailForm.clear();
        var trackOrderNumber = req.form.orderid;
        var trackOrderEmail = req.form.emailreturnid;
        if (trackOrderEmail && trackOrderNumber) {
            order = OrderMgr.getOrder(trackOrderNumber);
            orderReturnsTrackingURL = URLUtils.url('Order-ReturnGuestItems', 'trackOrderNumber', trackOrderNumber, 'trackOrderEmail', trackOrderEmail);
        } else {
            validForm = false;
        }
        if (!order) {
            res.render('refund/uareturns', {
                returnBox: returnBox,
                orderReturnsFormError: Resource.msg('error.message.trackorder.form', 'login', null),
                returnRetailForm: returnRetailForm,
                contentBody: contentHelpers.provideExchangeAndReturnsContent()
            });
            next();
        } else {
            var viewData = res.getViewData();
            if (BVHelper.isRREnabled() || BVHelper.isQAEnabled()) {
                viewData.bvScout = BVHelper.getBvLoaderUrl();
            }
            res.setViewData(viewData);

            var orderModel = new OrderModel(order, { containerView: 'orderDetails' });

            // check the email of the form
            var orderEmail = orderModel && orderModel.orderEmail ? orderModel.orderEmail.toLowerCase() : null;
            if (trackOrderEmail.toLowerCase() !== orderEmail) {
                validForm = false;
            }

            if (validForm) {
                var exitLinkText;
                var exitLinkUrl;

                exitLinkText = !req.currentCustomer.profile
                    ? Resource.msg('link.continue.shop', 'order', null)
                    : Resource.msg('link.orderdetails.myaccount', 'account', null); // eslint-disable-line spellcheck/spell-checker

                exitLinkUrl = !req.currentCustomer.profile
                    ? URLUtils.url('Home-Show')
                    : URLUtils.https('Account-Show');

                res.render('account/orderDetails', {
                    order: orderModel,
                    exitLinkText: exitLinkText,
                    exitLinkUrl: exitLinkUrl,
                    orderTracking: true,
                    hideOrderSummary: false,
                    displayOrderDetailsInfo: true,
                    orderReturnsTrackingURL: orderReturnsTrackingURL,
                    loginURL: URLUtils.url('Login-Show', 'rurl', '4')
                });
            } else {
                res.render('refund/uareturns', {
                    returnBox: returnBox,
                    returnRetailForm: returnRetailForm,
                    orderReturnsFormError: Resource.msg('error.message.trackorder.form', 'login', null),
                    contentBody: contentHelpers.provideExchangeAndReturnsContent()
                });
            }

            next();
        }
    }
);

server.replace(
    'ReturnGuestItems',
    server.middleware.https,
    function (req, res, next) {
        var OrderModel = require('*/cartridge/models/order');

        var trackOrderNumber = req.querystring.trackOrderNumber;
        var trackOrderEmail = req.querystring.trackOrderEmail;
        var order = OrderMgr.getOrder(trackOrderNumber);
        var continueGuestReturnURL = URLUtils.url('Order-ContinueGuestReturn', 'trackOrderNumber', trackOrderNumber, 'trackOrderEmail', trackOrderEmail);
        var editURL = URLUtils.url('Order-ReturnGuestItems', 'trackOrderNumber', trackOrderNumber, 'trackOrderEmail', trackOrderEmail);


        if (order) {
            var orderModel = new OrderModel(order, { containerView: 'orderDetails' });

            // check the email of the form
            var orderEmail = orderModel && orderModel.orderEmail ? orderModel.orderEmail.toLowerCase() : null;
            if (trackOrderEmail.toLowerCase() === orderEmail) {
                res.render('account/orderDetails', {
                    order: orderModel,
                    orderTracking: true,
                    orderReturnItems: 'select',
                    hideOrderSummary: true,
                    displayOrderDetailsInfo: false,
                    paypal: {
                        summaryEmail: null,
                        currency: orderModel && orderModel.currencyCode ? orderModel.currencyCode : null
                    },
                    continueGuestReturnURL: continueGuestReturnURL,
                    editURL: editURL
                });
            } else {
                res.redirect(URLUtils.url('Account-Show'));
            }
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }
);

server.replace(
    'ContinueGuestReturn',
    csrfProtection.generateToken,
    function (req, res, next) {
        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

        var order = OrderMgr.getOrder(req.querystring.trackOrderNumber);
        var continueGuestReasonURL = URLUtils.url('Order-ContinueGuestReason', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var returnRefreshURL = URLUtils.url('Order-ContinueGuestReturn', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var selectedPids = req.querystring.pids;
        var pidQtyObj = [];
        if (req.querystring.pidQtyObj) {
            pidQtyObj = JSON.parse(req.querystring.pidQtyObj);
        }

        var selectedPidsArray = [];
        try {
            selectedPidsArray = JSON.parse(selectedPids);
        } catch (e) {
            Logger.error('OIS Error:  ' + e.stack);
        }
        var viewData = res.getViewData();
        var template = 'account/order/orderReturnReasonCard';
        if (order) {
            if (!req.querystring.qty && req.querystring.pid) {
                for (var i = selectedPidsArray.length - 1; i >= 0; i--) {
                    if (selectedPidsArray[i].pid === req.querystring.pid) {
                        selectedPidsArray.splice(i, 1);
                        selectedPids = {};
                        selectedPids = JSON.stringify(selectedPidsArray);
                        break;
                    }
                }
            } else {
                selectedPids = req.querystring.pids;
            }
            var hideReturnCommentsSection = Site.getCurrent().getCustomPreferenceValue('hideReturnCommentsSection');
            var orderModel = orderHelpers.getReturnOrderDetails(req, selectedPidsArray, pidQtyObj);
            var renderedTemplate;
            try {
                if ((Site.getCurrent().getID() === 'SEA' || Site.getCurrent().getID() === 'TH')) {
                    var orderCountryCode = order.getDefaultShipment().shippingAddress.countryCode.value;
                    var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
                    var customObjectdefinition = returnHelpers.getCustomObject('ReturnMethodsConfigurations', orderCountryCode);
                    if (!empty(customObjectdefinition)) {
                        renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: selectedPids, order: orderModel, continueGuestReasonURL: continueGuestReasonURL, returnRefreshURL: returnRefreshURL, hideReturnCommentsSection: hideReturnCommentsSection, returnReasonObj: customObjectdefinition.returnReasonCodes }, template);
                    } else {
                        renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: selectedPids, order: orderModel, continueGuestReasonURL: continueGuestReasonURL, returnRefreshURL: returnRefreshURL, hideReturnCommentsSection: hideReturnCommentsSection }, template);
                    }
                } else {
                    renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: selectedPids, order: orderModel, continueGuestReasonURL: continueGuestReasonURL, returnRefreshURL: returnRefreshURL, hideReturnCommentsSection: hideReturnCommentsSection }, template);
                }
            } catch (e) {
                Logger.error('Error while generate template for Autoreturn guest: ' + e.stack);
            }
            var resources = {
                return_page_header: Resource.msg('heading.returns.reason', 'confirmation', null)
            };
            res.json({ renderedTemplate: renderedTemplate, resources: resources, pidQty: pidQtyObj });
        }
        next();
    }
);

server.replace(
    'ContinueGuestReason',
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
        var order = OrderMgr.getOrder(req.querystring.trackOrderNumber);
        var returnObj = req.form.reason_value;
        returnHelpers.setReturnDetails(returnObj);
        var printLabelGuestURL = URLUtils.url('Order-PrintLabelGuest', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var emailLabelGuestURL = URLUtils.url('Order-EmailLabelGuest', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var template = 'account/order/orderReturnPrintCard';
        var returnInstructionText = printLabelHelpers.getReturnInstructionText(order);
        var generateLabel = Resource.msg('order.generate.button', 'account', null);
        var renderedTemplate = renderTemplateHelper.getRenderedHtml({ orderReturnItems: 'print', order: order, printLabelGuestURL: printLabelGuestURL, emailLabelGuestURL: emailLabelGuestURL, isExchangeItems: req.form.isExchangeItems, returnInstructionText: returnInstructionText, generateLabel: generateLabel }, template);

        var resources = {
            return_page_header: Resource.msg('heading.returns.print', 'confirmation', null)
        };
        res.json({ renderedTemplate: renderedTemplate, resources: resources });
        next();
    }
);

server.replace(
    'PrintLabel',
    function (req, res, next) {
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        try {
            var order = OrderMgr.getOrder(req.querystring.orderID);
            var returnObj = returnHelpers.getReturnDetails();
            var result = printLabelHelpers.getPDF(order, returnObj);
            res.json(result);
        } catch (e) {
            Logger.error('Order.js: ' + e.stack);
            res.json({ errorMessage: Resource.msg('label.print.generic.error', 'account', null), errorInResponse: true, renderedTemplate: '' });
        }
        next();
    }
);

server.replace(
    'PrintLabelGuest',
    function (req, res, next) {
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        try {
            var order = OrderMgr.getOrder(req.querystring.trackOrderNumber);
            var returnObj = returnHelpers.getReturnDetails();
            var result = printLabelHelpers.getPDF(order, returnObj);
            res.json(result);
        } catch (e) {
            Logger.error('Order.js: ' + e.stack);
            res.json({ errorMessage: Resource.msg('label.print.generic.error', 'account', null), errorInResponse: true, renderedTemplate: '' });
        }
        next();
    }
);

server.replace(
    'PrintEmailLabel',
    function (req, res, next) {
        var orderNumber = req.querystring.orderNumber;
        var returnNumber = req.querystring.returnNumber;
        var orderEmail = req.querystring.orderEmail;
        var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');

        if (orderNumber && returnNumber && orderEmail) {
            var order = OrderMgr.getOrder(orderNumber);

            if (order) {
                var returnCase = order.getReturnCase(returnNumber);
                returnCase = empty(returnCase) ? order.getReturn(returnNumber.stringValue) : returnCase;

                if (!empty(returnCase)) {
                    var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
                    var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');

                    var authFormObject = returnHelpers.createAuthFormObj(returnCase);
                    var returnsUtils = new ReturnsUtils();
                    var returnServiceValue = returnsUtils.getPreferenceValue('returnService', order.custom.customerLocale);
                    var imageObj = '';
                    if (returnServiceValue && (returnServiceValue === 'aupost' || returnServiceValue.toLowerCase() === 'dhlparcel' || returnServiceValue.toLowerCase() === 'fedex')) {
                        imageObj = 'data:application/pdf;base64,' + returnCase.custom.shipmentLabel;
                        imageObj.replace(/['"]+/g, '');
                    } else {
                        imageObj = 'data:image/png;base64,' + returnCase.custom.shipmentLabel;
                    }
                    // For AutoReturn
                    if (returnServiceValue === 'SEA') {
                        imageObj = 'data:application/pdf;base64,' + returnCase.custom.shipmentLabel;
                        imageObj.replace(/['"]+/g, '');
                    }
                    var returnInstructionText = printLabelHelpers.getReturnInstructionText(order);

                    res.render('refund/printlabel', {
                        authFormObject: authFormObject,
                        imageObj: imageObj,
                        returnInstructionText: returnInstructionText,
                        isEmailLabel: true,
                        returnServiceValue: returnServiceValue.toLowerCase(),
                        isPDF: imageObj.indexOf('application/pdf;base64') > -1
                    });
                }
            }
        }
        next();
    }
);

server.replace(
    'Track',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.validateRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        var orderModel;
        var orderData;
        var validForm = true;
        var target = req.querystring.rurl || 1; // eslint-disable-line spellcheck/spell-checker
        var actionUrl = URLUtils.url('Account-Login', 'rurl', target); // eslint-disable-line spellcheck/spell-checker
        var profileForm = server.forms.getForm('profile');
        profileForm.clear();
        var orderReturnsTrackingURL = null;
        var orderExchangeTrackingURL = null;

        if (req.form.trackOrderEmail && req.form.trackOrderNumber) {
            var StringUtils = require('dw/util/StringUtils');
            var trackOrderNumber = StringUtils.trim(req.form.trackOrderNumber);
            var trackOrderEmail = StringUtils.trim(req.form.trackOrderEmail);
            orderData = orderHelpers.getTrackingDetails(trackOrderNumber, trackOrderEmail, req.locale.id, true);
            orderModel = orderData.order;
            orderReturnsTrackingURL = URLUtils.url('Order-ReturnGuestItems', 'trackOrderNumber', trackOrderNumber, 'trackOrderEmail', trackOrderEmail);
            orderExchangeTrackingURL = URLUtils.url('Order-ExchangeGuestItems', 'trackOrderNumber', trackOrderNumber, 'trackOrderEmail', trackOrderEmail);
        } else {
            validForm = false;
        }
        var content = ContentMgr.getContent('guest-track-order-image');
        var contentAvailable = false;
        if (content && content.online && content.custom && content.custom.body && content.custom.body.markup) {
            contentAvailable = true;
        }
        var contentObj = ContentMgr.getContent('guest-track-order');
        if (contentObj) {
            pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
        }
        if (!orderModel) {
            res.render('/account/components/trackOrder', {
                navTabValue: 'login',
                orderTrackFormError: orderData.errorMsg,
                profileForm: profileForm,
                userName: '',
                actionUrl: actionUrl,
                contentAvailable: contentAvailable,
                pageContext: {
                    ns: 'orderTrack'
                }
            });
            next();
        } else {
            // check the email of the form
            var orderEmail = orderModel.orderEmail.toLowerCase();
            if (req.form.trackOrderEmail.toLowerCase()
                !== orderEmail) {
                validForm = false;
            }

            if (validForm) {
                // set page meta-data for order details
                contentObj = ContentMgr.getContent('order-details-page-meta');
                if (contentObj) {
                    pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
                }
                var exitLinkText;
                var exitLinkUrl;

                exitLinkText = !req.currentCustomer.profile
                    ? Resource.msg('link.continue.shop', 'order', null)
                    : Resource.msg('link.orderdetails.myaccount', 'account', null); // eslint-disable-line spellcheck/spell-checker

                exitLinkUrl = !req.currentCustomer.profile
                    ? URLUtils.url('Home-Show')
                    : URLUtils.https('Account-Show');

                var viewData = res.getViewData();
                if (BVHelper.isRREnabled() || BVHelper.isQAEnabled()) {
                    viewData.bvScout = BVHelper.getBvLoaderUrl();
                }
                res.setViewData(viewData);
                res.render('account/orderDetails', {
                    order: orderModel,
                    exitLinkText: exitLinkText,
                    exitLinkUrl: exitLinkUrl,
                    orderTracking: true,
                    hideOrderSummary: false,
                    orderReturnsTrackingURL: orderReturnsTrackingURL,
                    orderExchangeTrackingURL: orderExchangeTrackingURL,
                    displayOrderDetailsInfo: true
                });
            } else {
                res.render('/account/components/trackOrder', {
                    navTabValue: 'login',
                    profileForm: profileForm,
                    orderTrackFormError: orderData.errorMsg,
                    userName: '',
                    actionUrl: actionUrl,
                    contentAvailable: contentAvailable,
                    pageContext: {
                        ns: 'orderTrack'
                    }
                });
            }
            next();
        }
    }, pageMetaData.computedPageMetaData);

server.prepend(
    'TrackOrder',
    csrfProtection.generateToken,
    server.middleware.https,
    function (req, res, next) {
        if (req.currentCustomer.raw.authenticated && req.currentCustomer.raw.registered && req.querystring && req.querystring.orderNo) {
            var order = OrderMgr.getOrder(req.querystring.orderNo);
            if (!empty(order) && !empty(order.customer) && !empty(order.customer.profile)) {
                var orderCustomerNo = req.currentCustomer.profile.customerNo;
                var currentCustomerNo = order.customer.profile.customerNo;
                if (order && orderCustomerNo === currentCustomerNo) {
                    res.redirect(URLUtils.url('Order-Details', 'orderID', req.querystring.orderNo));
                }
            }
        }
        next();
    }
);

server.append(
    'TrackOrder',
    function (req, res, next) {
        var viewData = res.getViewData();

        viewData.trackOrder2ContentAvailable = contentHelpers.isContentAssetBodyAvailable('guest-track-order-2');

        res.setViewData(viewData);

        next();
    }
);

server.append(
    'Confirm',
    function (req, res, next) {
        var pixelEnabled = dw.system.Site.getCurrent().getCustomPreferenceValue('bvEnableBVPixel');
        if (pixelEnabled) {
            var viewData = res.getViewData();
            viewData.bvScout = BVHelper.getBvLoaderUrl();
            var order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);
            var bvdata = BVHelper.getDisplayData();
            var pixelObj = {
                orderId: order.orderNo,
                tax: order.totalTax.value.toFixed(2),
                shipping: order.adjustedShippingTotalNetPrice.value.toFixed(2),
                total: order.adjustedMerchandizeTotalNetPrice.value.toFixed(2),
                city: order.billingAddress.city,
                state: order.billingAddress.stateCode,
                country: order.billingAddress.countryCode.value,
                currency: order.currencyCode,
                email: order.customerEmail,
                nickname: order.customerName,
                partnerSource: BVConstants.XML_GENERATOR,
                locale: bvdata.locale,
                deploymentZone: bvdata.zone.toLowerCase().replace(' ', '_', 'g'),
                items: []
            };
            if (order.customerNo) {
                pixelObj.userId = order.customerNo;
            }
            var lineItems = order.allProductLineItems;
            for (var i = 0; i < lineItems.length; i++) {
                var item = lineItems[i];
                if (item.product) {
                    var itemObj = {
                        sku: BVHelper.replaceIllegalCharacters((item.product.variant && !BVConstants.UseVariantID) ? item.product.variationModel.master.ID : item.product.ID),
                        name: item.product.name,
                        quantity: item.quantity.value.toFixed(),
                        price: item.adjustedNetPrice.value.toFixed(2)
                    };
                    var img = BVHelper.getImageURL(item.product, BVConstants.PURCHASE);
                    if (img) {
                        itemObj.imageURL = img;
                    }
                    pixelObj.items.push(itemObj);
                }
            }
            viewData.bvpixel = pixelObj;
            res.setViewData(viewData);
        }
        next();
    }
);

module.exports = server.exports();
