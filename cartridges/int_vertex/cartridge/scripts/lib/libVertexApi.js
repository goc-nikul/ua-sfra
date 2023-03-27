var Logger = require('dw/system/Logger').getLogger('VertexInc');
var constants = require('../constants');
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');
var vertexLogger = require('int_vertex/cartridge/scripts/lib/GeneralLogger');
var moduleName = 'libVertexApi~';

function API() {
    this.isEnabled = constants.isEnabled;
    this.isInvoiceEnabled = constants.isInvoiceEnabled;
    this.isCleansingEnabled = constants.isAddressCleansingEnabled;
    this.isVATEnabled = constants.isVATEnabled;
    this.isHashEnabled = constants.isHashEnabled;
}

API.prototype = {
    DeleteTransaction: function(transactionId, source) {
        var logLocation = moduleName + 'DeleteTransaction()',
            serviceResult = false;
        var TaxService = require('int_vertex/cartridge/scripts/init/initVertexApi.js').CalculateTax;

        try {
            TaxService.setThrowOnError().call('DeleteTransaction', {
                constants: constants,
                transactionId: transactionId,
                sender: source
            });
            serviceResult = true;
        } catch (serviceError) {
            vertexLogger.error(logLocation, 'DeleteTransaction call failed. Cause:' + serviceError.message);
        }

        return serviceResult;
    },
    LookupTaxArea: function(form, cart) {
        var logLocation = moduleName + 'LookupTaxArea()',
            response = {
                result: true,
                message: '',
                addresses: []
            },
            AreaService;
        var Helper = require('../helper/Helper');
        // Start logs block 
        if (!this.isEnabled) {
            vertexLogger.error(logLocation, 'Vertex service is disabled');
            return response;
        }

        if (!this.isCleansingEnabled) {
            vertexLogger.error(logLocation, 'Vertex Address Cleansing is disabled');
            return response;
        }

        this.resetTaxes(cart);

        AreaService = require('int_vertex/cartridge/scripts/init/initVertexApi.js').LookupTaxAreas;
        var lookupResult = AreaService.call(form, constants);

        switch (lookupResult.status) {
            case 'ERROR':
                response.result = false;
                response.message = lookupResult.msg;
                vertexLogger.error(logLocation, response.message || response.msg || response.errorMessage);
                break;
            case 'SERVICE_UNAVAILABLE':
                vertexLogger.error(logLocation, response.message || response.msg || response.errorMessage);
                break;
            default:
                if (typeof lookupResult.object.response == 'string') {
                    response.result = (lookupResult.object.response == 'NORMAL');
                }

                if (response.result && lookupResult.object.addresses.length) {
                    var normalizedAddresses = Helper.beautifyAddresses(form, lookupResult.object.addresses);
                    response.result = Helper.isEqualAddresses(normalizedAddresses);
                    normalizedAddresses.push(Helper.getCurrentNormalizedAddress());
                    response.addresses = normalizedAddresses;
                } else {
                    response.result = false;
                };
                response.message = lookupResult.object.message;
        }
        return response;
    },

    CalculateTax: function(requestType, cart) {
        var logLocation = moduleName + 'CalculateTax()',
            response = {
                result: true,
                message: ''
            },
            TaxService;

        if (!this.isEnabled) {
            vertexLogger.error(logLocation, 'Vertex service is disabled');
            return response;
        }

        if (requestType == 'Invoice' && !this.isInvoiceEnabled) {
            vertexLogger.error(logLocation, 'Vertex Invoice Request is disabled');
            return response;
        }

        TaxService = require('int_vertex/cartridge/scripts/init/initVertexApi.js').CalculateTax;
        var calculationResponse = TaxService.call('CalculateTax', {
            constants: constants,
            requestType: requestType,
            cart: cart
        });

        if (calculationResponse.status) {
            switch (calculationResponse.status) {
                case 'ERROR':
                    response.result = false;
                    response.message = 'Invalid address';
                    vertexLogger.debug(logLocation, 'calculationResponse.status == ERROR');
                    this.resetTaxes(cart);
                    break;
                case 'SERVICE_UNAVAILABLE':
                    response.result = false;
                    response.message = 'Service Unavailable';
                    vertexLogger.error(logLocation, calculationResponse.msg || calculationResponse.errorMessage);
                    this.resetTaxes(cart);
                    break;
                default:
                    /* 
                     * handle invoice request, if it is last we dont need to update order with empty parameters
                     * so just fix in service side that it was invoice call and then return 
                     */
                    if (requestType === 'Invoice') {
                        return response;
                    }
                    var setTaxationDetails = new dw.util.HashSet();
                    if (calculationResponse.object && calculationResponse.object.lineItem) {
                        var totalOrderTax = 0;

                        for (var itemKey in calculationResponse.object.lineItem) {
                            var vertexLineItem = calculationResponse.object.lineItem[itemKey],
                                lineItemId = vertexLineItem.lineItemId,
                                taxRateCount = 0,
                                totalTaxCount = 0,
                                jurisdictionLevel = '',
                                taxRate = 0,
                                calculatedTax = 0,
                                jurisdictionID = 0,
                                additionaTaxRule,
                                additionalTax,
                                additionalTaxKeys = {},
                                taxable;

                            for (var taxes in vertexLineItem.taxes) {
                                var tax = vertexLineItem.taxes[taxes];

                                jurisdictionID = tax.getJurisdiction().getJurisdictionId();
                                jurisdictionLevel = tax.getJurisdiction().getJurisdictionLevel().value();
                                additionaTaxRule = tax.getSummaryInvoiceText();

                                if (additionaTaxRule) {
                                	var additionalTax = tax.getCalculatedTax().get();

                                	switch (additionaTaxRule) {
                                    case 'GST':
                                    	additionalTaxKeys.taxGST = additionalTax;
                                        break;
                                    case 'PST':
                                    	additionalTaxKeys.taxPST = additionalTax;
                                        break;
                                    case 'RST':
                                    	additionalTaxKeys.taxRST = additionalTax;
                                        break;
                                    case 'HST':
                                    	additionalTaxKeys.taxHST = additionalTax;
                                        break;
                                    case 'QST':
                                    	additionalTaxKeys.taxQST = additionalTax;
                                        break;
                                	}
                                }

                                taxRate = tax.getEffectiveRate() * 1;
                                calculatedTax = new Money(tax.getCalculatedTax() * 1, session.getCurrency().currencyCode);

                                setTaxationDetails.add('Line Item: ' + lineItemId);
                                setTaxationDetails.add('FairMarket Value: ' + vertexLineItem.getFairMarketValue());
                                setTaxationDetails.add('Extended Price: ' + vertexLineItem.getExtendedPrice());
                                setTaxationDetails.add('JurisdictionID: ' + jurisdictionID);
                                setTaxationDetails.add('Jurisdiction Level: ' + jurisdictionLevel);
                                if (tax.invoiceTextCode.size()) {
                                	setTaxationDetails.add(' Invoice Tax Code: ' + tax.invoiceTextCode.join('|'));
                                }
                                setTaxationDetails.add('Tax Rate: ' + taxRate);
                                setTaxationDetails.add('Calculated Tax: ' + calculatedTax);

                                taxable = new Money(tax.getTaxable() * 1, session.getCurrency().currencyCode);
                                taxRateCount += tax.getEffectiveRate() * 1; // * 1 convert Decimal to Number;
                                totalTaxCount += tax.getCalculatedTax();
                                totalOrderTax += tax.getCalculatedTax();
                            }

                            Transaction.wrap(function() {
                                var shipments = cart.shipments.iterator();
                                var taxAmount = new Money(totalTaxCount, session.getCurrency().currencyCode);
                                while (shipments.hasNext()) {
                                    var shipment = shipments.next();
                                    var lineItems = shipment.allLineItems.iterator();

                                    while (lineItems.hasNext()) {
                                        var lineItem = lineItems.next();
                                        var className = lineItem.constructor.name;
                                        if (className == 'dw.order.ProductLineItem') {
                                            if ((lineItem.getProduct().getCustom().sku == lineItemId) && shipment.ID == vertexLineItem.projectNumber) {
                                                lineItem.updateTax(taxRateCount, taxable);
                                                lineItem.updateTaxAmount(taxAmount);

                                                // Add additional taxes to PLI
                                                if (Object.keys(additionalTaxKeys).length) {
                                                    Object.keys(additionalTaxKeys).forEach(function (key) {
                                                    	lineItem.custom[key] = additionalTaxKeys[key];
                                                    });
                                                }
                                            }
                                        } else if (className == 'dw.order.ShippingLineItem') {
                                            if (lineItemId === 'SHIPPING' && shipment.ID == vertexLineItem.projectNumber) {
                                                lineItem.updateTax(taxRateCount, taxable);
                                                lineItem.updateTaxAmount(taxAmount);

                                                // Add additional taxes to PLI
                                                if (Object.keys(additionalTaxKeys).length) {
                                                    Object.keys(additionalTaxKeys).forEach(function (key) {
                                                    	lineItem.custom[key] = additionalTaxKeys[key];
                                                    });
                                                }
                                            }
                                        } else if (className == 'dw.order.ProductShippingLineItem') {
                                            if (shipment.ID == vertexLineItem.projectNumber) {
                                                if (lineItem.adjustedPrice.decimalValue != 0.00) {
                                                    lineItem.updateTax(taxRateCount, taxable);
                                                    lineItem.updateTaxAmount(taxAmount);
                                                } else {
                                                    lineItem.updateTax(0.00);
                                                }
                                            }
                                        } else {
                                            // price adjustments...
                                            lineItem.updateTax(0.00);
                                        }
                                    }
                                }

                                if (!cart.getPriceAdjustments().empty || !cart.getShippingPriceAdjustments().empty) {
                                    // calculate a mix tax rate from
                                    var basketPriceAdjustmentsTaxRate = (cart.getMerchandizeTotalGrossPrice().value / cart.getMerchandizeTotalNetPrice().value) - 1;

                                    var basketPriceAdjustments = cart.getPriceAdjustments().iterator();
                                    while (basketPriceAdjustments.hasNext()) {
                                        var basketPriceAdjustment = basketPriceAdjustments.next();
                                        basketPriceAdjustment.updateTax(0.00);
                                    }

                                    var basketShippingPriceAdjustments = cart.getShippingPriceAdjustments().iterator();
                                    while (basketShippingPriceAdjustments.hasNext()) {
                                        var basketShippingPriceAdjustment = basketShippingPriceAdjustments.next();
                                        basketShippingPriceAdjustment.updateTax(0.00);
                                    }
                                }
                            });
                        }

                        Transaction.wrap(function() {
                            // taxationDetails.push('Jurisdiction ID: ' + jurisdictionID);
                            setTaxationDetails.add('Total Tax: ' + Math.round(totalOrderTax * 100) / 100);
                            cart.custom.vertex_Taxation_Details = JSON.stringify(setTaxationDetails.toArray());
                        });

                        // Added extra info logg for Datadoc usage
                        Logger.info("CalculateTax Vertex API call and update tax is success");
                    }
            } // end of switch (calculationResponse.status)
        } // if (calculationResponse.status)
        return response;
    },

    /**
     * Set Taxes to 0.00
     */
    resetTaxes: function(basket) {
        var cart;
        try {
            cart = basket.object;
        } catch (e) {
            cart = basket;
        }

        Transaction.wrap(function() {
            var shipments = cart.getShipments().iterator();
            while (shipments.hasNext()) {
                var shipment = shipments.next();
                var shipmentLineItems = shipment.getAllLineItems().iterator();

                while (shipmentLineItems.hasNext()) {
                    var _lineItem = shipmentLineItems.next();

                    _lineItem.updateTax(0.00);
                }
            }
        });
    },
    /**
     * @example this.log('info' || constants.INFO_LOG, "some errors: {0}", string_variable)
     */
    log: function(level, message, data) {
        var Logger = require('dw/system/Logger').getLogger('VertexInc', 'Vertex.General');
        Logger[level](message, data);
    }
};

module.exports = new API();