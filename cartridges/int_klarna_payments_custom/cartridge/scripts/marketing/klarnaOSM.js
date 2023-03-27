'use strict';

var superModule = module.superModule;

/**
 * Klarna On-Site Messaging Component
 */
var KlarnaOSM = {
    /**
     * Function that checks if OSM is enabled for cart
     * @return {boolean} enable status
     */
    isEnabledCartPage: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var value = localeObject && 'osmCartEnabled' in localeObject.custom && localeObject.custom.osmCartEnabled ? localeObject.custom.osmCartEnabled : null;

        return value;
    },
    /**
     * Function that checks if OSM is enabled for cart page tag
     * @return {boolean} enable status
     */
    getCartPagePlacementTagId: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var value = localeObject && 'osmCartTagId' in localeObject.custom && localeObject.custom.osmCartTagId ? localeObject.custom.osmCartTagId : null;

        return value;
    },
    /**
     * Function that checks if OSM is enabled for PDP
     * @return {boolean} enable status
     */
    isEnabledPDPPage: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var value = localeObject && 'osmPDPEnabled' in localeObject.custom && localeObject.custom.osmPDPEnabled ? localeObject.custom.osmPDPEnabled : null;

        return value;
    },
    /**
     * Function that checks if OSM is enabled for PDP page tag
     * @return {boolean} enable status
     */
    getPDPPagePlacementTagId: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var value = localeObject && 'osmPDPTagId' in localeObject.custom && localeObject.custom.osmPDPTagId ? localeObject.custom.osmPDPTagId : null;

        return value;
    },
    /**
     * Function that checks if OSM is enabled for header
     * @return {boolean} enable status
     */
    isEnabledHeader: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var value = localeObject && 'osmHeaderEnabled' in localeObject.custom && localeObject.custom.osmHeaderEnabled ? localeObject.custom.osmHeaderEnabled : null;

        return value;
    },
    /**
     * Function that checks if OSM is enabled for header placement tag
     * @return {boolean} enable status
     */
    getHeaderPlacementTagId: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var value = localeObject && 'osmHeaderTagId' && localeObject.custom && localeObject.custom.osmHeaderTagId ? localeObject.custom.osmHeaderTagId : null;

        return value;
    },
    /**
     * Function that checks if OSM is enabled for footer
     * @return {boolean} enable status
     */
    isEnabledFooter: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var value = localeObject && 'osmFooterEnabled' in localeObject.custom && localeObject.custom.osmFooterEnabled ? localeObject.custom.osmFooterEnabled : null;

        return value;
    },
    /**
     * Function that checks if OSM is enabled for footer tag
     * @return {boolean} enable status
     */
    getFooterPlacementTagId: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var value = localeObject && 'osmFooterTagId' in localeObject.custom && localeObject.custom.osmFooterTagId ? localeObject.custom.osmFooterTagId : null;

        return value;
    },
    /**
     * Function that checks if OSM is enabled for info page
     * @return {boolean} enable status
     */
    isEnabledInfoPage: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var value = localeObject && 'osmInfoPageEnabled' in localeObject.custom && localeObject.custom.osmInfoPageEnabled ? localeObject.custom.osmInfoPageEnabled : null;

        return value;
    },
    /**
     * Function that checks if OSM is enabled for info page tag
     * @return {boolean} enable status
     */
    getInfoPagePlacementTagId: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var value = localeObject && 'osmInfoPageTagId' in localeObject.custom && localeObject.custom.osmInfoPageTagId ? localeObject.custom.osmInfoPageTagId : null;

        return value;
    },
    /**
     * Function that checks if OSM attribute "data-inline" is enabled for PDP/Cart placements
     * @return {boolean} enable status
     */
    isEnabledDataInline: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var value = localeObject && 'osmDataInlineEnabled' in localeObject.custom && localeObject.custom.osmDataInlineEnabled ? localeObject.custom.osmDataInlineEnabled : null;

        return value;
    },
    /**
     * Function that returns OSM client ID
     * @return {string} clientID
     */
    getUCI: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var uci = localeObject && 'osmUCI' in localeObject.custom && localeObject.custom.osmUCI ? localeObject.custom.osmUCI : null;

        return uci;
    },
    /**
     * Function that returns OSM library URL
     * @return {string} library URL
     */
    getScriptURL: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        var url = localeObject && 'osmLibraryUrl' in localeObject.custom && localeObject.custom.osmLibraryUrl ? localeObject.custom.osmLibraryUrl : null;

        return url;
    },
    getExpressButtonScriptURL: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebLibraryUrl' in localeObject.custom && localeObject.custom.kebLibraryUrl ? localeObject.custom.kebLibraryUrl : null;
    },
    getExpressButtonMID: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebMerchantID' in localeObject.custom && localeObject.custom.kebMerchantID ? localeObject.custom.kebMerchantID : null;
    },
    isEnabledExpressButtonCheckout: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebCheckoutEnabled' in localeObject.custom && localeObject.custom.kebCheckoutEnabled ? localeObject.custom.kebCheckoutEnabled : false;
    },
    getExpressButtonLabel: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebLabel' in localeObject.custom && localeObject.custom.kebLabel ? localeObject.custom.kebLabel : 'klarna';
    },
    isEnabledExpressButtonCart: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebCartEnabled' in localeObject.custom && localeObject.custom.kebCartEnabled ? localeObject.custom.kebCartEnabled : false;
    },
    isEnabledExpress: function () {
        return this.isEnabledExpressButtonCheckout();
    },
    getExpressButtonTheme: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebTheme' in localeObject.custom && localeObject.custom.kebTheme && localeObject.custom.kebTheme.value ? localeObject.custom.kebTheme.value : 'default';
    },
    getExpressButtonEnvironment: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebEnvironment' in localeObject.custom && localeObject.custom.kebEnvironment && localeObject.custom.kebEnvironment.value ? localeObject.custom.kebEnvironment.value : 'playground';
    },
    getExpressButtonCategory: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebCategory' in localeObject.custom && localeObject.custom.kebCategory ? localeObject.custom.kebCategory : '';
    },
    isEnabledMCExpressButton: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebMCEnabled' in localeObject.custom && localeObject.custom.kebMCEnabled ? localeObject.custom.kebMCEnabled : false;
    },
    getMCExpressButtonTheme: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebMCTheme' in localeObject.custom && localeObject.custom.kebMCTheme && localeObject.custom.kebMCTheme.value ? localeObject.custom.kebMCTheme.value : 'default';
    },
    getExpressButtonShape: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebShape' in localeObject.custom && localeObject.custom.kebShape && localeObject.custom.kebShape.value ? localeObject.custom.kebShape.value : 'default';
    },
    getMiniCartExpressButtonShape: function () {
        var localeObject = superModule.getKlarnaCountriesObject();
        return localeObject && 'kebMiniCartShape' in localeObject.custom && localeObject.custom.kebMiniCartShape && localeObject.custom.kebMiniCartShape.value ? localeObject.custom.kebMiniCartShape.value : 'default';
    }
};

module.exports = superModule;
module.exports.isEnabledCartPage = KlarnaOSM.isEnabledCartPage;
module.exports.getCartPagePlacementTagId = KlarnaOSM.getCartPagePlacementTagId;
module.exports.isEnabledPDPPage = KlarnaOSM.isEnabledPDPPage;
module.exports.getPDPPagePlacementTagId = KlarnaOSM.getPDPPagePlacementTagId;
module.exports.isEnabledHeader = KlarnaOSM.isEnabledHeader;
module.exports.getHeaderPlacementTagId = KlarnaOSM.getHeaderPlacementTagId;
module.exports.isEnabledFooter = KlarnaOSM.isEnabledFooter;
module.exports.getFooterPlacementTagId = KlarnaOSM.getFooterPlacementTagId;
module.exports.getInfoPagePlacementTagId = KlarnaOSM.getInfoPagePlacementTagId;
module.exports.isEnabledDataInline = KlarnaOSM.isEnabledDataInline;
module.exports.getUCI = KlarnaOSM.getUCI;
module.exports.getScriptURL = KlarnaOSM.getScriptURL;
module.exports.getExpressButtonScriptURL = KlarnaOSM.getExpressButtonScriptURL;
module.exports.getExpressButtonMID = KlarnaOSM.getExpressButtonMID;
module.exports.isEnabledExpressButtonCart = KlarnaOSM.isEnabledExpressButtonCart;
module.exports.getExpressButtonTheme = KlarnaOSM.getExpressButtonTheme;
module.exports.getExpressButtonEnvironment = KlarnaOSM.getExpressButtonEnvironment;
module.exports.getExpressButtonCategory = KlarnaOSM.getExpressButtonCategory;
module.exports.isEnabledMCExpressButton = KlarnaOSM.isEnabledMCExpressButton;
module.exports.getMCExpressButtonTheme = KlarnaOSM.getMCExpressButtonTheme;
module.exports.getExpressButtonShape = KlarnaOSM.getExpressButtonShape;
module.exports.getMiniCartExpressButtonShape = KlarnaOSM.getMiniCartExpressButtonShape;
module.exports.isEnabledExpressButtonCheckout = KlarnaOSM.isEnabledExpressButtonCheckout;
module.exports.getExpressButtonLabel = KlarnaOSM.getExpressButtonLabel;
module.exports.isEnabledExpress = KlarnaOSM.isEnabledExpress;

