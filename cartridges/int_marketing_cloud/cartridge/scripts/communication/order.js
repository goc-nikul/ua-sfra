'use strict';

/**
 * @module communication/order
 */

const sendTrigger = require('./util/send').sendTrigger;
const hookPath = 'app.communication.order.';
const helpers = require('../util/helpers');
var Resource = require("dw/web/Resource");
const URLAction = require('dw/web/URLAction'),
	Site = require('dw/system/Site'),
	URLUtils = require('dw/web/URLUtils'),
    URLParameter = require('dw/web/URLParameter'),
    URLUtilsHelper = require('int_customfeeds/cartridge/scripts/util/URLUtilsHelper');


/**
 * Trigger an order confirmation notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function confirmation(promise, data) {
	var Logger = require('dw/system/Logger');
	try {
		let OrderConfirmationXML = new XML('<OrderConfirmation></OrderConfirmation>'),
	    requestXML = helpers.generateRequestXML(getRequestOrderObject(data.params), OrderConfirmationXML);
		data.TransactionXML = requestXML.toString();
        data.localeData = data.params.Order.custom.customerLocale.split('_');
        Logger.getLogger("OrderEmail_Testing").debug("Order" + data.TransactionXML);
		return sendTrigger(hookPath + 'confirmation', promise, data);
	} catch(ex) {
		Logger.error('Failed to send order confimation email for the order :: ' + data.params.Order.orderNo + ' and the error is :: ' + ex.message);
	}
}

/**
 * Trigger an order fraud notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function fraud(promise, data) {
    let OrderCancellationXML = new XML('<OrderCancelled></OrderCancelled>');
    let requestXML = helpers.generateRequestXML(getRequestOrderCancelObject(data.params), OrderCancellationXML);
    data.TransactionXML = requestXML.toString();
    data.localeData = data.params.Order.custom.customerLocale.split('_');

    return sendTrigger(hookPath + 'fraud', promise, data);
}

/**
 * Trigger an order return label email
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function returnLabel(promise, data) {
	var Logger = require('dw/system/Logger');
	try {
		let ReturnLabelXML = new XML('<ReturnLabel></ReturnLabel>'),
	    requestXML = helpers.generateRequestXML(getReturnLabelRequestObject(data.params), ReturnLabelXML);
		data.TransactionXML = requestXML.toString();
		data.localeData = data.params.returnLabelData.returnObj.customerLocale.split('_'); //data.params.Order.custom.customerLocale.split('_');
		data.toEmail = data.params.returnLabelData.returnObj.CustomerEmail;
		return sendTrigger(hookPath + 'returnLabel', promise, data);
	} catch(ex) {
		Logger.error('Failed to send order confimation email for the order {0} and the error is {1}', data.params.Order.orderNo, ex.message);
	}
}


/**
 * Declares attributes for data mapping for request XML
 * @param {order} Order
 * @returns {Object} Map of hook function to an array of strings
 */
function getRequestOrderCancelObject(params) {
    let order = params.Order,
        urlAction = new URLAction('Order-Details', Site.getCurrent().getID(), order.custom.customerLocale),
        orderDetailsLink = URLUtils.https(urlAction, new URLParameter('orderID', order.orderNo)).toString(),
        newArrivalsAction = new URLAction('Search-Show', Site.getCurrent().getID(), order.custom.customerLocale),
        newArrivalsURL = URLUtils.https(newArrivalsAction, new URLParameter('cgid','new-arrivals')).toString(),
        orderCancelObj = {
            CustomerEmail: order.customerEmail,
            CustomerFirstName: !empty(order.customer.profile) ? order.customer.profile.firstName : order.billingAddress.firstName,
            CustomerLastName: !empty(order.customer.profile) ? order.customer.profile.lastName : order.billingAddress.lastName,
            OrderNumber: order.orderNo,
            OrderDetailsLink: URLUtilsHelper.prepareURLForLocale(orderDetailsLink.toString(), order.custom.customerLocale),
            OrderCancelledType: params.orderCancelledType,
            voucherExpirationTimeInDays: 0,
            NewArrivalsURL: URLUtilsHelper.prepareURLForLocale(newArrivalsURL.toString(), order.custom.customerLocale)
    };

    return orderCancelObj;
}


/**
 * Declares attributes for data mapping for request XML
 * @param {order} Order
 * @returns {Object} Map of hook function to an array of strings
 */
function getRequestOrderObject(params) {
	const Money = require('dw/value/Money');
	const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
	var StringUtils = require('dw/util/StringUtils');
	var giftCardTotal = new Money(giftcardHelper.getGcRedeemedAmount(params.Order), params.Order.getCurrencyCode());
	var athleteAllotmentAmount = 0;
    if (Site.current.getCustomPreferenceValue('enableVIPCheckoutExperience')) {
        var vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
        athleteAllotmentAmount = vipDataHelpers.getVipRedeemedAmount(params.Order);
    }
    let order = params.Order,
        urlAction = new URLAction('Order-Details', Site.getCurrent().getID(), order.custom.customerLocale),
        orderDetailsLink = URLUtils.https(urlAction, new URLParameter('orderID', order.orderNo)).toString(),
        DeliveryHelper = require('app_ua_core/cartridge/scripts/util/DeliveryHelper'),
        availableDeliveryDates = DeliveryHelper.getAvailableDeliveryDatesFormated(order.getDefaultShipment().getShippingMethod()),
        productLineItems = order.getProductLineItems(),
        shippingAddress = order.defaultShipment.shippingAddress,
        orderUtils = require("app_ua_core/cartridge/scripts/util/OrderUtils"),
        distanceSalesAgreement = Resource.msg('email.disclosure.distance.agreement', 'email', null) === 'true' && orderUtils.getPDFDistanceSalesAgreementURL(order.getUUID(), order.getCreationDate()),
        preDisclosure = Resource.msg('email.disclosure.distance.agreement', 'email', null) === 'true' && orderUtils.getPDFPreDisclosureFormURL(order.getUUID(), order.getCreationDate()),
        paymentType = getPaymentType(order),
        newArrivalsAction = new URLAction('Search-Show', Site.getCurrent().getID(), order.custom.customerLocale),
        newArrivalsURL = URLUtils.https(newArrivalsAction, new URLParameter('cgid','new-arrivals')).toString();

        availableDeliveryDates = (!empty(availableDeliveryDates) && availableDeliveryDates[0].value.equals(availableDeliveryDates[1].value)) ? availableDeliveryDates[1].value : availableDeliveryDates[0].value + '-' + availableDeliveryDates[1].value;
    var CustomerFirstName;
    var CustomerLastName;
    if (order.custom.maoOrderType == 'TELE') {
        CustomerFirstName = !empty(order.billingAddress.firstName) ? order.billingAddress.firstName : shippingAddress.firstName; 
        CustomerLastName = !empty(order.billingAddress.lastName) ? order.billingAddress.lastName : shippingAddress.lastName; 
    } else {
        CustomerFirstName = !empty(order.customer.profile) && !empty(order.customer.profile.firstName) ? order.customer.profile.firstName : order.billingAddress.firstName;
        CustomerLastName = !empty(order.customer.profile) && !empty(order.customer.profile.lastName) ? order.customer.profile.lastName : order.billingAddress.lastName;
    }
            
    let orderObj = {};
    var isCommercialPickupHAL = order.custom.isCommercialPickup;
    if (isCommercialPickupHAL) {
        var BaseURL = Site.getCurrent().getCustomPreferenceValue('halGoogleMapsEndpoint');
        var storeAddress = (shippingAddress.address1 + ' ' + shippingAddress.address2 + ' ' + shippingAddress.city + ' ' + shippingAddress.stateCode + ' ' + shippingAddress.postalCode).toString().replace(' ', '+').replace('&', '+');
        var storeMapLink = BaseURL + storeAddress;
        var storeName = shippingAddress.address1.split(' ');
        var HALstorename = shippingAddress.address1;
        if (!empty(storeName) && storeName.length < 3) {
            HALstorename = storeName[0];
        }
        let PrimaryPickupFName = shippingAddress.firstName ? shippingAddress.firstName : order.billingAddress.firstName,
            PrimaryPickupLName = shippingAddress.lastName ? shippingAddress.lastName : order.billingAddress.lastName;
        var PrimaryPickupName = (PrimaryPickupFName + ' ' + PrimaryPickupLName).toString();
        orderObj = {
            CustomerEmail: order.customerEmail,
            CustomerFirstName: CustomerFirstName,
            CustomerLastName: CustomerLastName,
            OrderNumber: order.orderNo,
            OrderDeliveryType: 'Pickup',
            isCommercialPickup: 'true',
            PrimaryPickupName: PrimaryPickupName,
            PrimaryPickupEmail: order.customerEmail,
            PrimaryPickupPhone: order.billingAddress.phone,
            PickupStore: {
                Name: HALstorename || shippingAddress.address1,
                Phone: '',
                Link: storeMapLink || '',
                Address: {
                    Line1: shippingAddress.address2 ? shippingAddress.address2 : shippingAddress.address1,
                    Line2: '',
                    City: shippingAddress.city && Resource.msg('city.' + shippingAddress.city.toLowerCase(), 'forms', '') || shippingAddress.city,
                    Region: shippingAddress.stateCode != 'undefined' && shippingAddress.stateCode || '',
                    Postal: shippingAddress.postalCode,
                    Country: shippingAddress.countryCode.displayValue ? shippingAddress.countryCode.displayValue : shippingAddress.countryCode.ID
                },
                Hours: ''
            },
            EstimatedDeliveryDateRange: availableDeliveryDates,
            Subtotal: require('app_ua_core/cartridge/scripts/util/PriceHelper')
                .getLocalizedPrice(order.getMerchandizeTotalPrice()).decimalValue.toString(),
            DiscountTotal: order.merchandizeTotalPrice.subtract(order.adjustedMerchandizeTotalPrice).decimalValue.toString(),
            Taxes: order.totalTax.decimalValue.toString(),
            PickupCost: '',
            ShippingCost: order.adjustedShippingTotalPrice.decimalValue.toString(),
            GiftCardsQuantity: giftcardHelper.basketHasGiftCardItems(order).giftCardItemsCount,
            GiftCardsChargeAmount: giftCardTotal.value,
            AthleteAllotmentAmount: athleteAllotmentAmount > 0 ? athleteAllotmentAmount : '',
            Total: order.totalGrossPrice.decimalValue.toString(),
            Payment: paymentType,
            OrderDetailsLink: URLUtilsHelper.prepareURLForLocale(orderDetailsLink.toString(), order.custom.customerLocale),
            ShippingProducts: [],
            NewArrivalsURL: URLUtilsHelper.prepareURLForLocale(newArrivalsURL.toString(), order.custom.customerLocale)
        };

    } else {
        var instorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
        var bopisShipment = instorePickupStoreHelpers.getBopisShipment(order.shipments)
        if (bopisShipment && !empty(bopisShipment.custom.fromStoreId)) {
            orderObj = {
                CustomerEmail: order.customerEmail,
                CustomerFirstName: CustomerFirstName,
                CustomerLastName: CustomerLastName,
                PrimaryPickupName: bopisShipment.shippingAddress.fullName,
                PrimaryPickupEmail: order.customerEmail,
                PrimaryPickupPhone: order.billingAddress.phone,
                PickupCost: '0', // Assuming in-store pickup cost will be zero
                isCommercialPickup: 'false', // Always false for non HAL
                OrderNumber: order.orderNo,
                EstimatedDeliveryDateRange: availableDeliveryDates,
                Subtotal: require('app_ua_core/cartridge/scripts/util/PriceHelper').getLocalizedPrice(order.getMerchandizeTotalPrice()).decimalValue.toString(),
                DiscountTotal: order.merchandizeTotalPrice.subtract(order.adjustedMerchandizeTotalPrice).decimalValue.toString(),
                Taxes: order.totalTax.decimalValue.toString(),
                ShippingCost: order.adjustedShippingTotalPrice.decimalValue.toString(),
                GiftCardsQuantity: giftcardHelper.basketHasGiftCardItems(order).giftCardItemsCount,
                GiftCardsChargeAmount: giftCardTotal.value,
                AthleteAllotmentAmount: athleteAllotmentAmount > 0 ? athleteAllotmentAmount : '',
                Total: order.totalGrossPrice.decimalValue.toString(),
                Payment: paymentType,
                OrderDetailsLink: URLUtilsHelper.prepareURLForLocale(orderDetailsLink.toString(), order.custom.customerLocale),
                PickupProducts: [],
                NewArrivalsURL: URLUtilsHelper.prepareURLForLocale(newArrivalsURL.toString(), order.custom.customerLocale)
            };
            var StoreMgr = require('dw/catalog/StoreMgr');
            var store = StoreMgr.getStore(bopisShipment.custom.fromStoreId);
            if (order.shipments.length > 1) {
                // Split shipment case - BOPIS + Ship to home
                orderObj.OrderDeliveryType = 'split';
                orderObj.ShippingProducts = [];
                orderObj.Shipping = {
                    FirstName: shippingAddress.firstName,
                    LastName: shippingAddress.lastName,
                    Company: shippingAddress.companyName,
                    Address: {
                        Line1: shippingAddress.address1,
                        Line2: shippingAddress.address2,
                        City: shippingAddress.city && Resource.msg('city.' + shippingAddress.city.toLowerCase(), 'forms', '') || shippingAddress.city,
                        Region: shippingAddress.stateCode != 'undefined' && shippingAddress.stateCode || '',
                        Postal: shippingAddress.postalCode,
                        Country: shippingAddress.countryCode.displayValue
                    }
                }
            } else {
                // Only BOPIS
                orderObj.OrderDeliveryType = 'Pickup';
            }
            if (!empty(store)) {
                var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers.js');
                var storeMapLink = storeHelpers.getStoreGoogleMapLink(store);
                orderObj.PickupStore = {
                    Name: store.name,
                    Type: !empty(store.custom.storeType) ? store.custom.storeType.displayValue : '',
                    Phone: store.phone,
                    Link: storeMapLink,
                    Address: {
                        Line1: store.address1,
                        Line2: store.address2,
                        City: store.city,
                        Region: store.stateCode,
                        Postal: store.postalCode,
                        Country: store.countryCode.value
                    },
                    Hours: {
                        Range: storeHelpers.getStoreHoursforSFMC(store.custom.storeHoursJson)
                    }
                }
            }
        } else {
            // Ship to home(Regular) order
            orderObj = {
                CustomerEmail: order.customerEmail,
                CustomerFirstName: CustomerFirstName,
                CustomerLastName: CustomerLastName,
                OrderNumber: order.orderNo,
                OrderDeliveryType: 'shipping',
                isCommercialPickup: 'false',
                preDisclosure: preDisclosure || '',
                distanceSalesAgreement: distanceSalesAgreement || '',
                voucherUrl: '', //order.custom.Adyen_voucherUrl || '',
                Shipping: {
                    FirstName: shippingAddress.firstName,
                    LastName: shippingAddress.lastName,
                    Company: shippingAddress.companyName,
                    Address: {
                        Line1: shippingAddress.address1,
                        Line2: shippingAddress.address2,
                        City: shippingAddress.city && Resource.msg('city.' + shippingAddress.city.toLowerCase(), 'forms', '') || shippingAddress.city,
                        Region: shippingAddress.stateCode != 'undefined' && shippingAddress.stateCode || '',
                        Postal: shippingAddress.postalCode,
                        Country: shippingAddress.countryCode.displayValue,
                        addToSMSList: 'addToSMSList' in shippingAddress.custom && shippingAddress.custom.addToSMSList ? 'true' : 'false',
                        additionalInformation: 'additionalInformation' in shippingAddress.custom && shippingAddress.custom.additionalInformation || '',
                        colony: 'colony' in shippingAddress.custom && shippingAddress.custom.colony || '',
                        community: 'community' in shippingAddress.custom && shippingAddress.custom.community && Resource.msg('comuna.cl.' + shippingAddress.custom.community, 'forms', shippingAddress.custom.community) || '',
                        customerEmail: 'customerEmail' in shippingAddress.custom && shippingAddress.custom.customerEmail || '',
                        dependentLocality: 'dependentLocality' in shippingAddress.custom && shippingAddress.custom.dependentLocality || '',
                        district: 'district' in shippingAddress.custom && shippingAddress.custom.district || '', // Do NOT UPDATE RESOURCE MESSAGE TO DISTRICT FIELD
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
                        jp_prefecture: 'jp_prefecture' in shippingAddress.custom && shippingAddress.custom.jp_prefecture || ''
                    }
                },
                EstimatedDeliveryDateRange: availableDeliveryDates,
                Subtotal: require('app_ua_core/cartridge/scripts/util/PriceHelper')
                    .getLocalizedPrice(order.getMerchandizeTotalPrice()).decimalValue.toString(),
                DiscountTotal: order.merchandizeTotalPrice.subtract(order.adjustedMerchandizeTotalPrice).decimalValue.toString(),
                Taxes: order.totalTax.decimalValue.toString(),
                ShippingCost: order.adjustedShippingTotalPrice.decimalValue.toString(),
                GiftCardsQuantity: giftcardHelper.basketHasGiftCardItems(order).giftCardItemsCount,
                GiftCardsChargeAmount: giftCardTotal.value,
                AthleteAllotmentAmount: athleteAllotmentAmount > 0 ? athleteAllotmentAmount : '',
                Total: order.totalGrossPrice.decimalValue.toString(),
                Payment: paymentType,
                OrderDetailsLink: URLUtilsHelper.prepareURLForLocale(orderDetailsLink.toString(), order.custom.customerLocale),
                ShippingProducts: [],
                NewArrivalsURL: URLUtilsHelper.prepareURLForLocale(newArrivalsURL.toString(), order.custom.customerLocale)
            };
        }
    }

    let productPriceAdjustmentsLength = 0,
        orderPriceAdjustmentsLength = order.priceAdjustments.length,
        productPromoName = '';

    for (let i = 0; i < productLineItems.length; i++) {
        let productLineItem = productLineItems[i];
        let size = '';

        if ( !('giftCard' in productLineItem.product.custom) || !(productLineItem.product.custom.giftCard.value === 'EGIFT_CARD' || productLineItem.product.custom.giftCard.value === 'GIFT_CARD')) {
        	let VASize = productLineItem.product.variationModel.getProductVariationAttribute('size');
	        let ProductSizeValue = productLineItem.product.variationModel.getSelectedValue(VASize);
            size = Resource.msg('addtobag.size.' + ProductSizeValue.displayValue.replace(/[' ']/g, '_'),'checkout', ProductSizeValue.displayValue);
        }
        

        productPriceAdjustmentsLength += productLineItem.priceAdjustments.length;
        productPromoName = productPriceAdjustmentsLength === 1 && empty(productPromoName) ? (!empty(productLineItem.priceAdjustments[0].promotion) ? productLineItem.priceAdjustments[0].promotion.name : '') : productPromoName;

        var jerseyName='',jerseyNumber='',sponsors='',ispersonalized='No', optionsobj = [];
        try{
        	if(productLineItem.custom.jerseyName === 'Yes' || productLineItem.custom.jerseyNumber === 'Yes' || productLineItem.custom.sponsors === 'Yes'){
            	ispersonalized = 'Yes';
            	if(productLineItem.custom.jerseyName === 'Yes'){
            		jerseyName=productLineItem.custom.jerseyNameText;
            	}
            	if(productLineItem.custom.jerseyNumber === 'Yes'){
            		jerseyNumber=productLineItem.custom.jerseyNumberText;
            	}
            	if(productLineItem.custom.sponsors === 'Yes'){
            		sponsors = productLineItem.custom.sponsorsText;
            	}
            }
        	for (let j = 0; j < productLineItem.optionProductLineItems.length; j++) {
            	var optionPLIObj = productLineItem.optionProductLineItems[j];
            	optionsobj.push({
            		optionItems : {
            			Price:optionPLIObj.priceValue,
            			Name:optionPLIObj.lineItemText,
            			OptionId:optionPLIObj.optionID
            		}
            	});
            }
        }catch(e){ }
        var Calendar = require('dw/util/Calendar');
        var pdpUrlAction = new URLAction('Product-Show', Site.getCurrent().getID(), order.custom.customerLocale);
        var pdpURL = URLUtils.https(pdpUrlAction, new URLParameter('pid', productLineItem.productID)).toString();
        if ('fromStoreId' in productLineItem.custom && !empty(productLineItem.custom.fromStoreId)) {
            orderObj.PickupProducts.push({
                Product: {
                    ImageURL: productLineItem.product.getImage('pdpMainDesktop', 0) && productLineItem.product.getImage('pdpMainDesktop', 0).getURL().toString() || '',
                    PdpURL: URLUtilsHelper.prepareURLForLocale(pdpURL.toString(), order.custom.customerLocale),
                    Name: productLineItem.productName || '',
                    SKU: 'sku' in productLineItem.product.custom && productLineItem.product.custom.sku || '',
                    Color: productLineItem.product.custom.colorgroup || '',
                    Size: size || '',
                    Price: productLineItem.adjustedPrice.value / productLineItem.quantity.value || '',
                    Quantity: productLineItem.quantityValue || '',
                    eGiftCardRecipientEmail: 'gcRecipientEmail' in productLineItem.custom && productLineItem.custom.gcRecipientEmail || '',
                    eGiftCardRecipientDate: 'gcDeliveryDate' in productLineItem.custom && StringUtils.formatCalendar(new Calendar(new Date(productLineItem.custom.gcDeliveryDate)), 'MM-dd-yyyy') || '',
                    ispersonalized: ispersonalized || '',
                    JerseyName: jerseyName || '',
                    JerseyNumber: jerseyNumber || '',
                    Sponsors: sponsors || '',
                    optionsobj: optionsobj || ''
                }
            });
        } else {
            orderObj.ShippingProducts.push({
                Product: {
                    ImageURL: productLineItem.product.getImage('pdpMainDesktop', 0) && productLineItem.product.getImage('pdpMainDesktop', 0).getURL().toString() || '',
                    PdpURL: URLUtilsHelper.prepareURLForLocale(pdpURL.toString(), order.custom.customerLocale),
                    Name: productLineItem.productName || '',
                    SKU: 'sku' in productLineItem.product.custom && productLineItem.product.custom.sku || '',
                    Color: productLineItem.product.custom.colorgroup || '',
                    Size: size || '',
                    Price: productLineItem.adjustedPrice.value / productLineItem.quantity.value || '',
                    Quantity: productLineItem.quantityValue || '',
                    eGiftCardRecipientEmail: 'gcRecipientEmail' in productLineItem.custom && productLineItem.custom.gcRecipientEmail || '',
                    eGiftCardRecipientDate: 'gcDeliveryDate' in productLineItem.custom && StringUtils.formatCalendar(new Calendar(new Date(productLineItem.custom.gcDeliveryDate)), 'MM-dd-yyyy') || '',
                    ispersonalized: ispersonalized || '',
                    JerseyName: jerseyName || '',
                    JerseyNumber: jerseyNumber || '',
                    Sponsors: sponsors || '',
                    optionsobj: optionsobj || ''
                }
            });
        }
    }

    orderObj.DiscountName = orderPriceAdjustmentsLength === 1 && productPriceAdjustmentsLength === 0 ? (!empty(order.priceAdjustments[0].promotion) ? order.priceAdjustments[0].promotion.name : '')
                                : orderPriceAdjustmentsLength === 0 && productPriceAdjustmentsLength === 1 ? productPromoName : '';

    return orderObj;
}

function getReturnLabelRequestObject(params) {
	var returnLabelData = params.returnLabelData.returnObj;
	var returnLabelDataObj = {
		CustomerEmail: returnLabelData.CustomerEmail,
		CustomerFirstName: returnLabelData.CustomerFirstName,
		CustomerLastName: returnLabelData.CustomerLastName,
		IsExchange: returnLabelData.IsExchange,
		RMANumber: returnLabelData.RMANumber,
		RMAOrderNumber: returnLabelData.RMAOrderNumber,
		ReturnCarrierCode: returnLabelData.ReturnCarrierCode,
		ReturnTrackingNumber: returnLabelData.ReturnTrackingNumber,
		LabelAttachmentUrl: returnLabelData.LabelAttachmentUrl
    }
    // Send "ServiceType" to SFMC for SmartPost service to identify FedEx Ground vs SmartPost
    if (!empty(returnLabelData.ServiceType)) {
        returnLabelDataObj.ServiceType = returnLabelData.ServiceType;
    }
	return returnLabelDataObj;
}

function getPaymentType(order) {
	var PaymentInstrument = require('dw/order/PaymentInstrument');
	// TODO: Once we get the payment type for GC+CC we have iterate through the payment instrument
	var paymentInstrument;
    //Aurus Legacy Check
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    var paymentMethod = isAurusEnabled ? 'AURUS_CREDIT_CARD' : 'Paymetric';
	if (order.getPaymentInstruments().size() > 1) {
		var ccPaymentInstruments = order.getPaymentInstruments(paymentMethod);
		if (ccPaymentInstruments.size() > 0) {
			paymentInstrument = ccPaymentInstruments[0];
		}
	} else {
		paymentInstrument = order.getPaymentInstruments()[0];
	}

	var paymentType = {
        Amount: paymentInstrument.paymentTransaction.amount.value,
        CreditCardLast4: '',
        Type: ''
    }

    if (Site.getCurrent().getID() === 'EU' || Site.getCurrent().getID() === 'UKIE') {
        paymentType.Type = ('Adyen_paymentMethod' in order.custom) && !empty(order.custom.Adyen_paymentMethod) ? order.custom.Adyen_paymentMethod : 'mc';
    }

	if (PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstrument.paymentMethod) || paymentInstrument.paymentMethod === 'Paymetric' || paymentInstrument.paymentMethod === 'AURUS_CREDIT_CARD') {
		paymentType.Type = paymentInstrument.creditCardType;
		paymentType.CreditCardLast4 = paymentInstrument.creditCardNumberLastDigits;
	}

	if (PaymentInstrument.METHOD_DW_APPLE_PAY.equals(paymentInstrument.paymentMethod)) {
		paymentType.Type = 'APAY';
	}

	if (paymentInstrument.paymentMethod.equals('PayPal')) {
		paymentType.Type = 'PP';
	}
	if (paymentInstrument.paymentMethod.equals('KLARNA_PAYMENTS')) {
		paymentType.Type = 'KLARNA_PAYMENTS';
	}

	return paymentType;
}


/**
 * Declares attributes available for data mapping configuration
 * @returns {Object} Map of hook function to an array of strings
 */
function triggerDefinitions() {
    return {
        fraud: {
            description: 'Order Confirmation trigger',
            attributes: []
        },
        confirmation: {
            description: 'Order Confirmation trigger, contains details of the placed order. To reflect line items,\n' +
                'use orderAsXML attribute and process as XML within the Marketing Cloud template.\n' +
                'To use XML approach, see Marketing Cloud docs:\n' +
                'https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/using_triggered_sends_to_confirm_purchases.htm\n' +
                'Sample XML output:\n' +
                'https://gist.github.com/intel352/23312f0fd3d0d6fd23dec6b64e2668b7',
            attributes: [
                'orderAsXML',
                'Order.affiliatePartnerID',
                'Order.affiliatePartnerName',
                'Order.capturedAmount',
                'Order.capturedAmount.currencyCode',
                'Order.capturedAmount.decimalValue',
                'Order.createdBy',
                'Order.customerLocaleID',
                'Order.customerOrderReference',
                'Order.exportAfter',
                'Order.externalOrderNo',
                'Order.externalOrderStatus',
                'Order.externalOrderText',
                'Order.invoiceNo',
                'Order.orderNo',
                'Order.orderToken',
                'Order.remoteHost',
                'Order.sourceCode',
                'Order.sourceCodeGroupID',
                'Order.adjustedMerchandizeTotalGrossPrice',
                'Order.adjustedMerchandizeTotalGrossPrice.currencyCode',
                'Order.adjustedMerchandizeTotalGrossPrice.decimalValue',
                'Order.adjustedMerchandizeTotalNetPrice',
                'Order.adjustedMerchandizeTotalNetPrice.currencyCode',
                'Order.adjustedMerchandizeTotalNetPrice.decimalValue',
                'Order.adjustedMerchandizeTotalPrice',
                'Order.adjustedMerchandizeTotalPrice.currencyCode',
                'Order.adjustedMerchandizeTotalPrice.decimalValue',
                'Order.adjustedMerchandizeTotalTax',
                'Order.adjustedMerchandizeTotalTax.currencyCode',
                'Order.adjustedMerchandizeTotalTax.decimalValue',
                'Order.adjustedShippingTotalGrossPrice',
                'Order.adjustedShippingTotalGrossPrice.currencyCode',
                'Order.adjustedShippingTotalGrossPrice.decimalValue',
                'Order.adjustedShippingTotalNetPrice',
                'Order.adjustedShippingTotalNetPrice.currencyCode',
                'Order.adjustedShippingTotalNetPrice.decimalValue',
                'Order.adjustedShippingTotalPrice',
                'Order.adjustedShippingTotalPrice.currencyCode',
                'Order.adjustedShippingTotalPrice.decimalValue',
                'Order.adjustedShippingTotalTax',
                'Order.adjustedShippingTotalTax.currencyCode',
                'Order.adjustedShippingTotalTax.decimalValue',
                'Order.billingAddress.address1',
                'Order.billingAddress.address2',
                'Order.billingAddress.city',
                'Order.billingAddress.companyName',
                'Order.billingAddress.countryCode.displayValue',
                'Order.billingAddress.countryCode.value',
                'Order.billingAddress.firstName',
                'Order.billingAddress.fullName',
                'Order.billingAddress.jobTitle',
                'Order.billingAddress.lastName',
                'Order.billingAddress.phone',
                'Order.billingAddress.postalCode',
                'Order.billingAddress.postBox',
                'Order.billingAddress.salutation',
                'Order.billingAddress.secondName',
                'Order.billingAddress.stateCode',
                'Order.billingAddress.suffix',
                'Order.billingAddress.suite',
                'Order.billingAddress.title',
                'Order.billingAddress.salutation',
                'Order.channelType.displayValue',
                'Order.channelType.value',
                'Order.currencyCode',
                'Order.customer.anonymous',
                'Order.customer.authenticated',
                'Order.customer.ID',
                'Order.customer.note',
                'Order.customer.registered',
                'Order.customer.profile.birthday',
                'Order.customer.profile.companyName',
                'Order.customer.profile.customerNo',
                'Order.customer.profile.email',
                'Order.customer.profile.fax',
                'Order.customer.profile.female',
                'Order.customer.profile.firstName',
                'Order.customer.profile.gender.displayValue',
                'Order.customer.profile.gender.value',
                'Order.customer.profile.jobTitle',
                'Order.customer.profile.lastLoginTime',
                'Order.customer.profile.lastName',
                'Order.customer.profile.lastVisitTime',
                'Order.customer.profile.male',
                'Order.customer.profile.nextBirthday',
                'Order.customer.profile.phoneBusiness',
                'Order.customer.profile.phoneHome',
                'Order.customer.profile.phoneMobile',
                'Order.customer.profile.preferredLocale',
                'Order.customer.profile.previousLoginTime',
                'Order.customer.profile.previousVisitTime',
                'Order.customer.profile.salutation',
                'Order.customer.profile.secondName',
                'Order.customer.profile.suffix',
                'Order.customer.profile.taxIDMasked',
                'Order.customer.profile.taxIDType.displayValue',
                'Order.customer.profile.taxIDType.value',
                'Order.customer.profile.title',
                'Order.customerEmail',
                'Order.customerName',
                'Order.customerNo',
                'Order.defaultShipment.adjustedMerchandizeTotalGrossPrice',
                'Order.defaultShipment.adjustedMerchandizeTotalGrossPrice.currencyCode',
                'Order.defaultShipment.adjustedMerchandizeTotalGrossPrice.decimalValue',
                'Order.defaultShipment.adjustedMerchandizeTotalNetPrice',
                'Order.defaultShipment.adjustedMerchandizeTotalNetPrice.currencyCode',
                'Order.defaultShipment.adjustedMerchandizeTotalNetPrice.decimalValue',
                'Order.defaultShipment.adjustedMerchandizeTotalPrice',
                'Order.defaultShipment.adjustedMerchandizeTotalPrice.currencyCode',
                'Order.defaultShipment.adjustedMerchandizeTotalPrice.decimalValue',
                'Order.defaultShipment.adjustedMerchandizeTotalTax',
                'Order.defaultShipment.adjustedMerchandizeTotalTax.currencyCode',
                'Order.defaultShipment.adjustedMerchandizeTotalTax.decimalValue',
                'Order.defaultShipment.adjustedShippingTotalGrossPrice',
                'Order.defaultShipment.adjustedShippingTotalGrossPrice.currencyCode',
                'Order.defaultShipment.adjustedShippingTotalGrossPrice.decimalValue',
                'Order.defaultShipment.adjustedShippingTotalNetPrice',
                'Order.defaultShipment.adjustedShippingTotalNetPrice.currencyCode',
                'Order.defaultShipment.adjustedShippingTotalNetPrice.decimalValue',
                'Order.defaultShipment.adjustedShippingTotalPrice',
                'Order.defaultShipment.adjustedShippingTotalPrice.currencyCode',
                'Order.defaultShipment.adjustedShippingTotalPrice.decimalValue',
                'Order.defaultShipment.adjustedShippingTotalTax',
                'Order.defaultShipment.adjustedShippingTotalTax.currencyCode',
                'Order.defaultShipment.adjustedShippingTotalTax.decimalValue',
                'Order.defaultShipment.gift',
                'Order.defaultShipment.giftMessage',
                'Order.defaultShipment.ID',
                'Order.defaultShipment.merchandizeTotalGrossPrice',
                'Order.defaultShipment.merchandizeTotalGrossPrice.currencyCode',
                'Order.defaultShipment.merchandizeTotalGrossPrice.decimalValue',
                'Order.defaultShipment.merchandizeTotalNetPrice',
                'Order.defaultShipment.merchandizeTotalNetPrice.currencyCode',
                'Order.defaultShipment.merchandizeTotalNetPrice.decimalValue',
                'Order.defaultShipment.merchandizeTotalPrice',
                'Order.defaultShipment.merchandizeTotalPrice.currencyCode',
                'Order.defaultShipment.merchandizeTotalPrice.decimalValue',
                'Order.defaultShipment.merchandizeTotalTax',
                'Order.defaultShipment.merchandizeTotalTax.currencyCode',
                'Order.defaultShipment.merchandizeTotalTax.decimalValue',
                'Order.defaultShipment.proratedMerchandizeTotalPrice',
                'Order.defaultShipment.proratedMerchandizeTotalPrice.currencyCode',
                'Order.defaultShipment.proratedMerchandizeTotalPrice.decimalValue',
                'Order.defaultShipment.shipmentNo',
                'Order.defaultShipment.shippingAddress.address1',
                'Order.defaultShipment.shippingAddress.address2',
                'Order.defaultShipment.shippingAddress.city',
                'Order.defaultShipment.shippingAddress.companyName',
                'Order.defaultShipment.shippingAddress.countryCode.displayValue',
                'Order.defaultShipment.shippingAddress.countryCode.value',
                'Order.defaultShipment.shippingAddress.firstName',
                'Order.defaultShipment.shippingAddress.fullName',
                'Order.defaultShipment.shippingAddress.jobTitle',
                'Order.defaultShipment.shippingAddress.lastName',
                'Order.defaultShipment.shippingAddress.phone',
                'Order.defaultShipment.shippingAddress.postalCode',
                'Order.defaultShipment.shippingAddress.postBox',
                'Order.defaultShipment.shippingAddress.salutation',
                'Order.defaultShipment.shippingAddress.secondName',
                'Order.defaultShipment.shippingAddress.stateCode',
                'Order.defaultShipment.shippingAddress.suffix',
                'Order.defaultShipment.shippingAddress.suite',
                'Order.defaultShipment.shippingAddress.title',
                'Order.defaultShipment.shippingAddress.salutation',
                'Order.defaultShipment.shippingMethod.currencyCode',
                'Order.defaultShipment.shippingMethod.description',
                'Order.defaultShipment.shippingMethod.displayName',
                'Order.defaultShipment.shippingMethod.ID',
                'Order.defaultShipment.shippingMethod.taxClassID',
                'Order.defaultShipment.shippingMethodID',
                'Order.defaultShipment.shippingTotalGrossPrice',
                'Order.defaultShipment.shippingTotalGrossPrice.currencyCode',
                'Order.defaultShipment.shippingTotalGrossPrice.decimalValue',
                'Order.defaultShipment.shippingTotalNetPrice',
                'Order.defaultShipment.shippingTotalNetPrice.currencyCode',
                'Order.defaultShipment.shippingTotalNetPrice.decimalValue',
                'Order.defaultShipment.shippingTotalPrice',
                'Order.defaultShipment.shippingTotalPrice.currencyCode',
                'Order.defaultShipment.shippingTotalPrice.decimalValue',
                'Order.defaultShipment.shippingTotalTax',
                'Order.defaultShipment.shippingTotalTax.currencyCode',
                'Order.defaultShipment.shippingTotalTax.decimalValue',
                'Order.defaultShipment.totalGrossPrice',
                'Order.defaultShipment.totalGrossPrice.currencyCode',
                'Order.defaultShipment.totalGrossPrice.decimalValue',
                'Order.defaultShipment.totalNetPrice',
                'Order.defaultShipment.totalNetPrice.currencyCode',
                'Order.defaultShipment.totalNetPrice.decimalValue',
                'Order.defaultShipment.totalTax',
                'Order.defaultShipment.totalTax.currencyCode',
                'Order.defaultShipment.totalTax.decimalValue',
                'Order.defaultShipment.trackingNumber',
                'Order.giftCertificateTotalGrossPrice',
                'Order.giftCertificateTotalGrossPrice.currencyCode',
                'Order.giftCertificateTotalGrossPrice.decimalValue',
                'Order.giftCertificateTotalNetPrice',
                'Order.giftCertificateTotalNetPrice.currencyCode',
                'Order.giftCertificateTotalNetPrice.decimalValue',
                'Order.giftCertificateTotalPrice',
                'Order.giftCertificateTotalPrice.currencyCode',
                'Order.giftCertificateTotalPrice.decimalValue',
                'Order.giftCertificateTotalTax',
                'Order.giftCertificateTotalTax.currencyCode',
                'Order.giftCertificateTotalTax.decimalValue',
                'Order.merchandizeTotalGrossPrice',
                'Order.merchandizeTotalGrossPrice.currencyCode',
                'Order.merchandizeTotalGrossPrice.decimalValue',
                'Order.merchandizeTotalNetPrice',
                'Order.merchandizeTotalNetPrice.currencyCode',
                'Order.merchandizeTotalNetPrice.decimalValue',
                'Order.merchandizeTotalPrice',
                'Order.merchandizeTotalPrice.currencyCode',
                'Order.merchandizeTotalPrice.decimalValue',
                'Order.merchandizeTotalTax',
                'Order.merchandizeTotalTax.currencyCode',
                'Order.merchandizeTotalTax.decimalValue',
                'Order.productQuantityTotal',
                'Order.shippingTotalGrossPrice',
                'Order.shippingTotalGrossPrice.currencyCode',
                'Order.shippingTotalGrossPrice.decimalValue',
                'Order.shippingTotalNetPrice',
                'Order.shippingTotalNetPrice.currencyCode',
                'Order.shippingTotalNetPrice.decimalValue',
                'Order.shippingTotalPrice',
                'Order.shippingTotalPrice.currencyCode',
                'Order.shippingTotalPrice.decimalValue',
                'Order.shippingTotalTax',
                'Order.shippingTotalTax.currencyCode',
                'Order.shippingTotalTax.decimalValue',
                'Order.totalGrossPrice',
                'Order.totalGrossPrice.currencyCode',
                'Order.totalGrossPrice.decimalValue',
                'Order.totalNetPrice',
                'Order.totalNetPrice.currencyCode',
                'Order.totalNetPrice.decimalValue',
                'Order.totalTax',
                'Order.totalTax.currencyCode',
                'Order.totalTax.decimalValue'
            ]
        }
    };
}

module.exports = require('dw/system/HookMgr').callHook(
    'app.communication.handler.initialize',
    'initialize',
    require('./handler').handlerID,
    'app.communication.order', {
        confirmation: confirmation,
        fraud: fraud,
        returnLabel: returnLabel
    }
);

// non-hook exports
module.exports.triggerDefinitions = triggerDefinitions;
