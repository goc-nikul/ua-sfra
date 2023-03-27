'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class UPSSecurity {
    setServiceAccessToken() {}
    setUsernameToken() {}
    setServiceAccessToken() {}
    setUsernameToken() {}
}

class ObjectFactory {
    createUPSSecurityUsernameToken() {
        return {
            setUsername: () => '',
            setPassword: () => ''
        };
    }
    createUPSSecurityServiceAccessToken() {
        return {
            setAccessLicenseNumber: () => true
        };
    }
}
class RequestType {
    constructor() {
        this.requestOption = {
            add() {
                return true;
            }
        };
    }
}
class ShipmentRequest {
    setRequest() {}
    setLabelSpecification() {}
    setShipment() {}
}

class ShipmentType {
    constructor() {
        this.package = {
            add: () => true
        };
        this.referenceNumber = {
            add: () => true
        };
    }
    setReturnService() {}
    setShipper() {}
    setShipFrom() {}
    setShipTo() {}
    setShipmentRatingOptions() {}
    setService() {}
    setPaymentInformation() {}
}

class ReturnServiceType {
    setCode() {}
}

class RateInfoType {
    setNegotiatedRatesIndicator() {}
}

class ServiceType {
    setCode() {}
    setDescription() {}
}

class ShipperType {
    setName() {}
    setAttentionName() {}
    setShipperNumber() {}
    setAddress() {}
    setPhone() {}
    setShipFrom() {}
    setShipTo() {}
}

class ShipPhoneType {
    setNumber() {}
}

class ShipAddressType {
    constructor() {
        this.addressLine = {
            add: () => true
        };
    }
    setCity() {}
    setPostalCode() {}
    setCountryCode() {}
}

class ShipFromType {
    setName() {}
    setAttentionName() {}
    setPhone() {}
    setAddress() {}
}

class ShipToType {
    setName() {}
    setAttentionName() {}
    setPhone() {}
    setAddress() {}
}

class ShipToAddressType {
    constructor() {
        this.addressLine = {
            add: () => true
        };
    }
    setCity() {}
    setPostalCode() {}
    setCountryCode() {}
}

class PackageType {
    setPackaging() {}
    setDescription() {}
    setPackageWeight() {}
}

class PackagingType {
    setCode() {}
    setPackageWeight() {}
}

class PackageWeightType {
    setWeight() {}
    setUnitOfMeasurement() {}
}

class ShipUnitOfMeasurementType {
    setCode() {}
    setUnitOfMeasurement() {}
    setPackageWeight() {}
}

class ReferenceNumberType {
    setValue() {}
}

class PaymentInfoType {
    constructor() {
        this.shipmentCharge = {
            add: () => true
        };
    }
}

class ShipmentChargeType {
    setType() {}
    setBillShipper() {}
}

class BillShipperType {
    setAccountNumber() {}
}

class LabelSpecificationType {
    setLabelImageFormat() {}
    setHTTPUserAgent() {}
}

class LabelImageFormatType {
    setCode() {}
    setDescription() {}
}

describe('int_ups/cartridge/scripts/helpers/shipmentShip.js', () => {
    var upaPrefs = {
        US: {
            returnAddress: 'returnAddress',
            returnShipperAddress: 'returnShipperAddress',
            returnFromAddress: {
                address2: 'address2'
            }
        }
    };

    var shipmentShip = proxyquire('../../../../../cartridges/int_ups/cartridge/scripts/helpers/shipmentShip.js', {
        'dw/util/Locale': {
            getLocale: () => {
                return {
                    getCountry: () => 'US'
                };
            }
        },
        '*/cartridge/configs/upsPrefs': {
            countryOverride: JSON.stringify(upaPrefs),
            showOrderReference: 'US'
        }
    });

    var webref = {
        UPSSecurity: UPSSecurity,
        ObjectFactory: ObjectFactory,
        RequestType: RequestType,
        ShipmentRequest: ShipmentRequest,
        ShipmentType: ShipmentType,
        ReturnServiceType: ReturnServiceType,
        RateInfoType: RateInfoType,
        ServiceType: ServiceType,
        ShipperType: ShipperType,
        ShipPhoneType: ShipPhoneType,
        ShipAddressType: ShipAddressType,
        ShipFromType: ShipFromType,
        ShipToType: ShipToType,
        ShipToAddressType: ShipToAddressType,
        PackageType: PackageType,
        PackagingType: PackagingType,
        PackageWeightType: PackageWeightType,
        ShipUnitOfMeasurementType: ShipUnitOfMeasurementType,
        ReferenceNumberType: ReferenceNumberType,
        PaymentInfoType: PaymentInfoType,
        ShipmentChargeType: ShipmentChargeType,
        BillShipperType: BillShipperType,
        LabelSpecificationType: LabelSpecificationType,
        LabelImageFormatType: LabelImageFormatType
    };

    it('Testing method: createRequest', function () {
        var profile = {
            custom: {
                data: JSON.stringify({
                    shippingService: {
                        US: {
                            shippingServiceDescription: 'service',
                            shippingServiceCode: 'code'
                        }
                    }
                })
            }
        };
        global.request = {
            locale: 'US'
        };
        global.empty = (params) => !params;
        var Order = require('../../../../mocks/dw/dw_order_Order');
        var order = new Order();
        assert.doesNotThrow(() => shipmentShip.createRequest(profile, webref, order));
    });

    it('Testing method: parseResponse', () => {
        assert.isNull(shipmentShip.parseResponse(null));
        var response = {
            getShipmentResults: () => {
                return {
                    getPackageResults: () => {
                        return [{
                            getShippingLabel: () => {
                                return {
                                    getGraphicImage: () => 'GraphicImage'
                                };
                            },
                            getTrackingNumber: () => '1245'
                        }];
                    }
                };
            }
        };
        var result = shipmentShip.parseResponse(response);
        assert.isNotNull(result);
        assert.equal(result.status, 'OK');
        assert.equal(result.shipLabel, 'GraphicImage');
        assert.equal(result.trackingNumber, '1245');
    });

    it('Testing method: mockResponse', () => {
        assert.deepEqual(shipmentShip.mockResponse(), {
            status: 'OK',
            shipLabel: '',
            trackingNumber: '1ZW924X29192788004'
        });
    });
});
