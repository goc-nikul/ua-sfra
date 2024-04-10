'use strict';

/* eslint-disable  spellcheck/spell-checker */
/* eslint-disable  prefer-const */
/*
 * API Includes
 */
const MaoConstants = require('~/cartridge/scripts/MaoConstants');
const MAOPreferences = require('~/cartridge/scripts/MaoPreferences');
const Logger = require('dw/system/Logger').getLogger('MaoOrderExport', 'MaoOrderExport');
const Site = require('dw/system/Site');

let siteID = Site.current.ID;
/**
 * Extracts current site ID and return region based on site ID.
 * @param {void} void - no parameter required.
 * @returns {string} OrderRegion
 */
function getOrderRegion() {
    let OrderRegion = null;
    switch (siteID) {
        case 'US':
            OrderRegion = 'United States';
            break;
        case 'CA':
            OrderRegion = 'Canada';
            break;
        case 'EU':
            OrderRegion = 'Europe';
            break;
        case 'UKIE':
            OrderRegion = 'UKIreland';
            break;
        default:
            // No next step
    }
    return OrderRegion;
}

/**
 * This method returns the date in site time zone in 'yyyy-MM-DD HH:mm:ss' format
 * @param {Date} date - date
 * @returns {string} formatted date
 */
function getFormattedDateInSiteTimeZone(date) {
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var dateInSiteTimeZone = new Date(date.valueOf() + Site.getCurrent().timezoneOffset);
    var calendar = new Calendar(dateInSiteTimeZone);
    return StringUtils.formatCalendar(calendar, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Get the data from order
 * @param {string} paymentMethodID object
 * @return {string} paymentProcessor Id
 */
function getPaymentGateWay(paymentMethodID) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var paymentProcessor = '';
    if (paymentMethodID === 'VIP_POINTS') {
        return null;
    }
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodID);
    if (paymentMethod) {
        var processorID = paymentMethod.getPaymentProcessor().getID();
        if (processorID.toLowerCase().indexOf('aurus') > -1) {
            paymentProcessor = 'Aurus';
        } else {
            paymentProcessor = processorID;
        }
    }

    return paymentProcessor;
}

/**
 * Returns SFCC customerNo (IDM domainUserId)
 * @Param {dw.order.Order} order dw object
 * @return {string} customerNo
 */
function getCustomerUid(order) {
    let customerNo = null;
    if (!empty(order.customer) && !empty(order.customer.profile) && !empty(order.customer.profile.customerNo)) {
        customerNo = order.customer.profile.customerNo;
    }
    return customerNo;
}

/**
 * Get the data from order
 * @param {Object} orderJSON - order json
 * @param {dw.Order.order} order object
 */
function getAurusData(orderJSON, order) {
    /* eslint-disable no-param-reassign */
    orderJSON.IsConfirmed = true;
    orderJSON.OrderLocale = order.customerLocaleID;
    orderJSON.SessionId = session.sessionID.toString();
    orderJSON.IpAddress = order.custom.customerIPAddress || order.remoteHost;
    orderJSON.CustomerId = getCustomerUid(order);
    orderJSON.CustomerEmail = order.customerEmail;
    // eslint-enable no-param-reassign
}

/**
 * Extracts current site ID and return region based on site ID.
 * @param {dw.Order.order} order object
 * @param {string} paymentMethodID - Payment ID
 * @returns {string} PayPal transaction ID if payment processor is PayPal, else null
 */
function getTransactionId(order, paymentMethodID) {
    let paymentInstruments = order.getPaymentInstruments(paymentMethodID);
    let transactionId = null;
    if (paymentInstruments.length > 0) {
        let paymentTransaction = paymentInstruments[0].paymentTransaction;
        if (paymentMethodID.equalsIgnoreCase('PayPal') && MAOPreferences.xiPayPayPalAuthEnabled && !empty(paymentTransaction.custom.xipayTRTransRefId)) {
            transactionId = paymentTransaction.custom.xipayTRTransRefId;
        } else if (!empty(paymentTransaction.transactionID)) {
            transactionId = paymentTransaction.transactionID;
        }
    }
    return transactionId;
}
/**
 * Returns transaction type FMS based on payment method.
 * @param {dw.Order.order} order object
 * @returns {string} TransactionTypeFMS
 */
function getTransactionTypeFMS(order) {
    let paymentInstruments = order.paymentInstruments.iterator();
    let TransactionTypeFMS = null;
    while (paymentInstruments.hasNext()) {
        let paymentInstrument = paymentInstruments.next();
        let paymentMethod = paymentInstrument.paymentMethod;
        if (paymentMethod.equalsIgnoreCase('DW_APPLE_PAY')) {
            TransactionTypeFMS = MaoConstants.Extended.transactionTypeFMS.applepayTransactionTypeFMS;
            break;
        } else if (paymentMethod.equalsIgnoreCase('PayPal')) {
            TransactionTypeFMS = MaoConstants.Extended.transactionTypeFMS.paypalTransactionTypeFMS;
            break;
        } else if (paymentMethod.equalsIgnoreCase('KLARNA_PAYMENTS')) {
            TransactionTypeFMS = MaoConstants.Extended.transactionTypeFMS.klarnaTransactionTypeFMS;
            break;
        }
    }

    if (siteID === 'EU' || siteID === 'UKIE') {
        TransactionTypeFMS = MaoConstants.Extended.transactionTypeFMS.emeaTransactionTypeFMS;
    }
    return TransactionTypeFMS;
}
/**
 * Returns  sap carrier code for shop runner shipping method based on state id and site pref jSON value.
 * @Param {dw.order.Shipment} shipment dw object
 * @returns {string} shopRunnerSapCarrierCode
 */
function getShopRunnerSapCarrierCode(shipment) {
    var shipAddressType = shipment.shippingAddress.custom && shipment.shippingAddress.custom.addressType && shipment.shippingAddress.custom.addressType.toLowerCase();
    var shopRunnerSapCarrierCode = shipAddressType === 'business' ? shipment.shippingMethod.custom.sapCarrierCodeCommercial : shipment.shippingMethod.custom.sapCarrierCodeResidential;
    var maoSapCarrierCodes = MAOPreferences.maoCarrierCodes;
    var stateCode = shipment.getShippingAddress().stateCode;
    if (!empty(maoSapCarrierCodes) && !empty(stateCode)) {
        var sapCarrierCodesJSON = JSON.parse(maoSapCarrierCodes);
        var shopRunnerCarrierCodeObj = sapCarrierCodesJSON[stateCode.toUpperCase()];
        if (!empty(shopRunnerCarrierCodeObj)) {
            shopRunnerSapCarrierCode = shipAddressType === 'business' ? shopRunnerCarrierCodeObj.business : shopRunnerCarrierCodeObj.residential;
        } else {
            shopRunnerSapCarrierCode = shipAddressType === 'business' ? sapCarrierCodesJSON.defaults.business : sapCarrierCodesJSON.defaults.residential;
        }
    }
    return shopRunnerSapCarrierCode;
}
/**
 * Extracts and returns JurisdictionID
 * @param {dw.Order.order} order object
 * @returns {string} JurisdictionID
 */
function getJurisdictionID(order) {
    let JurisdictionID = null;
    if ('vertex_taxationDetails' in order.custom && !empty(order.custom.vertex_taxationDetails)) {
        let vertexTaxationDetails = JSON.parse(order.custom.vertex_taxationDetails);
        for (var i = 0; i < vertexTaxationDetails.length; i++) {
            if (!empty(vertexTaxationDetails[i]) && vertexTaxationDetails[i].indexOf('JurisdictionID:') !== -1) {
                JurisdictionID = vertexTaxationDetails[i].split(':')[1].trim();
                break;
            }
        }
    }
    return JurisdictionID;
}
/**
 * Extracts shipping address from order shipment and returns JSON object.
 * @Param {dw.order.Shipment} shipment dw object
 * @return {Object} Shipping address JSON object.
 */
function getShippingAddress(shipment) {
    let ShipToAddress = {};
    if (shipment && shipment instanceof dw.order.Shipment) {
        let shippingAddress = shipment.getShippingAddress();
        ShipToAddress = {
            Address1: shippingAddress.address1,
            Address2: shippingAddress.address2,
            City: shippingAddress.city,
            Country: shippingAddress.countryCode.value.toUpperCase(),
            FirstName: shippingAddress.firstName,
            LastName: shippingAddress.lastName,
            Phone: shippingAddress.phone,
            PostalCode: shippingAddress.postalCode
        };
        // For EU locales we dont have state so adding a null check
        if (!!shippingAddress.stateCode && shippingAddress.stateCode !== 'undefined') ShipToAddress.State = shippingAddress.stateCode;
    }
    return ShipToAddress;
}
/**
 * Extracts and returns order channel info
 * @Param {dw.order.Order} order dw object
 * @return {string} channel type
 */
function getOrderType(order) {
    let orderType = !empty(order.custom.maoOrderType) && !empty(order.custom.maoOrderType.value) ? order.custom.maoOrderType.value : 'web';
    return orderType;
}
/**
 * Extracts all product line item data and returns JSON object.
 * @Param {dw.order.ProductLineItem} productLineItem dw object
 * @Param {dw.order.Shipment} shipment dw object
 * @Param {dw.order.Order} order dw object
 * @return {Object} Product line item JSON object.
 */
function getProductLineItemData(productLineItem, shipment, order) {
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    let lineItemData = {};
    if (productLineItem && productLineItem instanceof dw.order.ProductLineItem) {
        let product = productLineItem.product;

        let lineItemPrice = productLineItem.getPrice();
        let lineItemPriceValue = lineItemPrice.toNumberString();
        let shippingMethodID = shipment.shippingMethodID;

        var defaultShipment = order.getDefaultShipment();
        var orderGiftMessage = defaultShipment.giftMessage ? defaultShipment.giftMessage : null;

        lineItemData = {
            DeliveryMethod: {
                DeliveryMethodId: shippingMethodID && shippingMethodID === 'store-pickup' ?
                    MaoConstants.OrderLine.DeliveryMethod.DeliveryMethodId.inStore : (isAurusEnabled && !empty(product) && 'giftCard' in product.custom && product.custom.giftCard.value.equals('EGIFT_CARD')) ?
                    MaoConstants.OrderLine.DeliveryMethod.DeliveryMethodId.email : MaoConstants.OrderLine.DeliveryMethod.DeliveryMethodId.shipToAddress
            },
            IsGift: orderGiftMessage ? true : productLineItem.gift,
            IsGiftCard: (!empty(product) && 'giftCard' in product.custom && (product.custom.giftCard.value.equals('GIFT_CARD') || product.custom.giftCard.value.equals('EGIFT_CARD'))),
            ItemBarcode: (!empty(product) && !empty(product.UPC)) ? product.UPC : null,
            ItemId: (!empty(product) && 'sku' in product.custom) ? product.custom.sku : null,
            OrderLinePromisingInfo: {
                ReqCapacityPerUnit: shippingMethodID && shippingMethodID === 'store-pickup' ? '0' : '1'
            },
            OrderLineSubTotal: lineItemPriceValue,
            UOM: MaoConstants.OrderLine.UOM,
            UnitPrice: productLineItem.basePrice.available ? productLineItem.basePrice.value : '0.00'
        };
        if (isAurusEnabled && lineItemData.IsGiftCard) {
            lineItemData.GiftCardValue = lineItemData.UnitPrice;
        }
        // BOPIS Order line details
        if ('fromStoreId' in productLineItem.custom &&
            productLineItem.custom.fromStoreId) {
            lineItemData.ShipToLocationId = productLineItem.custom.fromStoreId;
            lineItemData.OrderLinePromisingInfo.ShipFromLocationId = productLineItem.custom.fromStoreId;
            if (shipment.custom && 'fromStoreId' in shipment.custom && shipment.custom.fromStoreId) {
                lineItemData.OrderLinePickupDetail = {};
                lineItemData.OrderLinePickupDetail.Email = order.customerEmail;
                lineItemData.OrderLinePickupDetail.FirstName = shipment.shippingAddress.firstName;
                lineItemData.OrderLinePickupDetail.LastName = shipment.shippingAddress.lastName;
                lineItemData.OrderLinePickupDetail.Phone = shipment.shippingAddress.phone;
                lineItemData.OrderLinePickupDetail.PickupEndDate = null;
                lineItemData.OrderLinePickupDetail.PickupStartDate = null;
            }
        }
        if (isAurusEnabled) {
            try {
                var images = product.getImages('cartFullDesktop');
                if (images && images.length) {
                    lineItemData.OrderLineAttribute = {
                        AttributeName: 'SFCCItemImage',
                        AttributeValue: images[0].getAbsURL().toString()
                    };
                }
            } catch (error) {
                Logger.error(JSON.stringify(error));
            }
        }
    }

    return lineItemData;
}

/**
 * Extracts all product line item data and returns JSON object.
 * @Param {dw.order.ProductLineItem} productLineItem dw object
 * @Param {dw.order.Shipment} shipment dw object
 * @Param {dw.order.Order} order dw object
 * @return {Object} Product line item JSON object.
 */
function getSplitProductLineItemData(productLineItem, shipment, order) {
    let lineItemData = {};
    if (productLineItem && productLineItem instanceof dw.order.ProductLineItem) {
        let product = productLineItem.product;
        let productQty = productLineItem.quantity.value;

        let unitLineItemPrice = productLineItem.getPrice().divide(productQty);
        let unitLineItemPriceValue = unitLineItemPrice.toNumberString();
        let shippingMethodID = shipment.shippingMethodID;

        lineItemData = {
            DeliveryMethod: {
                DeliveryMethodId: shippingMethodID && shippingMethodID === 'store-pickup' ?
                    MaoConstants.OrderLine.DeliveryMethod.DeliveryMethodId.inStore : MaoConstants.OrderLine.DeliveryMethod.DeliveryMethodId.shipToAddress
            },
            IsGift: productLineItem.gift,
            IsGiftCard: (!empty(product) && 'giftCard' in product.custom && (product.custom.giftCard.value.equals('GIFT_CARD') || product.custom.giftCard.value.equals('EGIFT_CARD'))),
            ItemBarcode: (!empty(product) && !empty(product.UPC)) ? product.UPC : null,
            ItemId: (!empty(product) && 'sku' in product.custom) ? product.custom.sku : null,
            OrderLinePromisingInfo: {
                ReqCapacityPerUnit: shippingMethodID && shippingMethodID === 'store-pickup' ? '0' : '1'
            },
            OrderLineSubTotal: unitLineItemPriceValue,
            UOM: MaoConstants.OrderLine.UOM,
            UnitPrice: productLineItem.basePrice.available ? productLineItem.basePrice.value : '0.00'
        };
        // BOPIS Order line details
        if ('fromStoreId' in productLineItem.custom &&
            productLineItem.custom.fromStoreId) {
            lineItemData.OrderLinePromisingInfo.ShipFromLocationId = productLineItem.custom.fromStoreId;
            if (shipment.custom && 'fromStoreId' in shipment.custom && shipment.custom.fromStoreId) {
                lineItemData.OrderLinePickupDetail = {};
                lineItemData.OrderLinePickupDetail.Email = order.customerEmail;
                lineItemData.OrderLinePickupDetail.FirstName = shipment.shippingAddress.firstName;
                lineItemData.OrderLinePickupDetail.LastName = shipment.shippingAddress.lastName;
                lineItemData.OrderLinePickupDetail.Phone = shipment.shippingAddress.phone;
                lineItemData.OrderLinePickupDetail.PickupEndDate = null;
                lineItemData.OrderLinePickupDetail.PickupStartDate = null;
            }
        }
        var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();

        if (isAurusEnabled) {
            try {
                var images = product.getImages('cartFullDesktop');
                if (images && images.length) {
                    lineItemData.OrderLineAttribute = {
                        AttributeName: 'SFCCItemImage',
                        AttributeValue: images[0].getAbsURL().toString()
                    };
                }
            } catch (error) {
                Logger.error(JSON.stringify(error));
            }
        }
    }

    return lineItemData;
}

/**
 * Extracts productlineItem discount information from order object and returns aJSON object.
 * @Param {Object} productLineItemDataExtended dw object
 * @Param {Object} productLineItem - product Line Item of the basket to be processed
 * @Param {dw.order.Order} order - product Line Item of the basket to be processed
 * @return {Object} shipping information JSON object.
 */
function getOrderLineChargeDetail(productLineItemDataExtended, productLineItem) {
    var orderLineChargeDetail = [];
    try {
        var priceAdjustments = productLineItem.getProratedPriceAdjustmentPrices();
        if (priceAdjustments.length) {
            var priceAdjustmentsValues = priceAdjustments.entrySet().toArray();
            for (let i = 0; i < priceAdjustments.length; i++) {
                var discountData = {};
                discountData.ChargeTotal = priceAdjustmentsValues[i].value.value;
                discountData.ChargeType = {
                    ChargeTypeId: 'Promotion'
                };
                discountData.ChargeReferenceId = '';
                if (priceAdjustmentsValues[i].key.couponLineItem) {
                    discountData.ChargeType = {
                        ChargeTypeId: 'Coupon'
                    };
                    discountData.ChargeReferenceId = priceAdjustmentsValues[i].key.couponLineItem.couponCode;
                }
                discountData.DiscountOn = 'ItemPrice';
                discountData.PromoCodeClass = priceAdjustmentsValues[i].key.promotionID;
                discountData.ChargeDetailId = priceAdjustmentsValues[i].key.getUUID();
                orderLineChargeDetail.push(discountData);
            }
        }
    } catch (error) {
        Logger.error('getOrderLineChargeDetail: {0}', JSON.stringify(error));
    }

    return orderLineChargeDetail;
}

/**
 * Extracts productlineItem discount information from order object and returns aJSON object.
 * @Param {Object} productLineItemDataExtended dw object
 * @Param {Object} productLineItem - product Line Item of the basket to be processed
 * @Param {dw.order.Order} order - product Line Item of the basket to be processed
 * @return {Object} shipping information JSON object.
 */
function getSplitOrderLineChargeDetail(productLineItemDataExtended) {
    var orderLineChargeDetail = [];
    var discountData = {};
    var perItemDiscount = productLineItemDataExtended && productLineItemDataExtended.perItemDiscount ? productLineItemDataExtended.perItemDiscount : '0.00';
    var isValueNegative = perItemDiscount && (perItemDiscount.toString()).indexOf('-');
    discountData.ChargeTotal = isValueNegative === (-1) && perItemDiscount !== '0.00' ? '-' + perItemDiscount : perItemDiscount;
    discountData.ChargeType = {
        ChargeTypeId: 'Discount'
    };
    discountData.DiscountOn = 'ItemPrice';
    discountData.ChargeDetailId = productLineItemDataExtended.priceAdjustmentUUID;
    orderLineChargeDetail.push(discountData);
    return orderLineChargeDetail;
}

/**
 * Extracts productlineItem tax information from order object and returns JSON object.
 * @Param {dw.order.ProductLineItem} productLineItem dw object
 * @Param {dw.order.Order} order dw object
 * @return {Object} shipping information JSON object.
 */
function getOrderLineTaxDetail(productLineItem, order) {
    var orderLineChargeDetail = [];
    if (productLineItem && productLineItem instanceof dw.order.ProductLineItem) {
        let proratedPrice = productLineItem.getProratedPrice();
        let taxRate = productLineItem.getTaxRate();
        let lineItemTax = productLineItem.getTax();

        var taxData = {};
        var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
        if (isAurusEnabled) {
            var vertexTaxCalculated = (order && 'custom' in order && 'vertex_Taxation_Details' in order.custom && !empty(order.custom.vertex_Taxation_Details)) ? JSON.parse(order.custom.vertex_Taxation_Details) : {};
            var JurisdictionTypeId;
            var JurisdictionID;

            for (var i = 0; i < vertexTaxCalculated.length; i++) {
                if (vertexTaxCalculated[i].indexOf('Jurisdiction Level') > -1) {
                    JurisdictionTypeId = vertexTaxCalculated[i].split(':')[1].trim();
                }
                if (vertexTaxCalculated[i].indexOf('JurisdictionID') > -1) {
                    JurisdictionID = vertexTaxCalculated[i].split(':')[1].trim();
                }
            }
            taxData.taxRate = taxRate;
            taxData.Jurisdiction = JurisdictionID;
            taxData.JurisdictionTypeId = JurisdictionTypeId;
        }

        taxData.TaxTypeId = 'SALES';
        taxData.TaxAmount = lineItemTax && lineItemTax.isAvailable() ? lineItemTax.toNumberString() : '0.00';
        taxData.TaxCode = 'TaxCodekv9Xc';
        taxData.TaxableAmount = proratedPrice ? proratedPrice.toNumberString() : '0.00';
        orderLineChargeDetail.push(taxData);
    }

    return orderLineChargeDetail;
}

/**
 * Extracts productlineItem tax information from order object and returns JSON object.
 * @Param {dw.order.ProductLineItem} productLineItem dw object
 * @Param {dw.order.Order} order dw object
 * @return {Object} shipping information JSON object.
 */
function getSplitOrderLineTaxDetail(productLineItem, order) {
    var orderLineChargeDetail = [];
    if (productLineItem && productLineItem instanceof dw.order.ProductLineItem) {
        let proratedPrice = productLineItem.getProratedPrice();
        let proratedPricePerUnit = proratedPrice.divide(productLineItem.quantityValue);
        let taxRate = productLineItem.getTaxRate();
        let proratedTaxPerUnit = proratedPricePerUnit.multiply(taxRate);

        var taxData = {};
        var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();

        if (isAurusEnabled) {
            var vertexTaxCalculated = (order && 'custom' in order && 'vertex_Taxation_Details' in order.custom && !empty(order.custom.vertex_Taxation_Details)) ? JSON.parse(order.custom.vertex_Taxation_Details) : {};
            var JurisdictionTypeId;
            var JurisdictionID;

            for (var i = 0; i < vertexTaxCalculated.length; i++) {
                if (vertexTaxCalculated[i].indexOf('Jurisdiction Level') > -1) {
                    JurisdictionTypeId = vertexTaxCalculated[i].split(':')[1].trim();
                }
                if (vertexTaxCalculated[i].indexOf('JurisdictionID') > -1) {
                    JurisdictionID = vertexTaxCalculated[i].split(':')[1].trim();
                }
            }
            taxData.taxRate = taxRate;
            taxData.Jurisdiction = JurisdictionID;
            taxData.JurisdictionTypeId = JurisdictionTypeId;
        }

        taxData.TaxTypeId = 'SALES';
        taxData.TaxAmount = proratedTaxPerUnit ? proratedTaxPerUnit.toNumberString() : '0.00';
        taxData.TaxCode = 'TaxCodekv9Xc';
        taxData.TaxableAmount = proratedPricePerUnit ? proratedPricePerUnit.toNumberString() : '0.00';
        orderLineChargeDetail.push(taxData);
    }

    return orderLineChargeDetail;
}

/**
 * Prepares product line item promotion data and returns JSON object.
 * @Param {dw.order.Order} order dw object
 * @Param {dw.order.ProductLineItem} productLineItem dw object
 * @return {Object} Product line item promotion JSON object.
 */
function getPerItemPromoObject(order, productLineItem) {
    var discountID = null;
    var promoDesc = null;
    var priceAdjustmentUUID = null;
    var itemPromoDetailsObject = {};
    var pointsPerUnit = 0;
    /**
     * As Discussed with UA team, there will not be multiple promotion applicable on
     * single product line item so we are not keeping the array of Promo info
     * Even if in any case (which will not be as per UA), Product is eligible for Product + Order Promotion
     * We will be considering Product Promo first if not available then Order Promo details
     */
    if (productLineItem.getPriceAdjustments().size() > 0) {
        var pa = productLineItem.getPriceAdjustments()[0];
        discountID = !empty(pa.promotionID) ? pa.promotionID : '';
        promoDesc = pa.promotion && pa.promotion.details ? pa.promotion.details.markup : '';
        priceAdjustmentUUID = pa.getUUID();
        Logger.debug('discountID {0}', discountID);
    }
    // If the basket has Order Promotion applied, find the promo-code
    if (order.getPriceAdjustments().size() > 0) {
        var orderPriceAdjustment = order.getPriceAdjustments()[0];
        discountID = empty(discountID) ? orderPriceAdjustment.promotionID : discountID;
        promoDesc = empty(promoDesc) && orderPriceAdjustment.promotion && orderPriceAdjustment.promotion.details ?
            orderPriceAdjustment.promotion.details.markup : promoDesc;
        priceAdjustmentUUID = orderPriceAdjustment.getUUID();
    }

    var unitQtyTotalDiscValue = '0.00';
    // Calculate the unit promo discount.
    if (productLineItem.getPrice().getValue() !== productLineItem.getProratedPrice().getValue()) {
        var totalDiscount = productLineItem.getPrice().subtract(productLineItem.getProratedPrice());

        var unitQtyTotalDisc = totalDiscount.divide(productLineItem.quantity.value);
        unitQtyTotalDiscValue = unitQtyTotalDisc.toNumberString();
    }

    // Loyalty Points
    if ('estimatedItemLoyaltyPoints' in productLineItem.custom && productLineItem.custom.estimatedItemLoyaltyPoints > 0) {
        pointsPerUnit = Math.round(productLineItem.custom.estimatedItemLoyaltyPoints / productLineItem.quantity.value);
    }

    if (promoDesc && promoDesc.length > 100) {
        promoDesc = promoDesc.substring(0, 100);
    }
    itemPromoDetailsObject = {
        totalPromoPrice: unitQtyTotalDiscValue,
        discountID: discountID,
        promoDesc: promoDesc,
        priceAdjustmentUUID: priceAdjustmentUUID,
        LoyaltyPointsPerUnit: pointsPerUnit
    };
    return itemPromoDetailsObject;
}
/**
 * Fetch and return SAPCarrierCode for lineItem shipment
 * @Param {dw.order.Order} Order dw object
 * @Param {dw.order.Shipment} Shipment dw object
 * @return {string} sapCarrierCode
 */
function getSAPCarrierCode(Order, Shipment) {
    let order = Order;
    let shipment = Shipment;
    let shippingAddress = shipment.getShippingAddress();
    let sapCarrierCode = null;
    let isCommercialPickup = 'isCommercialPickup' in order.custom && order.custom.isCommercialPickup;
    let specialZipCodes = MAOPreferences.MaoSpecialZipCodes;

    // Order-level override is set, use that instead
    if (!empty(order.custom.sapCarrierCode)) return order.custom.sapCarrierCode;
    // Check that shipping address exists
    if (shippingAddress) {
        // SpecialZipCodes is populated, run through logic check
        if (shippingAddress.postalCode && specialZipCodes) {
            let ArrayList = require('dw/util/ArrayList');
            let filterZipCode = shippingAddress.postalCode;
            let replacementCode = MAOPreferences.MaoSpecialZipCodesCarrierCode;

            // If postal code needs to be manipulated before comparison, make required adjustment
            if (MAOPreferences.ManipulatePostalCode) {
                let seperator = MAOPreferences.ManipulatePostalCodeSeparator;
                let position = MAOPreferences.ManipulatePostalCodePosition;
                filterZipCode = filterZipCode.indexOf(seperator) > -1 ? filterZipCode.split(seperator)[position] : filterZipCode;
            }
            // Customer postal code is in the special list, use the replacement code
            sapCarrierCode = new ArrayList(specialZipCodes).contains(filterZipCode) ? replacementCode : null;
        }
        // Office Address? Use code on shippingaddress
        if (shippingAddress.custom.isOfficeAddress) sapCarrierCode = shippingAddress.custom.sapCarrierCode;
        // Commercial pickup (HAL) order? Use HAL cade
        if (isCommercialPickup) sapCarrierCode = shipment.shippingMethod.custom.sapCarrierCodeHAL;
        // Using shoprunner? run special shoprunner function to find code
        else if (shipment.shippingMethodID === 'shoprunner') sapCarrierCode = getShopRunnerSapCarrierCode(shipment);
        // Address is a business? Use commercialCode
        else if (shippingAddress.custom.addressType && shippingAddress.custom.addressType.toLowerCase() === 'business') sapCarrierCode = shipment.shippingMethod.custom.sapCarrierCodeCommercial;
        // Setting EU / UKIE Sites SAP Carrier Code based on Shipping Method identifier we receive from Paazl.
        else if ((siteID === 'EU' || siteID === 'UKIE') && shipment.custom.paazlDeliveryInfo && 'MAO_SAP_carrierCodes' in Site.current.preferences.custom && Site.getCurrent().getCustomPreferenceValue('MAO_SAP_carrierCodes')) {
            try {
                var carrierCodes = JSON.parse(Site.getCurrent().getCustomPreferenceValue('MAO_SAP_carrierCodes'));
                var paazlDeliveryInfo = JSON.parse(shipment.custom.paazlDeliveryInfo);
                sapCarrierCode = carrierCodes[paazlDeliveryInfo.identifier] ? carrierCodes[paazlDeliveryInfo.identifier] : '';
            } catch (e) {
                Logger.error('Custom Sitepreference MAO_SAP_carrierCodes holds invalid JSON format value: ' + e.message);
            }
        }
        // If all else fails, fall back to residential code
        if (empty(sapCarrierCode)) {
            sapCarrierCode = shipment.shippingMethod.custom.sapCarrierCodeResidential;
        }
    }
    return sapCarrierCode;
}
/**
 * Fetch and return SAPShippingCondition for lineItem shipment
 * @Param {dw.order.Shipment} Shipment dw object
 * @return {string} sapShippingCondition
 */
function getSAPShippingCondition(Shipment) {
    var shipment = Shipment;
    var sapShippingCondition = shipment.shippingMethod && 'sapShippingCondition' in shipment.shippingMethod.custom && shipment.shippingMethod.custom.sapShippingCondition ?
        shipment.shippingMethod.custom.sapShippingCondition : null;

    return sapShippingCondition;
}

/**
 * Returns packListType -'DR'(Standard), 'EM'(employee), 'VP'(VIP), 'GR'(Gift)
 * @Param {dw.order.Order} order dw object
 * @return {string} packListType
 */
function getPacklistType(order) {
    let packListType = MaoConstants.OrderLine.Extended.packlistType.defaultPacklistType;
    let defaultShipment = order.getDefaultShipment();

    if (Site.getCurrent().getID() === 'CA') {
        packListType = MaoConstants.OrderLine.Extended.packlistType.CAPacklistType;
    } else if (defaultShipment && defaultShipment.gift) {
        packListType = MaoConstants.OrderLine.Extended.packlistType.giftPacklistType;
    } else if ('isEmployeeOrder' in order.custom && order.custom.isEmployeeOrder) {
        packListType = MaoConstants.OrderLine.Extended.packlistType.empPacklistType;
    } else if ('isVipOrder' in order.custom && order.custom.isVipOrder) {
        packListType = MaoConstants.OrderLine.Extended.packlistType.vipPacklistType;
    }

    // This customization for EMEA site
    if (siteID === 'EU' || siteID === 'UKIE') {
        let billingCountry = order.billingAddress.countryCode.value;
        packListType = MaoConstants.OrderLine.Extended.packlistType[billingCountry];
    }
    return packListType;
}

/**
 * Constructs JSON object for product line item extended data.
 * @Param {dw.order.Order} order dw object
 * @Param {dw.order.ProductLineItem} productLineItem dw object
 * @Param {dw.order.Shipment} shipment dw object
 * @return {Object} Product extended line item JSON object.
 */
function getProductLineItemExtendedData(order, productLineItem, shipment) {
    let extendedLineItemData = {};
    if (productLineItem && productLineItem instanceof dw.order.ProductLineItem) {
        var itemPromoObject = getPerItemPromoObject(order, productLineItem);

        var discountedWebTotal = '0.00';
        if (order.getPriceAdjustments().size() > 0) {
            discountedWebTotal = productLineItem.getProratedPrice();
        } else if (productLineItem.adjustedPrice.available) {
            discountedWebTotal = productLineItem.adjustedPrice;
        }

        var discountedWebTotalValue = discountedWebTotal.toNumberString();

        // sapDeliveryPriority of the lineitem
        var shippingMethod = shipment.getShippingMethod();
        var MaoDeliveryPriorityDays = MAOPreferences.MaoDeliveryPriorityDays ? MAOPreferences.MaoDeliveryPriorityDays : 3;
        var maxDeliveryDays = (!empty(shippingMethod) && shippingMethod.custom.maxDeliveryDays) ? shippingMethod.custom.maxDeliveryDays : 0;
        var deliveryPriority = maxDeliveryDays <= MaoDeliveryPriorityDays ? '0020' : '0010';

        extendedLineItemData = {
            packlistType: getPacklistType(order),
            sapShippingCondition: getSAPShippingCondition(shipment),
            discountedWebLineTotal: discountedWebTotalValue,
            promotionalCode: itemPromoObject.discountID,
            promotionalDesc: itemPromoObject.promoDesc,
            sapDeliveryPriority: deliveryPriority,
            perItemDiscount: itemPromoObject.totalPromoPrice,
            LoyaltyPointsPerUnit: itemPromoObject.LoyaltyPointsPerUnit
        };

        var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
        if (!isAurusEnabled) {
            extendedLineItemData.sapCarrierCode = getSAPCarrierCode(order, shipment);
        }

        var isCommercialPickupHAL = 'isCommercialPickup' in order.custom && order.custom.isCommercialPickup;
        if (isCommercialPickupHAL) {
            if (!isAurusEnabled) {
                extendedLineItemData.sapCarrierCode = getSAPCarrierCode(order, shipment);
            }
            var shippingAddress = shipment.getShippingAddress();
            extendedLineItemData.HALLocationID = (shippingAddress && 'HALLocationID' in shippingAddress.custom && shippingAddress.custom.HALLocationID) ? shippingAddress.custom.HALLocationID : null;
            extendedLineItemData.HALLocationType = (shippingAddress && 'HALLocationType' in shippingAddress.custom && shippingAddress.custom.HALLocationType) ? shippingAddress.custom.HALLocationType : null;
        }
    }
    return extendedLineItemData;
}

/**
 * Constructs JSON object for product line item extended data.
 * @Param {dw.order.Order} order dw object
 * @Param {dw.order.ProductLineItem} productLineItem dw object
 * @Param {dw.order.Shipment} shipment dw object
 * @return {Object} Product extended line item JSON object.
 */
function getSplitProductLineItemExtendedData(order, productLineItem, shipment) {
    let extendedLineItemData = {};
    if (productLineItem && productLineItem instanceof dw.order.ProductLineItem) {
        var itemPromoObject = getPerItemPromoObject(order, productLineItem);

        var discountedWebTotal = '0.00';
        if (order.getPriceAdjustments().size() > 0) {
            discountedWebTotal = productLineItem.getProratedPrice();
        } else if (productLineItem.adjustedPrice.available) {
            discountedWebTotal = productLineItem.adjustedPrice;
        }
        // Divide the money object with the qty to find the discountedWebTotal for unit qty.
        var unitQtyDiscountedWebTotal = discountedWebTotal.divide(productLineItem.quantity.value);
        var unitQtyDiscountedWebTotalValue = unitQtyDiscountedWebTotal.toNumberString();

        // sapDeliveryPriority of the lineitem
        var shippingMethod = shipment.getShippingMethod();
        var MaoDeliveryPriorityDays = MAOPreferences.MaoDeliveryPriorityDays ? MAOPreferences.MaoDeliveryPriorityDays : 3;
        var maxDeliveryDays = (!empty(shippingMethod) && shippingMethod.custom.maxDeliveryDays) ? shippingMethod.custom.maxDeliveryDays : 0;
        var deliveryPriority = maxDeliveryDays <= MaoDeliveryPriorityDays ? '0020' : '0010';

        extendedLineItemData = {
            packlistType: getPacklistType(order),
            sapShippingCondition: getSAPShippingCondition(shipment),
            discountedWebLineTotal: unitQtyDiscountedWebTotalValue,
            promotionalCode: itemPromoObject.discountID,
            promotionalDesc: itemPromoObject.promoDesc,
            sapDeliveryPriority: deliveryPriority,
            perItemDiscount: itemPromoObject.totalPromoPrice,
            priceAdjustmentUUID: itemPromoObject.priceAdjustmentUUID
        };

        var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();

        if (!isAurusEnabled) {
            extendedLineItemData.sapCarrierCode = getSAPCarrierCode(order, shipment);
        }

        var isCommercialPickupHAL = 'isCommercialPickup' in order.custom && order.custom.isCommercialPickup;
        if (isCommercialPickupHAL) {
            if (!isAurusEnabled) {
                extendedLineItemData.sapCarrierCode = getSAPCarrierCode(order, shipment);
            }
            var shippingAddress = shipment.getShippingAddress();
            extendedLineItemData.HALLocationID = (shippingAddress && 'HALLocationID' in shippingAddress.custom && shippingAddress.custom.HALLocationID) ? shippingAddress.custom.HALLocationID : null;
            extendedLineItemData.HALLocationType = (shippingAddress && 'HALLocationType' in shippingAddress.custom && shippingAddress.custom.HALLocationType) ? shippingAddress.custom.HALLocationType : null;
        }
    }
    return extendedLineItemData;
}

/**
 * Constructs JSON object for order line items.
 * @Param {dw.order.Order} order dw object
 * @return {Object} Order line item JSON object.
 */
function getOrderLineItems(order) {
    var Calendar = require('dw/util/Calendar');
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    var isSplitOrderLine = Site.getCurrent().getCustomPreferenceValue('isSplitOrderLine') || false;
    Logger.debug('Constructing order line item data.');
    let allShipments = order.getShipments().iterator();
    let orderLineItemData = [];
    let OrderLineIdCount = 1;
    let isCommercialPickup = 'isCommercialPickup' in order.custom && order.custom.isCommercialPickup;

    while (allShipments.hasNext()) {
        let shipment = allShipments.next();
        let shippingAddress = getShippingAddress(shipment);
        if (empty(shippingAddress.Phone)) {
            shippingAddress.Phone = !empty(order.billingAddress.phone) ? order.billingAddress.phone : MAOPreferences.CustomerServicePhone;
        }
        let customerEmail = (!empty(order.customer.profile) && !empty(order.customer.profile.email)) ? order.customer.profile.email : order.customerEmail;
        shippingAddress.Email = customerEmail;
        let shippingMethodID = (shipment.shippingMethod && 'maoShippingMethodId' in shipment.shippingMethod.custom && shipment.shippingMethod.custom.maoShippingMethodId) ? shipment.shippingMethod.custom.maoShippingMethodId : shipment.shippingMethodID;
        let deliveryDateField = ('maoDeliveryDate' in Site.current.preferences.custom) ? Site.getCurrent().getCustomPreferenceValue('maoDeliveryDate').value : null;
        let RequestedDeliveryDate = (deliveryDateField && deliveryDateField in shipment.custom) ? shipment.custom[deliveryDateField].toISOString() : null;
        let allProductLineItems = shipment.getProductLineItems();
        if (allProductLineItems.length > 0) {
            let allProductLineItemsIt = allProductLineItems.iterator();
            while (allProductLineItemsIt.hasNext()) {
                let productLineItem = allProductLineItemsIt.next();
                let lineItemQuantity = productLineItem.quantity.value;
                let product = productLineItem.product;
                if (isSplitOrderLine) {
                    // split product line items
                    for (let count = 0; count < lineItemQuantity; count++) {
                        let productLineItemData = getSplitProductLineItemData(productLineItem, shipment, order);
                        productLineItemData.OrderLineId = OrderLineIdCount++; // Unique order line identifier (must be unique after order-line splitting)
                        productLineItemData.Quantity = 1; // should always be 1 after order-line splitting
                        productLineItemData.Extended = getSplitProductLineItemExtendedData(order, productLineItem, shipment);
                        productLineItemData.OrderId = order.orderNo;
                        productLineItemData.OrderLineChargeDetail = getSplitOrderLineChargeDetail(productLineItemData.Extended);

                        if (isAurusEnabled && productLineItemData.OrderLineChargeDetail.length && productLineItemData.OrderLineChargeDetail[0].ChargeTotal === '0.00') {
                            try {
                                /* eslint-disable dot-notation */
                                delete productLineItemData['OrderLineChargeDetail'];
                                /* eslint-enable dot-notation */
                            } catch (error) {
                                Logger.error(JSON.stringify(error));
                            }
                        }
                        var isEGift = product && 'giftCard' in product.custom && product.custom.giftCard.value.equals('EGIFT_CARD');
                        if (isEGift) {
                            if (productLineItem.custom.gcMessage) {
                                productLineItemData.OrderLineNote = [];
                                productLineItemData.OrderLineNote.push({
                                    NoteText: productLineItem.custom.gcMessage,
                                    NoteType: {
                                        NoteTypeId: 'Gift Message'
                                    },
                                    NoteCategory: {
                                        NoteCategoryId: 'Instruction'
                                    }
                                });
                            }
                            productLineItemData.Extended.eGCEmail = productLineItem.custom.gcRecipientEmail;
                            productLineItemData.Extended.eGCName = productLineItem.custom.gcRecipientName;
                        }

                        productLineItemData.OrderLineTaxDetail = getSplitOrderLineTaxDetail(productLineItem, order);
                        if (!isAurusEnabled) {
                            productLineItemData.RequestedDeliveryDate = RequestedDeliveryDate;
                        }
                        productLineItemData.ShipToAddress = {
                            Address: shippingAddress
                        };
                        var isGC = (!empty(product) && 'giftCard' in product.custom && product.custom.giftCard.value.equals('EGIFT_CARD'));
                        productLineItemData.ShippingMethodId = (isCommercialPickup && shippingMethodID) ? shippingMethodID + ' HAL' : (isGC && isAurusEnabled) ?
                            'eGift_Card' : (shippingMethodID && shippingMethodID === 'store-pickup' ? null : shippingMethodID);
                        if ((siteID === 'EU' || siteID === 'UKIE') && shipment.custom.paazlDeliveryInfo) {
                            var paazlDeliveryInfoSplit = JSON.parse(shipment.custom.paazlDeliveryInfo);
                            if (paazlDeliveryInfoSplit && paazlDeliveryInfoSplit.pickupLocation) {
                                productLineItemData.ShipToAddress.Address.custom = {};
                                productLineItemData.ShipToAddress.Address.custom.paazlAccessPointIdentifier = paazlDeliveryInfoSplit.pickupLocation.code;
                                productLineItemData.ShipToAddress.Address.custom.servicepointAccountNumber = !empty(paazlDeliveryInfoSplit.pickupLocation.accountNumber) ? paazlDeliveryInfoSplit.pickupLocation.accountNumber : null;
                            }
                            productLineItemData.ShippingMethodId = paazlDeliveryInfoSplit.identifier;
                            var deliveryDateCalendarObj = new Calendar(order.getCreationDate());
                            deliveryDateCalendarObj.add(Calendar.DATE, 3);
                            if (!isAurusEnabled) {
                                productLineItemData.RequestedDeliveryDate = deliveryDateCalendarObj.getTime().toISOString();
                            }
                        }
                        if (isAurusEnabled) {
                            productLineItemData.OriginalUnitPrice = productLineItem.getBasePrice().value || '';
                            productLineItemData.PromisedDeliveryDate = (deliveryDateField && deliveryDateField in shipment.custom) ? shipment.custom[deliveryDateField].toISOString() : '';
                        }
                        orderLineItemData.push(productLineItemData);
                    }
                } else {
                    let productLineItemData = getProductLineItemData(productLineItem, shipment, order);
                    productLineItemData.OrderLineId = OrderLineIdCount++; // Unique order line identifier
                    productLineItemData.Quantity = lineItemQuantity;
                    productLineItemData.Extended = getProductLineItemExtendedData(order, productLineItem, shipment);
                    productLineItemData.OrderId = order.orderNo;
                    productLineItemData.OrderLineChargeDetail = getOrderLineChargeDetail(productLineItemData.Extended, productLineItem, order);
                    // Remove OrderLineChargeDetail if chargeTotal is equal to zero
                    if (isAurusEnabled && productLineItemData.OrderLineChargeDetail.length && productLineItemData.OrderLineChargeDetail[0].ChargeTotal === '0.00') {
                        try {
                            /* eslint-disable dot-notation */
                            delete productLineItemData['OrderLineChargeDetail'];
                            /* eslint-enable dot-notation */
                        } catch (error) {
                            Logger.error(JSON.stringify(error));
                        }
                    }
                    var isEGC = product && 'giftCard' in product.custom && product.custom.giftCard.value.equals('EGIFT_CARD');
                    if (isEGC) {
                        if (productLineItem.custom.gcMessage) {
                            productLineItemData.OrderLineNote = [];
                            productLineItemData.OrderLineNote.push({
                                NoteText: productLineItem.custom.gcMessage,
                                NoteType: {
                                    NoteTypeId: 'Gift Message'
                                },
                                NoteCategory: {
                                    NoteCategoryId: 'Instruction'
                                }
                            });
                        }
                        productLineItemData.Extended.eGCEmail = productLineItem.custom.gcRecipientEmail;
                        productLineItemData.Extended.eGCName = productLineItem.custom.gcRecipientName;
                    }

                    productLineItemData.OrderLineTaxDetail = getOrderLineTaxDetail(productLineItem, order);
                    if (!isAurusEnabled) {
                        productLineItemData.RequestedDeliveryDate = RequestedDeliveryDate;
                    }
                    productLineItemData.ShipToAddress = {
                        Address: shippingAddress
                    };
                    var isGiftCard = (!empty(product) && 'giftCard' in product.custom && product.custom.giftCard.value.equals('EGIFT_CARD'));
                    productLineItemData.ShippingMethodId = (isCommercialPickup && shippingMethodID) ? shippingMethodID + ' HAL' : (isGiftCard && isAurusEnabled) ?
                        'eGift_Card' : (shippingMethodID && shippingMethodID === 'store-pickup' ? null : shippingMethodID);
                    if ((siteID === 'EU' || siteID === 'UKIE') && shipment.custom.paazlDeliveryInfo) {
                        var paazlDeliveryInfo = JSON.parse(shipment.custom.paazlDeliveryInfo);
                        if (paazlDeliveryInfo && paazlDeliveryInfo.pickupLocation) {
                            productLineItemData.ShipToAddress.Address.custom = {};
                            productLineItemData.ShipToAddress.Address.custom.paazlAccessPointIdentifier = paazlDeliveryInfo.pickupLocation.code;
                            productLineItemData.ShipToAddress.Address.custom.servicepointAccountNumber = !empty(paazlDeliveryInfo.pickupLocation.accountNumber) ? paazlDeliveryInfo.pickupLocation.accountNumber : null;
                        }
                        productLineItemData.ShippingMethodId = paazlDeliveryInfo.identifier;
                        var deliveryDateCalendarObject = new Calendar(order.getCreationDate());
                        deliveryDateCalendarObject.add(Calendar.DATE, 3);
                        if (!isAurusEnabled) {
                            productLineItemData.RequestedDeliveryDate = deliveryDateCalendarObject.getTime().toISOString();
                        }
                    }
                    if (isAurusEnabled) {
                        productLineItemData.OriginalUnitPrice = productLineItem.getBasePrice().value || '';
                        productLineItemData.PromisedDeliveryDate = (deliveryDateField && deliveryDateField in shipment.custom) ? shipment.custom[deliveryDateField].toISOString() : '';
                    }
                    orderLineItemData.push(productLineItemData);
                }
            }
        }
    }
    return orderLineItemData;
}
/**
 * Extracts billing address from order object and returns JSON object.
 * @Param {dw.order.Order} order dw object
 * @return {Object} Billing address JSON object.
 */
function getBillingAddress(order) {
    let orderBillingAddress = order.billingAddress;
    let billingAddress = {
        Address1: orderBillingAddress.address1,
        Address2: orderBillingAddress.address2,
        City: orderBillingAddress.city,
        Country: orderBillingAddress.countryCode.value.toUpperCase(),
        Email: order.customerEmail,
        FirstName: orderBillingAddress.firstName,
        LastName: orderBillingAddress.lastName,
        Phone: orderBillingAddress.phone,
        PostalCode: orderBillingAddress.postalCode
    };
    // For EU locales we dont have state so adding a null check
    if (!!orderBillingAddress.stateCode && orderBillingAddress.stateCode !== 'undefined') billingAddress.State = orderBillingAddress.stateCode;
    return billingAddress;
}
/**
 * Extracts and returns auth amount.
 * @Param {dw.order.Order} order dw object
 * @Param {dw.order.OrderPaymentInstrument} paymentInstrument - order payment instrument
 * @return {string} Auth amount.
 */
function getCurrentAuthAmount(order, paymentInstrument) {
    let currentAuthAmount = '0.00';
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    if (isAurusEnabled) {
        currentAuthAmount = paymentInstrument.paymentTransaction.amount ? paymentInstrument.paymentTransaction.amount.value : '0.00';
    } else {
        var orderHasEGC = require('*/cartridge/scripts/giftcard/giftcardHelper').basketHasGiftCardItems(order).eGiftCards;
        // Aurus Legacy Check
        var paymentMethod = isAurusEnabled ? 'AURUS_CREDIT_CARD' : 'Paymetric';
        if (!(paymentInstrument.paymentMethod.equalsIgnoreCase(paymentMethod)) || orderHasEGC) {
            currentAuthAmount = paymentInstrument.paymentTransaction.amount.available ? paymentInstrument.paymentTransaction.amount.value : '0.00';
        }
    }

    return currentAuthAmount;
}
/**
 * Return payment type ID - Apple Pay = '01' PayPal = '02', everything else = 'Credit Card'
 * @Param {dw.order.OrderPaymentInstrument} paymentInstrument - order payment instrument
 * @return {string} payment type ID
 */
function getPaymentTypeId(paymentInstrument) {
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    let paymentMethod = paymentInstrument.paymentMethod;
    let paymentTypeId;
    if (isAurusEnabled) {
        paymentTypeId = MaoConstants.AurusPaymentType.PaymentTypeId.creditcardPaymentTypeId;
        if (paymentMethod.equalsIgnoreCase('DW_APPLE_PAY')) {
            paymentTypeId = MaoConstants.AurusPaymentType.PaymentTypeId.applepayPaymentTypeId;
        } else if (paymentMethod.equalsIgnoreCase('PayPal')) {
            paymentTypeId = MaoConstants.AurusPaymentType.PaymentTypeId.paypalPaymentTypeId;
        } else if (paymentMethod.toLowerCase().indexOf('klarna') > -1) {
            paymentTypeId = MaoConstants.AurusPaymentType.PaymentTypeId.KlarnaPaymentTypeId;
        } else if (paymentMethod.equalsIgnoreCase('VIP_POINTS')) {
            paymentTypeId = MaoConstants.AurusPaymentType.PaymentTypeId.vipPaymentTypeId;
        } else if (paymentMethod.equalsIgnoreCase('GIFT_CARD')) {
            paymentTypeId = MaoConstants.AurusPaymentType.PaymentTypeId.giftCardTypeId;
        } else if ('CardIndicator' in paymentInstrument.custom && paymentInstrument.custom.CardIndicator && paymentInstrument.custom.CardIndicator === 'P') {
            paymentTypeId = MaoConstants.AurusPaymentType.PaymentTypeId.prepaidCC;
        }
    } else {
        paymentTypeId = MaoConstants.PaymentType.PaymentTypeId.creditcardPaymentTypeId;
        if (paymentMethod.equalsIgnoreCase('DW_APPLE_PAY')) {
            paymentTypeId = MaoConstants.PaymentType.PaymentTypeId.applepayPaymentTypeId;
        } else if (paymentMethod.equalsIgnoreCase('PayPal')) {
            paymentTypeId = MaoConstants.PaymentType.PaymentTypeId.paypalPaymentTypeId;
        } else if (paymentMethod.equalsIgnoreCase('GIFT_CARD')) {
            paymentTypeId = MaoConstants.PaymentType.PaymentTypeId.giftCardTypeId;
        }
    }
    return paymentTypeId;
}
/**
 * Returns request token - Credit card token for Paymetric, Order ID for PayPal.
 * @Param {dw.order.Order} order dw object
 * @Param {dw.order.OrderPaymentInstrument} paymentInstrument - order payment instrument
 * @return {string} requestToken.
 */
function getRequestToken(order, paymentInstrument) {
    let paymentMethod = paymentInstrument.paymentMethod;
    let isXiPayPayPalAuthEnabled = MAOPreferences.xiPayPayPalAuthEnabled;
    let requestToken = null;
    // Aurus Legacy Check
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    var creditCard = isAurusEnabled ? 'AURUS_CREDIT_CARD' : 'Paymetric';
    if (paymentMethod.equalsIgnoreCase('PayPal')) {
        requestToken = isXiPayPayPalAuthEnabled &&
            !empty(paymentInstrument.paymentTransaction.transactionID) ?
            paymentInstrument.paymentTransaction.transactionID : order.orderNo;
    } else if (paymentMethod.equalsIgnoreCase(creditCard)) {
        requestToken = paymentInstrument.creditCardToken;
    } else if (paymentMethod.equalsIgnoreCase('GIFT_CARD')) {
        requestToken = paymentInstrument.custom.gcNumber;
    }
    return requestToken;
}

/**
 * Checks the card type information and returns valid card type for payment validation
 * @param {string} paymentCardType - the credit card type coming from the billing form
 * @returns {string} cardType
 */
function getCardType(paymentCardType) {
    var cardType = '';

    try {
        var paymetricToAurusMapping = {
            VISA: 'VIC',
            MC: 'MCC',
            MAST: 'MCC',
            DISC: 'NVC',
            AMEX: 'AXC'
        };
        cardType = (paymentCardType && paymentCardType in paymetricToAurusMapping) ? paymetricToAurusMapping[paymentCardType] : paymentCardType;
    } catch (e) {
        Logger.error(JSON.stringify(e));
    }
    return cardType;
}

/**
 * Returns card type ID- Paymetric (MC, DISC, AMEX, VISA), PayPal (PP), ApplePay (APAY)
 * @Param {dw.order.OrderPaymentInstrument} paymentInstrument - order payment instrument
 * @return {string} cardTypeId.
 */
function getCardTypeId(paymentInstrument) {
    let cardTypeId;
    let paymentMethod = paymentInstrument.paymentMethod.toUpperCase();
    // Aurus Legacy Check
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();

    var creditCard = isAurusEnabled ? 'AURUS_CREDIT_CARD' : 'PAYMETRIC';

    switch (paymentMethod) {
        case 'PAYPAL':
            cardTypeId = 'PP';
            break;
        case 'DW_APPLE_PAY':
            cardTypeId = (siteID === 'EU' || siteID === 'UKIE') ? 'APAY' : (paymentInstrument.creditCardType || '');
            break;
        case creditCard:
            if (creditCard === 'AURUS_CREDIT_CARD') {
                cardTypeId = getCardType(paymentInstrument.creditCardType);
            } else {
                cardTypeId = paymentInstrument.creditCardType || null;
            }

            break;
        default:
            cardTypeId = null;
    }
    return cardTypeId;
}

/**
 * Returns requestId (Paymetric - referenceNumber)
 * @Param {dw.order.OrderPaymentInstrument} paymentInstrument - order payment instrument
 * @return {string} requestId.
 */
function getRequestId(paymentInstrument) {
    let requestId = null;
    let paymentTransaction = paymentInstrument.paymentTransaction;
    if ('xipayTransactionId' in paymentTransaction.custom && paymentTransaction.custom.xipayTransactionId && paymentTransaction.custom.xipayTransactionType === 'Authorization') {
        // Secondary auth has occurred, use that transactionID
        requestId = paymentTransaction.custom.xipayTransactionId;
    } else if (paymentTransaction.transactionID) {
        // only one auth, use transactionID on paymentInstrument
        requestId = paymentTransaction.transactionID;
    }
    return requestId;
}

/**
 * Returns giftCardType for the given gcPaymentInstrument
 * @Param {dw.order.OrderPaymentInstrument} paymentInstrument - order payment instrument
 * @return {string} giftCardType.
 */
function getGiftCardType(paymentInstrument) {
    // eslint-disable-next-line spellcheck/spell-checker
    // ZGC1 = electronic card, ZGC2 = physical card, ZGC3 = incomm card
    var giftCardNumber = paymentInstrument.custom.gcNumber; // Returns string value

    var filterGCNumber = giftCardNumber ? giftCardNumber.replace(new RegExp('[\\s\\-()+]', 'gi'), '') : null;
    filterGCNumber = filterGCNumber ? parseInt(filterGCNumber, 10) : null; // Convert to integer

    var giftCardClass = ('gcClass' in paymentInstrument.custom && paymentInstrument.custom.gcClass) || '';
    giftCardClass = giftCardClass ? parseInt(giftCardClass, 10) : null;
    var gcType = 'ZGC2';

    if (filterGCNumber == null) {
        gcType = null;
    } else if (filterGCNumber == 0) { // eslint-disable-line eqeqeq
        gcType = 'ZCSR';
    } else if (giftCardClass && giftCardClass == 190) { // eslint-disable-line eqeqeq
        gcType = 'ZGC1';
    } else if (filterGCNumber && ((filterGCNumber >= 6065103375390000 && filterGCNumber <= 6065103511089999) ||
            (filterGCNumber >= 6065142400630000 && filterGCNumber <= 6065142415679999))) {
        gcType = 'ZGC3';
    }
    return gcType;
}


/**
 * Extracts payment details from order object and returns JSON object.
 * @Param {dw.order.Order} Order dw object
 * @Param {dw.order.OrderPaymentInstrument} PaymentInstrument - order payment instrument
 * @Param {integer} Count - counter to set for PaymentMethodId
 * @Param {boolean} isGCPayment - boolean value
 * @return {Object} paymentMethod - Payment details object.
 */
function getPaymentDetails(Order, PaymentInstrument, Count, isGCPayment) {
    let isXiPayPayPalAuthEnabled = MAOPreferences.xiPayPayPalAuthEnabled;
    // Aurus Legacy Check
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();

    let order = Order;
    let paymentInstrument = PaymentInstrument;
    let orderPaymentMethod = paymentInstrument.paymentMethod;
    let count = Count;
    let cardExpiryMonth = (isGCPayment || (isXiPayPayPalAuthEnabled && orderPaymentMethod.equalsIgnoreCase('PayPal'))) ?
        MaoConstants.Payment.paymentCard.expiryMonth : paymentInstrument.creditCardExpirationMonth;
    let cardExpiryYear = (isGCPayment || (isXiPayPayPalAuthEnabled && orderPaymentMethod.equalsIgnoreCase('PayPal'))) ?
        MaoConstants.Payment.paymentCard.expiryYear : paymentInstrument.creditCardExpirationYear;
    let CurrentAuthAmount = getCurrentAuthAmount(order, paymentInstrument);
    let billingAddress = getBillingAddress(order);
    let cardHolderName = null;
    if ((isXiPayPayPalAuthEnabled && orderPaymentMethod.equalsIgnoreCase('PayPal')) || (orderPaymentMethod.equalsIgnoreCase('KLARNA_PAYMENTS')) || !paymentInstrument.creditCardHolder) {
        cardHolderName = billingAddress.FirstName + ' ' + billingAddress.LastName;
    } else if (paymentInstrument.creditCardHolder) {
        cardHolderName = paymentInstrument.creditCardHolder;
    }
    cardHolderName = cardHolderName ? cardHolderName.trim() : cardHolderName;

    let paymentMethod = {
        Amount: paymentInstrument.paymentTransaction.amount.available ? paymentInstrument.paymentTransaction.amount.value : '0.00',
        CurrentAuthAmount: CurrentAuthAmount,
        BillingAddress: {
            Address: billingAddress
        },
        CardExpiryMonth: cardExpiryMonth || null,
        CardExpiryYear: cardExpiryYear || null,
        CurrencyCode: order.currencyCode,
        NameOnCard: cardHolderName,
        PaymentMethodId: count, // For non-GC payment "PaymentMethodId" always starts from  1 followed by gift card 1, 2, 3...n.
        PaymentTransaction: [{
            PaymentResponseStatus: MaoConstants.PaymentTransaction.PaymentResponseStatus,
            ProcessedAmount: CurrentAuthAmount,
            RemainingBalance: (paymentInstrument.paymentMethod.equalsIgnoreCase('GIFT_CARD') ||
                    (isXiPayPayPalAuthEnabled && orderPaymentMethod.equalsIgnoreCase('PayPal'))) ?
                CurrentAuthAmount : '0.00',
            RequestId: getRequestId(paymentInstrument),
            RequestToken: getRequestToken(order, paymentInstrument),
            RequestedAmount: CurrentAuthAmount,
            Status: MaoConstants.PaymentTransaction.Status,
            TransactionType: MaoConstants.PaymentTransaction.TransactionType,
            RequestedDate: paymentInstrument.creationDate.toISOString()
        }],
        PaymentType: {
            PaymentTypeId: getPaymentTypeId(paymentInstrument)
        }
    };

    if (paymentInstrument.paymentMethod.equalsIgnoreCase('PayPal')) {
        paymentMethod.ParentOrderId = paymentInstrument.paymentTransaction.transactionID || null;
    }
    // Set Card-Type for Non-GC Payment through getCardTypeId and for GC getGiftCardType
    if (!isGCPayment) {
        paymentMethod.CardTypeId = getCardTypeId(paymentInstrument);
    } else if (isGCPayment) {
        paymentMethod.CardTypeId = getGiftCardType(paymentInstrument);
    }

    if (isAurusEnabled) {
        const gcExternalResponseId = '0000';
        paymentMethod.GatewayId = isGCPayment ? null : getPaymentGateWay(paymentInstrument.paymentMethod);
        paymentMethod.AccountDisplayNumber = paymentInstrument.custom.AccountDisplayNumber || '';
        paymentMethod.AccountNumber = isGCPayment ? paymentInstrument.custom.gcNumber : paymentInstrument.custom.AccountNumber || '';

        paymentMethod.Extended = {
            CardToken: paymentInstrument.custom.CardToken || '',
            CreditCardBINRange: paymentInstrument.custom.receiptToken || '',
            OneOrderToken: paymentInstrument.custom.OneOrderToken || '',
            AurusWalletIdentifier: paymentInstrument.custom.AurusWalletIdentifier || '',
            AurusProcessorToken: paymentInstrument.custom.AurusProcessorToken || '',
            PayPalUserId: paymentInstrument.custom.paypalPayerID || '',
            PayPalUserEmail: paymentInstrument.paymentMethod.equalsIgnoreCase('PayPal') ? order.customerEmail ? order.customerEmail : (!empty(order.customer.profile) && !empty(order.customer.profile.email)) ? order.customer.profile.email : '' : '',
            PayPalStatus: paymentInstrument.custom.paypalPaymentStatus || '',
            VIPAthleteId: (order.customer.profile && order.customer.profile.custom && 'vipAccountId' in order.customer.profile.custom) ? order.customer.profile.custom.vipAccountId : '',
            cardclass: paymentInstrument.custom.gcClass || ''
        };

        paymentMethod.PaymentTransaction[0].ExternalResponseId = isGCPayment ? gcExternalResponseId : paymentInstrument.custom.ExternalResponseId || '';
        paymentMethod.PaymentTransaction[0].PaymentTransactionId = isGCPayment ? paymentInstrument.custom.gcPin || '' : paymentInstrument.custom.PaymentTransactionId || '';
        // paymentMethod.PaymentTransaction[0].RemainingBalance = paymentInstrument.custom.RemainingBalance || '';
        paymentMethod.PaymentTransaction[0].RequestId = isGCPayment ? paymentInstrument.custom.gcPin || '' : paymentInstrument.custom.RequestId || '';
        paymentMethod.PaymentTransaction[0].RequestToken = isGCPayment ? paymentInstrument.custom.gcPin || '' : paymentInstrument.custom.RequestToken || '';
        paymentMethod.PaymentTransaction[0].RequestedAmount = isGCPayment ? CurrentAuthAmount : paymentInstrument.custom.RequestedAmount || '';
        paymentMethod.PaymentTransaction[0].TransactionType.PaymentTransactionTypeId = 'Authorization';
        paymentMethod.PaymentTransaction[0].Extended = {
            CreditCardCVVResponse: paymentInstrument.custom.cvvResult,
            CreditCardAVSResponse: paymentInstrument.custom.authAVSResult
        };

        if (orderPaymentMethod.equalsIgnoreCase('PayPal')) {
            /* eslint-disable dot-notation */
            delete paymentMethod['CurrentAuthAmount'];
            delete paymentMethod['CardExpiryMonth'];
            delete paymentMethod['CardExpiryYear'];
            delete paymentMethod['NameOnCard'];
            delete paymentMethod['CardTypeId'];
            /* eslint-enable dot-notation */
            if (paymentInstrument.custom.processorReferenceNumber) {
                paymentMethod.PaymentTransaction[0].Extended.PayPalTransactionId = paymentInstrument.custom.processorReferenceNumber;
            }
        } else if (orderPaymentMethod.equalsIgnoreCase('DW_APPLE_PAY')) {
            /* eslint-disable dot-notation */
            delete paymentMethod['CurrentAuthAmount'];
            /* eslint-enable dot-notation */
        } else if (isGCPayment) {
            /* eslint-disable dot-notation */
            delete paymentMethod['CardExpiryMonth'];
            delete paymentMethod['CardExpiryYear'];
            delete paymentMethod['NameOnCard'];
            delete paymentMethod['BillingAddress'];
            delete paymentMethod['CardTypeId'];
            delete paymentMethod['Extended'];
            /* eslint-enable dot-notation */
            delete paymentMethod.PaymentTransaction[0].RemainingBalance;
            paymentMethod.Extended = {
                GiftCardClass: getGiftCardType(paymentInstrument)
            };
            paymentMethod.PaymentTransaction[0].FollowOnId = null;
            paymentMethod.PaymentTransaction[0].ReconciliationId = null;
            paymentMethod.PaymentTransaction[0].FollowOnToken = null;
            paymentMethod.PaymentTransaction[0].TransactionDate = paymentMethod.PaymentTransaction[0].RequestedDate;
            paymentMethod.PaymentTransaction[0].TransmissionStatus = {
                PaymentTransmissionStatusId: 'Closed'
            };
            paymentMethod.PaymentTransaction[0].TransactionType = {
                PaymentTransactionTypeId: 'Settlement'
            };
            paymentMethod.CurrentAuthAmount = '0.00';
            paymentMethod.CurrentSettledAmount = CurrentAuthAmount;
            paymentMethod.AccountDisplayNumber = 'Gift card ending with ' + paymentInstrument.custom.gcNumber.substr(paymentInstrument.custom.gcNumber.length - 4);
            paymentMethod.GiftCardPin = paymentInstrument.custom.gcPin;
        } else if (orderPaymentMethod.equalsIgnoreCase('VIP_POINTS')) {
            if (!paymentMethod.PaymentTransaction[0].RequestedAmount) {
                var RequestedAmount = paymentInstrument.paymentTransaction.amount ? paymentInstrument.paymentTransaction.amount.value : '0.00';
                paymentMethod.PaymentTransaction[0].RequestedAmount = RequestedAmount;
            }
            var RequestId = (order.customer.profile && order.customer.profile.custom && 'vipAccountId' in order.customer.profile.custom) ? order.customer.profile.custom.vipAccountId : '';
            if (!paymentMethod.PaymentTransaction[0].RequestId) {
                paymentMethod.PaymentTransaction[0].RequestId = RequestId;
            }
            if (!paymentMethod.PaymentTransaction[0].RequestToken) {
                paymentMethod.PaymentTransaction[0].RequestToken = RequestId;
            }
            if (!paymentMethod.AccountNumber) {
                paymentMethod.AccountNumber = RequestId;
            }
        }
    }

    return paymentMethod;
}

/**
 * Extracts shipping amount information from order object and returns JSON object.
 * @Param {dw.order.Order} order dw object
 * @Param {boolean} isAurusEnabled - flag if aurus is enabled
 * @return {Object} shipping information JSON object.
 */
function getOrderChargeDetail(order, isAurusEnabled) {
    var Promotion = require('dw/campaign/Promotion');
    var orderChargeDetail = [];

    var shippingData = {};
    shippingData.ChargeTotal = order.adjustedShippingTotalPrice.available ? order.adjustedShippingTotalPrice.value : '0.00';
    shippingData.ChargeType = {
        ChargeTypeId: 'Shipping'
    };
    shippingData.ChargeDetailId = 'ShippingCharge';
    orderChargeDetail.push(shippingData);

    if (isAurusEnabled) {
        try {
            var priceAdjustments = order.getPriceAdjustments();
            for (let i = 0, j = priceAdjustments.length; i < j; i++) {
                var priceAdjustment = priceAdjustments[i];
                if (priceAdjustment && priceAdjustment.promotion &&
                    (priceAdjustment.promotion.getPromotionClass() === Promotion.PROMOTION_CLASS_SHIPPING)) {
                    var relatedChargeType;
                    var discountOn;
                    if (priceAdjustment.promotion.getPromotionClass() === Promotion.PROMOTION_CLASS_SHIPPING) {
                        relatedChargeType = 'Shipping';
                        discountOn = 'Charges';
                    } else {
                        discountOn = 'Order';
                    }

                    var ChargeTypeId = 'Promotion';
                    if (priceAdjustment.couponLineItem) {
                        ChargeTypeId = 'Coupon';
                    }
                    var promoData = {};
                    if (priceAdjustment.promotion && priceAdjustment.promotion.getID()) {
                        promoData.Extended = {};
                        promoData.Extended.PromoCodeClass = priceAdjustment.promotion.getID();
                    }

                    promoData.ChargeDetailId = priceAdjustment.getUUID();
                    promoData.DiscountOn = discountOn;
                    promoData.RequestedAmount = priceAdjustment.price.available ? '-' + priceAdjustment.price.value : '0.00';
                    if (relatedChargeType) {
                        promoData.RelatedChargeType = relatedChargeType;
                    }
                    promoData.ChargeType = {
                        ChargeTypeId: ChargeTypeId
                    };
                    orderChargeDetail.push(promoData);
                }
            }
        } catch (error) {
            Logger.error(JSON.stringify(error));
        }
    }
    return orderChargeDetail;
}

/**
 * Extracts tax amount information from order object and returns JSON object.
 * @Param {dw.order.Order} order dw object
 * @return {Object} Tax information JSON object.
 */
function getOrderTaxDetail(order) {
    var OrderTaxDetail = [];
    var taxData = {};
    taxData.TaxTypeId = 'SALES';
    taxData.TaxAmount = order.adjustedShippingTotalTax.available ? order.adjustedShippingTotalTax.value : '0.00';
    taxData.TaxableAmount = order.adjustedShippingTotalPrice.available ? order.adjustedShippingTotalPrice.value : '0.00';
    taxData.TaxCode = 'SAPFREIGHT';
    OrderTaxDetail.push(taxData);
    return OrderTaxDetail;
}

/**
 * Extracts payment information from order object and returns JSON object.
 * @Param {dw.order.Order} order dw object
 * @return {Object} Payment information JSON object.
 */
function getPaymentInformation(order) {
    let paymentInformation = [];
    let paymentMethods = [];
    let gcPaymentMethodId = MaoConstants.Payment.gcPaymentMethodId;
    let paymentInstruments = order.paymentInstruments.iterator();
    let gcPaymentInstruments = order.getPaymentInstruments(gcPaymentMethodId).iterator();
    let count = 0;
    while (paymentInstruments.hasNext()) {
        let paymentInstrument = paymentInstruments.next();
        if (!(paymentInstrument.getPaymentMethod().equalsIgnoreCase(gcPaymentMethodId))) {
            ++count;
            let paymentMethod = getPaymentDetails(order, paymentInstrument, count, false);
            paymentMethods.push(paymentMethod);
        }
    }

    // Check when gcPaymentInstruments is empty and do we need to check condition before executing hasNext()
    while (gcPaymentInstruments.hasNext()) {
        let gcPaymentInstrument = gcPaymentInstruments.next();
        ++count;
        let paymentMethod = getPaymentDetails(order, gcPaymentInstrument, count, true);
        paymentMethods.push(paymentMethod);
    }

    paymentInformation.push({
        PaymentMethod: paymentMethods
    });
    return paymentInformation;
}

/**
 * Returns loyaltyID
 * @Param {dw.order.Order} order dw object
 * @return {string} loyaltyID
 */
function getCustomerLID(order) {
    let loyaltyID = null;
    if (!empty(order.customer) && !empty(order.customer.profile) && !empty(order.customer.profile.custom) && !empty(order.customer.profile.custom.loyaltyID)) {
        loyaltyID = order.customer.profile.custom.loyaltyID;
    } else if ('referenceLoyaltyId' in order.custom && !empty(order.custom.referenceLoyaltyId)) {
        loyaltyID = order.custom.referenceLoyaltyId;
    }
    return loyaltyID;
}
/**
 * Returns loyalty enroll date
 * @Param {dw.order.Order} order dw object
 * @return {string} loyaltyEnrollDate
 */
function getCustomerLoyaltyEnrollDate(order) {
    let loyaltyEnrollDate = null;
    if (!empty(order.customer) && !empty(order.customer.profile) && !empty(order.customer.profile.custom) && !empty(order.customer.profile.custom.loyaltyStatusDate)) {
        loyaltyEnrollDate = order.customer.profile.custom.loyaltyStatusDate;
    } else if ('referenceLoyaltyEnrolledDate' in order.custom && !empty(order.custom.referenceLoyaltyEnrolledDate)) {
        loyaltyEnrollDate = order.custom.referenceLoyaltyEnrolledDate;
    }
    return loyaltyEnrollDate;
}
/**
 * Returns auth code.
 * @Param {dw.order.Order} order dw object
 * @return {string} authCode
 */
function getAuthCode(order) {
    let authCode = null;
    let paymentInstruments = order.paymentInstruments.iterator();
    while (paymentInstruments.hasNext()) {
        let paymentInstrument = paymentInstruments.next();
        let paymentMethod = paymentInstrument.paymentMethod;
        var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
        // Aurus Legacy Check
        if (paymentMethod.equalsIgnoreCase('Paymetric') && !empty(paymentInstrument.paymentTransaction.custom.authCode)) {
            authCode = paymentInstrument.paymentTransaction.custom.authCode;
            break;
        } else if (paymentMethod.equalsIgnoreCase('AURUS_CREDIT_CARD') && isAurusEnabled) {
            authCode = paymentInstrument.paymentTransaction.custom.aurusPayAPTID;
            break;
        } else if (paymentMethod.equalsIgnoreCase('DW_APPLE_PAY')) {
            authCode = MaoConstants.Extended.authcode.applepay;
            break;
        } else if (paymentMethod.equalsIgnoreCase('PayPal') && MAOPreferences.xiPayPayPalAuthEnabled && !empty(paymentInstrument.paymentTransaction.custom.xipayTRPaypalRefId)) {
            authCode = paymentInstrument.paymentTransaction.custom.xipayTRPaypalRefId;
            break;
        }
    }
    return authCode;
}
/**
 * Returns customer source -'Employee', 'Customer', 'Athlete' for VIP, 'E4X' for BordeFree
 * @Param {dw.order.Order} order dw object
 * @return {string} customerSource
 */
function getCustomerSource(order) {
    let customerSource = MaoConstants.Extended.customerSource.Customer;
    if ('isEmployeeOrder' in order.custom && order.custom.isEmployeeOrder) {
        customerSource = MaoConstants.Extended.customerSource.Employee;
    } else if ('isVipOrder' in order.custom && order.custom.isVipOrder) {
        customerSource = MaoConstants.Extended.customerSource.Athlete;
    } else if (('bfxMerchantOrderRef' in order.custom && !empty(order.custom.bfxMerchantOrderRef)) || ('bfxOrderId' in order.custom && !empty(order.custom.bfxOrderId))) {
        customerSource = MaoConstants.Extended.customerSource.E4X;
    }
    return customerSource;
}
/**
 * Construct order extended data and returns JSON object.
 * @Param {dw.order.Order} order dw object
 * @return {Object} Order extended data JSON object.
 */
function getOrderExtendedData(order) {
    Logger.debug('Constructing order extented data.');
    let customerSource = getCustomerSource(order);
    let orderEnteredBy = null;
    let eaEmployeeId = order.custom.eaEmployeeId;
    var csrEmailAddress = order.custom.csrEmailAddress;

    if (eaEmployeeId) {
        orderEnteredBy = eaEmployeeId;
    } else if (csrEmailAddress) {
        orderEnteredBy = csrEmailAddress;
    } else if (order.getCreatedBy() && order.getCreatedBy().toLowerCase() !== 'customer') {
        orderEnteredBy = order.getCreatedBy();
    }
    var applePayPaymentInstruments = order.getPaymentInstruments('DW_APPLE_PAY');
    var klarnaPaymentInstruments = order.getPaymentInstruments('KLARNA_PAYMENTS');
    let salesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.defaultSapSalesDocumentTypeFMS;
    let vipPaymentInstruments = order.getPaymentInstruments('VIP_POINTS');
    if (vipPaymentInstruments.length > 0) {
        salesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.vipSapSalesDocumentTypeFMS;
    } else if (applePayPaymentInstruments.length > 0) {
        salesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.applepaySapSalesDocumentTypeFMS;
    }
    var orderExtendedData = {
        OrderRegion: getOrderRegion(),
        orderType: getOrderType(order),
        sapSalesDocumentTypeFMS: salesDocumentTypeFMS,
        EAStoreId: order.custom.eaStoreId,
        EAManagerId: order.custom.eaManagerId,
        itemsTaxTotal: order.adjustedMerchandizeTotalTax.available ? order.adjustedMerchandizeTotalTax.value : '0.00',
        isPoBox: '0',
        LoyaltyID: getCustomerLID(order),
        LoyaltyPointsEarned: order.custom.estimatedLoyaltyPoints,
        LoyaltyPointsBalance: order.custom.loyaltyPointsBalance,
        OptInDate: getCustomerLoyaltyEnrollDate(order),
        freeReturnShippingFMS: customerSource.equalsIgnoreCase('Customer') ? 'Y' : 'N',
        transactionTypeFMS: getTransactionTypeFMS(order),
        PayPalExpresstransactionId: getTransactionId(order, 'PayPal'),
        packlistType: getPacklistType(order),
        Jurisdiction: getJurisdictionID(order),
        customerSource: customerSource,
        captureSystem: MaoConstants.Extended.captureSystem,
        shippingTotal: order.adjustedShippingTotalPrice.available ? order.adjustedShippingTotalPrice.value : '0.00',
        shippingTaxTotal: order.adjustedShippingTotalTax.available ? order.adjustedShippingTotalTax.value : '0.00',
        shoprunner_Token: ('sr_token' in order.custom && !empty(order.custom.sr_token)) ? order.custom.sr_token : null
    };
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    if (isAurusEnabled) {
        let paymentInstruments = order.paymentInstruments.iterator();
        let gcPaymentMethodId = MaoConstants.Payment.gcPaymentMethodId;
        while (paymentInstruments.hasNext()) {
            let paymentInstrument = paymentInstruments.next();
            if (!(paymentInstrument.getPaymentMethod().equalsIgnoreCase(gcPaymentMethodId))) {
                orderExtendedData.ParentOrderPrimaryPayment = getPaymentTypeId(paymentInstrument);
            }
        }

        if (orderExtendedData.customerSource) {
            orderExtendedData.customerSource = orderExtendedData.customerSource.toUpperCase();
        }
        if (vipPaymentInstruments.length > 0) {
            orderExtendedData.sapSalesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.vipAurusSapSalesDocumentTypeFMS;
        } else if (applePayPaymentInstruments.length > 0) {
            orderExtendedData.sapSalesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.applepayAurusSapSalesDocumentTypeFMS;
        } else {
            orderExtendedData.sapSalesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.defaultAurusSapSalesDocumentTypeFMS;
        }
    } else {
        orderExtendedData.enteredBy = orderEnteredBy;
        orderExtendedData.authCode = getAuthCode(order);
        orderExtendedData.encryptionProfileCode = MaoConstants.Extended.encryptionProfileCode;
    }

    orderExtendedData.orderReasonFMS = order.custom.orderReasonFMS ? order.custom.orderReasonFMS : MaoConstants.Extended.orderReasonFMS;
    orderExtendedData.customerUid = getCustomerUid(order);

    if (siteID === 'EU' || siteID === 'UKIE') {
        let localeID = order.custom.customerLocale || order.customerLocaleID;
        orderExtendedData.languageCode = localeID ? localeID.toLowerCase().split('_')[0] : '';
        orderExtendedData.pspReference = getTransactionId(order, 'AdyenComponent');
        orderExtendedData.sapSalesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.emeaSapSalesDocumentTypeFMS;
        orderExtendedData.Region = order.custom.customerCountry;
        orderExtendedData.transactionTypeFMS = MaoConstants.Extended.transactionTypeFMS.emeaTransactionTypeFMS;
    }
    if (applePayPaymentInstruments.length > 0) {
        orderExtendedData.pspReference = getTransactionId(order, 'DW_APPLE_PAY');
    } else if (klarnaPaymentInstruments.length > 0) {
        orderExtendedData.pspReference = getTransactionId(order, 'KLARNA_PAYMENTS');
    }

    if ('isOptedInToNotifications' in order.custom && order.custom.isOptedInToNotifications) {
        let phone = order.billingAddress.phone;
        if (siteID === 'US') {
            phone = '1' + phone;
        }
        orderExtendedData.HasConsented = order.custom.isOptedInToNotifications;
        orderExtendedData.Phone = phone;
    }

    return orderExtendedData;
}

/**
 * Extract order capture details
 * @Param {dw.order.Order} order dw object
 * @return {Object} Order capture details
 */
function getOrderCaptureDetail(order) {
    return {
        Extended: {
            accertifyInAuthTransactionID: 'accertifyInAuthTransactionID' in order.custom ? order.custom.accertifyInAuthTransactionID : ''
        },
        IpAddress: order.custom.customerIPAddress || order.remoteHost
    };
}

/**
 * Extract customer name and return JSON object
 * @Param {dw.order.Order} order dw object
 * @return {Object} Customer name JSON object with first name and last name information.
 */
function getCustomerName(order) {
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var customerName = {
        firstName: null,
        lastName: null
    };
    let fullName = order.customerName;
    let spacePos = fullName.indexOf(' ');
    if (spacePos !== -1) {
        customerName.firstName = fullName.slice(0, spacePos);
        customerName.lastName = fullName.slice(spacePos + 1);
    }
    // Server side validation for validating Profile fields check with emoji and non latin characters
    var profileFieldsValidation = accountHelpers.validateProfileFields(customerName);
    if (profileFieldsValidation.error) {
        var billingAddress = getBillingAddress(order);
        customerName.firstName = billingAddress.FirstName;
        customerName.lastName = billingAddress.LastName;
    }
    return customerName;
}
/**
 * Method to extract and returns order information JSON object
 * @param {dw.order.Order} order dw object
 * @return {Object} Order JSON object
 */
module.exports.getOrderJSON = function (order) {
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    let orderJSON = {};

    if (!order) {
        return orderJSON;
    }

    let customerName = getCustomerName(order);
    try {
        orderJSON = {
            MessageHeader: MaoConstants.MessageHeader,
            CapturedDate: order.creationDate.toISOString(),
            CurrencyCode: order.currencyCode,
            CustomerFirstName: customerName.firstName,
            CustomerLastName: customerName.lastName,
            CustomerPhone: !empty(order.billingAddress) && !empty(order.billingAddress.phone) ? order.billingAddress.phone : '',
            DocType: MaoConstants.DocType,
            Extended: getOrderExtendedData(order),
            IsConfirmed: !order.custom.onHold,
            OrderActions: MaoConstants.OrderActions,
            OrderId: order.orderNo,
            OrderChargeDetail: getOrderChargeDetail(order, isAurusEnabled),
            OrderTaxDetail: getOrderTaxDetail(order),
            OrderLine: getOrderLineItems(order),
            OrderType: {
                OrderTypeId: getOrderType(order)
            },
            Payment: getPaymentInformation(order)
        };

        if (isAurusEnabled) {
            try {
                /* eslint-disable dot-notation */
                delete orderJSON['OrderActions']['IsImport'];
                orderJSON.OrderCaptureDetail = getOrderCaptureDetail(order);
                /* eslint-enable dot-notation */
            } catch (error) {
                Logger.error(JSON.stringify(error));
            }
        }

        var defaultShipment = order.getDefaultShipment();

        try {
            orderJSON.Extended.ShippingMethodId = null;
            if (orderJSON.OrderLine && orderJSON.OrderLine.length) {
                var orderLineShipping = orderJSON.OrderLine.filter(pli => {
                    return pli.ShippingMethodId !== 'store-pickup';
                });
                if (orderLineShipping && orderLineShipping.length) {
                    orderJSON.Extended.ShippingMethodId = orderLineShipping[0].ShippingMethodId;
                }
            }
        } catch (error) {
            Logger.error('ShippingMethodId: {0}', JSON.stringify(error));
        }

        if ((siteID === 'EU' || siteID === 'UKIE') && defaultShipment.custom.paazlDeliveryInfo) {
            var paazlDeliveryInfo = JSON.parse(defaultShipment.custom.paazlDeliveryInfo);
            orderJSON.Extended.ShippingMethodId = paazlDeliveryInfo ? paazlDeliveryInfo.identifier : '';
        }
        // Aurus Legacy Check
        var creditCard = isAurusEnabled ? 'AURUS_CREDIT_CARD' : 'Paymetric';
        if (!isAurusEnabled && !order.getPaymentInstruments(creditCard).empty) {
            orderJSON.OrderHold = [{
                HoldTypeId: MaoConstants.OrderHold.HoldTypeId,
                StatusId: MaoConstants.OrderHold.StatusId
            }];
        }
        var orderGiftMessage = defaultShipment.giftMessage ? defaultShipment.giftMessage : null;
        if (orderGiftMessage) {
            let OrderNote = [];
            let giftMessage = orderGiftMessage;
            const noteMaxLength = 70;
            // Map first 70 characters of the gift message
            OrderNote.push({
                NoteCategory: MaoConstants.OrderNote.NoteCategory,
                NoteId: '1',
                NoteText: giftMessage.length > noteMaxLength ? giftMessage.substring(0, noteMaxLength) : giftMessage,
                NoteType: MaoConstants.OrderNote.NoteType
            });
            // Map Second 70 characters of the gift message
            if (giftMessage.length > noteMaxLength) {
                OrderNote.push({
                    NoteCategory: MaoConstants.OrderNote.NoteCategory,
                    NoteId: '2',
                    NoteText: giftMessage.length > (noteMaxLength * 2) ? giftMessage.substring(noteMaxLength, (noteMaxLength * 2)) : giftMessage.substring(noteMaxLength),
                    NoteType: MaoConstants.OrderNote.NoteType
                });
            }
            orderJSON.OrderNote = OrderNote;
        }

        try {
            orderJSON.Extended.CustomerCreatedDate = getFormattedDateInSiteTimeZone(order.creationDate);
            if (isAurusEnabled) {
                getAurusData(orderJSON, order);
            }
        } catch (error) {
            Logger.error(JSON.stringify(error));
        }

        return JSON.stringify(orderJSON, function (key, value) {
            let JSONValue;
            if (!empty(value) && !(value instanceof Object)) {
                JSONValue = value.toString();
            } else {
                JSONValue = value;
            }
            return JSONValue;
        });
    } catch (e) {
        orderJSON.error = true;
        orderJSON.errorMsg = e.message;
        Logger.error('Error while extracting order data :: order {0} :: error {1}', order.orderNo, e.message);
    }
    return JSON.stringify(orderJSON);
};
/**
 * Method to extract and returns order payment information JSON object
 * @param {dw.order.Order} order dw object
 * @return {Object} Order JSON object
 */
module.exports.getUpdatePaymentRequestJSON = function getUpdatePaymentRequestJSON(order) {
    let orderPaymentRequestJSON = {};
    try {
        orderPaymentRequestJSON = {
            MessageHeader: MaoConstants.MessageHeader,
            OrderId: order.orderNo,
            IsConfirmed: !order.custom.onHold,
            Payment: getPaymentInformation(order)
        };
        return JSON.stringify(orderPaymentRequestJSON, function (key, value) {
            let JSONValue;
            if (!empty(value) && !(value instanceof Object)) {
                JSONValue = value.toString();
            } else {
                JSONValue = value;
            }
            return JSONValue;
        });
    } catch (e) {
        orderPaymentRequestJSON.error = true;
        orderPaymentRequestJSON.errorMsg = e.message;
        Logger.error('Error while extracting order payment data :: order {0} :: error {1}', order.orderNo, e.message);
    }
    return JSON.stringify(orderPaymentRequestJSON);
};
/**
 * Method to extract and returns order cancel request JSON object
 * @param {dw.order.Order} order dw object
 * @return {Object} Order cancel JSON object
 */
module.exports.getOrderCancelRequestJSON = function (order) {
    let orderCancelRequestJSON = {};
    try {
        orderCancelRequestJSON = {
            MessageHeader: MaoConstants.MessageHeader,
            IsCancelled: true,
            OrderId: order.orderNo
        };
    } catch (e) {
        orderCancelRequestJSON.error = true;
        orderCancelRequestJSON.errorMsg = e.message;
        Logger.error('Error while Constructing cancel request JSON for order :: {0} :: error {1}', order.orderNo, e.message);
    }
    return JSON.stringify(orderCancelRequestJSON);
};
/**
 * Method to extract and returns order confirm request JSON object
 * @param {dw.order.Order} order dw object
 * @return {Object} Order confirm JSON object
 */
module.exports.getConfirmOrderRequestJSON = function (order) {
    let orderConfirmRequestJSON = {};
    try {
        orderConfirmRequestJSON = {
            MessageHeader: MaoConstants.MessageHeader,
            IsConfirmed: true,
            OrderId: order.orderNo
        };
    } catch (e) {
        orderConfirmRequestJSON.error = true;
        orderConfirmRequestJSON.errorMsg = e.message;
        Logger.error('Error while Constructing order confirm request JSON for order :: {0} :: error {1}', order.orderNo, e.message);
    }
    return JSON.stringify(orderConfirmRequestJSON);
};
