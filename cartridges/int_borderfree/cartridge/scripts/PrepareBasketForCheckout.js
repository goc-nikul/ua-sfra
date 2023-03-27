'use strict';

/**
 *  
 * Single shipping allows only one shipment, shipping address, and shipping method per order.
 *
 * @input Basket: dw.order.Basket Basket object
 */

/* API Includes */
var ShippingMgr = require('dw/order/ShippingMgr');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');


exports.updateBasket = function (cart, bfxOrder) {
    if (!empty(cart)) {
        setBorderFreeShippingMethod(cart);
        createShippingAddress(cart, bfxOrder);
        createBillingAddress(cart);
    }
};

function setBorderFreeShippingMethod(cart) {

    // Determine the list of applicable shipping methods.
    var borderFreeShippingId = dw.system.Site.current.getCustomPreferenceValue('bfxShippingMethodID') || 'Borderfree';
    var shipment = cart.getDefaultShipment();
    var shippingMethods = ShippingMgr.getAllShippingMethods();
    var shippingMethodsIter = shippingMethods.iterator();
    while (shippingMethodsIter.hasNext()) {
        var method = shippingMethodsIter.next();
        if (!method.ID.equals(borderFreeShippingId)) continue;
        // set this shipping method
        shipment.setShippingMethod(method);
    }
}

function createShippingAddress(cart, bfxOrderJSON) {
    var bfxOrder = bfxOrderJSON;
    try {
        bfxOrder = JSON.parse(bfxOrderJSON.value);
    } catch (e) {}
    
    var defaultShipment = cart.getDefaultShipment();
    var shippingAddress = defaultShipment.shippingAddress;
    // if the shipment has no shipping address yet, create one
    if (shippingAddress == null) {
        shippingAddress = defaultShipment.createShippingAddress();
    }

    var domesticProfileExists = false;
    var domesticProfile = null;
    if (!empty(bfxOrder) && !empty(bfxOrder.domesticProfile) && bfxOrder.domesticProfile != null) {
        domesticProfile = bfxOrder.domesticProfile;
        domesticProfileExists = true;
    }
    Transaction.wrap(function () {
        if (domesticProfileExists) {
            var bfxShipping = !empty(domesticProfile.Shipping) ? domesticProfile.Shipping : null;
            if (!empty(bfxShipping) && !empty(bfxShipping.firstName)) {
                shippingAddress.setFirstName(bfxShipping.firstName);
            }
            if (!empty(bfxShipping) && !empty(bfxShipping.lastName)) {
                shippingAddress.setLastName(bfxShipping.lastName);
            }
            if (!empty(bfxShipping) && !empty(bfxShipping.addressLine1)) {
                shippingAddress.setAddress1(bfxShipping.addressLine1);
            }
            if (!empty(bfxShipping) && !empty(bfxShipping.addressLine2)) {
                shippingAddress.setAddress2(bfxShipping.addressLine2);
            }
            if (!empty(bfxShipping) && !empty(bfxShipping.city)) {
                shippingAddress.setCity(bfxShipping.city);
            }
            if (!empty(bfxShipping) && !empty(bfxShipping.postalCode)) {
                shippingAddress.setPostalCode(bfxShipping.postalCode);
            }
            if (!empty(bfxShipping) && !empty(bfxShipping.region)) {
                shippingAddress.setStateCode(bfxShipping.region);
            }
            if (!empty(bfxShipping) && !empty(bfxShipping.country)) {
                shippingAddress.setCountryCode(bfxShipping.country);
            }
            if (!empty(bfxShipping) && !empty(bfxShipping.primaryPhone)) {
                shippingAddress.setPhone(bfxShipping.primaryPhone);
            }
            
        } else {

            shippingAddress.setFirstName(dw.system.Site.current.getCustomPreferenceValue('bfxShippingFirstName'));

            shippingAddress.setLastName(dw.system.Site.current.getCustomPreferenceValue('bfxShippingLastName'));

            shippingAddress.setAddress1(dw.system.Site.current.getCustomPreferenceValue('bfxShippingAddress1'));

            shippingAddress.setAddress2(dw.system.Site.current.getCustomPreferenceValue('bfxShippingAddress2'));

            shippingAddress.setCity(dw.system.Site.current.getCustomPreferenceValue('bfxShippingCity'));

            shippingAddress.setPostalCode(dw.system.Site.current.getCustomPreferenceValue('bfxShippingPostalCode'));

            shippingAddress.setStateCode(dw.system.Site.current.getCustomPreferenceValue('bfxShippingStateCode'));

            shippingAddress.setCountryCode(dw.system.Site.current.getCustomPreferenceValue('bfxShippingCountryCode'));
        
            shippingAddress.setPhone(dw.system.Site.current.getCustomPreferenceValue('bfxShippingPhone'));
        }
    });
}
 




/**
 * this function creates a billing address if not present and updates billing info accordingly.
 * @param cart
 * @returns
 */

function createBillingAddress(cart) {

    var billingAddress = cart.getBillingAddress();
    Transaction.wrap(function () {
        if (!billingAddress) {
            billingAddress = cart.createBillingAddress();
        }
    	billingAddress.setFirstName( dw.system.Site.current.getCustomPreferenceValue('bfxBillingFirstName') );
    	billingAddress.setLastName( dw.system.Site.current.getCustomPreferenceValue('bfxBillingLastName') );
    	billingAddress.setAddress1( dw.system.Site.current.getCustomPreferenceValue('bfxBillingAddress1') );
    	billingAddress.setAddress2( dw.system.Site.current.getCustomPreferenceValue('bfxBillingAddress2') );
    	billingAddress.setCity( dw.system.Site.current.getCustomPreferenceValue('bfxBillingCity') );
    	billingAddress.setPostalCode( dw.system.Site.current.getCustomPreferenceValue('bfxBillingPostalCode') );
    	billingAddress.setStateCode( dw.system.Site.current.getCustomPreferenceValue('bfxBillingStateCode') );
    	billingAddress.setCountryCode( dw.system.Site.current.getCustomPreferenceValue('bfxBillingCountryCode') );
    	billingAddress.setPhone( dw.system.Site.current.getCustomPreferenceValue('bfxBillingPhone') );

    });
}
