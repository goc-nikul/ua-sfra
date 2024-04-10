'use strict';

var server = require('server');

var ContentMgr = require('dw/content/ContentMgr');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

server.extend(module.superModule);

server.append('Locale', function (req, res, next) {
    var CountryModel = require('~/cartridge/models/country');
    var Site = require('dw/system/Site');
    var currentSite = Site.getCurrent();
    var siteId = currentSite.getID();
    var viewData = res.getViewData();
    var countryModel = new CountryModel();
    viewData.CountryModel = countryModel;
    viewData.baseCountries = countryModel.getBasicSitesList();
    viewData.shipCountry = session.custom.currentCountry ? session.custom.currentCountry : siteId;
    res.setViewData(viewData);
    next();
});

server.get('CountriesList', function (req, res, next) {
    var PreferencesUtil = require('~/cartridge/scripts/utils/PreferencesUtil');
    var allCountries = PreferencesUtil.getJsonValue('sitesListFull');

    res.render('/components/content/international', {
        displayOrder: allCountries.displayOrder,
        allCountries: allCountries
    });
    // set page meta-data
    var contentObj = ContentMgr.getContent('change-location-page-meta');
    if (contentObj) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
    }
    next();
}, pageMetaData.computedPageMetaData);

server.append('Show', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var ContentMgr = require('dw/content/ContentMgr'); // eslint-disable-line
    var viewData = res.getViewData();
    var url = URLUtils.abs('Page-Show', 'cid', req.querystring.cid);
    var returnUrl = URLUtils.home();
    var contentHelpers = require('*/cartridge/scripts/helpers/contentHelpers');
    var siteMapCategories = contentHelpers.getOnlineSubCategoriesRefactor(dw.catalog.CatalogMgr.getSiteCatalog().getRoot());
    var contentAssetId = req.querystring.cid;
    if (!empty(contentAssetId)) {
        viewData.contentAssetId = contentAssetId;
    }
    if (!empty(contentAssetId) && contentAssetId.indexOf('sizechart') > -1) {
        var isShowBras = false;
        var gender = '';
        var silhouette = '';
        var sizechartArray = contentAssetId.split('-');
        if (!empty(sizechartArray[1]) && sizechartArray[1] !== 'sizechart') {
            gender = sizechartArray[1];
            if (!empty(sizechartArray[2])) {
                silhouette = sizechartArray[2];
            }
        }
        if (gender === 'women') {
            isShowBras = true;
        }
        var contentAssetObj = ContentMgr.getContent(contentAssetId);
        if (!empty(gender) && !empty(silhouette)) {
            viewData.sizechartSubCategoryId = contentAssetId;
        }
        viewData.standaloneSizeChart = contentAssetObj;
        viewData.isShowBras = isShowBras;
        viewData.gender = gender;
        viewData.silhouette = silhouette;
    }
    viewData.siteMapCategories = siteMapCategories;
    viewData.canonicalUrl = url;
    viewData.ReturnURL = returnUrl;
    viewData.pageContext = {
        ns: 'content'
    };
    if (!empty(contentAssetId)) {
        var Content = ContentMgr.getContent(contentAssetId);
        viewData.Content = Content;
        if (contentAssetId === 'contact-us' || contentAssetId === 'shipping-information' || contentAssetId === 'Mexico-Sponsorship') {
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
        } else if (contentAssetId === 'faqs') {
            var folder = dw.content.ContentMgr.getFolder('faq-documents');
            var folderContent = folder.getOnlineContent();
            var titleArray = [];
            var iterator = folderContent.iterator();
            while (iterator.hasNext()) {
                var contentAsset = iterator.next();
                if (contentAsset.online) {
                    var titleTemp = [];
                    titleTemp.push(contentAsset.name, contentAsset.custom.body);
                    titleArray.push(titleTemp);
                }
            }
            viewData.titleArray = titleArray;
            viewData.breadcrumbs = [
                {
                    htmlValue: empty(Content) ? null : Content.name,
                    url: URLUtils.url('Page-Show', 'cid', Content.ID).toString()
                }
            ];
        } else if (contentAssetId === 'returns-and-exchanges') {
            res.redirect(URLUtils.url('Order-GuestReturns'));
        } else if (['customer-service-send-us-message', 'customer-service-send-us-message-success'].indexOf(contentAssetId) > -1) {
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
    }
    res.setViewData(viewData);
    next();
});


/**
 * Page-PolicyBanner : This is a local include that includes privacy policy banner
 * @name Base/Page-PolicyBanner
 * @function
 * @memberof Page
 * @param {middleware} - server.middleware.include
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get(
    'PolicyBanner',
    server.middleware.include,
    function (req, res, next) {
        var isPrivacyBannerCookie = require('*/cartridge/scripts/helpers/productHelpers').privacyBannerCookie();
        res.render('/common/privacybanner', { isPrivacyBannerCookie: isPrivacyBannerCookie });
        next();
    });

server.append('Include', function (req, res, next) {
    var viewData = res.getViewData();
    var content = viewData.content;
    if (!empty(content)) {
        content.template = 'components/content/contentAssetInc';
        res.render(content.template, { content: content });
    }
    next();
});

module.exports = server.exports();
