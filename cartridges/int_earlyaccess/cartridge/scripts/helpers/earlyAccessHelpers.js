'use strict';

/**
 * Get content asset for EA Customer
 * @param {string} groupID Early Access customer group ID
 * @returns {string} content
 */
function getEAContent(groupID) {
    var ContentMgr = require('dw/content/ContentMgr');
    var contentID = 'EarlyAccess-' + groupID.split(' ').join('-');
    var content = ContentMgr.getContent(contentID);
    if (!empty(content) && content.online && !empty(content.custom.body) && 'markup' in content.custom.body) {
        return content.custom.body.markup;
    }
    content = ContentMgr.getContent('EarlyAccessFallback');
    return (content.custom.body && content.custom.body.markup) || '';
}

/**
 * Returns master product for given variant
 * @param {dw.catalog.Variant} variant variant product
 * @returns {dw.catalog.Product} master product
 */
function getMasterProductFromVariant(variant) {
    return variant.getVariationModel().master;
}

/**
 * Function to check for early access badge in product.
 * @param {dw.catalog.Product} product product
 * @returns {boolean} true or false
 */
function getEarlyAccessBadge(product) {
    var eaBadge = 'earlyAccessBadge' in product.custom && product.custom.earlyAccessBadge ? product.custom.earlyAccessBadge : '';
    if (empty(eaBadge) && product.variant) {
        var masterProduct = getMasterProductFromVariant(product);
        eaBadge = getEarlyAccessBadge(masterProduct);
    }
    return eaBadge;
}

/**
 *Function to get early access customer group
 * @param {dw.catalog.Product} product product
 * @returns {string} eaCustomerGroup
 */
function getEarlyAccessCustomerGroup(product) {
    var eaCustomerGroup = 'earlyAccessCustomerGroup' in product.custom && product.custom.earlyAccessCustomerGroup ? product.custom.earlyAccessCustomerGroup : '';
    if (empty(eaCustomerGroup) && product.variant) {
        var masterProduct = getMasterProductFromVariant(product);
        eaCustomerGroup = getEarlyAccessCustomerGroup(masterProduct);
    }
    return eaCustomerGroup;
}

/**
 * Function to check if product is early access product or if master product is early access product
 * @param {dw.catalog.Product} product product
 * @returns {Object} Object containing Early Access attributes
 */
function getEarlyAccessConfigs(product) {
    var earlyAccessProductConfig = 'earlyAccessConfigs' in product.custom && product.custom.earlyAccessConfigs.value ? product.custom.earlyAccessConfigs.value : 'NO';
    if (earlyAccessProductConfig === 'NO' && product.variant) {
        var masterProduct = getMasterProductFromVariant(product);
        earlyAccessProductConfig = getEarlyAccessConfigs(masterProduct);
    }
    return earlyAccessProductConfig;
}

/**
 * function to check if current customer is part of early access customer group.
 * @param {dw.catalog.Product} product - product
 * @return {Object} ea attributes
 */
function isEarlyAccessProduct(product) {
    var earlyAccessProductConfig = getEarlyAccessConfigs(product);
    if (earlyAccessProductConfig === 'YES') {
        var eaCustomerGroup = getEarlyAccessCustomerGroup(product);
        if (empty(eaCustomerGroup)) {
            earlyAccessProductConfig = 'NO';
        }
        var eaBadge = getEarlyAccessBadge(product);
        return {
            isEAProduct: earlyAccessProductConfig === 'YES',
            hideProduct: false,
            eaBadge: eaBadge,
            eaCustomerGroup: eaCustomerGroup
        };
    }
    return {
        isEAProduct: false,
        hideProduct: earlyAccessProductConfig === 'HIDE'
    };
}

/**
 * Function to check if customer is member of early access group
 * @param {Array} customerGroups customer groups array
 * @param {string} eaCustomerGroup Early Access customer group
 * @returns {boolean} Early Access Membership
 */
function checkIfMemberOfCustomerGroup(customerGroups, eaCustomerGroup) {
    var eaCustomer = false;
    if (!empty(customerGroups)) {
        eaCustomer = customerGroups.some(customerGroup =>
            customerGroup.ID === eaCustomerGroup
        );
    }
    return eaCustomer;
}

/**
 * function to check if current customer is part of early access customer group.
 * @param {dw.catalog.Product} product - product
 * @returns {boolean} true or false
 */
exports.checkEarlyAccess = (product) => {
    var URLUtils = require('dw/web/URLUtils');
    var eaConfig = isEarlyAccessProduct(product);
    if (eaConfig.isEAProduct) {
        var customer = session.customer;
        var isLoggedIn = customer.registered && (customer.authenticated || customer.externallyAuthenticated);
        var customerGroups = customer.getCustomerGroups().toArray();

        return {
            isEarlyAccessProduct: eaConfig.isEAProduct,
            hideProduct: eaConfig.hideProduct,
            isEarlyAccessCustomer: checkIfMemberOfCustomerGroup(customerGroups, eaConfig.eaCustomerGroup),
            customerGroupId: eaConfig.eaCustomerGroup,
            eaContent: getEAContent(eaConfig.eaCustomerGroup),
            earlyAccessBadge: eaConfig.eaBadge,
            isLoggedIn: isLoggedIn,
            earlyAccessUrl: URLUtils.url('Account-CheckEarlyAccess', 'pid', product.ID).toString()
        };
    }
    return {
        isEarlyAccessProduct: false,
        hideProduct: eaConfig.hideProduct,
        earlyAccessUrl: URLUtils.url('Account-CheckEarlyAccess', 'pid', product.ID).toString()
    };
};
