'use strict';

/**
 * @module communication/oms
 */

const sendTrigger = require('./util/send').sendTrigger;
const hookPath = 'app.communication.oms.';
const helpers = require('../util/helpers');
const Resource = require('dw/web/Resource');
const Site = require('dw/system/Site');
const URLUtils = require('dw/web/URLUtils');
const URLParameter = require('dw/web/URLParameter');
const URLAction = require('dw/web/URLAction');
const URLUtilsHelper = require('int_customfeeds/cartridge/scripts/util/URLUtilsHelper');
const ReturnsUtils = require("app_ua_emea/cartridge/scripts/orders/ReturnsUtils");
const Logger = require('dw/system/Logger');

/**
 * Trigger a shipment notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function shipment(promise, data) {
    let ShippingConfirmationXML = new XML('<ShippingConfirmation></ShippingConfirmation>'),
    requestXML = helpers.generateRequestXML(getRequestShippingObject(data.params), ShippingConfirmationXML);
    data.TransactionXML = requestXML.toString();
    Logger.getLogger('shipment','ordershipment').info('MC Shipping Request= {0}',requestXML.toString());
    data.localeData = data.params.Order.custom.customerLocale.split('_');
    return sendTrigger(hookPath + 'shipment', promise, data);
}

/**
 * Trigger a invoice notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
 function orderRefund(promise, data) {
    let ReturnRefundXML = new XML('<ReturnRefund></ReturnRefund>'),
        requestXML = helpers.generateRequestXML(getRequestRefundObject(data.params), ReturnRefundXML);
    data.TransactionXML = requestXML.toString();
    data.localeData = data.params.Order.custom.customerLocale.split('_');

    return sendTrigger(hookPath + 'orderRefund', promise, data);
}

/**
 * Trigger a return order created notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~returnOrderCreated} data
 * @returns {SynchronousPromise}
 */
function returnOrderCreated(promise, data) {
    let ReturnStartedXML = new XML('<ReturnStarted></ReturnStarted>');
    let requestXML = helpers.generateRequestXML(getRequestReturnObject(data.params), ReturnStartedXML);
    data.TransactionXML = requestXML.toString();
    data.localeData = data.params.Order.custom.customerLocale.split('_');

    let hookID = 'app.communication.oms.returnOrderCreated';

    // Check if ReturnMethod configuration custom object is available.
    if ('pickupOption' in data.params.returnCase.custom && !empty(data.params.returnCase.custom.pickupOption)) {
        hookID = 'app.communication.oms.returnOrderCreated.' + data.params.returnCase.custom.pickupOption.toLowerCase().replace(/\s/g, '');
    }
    return sendTrigger(hookID, promise, data);
}

/**
 * Trigger a invoice notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function invoiceProcessed(promise, data) {
    return sendTrigger(hookPath + 'invoiceProcessed', promise, data);
}

/**
 * Get the Shippinglocalcountry
 * @param {string} shipCountry - The order shipping country
 * @return {string} countryDisplayName
 */
function getShippingLocalCountry(shipCountry) {
    var Logger = require('dw/system/Logger');
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var countryListJson = PreferencesUtil.getJsonValue('billingCountryList');
    var countryDisplayName='';
    if(countryListJson) {
        Object.keys(countryListJson).forEach(function (key) {
            var countryJsonName=countryListJson[key].toLowerCase();
            var shipCountryName=shipCountry.toLowerCase();
            if(!empty(shipCountryName) && !empty(countryJsonName) && countryJsonName === shipCountryName) {
                var translatedCountry = Resource.msg('select.option.country.' + shipCountryName, 'forms', '');
                countryDisplayName = translatedCountry.indexOf('select.option.country') > -1 ? countryListJson[key] : translatedCountry;
            }
        });
    }
    return !empty(countryDisplayName) ? countryDisplayName : shipCountry;
}

/**
 * Get the productColor
 * @param {Object} productLineItem - productLineItem
 * @return {string} displayColorWay
 */
function getProductColor(productLineItem){
        var productColorWay='';
        var productColor='';
        var displayColorWay = '';
        productColorWay='colorway' in productLineItem.product.custom && productLineItem.product.custom.colorway ? productLineItem.product.custom.colorway : '';
        productColor='color' in productLineItem.product.custom && productLineItem.product.custom.color ? productLineItem.product.custom.color : '';

        if (productColorWay != null && productColorWay !== '' && productColor != null && productColor !== '') {
            let colorBuckets = productColorWay.split('/').map(function (item) {
                return item.trim();
            });
            if (colorBuckets.length > 1) {
                displayColorWay += colorBuckets[0];
                if (colorBuckets[1] !== '' && colorBuckets[0] !== colorBuckets[1]) {
                    displayColorWay += ' / ' + colorBuckets[1];
                } else if (colorBuckets[2] && colorBuckets[2] !== '' && colorBuckets[2] !== colorBuckets[1]) {
                    displayColorWay += ' / ' + colorBuckets[2];
                }
            } else {
                displayColorWay = productColorWay;
            }
            displayColorWay += ' - ' + productColor;
        } else if (productColorWay != null || productColor != null) {
            displayColorWay = productColorWay ? productColorWay : productColor;
        }
        if(empty(displayColorWay)){
            displayColorWay='colorgroup' in productLineItem.product.custom && productLineItem.product.custom.colorgroup ? productLineItem.product.custom.colorgroup : '';
        }
        return displayColorWay;
}

/**
 * Declares attributes for data mapping for request XML
 * @param {Object} params
 * @returns {Object} Map of hook function to an array of strings
 */
 function getRequestShippingObject(params) {
    let order = params.Order,
        returnsUtils = new ReturnsUtils(),
        shippingObj = JSON.parse(order.custom.shippingJson),
        productLineItems = order.getProductLineItems(),
        urlAction = new URLAction('Order-TrackOrder', Site.getCurrent().getID(), order.custom.customerLocale),
        orderDetailsLink = URLUtils.https(urlAction, new URLParameter('orderNo', order.orderNo)).toString(),
        shippingAddress = order.defaultShipment.shippingAddress,
        newArrivalsAction = new URLAction('Search-Show', Site.getCurrent().getID(), order.custom.customerLocale),
        newArrivalsURL = URLUtils.https(newArrivalsAction, new URLParameter('cgid','new-arrivals')).toString(),
        shipObj = {
            CustomerEmail: order.customerEmail,
            CustomerFirstName: !empty(order.customer.profile) ? order.customer.profile.firstName : order.billingAddress.firstName,
            CustomerLastName: !empty(order.customer.profile) ? order.customer.profile.lastName : order.billingAddress.lastName,
            OrderNumber: order.orderNo,
            ShippingFirstName: shippingAddress.firstName,
            ShippingLastName: shippingAddress.lastName,
            ShippingCompany: shippingAddress.companyName,
            ShippingAddress1: shippingAddress.address1,
            ShippingAddress2: shippingAddress.address2,
            ShippingCity: shippingAddress.city && Resource.msg('city.' + shippingAddress.city.toLowerCase(), 'forms', '') || shippingAddress.city,
            ShippingRegion: shippingAddress.stateCode != 'undefined' && shippingAddress.stateCode || '',
            ShippingPostal: shippingAddress.postalCode,
            ShippingCountry: shippingAddress.countryCode.displayValue ? getShippingLocalCountry(shippingAddress.countryCode.displayValue) : shippingAddress.countryCode.ID,
            addToSMSList: 'addToSMSList' in shippingAddress.custom && shippingAddress.custom.addToSMSList || '',
            additionalInformation: 'additionalInformation' in shippingAddress.custom && shippingAddress.custom.additionalInformation || '',
            colony: 'colony' in shippingAddress.custom && shippingAddress.custom.colony || '',
            community: 'community' in shippingAddress.custom && shippingAddress.custom.community && Resource.msg('comuna.cl.' + shippingAddress.custom.community, 'forms', shippingAddress.custom.community.community) || '',
            customerEmail: 'customerEmail' in shippingAddress.custom && shippingAddress.custom.customerEmail || '',
            dependentLocality: 'dependentLocality' in shippingAddress.custom && shippingAddress.custom.dependentLocality || '',
            district: 'district' in shippingAddress.custom && shippingAddress.custom.district && Resource.msg('district.' + shippingAddress.custom.district.toLowerCase(),'forms', '') || '',
            dob: 'dob' in shippingAddress.custom && shippingAddress.custom.dob || '',
            documentType: 'documentType' in shippingAddress.custom && shippingAddress.custom.documentType || '',
            exteriorNumber: 'exteriorNumber' in shippingAddress.custom && shippingAddress.custom.exteriorNumber || '',
            interiorNumber: 'interiorNumber' in shippingAddress.custom && shippingAddress.custom.interiorNumber || '',
            suburb: 'suburb' in shippingAddress.custom && shippingAddress.custom.suburb || '',
            taxnumber: 'taxnumber' in shippingAddress.custom && shippingAddress.custom.taxnumber || '',
            taxoffice: 'taxoffice' in shippingAddress.custom && shippingAddress.custom.taxoffice || '',
            validationStatus: 'validationStatus' in shippingAddress.custom && shippingAddress.custom.validationStatus.value || '',
            emailaddressName: 'emailaddressName' in shippingAddress.custom && shippingAddress.custom.emailaddressName || '',
            emailaddressDomainSelect: 'emailaddressDomainSelect' in shippingAddress.custom && shippingAddress.custom.emailaddressDomainSelect || '',
            phone1: 'phone1' in shippingAddress.custom && shippingAddress.custom.phone1 || '',
            phone2: 'phone2' in shippingAddress.custom && shippingAddress.custom.phone2 || '',
            phone3: 'phone3' in shippingAddress.custom && shippingAddress.custom.phone3 || '',
            phoneSecondary: 'phoneSecondary' in shippingAddress.custom && shippingAddress.custom.phoneSecondary || '',
            phoneSecondary1: 'phoneSecondary1' in shippingAddress.custom && shippingAddress.custom.phoneSecondary1 || '',
            phoneSecondary2: 'phoneSecondary2' in shippingAddress.custom && shippingAddress.custom.phoneSecondary2 || '',
            phoneSecondary3: 'phoneSecondary3' in shippingAddress.custom && shippingAddress.custom.phoneSecondary3 || '',
            streetType: 'streetType' in shippingAddress.custom && shippingAddress.custom.streetType || '',
            buildingType: 'buildingType' in shippingAddress.custom && shippingAddress.custom.buildingType || '',
            jp_prefecture: 'jp_prefecture' in shippingAddress.custom && shippingAddress.custom.jp_prefecture || '',
            OrderDeliveryType: 'shipping',
            Subtotal: require('app_ua_core/cartridge/scripts/util/PriceHelper').getLocalizedPrice(order.getAdjustedMerchandizeTotalPrice(false).add(order.giftCertificateTotalPrice)).value,
            DiscountName: order.bonusDiscountLineItems.length ? order.bonusDiscountLineItems[0].promotion.getName() : '',
            DiscountTotal: order.giftCertificateTotalPrice.value,
            Taxes: order.totalTax.value,
            ShippingCost: order.shippingTotalPrice.value,
            GiftCardsQuantity: order.giftCertificateLineItems.length,
            GiftCardsChargeAmount: order.giftCertificateTotalPrice.value,
            AthleteAllotmentAmount: '',
            Total: order.totalGrossPrice.value,
            Payment: {
                Type: getPaymentType(order),
                Amount: order.getPaymentInstruments()[0].getPaymentTransaction() ? order.getPaymentInstruments()[0].getPaymentTransaction().amount.value : '',
                CreditCardLast4: ''
            },
            OrderDetailsLink: URLUtilsHelper.prepareURLForLocale(orderDetailsLink.toString(), order.custom.customerLocale),
            CurrentShipment: {
                ShipmentDate: shippingObj[shippingObj.length - 1].date.split('T')[0],
                ShipmentQuantity: getItemsCount(shippingObj[shippingObj.length - 1].items) || 0,
                ShipmentTotal: order.shippingTotalPrice.value,
                ShipmentTrackingLink: params.trackingLink,
                ShipmentTrackingNumber: params.trackingCode,
                Product: []
            },
            NewArrivalsURL: URLUtilsHelper.prepareURLForLocale(newArrivalsURL.toString(), order.custom.customerLocale)
    };
    //check and process current shipment items if any
    var currentShipmentItems = getCurrentShipmentItems(shippingObj[shippingObj.length - 1]);
    if (currentShipmentItems && currentShipmentItems.length > 0) {
        for (let i=0; i < currentShipmentItems.length; i++) {
            shipObj.CurrentShipment.Product.push(currentShipmentItems[i]);
        }
    }
    //check and process future shipment items if any
    var futureShipmentItems = getFutureShippedItems(productLineItems, shippingObj, order);
    if (futureShipmentItems && futureShipmentItems.length > 0) {
        shipObj.FutureShipment = {
            ShipmentQuantity: order.shipments.length,
            Product: []
        };
        for (let i=0; i < futureShipmentItems.length; i++) {
            shipObj.FutureShipment.Product.push(futureShipmentItems[i]);
        }
    }
    //check and process previous shipments if any
    var previousShipmentItems = getPreviousShipments(shippingObj, order);
    if (previousShipmentItems && previousShipmentItems.length > 0) {
        shipObj.PreviousShipment = [];
        for (let i=0; i < previousShipmentItems.length; i++) {
            shipObj.PreviousShipment.push(previousShipmentItems[i]);
        }
    }
    return shipObj;

    /*
     * Helper functions to process current/previous/future shipments
     */

    //parses shippingObject and returns array with previous shipments
    function getPreviousShipments(shippingObj, order) {
        var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
        var allPreviousShipments = [];
        if (shippingObj && shippingObj.length > 1) {
            for (let i = 0; i < shippingObj.length - 1; i++) {
                let shipmentQuantity = getItemsCount(shippingObj[i].items) || 0;
                allPreviousShipments.push({
                    ShipmentDate: shippingObj[i].date.split('T')[0],
                    ShipmentQuantity: shipmentQuantity,
                    ShipmentTotal: order.shippingTotalPrice.value,
                    ShipmentTrackingLink: returnsUtils.getShippingTrackingLink(order, shippingObj[i]),
                    Product: []
                });

                for (let itemSku in shippingObj[i].items) {
                    let itemsQuantity = Number(shippingObj[i].items[itemSku]);
                    let curLineItem = findPLIBySku(itemSku, productLineItems),
                    VASize = !empty(curLineItem) && !empty(curLineItem.product) ? curLineItem.product.variationModel.getProductVariationAttribute('size') : null,
                            ProductSizeValue = !empty(curLineItem) && !empty(curLineItem.product) && VASize ? curLineItem.product.variationModel.getSelectedValue(VASize) : null,
                            size = ProductSizeValue && ProductSizeValue.displayValue ? Resource.msg('addtobag.size.' + ProductSizeValue.displayValue.replace(/[' ']/g, '_'), 'checkout', ProductSizeValue.displayValue) : !empty(curLineItem) && !empty(curLineItem.product) ? curLineItem.product.custom.size : null;
                    if (curLineItem) {
                        try {
                            let imageURL = curLineItem.product ? curLineItem.product.getImage('pdpMainDesktop', 0).getURL().toString() : productHelper.getNoImageURL('gridTileDesktop');
                            var pdpUrlAction = new URLAction('Product-Show', Site.getCurrent().getID(), order.custom.customerLocale);
                            var pdpURL = URLUtils.https(pdpUrlAction, new URLParameter('pid', curLineItem.productID)).toString();
                            allPreviousShipments[i].Product.push({
                                ImageURL: imageURL,
                                PdpURL: URLUtilsHelper.prepareURLForLocale(pdpURL.toString(), order.custom.customerLocale),
                                Name: curLineItem.productName,
                                SKU: itemSku,
                                Color: getProductColor(curLineItem),
                                Size: size,
                                Price: curLineItem.adjustedPrice.value / curLineItem.quantity.value,
                                Quantity: itemsQuantity
                            });
                        } catch(e) {
                            Logger.error("oms.js: " + e);
                        }
                    }
                }
            }
        }
        return allPreviousShipments;
    }
    
    //parses currentShipmentObject (the last from whole obj) and returns array with product items of current shipment
    function getCurrentShipmentItems(currentShipmentObj) {
        var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
        var allCurrentShipmentItems = [];
        if (currentShipmentObj && 'items' in currentShipmentObj && currentShipmentObj.items) {
            for (let itemSku in currentShipmentObj.items) {
                let itemsQuantity = Number(currentShipmentObj.items[itemSku]);
                let curLineItem = findPLIBySku(itemSku, productLineItems),
                    VASize = !empty(curLineItem) && !empty(curLineItem.product) ? curLineItem.product.variationModel.getProductVariationAttribute('size') : null,
                    ProductSizeValue = !empty(curLineItem) && !empty(curLineItem.product) && VASize ? curLineItem.product.variationModel.getSelectedValue(VASize) : null,
                    size = ProductSizeValue && ProductSizeValue.displayValue ? Resource.msg('addtobag.size.' + ProductSizeValue.displayValue.replace(/[' ']/g, '_'), 'checkout', ProductSizeValue.displayValue) : "";
                
                if (empty(size) && curLineItem) {
                    size = !empty(curLineItem.product) ? curLineItem.product.custom.size : "";
                }

                if (curLineItem) {
                    var jerseyName='',jerseyNumber='',sponsors='',ispersonalized='No', optionsobj = [];

                    try {
                        if (('jerseyName' in curLineItem.custom && 'jerseyNumber' in curLineItem.custom && 'sponsors' in curLineItem.custom) && (curLineItem.custom.jerseyName === 'Yes' || curLineItem.custom.jerseyNumber === 'Yes' || curLineItem.custom.sponsors === 'Yes')){
                            ispersonalized = 'Yes';
                            if(curLineItem.custom.jerseyName === 'Yes'){
                                jerseyName=curLineItem.custom.jerseyNameText;
                            }
                            if(curLineItem.custom.jerseyNumber === 'Yes'){
                                jerseyNumber=curLineItem.custom.jerseyNumberText;
                            }
                            if(curLineItem.custom.sponsors === 'Yes'){
                                sponsors = curLineItem.custom.sponsors;
                            }
                        }
                        
                        for (let j = 0; j < curLineItem.optionProductLineItems.length; j++) {
                            var optionPLIObj = curLineItem.optionProductLineItems[j];
                            optionsobj.push({
                                optionItems : {
                                    Price:optionPLIObj.priceValue,
                                    Name:optionPLIObj.lineItemText,
                                    OptionId:optionPLIObj.optionID
                                }
                            });
                        }

                        let imageURL = curLineItem.product ? curLineItem.product.getImage('pdpMainDesktop', 0).getURL().toString() : productHelper.getNoImageURL('gridTileDesktop');
                        var pdpUrlAction = new URLAction('Product-Show', Site.getCurrent().getID(), order.custom.customerLocale);
                        var pdpURL = URLUtils.https(pdpUrlAction, new URLParameter('pid', curLineItem.productID)).toString();
                        allCurrentShipmentItems.push({
                            ImageURL: imageURL,
                            PdpURL: URLUtilsHelper.prepareURLForLocale(pdpURL.toString(), order.custom.customerLocale),
                            Name: curLineItem.productName,
                            SKU: itemSku,
                            Color: getProductColor(curLineItem),
                            Size: size,
                            Price: curLineItem.adjustedPrice.value / curLineItem.quantity.value,
                            Quantity: itemsQuantity,
                            ispersonalized:ispersonalized,
                            JerseyName:jerseyName,
                            JerseyNumber:jerseyNumber,
                            Sponsors:sponsors,
                            optionsobj:optionsobj
                        });
                    } catch(e) {
                        Logger.error("oms.js: " + e);
                    }
                }
            }
        }
        return allCurrentShipmentItems;
    }
    
    //parses all LineItems and compares them to shippedItems, returns array with future shipment items
    function getFutureShippedItems(PLI, shippingObj, order) {
        var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
        var allShippedItems = {},
            futureShippedItems= [];
        
        for (var i=0;i<shippingObj.length;i++) {
            for (var item in shippingObj[i].items) {
                if (allShippedItems.hasOwnProperty(item)) {
                    allShippedItems[item] = +allShippedItems[item] + +shippingObj[i].items[item];
                } else {
                    allShippedItems[item] = +shippingObj[i].items[item];
                }
            }
        }
        //check allLineItems vs shippedItems, push to futureShippedItems if any
        for (var i=0;i < PLI.length;i++) {
            var pliShipped = false;
            if (!empty(PLI[i]) && !empty(PLI[i].product)) {
	            let VASize = PLI[i].product.variationModel.getProductVariationAttribute('size'),
	                ProductSizeValue = PLI[i].product.variationModel.getSelectedValue(VASize);
	                var size = ProductSizeValue && ProductSizeValue.displayValue ? Resource.msg('addtobag.size.' + ProductSizeValue.displayValue.replace(/[' ']/g, '_'), 'checkout', ProductSizeValue.displayValue) : PLI[i].product.custom.size;
	                	            
	            for (var shippedItem in allShippedItems) {
	                if(PLI[i].getProduct().custom.sku == shippedItem && PLI[i].getQuantityValue() != allShippedItems[shippedItem]) {
                        var pdpUrlAction = new URLAction('Product-Show', Site.getCurrent().getID(), order.custom.customerLocale);
                        var pdpURL = URLUtils.https(pdpUrlAction, new URLParameter('pid', PLI[i].productID)).toString();
	                    try {
	                        futureShippedItems.push({
	                            ImageURL : PLI[i].product.getImage('pdpMainDesktop', 0).getURL().toString(),
                                PdpURL: URLUtilsHelper.prepareURLForLocale(pdpURL.toString(), order.custom.customerLocale),
	                            Name : PLI[i].productName,
	                            SKU : PLI[i].product.custom.sku,
	                            Color : PLI[i].product.custom.colorgroup,
	                            Size : size,
	                            Price : PLI[i].adjustedPrice.value / PLI[i].quantity.value,
	                            Quantity : PLI[i].getQuantityValue() - allShippedItems[shippedItem]
	                        });
	                        pliShipped = true;
	                    } catch(e){
	                        Logger.error("oms.js: " + e);
	                        continue;
	                    }
	                } else if(PLI[i].getProduct().custom.sku == shippedItem && PLI[i].getQuantityValue() == allShippedItems[shippedItem]) {
	                    //all quantities shipped
	                    pliShipped = true;
	                }
	            }
            }
            if (!pliShipped) {
                try {
                    let imageURL = PLI[i].product ? PLI[i].product.getImage('pdpMainDesktop', 0).getURL().toString() : productHelper.getNoImageURL('gridTileDesktop');
                    var pdpUrlAction = new URLAction('Product-Show', Site.getCurrent().getID(), order.custom.customerLocale);
                    var pdpURL = URLUtils.https(pdpUrlAction, new URLParameter('pid', PLI[i].productID)).toString();
                    let color = PLI[i].product ? PLI[i].product.custom.colorgroup : '';
                    futureShippedItems.push({
                        ImageURL : imageURL,
                        PdpURL: URLUtilsHelper.prepareURLForLocale(pdpURL.toString(), order.custom.customerLocale),
                        Name : PLI[i].productName,
                        SKU : PLI[i].custom.sku,
                        Color : color,
                        Size : size,
                        Price : PLI[i].adjustedPrice.value / PLI[i].quantity.value,
                        Quantity : PLI[i].getQuantityValue()
                    });
                } catch(e) {
                    Logger.error("oms.js: " + e);
                }
            }
        }
        return futureShippedItems;
    }
    
    //returns productLineItem by SKU number
    function findPLIBySku(sku, PLI) {
        for (let i=0;i < PLI.length;i++) {
            if (!empty(PLI[i]) && PLI[i].custom && 'sku' in PLI[i].custom) {
                if (PLI[i].custom.sku === sku) {
                    return PLI[i];
                }
            }
        }
        return null;
    }
    
    //returns number of items from required shipObj 
    function getItemsCount(items) {
        let shipmentQuantity = 0;
        for (let itemSku in items) {
            shipmentQuantity += Number(items[itemSku]);
        }
        return shipmentQuantity;
    }
}

/**
 * Declares attributes for data mapping for request XML
 * @param {Object} params
 * @returns {Object} Map of hook function to an array of strings
 */
 function getRequestRefundObject(params) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    let order = params.Order,
        returnsUtils = new ReturnsUtils(),
        refObj = JSON.parse(order.custom.refundsJson),
        urlAction = new URLAction('Order-TrackOrder', Site.getCurrent().getID(), order.custom.customerLocale),
        orderDetailsLink = URLUtils.https(urlAction, new URLParameter('orderNo', order.orderNo)).toString(),
        newArrivalsAction = new URLAction('Search-Show', Site.getCurrent().getID(), order.custom.customerLocale),
        newArrivalsURL = URLUtils.https(newArrivalsAction, new URLParameter('cgid','new-arrivals')).toString(),
        refundObj = {
            CustomerEmail: order.customerEmail,
            CustomerFirstName: !empty(order.customer.profile) ? order.customer.profile.firstName : order.billingAddress.firstName,
            CustomerLastName: !empty(order.customer.profile) ? order.customer.profile.lastName : order.billingAddress.lastName,
            OrderDeliveryType: 'shipping',
            RMANumber: refObj[refObj.length - 1].returnNumber,
            ReturnType: '',
            ReturnDetailsLink: URLUtilsHelper.prepareURLForLocale(orderDetailsLink.toString(), order.custom.customerLocale),
            RefundSubtotal: params.subTotal,
            RefundTaxes: params.tax,
            RefundTotal: refObj[refObj.length - 1].refundAmount,
            RefundPayment: {
                Type: getPaymentType(order),
                Amount:  order.getPaymentInstruments()[0].getPaymentTransaction() ? order.getPaymentInstruments()[0].getPaymentTransaction().amount.value : '',
                CreditCardLast4: ''
            },
            ReturnedProduct: [],
            NewArrivalsURL: URLUtilsHelper.prepareURLForLocale(newArrivalsURL.toString(), order.custom.customerLocale)
    };

     for (let sku in refObj[refObj.length - 1].items) {
        let productLineItem = returnsUtils.getPLIBySKU(order, sku),
        VASize = productLineItem && productLineItem.product ? productLineItem.product.variationModel.getProductVariationAttribute('size') : null;
        let ProductSizeValue = productLineItem && VASize && productLineItem.product ? productLineItem.product.variationModel.getSelectedValue(VASize) : null;
        let size = ProductSizeValue && ProductSizeValue.displayValue ? Resource.msg('addtobag.size.' + ProductSizeValue.displayValue.replace(/[' ']/g, '_'),'checkout', ProductSizeValue.displayValue) : (productLineItem.product ? productLineItem.product.custom.size : '');
        if (productLineItem) {
            let imageURL = '';
           if (productLineItem.product && productLineItem.product.getImage('pdpMainDesktop', 0)) {
               imageURL = productLineItem.product.getImage('pdpMainDesktop', 0).getURL().toString();
           } else {
               imageURL = productHelper.getNoImageURL('gridTileDesktop');
               Logger.error("oms.js: Image is empty:" + productLineItem.productName + "|"+sku);
           }
           var pdpUrlAction = new URLAction('Product-Show', Site.getCurrent().getID(), order.custom.customerLocale);
           var pdpURL = URLUtils.https(pdpUrlAction, new URLParameter('pid', productLineItem.productID)).toString();
           refundObj.ReturnedProduct.push({
                ImageURL: imageURL,
                PdpURL: URLUtilsHelper.prepareURLForLocale(pdpURL.toString(), order.custom.customerLocale),
                Name: productLineItem.productName,
                SKU: sku,
                Color: getProductColor(productLineItem),
                Size: size,
                Price: Number(productLineItem.adjustedPrice.value) / Number(refObj[refObj.length - 1].items[sku]),
                TaxBasis: Number(productLineItem.taxBasis.value) / Number(refObj[refObj.length - 1].items[sku]),
                TaxBasisPerItem: (Number(productLineItem.taxBasis.value) / productLineItem.quantityValue),
                PurchasePrice: refObj[refObj.length - 1].itemAmounts[sku],
                Quantity: refObj[refObj.length - 1].items[sku]
            });
        }
    }

    return refundObj;
}

/*
* Declares attributes for data mapping for request XML for return
* @param {Object} params
* @returns {Object} Map of hook function to an array of strings
*/
function getRequestReturnObject(params) {
    let productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    let order = params.Order;
    let returnCase = params.returnCase;
    let returnsUtils = new ReturnsUtils();
    let urlAction = new URLAction('Order-TrackOrder', Site.getCurrent().getID(), order.custom.customerLocale);
    let orderDetailsLink = URLUtils.https(urlAction, new URLParameter('orderNo', order.orderNo)).toString();
    let newArrivalsAction = new URLAction('Search-Show', Site.getCurrent().getID(), order.custom.customerLocale);
    let newArrivalsURL = URLUtils.https(newArrivalsAction, new URLParameter('cgid','new-arrivals')).toString();
    let returnObj = {
            CustomerEmail: order.customerEmail,
            CustomerFirstName: !empty(order.customer.profile) ? order.customer.profile.firstName : order.billingAddress.firstName,
            CustomerLastName: !empty(order.customer.profile) ? order.customer.profile.lastName : order.billingAddress.lastName,
            TrackingNumber: params.trackingNumber,
            ReturnDetailsLink: URLUtilsHelper.prepareURLForLocale(orderDetailsLink.toString(), order.custom.customerLocale),
            ReprintReturnLabel: params.returnInfoLink,
            ReturnNumber: returnCase.returnCaseNumber,
            ReturnProducts: [],
            NewArrivalsURL: URLUtilsHelper.prepareURLForLocale(newArrivalsURL.toString(), order.custom.customerLocale),
            ReturnProviderName: returnCase.custom.returnShipmentProvider,
            ReturnTrackingLink: returnCase.custom.trackingLink
    };

    for (let i = 0; i < returnCase.items.length; i++) {
        let productLineItem = returnCase.items[i].lineItem;
        let productImage = productLineItem.product && productLineItem.product.getImage('pdpMainDesktop', 0) ? productLineItem.product.getImage('pdpMainDesktop', 0).getURL().toString() : productHelper.getNoImageURL('cartMiniDesktop');
        var pdpUrlAction = new URLAction('Product-Show', Site.getCurrent().getID(), order.custom.customerLocale);
        var pdpURL = URLUtils.https(pdpUrlAction, new URLParameter('pid', productLineItem.productID)).toString();
        let size = productLineItem.product ? productLineItem.product.custom.size : '';
        returnObj.ReturnProducts.push({
            Product: {
                ImageURL: productImage,
                PdpURL: URLUtilsHelper.prepareURLForLocale(pdpURL.toString(), order.custom.customerLocale),
                Name: productLineItem.productName,
                SKU: productLineItem.custom.sku,
                Color: getProductColor(productLineItem),
                Size: size,
                Price: productLineItem.proratedPrice.value / productLineItem.quantity.value,
                Quantity: returnCase.items[i].authorizedQuantity.value,
                TaxBasisPerItem: (Number(productLineItem.taxBasis.value) / productLineItem.quantityValue),
            }
        });
    }

    return returnObj;
}

function getPaymentType(order) {
    return ('Adyen_paymentMethod' in order.custom) && !empty(order.custom.Adyen_paymentMethod) ? order.custom.Adyen_paymentMethod : 'mc';
}


/**
 * Declares attributes available for data mapping configuration
 * @returns {Object} Map of hook function to an array of strings
 */
function triggerDefinitions() {
    return {
        shipment: {
            description: 'See API doc for dw.om.shipments.ShipmentDetail to determine available fields for mapping.\n' +
            'https://documentation.demandware.com/API1/index.jsp',
            attributes: [
                'Shipment'
            ]
        },
        returnOrderCreated: {
            description: 'See API doc for dw.om.returnorders.ReturnOrderDetail to determine available fields for mapping.\n' +
            'https://documentation.demandware.com/API1/index.jsp',
            attributes: [
                'ReturnOrder'
            ]
        },
        invoiceProcessed: {
            description: 'See API doc for dw.om.invoices.InvoiceDetail to determine available fields for mapping.\n' +
            'https://documentation.demandware.com/API1/index.jsp',
            attributes: [
                'Invoice'
            ]
        }
    };
}

module.exports = require('dw/system/HookMgr').callHook(
    'app.communication.handler.initialize',
    'initialize',
    require('./handler').handlerID,
    'app.communication.oms',
    {
        shipment: shipment,
        returnOrderCreated: returnOrderCreated,
        invoiceProcessed: invoiceProcessed,
        orderRefund: orderRefund
    }
);

// non-hook exports
module.exports.triggerDefinitions = triggerDefinitions;
