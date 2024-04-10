'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Resource = require('dw/web/Resource');
var contentHelpers = require('*/cartridge/scripts/helpers/contentHelpers');
var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var Logger = require('dw/system/Logger');
var ContentMgr = require('dw/content/ContentMgr');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var isBOPISEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled');
var isUACAPIActive = Site.getCurrent().getCustomPreferenceValue('orderHistoryDetailsProvider') && Site.getCurrent().getCustomPreferenceValue('orderHistoryDetailsProvider').value === 'UACAPI';
const TYPE_WISH_LIST = require('dw/customer/ProductList').TYPE_WISH_LIST;
var isMAOMaintenanceModeEnabled = 'isMAOMaintenanceModeEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isMAOMaintenanceModeEnabled');
const logger = require('dw/system/Logger').getLogger('constructor', 'constructor');

server.extend(module.superModule);

server.prepend(
    'Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        if (req.httpMethod === 'GET') {
            // SFRA v6.3 no longer supports HTTP METHOD: 'GET'
            // So if another page calls this we will redirect to 404 instead of
            // 500
            // NOTE: If other prepends are added this code will need to be moved there as well.
            res.setStatusCode(404);
            res.render('error/notFound');
            this.emit('route:Complete', req, res);
            return;
        }
        var OrderMgr = require('dw/order/OrderMgr');
        var order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);

        var token = req.form.orderToken ? req.form.orderToken : null;

        if (!order
            || !token
            || token !== order.orderToken
            || order.customer.ID !== req.currentCustomer.raw.ID
        ) {
            Logger.error('Order.js: Error while rendering the order confirmation page: Token - {0}, orderToken - {1}, orderCustomerNumber - {2}, currentCustomerNumber - {3}, OrderNumber - {4}', token, order.orderToken, order.customer.ID, req.currentCustomer.raw.ID, order.orderNo);
        }

        next();
    }, pageMetaData.computedPageMetaData
);

server.append('Confirm', function (req, res, next) {
    var viewData = res.getViewData();
    viewData.pageContext = {
        ns: 'order.confirmation'
    };
    if (!empty(req.form.orderID)) {
        var OrderMgr = require('dw/order/OrderMgr');
        var order = OrderMgr.getOrder(req.form.orderID);
        if (order) {
            const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
            var giftCardOrderData = giftcardHelper.giftCardOrderData(order);
            if (giftCardOrderData) {
                viewData.gcPaymentInstruments = giftCardOrderData.gcPaymentInstruments;
                viewData.getGcRedeemedAmount = giftCardOrderData.getGcRedeemedAmount;
                viewData.getRemaingBalance = null; // Setting this value to null as part of PHX-2764
            }
            var vipPoints;
            if (Site.current.getCustomPreferenceValue('enableVIPCheckoutExperience')) {
                const vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
                vipPoints = vipDataHelpers.getVipPoints(order);
            }
            viewData.vipPoints = vipPoints;
            viewData.isOnlyGCPorduct = giftcardHelper.basketHasGiftCardItems(order).onlyEGiftCards;
            viewData.isHALOrder = order.custom.isCommercialPickup;
            var preOrderProductTileMessage = '';
            var setOfPreOrderProducts = (Site.current.getCustomPreferenceValue('preOrderStyles'));
            if (setOfPreOrderProducts) {
                var productLineItems = order.productLineItems;
                for (var index in productLineItems) { // eslint-disable-line
                    var product = productLineItems[index].product;
                    if (product && ((setOfPreOrderProducts.indexOf(product.ID) > -1) || (setOfPreOrderProducts.indexOf(product.masterProduct ? product.masterProduct.ID : product.ID) > -1)) && product.custom.isPreOrder) { // eslint-disable-line
                        preOrderProductTileMessage = Site.current.getCustomPreferenceValue('isPreOrderProductInCheckout');
                        break;
                    }
                }
            }
            viewData.preOrderProductTileMessage = preOrderProductTileMessage;
            viewData.orderUUID = order.getUUID();
            viewData.isBOPISEnabled = isBOPISEnabled;
            var instorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
            viewData.basketHasOnlyBopisShipment = instorePickupStoreHelpers.basketHasOnlyBOPISProducts(order.shipments);
            if (isBOPISEnabled) {
                var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
                var basketHasBopisShipment = instorePickupStoreHelpers.basketHasInStorePickUpShipment(order.shipments);
                viewData.basketHasBopisShipment = false;
                if (basketHasBopisShipment) {
                    viewData.basketHasBopisShipment = true;
                    var bopisShipment = instorePickupStoreHelpers.getBopisShipment(order.shipments);
                    if (bopisShipment && bopisShipment.custom.fromStoreId) {
                        var selectedStore = storeHelpers.findStoreById(bopisShipment.custom.fromStoreId);
                        viewData.selectedStore = selectedStore;
                        viewData.primaryFullName = bopisShipment.shippingAddress.fullName;
                    }
                }
                if (instorePickupStoreHelpers.basketHasInStorePickUpShipment(order.shipments) && !instorePickupStoreHelpers.basketHasOnlyBOPISProducts(order.shipments)) {
                    var collections = require('*/cartridge/scripts/util/collections');
                    var Money = require('dw/value/Money');
                    var totalShipmentCostThreshold = 'totalShipmentCostThreshold' in Site.current.preferences.custom ? Site.getCurrent().getCustomPreferenceValue('totalShipmentCostThreshold') : null;
                    var shipmentCost = 0;
                    collections.forEach(order.shipments, function (shipmentItr) {
                        var shipMethod = shipmentItr.getShippingMethod();
                        if (shipMethod) {
                            var isIncludeBopisShipmentCost = 'isIncludeBopisShipmentCost' in shipMethod.custom ? shipMethod.custom.isIncludeBopisShipmentCost : false;
                            if (isIncludeBopisShipmentCost || shipMethod.custom.storePickupEnabled) {
                                shipmentCost += shipmentItr.adjustedMerchandizeTotalPrice.value;
                            }
                        }
                    });
                    if (shipmentCost !== 0 && shipmentCost >= totalShipmentCostThreshold) {
                        var shipmentsIterator = viewData.order.shipping;
                        if (!empty(shipmentsIterator)) {
                            for (var p = 0; p < shipmentsIterator.length; p++) {
                                var shippingMethod = shipmentsIterator[p];
                                if (!empty(shippingMethod) && shippingMethod.selectedShippingMethod.isIncludeBopisShipmentCost) {
                                    shippingMethod.selectedShippingMethod.shippingCost = require('dw/util/StringUtils').formatMoney(new Money(0, order.currencyCode));
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            // Returns & Exchanges Policy Content
            var returnsExchangesPolicyContent = ContentMgr.getContent('order-confirmation-returns-exchanges-policy');
            if (returnsExchangesPolicyContent && returnsExchangesPolicyContent.online && returnsExchangesPolicyContent.custom && returnsExchangesPolicyContent.custom.body && returnsExchangesPolicyContent.custom.body.markup) {
                viewData.returnsExchangesPolicyContentEnabled = true;
            }

            // send inventory to Constructor
            var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
            logger.info('Order.js | send inventory to Constructor');
            COHelpers.sendInventoryToConstructor(order.getAllProductLineItems());
        }
        var passwordRequirements = require('*/cartridge/scripts/helpers/accountHelpers').getPasswordRequirements();
        viewData.passwordRules = passwordRequirements;
    }

    res.setViewData(viewData);
    var contentObj = ContentMgr.getContent('order-comfirmation-page-meta');
    if (contentObj) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
    }
    next();
}, pageMetaData.computedPageMetaData);

server.replace(
    'History',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        if (isUACAPIActive && isMAOMaintenanceModeEnabled) {
            res.render('maoMaintenance/maoMaintenanceAccountOrder');
        } else {
            var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
            var OrderModel = require('*/cartridge/models/OIS/order');
            var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
            if (isUACAPIActive) {
                OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
                OrderModel = require('*/cartridge/models/UACAPI/order/order');
                returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');
            }
            var customerNo = req.currentCustomer.profile.customerNo;
            var after = null;
            if (req.form.after) {
                after = req.form.after;
            } else if (req.querystring.after) {
                after = req.querystring.after;
            }
            var params = OrderHelpers.orderHistoryRequest(customerNo, after);
            var ordersResult = OrderHelpers.getOrders('history', params).orders;
            var pageInfo = ordersResult ? ordersResult.pageInfo : null;
            var totalOrdersCount = ordersResult ? ordersResult.totalCount : 0;
            var orderModel;
            if (ordersResult) {
                orderModel = new OrderModel(ordersResult);
            } else {
                orderModel = null;
            }
            var requestParams = returnHelpers.getRMAHistoryRequestBody(customerNo, null);
            var response = returnHelpers.createRmaMutation('rmas', requestParams);
            var returnOrdersCount = response && response.returns && response.returns.totalCount ? response.returns.totalCount : 0;

            res.render('account/order/history', {
                orders: orderModel,
                returnOrdersCount: returnOrdersCount,
                accountlanding: false,
                orderHistory: true,
                returnsHistory: false,
                pageInfo: pageInfo,
                totalOrdersCount: totalOrdersCount
            });
            // set page meta-data
            var contentObj = ContentMgr.getContent('my-order-history-page-meta');
            if (contentObj) {
                pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
            }
        }
        next();
    }, pageMetaData.computedPageMetaData
);

server.get(
    'RMAHistory',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var ReturnsModel = require('*/cartridge/models/OIS/order/returns');
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        if (isUACAPIActive) {
            ReturnsModel = require('*/cartridge/models/UACAPI/returns/returns');
            returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');
        }
        try {
            var customerNo = req.currentCustomer.profile.customerNo;
            var after = null;
            if (req.form.after) {
                after = req.form.after;
            } else if (req.querystring.after) {
                after = req.querystring.after;
            }
            var params = returnHelpers.getRMAHistoryRequestBody(customerNo, after);
            var ordersResult = returnHelpers.createRmaMutation('rmas', params);
            var returnOrdersCount = ordersResult && ordersResult.returns && ordersResult.totalCount ? ordersResult.returns.totalCount : 0;
            var pageInfo = ordersResult && ordersResult.returns && ordersResult.returns.pageInfo ? ordersResult.returns.pageInfo : null;
            var returnsModel;
            if (ordersResult && ordersResult.returns) {
                returnsModel = new ReturnsModel(ordersResult.returns);
            } else {
                returnsModel = null;
            }

            res.render('account/order/history', {
                orders: returnsModel,
                returnOrdersCount: returnOrdersCount,
                accountlanding: false,
                orderHistory: false,
                returnsHistory: true,
                pageInfo: pageInfo
            });
        } catch (e) {
            var template = 'account/order/error';
            Logger.error('Order.js - Error while rendering Return and Exchange Tab: ' + e.message);
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
    'Details',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        if (req.currentCustomer.raw.authenticated && req.currentCustomer.raw.registered) {
            if (isUACAPIActive && isMAOMaintenanceModeEnabled) {
                res.render('maoMaintenance/maoMaintenanceAccountOrder');
            } else {
                var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
                var OrderDetailsModel = require('*/cartridge/models/OIS/orderDetails');
                var getOrdersQuery = 'orderDetail';
                if (isUACAPIActive) {
                    OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
                    OrderDetailsModel = require('*/cartridge/models/UACAPI/order/orderDetails');
                    getOrdersQuery = 'orderDetailNew';
                }
                var customerNo = req.currentCustomer.profile.customerNo;
                var orderID = req.querystring.orderID;
                var params = OrderHelpers.orderDetailsRequest(customerNo, orderID);
                var order = OrderHelpers.getOrders(getOrdersQuery, params).orders;

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

                if (order) {
                    var orderModel = new OrderDetailsModel(order, true);
                    // eslint-disable-next-line spellcheck/spell-checker
                    var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
                    var exitLinkUrl =
                        URLUtils.https('Order-History', 'orderFilter', req.querystring.orderFilter);
                    var viewData = res.getViewData();
                    var BVHelper = require('bm_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
                    if (BVHelper.isRREnabled() || BVHelper.isQAEnabled()) {
                        viewData.bvScout = BVHelper.getBvLoaderUrl();
                    }
                    res.setViewData(viewData);
                    res.render('account/orderDetails', {
                        order: orderModel,
                        exitLinkText: exitLinkText,
                        isOrderDetailPage: true,
                        exitLinkUrl: exitLinkUrl,
                        breadcrumbs: breadcrumbs,
                        orderTracking: false,
                        orderDetailsPage: true,
                        rmaDetailsPage: false,
                        displayOrderDetailsInfo: true,
                        paypal: {
                            summaryEmail: null,
                            currency: orderModel && orderModel.currencyCode ? orderModel.currencyCode : null
                        }
                    });
                } else {
                    res.redirect(URLUtils.url('Order-TrackOrder'));
                }
            }
        } else {
            res.redirect(URLUtils.url('Order-TrackOrder'));
        }
        next();
    }
);

server.get(
    'RMADetails',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        if (isUACAPIActive) {
            returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');
        }
        var customerNo = req.currentCustomer.profile.customerNo;
        var rmaNumber = req.querystring.rmaNumber;
        var params = returnHelpers.getRMADetailsRequestBody(customerNo, rmaNumber);
        var orderResult = returnHelpers.createRmaMutation('rma', params);
        var order = orderResult && orderResult.rmaDetails ? orderResult.rmaDetails : null;

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

        if (order) {
            var ReturnDetailsModel = require('*/cartridge/models/OIS/order/returnDetails');
            if (isUACAPIActive) {
                ReturnDetailsModel = require('*/cartridge/models/UACAPI/returns/returnDetails');
            }
            var rmaModel = new ReturnDetailsModel(order);
            var returnOrder = order.returnOrder;
            var paymentMethod = returnOrder && returnOrder.paymentInstruments && returnOrder.paymentInstruments[0] && returnOrder.paymentInstruments[0].paymentMethod && returnOrder.paymentInstruments[0].paymentMethod.id;
            var isKlarnaOrder = (paymentMethod === 'KLARNA_PAYMENTS') ? true : false; // eslint-disable-line
            // eslint-disable-next-line spellcheck/spell-checker
            var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
            var exitLinkUrl =
                URLUtils.https('Order-History', 'orderFilter', req.querystring.orderFilter);
            res.render('account/orderDetails', {
                order: rmaModel,
                exitLinkText: exitLinkText,
                exitLinkUrl: exitLinkUrl,
                breadcrumbs: breadcrumbs,
                orderTracking: false,
                rmaDetailsPage: true,
                hideOrderSummary: false,
                displayOrderDetailsInfo: false,
                paypal: {
                    summaryEmail: null,
                    currency: rmaModel && rmaModel.currencyCode ? rmaModel.currencyCode : null
                },
                isKlarnaOrder: isKlarnaOrder
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }
);

server.get(
    'ExchangeDetails',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        if (isUACAPIActive) {
            returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');
        }
        var customerNo = req.currentCustomer.profile.customerNo;
        var rmaNumber = req.querystring.rmaNumber;
        var params = returnHelpers.getRMADetailsRequestBody(customerNo, rmaNumber);
        var orderResult = returnHelpers.createRmaMutation('rma', params);
        var order = orderResult && orderResult.rmaDetails ? orderResult.rmaDetails : null;
        var exchangeOrder = order ? order.exchangeOrder : null;
        var exchangeOrderObject = {};
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

        if (order && exchangeOrder) {
            var OrderItemsHelper = require('*/cartridge/scripts/order/orderItemsHelper');
            var rmaExchangeModel;
            var ExchangeDetailsModel = require('*/cartridge/models/OIS/order/exchangeDetails');
            if (isUACAPIActive) {
                ExchangeDetailsModel = require('*/cartridge/models/UACAPI/exchange/exchangeDetails');
            }
            rmaExchangeModel = new ExchangeDetailsModel(order);
            var originalItems = OrderItemsHelper.mergeDuplicateExchangeItems(rmaExchangeModel.originalOrderItems);
            if (originalItems.length > 0) {
                rmaExchangeModel.originalOrderItems = originalItems;
            }

            exchangeOrderObject.orderItems = returnHelpers.getExchangeOriginalOrderCollection(rmaExchangeModel);
            // eslint-disable-next-line spellcheck/spell-checker
            var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
            var exitLinkUrl =
                URLUtils.https('Order-History', 'orderFilter', req.querystring.orderFilter);
            res.render('account/orderDetails', {
                order: exchangeOrderObject,
                exchangeOrder: rmaExchangeModel,
                exitLinkText: exitLinkText,
                exitLinkUrl: exitLinkUrl,
                breadcrumbs: breadcrumbs,
                orderTracking: false,
                exchangeDetailsPage: true,
                hideOrderSummary: false,
                displayOrderDetailsInfo: false,
                paypal: {
                    summaryEmail: null,
                    currency: rmaExchangeModel && rmaExchangeModel.currencyCode ? rmaExchangeModel.currencyCode : null
                }
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }
);

server.get('TrackOrder', csrfProtection.generateToken, server.middleware.https, function (req, res, next) {
    var content = ContentMgr.getContent('guest-track-order-image');
    var contentAvailable = false;
    if (content && content.online && content.custom && content.custom.body && content.custom.body.markup) {
        contentAvailable = true;
    }
    var contentObj = ContentMgr.getContent('guest-track-order');
    if (contentObj) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
    }
    res.render('account/components/trackOrder', {
        actionURL: URLUtils.https('Order-Track'),
        orderReturn: false,
        pageContext: {
            ns: 'orderTrack'
        },
        contentAvailable: contentAvailable,
        customer: req.currentCustomer.raw.registered
    });
    next();
}, pageMetaData.computedPageMetaData);

server.replace(
    'Track',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.validateRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        if (isUACAPIActive && isMAOMaintenanceModeEnabled) {
            res.render('maoMaintenance/maoMaintenanceOrderTrack');
        } else {
            var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
            var OrderDetailsModel = require('*/cartridge/models/OIS/orderDetails');
            if (isUACAPIActive) {
                OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
                OrderDetailsModel = require('*/cartridge/models/UACAPI/order/orderDetails');
            }
            var order;
            var orderData;
            var validForm = true;
            var target = req.querystring.rurl || 1; // eslint-disable-line spellcheck/spell-checker
            var actionUrl = URLUtils.url('Account-Login', 'rurl', target); // eslint-disable-line spellcheck/spell-checker
            var profileForm = server.forms.getForm('profile');
            profileForm.clear();
            var orderReturnsTrackingURL = null;
            var orderExchangeTrackingURL = null;

            if (req.form.trackOrderEmail
                && req.form.trackOrderNumber) {
                var trackOrderNumber = StringUtils.trim(req.form.trackOrderNumber);
                var trackOrderEmail = StringUtils.trim(req.form.trackOrderEmail);
                var params = OrderHelpers.orderTrackRequest(trackOrderNumber, trackOrderEmail);
                var getOrdersQuery = isUACAPIActive ? 'orderTrackNew' : 'orderTrack';
                orderData = OrderHelpers.getOrders(getOrdersQuery, params);
                order = orderData.orders;
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

            if (!order) {
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
            } else {
                var orderModel = new OrderDetailsModel(order, true);
                // check the email of the form
                var orderEmail = orderModel && orderModel.customerInfo && orderModel.customerInfo.email ? orderModel.customerInfo.email.toLowerCase() : null;
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
                    var BVHelper = require('bm_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
                    if (BVHelper.isRREnabled() || BVHelper.isQAEnabled()) {
                        viewData.bvScout = BVHelper.getBvLoaderUrl();
                    }
                    res.setViewData(viewData);
                    res.render('account/orderDetails', {
                        order: orderModel,
                        trackOrderEmail: req.form.trackOrderEmail.toLowerCase(),
                        exitLinkText: exitLinkText,
                        exitLinkUrl: exitLinkUrl,
                        orderTracking: true,
                        isOrderDetailPage: true,
                        hideOrderSummary: false,
                        orderReturnsTrackingURL: orderReturnsTrackingURL,
                        orderExchangeTrackingURL: orderExchangeTrackingURL,
                        displayOrderDetailsInfo: true
                    });
                } else {
                    res.render('/account/components/trackOrder', {
                        navTabValue: 'login',
                        profileForm: profileForm,
                        orderTrackFormError: !validForm,
                        userName: '',
                        actionUrl: actionUrl,
                        contentAvailable: contentAvailable,
                        pageContext: {
                            ns: 'orderTrack'
                        }
                    });
                }
            }
        }
        next();
    }
);

server.get(
    'ReturnItems',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var OrderDetailsModel = require('*/cartridge/models/OIS/orderDetails');
        if (isUACAPIActive) {
            OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
            OrderDetailsModel = require('*/cartridge/models/UACAPI/order/orderDetails');
        }
        var customerNo = req.currentCustomer.profile.customerNo;
        var orderID = req.querystring.orderID;
        var params = OrderHelpers.orderDetailsRequest(customerNo, orderID);
        var order = OrderHelpers.getOrders('orderDetail', params).orders;
        var editURL = URLUtils.url('Order-ReturnItems', 'orderID', orderID);

        if (order) {
            var orderModel = new OrderDetailsModel(order, false);
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

server.get(
    'ExchangeItems',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var OrderDetailsModel = require('*/cartridge/models/OIS/orderDetails');
        if (isUACAPIActive) {
            OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
            OrderDetailsModel = require('*/cartridge/models/UACAPI/order/orderDetails');
        }
        var customerNo = req.currentCustomer.profile.customerNo;
        var orderID = req.querystring.orderID;
        var params = OrderHelpers.orderDetailsRequest(customerNo, orderID);
        var order = OrderHelpers.getOrders('orderDetail', params).orders;
        var editURL = URLUtils.url('Order-ReturnItems', 'orderID', orderID);

        if (order) {
            var orderModel = new OrderDetailsModel(order, false);
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
                },
                {
                    htmlValue: Resource.msg('heading.orderproduct.exchangeitems.edititems', 'confirmation', null),
                    url: URLUtils.url('Order-ExchangeItems', 'orderID', order.orderNo).toString()
                }
            ];
            res.render('account/orderDetails', {
                order: orderModel,
                orderTracking: false,
                orderReturnItems: 'select',
                hideOrderSummary: true,
                exchangeItemsDetailsPage: true,
                editReturnItems: editURL,
                displayOrderDetailsInfo: false,
                paypal: {
                    summaryEmail: null,
                    currency: orderModel && orderModel.currencyCode ? orderModel.currencyCode : null
                },
                breadcrumbs: breadcrumbs,
                exchangeOrder: true
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }
);
server.get(
    'ReturnGuestItems',
    server.middleware.https,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var OrderDetailsModel = require('*/cartridge/models/OIS/orderDetails');
        if (isUACAPIActive) {
            OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
            OrderDetailsModel = require('*/cartridge/models/UACAPI/order/orderDetails');
        }
        var params = OrderHelpers.orderTrackRequest(req.querystring.trackOrderNumber, req.querystring.trackOrderEmail);
        var order = OrderHelpers.getOrders('orderTrack', params).orders;
        var continueGuestReturnURL = URLUtils.url('Order-ContinueGuestReturn', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var editURL = URLUtils.url('Order-ReturnGuestItems', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        if (order) {
            var orderModel = new OrderDetailsModel(order, false);
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
        next();
    }
);

server.get(
    'ExchangeGuestItems',
    server.middleware.https,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var OrderDetailsModel = require('*/cartridge/models/OIS/orderDetails');
        if (isUACAPIActive) {
            OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
            OrderDetailsModel = require('*/cartridge/models/UACAPI/order/orderDetails');
        }
        var params = OrderHelpers.orderTrackRequest(req.querystring.trackOrderNumber, req.querystring.trackOrderEmail);
        var order = OrderHelpers.getOrders('orderTrack', params).orders;
        var continueGuestExchangeURL = URLUtils.url('Order-ContinueGuestExchange', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var editURL = URLUtils.url('Order-ExchangeGuestItems', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        if (order) {
            var orderModel = new OrderDetailsModel(order, false);
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
                continueGuestExchangeURL: continueGuestExchangeURL,
                editURL: editURL,
                exchangeOrder: true
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }
);

server.post(
    'ContinueReturn',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        if (isUACAPIActive) {
            OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
        }
        var customerNo = req.currentCustomer.profile.customerNo;
        var orderID = req.querystring.orderID;
        var pid = req.querystring.pid;
        var pidQtyObj = [];
        if (req.querystring.pidQtyObj) {
            pidQtyObj = JSON.parse(req.querystring.pidQtyObj);
        }
        var params = OrderHelpers.orderDetailsRequest(customerNo, orderID);
        var order = OrderHelpers.getOrders('orderDetail', params).orders;
        var returnRefreshURL = URLUtils.url('Order-ContinueReturn', 'orderID', req.querystring.orderID, 'customerNo', req.currentCustomer.profile.customerNo);
        var selectedPids = req.querystring.pids;
        // selectedPids = JSON.parse(selectedPids);
        var selectedPidsArray = [];
        try {
            selectedPidsArray = JSON.parse(selectedPids);
        } catch (e) {
            Logger.error('OIS Error:  ' + e.message);
        }
        var viewData = res.getViewData();
        var template = 'account/order/orderReturnReasonCard';
        if (order) {
            var OrderReturnDetailsModel = require('*/cartridge/models/OIS/orderReturnDetails');
            if (isUACAPIActive) {
                OrderReturnDetailsModel = require('*/cartridge/models/UACAPI/order/orderReturnDetails');
            }
            var orderModel = new OrderReturnDetailsModel(order, selectedPidsArray, false, pid, pidQtyObj);
            if (!req.querystring.qty && req.querystring.pid) {
                for (var i = selectedPidsArray.length - 1; i >= 0; i--) {
                    if (selectedPidsArray[i] === req.querystring.pid) {
                        selectedPidsArray.splice(i, 1);
                        selectedPids = {};
                        selectedPids.data = selectedPidsArray;
                        selectedPids = JSON.stringify(selectedPids);
                        break;
                    }
                }
            } else {
                selectedPids = req.querystring.pids;
            }
            var renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: selectedPids, order: orderModel, returnRefreshURL: returnRefreshURL, isUACAPIActive: isUACAPIActive }, template);
            var resources = {
                return_page_header: Resource.msg('heading.returns.reason', 'confirmation', null)
            };
            res.json({ renderedTemplate: renderedTemplate, resources: resources, pidQty: pidQtyObj });
        }
        next();
    }
);

server.post(
    'ContinueExchange',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        if (isUACAPIActive) {
            OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
        }
        var customerNo = req.currentCustomer.profile.customerNo;
        var orderID = req.querystring.orderID;
        var params = OrderHelpers.orderDetailsRequest(customerNo, orderID);
        var order = OrderHelpers.getOrders('orderDetail', params).orders;
        var pidQtyObj = [];
        if (req.querystring.pidQtyObj) {
            pidQtyObj = JSON.parse(req.querystring.pidQtyObj);
        }
        var returnRefreshURL = URLUtils.url('Order-ContinueExchange', 'orderID', req.querystring.orderID, 'customerNo', req.currentCustomer.profile.customerNo);
        var selectedPids = req.querystring.pids;
        // selectedPids = JSON.parse(selectedPids);
        var selectedPidsArray = [];
        try {
            selectedPidsArray = JSON.parse(selectedPids);
        } catch (e) {
            Logger.error('OIS Error:  ' + e.message);
        }
        var viewData = res.getViewData();
        var template = 'account/order/orderReturnReasonCard';
        if (order) {
            var OrderReturnDetailsModel = require('*/cartridge/models/OIS/orderReturnDetails');
            if (isUACAPIActive) {
                OrderReturnDetailsModel = require('*/cartridge/models/UACAPI/order/orderReturnDetails');
            }
            var orderModel = new OrderReturnDetailsModel(order, selectedPidsArray, true, null, pidQtyObj);
            var renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: req.querystring.pids, order: orderModel, returnRefreshURL: returnRefreshURL, exchangeOrder: true, isUACAPIActive: isUACAPIActive }, template);
            var resources = {
                return_page_header: Resource.msg('heading.exchange.reason', 'confirmation', null)
            };
            res.json({ renderedTemplate: renderedTemplate, resources: resources });
        }
        next();
    }
);

server.post(
    'ContinueGuestReturn',
    csrfProtection.generateToken,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        if (isUACAPIActive) {
            OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
        }
        var params = OrderHelpers.orderTrackRequest(req.querystring.trackOrderNumber, req.querystring.trackOrderEmail);
        var order = OrderHelpers.getOrders('orderTrack', params).orders;
        var continueGuestReasonURL = URLUtils.url('Order-ContinueGuestReason', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var returnRefreshURL = URLUtils.url('Order-ContinueGuestReturn', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var selectedPids = req.querystring.pids;
        var pidQtyObj = [];
        if (req.querystring.pidQtyObj) {
            pidQtyObj = JSON.parse(req.querystring.pidQtyObj);
        }
        // selectedPids = JSON.parse(selectedPids);
        var selectedPidsArray = [];
        try {
            selectedPidsArray = JSON.parse(selectedPids);
        } catch (e) {
            Logger.error('OIS Error:  ' + e.message);
        }
        var viewData = res.getViewData();
        var template = 'account/order/orderReturnReasonCard';
        if (order) {
            if (!req.querystring.qty && req.querystring.pid) {
                for (var i = selectedPidsArray.length - 1; i >= 0; i--) {
                    if (selectedPidsArray[i] === req.querystring.pid) {
                        selectedPidsArray.splice(i, 1);
                        selectedPids = {};
                        selectedPids.data = selectedPidsArray;
                        selectedPids = JSON.stringify(selectedPids);
                        break;
                    }
                }
            } else {
                selectedPids = req.querystring.pids;
            }
            var OrderReturnDetailsModel = require('*/cartridge/models/OIS/orderReturnDetails');
            if (isUACAPIActive) {
                OrderReturnDetailsModel = require('*/cartridge/models/UACAPI/order/orderReturnDetails');
            }
            var orderModel = new OrderReturnDetailsModel(order, selectedPidsArray, false, null, pidQtyObj);
            var renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: selectedPids, order: orderModel, continueGuestReasonURL: continueGuestReasonURL, returnRefreshURL: returnRefreshURL, isUACAPIActive: isUACAPIActive }, template);
            var resources = {
                return_page_header: Resource.msg('heading.returns.reason', 'confirmation', null)
            };
            res.json({ renderedTemplate: renderedTemplate, resources: resources, pidQty: pidQtyObj });
        }
        next();
    }
);

server.post(
    'ContinueGuestExchange',
    csrfProtection.generateToken,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        if (isUACAPIActive) {
            OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
        }
        var params = OrderHelpers.orderTrackRequest(req.querystring.trackOrderNumber, req.querystring.trackOrderEmail);
        var order = OrderHelpers.getOrders('orderTrack', params).orders;
        var continueGuestReasonURL = URLUtils.url('Order-ContinueGuestReason', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var returnRefreshURL = URLUtils.url('Order-ContinueGuestExchange', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var selectedPids = req.querystring.pids;
        // selectedPids = JSON.parse(selectedPids);
        var selectedPidsArray = [];
        try {
            selectedPidsArray = JSON.parse(selectedPids);
        } catch (e) {
            Logger.error('OIS Error:  ' + e.message);
        }
        var pidQtyObj = [];
        if (req.querystring.pidQtyObj) {
            pidQtyObj = JSON.parse(req.querystring.pidQtyObj);
        }
        var viewData = res.getViewData();
        var template = 'account/order/orderReturnReasonCard';
        if (order) {
            var OrderReturnDetailsModel = require('*/cartridge/models/OIS/orderReturnDetails');
            if (isUACAPIActive) {
                OrderReturnDetailsModel = require('*/cartridge/models/UACAPI/order/orderReturnDetails');
            }
            var orderModel = new OrderReturnDetailsModel(order, selectedPidsArray, true, null, pidQtyObj);
            var renderedTemplate = renderTemplateHelper.getRenderedHtml({ csrf: viewData.csrf, orderReturnItems: 'reason', selectedPids: req.querystring.pids, order: orderModel, continueGuestReasonURL: continueGuestReasonURL, returnRefreshURL: returnRefreshURL, exchangeOrder: true, isUACAPIActive: isUACAPIActive }, template);
            var resources = {
                return_page_header: Resource.msg('heading.exchange.reason', 'confirmation', null)
            };
            res.json({ renderedTemplate: renderedTemplate, resources: resources });
        }
        next();
    }
);

server.post(
    'ContinueReason',
    userLoggedIn.validateLoggedInAjax,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        if (res.getViewData().loggedin) {
            var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
            var OrderDetailsModel = require('*/cartridge/models/OIS/orderDetails');
            var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
            var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
            if (isUACAPIActive) {
                OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
                OrderDetailsModel = require('*/cartridge/models/UACAPI/order/orderDetails');
                returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');
                printLabelHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/printLabelHelpers');
            }
            var customerNo = req.currentCustomer.profile.customerNo;
            var orderID = req.querystring.orderID;
            var params = OrderHelpers.orderDetailsRequest(customerNo, orderID);
            var order = OrderHelpers.getOrders('orderDetail', params).orders;
            var returnObj = req.form.reason_value;
            var analyticsProductObj = req.form.analytics_reason_value;
            returnHelpers.setReturnDetails(returnObj);
            var template = 'account/order/orderReturnPrintCard';
            var orderModel = new OrderDetailsModel(order, false);
            var returnInstructionText = printLabelHelpers.getReturnInstructionText(order);
            var responseJSON = {};
            responseJSON.resources = {
                return_page_header: Resource.msg('heading.returns.print', 'confirmation', null)
            };
            var printLabelURL = URLUtils.url('Order-PrintLabel', 'orderID', order.orderNo);
            var returnMessage = contentHelpers.getContentAsset('print-return-label-message');
            if (isUACAPIActive) {
                var result = printLabelHelpers.submitReturn('createItemizedRma', order, returnHelpers.getReturnDetails(), null);
                if (result.errorInResponse) {
                    responseJSON.error = true;
                    responseJSON.errorMessage = result.errorMessage;
                    responseJSON.renderedTemplate = result.renderedTemplate;
                } else {
                    printLabelURL = printLabelURL.append('returnLabelID', result.returnLabelID);
                    responseJSON.renderedTemplate = renderTemplateHelper.getRenderedHtml({ orderReturnItems: 'print', order: orderModel, printLabelURL: printLabelURL, customerEmail: req.currentCustomer.profile.email, isExchangeItems: req.form.isExchangeItems, exchangeTealiumItems: analyticsProductObj, returnInstructionText: returnInstructionText, isUACAPIActive: isUACAPIActive, returnMessage: returnMessage, siteId: order.siteId }, template);
                }
            } else {
                responseJSON.renderedTemplate = renderTemplateHelper.getRenderedHtml({ orderReturnItems: 'print', order: orderModel, printLabelURL: printLabelURL, customerEmail: req.currentCustomer.profile.email, isExchangeItems: req.form.isExchangeItems, exchangeTealiumItems: analyticsProductObj, returnInstructionText: returnInstructionText }, template);
            }
            res.json(responseJSON);
        }
        next();
    }
);

server.post(
    'ContinueGuestReason',
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var OrderDetailsModel = require('*/cartridge/models/OIS/orderDetails');
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        if (isUACAPIActive) {
            OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
            OrderDetailsModel = require('*/cartridge/models/UACAPI/order/orderDetails');
            returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');
            printLabelHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/printLabelHelpers');
        }
        var params = OrderHelpers.orderTrackRequest(req.querystring.trackOrderNumber, req.querystring.trackOrderEmail);
        var order = OrderHelpers.getOrders('orderTrack', params).orders;
        var returnObj = req.form.reason_value;
        returnHelpers.setReturnDetails(returnObj);
        var printLabelGuestURL = URLUtils.url('Order-PrintLabelGuest', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
        var template = 'account/order/orderReturnPrintCard';
        var orderModel = new OrderDetailsModel(order, false);
        var returnInstructionText = printLabelHelpers.getReturnInstructionText(order);
        var responseJSON = {};
        responseJSON.resources = {
            return_page_header: Resource.msg('heading.returns.print', 'confirmation', null)
        };
        var returnMessage = contentHelpers.getContentAsset('print-return-label-message');
        if (isUACAPIActive) {
            var result = printLabelHelpers.submitReturn('createGuestItemizedRma', order, returnHelpers.getReturnDetails(), null);
            if (result.errorInResponse) {
                responseJSON.error = true;
                responseJSON.errorMessage = result.errorMessage;
                responseJSON.renderedTemplate = result.renderedTemplate;
            } else {
                printLabelGuestURL = printLabelGuestURL.append('returnLabelID', result.returnLabelID);
                responseJSON.renderedTemplate = renderTemplateHelper.getRenderedHtml({ orderReturnItems: 'print', order: orderModel, printLabelGuestURL: printLabelGuestURL, customerEmail: req.querystring.trackOrderEmail, isExchangeItems: req.form.isExchangeItems, returnInstructionText: returnInstructionText, isUACAPIActive: isUACAPIActive, returnMessage: returnMessage, siteId: order.siteId }, template);
            }
        } else {
            var emailLabelGuestURL = URLUtils.url('Order-EmailLabelGuest', 'trackOrderNumber', req.querystring.trackOrderNumber, 'trackOrderEmail', req.querystring.trackOrderEmail);
            responseJSON.renderedTemplate = renderTemplateHelper.getRenderedHtml({ orderReturnItems: 'print', order: orderModel, printLabelGuestURL: printLabelGuestURL, emailLabelGuestURL: emailLabelGuestURL, isExchangeItems: req.form.isExchangeItems, returnInstructionText: returnInstructionText }, template);
        }
        res.json(responseJSON);
        next();
    }
);

// Guest Returns and Refunds
server.get(
    'GuestReturns',
    csrfProtection.generateToken,
    server.middleware.https,
    function (req, res, next) {
        var returnRetailForm = server.forms.getForm('returnsretail');
        var content = ContentMgr.getContent('guest-returns');
        if (content) {
            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
        }
        res.render('refund/returnRetails', {
            returnRetailForm: returnRetailForm
        });
        next();
    }, pageMetaData.computedPageMetaData);

server.post(
    'ProofOfPurchase',
    csrfProtection.validateAjaxRequest,
    csrfProtection.generateToken,
    server.middleware.https,
    function (req, res, next) {
        try {
            var formData = req.form;
            var template = '';
            var returnRetailForm = '';
            var contentBody = '';
            var siteID = '';
            var viewData = res.getViewData();
            if (formData.purchaselocation === '01') {
                returnRetailForm = server.forms.getForm('uareturns');
                contentBody = contentHelpers.provideExchangeAndReturnsContent();
                template = 'refund/uareturnsform';
            } else if (formData.purchaselocation === '03') {
                template = 'refund/giftreciept';
                var content = ContentMgr.getContent('gift_reciept');
                if (content && content.online && content.custom && content.custom.body && content.custom.body.markup) {
                    contentBody = content.custom.body;
                }
            } else if (formData.template === 'proof-purchase') {
                returnRetailForm = server.forms.getForm('proofofpurchase');
                template = 'refund/proofpurchase';
            } else if (formData.template === 'returnreasons') {
                returnRetailForm = server.forms.getForm('returnreasons');
                template = 'refund/returnreasons';
            } else if (formData.template === 'returnaddress') {
                siteID = Site.getCurrent().getID();
                returnRetailForm = server.forms.getForm('returnaddressform');
                template = 'refund/returnaddress';
            }
            var result = {};
            if (req.querystring.format !== 'ajax' && formData.requestType === 'gueststorerma' && isUACAPIActive) {
                var returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');
                var printLabelHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/printLabelHelpers');
                var guestData = req.form;
                var order = returnHelpers.canadaPostRequestBody(guestData);
                if (order && order.postalCode) {
                    order.postalCode = order.postalCode.toUpperCase();
                }
                result = printLabelHelpers.submitReturn('createGuestStoreRma', order, null, guestData);
                var printLabelGuestStoreURL = URLUtils.url('Order-PrintLabelGuest', 'returnLabelID', result.returnLabelID, 'requestType', 'gueststorerma');
                template = 'refund/orderReturnPrintCard';
                var returnInstructionText = printLabelHelpers.getReturnInstructionText(order);
                result.renderedTemplate = renderTemplateHelper.getRenderedHtml({ orderReturnItems: 'print', printLabelGuestStoreURL: printLabelGuestStoreURL, returnInstructionText: returnInstructionText, customerEmail: guestData.returnemail, isUACAPIActive: isUACAPIActive }, template);
            } else {
                // eslint-disable-next-line no-undef
                result.renderedTemplate = renderTemplateHelper.getRenderedHtml({ returnRetailForm: returnRetailForm, formData: formData, contentBody: contentBody, siteID: siteID, csrf: viewData.csrf, CurrentPageMetaData: request.pageMetaData, CurrentHttpParameterMap: request.httpParameterMap, isUACAPIActive: isUACAPIActive }, template);
            }
            res.json(result);
        } catch (e) {
            res.json({
                msg: e.message,
                errorinresponse: true
            });
        }
        next();
    }
);

server.post(
    'GuestRefundService',
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        if (isUACAPIActive) {
            returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');
            printLabelHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/printLabelHelpers');
        }
        try {
            var guestData = req.form;
            var order = returnHelpers.canadaPostRequestBody(guestData);
            if (order && order.postalCode) {
                order.postalCode = order.postalCode.toUpperCase();
            }
            var result;
            if (isUACAPIActive) {
                result = printLabelHelpers.submitReturn('createGuestStoreRma', order, null, guestData);
                if (result.returnLabelID) {
                    result = printLabelHelpers.getPDF(order, result.returnLabelID, false);
                }
            } else {
                result = printLabelHelpers.getPDF('createGuestStoreRma', order, null, guestData, false, null, null);
            }
            res.json(result);
        } catch (e) {
            Logger.error('Order.js:' + e.message);
            res.json({ errorMsg: Resource.msg('label.print.error', 'account', null), errorInResponse: true, renderedTemplate: '' });
        }
        next();
    }
);

server.post(
    'PrintLabel',
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        if (isUACAPIActive) {
            OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
            returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');
            printLabelHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/printLabelHelpers');
        }
        try {
            var customerNo = req.currentCustomer.profile.customerNo;
            var orderID = req.querystring.orderID;
            var params = OrderHelpers.orderDetailsRequest(customerNo, orderID);
            var order = OrderHelpers.getOrders('orderDetail', params).orders;
            if (order.shippingAddress && order.shippingAddress.postalCode) {
                order.shippingAddress.postalCode = order.shippingAddress.postalCode.toUpperCase();
            }
            var returnObj = returnHelpers.getReturnDetails();
            var result;
            if (isUACAPIActive) {
                var returnLabelID = req.querystring.returnLabelID;
                result = printLabelHelpers.getPDF(order, returnLabelID, false);
            } else {
                result = printLabelHelpers.getPDF('createItemizedRma', order, returnObj, null, false, null, null);
            }
            res.json(result);
        } catch (e) {
            Logger.error('Order.js: ' + e.message);
            res.json({ errorMessage: Resource.msg('label.print.return.error', 'account', null), errorInResponse: true, renderedTemplate: '' });
        }
        next();
    }
);

server.post(
    'PrintLabelGuest',
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        if (isUACAPIActive) {
            OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
            returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');
            printLabelHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/printLabelHelpers');
        }
        try {
            var order = null;
            if (!req.querystring.requestType || req.querystring.requestType !== 'gueststorerma') {
                var params = OrderHelpers.orderTrackRequest(req.querystring.trackOrderNumber, req.querystring.trackOrderEmail);
                order = OrderHelpers.getOrders('orderTrack', params).orders;
            }
            var returnObj = returnHelpers.getReturnDetails();
            var result;
            if (isUACAPIActive) {
                var returnLabelID = req.querystring.returnLabelID;
                result = printLabelHelpers.getPDF(order, returnLabelID, false);
            } else {
                result = printLabelHelpers.getPDF('createGuestItemizedRma', order, returnObj, null, false, null, null);
            }
            res.json(result);
        } catch (e) {
            Logger.error('Order.js: ' + e.message);
            res.json({ errorMsg: Resource.msg('label.print.error', 'account', null), errorInResponse: true, renderedTemplate: '' });
        }
        next();
    }
);

server.post(
    'EmailLabel',
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        var customerNo = req.currentCustomer.profile ? req.currentCustomer.profile.customerNo : '';
        var orderID = req.form.orderID;
        var email = req.form.email;
        var emailLabel = true;
        var exchangeItems = req.form.exchangeItems;
        var requestType = 'createItemizedRma';
        var params = OrderHelpers.orderDetailsRequest(customerNo, orderID);
        var order = OrderHelpers.getOrders('orderDetail', params).orders;
        if (order && order.shippingAddress && order.shippingAddress.postalCode) {
            order.shippingAddress.postalCode = order.shippingAddress.postalCode.toUpperCase();
        }
        var returnObj = returnHelpers.getReturnDetails();
        var result = printLabelHelpers.getPDF(requestType, order, returnObj, null, emailLabel, email, exchangeItems);
        result.returnMessage = contentHelpers.getContentAsset('print-return-label-message').markup;
        res.json(result);
        next();
    }
);
server.post(
    'EmailLabelGuest',
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        var email = req.form.email;
        var emailLabel = true;
        var exchangeItems = req.form.exchangeItems;
        var requestType = 'createGuestItemizedRma';
        var params = OrderHelpers.orderTrackRequest(req.querystring.trackOrderNumber, req.querystring.trackOrderEmail);
        var order = OrderHelpers.getOrders('orderTrack', params).orders;
        if (order.shippingAddress && order.shippingAddress.postalCode) {
            order.shippingAddress.postalCode = order.shippingAddress.postalCode.toUpperCase();
        }
        var returnObj = returnHelpers.getReturnDetails();
        var result = printLabelHelpers.getPDF(requestType, order, returnObj, null, emailLabel, email, exchangeItems);
        result.returnMessage = contentHelpers.getContentAsset('print-return-label-message').markup;
        res.json(result);
        next();
    }
);
server.get(
    'PrintEmailLabel',
    function (req, res, next) {
        var printLabelHelpers = require('*/cartridge/scripts/order/printLabelHelpers');
        if (isUACAPIActive) {
            printLabelHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/printLabelHelpers');
            var viewData = res.getViewData();
            var documentId = req.querystring.documentId;
            var result = printLabelHelpers.getPDF(null, documentId, true);
            viewData.imageObj = result.imageObj;
            viewData.isEmailLabel = true;
            viewData.UACAPI = true;
            res.render('refund/printlabel', viewData);
        } else {
            var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
            var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
            var HookManager = require('dw/system/HookMgr');
            var S3TransferClient = require('int_s3/cartridge/scripts/lib/S3TransferClient.js');
            var params = req.querystring;
            var rmaId = params.rmaId;
            var imageObj = '';
            var fileName = 'label' + rmaId + '.' + params.fileType; // labelSMZU5X58E43ZKLJQLHP3.png or labelSMZU5X58E43ZKLJQLHP3.pdf
            var RMADetailsRequest = returnHelpers.getRMADetailsRequestBody(params.customerNo, rmaId);
            var orderResult = returnHelpers.createRmaMutation('rma', RMADetailsRequest);
            var order = orderResult && orderResult.rmaDetails ? orderResult.rmaDetails : null;
            var authFormObject = returnHelpers.createAuthFormObj(orderResult, null);
            var returnInstructionText = printLabelHelpers.getReturnInstructionText(order);
            var orgPreferences = require('dw/system/System').getPreferences();
            var orgCustomPreferences = orgPreferences.getCustom();
            var transferClient = new S3TransferClient(
                orgCustomPreferences.s3bucketName,
                orgCustomPreferences.s3accessKey,
                orgCustomPreferences.s3secretAccessKey,
                orgCustomPreferences.s3region,
                '', // contentType is optional
                1000,
                null
            );

            if (params.fileType === 'pdf') {
                var sfccOrder = OrderHelpers.capitalizeShippingPostalCode(dw.order.OrderMgr.getOrder(order.returnOrder.orderNo));
                if (HookManager.hasHook('app.returns.label.canadapost')) {
                    var pdfObject = HookManager.callHook('app.returns.label.canadapost', 'createReturnLabel', sfccOrder, rmaId);

                    imageObj = 'data:application/pdf;base64,' + pdfObject.shipLabel;
                }
            } else {
                imageObj = transferClient.getPreSignedUrl(fileName, orgCustomPreferences.s3preSignedUrlExpiry.toString());
            }

            res.render('refund/printlabel', {
                authFormObject: authFormObject,
                imageObj: imageObj,
                returnInstructionText: returnInstructionText,
                isEmailLabel: true
            });
        }
        next();
    }
);

server.use(
    'TrackReturns',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.validateRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        if (isUACAPIActive && isMAOMaintenanceModeEnabled) {
            res.render('maoMaintenance/maoMaintenanceOrderTrack');
        } else {
            var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
            var OrderDetailsModel = require('*/cartridge/models/OIS/orderDetails');
            if (isUACAPIActive) {
                OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
                OrderDetailsModel = require('*/cartridge/models/UACAPI/order/orderDetails');
            }
            var order;
            var orderData;
            var validForm = true;
            var orderReturnsTrackingURL = null;
            var orderExchangeTrackingURL = null;
            var returnRetailForm = server.forms.getForm('uareturns');
            returnRetailForm.clear();
            var trackOrderNumber = req.form.orderid;
            var trackOrderEmail = req.form.emailreturnid;
            if (trackOrderEmail && trackOrderNumber) {
                var params = OrderHelpers.orderTrackRequest(trackOrderNumber, trackOrderEmail);
                orderData = OrderHelpers.getOrders('orderTrack', params);
                order = orderData.orders;
                orderReturnsTrackingURL = URLUtils.url('Order-ReturnGuestItems', 'trackOrderNumber', trackOrderNumber, 'trackOrderEmail', trackOrderEmail);
                orderExchangeTrackingURL = URLUtils.url('Order-ExchangeGuestItems', 'trackOrderNumber', trackOrderNumber, 'trackOrderEmail', trackOrderEmail);
            } else {
                validForm = false;
            }

            var viewData = res.getViewData();
            var BVHelper = require('bm_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
            if (BVHelper.isRREnabled() || BVHelper.isQAEnabled()) {
                viewData.bvScout = BVHelper.getBvLoaderUrl();
            }
            res.setViewData(viewData);

            if (!order) {
                res.render('refund/uareturns', {
                    orderReturnsFormError: orderData ? orderData.errorMsg : '',
                    returnRetailForm: returnRetailForm,
                    contentBody: contentHelpers.provideExchangeAndReturnsContent()
                });
            } else {
                // force postal code upper case
                if (order.shippingAddress && order.shippingAddress.postalCode) {
                    order.shippingAddress.postalCode = order.shippingAddress.postalCode.toUpperCase();
                }
                var orderModel = new OrderDetailsModel(order, true);

                // check the email of the form
                var orderEmail = orderModel && orderModel.customerInfo && orderModel.customerInfo.email ? orderModel.customerInfo.email.toLowerCase() : null;
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
                        orderExchangeTrackingURL: orderExchangeTrackingURL,
                        loginURL: URLUtils.url('Login-Show', 'rurl', '4')
                    });
                } else {
                    res.render('refund/uareturns', {
                        returnRetailForm: returnRetailForm,
                        orderReturnsFormError: !validForm,
                        contentBody: contentHelpers.provideExchangeAndReturnsContent()
                    });
                }
            }
        }
        next();
    }
);

server.post(
    'SelectExchangeItem',
    function (req, res, next) {
        var ExchangeOrderHelper = require('*/cartridge/scripts/order/exchangeOrderHelper');
        if (isUACAPIActive) {
            ExchangeOrderHelper = require('*/cartridge/scripts/UACAPI/helpers/order/exchangeOrderHelper');
        }
        var sku = req.form.exchangeSKU;
        var exchangeItems = req.form.exchangeItems;

        var product = ExchangeOrderHelper.getExchangeProduct(sku, exchangeItems);
        var context = {
            product: product,
            template: 'product/exchange/quickView'
        };

        res.setViewData(context);
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            res.render(context.template);
        });

        next();
    }
);

server.post(
    'ExchangeItemInfo',
    function (req, res, next) {
        var ExchangeOrderHelper = require('*/cartridge/scripts/order/exchangeOrderHelper');
        if (isUACAPIActive) {
            ExchangeOrderHelper = require('*/cartridge/scripts/UACAPI/helpers/order/exchangeOrderHelper');
        }
        var sku = req.form.exchangeSKU;
        var itemCount = req.form.itemCount;
        var exchangeItems = req.form.exchangeItems;

        var product = ExchangeOrderHelper.getExchangeProduct(sku, exchangeItems);
        var context = {
            exchangeProduct: product,
            exchangeItemCount: itemCount,
            template: 'product/exchange/exchangeItemInfo'
        };

        res.setViewData(context);
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var viewData = res.getViewData();

            res.json({
                renderedTemplate: renderTemplateHelper.getRenderedHtml(viewData, viewData.template)
            });
        });
        next();
    }
);

server.replace(
    'CreateAccount',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) { // eslint-disable-line consistent-return
        // Wislist's prepend code
        var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
        var viewData = res.getViewData();
        var list = productListHelper.getList(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
        viewData.list = list;
        res.setViewData(viewData);
        // actual businness logic
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var OrderMgr = require('dw/order/OrderMgr');
        var formErrors = require('*/cartridge/scripts/formErrors');
        var idmPreferences = require('*/cartridge/scripts/idmPreferences');
        var passwordRequirements = require('*/cartridge/scripts/helpers/accountHelpers').getPasswordRequirements();
        var passwordForm = server.forms.getForm('newPasswords');
        var newPassword = passwordForm.newpassword.htmlValue;
        var confirmPassword = passwordForm.newpasswordconfirm.htmlValue;
        if (newPassword !== confirmPassword) {
            passwordForm.valid = false;
            passwordForm.newpasswordconfirm.valid = false;
            passwordForm.newpasswordconfirm.error =
                Resource.msg('error.message.mismatch.newpassword', 'forms', null);
        }
        // form validation
        if (passwordForm.valid && !idmPreferences.isIdmEnabled && !CustomerMgr.isAcceptablePassword(passwordForm.newpassword.value)) {
            passwordForm.newpassword.valid = false;
            passwordForm.newpassword.error = passwordRequirements.errorMsg;
            passwordForm.valid = false;
        }

        if (passwordForm.valid) {
            var order = OrderMgr.getOrder(req.querystring.ID);
            if (!order || order.customer.ID !== req.currentCustomer.raw.ID || order.getUUID() !== req.querystring.UUID) {
                res.json({ error: [Resource.msg('error.message.unable.to.create.account', 'login', null)] });
                return next();
            }
            res.setViewData({ orderID: req.querystring.ID });
            var registrationObj = {
                email: order.customerEmail,
                password: newPassword
            };
            res.setViewData(registrationObj);
            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                var registrationData = res.getViewData();
                var login = registrationData.email;
                var password = registrationData.password;
                var newCustomer;
                var errorObj = {};
                var newOrder = OrderMgr.getOrder(res.getViewData().orderID);
                delete registrationData.email;
                delete registrationData.password;
                // attempt to create a new user and log that user in.
                try {
                    Transaction.wrap(function () {
                        var error = {};
                        passwordForm = res.getViewData();
                        var authenticatedCustomer = (idmPreferences.isIdmEnabled)
                                                    ? accountHelpers.createIDMAccount(login, password)
                                                    : accountHelpers.createSFCCAccount(login, password);
                        if (!authenticatedCustomer.authCustomer) {
                            error = {
                                authError: true,
                                status: authenticatedCustomer.errorMessage
                            };
                            throw error;
                        }
                        // assign values to the profile
                        newCustomer = authenticatedCustomer.authCustomer;
                        newOrder.setCustomer(newCustomer);
                        // save all used shipping addresses to address book of the logged in customer
                        var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
                        var allAddresses = addressHelpers.gatherShippingAddresses(newOrder);
                        allAddresses.forEach(function (address) {
                            addressHelpers.saveAddress(address, { raw: newCustomer }, addressHelpers.generateAddressName(address));
                        });
                    });
                } catch (e) {
                    errorObj.error = true;
                    errorObj.errorMessage = e.authError
                        ? Resource.msg('error.message.unable.to.create.account', 'login', null)
                        : Resource.msg('error.message.account.create.error', 'forms', null);
                }
                // wishlist append code
                var listGuest = viewData.list;
                if (viewData.success && newOrder) {
                    var listLoggedIn = productListHelper.getList(newCustomer, { type: TYPE_WISH_LIST });
                    productListHelper.mergelists(listLoggedIn, listGuest, req, { type: TYPE_WISH_LIST });
                }
                // render json
                if (errorObj.error) {
                    // clearing other info
                    res.viewData = {}; // eslint-disable-line
                    res.json({ error: [errorObj.errorMessage] });
                    return;
                }
                // clearing other info
                res.viewData = {}; // eslint-disable-line
                res.json({
                    success: true,
                    redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true)
                });
            });
        } else {
            // clearing other info
            res.viewData = {}; // eslint-disable-line
            res.json({
                fields: formErrors.getFormErrors(passwordForm)
            });
        }
        next();
    }
);
module.exports = server.exports();
