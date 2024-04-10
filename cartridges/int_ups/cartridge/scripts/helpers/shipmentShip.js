'use strict';

/**
 * Fetches JSON Object of Service's Profile attribute data
 * @param {Object} profile DW Service Profile
 * @returns {Object} JSON Object of Service's Profile attribute data
 */
function getServiceConfig(profile) {
    try {
        if (profile && 'data' in profile.custom && profile.custom.data) return JSON.parse(profile.custom.data);
    } catch (e) {
        e.stack; //eslint-disable-line
    }
    return null;
}

/**
 * Fetches country code from current locale
 * @returns {string} returns country code of current locale
 */
function getLocaleCountry() {
    var Locale = require('dw/util/Locale');
    var currentLocale = Locale.getLocale(request.locale); //eslint-disable-line
    return currentLocale.getCountry();
}

/**
 * Get locale base site prefrences
 * @param {string} prefsName prefrences name
 * @param {string|undefined} orderShippedCountryCode Order Shipped Country Code
 * @returns {(string|null)} Site prefValues
 */
function getLocaleSpecificJsonPrefValue(prefsName, orderShippedCountryCode) {
    var upsPrefs = require('*/cartridge/configs/upsPrefs');
    try {
        var countryCode = orderShippedCountryCode;
        if (!countryCode) {
            countryCode = getLocaleCountry();
        }

        var defaultPrefValues = JSON.parse(upsPrefs[prefsName]);
        var countryOveride = JSON.parse(upsPrefs.countryOverride);

        if (upsPrefs.returnCountryOverride && upsPrefs.returnCountryOverride[countryCode] && upsPrefs.returnCountryOverride[countryCode].accountNumber) {
            defaultPrefValues.accountNumber = upsPrefs.returnCountryOverride[countryCode].accountNumber;
            defaultPrefValues.carrierName = upsPrefs.returnCountryOverride[countryCode].carrierName;
            countryOveride.accountNumber = upsPrefs.returnCountryOverride[countryCode].accountNumber;
            countryOveride.carrierName = upsPrefs.returnCountryOverride[countryCode].carrierName;
        }

        if (!countryCode) return defaultPrefValues;

        if (!upsPrefs.countryOverride) return defaultPrefValues;
        return (countryOveride[countryCode] && countryOveride[countryCode][prefsName]) ? countryOveride[countryCode][prefsName] : defaultPrefValues;
    } catch (e) {
        e.stack; //eslint-disable-line
    }
    return null;
}

/**
 * Get ReferenceNumberType or null
 * @param {Object} webRef  webRef object
 * @param {string} order order
 * @returns {(Object|null)} returns ReferenceNumberType for countries specified in site prefs and null for others
 */
function getReferenceNumberType(webRef, order) {
    var upsPrefs = require('*/cartridge/configs/upsPrefs');
    var showOrderNumberCountryCode = upsPrefs.showOrderReference;
    var currentLocaleCountry = getLocaleCountry();
    if (currentLocaleCountry && showOrderNumberCountryCode.indexOf(currentLocaleCountry) !== -1) {
        var returnCaseNum = order.custom.returnCaseNumber;
        var referenceNumberType = new webRef.ReferenceNumberType();
        referenceNumberType.setValue(returnCaseNum);
        return referenceNumberType;
    }
    return null;
}

/**
 * Replace spaces from postal code
 * @param {string} postalCode postal code
 * @returns {string} replaced postal code
 */
function replaceSpacePostalCode(postalCode) {
    return postalCode ? postalCode.replace(' ', '') : '';
}

/**
 * Create Header content for service
 * @param {Object} profile Service Profile
 * @param {Object} webRef SOAP web refrences object
 * @returns {Object} returns web refrences object
 */
function createUPSSecurityHeader(profile, webRef) {
    var upss = new webRef.UPSSecurity();
    var upsSvcToken = new webRef.ObjectFactory().createUPSSecurityServiceAccessToken();
    var upsSecUsernameToken = new webRef.ObjectFactory().createUPSSecurityUsernameToken();
    var profileData = getServiceConfig(profile);
    if (profileData) {
        upsSvcToken.setAccessLicenseNumber(profileData.accessLicenseNumber);
        upsSecUsernameToken.setUsername(profileData.username);
        upsSecUsernameToken.setPassword(profileData.password);
    }
    upss.setServiceAccessToken(upsSvcToken);
    upss.setUsernameToken(upsSecUsernameToken);
    return upss;
}

/**
 * Build Shipper type info in request
 * @param {Object} webRef webRef object
 * @param {string} warehouseAddress warehouse saved in site prefrences
 * @param {string} shipperAddressObj shipperAddressObj saved in site prefrences
 * @returns {Object} returns web refrences object
 */
function buildShipperType(webRef, warehouseAddress, shipperAddressObj) {
    var shipper = new webRef.ShipperType();
    shipper.setName(warehouseAddress.name);
    shipper.setAttentionName(warehouseAddress.attentionName || warehouseAddress.name);
    shipper.setShipperNumber(shipperAddressObj.accountNumber);

    var shipperPhone = new webRef.ShipPhoneType();
    shipperPhone.setNumber(warehouseAddress.phone);
    shipper.setPhone(shipperPhone);

    var shipperAddress = new webRef.ShipAddressType();
    shipperAddress.addressLine.add(shipperAddressObj.address);
    shipperAddress.setCity(shipperAddressObj.city);
    shipperAddress.setPostalCode(shipperAddressObj.postalCode ? replaceSpacePostalCode(shipperAddressObj.postalCode) : '');
    shipperAddress.setCountryCode(shipperAddressObj.countryCode);

    shipper.setAddress(shipperAddress);
    return shipper;
}

/**
 * Build Ship from type request
 * @param {Object} webRef webRef object
 * @param {Object} order DW Order
 * @returns {Object} returns web refrences object
 */
function buildShipFromType(webRef, order) {
    var shipFrom = new webRef.ShipFromType();
    var orderShippedCountryCode = (order.defaultShipment.shippingAddress && order.defaultShipment.shippingAddress.countryCode && order.defaultShipment.shippingAddress.countryCode.value) ? order.defaultShipment.shippingAddress.countryCode.value : '';
    var orderAddressMap = getLocaleSpecificJsonPrefValue('returnFromAddress', orderShippedCountryCode);
    if (!orderAddressMap) return shipFrom;

    shipFrom.setName(orderAddressMap.name || order.defaultShipment.shippingAddress.firstName);
    shipFrom.setAttentionName(orderAddressMap.attentionName || orderAddressMap.name || order.defaultShipment.shippingAddress.fullName);

    var shipPhone = new webRef.ShipPhoneType();
    shipPhone.setNumber(orderAddressMap.phone || order.defaultShipment.shippingAddress.phone);
    shipFrom.setPhone(shipPhone);

    var shipFromAddress = new webRef.ShipAddressType();
    shipFromAddress.addressLine.add(orderAddressMap.address || order.defaultShipment.shippingAddress.address1);
    if (!empty(orderAddressMap.address2)) {
        shipFromAddress.addressLine.add(orderAddressMap.address2);
    }
    shipFromAddress.setCity(orderAddressMap.city || order.defaultShipment.shippingAddress.city);
    shipFromAddress.setPostalCode(replaceSpacePostalCode(orderAddressMap.postalCode) || replaceSpacePostalCode(order.defaultShipment.shippingAddress.postalCode));
    shipFromAddress.setCountryCode(orderAddressMap.countryCode || order.defaultShipment.shippingAddress.countryCode.value);
    shipFrom.setAddress(shipFromAddress);
    return shipFrom;
}

/**
 * Builds Ship To Type
 * @param {Object} webRef webRef object
 * @param {string} warehouseAddress warehouse saved in site prefrences
 * @returns {Object} returns web refrences object
 */
function buildShipToType(webRef, warehouseAddress) {
    var shipTo = new webRef.ShipToType();
    shipTo.setName(warehouseAddress.name);
    shipTo.setAttentionName(warehouseAddress.attentionName || warehouseAddress.name);

    var shipToAddress = new webRef.ShipToAddressType();
    var shpPhone = new webRef.ShipPhoneType();
    shpPhone.setNumber(warehouseAddress.phone);
    shipTo.setPhone(shpPhone);
    shipToAddress.addressLine.add(warehouseAddress.address);
    if (!empty(warehouseAddress.address2)) {
        shipToAddress.addressLine.add(warehouseAddress.address2);
    }
    shipToAddress.setCity(warehouseAddress.city);
    shipToAddress.setPostalCode(replaceSpacePostalCode(warehouseAddress.postalCode));
    shipToAddress.setCountryCode(warehouseAddress.countryCode);
    shipTo.setAddress(shipToAddress);
    return shipTo;
}

/**
 * Builds Package type in request
 * @param {Object} webRef webRef object
 * @param {string} profileData service's profile attribute
 * @returns {Object} returns web refrences object
 */
function buildPackageType(webRef, profileData) {
    var pkg1 = new webRef.PackageType();
    var pkgingType = new webRef.PackagingType();
    pkgingType.setCode(profileData.packagingCode);
    pkg1.setPackaging(pkgingType);
    pkg1.setDescription(profileData.packageDescription);

    var weight = new webRef.PackageWeightType();
    weight.setWeight(profileData.packageWeight);

    var shpUnitOfMeas = new webRef.ShipUnitOfMeasurementType();
    shpUnitOfMeas.setCode(profileData.weightMeasurementsCode);
    weight.setUnitOfMeasurement(shpUnitOfMeas);
    pkg1.setPackageWeight(weight);
    return pkg1;
}

/**
 * Builds Payment info type in request
 * @param {Object} webRef webRef object
 * @param {string} profileData service's profile attribute
 * @param {string} shipperAddressObj Shipper Address object from prefs
 * @returns {Object} returns web refrences object
 */
function buildPaymentInfoType(webRef, profileData, shipperAddressObj) {
    var payInfo = new webRef.PaymentInfoType();
    var shpmntCharge = new webRef.ShipmentChargeType();
    var billShipper = new webRef.BillShipperType();

    shpmntCharge.setType(profileData.shipmentChargeType);
    billShipper.setAccountNumber(shipperAddressObj.accountNumber);
    shpmntCharge.setBillShipper(billShipper);
    payInfo.shipmentCharge.add(shpmntCharge);
    return payInfo;
}

/**
 * Builds Label Specification type in request
 * @param {Object} webRef webRef object
 * @param {string} profileData service's profile attribute
 * @returns {Object} returns web refrences object
 */
function buildLabelSpecificationType(webRef, profileData) {
    var labelSpecType = new webRef.LabelSpecificationType();
    var labelImageFormat = new webRef.LabelImageFormatType();
    labelImageFormat.setCode(profileData.labelImageFormatCode);
    labelImageFormat.setDescription(profileData.labelImageFormatCode);
    labelSpecType.setLabelImageFormat(labelImageFormat);
    labelSpecType.setHTTPUserAgent('Mozilla/4.5');
    return labelSpecType;
}

/**
 * Create Shipment request
 * @param {Object} profile service's profile object
 * @param {Object} webRef webRef object
 * @param {Object} order DW Order
 * @returns {Object} returns web refrences object
 */
function createUPSShipmentProcessRequest(profile, webRef, order) {
    var orderShippedCountryCode = (order.defaultShipment.shippingAddress && order.defaultShipment.shippingAddress.countryCode && order.defaultShipment.shippingAddress.countryCode.value) ? order.defaultShipment.shippingAddress.countryCode.value : '';
    var warehouseAddress = getLocaleSpecificJsonPrefValue('returnAddress', orderShippedCountryCode);
    var profileData = getServiceConfig(profile);
    var shipperAddressObj = getLocaleSpecificJsonPrefValue('returnShipperAddress', orderShippedCountryCode);

    if (!order || !profileData || !warehouseAddress || !shipperAddressObj) return null;

    //	Request
    var request = new webRef.RequestType();
    var shipRequest = new webRef.ShipmentRequest();
    request.requestOption.add(profileData.requestOption);
    shipRequest.setRequest(request);

    // Shipment
    var shpmnt = new webRef.ShipmentType();

    // ReturnService
    var returnService = new webRef.ReturnServiceType();
    returnService.setCode(profileData.serviceCode);
    shpmnt.setReturnService(returnService);

    // shipper Type
    shpmnt.setShipper(buildShipperType(webRef, warehouseAddress, shipperAddressObj));

    // Ship From
    shpmnt.setShipFrom(buildShipFromType(webRef, order));

    //	ShipTo
    shpmnt.setShipTo(buildShipToType(webRef, warehouseAddress));

    // ShipmentRatingOptions
    var shipmentRatingOptions = new webRef.RateInfoType();
    shipmentRatingOptions.setNegotiatedRatesIndicator(profileData.negotiatedRatesIndicator);
    shpmnt.setShipmentRatingOptions(shipmentRatingOptions);

    //	Service
    var service = new webRef.ServiceType();
    if (orderShippedCountryCode && profileData.shippingService && orderShippedCountryCode in profileData.shippingService && profileData.shippingService[orderShippedCountryCode].shippingServiceCode && profileData.shippingService[orderShippedCountryCode].shippingServiceDescription) {
        service.setCode(profileData.shippingService[orderShippedCountryCode].shippingServiceCode);
        service.setDescription(profileData.shippingService[orderShippedCountryCode].shippingServiceDescription);
    } else {
        service.setCode(profileData.shippingService.default.shippingServiceCode);
        service.setDescription(profileData.shippingService.default.shippingServiceDescription);
    }
    shpmnt.setService(service);

    //	Package
    shpmnt.package.add(buildPackageType(webRef, profileData));

    // Populate Order number for Norway and Switzerland
    var referenceNumberType = getReferenceNumberType(webRef, order);
    if (referenceNumberType) shpmnt.referenceNumber.add(referenceNumberType);

    //	Payment Information
    shpmnt.setPaymentInformation(buildPaymentInfoType(webRef, profileData, shipperAddressObj));

    //	Label Specification
    shipRequest.setLabelSpecification(buildLabelSpecificationType(webRef, profileData));
    shipRequest.setShipment(shpmnt);

    return shipRequest;
}

/**
 * Create request
 * @param {Object} profile service's profile object
 * @param {Object} webReference webRef object
 * @param {Object} order DW Order
 * @returns {Object} returns request object
 */
function createRequest(profile, webReference, order) {
    return {
        UPSSecurity: createUPSSecurityHeader(profile, webReference),
        ShipmentRequest: createUPSShipmentProcessRequest(profile, webReference, order)
    };
}

/**
 * Parse service response
 * @param {Object} response service response
 * @returns {Object} returns parse of response
 */
function parseResponse(response) {
    if (!response || !response.getShipmentResults() || !response.getShipmentResults().getPackageResults()) return null;
    return {
        status: 'OK',
        shipLabel: response.getShipmentResults().getPackageResults()[0].getShippingLabel().getGraphicImage(),
        trackingNumber: response.getShipmentResults().getPackageResults()[0].getTrackingNumber()
    };
}

/**
 * Get Mock response
 * @returns {Object} returns mock response object
 */
function mockResponse() {
    return {
        status: 'OK',
        shipLabel: '',
        trackingNumber: '1ZW924X29192788004'
    };
}

module.exports = {
    createRequest: createRequest,
    parseResponse: parseResponse,
    mockResponse: mockResponse
};
