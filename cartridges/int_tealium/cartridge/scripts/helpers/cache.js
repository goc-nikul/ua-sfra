'use strict';

/**
* get the Cart data object from session
* @returns {object} value of cart data or null
*/
function getCartCache() {
    if (session.privacy.tealiumCartData) {
        return JSON.parse(session.privacy.tealiumCartData)
    }
    return null;
}

/**
* get the Cart data object from session
* @param {object} cartData
* @returns {boolean} true, if cart Data is set in the session variable
*/
function setCartCache(cartData) {
    if(cartData) {
        session.privacy.tealiumCartData = JSON.stringify(cartData);
        return true;
    }
    return false
}

/**
* check if the cart data is updated
* @param {dw.order.BasketMgr} basket
* @returns {boolean} true, if basket is updated and grand total changes
*/
function checkCartCache(basket){
    const tealiumCartData = getCartCache();
    const formatMoney = require('dw/util/StringUtils').formatMoney;
    const cleanMoney = require('*/cartridge/scripts/tealiumUtils').cleanMoney;
    const grandTotal = cleanMoney(formatMoney(basket.totalGrossPrice));

    return tealiumCartData.cart_total === grandTotal ? true : false;
}        

module.exports = {
    getCartCache : getCartCache,
    setCartCache : setCartCache,
    checkCartCache: checkCartCache 
}