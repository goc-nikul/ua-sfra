'use strict';


require('dw/system');

const Logger = require('dw/system/Logger').getLogger('ImportOrderShipment');
var Calendar = require('dw/util/Calendar');
var ReturnCaseItem = require('dw/order/ReturnCaseItem');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var Locale = require('dw/util/Locale');
var Money = require('dw/value/Money');
var Quantity = require('dw/value/Quantity');
var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var collections = require('*/cartridge/scripts/util/collections');
var StringUtils = require('dw/util/StringUtils');
var Invoice = require('dw/order/Invoice');
var eodReportMgr = require('*/cartridge/scripts/orders/EODReportMgr');
var TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');
var timezoneHelper = new TimezoneHelper();

var ReturnsUtils = function () {};

ReturnsUtils.prototype = {
    getReturnsPreferences: function (orderCreationDate, returnCaseCount) {
        let orderReturnsEligibility = this.getPreferenceValue('orderReturnsEligibility');
        let refundBufer = Number(Resource.msg('refund.bufferavailability', 'config', 0));
        let isReturnsAvailable = false;
        let expiredDate = false;
        let eligibilityDaysCount;

        if (!empty(orderReturnsEligibility) && !isNaN(orderReturnsEligibility)) {
            var expiredCalendar = new Calendar(new Date(orderCreationDate));
            expiredCalendar.add(Calendar.DAY_OF_YEAR, orderReturnsEligibility);
            expiredDate = expiredCalendar.getTime();
            eligibilityDaysCount = orderReturnsEligibility > refundBufer ? orderReturnsEligibility - refundBufer : 0;
            isReturnsAvailable = !((new Date() > expiredDate || returnCaseCount === 20));
        }
        return { isReturnsAvailable: isReturnsAvailable, expiredDate: expiredDate, eligibilityDaysCount: eligibilityDaysCount };
    },

    /*
	* Returns site preference value for specified preference name. Firstly, tries to get the value from
	* JSON object with country overrides if possible or return a site preference value.
	*/
    getPreferenceValue: function (preferenceName, orderCustomerLocale) {
        var countryOverride = PreferencesUtil.getJsonValue('countryOverride');
        // eslint-disable-next-line no-undef
        var currentLocale = Locale.getLocale(request.locale);
        var countryCode = !empty(orderCustomerLocale) ? orderCustomerLocale.split('_')[1] : !empty(currentLocale) ? currentLocale.getCountry() : null;

        if (empty(countryOverride) || empty(countryCode)) {
            return PreferencesUtil.getValue(preferenceName);
        }

        var preferenceValue = !empty(countryOverride[countryCode]) ? countryOverride[countryCode][preferenceName] : null;

        if (empty(preferenceValue)) {
            preferenceValue = PreferencesUtil.getValue(preferenceName);
        } else if (preferenceName === 'returnAddress' || preferenceName === 'returnFromAddress' || preferenceName === 'returnShipperAddress') {
            // returnAddress and returnFromAddress and returnShipperAddress are expected to be returned as JSON objects
            preferenceValue = JSON.stringify(preferenceValue);
        }

        return preferenceValue;
    },
    getQTYInformation: function (pli, returnItems, shippingJson) {
        var availableQTY = 0;
        var customerReturnedQTY = 0;
        var shortShipReturnedQty = 0;
        var inReturnProcess = 0;
        var shippedQty = 0;
        var optionsMap = new dw.util.SortedMap(function (a, b) {
            return a - b;
        });
        if (!empty(shippingJson)) {
            var shippingJsonParsed = this.parseJsonSafely(shippingJson);
            shippedQty = this.getQtyJsonPLIBySku(pli.custom.sku, shippingJsonParsed);
        }

        collections.forEach(returnItems, (returnCaseItem) => {
            if (pli.orderItem.itemID === returnCaseItem.orderItem.itemID && returnCaseItem.getAuthorizedQuantity()) {
                if (returnCaseItem.status === returnCaseItem.STATUS_RETURNED) {
                    if (!empty(returnCaseItem.reasonCode)) {
                        customerReturnedQTY += returnCaseItem.getAuthorizedQuantity();
                    } else {
                        shortShipReturnedQty += returnCaseItem.getAuthorizedQuantity();
                    }
                } else if (returnCaseItem.status !== ReturnCaseItem.STATUS_CANCELLED && returnCaseItem.status !== ReturnCaseItem.STATUS_RETURNED && !this.isFailedReturn(returnCaseItem.returnCaseNumber)) {
                    if (!empty(returnCaseItem.reasonCode)) {
                        inReturnProcess += returnCaseItem.getAuthorizedQuantity();
                    } else {
                        shortShipReturnedQty += returnCaseItem.getAuthorizedQuantity();
                    }
                }
            }
        });

        availableQTY = shippedQty - customerReturnedQTY - inReturnProcess;
        var allAvailableQTY = pli.quantity.value - customerReturnedQTY - shortShipReturnedQty - inReturnProcess;

        availableQTY = allAvailableQTY < availableQTY ? allAvailableQTY : availableQTY;

		// return: empty qty options
        if (!availableQTY) {
            return { optionsMap: optionsMap, shippedQty: shippedQty, availableQTY: availableQTY, customerReturnedQTY: customerReturnedQTY, shortShipReturnedQty: shortShipReturnedQty, inReturnProcess: inReturnProcess };
        }
		// "select qty" option
        if (availableQTY > 0) {
            optionsMap.put('', dw.web.Resource.msg('return.qtylable', 'forms', null));
        }
		// set qty options
        for (var i = 1; i <= availableQTY; i++) {
            optionsMap.put(i.toFixed(), i.toFixed());
        }

        return { optionsMap: optionsMap, shippedQty: shippedQty, availableQTY: availableQTY, customerReturnedQTY: customerReturnedQTY, shortShipReturnedQty: shortShipReturnedQty, inReturnProcess: inReturnProcess };
    },
    getPLIRefundsInfo: function (refundsJson, pliSku) {
        var	refundsInfo = [];
        if (!empty(refundsJson) && !empty(pliSku)) {
            var refunds = this.parseJsonSafely(refundsJson);
            collections.forEach(refunds, function (refund) {
                // eslint-disable-next-line no-prototype-builtins
                if (!empty(refund.itemAmounts) && refund.itemAmounts.hasOwnProperty(pliSku) && refund.emailSent) {
                    var refundAmount = new Money(refund.itemAmounts[pliSku], refund.refundCurrency).toFormattedString();
                    var refundDate = new Date(refund.refundDate);
                    refundsInfo.push({ refundDate: refundDate, refundAmount: refundAmount });
                }
            });
        }
        return refundsInfo;
    },
    getRefundInfoForOrderDetail: function (returnNumber, refundsJson) {
        var refundInfo;
        if (!empty(refundsJson)) {
            var refunds = this.parseJsonSafely(refundsJson);
            if (refunds) {
                for (var i = 0; i < refunds.length; i++) {
                    var refund = refunds[i];
                    // eslint-disable-next-line no-prototype-builtins
                    if (refund.returnNumber === returnNumber && !empty(refund.itemAmounts) && 'refundAmount' in refund) {
                        refundInfo = refund;
                        break;
                    }
                }
            }
        }
        return refundInfo;
    },
    getReturnStatus: function (lineItemContainer) {
        var returnStatus = null;
        if ('refundsJson' in lineItemContainer.custom && lineItemContainer.custom.refundsJson) {
            var refundsJson = lineItemContainer.custom.refundsJson;
            var refunds = this.parseJsonSafely(refundsJson);

            if (refunds && refunds.length > 0) {
                var HashMap = require('dw/util/HashMap');
                var skuQtyHashMap = new HashMap();

                for (let i = 0; i < refunds.length; i++) {
                    var refund = refunds[i];
                    var items = refund.items;
                    var itemKeys = Object.keys(refund.items);
                    for (let j = 0; j < itemKeys.length; j++) {
                        var itemKey = itemKeys[j];
                        if (skuQtyHashMap[itemKey] && items[itemKey] && !isNaN(items[itemKey])) {
                            skuQtyHashMap.put(itemKey, skuQtyHashMap[itemKey] + Number(items[itemKey]));
                        } else if (items[itemKey] && !isNaN(items[itemKey])) {
                            skuQtyHashMap.put(itemKey, Number(items[itemKey]));
                        }
                    }
                }

                returnStatus = 'RETURNED';
                var productLineItems = lineItemContainer.getProductLineItems();
                for (let i = 0; i < productLineItems.length; i++) {
                    var productLineItem = productLineItems[i];
                    if (productLineItem.getQuantityValue() !== skuQtyHashMap[productLineItem.custom.sku]) {
                        returnStatus = 'PARTIALLY_RETURNED';
                        break;
                    }
                }
            }
        }
        return returnStatus;
    },
    isPartiallyShipped: function (lineItemContainer) {
        var partiallyShipped = false;
        if ('shippingJson' in lineItemContainer.custom && lineItemContainer.custom.shippingJson) {
            var shippingJson = lineItemContainer.custom.shippingJson;
            var shippedData = this.parseJsonSafely(shippingJson);

            if (shippedData && shippedData.length > 0) {
                var HashMap = require('dw/util/HashMap');
                var skuQtyHashMap = new HashMap();

                for (let i = 0; i < shippedData.length; i++) {
                    var data = shippedData[i];
                    var items = data.items;
                    var itemKeys = Object.keys(items);
                    for (let j = 0; j < itemKeys.length; j++) {
                        var itemKey = itemKeys[j];
                        if (skuQtyHashMap[itemKey] && items[itemKey] && !isNaN(items[itemKey])) {
                            skuQtyHashMap.put(itemKey, skuQtyHashMap[itemKey] + Number(items[itemKey]));
                        } else if (items[itemKey] && !isNaN(items[itemKey])) {
                            skuQtyHashMap.put(itemKey, Number(items[itemKey]));
                        }
                    }
                }

                var productLineItems = lineItemContainer.getProductLineItems();
                for (let i = 0; i < productLineItems.length; i++) {
                    var productLineItem = productLineItems[i];
                    if (productLineItem.getQuantityValue() !== skuQtyHashMap[productLineItem.custom.sku]) {
                        partiallyShipped = true;
                        break;
                    }
                }
            }
        }
        return partiallyShipped;
    },
    createReturnCase: function (order, returnItemsInfo, isShortShipReturn) {
        if (empty(order) || !returnItemsInfo.length) {
            return null;
        }
        var returnCase = order.createReturnCase(isShortShipReturn);
        var refundItems = [];

		// create return case items
        for (var i = 0; i < returnItemsInfo.length; i++) {
            if (!empty(returnItemsInfo[i].orderItemID)) {
                let itemInfo = returnItemsInfo[i];
                let authorizedQuantity = new Quantity(itemInfo.qty, itemInfo.pli.quantity.getUnit());
                let returnCaseItem = this.createReturnCaseItem(returnCase, itemInfo.orderItemID, authorizedQuantity, itemInfo.reason);
                let sku = itemInfo.pli.custom.sku;
                let pid = itemInfo.pli.productID;
                let rmaListOldValue = !empty(order.custom.rmaList) ? order.custom.rmaList : '';

                refundItems.push(sku + '-' + authorizedQuantity);
                if (returnCaseItem) {
                    // eslint-disable-next-line no-param-reassign
                    order.custom.rmaList = rmaListOldValue + returnCase.returnCaseNumber + '|' + sku + '|' + pid + '|' + authorizedQuantity.value.toString() + '\n';
                }
            }
        }
        try {
            returnCase.custom.refundItems = refundItems;
        } catch (e) {
            Logger.error('ReturnUtils.ds error. Error while creating returncase {0} with error {1} for order {2}:', returnCase, e, order.orderNo);
            return null;
        }
        return returnCase;
    },
    createReturnCaseForPrintLabel: function (order, returnItemsInfo, isShortShipReturn) {
        if (empty(order) || !returnItemsInfo.length) {
            return null;
        }
        var returnCase = order.createReturnCase(isShortShipReturn);
        var refundItems = [];

		// create return case items
        for (var i = 0; i < returnItemsInfo.length; i++) {
            if (!empty(returnItemsInfo[i].returnOrderItemID)) {
                let itemInfo = returnItemsInfo[i];
                let authorizedQuantity = new Quantity(itemInfo.returnQuantity, '1');
                let returnCaseItem = this.createReturnCaseItem(returnCase, itemInfo.returnOrderItemID, authorizedQuantity, itemInfo.returnReason, itemInfo.returnDescription);
                let sku = itemInfo.returnSku;
                let pid = itemInfo.returnPid;
                let rmaListOldValue = !empty(order.custom.rmaList) ? order.custom.rmaList : '';

                refundItems.push(sku + '-' + authorizedQuantity);
                if (returnCaseItem) {
                    // eslint-disable-next-line no-param-reassign
                    order.custom.rmaList = rmaListOldValue + returnCase.returnCaseNumber + '|' + sku + '|' + pid + '|' + authorizedQuantity.value.toString() + '\n';
                }
            }
        }
        try {
            returnCase.custom.refundItems = refundItems;
        } catch (e) {
            Logger.error('ReturnUtils.ds error. Error while creating returncase {0} with error {1} for order {2}:', returnCase, e, order.orderNo);
            return null;
        }
        return returnCase;
    },
    createReturnCaseItem: function (returnCase, orderItemID, authorizedQuantity, reason, returnDescription) {
        var returnCaseItem = returnCase.createItem(orderItemID);
        returnCaseItem.setAuthorizedQuantity(authorizedQuantity);
        returnCaseItem.setReasonCode(reason);
        if (returnDescription) {
            returnCaseItem.setNote(returnDescription);
        }
        return returnCaseItem;
    },
    createReturnWithReturnCase: function (returnCase) {
        let Return = returnCase.createReturn();
        let returnNumber = Return.getReturnNumber();
        let returnCaseItems = returnCase.getItems();
        let refundItems = [];
        let sku;
        let authorizedQuantity;
		// create ReturnItems
        collections.forEach(returnCaseItems, function (returnCaseItem) {
            try {
                let returnItem = returnCaseItem.createReturnItem(returnNumber);
                sku = returnCaseItem.lineItem.custom.sku;
                authorizedQuantity = returnCaseItem.getAuthorizedQuantity();

                returnItem.setReasonCode(returnCaseItem.getReasonCode());
                returnItem.setReturnedQuantity(authorizedQuantity);
                refundItems.push(sku + '-' + authorizedQuantity);
            } catch (e) {
                Logger.error('ReturnUtils.ds error. Can not create ReturnItem {0} for Return {1}, with {2} quantity value. Error: {3}', sku, returnNumber, authorizedQuantity, e);
                new ReturnsUtils().failReturn(Return);
                return;
            }
        });

		// store custom attributes
        try {
            Return.custom.refundItems = refundItems;
        } catch (e) {
            Logger.error('ReturnUtils.ds error. Error while creating return {0} with error {1} for returnCase {2}:', Return, e, returnCase);
            return null;
        }
        return Return;
    },
    getOrderShippingDate: function (order) {
        let shippingDate = order.custom.shippingDate;
        if (empty(shippingDate) && !empty(order.custom.shippingJson)) {
            let shippingJson = this.parseJsonSafely(order.custom.shippingJson);
            let lastShipement = shippingJson[shippingJson.length - 1];
            shippingDate = lastShipement.date;
        }

        return !empty(shippingDate) ? new Date(shippingDate.toString()) : null;
    },
    getShippingDate: function (order) {
        let shippingJson = this.parseJsonSafely(order.custom.shippingJson);
        let lastShipement = shippingJson[shippingJson.length - 1];
        let shippingDate = lastShipement.date;
        let dateFormatInvalid = false;
        try {
            let calendar = new Calendar();
            calendar.parseByFormat(shippingDate, "yyyy-MM-dd'T'HH:mm:ss.SSS");
        } catch (e) {
            dateFormatInvalid = true;
            Logger.error('ReturnUtils.ds error. error while parsing date:', e);
        }
        return dateFormatInvalid;
    },
    parseJsonSafely: function (jsonString) {
        var jsonObject = null;
        try {
            jsonObject = JSON.parse(jsonString);
        } catch (e) {
            Logger.error('ReturnsUtil.ds JSON parse error:' + e);
        }

        return jsonObject;
    },
    isNarvarEnabled: function (customerCountry) {
        var enableNarvarTracking = Site.getCurrent().getCustomPreferenceValue('enableNarvarTracking');
        var enableNarvarTrackingCountries = !empty(enableNarvarTracking) ? enableNarvarTracking.replace(/ /g, '').split(',') : [];

        return !empty(enableNarvarTrackingCountries) && (enableNarvarTrackingCountries.indexOf(customerCountry) !== -1 || enableNarvarTrackingCountries.indexOf('ALL') !== -1);
    },

	/**
	 * returns the tracking codes from the shipping Json on the order
	 * @param {dw.order.Order} order - Order object
	 * @returns {string} tracking code(s)
	 */
    getShippingTrackingCode: function (order) {
        var shippingJson = order.custom.shippingJson;
        if (empty(shippingJson)) {
            if (empty(order.custom.shippingData)) {
                return '';
            }
        }

        var shippingJsonParsed = this.parseJsonSafely(shippingJson);
        var lastShipment = shippingJsonParsed[shippingJsonParsed.length - 1];

        // Sometimes EU sends multiple tracking numbers in one XML file. replace the line feed character in the data with a comma if it exists
        lastShipment.trackingCode = lastShipment.trackingCode.replace('%0A', ',');

        return lastShipment.trackingCode;
    },
    getOrderShippingMethodExpStd: function (order) {
        var shipments = order.getShipments();
        if (!empty(shipments) && shipments.length > 0) {
			// since no multishipping - get [0] element
            var shippingMethod = shipments[0].getShippingMethod();
            if (!empty(shippingMethod) && 'isExpressShipping' in shippingMethod.custom && shippingMethod.custom.isExpressShipping) {
                return 'EXP';
            }
            return 'STD';
        }
        return null;
    },

    getShippingTrackingLink: function (order, thisShipmentObj) {
        var shippingJson = order.custom.shippingJson;
        var trackingLink;
        var isNarvarTrackingEnabled = this.isNarvarEnabled(order.custom.customerCountry);

        if (empty(shippingJson)) {
            if (empty(order.custom.shippingData)) {
                return '';
            }
            // eslint-disable-next-line no-useless-escape
            var regExp = new RegExp('href="([^\'\"]+)', 'g');
            var results = order.custom.shippingData.match(regExp);
            trackingLink = (results && results.length > 0) ? results[0].replace('href="', '') : '';
            return trackingLink;
        }

        var shippingJsonParsed = this.parseJsonSafely(shippingJson);
        var lastShipment = thisShipmentObj || shippingJsonParsed[shippingJsonParsed.length - 1]; // use argument shipment object if exists

		// Sometimes EU sends multiple tracking numbers in one XML file. replace the line feed character in the data with a comma if it exists
        lastShipment.trackingCode = lastShipment.trackingCode.replace('%0A', ',');

        if (isNarvarTrackingEnabled) {
            var warehouseAddress = JSON.parse(this.getPreferenceValue('returnAddress'));
            trackingLink = 'https://' + Site.getCurrent().getCustomPreferenceValue('narvarRetailerName') + '.narvar.com/' + Site.getCurrent().getCustomPreferenceValue('narvarRetailerName') + '/tracking';
            var carrierMapping = Site.getCurrent().getCustomPreferenceValue('narvarCarrierMapping');

			// 'Default Value' is not an option for text area attributes, setting variable to {} if current value is null
            carrierMapping = carrierMapping ? this.parseJsonSafely(carrierMapping) : {};

            // eslint-disable-next-line no-prototype-builtins
            if (lastShipment.carrier && carrierMapping.hasOwnProperty(lastShipment.carrier)) {
                let carrierFromMapping = carrierMapping[lastShipment.carrier];
                // eslint-disable-next-line no-undef
                let currentLocale = Locale.getLocale(request.locale);
                let countryCode = !empty(currentLocale) ? currentLocale.getCountry() : null;
                let resourceCarrier = !empty(countryCode) ? Resource.msg('narvar.carrier.' + countryCode.toLowerCase() + '.' + carrierFromMapping.toUpperCase(), 'paazl', '') : '';
                if (!empty(resourceCarrier)) {
                    trackingLink += '/' + resourceCarrier;
                } else {
                    trackingLink += '/' + carrierFromMapping;
                }
            } else if (lastShipment.carrier) trackingLink += '/' + lastShipment.carrier;
            else {
                var urlArray = lastShipment.trackingLink.split('.');
                trackingLink += '/' + urlArray[1];
            }
            var serviceParam = '';
            var orderDate = '';
            var shippingDate = '';
            try {
                serviceParam = this.getOrderShippingMethodExpStd(order);
                orderDate = order.getCreationDate() ? StringUtils.formatCalendar(new Calendar(order.getCreationDate()), "yyyy-MM-dd'T'HH:mm:ssZ") : '';
                shippingDate = order.custom.shippingDate ? StringUtils.formatCalendar(new Calendar(order.custom.shippingDate), "yyyy-MM-dd'T'HH:mm:ssZ") : '';

				// format dates timezone with :
                orderDate = orderDate.substr(0, orderDate.length - 2) + ':' + orderDate.substr(orderDate.length - 2, orderDate.length);
                shippingDate = shippingDate.substr(0, shippingDate.length - 2) + ':' + shippingDate.substr(shippingDate.length - 2, shippingDate.length);
            } catch (e) {
                Logger.error('ReturnUtils.ds error. Cannot format tracking link parameters:  ' + e);
            }
            if ((Site.current.ID === 'UKIE' || Site.current.ID === 'EU') && (!empty(order.custom.sapCarrierCode) && !empty(serviceParam)) && (order.custom.sapCarrierCode === 'DHL-BBX' || order.custom.sapCarrierCode === 'FED-PUP' || order.custom.sapCarrierCode === 'DHL-ECX')) {
                var trackURL = 'https://' + Site.getCurrent().getCustomPreferenceValue('narvarRetailerName') + '.narvar.com/' + Site.getCurrent().getCustomPreferenceValue('narvarRetailerName') + '/tracking';
                if (order.custom.sapCarrierCode === 'DHL-BBX' || order.custom.sapCarrierCode === 'DHL-ECX') {
                    trackURL += '/dhlexpresseu';
                    if (order.custom.sapCarrierCode === 'DHL-BBX') {
                        serviceParam = '65';
                    } else if (order.custom.sapCarrierCode === 'DHL-ECX') {
                        serviceParam = 'EX';
                    }
                } else if (order.custom.sapCarrierCode === 'FED-PUP') {
                    trackURL += '/fedex';
                    serviceParam = 'FG';
                }
                trackingLink = trackURL;
            }

            trackingLink += '?tracking_numbers=' + lastShipment.trackingCode +
							'&service=' + (empty(serviceParam) ? '' : serviceParam) +
							'&order_date=' + (empty(orderDate) ? '' : orderDate) +
							'&ship_date=' + (empty(shippingDate) ? '' : shippingDate) +
							'&locale=' + order.custom.customerLocale +
							'&origin_country=' + (empty(warehouseAddress) ? '' : warehouseAddress.countryCode) +
							'&origin_zip_code=' + (empty(warehouseAddress) ? '' : warehouseAddress.postalCode) +
							'&destination_country=' + order.custom.customerCountry;

            if (Site.current.ID === 'EU' && (!empty(order.custom.sapCarrierCode)) && (order.custom.sapCarrierCode === 'PNL-P02' || order.custom.sapCarrierCode === 'PNL-S02')) {
                trackingLink += '&dzip=' + order.defaultShipment.shippingAddress.postalCode.split(' ').join('');
            }
        } else {
			// override tracking link based on configuration
            var trackingLinkURL = lastShipment.trackingLink;
            // update the tracking url if there is an override configured
            var trackingURLsConfiguration = Site.getCurrent().getCustomPreferenceValue('shipmentTrackingUrlOverride') || '';
            if (!empty(trackingURLsConfiguration)) {
                var trackingURLs = this.parseJsonSafely(trackingURLsConfiguration);
                if (!empty(trackingURLs[trackingLinkURL])) {
                    trackingLinkURL = trackingURLs[trackingLinkURL];
                }
            }

            if (PreferencesUtil.isCountryEnabled('shipmentCombineTrackingURLandCode')) {
                trackingLink = trackingLinkURL + '=' + lastShipment.trackingCode;
            } else {
                trackingLink = trackingLinkURL;
            }
        }

        return trackingLink;
    },
    getPLIBySKU: function (order, sku) {
        var productLineItem = null;
        var orderPLIList = (!empty(sku) && !empty(order)) ? order.getProductLineItems() : null;

        if (!empty(orderPLIList)) {
            collections.forEach(orderPLIList, function (pli) {
                if ('sku' in pli.custom && pli.custom.sku === sku) {
                    productLineItem = pli;
                    return;
                }
            });
        }
        return productLineItem;
    },
    getPLIShippingDate: function (shippingJson, pliSku) {
        if (empty(shippingJson)) {
            return null;
        }
        var shippingJsonParsed = this.parseJsonSafely(shippingJson);
        var pliShippingDate = null;

        shippingJsonParsed.forEach(function (shipment) {
            // eslint-disable-next-line no-prototype-builtins
            if (shipment.items.hasOwnProperty(pliSku) && !empty(shipment.date)) {
                pliShippingDate = shipment.date.toString();
            }
        });

        return !empty(pliShippingDate) ? new Date(pliShippingDate) : null;
    },

	/**
	 * @description Creates Array with sku & quantity information about refunded products
	 *
	 * @param {Object} refund - Refund, geted form refundsJson order attribute
	 * @returns {Array} lineItems - Array of sku & quantity indormation about refunded products
	 */
    getRefundLineItems: function (refund) {
        var lineItems = [];
        if (!empty(refund) && !empty(refund.items)) {
            // eslint-disable-next-line no-restricted-syntax
            for (let itemSku in refund.items) {
                if (!this.isIgnoredSKU(itemSku)) {
                    lineItems.push({ sku: itemSku, qty: refund.items[itemSku] });
                }
            }
        }
        return lineItems;
    },

	/**
	 * @description Check if refund object has ignore sku
	 *
	 * @param {Object} refund - Refund, geted form refundsJson order attribute
	 * @returns {boolean} - true/false
	 */
    isRefundHasIgnoreSku: function (refund) {
        var hasIgnoredSku = false;
        if (!empty(refund) && !empty(refund.items)) {
            for (var i = 0; i < Object.keys(refund.items).length; i++) {
                if (this.isIgnoredSKU(Object.keys(refund.items)[i])) {
                    hasIgnoredSku = true;
                    break;
                }
            }
        }
        return hasIgnoredSku;
    },

	/**
	 * @description Get Return from Order according ReturnNumber setted in Refund
	 *
	 * @param {Order} order - Order in which we search return
	 * @param {string} returnNumber - Return Number setted in Refund
	 * @return {Return} properReturn - Found Return in Order according returnNumber
	 */
    getReturnAccordingReturnNumber: function (order, returnNumber) {
        if (empty(order) || empty(order.returns) || empty(returnNumber)) {
            return null;
        }
        var properReturn = null;
        var returns = order.returns;

        for (var i = 0; i < returns.length; i++) {
            if (returnNumber === returns[i].getReturnNumber()) {
                properReturn = returns[i];
                break;
            }
        }
        return properReturn;
    },

	/**
	 * @description get Return from Order according RefundLineItems
	 *
	 * @param {Order} order - Order in which we search return
	 * @param {Array} lineItems - Array of sku & quantity for searching Return in Order
	 * @param {Status} neededReturnStatus - Status of return which we search.
	 *										If empty - then search return with any status.
	 *										If Completed - then search "Completed" return with Invoice status "Paid".
	 * @return {Return} resultReturn - Finded Return of this Order, with lineItems products
	 */
    getReturnAccordingRefundLineItems: function (order, lineItems, neededReturnStatus) {
        for (let i = 0; i < lineItems.length; i++) {
            if (this.isIgnoredSKU(lineItems[i].sku)) {
                lineItems.splice(i, 1);
                break;
            }
        }
        if (empty(order) || empty(lineItems)) {
            return null;
        }
        var returns = order.getReturns();
        var resultReturn = null;

        collections.forEach(returns, function (orderReturn) {
            if (!empty(resultReturn)) {
                return;
            }

            var returnRefundItems = orderReturn.custom.refundItems;
            if (!empty(returnRefundItems) && returnRefundItems.length === lineItems.length) {
                for (let i = 0; i < lineItems.length; i++) {
                    if (returnRefundItems.indexOf(lineItems[i].sku + '-' + lineItems[i].qty) < 0) {
                        break; // if Return has no one of refund items then break;
                    }
					/* if orderReturn.custom.refundItems has all of refund items
					*	and orderReturn has determined status then get it
					*/
                    if (i === (lineItems.length - 1) && (empty(neededReturnStatus) || (orderReturn.getStatus().value === neededReturnStatus
							&& (neededReturnStatus === dw.order.Return.STATUS_NEW || (!empty(orderReturn.getInvoice()) && orderReturn.getInvoice().getStatus() === dw.order.Invoice.STATUS_PAID))))) {
                        resultReturn = orderReturn;
                        break;
                    }
                }
            }
        });
        return	resultReturn;
    },

	/**
	 * @description check for not processed ReturnCase (without Return)
	 * to determine which type or ReturnCase we need to create:
	 * ShortShip return (by OMS system if product out of stock)
	 * Backend return (by customer in storefront)
	 *
	 * @param {Order} order - Order in which we search return cases
	 *
	 * @return {boolean} yes, if we have not processed ReturnCase, otherwise - no
	 */
    hasNotProcessedReturnCase: function (order) {
        var hasReturnCaseProcessed = false;
        var returnCases = order.getReturnCases();
        collections.forEach(returnCases, function (orderRetCase) {
            if (orderRetCase.returns.empty) {
                hasReturnCaseProcessed = true;
                return;
            }
        });
        return	hasReturnCaseProcessed;
    },

	/**
	 * @description check for not processed ReturnCase (without Return)
	 * and fail it, to have ability correctly display item status on storefront
	 * for example: items in return process, returned etc.
	 *
	 * @param {Order} order - Order in which we search return cases
	 *
	 */
    failNotProcessedReturnCases: function (order) {
        var returnCases = order.getReturnCases();
        collections.forEach(returnCases, function (orderRetCase) {
            if (orderRetCase.returns.empty && orderRetCase.status === dw.order.ReturnCase.STATUS_NEW) {
                collections.forEach(orderRetCase.items, function (item) {
                    item.setStatus(item.STATUS_CANCELLED);
                });
            }
        });
    },

	/**
	 * @description search reson for line item in not processed ReturnCases (without Returns)
	 * at first time try to find product id + qty
	 * at second time product id only
	 *
	 * @param {Order} order - Order in which we search ReturnCases
	 * @param {lineItem} lineItem - line item sku and qty
	 *
	 * @return {pliReason} String finded reason or empty string
	 */
    searchReasonForItem: function (order, lineItem) {
        var pliReason = '';
        var returnCases = order.getReturnCases();
        collections.forEach(returnCases, function (orderRetCase) {
            if (!empty(pliReason)) return;
            if (orderRetCase.status === dw.order.ReturnCase.STATUS_NEW && orderRetCase.returns.empty) {
                var returnRefundItems = orderRetCase.custom.refundItems;
                if (!empty(returnRefundItems) && returnRefundItems.indexOf(lineItem.sku + '-' + lineItem.qty) !== -1) {
                    collections.forEach(orderRetCase.items, function (retItem) {
                        if (retItem.lineItem.custom.sku === lineItem.sku) {
                            pliReason = retItem.reasonCode.value;
                            return;
                        }
                    });
                }
            }
        });
        if (empty(pliReason)) {
            collections.forEach(returnCases, function (orderRetCase) {
                if (!empty(pliReason)) return;
                if (orderRetCase.status === dw.order.ReturnCase.STATUS_NEW && orderRetCase.returns.empty) {
                    var returnRefundItems = orderRetCase.custom.refundItems;
                    if (!empty(returnRefundItems) && returnRefundItems.indexOf(lineItem.sku) !== -1) {
                        collections.forEach(orderRetCase.items, function (retItem) {
                            if (retItem.lineItem.custom.sku === lineItem.sku) {
                                pliReason = retItem.reasonCode.value;
                                return;
                            }
                        });
                    }
                }
            });
        }
        return pliReason;
    },

	/**
	 * @description get ReturnCase from Order according RefundLineItems
	 *
	 * @param {Order} order - Order in which we search return case
	 * @param {Array} lineItems - Array of sku & quantity for searching ReturnCase in Order
	 *
	 * @return {ReturnCase} resultReturnCase - Finded ReturnCase of this Order, with lineItems products
	 */
    getReturnCaseAccordingRefundLineItems: function (order, lineItems) {
        for (let i = 0; i < lineItems.length; i++) {
            if (this.isIgnoredSKU(lineItems[i].sku)) {
                lineItems.splice(i, 1);
                break;
            }
        }
        if (empty(order) || empty(lineItems)) {
            return null;
        }
        var returnCases = order.getReturnCases();
        var resultReturnCase = null;

        collections.forEach(returnCases, function (orderRetCase) {
            if (!empty(resultReturnCase)) {
                return;
            }
            var returnRefundItems = orderRetCase.custom.refundItems;
            if (!empty(returnRefundItems) && returnRefundItems.length === lineItems.length && orderRetCase.status === dw.order.ReturnCase.STATUS_NEW) {
                for (let i = 0; i < lineItems.length; i++) {
                    if (returnRefundItems.indexOf(lineItems[i].sku + '-' + lineItems[i].qty) < 0) {
                        return; // if ReturnCase has no one of refund items then break;
                    }
				// if orderReturn.items has all of refund line items than get it
                    if (i === (lineItems.length - 1)) {
                        resultReturnCase = orderRetCase;
                        return;
                    }
                }
            }
        });
        return	resultReturnCase;
    },

    createReturnAccordingRefundLineItems: function (order, lineItems) {
        var returnCase = this.getReturnCaseAccordingRefundLineItems(order, lineItems) || null;
        var Return = require('dw/order/Return');
		// if ReturnCase not found then create this missed ReturnCase
        if (empty(returnCase)) {
            var missedReturnItemsInfo = [];
            for (let i = 0; i < lineItems.length; i++) {
                var item = lineItems[i];
                // eslint-disable-next-line no-continue
                if (this.isIgnoredSKU(item.sku)) { continue; }
                var	pli = this.getPLIBySKU(order, item.sku);
                if (!empty(pli)) {
                    var pliReason = this.searchReasonForItem(order, item);
                    missedReturnItemsInfo.push({ pli: pli, orderItemID: pli.getOrderItem().getItemID(), qty: item.qty, reason: pliReason });
                }
            }
            if (empty(missedReturnItemsInfo)) return null;
            var shippingUtils = (new (require('*/cartridge/scripts/orders/ShippingUtils'))());
            var isShortShipReturn = shippingUtils.isShortShip(order) && !this.hasNotProcessedReturnCase(order);
			// before creating returnCase fail redundand cases
            this.failNotProcessedReturnCases(order);
            returnCase = this.createReturnCase(order, missedReturnItemsInfo, isShortShipReturn);
        }
        var resultReturn = null;
		// confirm ReturnCase
        if (typeof returnCase !== 'undefined' && returnCase !== null && returnCase !== '' && returnCase !== '') {
            returnCase.confirm();
            resultReturn = this.createReturnWithReturnCase(returnCase);
        }
        if (!empty(resultReturn) && resultReturn.status && resultReturn.status.value !== Return.STATUS_COMPLETED) {
            if (resultReturn.returnCase.RMA) {
                resultReturn.setNote('ShortShip Refund');
				// Increment ShortShipOrder report value
                eodReportMgr.incrementReportValue('ShortShipOrder', null, order);
            } else {
                resultReturn.setNote('Backend Refund');
            }
        }

        return resultReturn;
    },

    getReturnToBeRefunded: function (order, lineItems) {
        let resultReturn = this.getReturnAccordingRefundLineItems(order, lineItems, dw.order.Return.STATUS_NEW) || null;
        var Return = require('dw/order/Return');
		// if Return not found then create this missed Return
        if (empty(resultReturn)) {
            var missedReturnItemsInfo = [];
            for (let i = 0; i < lineItems.length; i++) {
                let item = lineItems[i];
                // eslint-disable-next-line no-continue
                if (this.isIgnoredSKU(item.sku)) { continue; }
                try {
                    var pli = this.getPLIBySKU(order, item.sku);
                    missedReturnItemsInfo.push({ pli: pli, orderItemID: pli.getOrderItem().getItemID(), qty: item.qty, reason: '' });
                } catch (e) {
                    Logger.error('ReturnUtils.ds: Order Refund Processing Failed; Order No: {0}, Item SKU: {1}. Error: {2}', order.orderNo, item.sku, e);
                }
            }
            if (empty(missedReturnItemsInfo)) return null;

            var returnCase = this.createReturnCase(order, missedReturnItemsInfo, true);

			// confirm ReturnCase
            returnCase.confirm();

            resultReturn = this.createReturnWithReturnCase(returnCase);
            if (!empty(resultReturn) && resultReturn.status && resultReturn.status.value !== Return.STATUS_COMPLETED) {
                resultReturn.setNote('ShortShip or Backend Refund');

				// Increment ShortShipOrder report value
                eodReportMgr.incrementReportValue('ShortShipOrder', null, order);
            }
        }

        return resultReturn;
    },

    processReturnToBeRefunded: function (order, Return, refundResult, refundedAmount) {
        if (!empty(Return)) {
            Return.setStatus(Return.STATUS_COMPLETED);
            var invoice = Return.createInvoice();
            var returnCase = Return.getReturnCase();
            var returnCaseItemList = returnCase.getItems();

            invoice.setStatus(Invoice.STATUS_NOT_PAID);
			// Set statuses
            var paymentInstrument = order.getPaymentInstruments()[0];
            if (refundResult && !empty(paymentInstrument) && !empty(refundedAmount)) {
                invoice.addRefundTransaction(paymentInstrument, refundedAmount);
                invoice.setStatus(Invoice.STATUS_PAID);
                collections.forEach(returnCaseItemList, function (returnCaseItem) {
                    returnCaseItem.setStatus(ReturnCaseItem.STATUS_RETURNED);
                });
            } else {
                invoice.setStatus(Invoice.STATUS_FAILED);
            }
        }
    },

    failReturn: function (Return) {
        if (!empty(Return)) {
            Return.setNote('Return can not be created. There is no needed returnable quantity for return items.');
            Return.setStatus(Return.STATUS_COMPLETED);
            var invoice = Return.createInvoice();
            invoice.setStatus(Invoice.STATUS_FAILED);
        }
        return Return;
    },

    isFailedReturn: function (retCaseNum) {
        var OrderMgr = require('dw/order/OrderMgr');

        if (!empty(retCaseNum)) {
            var orderNo = retCaseNum.split('-')[0];
            if (!empty(orderNo)) {
                var order = OrderMgr.getOrder(orderNo);
                if (!empty(order)) {
                    var retCase = order.getReturnCase(retCaseNum);
                    if (!empty(retCase) && !retCase.returns.empty) {
                        var Return = retCase.returns.toArray()[0];
                        if (Return.status === Return.STATUS_COMPLETED && !empty(Return.invoice) && Return.invoice.status === Invoice.STATUS_FAILED) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    },
    getQtyJsonPLIBySku: function (sku, orderJsonObj) {
        var qty = 0;

        if (!empty(sku) && !empty(orderJsonObj)) {
            for (var i = 0; i < orderJsonObj.length; i++) {
                var shipment = orderJsonObj[i];
                if (!empty(shipment.items) && !empty(shipment.items[sku])) {
                    qty += Number(shipment.items[sku]);
                }
            }
        }

        return qty;
    },

    isIgnoredSKU: function (sku) {
        var ignoredSKU = Resource.msg('refund.ignoredSKU', 'config', '');
        return (!empty(ignoredSKU) && ignoredSKU === sku);
    },

    getRefundNumberFromAdyenReference: function (refundReference) {
        return (!empty(refundReference) && refundReference.lastIndexOf('-') > 0) ? parseInt(refundReference.substr(refundReference.lastIndexOf('-') + 1), 10) : 0;
    },

	/*
   	*	This function sets the number of all refunds
   	*	and the number of failed refunds in "RefundCounter"
   	*	custom object.
   	*/
    SetRefundsCountInfo: function (isFailed, skipTotalCountInc, order) {
		// eslint-disable-next-line no-param-reassign
        isFailed = !empty(isFailed) ? isFailed : false;
		// eslint-disable-next-line no-param-reassign
        skipTotalCountInc = !empty(skipTotalCountInc) ? skipTotalCountInc : false;
        let day = new Calendar(timezoneHelper.getCurrentSiteTime());

        if (!skipTotalCountInc) {
            eodReportMgr.incrementReportValue('TotalRefundOrder', day, order);
        }
        if (isFailed) {
            eodReportMgr.incrementReportValue('FailedRefundOrder', day, order);
        }

        return;
    },
	/*
   	*	Changes emailSent property in refundsJson from 'false' to 'true'
   	*/
    toggleRefundsJson: function (order, offlineRefund, orderRefundNumber) {
        let refundsJson = this.parseJsonSafely(order.custom.refundsJson);
        let items = new dw.util.ArrayList();
        let sapItemsList = null;

	/* Search for data within refundJson that has not been sent
	  * Also generate total qty for later use */
        if (!empty(refundsJson)) {
            var refund = null;

            if (offlineRefund === true) {
                refund = refundsJson[Object.keys(refundsJson).length - 1];
                sapItemsList = this.addItemToSapList(refund, items);
            } else if (!empty(orderRefundNumber)) {
                refund = refundsJson[orderRefundNumber - 1] || null;
                sapItemsList = this.addItemToSapList(refund, items);
            } else {
                for (var j = 0, jsonLen = refundsJson.length; j < jsonLen; j++) {
                    sapItemsList = this.addItemToSapList(refundsJson[j], items);
                }
            }
        }

		// Save updated JSON to the order
        // eslint-disable-next-line no-param-reassign
        order.custom.refundsJson = JSON.stringify(refundsJson);

        return sapItemsList;
    },

    addItemToSapList: function (refund, saplist) {
        if (!empty(refund)) {
            // eslint-disable-next-line no-prototype-builtins
            if (refund.emailSent !== true && refund.hasOwnProperty('items')) {
                // eslint-disable-next-line no-param-reassign
                refund.emailSent = true;
                if (!empty(refund.items)) {
                    // eslint-disable-next-line no-restricted-syntax
                    for (var sku in refund.items) {
                        if (!this.isIgnoredSKU(sku)) {
                            saplist.add({ sku: sku, qty: refund.items[sku], refund: refund.itemAmounts[sku] });
                        }
                    }
                }
            }
        }
        return saplist;
    },
	// checks if refund XML has exactly same quantity of plis as an order has
    isFullOrderRefund: function (order, refundsObj) {
        let pli = order.productLineItems;
        let pliLen = pli.length;
        let i;

        if (pliLen !== Object.keys(refundsObj.items).length) {
            return false;
        }

        for (i = 0; i < pliLen; i++) {
            if (this.getQtyJsonPLIBySku(pli[i].custom.sku, JSON.parse(order.custom.refundsJson)) !== pli[i].quantityValue) {
                return false;
            }
        }

        return true;
    },
	// Send paymnet details email
    sendPaymentDetails: function (data) {
        var MailHelper = require('underarmour_storefront/cartridge/scripts/util/MailHelper');
        var orderNo = (data.Order && data.Order.orderNo) || '';
        var mailSubject = this.getPreferenceValue('mailSubject', data.Order.custom.customerLocale);
        mailSubject = mailSubject && mailSubject.replace(/[{][0][}]/g, orderNo);
        var mailParams = {
            mailTo: this.getPreferenceValue('csEmail', data.Order.custom.customerLocale),
            mailSubject: mailSubject,
            mailTemplate: 'mail/returnnotification.isml',
            mailFrom: {
                name: '',
                email: 'donotreply@underarmour.com'
            },
            locale: data.Order.custom.customerLocale,
            data: data
        };
        return MailHelper.processSendMail(mailParams);
    },
    checkPaymentMethod: function (order) {
        var paymentMethod = order.paymentInstruments[0].paymentMethod;
        var creditCardsMethods = Resource.msg('order.returns.creditcardsmethods', 'order', null);
        var exist;
        if (creditCardsMethods) {
            exist = creditCardsMethods.indexOf(paymentMethod);
        }


        if (exist !== -1) {
            return 'creditCard';
        }

        return 'other';
    },

    isProductReturnBlocked: function (product) {
        var CatalogMgr = require('dw/catalog/CatalogMgr');
        var blockedCategories = PreferencesUtil.getValue('blockedReturnCategories');
        blockedCategories = !empty(blockedCategories) && blockedCategories.split(',');

        // eslint-disable-next-line require-jsdoc
        function isAssignedToBlockedCategory(categoryID) {
            var category = CatalogMgr.getCategory(categoryID.trim());
            var isAssigned = false;

            if (category) {
                isAssigned = product.isAssignedToCategory(category);

                if (!isAssigned && product.isVariant()) {
                    isAssigned = product.masterProduct.isAssignedToCategory(category);
                }
            }

            return isAssigned;
        }

        return blockedCategories && blockedCategories.some(isAssignedToBlockedCategory);
    }
};

module.exports = ReturnsUtils;
