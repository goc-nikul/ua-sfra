var StringUtils = require('dw/util/StringUtils');
var SecureRandom = require('dw/crypto/SecureRandom');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var CacheMgr = require('dw/system/CacheMgr');
var MessageDigest = require('dw/crypto/MessageDigest');
var Bytes = require('dw/util/Bytes');
var Encoding = require('dw/crypto/Encoding');

function Helper() {}

Helper.prototype = {

    getFormattedDate: function() {
        var date = new Date();
        return StringUtils.format('{0}-{1}-{2}', date.getFullYear().toString(), this.insertLeadingZero(date.getMonth() + 1), this.insertLeadingZero(date.getDate()));
    },

    insertLeadingZero: function(number) {
        return number < 10 ? '0' + number : number;
    },
    
    generateHash: function(data) {
        var phrase = typeof data === 'object' ? JSON.stringify(data) : data;
        var digest = new MessageDigest('SHA-256');
        var hash = Encoding.toHex(digest.digestBytes(new Bytes(phrase, 'UTF-8')));

        return hash;
    },

    /**
     * @description creates a hash from basket product IDs, shipping data and requiest ID.
     * @param {Basket} basket
     * 
     * @returns {String}
     */
    getBasketHash: function(basket) {
        var basketShipments = basket.getShipments().iterator();
        var hashObj = [];
        while (basketShipments.hasNext()) {
            var currentShipment = basketShipments.next();
            var shippingAddress = currentShipment.getShippingAddress();
            var products = currentShipment.getProductLineItems().iterator();
            var shipments = currentShipment.getShippingLineItems().iterator();
            var today = new Date();
            var timestamp = today.getDate() + today.getMonth() + today.getFullYear();
            var obj = {
                timestamp: timestamp,
                productLineItems: [],
                shippingLineItems: [],
                shippingAddress: {},
                isCustomerAuthenticated: basket.customer.authenticated
            };
    
            // get product values
            while (products.hasNext()) {
                var pli = products.next();
                var pliObj = {
                    id: pli.getProduct().getID(),
                    qty: pli.getQuantity().getValue(),
                    price: pli.getProratedPrice().getValueOrNull()
                };
    
                obj.productLineItems.push(pliObj);
            }
    
            // get shipment values
            while (shipments.hasNext()) {
                var shipment = shipments.next();
                var shipmentObj = {
                    id: currentShipment.shippingMethodID,
                    price: shipment.getAdjustedPrice().getValue()
                };
    
                obj.shippingLineItems.push(shipmentObj);
            }
    
            // get address values
            if (obj.shippingAddress && shippingAddress) {
                obj.shippingAddress.address1 = shippingAddress.getAddress1() || '';
                obj.shippingAddress.address2 = shippingAddress.getAddress2() || '';
                obj.shippingAddress.city = shippingAddress.getCity() || '';
                obj.shippingAddress.postalCode = shippingAddress.getPostalCode() || '';
                obj.shippingAddress.countryCode = shippingAddress.getCountryCode().value || '';
            }
            hashObj.push(obj);
        }

        // generate hash
        return this.generateHash(hashObj);
    },

    beautifyAddresses: function(form, addresses) {
        var random = new SecureRandom();
        if (!addresses.length || ('postalAddress' in addresses[0] && empty(addresses[0].postalAddress))) {
            return [];
        }
        var items = [];
        for (var i in addresses) {
            var address = addresses[i];

            try {
                if (address.postalAddress) {
                    address = address.postalAddress[0];
                }
            } catch (e) {
                // do nothing
                // address@TaxLookupArea throw an exception in case undefined method instead undefined value
            }

            var newAddress = {
                UUID: random.nextInt(),
                ID: address.city,
                key: address.postalCode + address.mainDivision + address.streetAddress1 + address.streetAddress2 + address.city + address.country,
                countryCode: (address.country.toLowerCase()).substring(0, address.country.length - 1),
                postalCode: address.postalCode,
                stateCode: address.mainDivision,
                address1: address.streetAddress1 == null ? form.address1.value : address.streetAddress1,
                address2: address.streetAddress2,
                displayValue: address.city,
                city: address.city
            };

            items.push(newAddress);
        }
        return items;
    },

    getCurrentNormalizedAddress: function() {
        var form = null;
        var postal = null;
        var state = null;
        if (request.httpParameterMap.multishipping && request.httpParameterMap.multishipping.value) {
            if (session.forms.multishipping) {
                form = session.forms.multishipping.editAddress.addressFields;
                postal = form.postal.value;
                state = form.states.state.value;
            }
        } else {
            if (session.forms.singleshipping) {
                form = session.forms.singleshipping.shippingAddress.addressFields;
                postal = form.postal.value;
                state = form.states.state.value;
            } else if (session.forms.shipping.shippingAddress) {
                form = session.forms.shipping.shippingAddress.addressFields;
                postal = form.postalCode.value;
                state = form.states.stateCode.value;
            }
        }

        return {
            UUID: form.UUID,
            ID: form.city.value,
            key: Resource.msg('form.label.asis', 'vertex', null),
            address1: form.address1.value,
            address2: form.address2.value,
            city: form.city.value,
            postalCode: postal,
            stateCode: state,
            countryCode: form.country.value,
            displayValue: form.city.value
        };
    },

    /**
     * @description check if selected address fields and address fields in the form are identical.
     * address2 field isn't required, so we skip this field.
     */
    isEqualAddresses: function(normalizedAddresses) {
        var restrictedFields = ['ID', 'key', 'UUID', 'displayValue', 'address2'],
            normalizedForm = this.getCurrentNormalizedAddress();

        if (session.custom.VertexAddressSuggestions) {
            var previousForm = JSON.parse(session.custom.VertexAddressSuggestions)[0];
            var currentForm = normalizedForm;
            var formsIsEqual = true;
            var formKeys = Object.keys(previousForm);

            for (var i in Object.keys(previousForm)) {
                var formFieldValue = previousForm[formKeys[i]];
                if (restrictedFields.indexOf(formKeys[i]) == -1) {
                    if (formFieldValue.toUpperCase() != currentForm[formKeys[i]].toUpperCase()) {
                        formsIsEqual = false;
                    }
                }
            }

            if (formsIsEqual) {
                normalizedAddresses.push(normalizedForm);
            }
        }

        for (var i in normalizedAddresses) {
            var address = normalizedAddresses[i];
            var formIsEqual = true;
            var formKeys = Object.keys(address);

            for (var k in formKeys) {
                var fieldKey = formKeys[k];
                if (restrictedFields.indexOf(fieldKey) == -1) {
                    var fieldValue = address[fieldKey];

                    if (normalizedForm[fieldKey].toUpperCase() != fieldValue.toUpperCase()) {
                        formIsEqual = false;
                    }
                }
            }

            if (formIsEqual) {
                return true;
            }
        }

        return false;
    },

    /**
     * @description get Product TaxClass ID
     * @param {string} productWrap -  ProductLineItem
     * @returns {string} Tax Class ID
     */
    getProductClass: function(productWrap) {
        return productWrap.product ? productWrap.getProduct().getTaxClassID() : '';
    },

    /**
     * @description get Shipping TaxClass ID
     * @param {dw.order.ShippingLineItem} shippingLineItem -  ProductLineItem
     * @returns {string} Tax Class ID
     */
    getShippingLineClass: function(shippingLineItem) {
        return shippingLineItem ? shippingLineItem.getTaxClassID() : '';
    },

    prepareCart: function(cart) {
        var GCs = cart.getGiftCertificateLineItems();
        var Products = cart.getAllProductLineItems();

        if (GCs.length) {
            var GCsi = GCs.iterator();
            Transaction.wrap(function() {
                while (GCsi.hasNext()) {
                    var GC = GCsi.next();
                    GC.updateTax(0.00);
                }
            });
        }

        // if we have only GC in the cart we should set zero tax to the default shipment
        if (!Products.length) {
            var lineItems = cart.getAllLineItems().iterator();

            while (lineItems.hasNext()) {
                var item = lineItems.next();
                var itemClassName = item.constructor.name;

                if (itemClassName == 'dw.order.ShippingLineItem') {
                    Transaction.wrap(function() {
                        item.updateTax(0.00);
                    });
                }
            }
        }
    },

    /**
     * @description Update the tax for Price adjustments if vertex is skipped
     * @param {Basket} basket
     * @returns {boolean} boolean value
     */
    recalculatePriceAdjustmentsTax: function (basket) {
        var shipments = basket.shipments.iterator();
        while (shipments.hasNext()) {
            var shipment = shipments.next();
            var lineItems = shipment.allLineItems.iterator();

            while (lineItems.hasNext()) {
                var lineItem = lineItems.next();
                var className = lineItem.constructor.name;
                if (className == 'dw.order.PriceAdjustment') {
                    lineItem.updateTax(0.00);
                }
            }
        }
        if (!basket.getPriceAdjustments().empty || !basket.getShippingPriceAdjustments().empty) {
            // calculate a mix tax rate from
            var basketPriceAdjustmentsTaxRate = (basket.getMerchandizeTotalGrossPrice().value / basket.getMerchandizeTotalNetPrice().value) - 1;

            var basketPriceAdjustments = basket.getPriceAdjustments().iterator();
            while (basketPriceAdjustments.hasNext()) {
                var basketPriceAdjustment = basketPriceAdjustments.next();
                basketPriceAdjustment.updateTax(0.00);
            }

            var basketShippingPriceAdjustments = basket.getShippingPriceAdjustments().iterator();
            while (basketShippingPriceAdjustments.hasNext()) {
                var basketShippingPriceAdjustment = basketShippingPriceAdjustments.next();
                basketShippingPriceAdjustment.updateTax(0.00);
            }
        }
        return true;
    }
};

module.exports = new Helper();