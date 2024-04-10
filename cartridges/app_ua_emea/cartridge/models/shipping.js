'use strict';
var base = module.superModule;
var URLUtils = require('dw/web/URLUtils');
var Locale = require('dw/util/Locale');
var collections = require('*/cartridge/scripts/util/collections');
var logger = require('dw/system/Logger').getLogger('paazlAPI', 'paazl');

/**
 * Returns the matching address ID or UUID for a shipping address
 * @param {dw.order.Shipment} shipment - line items model
 * @param {Object} customer - customer model
 * @return {string|boolean} returns matching ID or false
*/
function getAssociatedAddress(shipment, customer) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var address = shipment ? shipment.shippingAddress : null;
    var matchingId;
    var anAddress;
    var countryCode = Locale.getLocale(request.locale).country;
    var internationalShippingCountriesList = COHelpers.getInternationalShippingCountriesList(countryCode);
    var hasInternationalShippingCountriesList = internationalShippingCountriesList && internationalShippingCountriesList.length > 0;

    if (!address) return false;

    // If we still haven't found a match, then loop through customer addresses to find a match
    if (!matchingId && customer && customer.addressBook && customer.addressBook.addresses) {
        for (var j = 0, jj = customer.addressBook.addresses.length; j < jj; j++) {
            anAddress = customer.addressBook.addresses[j];
            if (anAddress && anAddress.isEquivalentAddress(address) && address.countryCode && (address.countryCode.value === Locale.getLocale(request.locale).country || (hasInternationalShippingCountriesList && internationalShippingCountriesList.indexOf(anAddress.countryCode.value) !== -1))) { // eslint-disable-line
                matchingId = anAddress.ID;
                break;
            }
        }
    }

    return matchingId;
}

/**
 * @constructor
 * @classdesc Model that represents shipping information
 *
 * @param {dw.order.Shipment} shipment - the default shipment of the current basket
 * @param {Object} address - the address to use to filter the shipping method list
 * @param {Object} customer - the current customer model
 * @param {string} containerView - the view of the product line items (order or basket)
 */
function ShippingModel(shipment, address, customer, containerView) {
    base.call(this, shipment, address, customer, containerView);
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    this.giftItems = productHelpers.showGiftBoxes();
    const Site = require('dw/system/Site');
    if ('isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled')) {
        var StoreMgr = require('dw/catalog/StoreMgr');
        var products = collections.map(shipment.productLineItems, function (item) {
            var productItem = item.product ? item.product.ID : item.productID;
            return productItem + ':' + item.quantity.value;
        }).join(',');
        this.pickupInstoreUrl = URLUtils.url('Stores-InventorySearch', 'showMap', false, 'products', products, 'isForm', false).toString();
        if (shipment.custom && shipment.custom.fromStoreId) {
            var store = StoreMgr.getStore(shipment.custom.fromStoreId);
            if (store) {
                this.storeName = store.name;
            }
        }
    }
    this.matchingAddressId = getAssociatedAddress(shipment, customer);

    var isPaazlEnabled = Site.current.getCustomPreferenceValue('paazlEnabled');
    if (isPaazlEnabled) {
        // From Paazl cartridge
        var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
        var currentPaazlShippingMethodID = paazlHelper.getShippingMethodID();
        var paazlStatus = paazlHelper.getPaazlStatus(shipment);
        if (paazlStatus.active && shipment && shipment.custom.paazlDeliveryInfo) {
            // In case of PICKUP_LOCATION, get the PICKUP_LOCATION to use in the shipping summary
            this.pickupPointAddress = null;
            var paazlDeliveryInfo = null;
            try {
                paazlDeliveryInfo = JSON.parse(shipment.custom.paazlDeliveryInfo);
                if (paazlDeliveryInfo.deliveryType === 'PICKUP_LOCATION' && paazlDeliveryInfo.pickupLocation && paazlDeliveryInfo.pickupLocation.address) {
                    this.pickupPointAddress = paazlDeliveryInfo.pickupLocation.address;
                }
            } catch (error) {
                this.pickupPointAddress = this.shippingAddress;
                logger.error('Error parsing custom attribute paazlDeliveryInfo from shipment. Error: {0}.', error);
            }
            var PaazlShippingMethodModel = require('*/cartridge/models/shipping/paazlShippingMethod');
            this.selectedShippingMethod = new PaazlShippingMethodModel(paazlDeliveryInfo);
            if (paazlDeliveryInfo && paazlDeliveryInfo.name) {
                this.selectedShippingMethod.displayName = paazlDeliveryInfo.name;
            }
        } else if (shipment && shipment.shippingMethodID === currentPaazlShippingMethodID && shipment.custom.paazlSelectedShippingMethod) {
            this.selectedShippingMethod.displayName = shipment.custom.paazlSelectedShippingMethod;
        }
        var countryCode = Locale.getLocale(request.locale).country; // eslint-disable-line no-undef
        this.restrictPickUpOption = 'paazlPickUpRestrictedCountries' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('paazlPickUpRestrictedCountries') && Site.current.getCustomPreferenceValue('paazlPickUpRestrictedCountries').indexOf(countryCode) > -1;
    }
}

module.exports = ShippingModel;
