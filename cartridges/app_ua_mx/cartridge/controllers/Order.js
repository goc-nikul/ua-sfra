'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Resource = require('dw/web/Resource');
var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var ContentMgr = require('dw/content/ContentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var contentHelpers = require('*/cartridge/scripts/helpers/contentHelpers');
var countrySupportedReturnBox = ['SEA', 'TH'];
var Site = require('dw/system/Site');
var country = Site.getCurrent().getID();
var returnBox = true;
if (countrySupportedReturnBox.includes(country)) {
    returnBox = false;
}

server.extend(module.superModule);

/**
 * Order-Confirm : Append this method to show the customer a 404 page if the order is past expiration
 * @name Base/Order-Confirm
 * @function
 * @memberof Order
 * @param {category} - sensitive
 * @param {serverfunction} - append
 */
server.append('Confirm', function (req, res, next) {
    var order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);

    var token = req.form.orderToken ? req.form.orderToken : null;
    if (!order
        || !token
        || token !== order.orderToken
        || order.customer.ID !== req.currentCustomer.raw.ID
    ) {
        res.setStatusCode(404);
        res.render('error/notFound');
    }
    return next();
});

server.replace(
    'RMAHistory',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        try {
            var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');

            var orders = OrderHelpers.getReturnOrders(
                req.currentCustomer,
                req.querystring,
                req.locale.id
            );

            res.render('account/order/history', {
                returnOrdersCount: orders.length,
                orders: orders,
                accountlanding: false,
                orderHistory: false,
                returnsHistory: true,
                returnsOnly: true
            });
        } catch (e) {
            var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
            var template = 'account/order/error';
            Logger.error('Order.js - Error while rendering Return Tab: {0}:{1}: {2} ({3}:{4})', e.name, e.message, e.fileName, e.lineNumber, e.stack);

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
    'Details',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');

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
            var BVHelper = require('bm_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
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
    }, pageMetaData.computedPageMetaData
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
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');

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
                var exitLinkText;
                var exitLinkUrl;

                exitLinkText = !req.currentCustomer.profile
                    ? Resource.msg('link.continue.shop', 'order', null)
                    : Resource.msg('link.orderdetails.myaccount', 'account', null); // eslint-disable-line spellcheck/spell-checker

                exitLinkUrl = !req.currentCustomer.profile
                    ? URLUtils.url('Home-Show')
                    : URLUtils.https('Account-Show');

                var viewData = res.getViewData();
                var BVHelper = require('*/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
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
    }
);

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
            var BVHelper = require('bm_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
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
    'History',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');

        var ordersResult = OrderHelpers.getOrders(
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

        var returnOrders = OrderHelpers.getReturnOrders(
            req.currentCustomer,
            req.querystring,
            req.locale.id
        );

        res.render('account/order/history', {
            orders: orders,
            totalOrdersCount: orders.length,
            returnOrdersCount: returnOrders.length,
            filterValues: filterValues,
            orderFilter: req.querystring.orderFilter,
            accountlanding: false,
            breadcrumbs: breadcrumbs,
            orderHistory: true,
            returnsHistory: false,
            returnsOnly: true,
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
    'ReturnItems',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var orderID = req.querystring.orderID;
        var editURL = URLUtils.url('Order-ReturnItems', 'orderID', orderID);
        var order = OrderMgr.getOrder(orderID);
        var currentCustomerNo = req.currentCustomer.profile.customerNo;

        if (order && order.customer.profile.customerNo === currentCustomerNo) {
            var orderModel = orderHelpers.getOrderDetails(req);
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
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
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
            Logger.error('Error in Return Flow: {0}:{1}: {2} ({3}:{4})', e.name, e.message, e.fileName, e.lineNumber, e.stack);
        }
        var viewData = res.getViewData();
        var template = 'account/order/orderReturnReasonCard';
        if (order && order.customerNo === customerNo) {
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
            var renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: selectedPids, order: orderModel, returnRefreshURL: returnRefreshURL, hideReturnCommentsSection: hideReturnCommentsSection }, template);
            var resources = {
                return_page_header: Resource.msg('heading.returns.reason', 'confirmation', null)
            };
            res.json({ renderedTemplate: renderedTemplate, resources: resources, pidQty: pidQtyObj });
        } else {
            throw Error('Order does not match customer');
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
            var customerNo = req.currentCustomer.profile.customerNo;
            var order = OrderMgr.getOrder(req.querystring.orderID);
            if (!order || order.customerNo !== customerNo) {
                throw Error('Order does not match customer');
            }
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
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');

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
            Logger.error('OIS Error:  {0}:{1}: {2} ({3}:{4})', e.name, e.message, e.fileName, e.lineNumber, e.stack);
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
            var renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: selectedPids, order: orderModel, continueGuestReasonURL: continueGuestReasonURL, returnRefreshURL: returnRefreshURL, hideReturnCommentsSection: hideReturnCommentsSection }, template);
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
        if (!order || order.customerEmail !== req.querystring.trackOrderEmail) {
            throw Error('Order does not match customer');
        }
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
            Logger.error('Order.js: {0}:{1}: {2} ({3}:{4})', e.name, e.message, e.fileName, e.lineNumber, e.stack);
            res.json({ errorMsg: Resource.msg('label.print.error', 'account', null), errorInResponse: true, renderedTemplate: '' });
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
            Logger.error('Order.js: {0}:{1}: {2} ({3}:{4})', e.name, e.message, e.fileName, e.lineNumber, e.stack);

            res.json({ errorMsg: Resource.msg('label.print.error', 'account', null), errorInResponse: true, renderedTemplate: '' });
        }
        next();
    }
);

server.replace(
    'EmailLabel',
    function (req, res, next) {
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        try {
            var orderID = req.form.orderID;
            var order = OrderMgr.getOrder(orderID);
            var returnObj = returnHelpers.getReturnDetails();
            var result = printLabelHelpers.getPDF(order, returnObj);
            result.returnMessage = contentHelpers.getContentAsset('print-return-label-message').markup;
            res.json(result);
        } catch (e) {
            Logger.error('Order.js: {0}:{1}: {2} ({3}:{4})', e.name, e.message, e.fileName, e.lineNumber, e.stack);
            res.json({ errorMsg: Resource.msg('label.print.error', 'account', null), errorInResponse: true, renderedTemplate: '' });
        }
        next();
    }
);

server.replace(
    'EmailLabelGuest',
    function (req, res, next) {
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        try {
            var order = OrderMgr.getOrder(req.querystring.trackOrderNumber);
            var returnObj = returnHelpers.getReturnDetails();
            var result = printLabelHelpers.getPDF(order, returnObj);
            result.returnMessage = contentHelpers.getContentAsset('print-return-label-message').markup;
            res.json(result);
        } catch (e) {
            Logger.error('Order.js: {0}:{1}: {2} ({3}:{4})', e.name, e.message, e.fileName, e.lineNumber, e.stack);

            res.json({ errorMsg: Resource.msg('label.print.error', 'account', null), errorInResponse: true, renderedTemplate: '' });
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

            if (!order || order.customerEmail !== orderEmail) {
                throw Error('Order does not match customer');
            }

            var returnCase = order.getReturnCase(returnNumber);
            returnCase = empty(returnCase) ? order.getReturn(returnNumber.stringValue) : returnCase;

            if (!empty(returnCase)) {
                var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
                var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');

                var authFormObject = returnHelpers.createAuthFormObj(returnCase);
                var returnsUtils = new ReturnsUtils();
                var returnServiceValue = returnsUtils.getPreferenceValue('returnService', order.custom.customerLocale);
                var imageObj = '';
                if (returnServiceValue === 'aupost') {
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
                    isEmailLabel: true
                });
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
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');

        if (req.form.trackOrderEmail && req.form.trackOrderNumber) {
            var StringUtils = require('dw/util/StringUtils');
            var trackOrderNumber = StringUtils.trim(req.form.trackOrderNumber);
            var trackOrderEmail = StringUtils.trim(req.form.trackOrderEmail);
            orderData = orderHelpers.getTrackingDetails(trackOrderNumber, trackOrderEmail, req.locale.id);
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
                var exitLinkText;
                var exitLinkUrl;

                exitLinkText = !req.currentCustomer.profile
                    ? Resource.msg('link.continue.shop', 'order', null)
                    : Resource.msg('link.orderdetails.myaccount', 'account', null); // eslint-disable-line spellcheck/spell-checker

                exitLinkUrl = !req.currentCustomer.profile
                    ? URLUtils.url('Home-Show')
                    : URLUtils.https('Account-Show');

                var viewData = res.getViewData();
                var BVHelper = require('*/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
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
    }
);

server.prepend(
    'TrackOrder',
    csrfProtection.generateToken,
    server.middleware.https,
    function (req, res, next) {
        if (req.currentCustomer.raw.authenticated && req.currentCustomer.raw.registered && req.querystring && req.querystring.orderNo) {
            var order = OrderMgr.getOrder(req.querystring.orderNo);
            var orderCustomerNo = req.currentCustomer.profile.customerNo;
            var currentCustomerNo = order.customer.profile.customerNo;
            if (order && orderCustomerNo === currentCustomerNo) {
                res.redirect(URLUtils.url('Order-Details', 'orderID', req.querystring.orderNo));
            }
        }
        next();
    }
);

module.exports = server.exports();
