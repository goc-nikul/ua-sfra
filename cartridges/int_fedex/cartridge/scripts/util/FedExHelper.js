/**
 * Provides FedEx functions
 */

var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');

// FedEx Helper
var FedExHelper = function () {
    var self = this;
    this.createFedExShipmentProcessRequest = function (svc, profile, webRef, order, rmaNumber) {
        var isOrder = order instanceof require('dw/order/Order');
        var countryCode = (isOrder && !empty(order.defaultShipment.shippingAddress.countryCode.value)) ? order.defaultShipment.shippingAddress.countryCode.value.toLowerCase() : (!empty(order.shippingAddress) && !empty(order.shippingAddress.countryCode)) ? order.shippingAddress.countryCode.toLowerCase() : 'us';
        var stateCode = (isOrder && !empty(order.defaultShipment.shippingAddress.stateCode)) ? order.defaultShipment.shippingAddress.stateCode : (!empty(order.shippingAddress) && !empty(order.shippingAddress.stateCode)) ? order.shippingAddress.stateCode : null;
        var smartPostEligibleStateCodes = Site.getCurrent().getCustomPreferenceValue('smartPostEligibleStateCodes');
        var FedExHelperCountry = self.getHelper(countryCode);
        var warehouseAddress = self.getWarehouseAddress();
        var profileData = self.getServiceConfig(profile);

        // Request
        var shipRequest = new webRef.ProcessShipmentRequest();

        // WebAuthenticationDetail
        var webAuthenticationDetail = new webRef.WebAuthenticationDetail();
        var webAuthenticationCredential = new webRef.WebAuthenticationCredential();

        webAuthenticationCredential.setKey(profileData.key);
        webAuthenticationCredential.setPassword(profileData.password);
        webAuthenticationDetail.setUserCredential(webAuthenticationCredential);
        shipRequest.setWebAuthenticationDetail(webAuthenticationDetail);

        // ClientDetail
        var clientDetail = new webRef.ClientDetail();
        clientDetail.setAccountNumber(profileData.accountNumber);
        clientDetail.setMeterNumber(profileData.meterNumber);
        shipRequest.setClientDetail(clientDetail);

        // TransactionDetail
        var transactionDetail = new webRef.TransactionDetail();
        transactionDetail.setCustomerTransactionId(profileData.customerTransactionId);
        shipRequest.setTransactionDetail(transactionDetail);

        // Version
        var versionId = new webRef.VersionId();
        versionId.setServiceId('ship');
        versionId.setMajor(17);
        versionId.setIntermediate(0);
        versionId.setMinor(0);
        shipRequest.setVersion(versionId);

        // RequestedShipment
        var requestedShipment = new webRef.RequestedShipment();

        // ShipTimestamp
        var shipTimestamp = self.getShipTimestamp();
        requestedShipment.setShipTimestamp(shipTimestamp);

        // dropOffType

        var dropOffType = webRef.DropoffType[profileData.dropoffType];
        requestedShipment.setDropoffType(dropOffType);

        // ServiceType
        var serviceType;
        if (!empty(smartPostEligibleStateCodes) && !empty(stateCode) && smartPostEligibleStateCodes.indexOf(stateCode) > -1) {
            serviceType = webRef.ServiceType.SMART_POST;
        } else {
            serviceType = webRef.ServiceType[profileData.serviceType];
        }
        requestedShipment.setServiceType(serviceType);

        // PackagingType
        var packagingType = webRef.PackagingType[profileData.packagingType];
        requestedShipment.setPackagingType(packagingType);

        // TotalWeight
        var totalWeight = new webRef.Weight();
        totalWeight.setUnits(webRef.WeightUnits[profileData.weightUnits]);
        totalWeight.setValue(parseInt(profileData.weightValue, 10));
        requestedShipment.setTotalWeight(totalWeight);

        // Shipper
        var shipper = new webRef.Party();

        // Address
        var address = new webRef.Address();
        var orderAddressMap = Site.getCurrent().getCustomPreferenceValue('returnFromAddress') && isOrder ? self.getReturnFromAddress() : FedExHelperCountry.getAddressMapFromOrder(order);
        var orderAddressList = !empty(orderAddressMap.address2) ? [orderAddressMap.address1, orderAddressMap.address2] : [orderAddressMap.address1];
        orderAddressList.forEach(function (orderAddress) {
            address.getStreetLines().add(orderAddress);
        });

        address.setCity(orderAddressMap.city);
        address.setStateOrProvinceCode(orderAddressMap.stateCode);
        address.setPostalCode(self.getAdjustedPostalCode(orderAddressMap.postalCode));
        address.setCountryCode(orderAddressMap.countryCode);
        shipper.setAddress(address);

        requestedShipment.setShipper(shipper);

        // Contact
        var contact = new webRef.Contact();
        contact.setPersonName(orderAddressMap.name);
        contact.setPhoneNumber(orderAddressMap.phone);
        contact.setEMailAddress(isOrder ? order.getCustomerEmail() : order.email);
        shipper.setContact(contact);

        // Recipient
        var recipient = new webRef.Party();
        recipient.setAccountNumber(profileData.accountNumber);

        // Contact
        contact = new webRef.Contact();
        contact.setPhoneNumber(warehouseAddress.phone);
        contact.setCompanyName(warehouseAddress.name);
        recipient.setContact(contact);

        // Address
        address = new webRef.Address();
        var warehouseAddresses = !empty(warehouseAddress.address2) ? [warehouseAddress.address, warehouseAddress.address2] : [warehouseAddress.address];
        warehouseAddresses.forEach(function (addressItem) {
            address.getStreetLines().add(addressItem);
        });

        address.setCity(warehouseAddress.city);
        address.setStateOrProvinceCode(warehouseAddress.stateCode ? warehouseAddress.stateCode : '');
        address.setPostalCode(self.getAdjustedPostalCode(warehouseAddress.postalCode));
        address.setCountryCode(warehouseAddress.countryCode);
        recipient.setAddress(address);
        requestedShipment.setRecipient(recipient);

        // ShippingChargesPayment
        var shippingChargesPayment = new webRef.Payment();
        shippingChargesPayment.setPaymentType(webRef.PaymentType[profileData.paymentType]);

        var payor = new webRef.Payor();

        var responsibleParty = new webRef.Party();
        responsibleParty.setAccountNumber(profileData.accountNumber);

        // Contact
        contact = new webRef.Contact();

        contact.setPhoneNumber(warehouseAddress.phone);
        contact.setCompanyName(warehouseAddress.name);

        responsibleParty.setContact(contact);

        // Address
        address = new webRef.Address();
        warehouseAddresses.forEach(function (addressItem) {
            address.getStreetLines().add(addressItem);
        });
        address.setCity(warehouseAddress.city);
        address.setStateOrProvinceCode(warehouseAddress.stateCode ? warehouseAddress.stateCode : '');
        address.setPostalCode(self.getAdjustedPostalCode(warehouseAddress.postalCode));
        address.setCountryCode(warehouseAddress.countryCode);
        responsibleParty.setAddress(address);
        payor.setResponsibleParty(responsibleParty);
        shippingChargesPayment.setPayor(payor);
        requestedShipment.setShippingChargesPayment(shippingChargesPayment);

        // SpecialServiceTypes
        var specialServicesRequested = new webRef.ShipmentSpecialServicesRequested();
        Array(webRef.ShipmentSpecialServiceType[profileData.specialServiceTypes]).forEach(function (specServiceType) {
            specialServicesRequested.getSpecialServiceTypes().add(specServiceType);
        });

        var returnShipmentDetail = new webRef.ReturnShipmentDetail();
        returnShipmentDetail.setReturnType(webRef.ReturnType[profileData.returnType]);
        specialServicesRequested.setReturnShipmentDetail(returnShipmentDetail);
        requestedShipment.setSpecialServicesRequested(specialServicesRequested);

        if (('indicia' in profileData) && !empty(profileData.indicia) && ('hubId' in profileData) && !empty(profileData.hubId)) {
            // SmartPostDetail
            var smartPostDetail = new webRef.SmartPostShipmentDetail();
            var indicia = webRef.SmartPostIndiciaType[profileData.indicia];
            smartPostDetail.setIndicia(indicia);
            smartPostDetail.setHubId(profileData.hubId);
            requestedShipment.setSmartPostDetail(smartPostDetail);
        }

        // LabelSpecification
        var labelSpecification = new webRef.LabelSpecification();
        var labelFormatType = webRef.LabelFormatType[profileData.labelFormatType];
        labelSpecification.setLabelFormatType(labelFormatType);
        var setImageType = webRef.ShippingDocumentImageType[profileData.imageType];
        labelSpecification.setImageType(setImageType);

        var customerSpecifiedDetail = new webRef.CustomerSpecifiedLabelDetail();
        var termsAndConditionsLocalization = new webRef.Localization();
        termsAndConditionsLocalization.setLanguageCode(profileData.languageCode);
        termsAndConditionsLocalization.setLocaleCode(profileData.localeCode);
        customerSpecifiedDetail.setTermsAndConditionsLocalization(termsAndConditionsLocalization);
        labelSpecification.setCustomerSpecifiedDetail(customerSpecifiedDetail);
        requestedShipment.setLabelSpecification(labelSpecification);

        var rateRequestType = webRef.RateRequestType[profileData.rateRequestTypes];
        Array(rateRequestType).forEach(function (item) {
            requestedShipment.getRateRequestTypes().add(item);
        });

        requestedShipment.setPackageCount(Number(profileData.packageCount));

        var requestedPackageLineItem = new webRef.RequestedPackageLineItem();
        requestedPackageLineItem.setSequenceNumber(profileData.sequenceNumber);
        var weight = new webRef.Weight();
        weight.setUnits(webRef.WeightUnits[profileData.weightUnits]);
        weight.setValue(parseInt(profileData.weightValue, 10));
        requestedPackageLineItem.setWeight(weight);

        var customerReference = new webRef.CustomerReference();
        customerReference.setCustomerReferenceType(webRef.CustomerReferenceType['RMA_ASSOCIATION']); // eslint-disable-line dot-notation
        customerReference.setValue(rmaNumber);
        requestedPackageLineItem.getCustomerReferences().add(customerReference);
        if (order.orderNo) {
            var customerReference2 = new webRef.CustomerReference();
            customerReference2.setCustomerReferenceType(webRef.CustomerReferenceType['P_O_NUMBER']); // eslint-disable-line dot-notation
            customerReference2.setValue(order.orderNo);
            requestedPackageLineItem.getCustomerReferences().add(customerReference2);
        }
        Array(requestedPackageLineItem).forEach(function (item) {
            requestedShipment.getRequestedPackageLineItems().add(item);
        });
        shipRequest.setRequestedShipment(requestedShipment);

        return shipRequest;
    };

    this.parseFedExShipmentProcessResponse = function (svc, response) {
        var authorizedReturnObj = {};
        var shipmentDetailObj = response.getCompletedShipmentDetail() && response.getCompletedShipmentDetail();
        var shipLabel = null;
        var trackingNumber = null;
        var labelType = null;
        try {
            var packageDetails = shipmentDetailObj && shipmentDetailObj.getCompletedPackageDetails().size() > 0
                ? shipmentDetailObj.getCompletedPackageDetails().get(0)
                : null;
            shipLabel = packageDetails.getLabel().getParts().get(0).getImage();
            trackingNumber = packageDetails.getTrackingIds().get(0).getTrackingNumber();
            labelType = packageDetails.getLabel().getImageType().value();
        } catch (error) {
            Logger.error('Error parsing FEDEX Shipment Response. Error: {0}', error.message);
            shipLabel = null;
            trackingNumber = null;
            labelType = null;
        }
        if (shipLabel && trackingNumber) {
            authorizedReturnObj = {
                status: 'OK',
                shipLabel: shipLabel, // eslint-disable-line newline-per-chained-call
                trackingNumber: trackingNumber,
                carrierCode: shipmentDetailObj.carrierCode ? shipmentDetailObj.carrierCode.value() : '',
                labelType: labelType
            };
        } else {
            authorizedReturnObj = {
                errorDescription: response.notifications[0].message
            };
        }
        return authorizedReturnObj;
    };
    /* eslint-disable spellcheck/spell-checker */
    this.getMockedFedExShipmentProcessResponse = function () {
        return {
            status: 'OK',
            shipLabel: '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',
            trackingNumber: '795492173282'
        };
    };
    /* eslint-enable spellcheck/spell-checker */
    this.getWarehouseAddress = function () {
        var warehouseAddress;
        try {
            warehouseAddress = JSON.parse(Site.getCurrent().getCustomPreferenceValue('returnAddress'));
        } catch (e) {
            Logger.error('FedExHelper.js: Can not parse JSON config from Return Address from site preferences: ' + e.message);
        }

        return warehouseAddress || {};
    };
    this.getReturnFromAddress = function () {
        var returnFromAddress;
        try {
            returnFromAddress = JSON.parse(Site.getCurrent().getCustomPreferenceValue('returnFromAddress'));
        } catch (e) {
            Logger.error('FedExHelper.js: Can not parse JSON config from Return From Address from site preferences: ' + e.message);
        }
        return returnFromAddress || {};
    };
    this.getAdjustedPostalCode = function (postalCode) {
        return !empty(postalCode) ? postalCode.replace(' ', '') : '';
    };

    /**
     * Get service config
     * @param {profile} profile - ServiceProfile
     * @returns {Object} service profile configuration custom data
     */
    this.getServiceConfig = function (profile) {
        var data = {};
        try {
            data = JSON.parse(profile.custom.data);
        } catch (e) {
            Logger.error('FedExHelper.ds: Can not parse JSON config from Service: ' + e.message);
        }
        return data;
    };

    this.getHelper = function (countryCode) {
        var defaultHelper = Resource.msg('default.helper', 'fedex', '');
        var FedExHelperCountry;
        try {
            FedExHelperCountry = require(Resource.msg(countryCode.toLowerCase() + '.helper', 'fedex', defaultHelper));
        } catch (e) {
            FedExHelperCountry = require(defaultHelper);
        }
        return FedExHelperCountry;
    };

    this.getShipTimestamp = function () {
        var shipTimestamp = new Calendar();
        // reset hour, minutes, seconds and milliseconds
        shipTimestamp.set(Calendar.HOUR_OF_DAY, 0);
        shipTimestamp.set(Calendar.MINUTE, 0);
        shipTimestamp.set(Calendar.SECOND, 0);
        shipTimestamp.set(Calendar.MILLISECOND, 0);

        // next day
        shipTimestamp.add(Calendar.DAY_OF_MONTH, 1);

        return shipTimestamp;
    };

    this.getAddressObject = function (formObj) {
        return {
            address1: formObj.address1.value,
            address2: formObj.address2.value,
            city: formObj.city.value,
            postalCode: formObj.zip.value,
            firstname: formObj.firstname.value,
            lastname: formObj.lastname.value,
            fullName: formObj.firstname.value + ' ' + formObj.lastname.value,
            phone: formObj.phone.value,
            email: formObj.email.value,
            stateCode: formObj.states.stateUS.value,
            orderNo: formObj.returnlabel.transactionId.value
        };
    };
};

module.exports = FedExHelper;
