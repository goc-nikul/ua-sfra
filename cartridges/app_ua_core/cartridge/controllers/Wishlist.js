/**
* Description of the Controller and the logic it provides
*
* @module  controllers/Wishlist
*/

'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
const TYPE_WISH_LIST = require('dw/customer/ProductList').TYPE_WISH_LIST;
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var PAGE_SIZE_ITEMS = 15;
server.extend(module.superModule);

server.get('SortList', function (req, res, next) {
	// wishlist sorting options
    var sortRule = req.querystring.sortRule;
    var publicView = (req.querystring.publicView === 'true') || false;
    var list;
    if (publicView && req.querystring.id) {
        var productListMgr = require('dw/customer/ProductListMgr');
        list = productListMgr.getProductList(req.querystring.id);
    } else {
        list = productListHelper.getList(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
    }
    var WishlistModel = require('*/cartridge/models/productList');
    var wishlistModel = new WishlistModel(
        list,
        {
            type: 'wishlist',
            publicView: publicView,
            pageSize: PAGE_SIZE_ITEMS,
            pageNumber: req.querystring.pageNumber || 1,
            sortRule: sortRule
        }
    ).productList;

    var publicOption = list.owner
        ? req.currentCustomer.raw.ID === list.owner.ID
        : false;
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
    var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();

    res.render('/wishlist/components/list', {
        wishlist: wishlistModel,
        publicOption: publicOption,
        actionUrls: {
            updateQuantityUrl: ''
        },
        enableAvailablePerLocale: enableAvailablePerLocale
    });
    next();
});

server.replace('Show', consentTracking.consent, server.middleware.https, csrfProtection.generateToken, function (req, res, next) {
    var list = productListHelper.getList(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
    var WishlistModel = require('*/cartridge/models/productList');
    var userName = '';
    var firstName;
    var rememberMe = false;
    if (req.currentCustomer.credentials) {
        rememberMe = true;
        userName = req.currentCustomer.credentials.username;
    }
    var loggedIn = req.currentCustomer.profile;

    var target = req.querystring.rurl || 1;
    var actionUrl = URLUtils.url('Account-Login');
    var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', target).relative().toString();
    var navTabValue = req.querystring.action;
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        }
    ];
    if (loggedIn) {
        firstName = req.currentCustomer.profile.firstName;
        breadcrumbs.push({
            htmlValue: Resource.msg('page.title.myaccount', 'account', null),
            url: URLUtils.url('Account-Show').toString()
        });
    }

    var profileForm = server.forms.getForm('profile');
    profileForm.clear();
    var wishlistModel = new WishlistModel(
        list,
        {
            type: 'wishlist',
            publicView: false,
            pageSize: PAGE_SIZE_ITEMS,
            pageNumber: 1,
            sortRule: 'NewestAdded'
        }
    ).productList;
    var listIsEmpty = null;
    if (!empty(list) && list.items) {
        listIsEmpty = list.items.empty;
    }
    if (listIsEmpty && !req.currentCustomer.raw.authenticated && !req.currentCustomer.raw.registered) {
        productListHelper.removeList(req.currentCustomer.raw, list, null);
    }
    // wishlist sorting options
    var ArrayList = require('dw/util/ArrayList');
    var sortOptions = [{
        id: 'NewestAdded',
        displayName: Resource.msg('option.wishlist.newest.added', 'account', null),
        url: URLUtils.url('Wishlist-SortList').toString()
    },
    {
        id: 'OldestAdded',
        displayName: Resource.msg('option.wishlist.oldest.added', 'account', null),
        url: URLUtils.url('Wishlist-SortList').toString()
    }];
    var sortingOptionsList = new ArrayList(sortOptions);
    if (wishlistModel) {
        wishlistModel.wishlistSortOptions = sortingOptionsList;
    }
    // set page meta-data
    var ContentMgr = require('dw/content/ContentMgr');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var contentObj = ContentMgr.getContent('saved-items-page-meta');
    if (contentObj) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
    }
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
    var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
    res.render('/wishlist/wishlistLanding', {
        wishlist: wishlistModel,
        navTabValue: navTabValue || 'login',
        rememberMe: rememberMe,
        userName: userName,
        actionUrl: actionUrl,
        actionUrls: {
            updateQuantityUrl: ''
        },
        profileForm: profileForm,
        breadcrumbs: breadcrumbs,
        oAuthReentryEndpoint: 1,
        loggedIn: loggedIn,
        firstName: firstName,
        socialLinks: loggedIn,
        publicOption: loggedIn,
        createAccountUrl: createAccountUrl,
        canonicalUrl: URLUtils.abs('Wishlist-Show'),
        enableAvailablePerLocale: enableAvailablePerLocale
    });
    next();
}, pageMetaData.computedPageMetaData);

server.replace('MoreList', function (req, res, next) {
    var publicView = (req.querystring.publicView === 'true') || false;
    var list;
    var sortRule = req.querystring.sortRule;
    if (publicView && req.querystring.id) {
        var productListMgr = require('dw/customer/ProductListMgr');
        list = productListMgr.getProductList(req.querystring.id);
    } else {
        list = productListHelper.getList(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
    }
    var WishlistModel = require('*/cartridge/models/productList');
    var wishlistModel = new WishlistModel(
        list,
        {
            type: 'wishlist',
            publicView: publicView,
            pageSize: PAGE_SIZE_ITEMS,
            pageNumber: req.querystring.pageNumber || 1,
            sortRule: sortRule
        }
    ).productList;
    var publicOption = list.owner
        ? req.currentCustomer.raw.ID === list.owner.ID
        : false;
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
    var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
    res.render('/wishlist/components/list', {
        wishlist: wishlistModel,
        publicOption: publicOption,
        actionUrls: {
            updateQuantityUrl: ''
        },
        enableAvailablePerLocale: enableAvailablePerLocale
    });
    next();
});

server.get('Link', function (req, res, next) {
    res.render('/home/wishListLink');
    next();
});

server.get('MobileLink', function (req, res, next) {
    res.render('/home/remoteWishListLink');
    next();
});

server.get('Items', function (req, res, next) {
    var wishlistProductIDs = productListHelper.getProductIds(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
    res.setViewData({
        wishlistProductIDs: wishlistProductIDs
    });
    res.render('wishlist/components/listOfWishlistItems');
    next();
});

server.get('Indicator', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productID = req.querystring.pid;
    var product = ProductMgr.getProduct(productID);
    var masterProduct = product.isMaster() ? product : product.getMasterProduct();
    var productStyle = '';
    var isItemExistsInWishList = false;

    if (product) {
        productStyle = product.custom.style;
        var config = {
            qty: 1,
            req: req,
            type: TYPE_WISH_LIST
        };
        var list = productListHelper.getListNew(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
        isItemExistsInWishList = (list && !list.items.empty) ? productListHelper.itemExists(list, masterProduct.ID, config) : false;
    }

    res.setViewData({
        productID: masterProduct.ID,
        isItemExistsInWishList: isItemExistsInWishList,
        productStyle: productStyle
    });
    res.render('wishlist/remoteWishlistIndicator');
    next();
});

server.replace('RemoveProduct', function (req, res, next) {
    var list = productListHelper.removeItem(req.currentCustomer.raw, req.querystring.pid, { req: req, type: 10 });
    var listIsEmpty = list.prodList && list.prodList.items ? list.prodList.items.empty : '';

    res.json({
        success: true,
        listIsEmpty: listIsEmpty,
        emptyWishlistMsg: listIsEmpty ? Resource.msg('wishlist.empty.text', 'wishlist', null) : ''
    });
    next();
});

module.exports = server.exports();
