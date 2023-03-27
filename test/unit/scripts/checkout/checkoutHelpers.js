'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
var Order = require('../../../mocks/dw/dw_order_Order');
const eGiftCard = 'EGIFT_CARD';
var ArrayList = require('../../../mocks/scripts/util/dw.util.Collection');
var giftCardHelper = require('../../../../test/mocks/scripts/giftcard/giftcardHelper').giftCardHelper;
var Money = require('../../../mocks/dw/dw_value_Money');

global.empty = (data) => {
    return !data;
};

function getEgiftCardOrder() {
    var order = new Order();
    var lineItem1 = order.createProductLineItem({
        custom: {
            sku: '1330767-408-8',
            giftCard: {
                value: eGiftCard
            }
        },
        ID: '883814258849',
        name: 'test'
    }, order.getDefaultShipment());
    var lineItem2 = order.createProductLineItem({
        custom: {
            sku: '1330767-408-8',
            giftCard: {
                value: eGiftCard
            }
        },
        ID: '883814258849',
        name: 'test'
    }, order.getDefaultShipment());

    var productId = '883814258849';
    var uuid = 'ca155038d934befcd30f532e92';
    var eGiftCardFormData = {
        'gcRecipientName': 'Amogh Medegar',
        'gcRecipientEmail': 'amedhegar@pfsweb.com',
        'gcFrom': 'Yesh',
        'gcAmount': 100,
        'gcDeliveryDate': '2020-05-05',
        'gcMessage': 'Happy new year'
    };

    var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
    var BasketMgrObj = new BasketMgr();
    BasketMgr.setCurrentBasket(order);
    giftCardHelper.updateEGiftCardData(productId, uuid, JSON.stringify(eGiftCardFormData));
    return order;
}

describe('app_ua_core/cartridge/scripts/checkout/checkoutHelpers test', () => {
    let checkoutHelpers = require('../../../mocks/scripts/checkout/checkoutHelpers', );

    it('Testing method: calculateNonGiftCertificateAmount', () => {
        var PaymentInstrument = require('../../../mocks/dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument('testID', new Money(10));
        var paymentInstruments = [paymentInstrument];
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('GIFT_CARD', new Money(10));
        let result = checkoutHelpers.calculateNonGiftCertificateAmount(lineItemCtnr);
        assert.equal(90, result.value, 'order total is 100, and GC is 10, so we check if NonGiftCertificateAmount is calculated');
    });

    xit('Testing method: handlePayments', () => {
    	var order = new Order();
    	order.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
            },
            ID: '883814258849',
            name: 'test'
        }, order.getDefaultShipment());
    	order.createPaymentInstrument('Paymetric', new Money(10));
        let result = checkoutHelpers.handlePayments(order, '1234567890');
        assert.equal(result.error !== true , true);
    });
	    it('Testing method: copyShippingAddressToShipment', () => {
        var CustomerAddress = require('../../../mocks/dw/dw_customer_CustomerAddress');
        var shippingData = {
            address: new CustomerAddress()
        }
        shippingData.address.states = {
            stateCode: 'CA'
        };
        shippingData.address.country = 'US';
        var shipping = {
            shippingAddress: {
                setAddress1: function (o) {
                    shipping.shippingAddress.address1 = o;
                },
                setAddress2: function (o) {
                    shipping.shippingAddress.address2 = o;
                },
                setCity: function (o) {
                    shipping.shippingAddress.city = o;
                },
                setFirstName: function (o) {
                    shipping.shippingAddress.firstName = o;
                },
                setLastName: function (o) {
                    shipping.shippingAddress.lastName = o;
                },
                setPhone: function (o) {
                   shipping.shippingAddress.phone = o;
                },
                setPostalCode: function (o) {
                    shipping.shippingAddress.postalCode = o;
                },
                setStateCode: function (o) {
                    shipping.shippingAddress.stateCode = o;
                },
                setCountryCode: function (o) {
                    shipping.shippingAddress.countryCode = o;
                }
            }
        };
        let result = checkoutHelpers.copyShippingAddressToShipment(shippingData, shipping);
        assert.equal(shipping.shippingAddress.address1, shippingData.address.address1);
    });

    it('Testing method: setGift', () => {
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        var giftMessage = 'some message';
        var giftItems = '[{ "pid":"883814258849" }]';
        var shipping = basket.defaultShipment;

        let result = checkoutHelpers.setGift(shipping, true, giftMessage, giftItems);
        assert.equal(result.error, false);
    });

    it('Testing method: getEligiblePaymentMethods', () => {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem('883814258849', lineItemCtnr.getDefaultShipment());
        lineItemCtnr.getAllProductLineItems = function() {
            return lineItemCtnr.productLineItems;
        };
        var giftCardFormData = {
            gcResults: {
                isOrderTotalRedeemed: true,
                gcPaymentInstruments: []
            },
            giftCardsLimitExceeded: false
        }
        var vipPoints = {
            pointsApplied: true
        };
        var Customer = require('../../../../test/mocks/dw/dw_customer_Customer');
        var currentCustomer = new Customer();

        let result = checkoutHelpers.getEligiblePaymentMethods(lineItemCtnr, giftCardFormData, vipPoints, currentCustomer);
        assert.equal(result.creditCard, false);
    });

    it('Testing method: updateShipToAsDefaultShipment', () => {
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);

        var req = {
                session: {
                    privacyCache: {
                        get: function() {
                            return '';
                        },
                        set: function() {
                            return '';
                        }
                    }
                }
        };
        let result = checkoutHelpers.updateShipToAsDefaultShipment(req);
        assert.equal(BasketMgr.getCurrentBasket().defaultShipment.custom.shipmentType, 'someType');

        basket.defaultShipment.custom.shipmentType = 'instore';
        basket.createShipment('BOPIS');
        result = checkoutHelpers.updateShipToAsDefaultShipment(req);
        assert.isUndefined(BasketMgr.getCurrentBasket().defaultShipment.custom.shipmentType);
    });

    xit('Testing method: validatePaymentCards', () => {
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        basket.createPaymentInstrument('Paymetric', new Money(30));;

        var Customer = require('../../../../test/mocks/dw/dw_customer_Customer');
        var currentCustomer = new Customer();
        let result = checkoutHelpers.validatePaymentCards(basket, 'US', currentCustomer);
        assert.equal(result.error, false);
    });

    it('Testing method: containsAtleastOneLocaleAddress', () => {
        var CustomerAddress = require('../../../mocks/dw/dw_customer_CustomerAddress');

        var Customer = require('../../../../test/mocks/dw/dw_customer_Customer');
        var currentCustomer = new Customer();
        let result = checkoutHelpers.containsAtleastOneLocaleAddress('US', [new CustomerAddress()]);
        assert.equal(result, true);
    });

    it('Testing method: ensureValidAddressType', () => {
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);

        var Customer = require('../../../../test/mocks/dw/dw_customer_Customer');
        var currentCustomer = new Customer();
        let result = checkoutHelpers.ensureValidAddressType(basket);
        assert.equal(result, true);
    });

    it('Testing method: placeOrder', () => {
        var order = new Order();

        let result = checkoutHelpers.placeOrder(order);
        assert.equal(false, result.error, 'no errors during operation');
        assert.equal(order.status.value, Order.ORDER_STATUS_NEW, 'order status updated');
    });

    it('Testing method: failOrder', () => {
        // Case: Created order
        var order = new Order();
        let result = checkoutHelpers.failOrder(order);

        assert.equal(false, result.error, 'no errors during operation');
        assert.equal(order.status.value, Order.ORDER_STATUS_FAILED, 'order status updated');

        // Case: Placed order
        order = new Order();
        order.status = { value: Order.ORDER_STATUS_OPEN };
        result = checkoutHelpers.failOrder(order);

        assert.equal(false, result.error, 'no errors during operation');
        assert.equal(order.status.value, Order.ORDER_STATUS_CANCELLED, 'order status updated');
    });

    it('Testing method: sendConfirmationEmail', () => {
        var order = new Order();
        var spy = checkoutHelpers.getSpy();
        checkoutHelpers.sendConfirmationEmail(order);
        assert.equal(true, spy.called);
        assert.equal(4, spy.data.emailData.type);
    });

    it('Testing method: generateGiftCardNumbers', () => {
        var order = getEgiftCardOrder();
        var giftCardLineItems = order.getAllProductLineItems().toArray();
        var expectedStr = '[{"purchaserName":"Yesh","recipientName":"Amogh Medegar","personalMessage":"Happy new year","cardAmount":100,"deliveryDate":"Tue May 05 2020","emailAddress":"amedhegar@pfsweb.com","orderNumber":"1234567890"},{"purchaserName":"Yesh","recipientName":"Amogh Medegar","personalMessage":"Happy new year","cardAmount":100,"deliveryDate":"Tue May 05 2020","emailAddress":"amedhegar@pfsweb.com","orderNumber":"1234567890"}]';
        var expected = JSON.parse(expectedStr);
        var giftCardsResult = checkoutHelpers.generateGiftCardNumbers(order, giftCardLineItems);
        assert.deepEqual(giftCardsResult.eGiftCardsDetails, expected);
    });

    it('Testing method: sendEGiftCardsEmail', () => {
        var order = new Order();
        // var giftCardLineItems = order.getAllProductLineItems().toArray();
        // var giftCardsResult = checkoutHelpers.generateGiftCardNumbers(order, giftCardLineItems);
        var spy = checkoutHelpers.getSpy();
        spy.called = false;
        checkoutHelpers.sendEGiftCardsEmail(order, {});
        assert.equal(true, spy.called);
        assert.equal(9, spy.data.emailData.type);
    });
    
    it('Testing method: sendFraudNotificationEmail', () => {
        var order = new Order();
        var spy = checkoutHelpers.getSpy();
        spy.called = false;
        checkoutHelpers.sendFraudNotificationEmail(order);
        assert.equal(true, spy.called);
        assert.equal(7, spy.data.emailData.type);
    });

    it('Testing method: handleHoldStatus', () => {
        var order = new Order();
        order.setExportStatus(Order.EXPORT_STATUS_EXPORTED);

        checkoutHelpers.handleHoldStatus(order, true, 'message');
        assert.equal(true, order.custom.onHold);
        assert.equal(true, order.custom.updates.includes('message'));
    });

    it('Testing method: setExportedStatus', () => {
        var order = new Order();
        checkoutHelpers.setExportedStatus(order);
        assert.equal(Order.EXPORT_STATUS_READY, order.exportStatus.value);
    });

    it('Testing method: ensureValidShipments', function() {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        var result = checkoutHelpers.ensureValidShipments(lineItemCtnr);
        assert.equal(true, result);

        lineItemCtnr.getShipments().get(0).shippingAddress = null;
        result = checkoutHelpers.ensureValidShipments(lineItemCtnr);
        assert.equal(false, result);
    });

    it('Testing method: calculatePaymentTransaction', function() {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('GIFT_CARD', new Money(30));
        var result = checkoutHelpers.calculatePaymentTransaction(lineItemCtnr);
        assert.equal(false, result.error);
    });

    it('Testing method: copyBillingAddressToShippingAddress', function() {
        var lineItemCtnr = new LineItemCtnr();
        var billingAddress = Object.assign({}, lineItemCtnr.getShipments().get(0).shippingAddress);
        billingAddress.address1 = '505 Millenium dr',
        billingAddress.city = 'Allen';
        billingAddress.stateCode = 'TX';
        checkoutHelpers.copyBillingAddressToShippingAddress(billingAddress, lineItemCtnr);
        assert.deepEqual(billingAddress, lineItemCtnr.getShipments().get(0).shippingAddress);
    });

    it('Testing method: isPaymentAmountMatches', function() {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('Paymetric', new Money(30));
        var result = checkoutHelpers.isPaymentAmountMatches(lineItemCtnr);
        assert.deepEqual(false, result);

        lineItemCtnr.createPaymentInstrument('GIFT_CARD', new Money(70));
        result = checkoutHelpers.isPaymentAmountMatches(lineItemCtnr);
        assert.deepEqual(true, result);
    });
    it('Testing method: saveInstorePickUpContacts', function() {
        var form = {
            personFirstName : {value: 'John'},
            personLastName : {value: 'Doe'},
            personPhone : {value: '9234567890'},
            personEmail : {value: 'test@gmail.com'}
        }
        var lineItemCtnr = new LineItemCtnr();
        var  productLineItem = lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        var pickUpContactData = {
            firstName: 'John',
            lastName: 'Doe',
            phone: '9234567890',
            email: 'test@gmail.com'
        }
        var result = checkoutHelpers.saveInstorePickUpContacts(productLineItem, form, 'primary')
        assert.deepEqual(pickUpContactData, result);
        assert.deepEqual(pickUpContactData, JSON.parse(productLineItem.custom.primaryContactBOPIS));
        
        result = checkoutHelpers.saveInstorePickUpContacts(productLineItem, form, '');
        assert.equal(true, empty(productLineItem.custom.primaryContactBOPIS));
        var result = checkoutHelpers.saveInstorePickUpContacts(productLineItem, form, 'secondary')
    });
    

    // SFRA test case 
    describe('copyShippingAddressToShipment', function() {
        var shippingData = {
            address: {
                firstName: 'James',
                lastName: 'Bond',
                address1: '10 Oxford St',
                address2: 'suite 20',
                city: 'London',
                postalCode: '02345',
                countryCode: 'uk',
                phone: '603-333-1212',
                stateCode: 'NH'
            },
            shippingMethod: '002'
        };

        it('should copy information from the shipping form to shipment address for non-null shipment', function() {
            var shipment = {
                shippingAddress: {
                    firstName: 'David',
                    lastName: 'Johnson',
                    address1: '25 Quincy Rd.',
                    address2: '',
                    city: 'Boston',
                    postalCode: '01234',
                    countryCode: {
                        value: 'us'
                    },
                    phone: '617-777-1010',
                    stateCode: 'MA',

                    setFirstName: function(firstNameInput) {
                        this.firstName = firstNameInput;
                    },
                    setLastName: function(lastNameInput) {
                        this.lastName = lastNameInput;
                    },
                    setAddress1: function(address1Input) {
                        this.address1 = address1Input;
                    },
                    setAddress2: function(address2Input) {
                        this.address2 = address2Input;
                    },
                    setCity: function(cityInput) {
                        this.city = cityInput;
                    },
                    setPostalCode: function(postalCodeInput) {
                        this.postalCode = postalCodeInput;
                    },
                    setStateCode: function(stateCodeInput) {
                        this.stateCode = stateCodeInput;
                    },
                    setCountryCode: function(countryCodeInput) {
                        this.countryCode.value = countryCodeInput;
                    },
                    setPhone: function(phoneInput) {
                        this.phone = phoneInput;
                    }
                },
                selectedShippingMethod: {},
                setShippingMethod: function(shippingMethod) {
                    this.selectedShippingMethod = shippingMethod;
                }
            };

            checkoutHelpers.copyShippingAddressToShipment(shippingData, shipment);

            assert.equal(shipment.shippingAddress.firstName, shippingData.address.firstName);
            assert.equal(shipment.shippingAddress.lastName, shippingData.address.lastName);
            assert.equal(shipment.shippingAddress.address1, shippingData.address.address1);
            assert.equal(shipment.shippingAddress.address2, shippingData.address.address2);
            assert.equal(shipment.shippingAddress.city, shippingData.address.city);
            assert.equal(shipment.shippingAddress.postalCode, shippingData.address.postalCode);
            assert.equal(shipment.shippingAddress.countryCode.value, shippingData.address.countryCode);
            assert.equal(shipment.shippingAddress.phone, shippingData.address.phone);
            assert.equal(shipment.shippingAddress.stateCode, shippingData.address.stateCode);
        });

        it('should create shipment address and copy information from the shipping form to shipment address if shipment address is null', function() {
            var shipment = {
                shippingAddress: null,
                selectedShippingMethod: {},
                setShippingMethod: function(shippingMethod) {
                    this.selectedShippingMethod = shippingMethod;
                },
                createShippingAddress: function() {
                    this.shippingAddress = {
                        firstName: '',
                        lastName: '',
                        address1: '',
                        address2: '',
                        city: '',
                        postalCode: '',
                        countryCode: {
                            value: ''
                        },
                        phone: '',
                        stateCode: '',

                        setFirstName: function(firstNameInput) {
                            this.firstName = firstNameInput;
                        },
                        setLastName: function(lastNameInput) {
                            this.lastName = lastNameInput;
                        },
                        setAddress1: function(address1Input) {
                            this.address1 = address1Input;
                        },
                        setAddress2: function(address2Input) {
                            this.address2 = address2Input;
                        },
                        setCity: function(cityInput) {
                            this.city = cityInput;
                        },
                        setPostalCode: function(postalCodeInput) {
                            this.postalCode = postalCodeInput;
                        },
                        setStateCode: function(stateCodeInput) {
                            this.stateCode = stateCodeInput;
                        },
                        setCountryCode: function(countryCodeInput) {
                            this.countryCode.value = countryCodeInput;
                        },
                        setPhone: function(phoneInput) {
                            this.phone = phoneInput;
                        }
                    };
                    return this.shippingAddress;
                }
            };

            checkoutHelpers.copyShippingAddressToShipment(shippingData, shipment);

            assert.equal(shipment.shippingAddress.firstName, shippingData.address.firstName);
            assert.equal(shipment.shippingAddress.lastName, shippingData.address.lastName);
            assert.equal(shipment.shippingAddress.address1, shippingData.address.address1);
            assert.equal(shipment.shippingAddress.address2, shippingData.address.address2);
            assert.equal(shipment.shippingAddress.city, shippingData.address.city);
            assert.equal(shipment.shippingAddress.postalCode, shippingData.address.postalCode);
            assert.equal(shipment.shippingAddress.countryCode.value, shippingData.address.countryCode);
            assert.equal(shipment.shippingAddress.phone, shippingData.address.phone);
            assert.equal(shipment.shippingAddress.stateCode, shippingData.address.stateCode);
        });

        it('should copy information from the shipping form to shipment address for non-null shipment with shippingData having countryCode as an object', function() {
            shippingData.address.countryCode = {
                value: 'uk'
            };
            var shipment = {
                shippingAddress: {
                    firstName: 'David',
                    lastName: 'Johnson',
                    address1: '25 Quincy Rd.',
                    address2: '',
                    city: 'Boston',
                    postalCode: '01234',
                    countryCode: {
                        value: 'us'
                    },
                    phone: '617-777-1010',
                    stateCode: 'MA',

                    setFirstName: function(firstNameInput) {
                        this.firstName = firstNameInput;
                    },
                    setLastName: function(lastNameInput) {
                        this.lastName = lastNameInput;
                    },
                    setAddress1: function(address1Input) {
                        this.address1 = address1Input;
                    },
                    setAddress2: function(address2Input) {
                        this.address2 = address2Input;
                    },
                    setCity: function(cityInput) {
                        this.city = cityInput;
                    },
                    setPostalCode: function(postalCodeInput) {
                        this.postalCode = postalCodeInput;
                    },
                    setStateCode: function(stateCodeInput) {
                        this.stateCode = stateCodeInput;
                    },
                    setCountryCode: function(countryCodeInput) {
                        this.countryCode.value = countryCodeInput;
                    },
                    setPhone: function(phoneInput) {
                        this.phone = phoneInput;
                    }
                },
                selectedShippingMethod: {},
                setShippingMethod: function(shippingMethod) {
                    this.selectedShippingMethod = shippingMethod;
                }
            };

            checkoutHelpers.copyShippingAddressToShipment(shippingData, shipment);

            assert.equal(shipment.shippingAddress.firstName, shippingData.address.firstName);
            assert.equal(shipment.shippingAddress.lastName, shippingData.address.lastName);
            assert.equal(shipment.shippingAddress.address1, shippingData.address.address1);
            assert.equal(shipment.shippingAddress.address2, shippingData.address.address2);
            assert.equal(shipment.shippingAddress.city, shippingData.address.city);
            assert.equal(shipment.shippingAddress.postalCode, shippingData.address.postalCode);
            assert.equal(shipment.shippingAddress.countryCode.value, shippingData.address.countryCode.value);
            assert.equal(shipment.shippingAddress.phone, shippingData.address.phone);
            assert.equal(shipment.shippingAddress.stateCode, shippingData.address.stateCode);
        });
    });

    it('Testing method: calculateNonGiftCertificateAmount --> basket contains gcPaymentInstrs', () => {
        var PaymentInstrument = require('../../../mocks/dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument('testID', new Money(10));
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('GIFT_CARD', new Money(10));
        lineItemCtnr.getGiftCertificatePaymentInstruments = function () {
            return  new ArrayList([
                {
                    getPaymentTransaction: function () {
                        return {
                            getAmount: function () {
                                return 1;
                            }
                        }
                    }
                }
            ])
        }
        let result = checkoutHelpers.calculateNonGiftCertificateAmount(lineItemCtnr);
        assert.isDefined(result, 'result is defined')
    });

    it('Testing method: handlePayments --> paymentInstruments length > 0', () => {
    	var order = new Order();
    	order.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
            },
            ID: '883814258849',
            name: 'test'
        }, order.getDefaultShipment());
    	order.createPaymentInstrument('Paymetric', new Money(10));
        order.paymentInstruments = [];
        order.getPaymentInstruments = function () {
            return [
                {
                    custom: {
                        payload: 'payload'
                    }
                }
            ];
        }
        let result = checkoutHelpers.handlePayments(order, '1234567890');
        assert.isNotNull(result)

        order.paymentInstruments = [{}];
        result = checkoutHelpers.handlePayments(order, '1234567890');
    });

    it('Testing method: handlePayments --> Test In case paymentProcessor  is null', () => {

        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: null
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: true
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8,
                    eGiftCard: 9,
                    returnLabel: 10
                }
            },
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            }
        });
    	var order = new Order();
    	order.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
            },
            ID: '883814258849',
            name: 'test'
        }, order.getDefaultShipment());
    	order.createPaymentInstrument('Paymetric', new Money(10));
        order.getPaymentInstruments = function () {
            return new ArrayList ([
                {
                    getPaymentMethod: function () {
                        return {};
                    }
                }
            ])
        }

        order.paymentInstruments = [{
            getPaymentMethod: function () {
                return 'KLARNA_PAYMENTS';
            },
            paymentTransaction: {
                setTransactionID: function () {
                    return {};
                }
            }
        }];
        order.setPaymentStatus = function () {
            return {};
        }
        var result = checkoutHelpers.handlePayments(order, '1234567890');
        assert.isNotNull(result);
    });

    it('Testing method: handlePayments --> Test case authorizationResult  return an error', () => {

        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: true
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8,
                    eGiftCard: 9,
                    returnLabel: 10
                }
            },
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            }
        });
    	var order = new Order();
    	order.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
            },
            ID: '883814258849',
            name: 'test'
        }, order.getDefaultShipment());
    	order.createPaymentInstrument('Paymetric', new Money(10));
        order.getPaymentInstruments = function () {
            return new ArrayList ([
                {
                    getPaymentMethod: function () {
                        return {};
                    }
                }
            ])
        }

        order.paymentInstruments = [{
            getPaymentMethod: function () {
                return 'KLARNA_PAYMENTS';
            },
            paymentTransaction: {
                setTransactionID: function () {
                    return {};
                }
            }
        }];
        order.setPaymentStatus = function () {
            return {};
        }
        var result = checkoutHelpers.handlePayments(order, '1234567890');
        assert.isNotNull(result);
    });

    it('Testing method: Test case authorizationResult.error = false && paymentMethod === KLARNA_PAYMENTS', () => {

        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8,
                    eGiftCard: 9,
                    returnLabel: 10
                }
            },
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            }
        });
    	var order = new Order();
    	order.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
            },
            ID: '883814258849',
            name: 'test'
        }, order.getDefaultShipment());
    	order.createPaymentInstrument('Paymetric', new Money(10));
        order.getPaymentInstruments = function () {
            return new ArrayList ([
                {
                    getPaymentMethod: function () {
                        return {};
                    }
                }
            ])
        }

        order.paymentInstruments = [{
            getPaymentMethod: function () {
                return 'KLARNA_PAYMENTS';
            },
            paymentTransaction: {
                setTransactionID: function () {
                    return {};
                }
            },
            paymentMethod: 'KLARNA_PAYMENTS'
        }];
        order.setPaymentStatus = function () {
            return {};
        }
        var result = checkoutHelpers.handlePayments(order, '1234567890');
        order.paymentInstruments = [{
            getPaymentMethod: function () {
                return 'GIFT_CARD';
            },
            paymentTransaction: {
                setTransactionID: function () {
                    return {};
                }
            },
            paymentMethod: 'GIFT_CARD'
        }];
        var result = checkoutHelpers.handlePayments(order, '1234567890');
        assert.isNotNull(result);
    });

    it('Testing method: isKlarnaPaymentEnabled --> cookie128 = 1', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '1';
                }
            }
        });
        var result = checkoutHelpers.isKlarnaPaymentEnabled();
        assert.isNotNull(result);
    });

    it('Testing method: isKlarnaPaymentEnabled --> cookie128 = 0', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '0';
                }
            }
        });
        var result = checkoutHelpers.isKlarnaPaymentEnabled();
        assert.isNotNull(result);
    });

    it('Testing method: isKlarnaPaymentEnabled --> In case of in validCookie ', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var result = checkoutHelpers.isKlarnaPaymentEnabled();
        assert.isNotNull(result);
    });

    it('Testing method: isKlarnaPaymentEnabled --> Test Custom Exception', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var result = checkoutHelpers.isKlarnaPaymentEnabled();
        assert.isNotNull(result);
    });

    it('Testing method: placeOrder --> Test Custom Exception', () => {

        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                placeOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var order = new Order();

        let result = checkoutHelpers.placeOrder(order);
        assert.isNotNull(result);
    });

    it('Testing method: failOrder --> Test Custom Exception', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });

        var order = new Order();
        order.status = { value: Order.ORDER_STATUS_OPEN };
        var result = checkoutHelpers.failOrder(order);
        assert.isNotNull(result);
    });

    it('Testing method: generateGiftCardNumbers --> generateGiftCards return valid response', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: true,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var order = getEgiftCardOrder();
        var giftCardLineItems = order.getAllProductLineItems().toArray();
        var expectedStr = '[{"purchaserName":"Yesh","recipientName":"Amogh Medegar","personalMessage":"Happy new year","cardAmount":100,"deliveryDate":"Tue May 05 2020","emailAddress":"amedhegar@pfsweb.com","orderNumber":"1234567890"},{"purchaserName":"Yesh","recipientName":"Amogh Medegar","personalMessage":"Happy new year","cardAmount":100,"deliveryDate":"Tue May 05 2020","emailAddress":"amedhegar@pfsweb.com","orderNumber":"1234567890"}]';
        var giftCardsResult = checkoutHelpers.generateGiftCardNumbers(order, giftCardLineItems);
        assert.isNotNull(giftCardsResult);
    });

    it('Testing method: generateGiftCardNumbers generateGiftCards return an error in the response', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var order = getEgiftCardOrder();
        var giftCardLineItems = order.getAllProductLineItems().toArray();
        var expectedStr = '[{"purchaserName":"Yesh","recipientName":"Amogh Medegar","personalMessage":"Happy new year","cardAmount":100,"deliveryDate":"Tue May 05 2020","emailAddress":"amedhegar@pfsweb.com","orderNumber":"1234567890"},{"purchaserName":"Yesh","recipientName":"Amogh Medegar","personalMessage":"Happy new year","cardAmount":100,"deliveryDate":"Tue May 05 2020","emailAddress":"amedhegar@pfsweb.com","orderNumber":"1234567890"}]';
        var giftCardsResult = checkoutHelpers.generateGiftCardNumbers(order, giftCardLineItems);
        assert.isNotNull(giftCardsResult);
    });

    it('Testing method: sendFraudNotificationEmail --> Test Custom Exception', () => {
        var spy = checkoutHelpers.getSpy();
        spy.called = false;
        checkoutHelpers.sendFraudNotificationEmail(null);
    });

    it('Testing method: copyCustomerAddressToShipment', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: null
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: true
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {
                copyCustomerAddressToShipment: function () {
                    return {};
                },
                copyCustomerAddressToBilling: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8,
                    eGiftCard: 9,
                    returnLabel: 10
                }
            },
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            'dw/util/Locale': {
                getLocale: function () {
                    return {
                        country: 'US'
                    }
                }
            }
        });
        checkoutHelpers.copyCustomerAddressToShipment({countryCode:'US'});
        checkoutHelpers.copyCustomerAddressToBilling({countryCode:'US'});
    });

    it('Testing method: isPhoneNumberMandatory --> Test valid Cookie case', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '1';
                }
            }
        });
        checkoutHelpers.isPhoneNumberMandatory();
    });

    it('Testing method: isPhoneNumberMandatory Test Custom Exception', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        checkoutHelpers.isPhoneNumberMandatory();
    });

    it('Testing method: isHALShippingEnabled', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '1';
                }
            }
        });
        var result = checkoutHelpers.isHALShippingEnabled();
        assert.isNotNull(result);
    });

    it('Testing method: isHALShippingEnabled --> Test case valid cookie and cookie583 equal to 0', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '0';
                }
            }
        });
        var result = checkoutHelpers.isHALShippingEnabled();
        assert.isNotNull(result);
    });

    it('Testing method: isHALShippingEnabled --> Not valid cookie case', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var result = checkoutHelpers.isHALShippingEnabled();
        assert.isNotNull(result);
    });

    it('Testing method: isHALShippingEnabled & isHALEnabledForShopApp -> Test HALShippingEnabled is disabled', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var result = checkoutHelpers.isHALShippingEnabled();
        assert.isNotNull(result);
        checkoutHelpers.isHALEnabledForShopApp();
    });

    it('Testing method: isHALShippingEnabled --> Test Custom Exception', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        checkoutHelpers.isHALShippingEnabled();
    });

    it('Testing method: setGift --> Test in case gift carditem .clear item attribute is true', () => {
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        basket.allProductLineItems = [
            {
                productID: 'productID'
            }
        ]
        BasketMgr.setCurrentBasket(basket);
        var giftMessage = 'some message';
        var giftItems = '{ "pid":"productID", "clearItem": "true" }';
        var shipping = basket.defaultShipment;

        let result = checkoutHelpers.setGift(shipping, false, giftMessage, giftItems);
        assert.equal(result.error, false);
    });

    it('Testing method: setGift --> Test in case gift carditem clear item attribute is false', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return false;
                },
                hasPreOrderItems: function () {
                    return false;
                },
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        availabilityModel: {
                            inventoryRecord: {
                                ATS: {
                                    value: 2
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        basket.allProductLineItems = [
            {
                productID: 'productID'
            }
        ]
        BasketMgr.setCurrentBasket(basket);
        var giftMessage = 'some message';
        var giftItems = '{ "pid":"productID", "clearItem": false }';
        var shipping = basket.defaultShipment;

        let result = checkoutHelpers.setGift(shipping, false, giftMessage, giftItems);
    });

    it('Testing method: ensureValidShipments --> shipment.custom.fromStoreId = null', function() {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        lineItemCtnr.getShipments().get(0).custom = {};
        lineItemCtnr.getShipments().get(0).shippingMethod.custom.storePickupEnabled = true
        var result = checkoutHelpers.ensureValidShipments(lineItemCtnr);

        lineItemCtnr.getShipments().get(0).shippingAddress = null;
        result = checkoutHelpers.ensureValidShipments(lineItemCtnr);

        lineItemCtnr.getShipments().get(0).custom = {
            fromStoreId: 'fromStoreId'
        };
        lineItemCtnr.getShipments().get(0).shippingMethod.custom.storePickupEnabled = true
        lineItemCtnr.getShipments().get(0).ID = 'EGiftCardShipment'
        lineItemCtnr.getShipments().get(0).productLineItems = new ArrayList ([
            {
                shipment: {
                    custom: {}
                }
            }
        ])
        var result = checkoutHelpers.ensureValidShipments(lineItemCtnr);
        assert.isNotNull(result);
    });

    it('Testing method: ensureValidShipments --> basket contains only giftcards', function() {

        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                },
                basketHasGiftCardItems: function () {
                    return {
                        onlyEGiftCards: true
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return false;
                },
                hasPreOrderItems: function () {
                    return false;
                },
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        availabilityModel: {
                            inventoryRecord: {
                                ATS: {
                                    value: 2
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        lineItemCtnr.getShipments().get(0).custom = {};
        lineItemCtnr.getShipments().get(0).shippingMethod.custom.storePickupEnabled = true
        var result = checkoutHelpers.ensureValidShipments(lineItemCtnr);
        assert.isNotNull(result);
    });

    it('Testing method: calculatePaymentTransaction --> gcRedeemedAmount < 0 ', function() {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('CC', new Money(30));
        lineItemCtnr.paymentInstruments[0].paymentTransaction = {
            setAmount: function () {
                return {};
            }
        }
        var result = checkoutHelpers.calculatePaymentTransaction(lineItemCtnr);
        assert.equal(false, result.error);

        lineItemCtnr.paymentInstruments = [];
        checkoutHelpers.calculatePaymentTransaction(lineItemCtnr);
    });

    it('Testing method: calculatePaymentTransaction --> Test Custom Exception', function() {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                },
                basketHasGiftCardItems: function () {
                    return {
                        onlyEGiftCards: true
                    }
                },
                getGcRedeemedAmount: function () {
                    return 3;
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return false;
                },
                hasPreOrderItems: function () {
                    return false;
                },
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        availabilityModel: {
                            inventoryRecord: {
                                ATS: {
                                    value: 2
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 100;
        lineItemCtnr.createPaymentInstrument('CC', new Money(30));
        lineItemCtnr.paymentInstruments[0].paymentTransaction = {}
        var result = checkoutHelpers.calculatePaymentTransaction(lineItemCtnr);
        assert.equal(true, result.error);
    });

    it('Testing method: copyBillingAddressToShippingAddress --> Test Case shipment.shippingAddress is null', function() {
        var lineItemCtnr = new LineItemCtnr();
        var billingAddress = Object.assign({}, lineItemCtnr.getShipments().get(0).shippingAddress);
        billingAddress.address1 = '505 Millenium dr',
        billingAddress.city = 'Allen';
        billingAddress.stateCode = 'TX';
        lineItemCtnr.getDefaultShipment = function () {
            return {
                shippingAddress: null,
                createShippingAddress: function () {
                    this.shippingAddress = {
                        firstName: '',
                        lastName: '',
                        address1: '',
                        address2: '',
                        city: '',
                        postalCode: '',
                        countryCode: { value: '' },
                        phone: '',
                        stateCode: '',

                        setFirstName: function (firstNameInput) { this.firstName = firstNameInput; },
                        setLastName: function (lastNameInput) { this.lastName = lastNameInput; },
                        setAddress1: function (address1Input) { this.address1 = address1Input; },
                        setAddress2: function (address2Input) { this.address2 = address2Input; },
                        setCity: function (cityInput) { this.city = cityInput; },
                        setPostalCode: function (postalCodeInput) { this.postalCode = postalCodeInput; },
                        setStateCode: function (stateCodeInput) { this.stateCode = stateCodeInput; },
                        setCountryCode: function (countryCodeInput) { this.countryCode.value = countryCodeInput; },
                        setPhone: function (phoneInput) { this.phone = phoneInput; }
                    };
                    return this.shippingAddress;
                }
            };
        }
        checkoutHelpers.copyBillingAddressToShippingAddress(billingAddress, lineItemCtnr);
    });

    it('Testing method: getEligiblePaymentMethods --> case giftCardsLimitExceeded and isOrderTotalRedeemed is true', () => {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem('883814258849', lineItemCtnr.getDefaultShipment());
        lineItemCtnr.getAllProductLineItems = function() {
            return lineItemCtnr.productLineItems;
        };
        var giftCardFormData = {
            gcResults: {
                isOrderTotalRedeemed: true,
                gcPaymentInstruments: []
            },
            giftCardsLimitExceeded: true
        }
        var vipPoints = {
            pointsApplied: true
        };
        var Customer = require('../../../../test/mocks/dw/dw_customer_Customer');
        var currentCustomer = new Customer();
        currentCustomer.authenticated = true;
        currentCustomer.registered = true;

        let result = checkoutHelpers.getEligiblePaymentMethods(lineItemCtnr, giftCardFormData, vipPoints, currentCustomer);
        assert.equal(result.creditCard, false);
    });

    it('Testing method: getEligiblePaymentMethods --> case gcPaymentInstruments.length > 0 && !isOrderTotalRedeemed', () => {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem('883814258849', lineItemCtnr.getDefaultShipment());
        lineItemCtnr.getAllProductLineItems = function() {
            return lineItemCtnr.productLineItems;
        };
        var giftCardFormData = {
            gcResults: {
                isOrderTotalRedeemed: false,
                gcPaymentInstruments: [{}]
            },
            giftCardsLimitExceeded: false
        }
        var vipPoints = {
            pointsApplied: true
        };
        var Customer = require('../../../../test/mocks/dw/dw_customer_Customer');
        var currentCustomer = new Customer();
        currentCustomer.authenticated = true;
        currentCustomer.registered = true;

        let result = checkoutHelpers.getEligiblePaymentMethods(lineItemCtnr, giftCardFormData, vipPoints, currentCustomer);
        assert.equal(result.creditCard, true);
    });

    it('Testing method: getEligiblePaymentMethods --> Test case vipPromotionEnabled is enabled', () => {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem('883814258849', lineItemCtnr.getDefaultShipment());
        lineItemCtnr.getAllProductLineItems = function() {
            return lineItemCtnr.productLineItems;
        };
        var giftCardFormData = {
            gcResults: {
                isOrderTotalRedeemed: false,
                gcPaymentInstruments: []
            },
            giftCardsLimitExceeded: false
        }
        var vipPoints = {
            pointsApplied: false,
            vipPromotionEnabled: true
        };
        var Customer = require('../../../../test/mocks/dw/dw_customer_Customer');
        var currentCustomer = new Customer();
        currentCustomer.authenticated = true;
        currentCustomer.registered = true;

        let result = checkoutHelpers.getEligiblePaymentMethods(lineItemCtnr, giftCardFormData, vipPoints, currentCustomer);
        assert.equal(result.creditCard, true);
    });

    it('Testing method: updateShipToAsDefaultShipment --> defaultShipmentLineItems.length > 0', () => {
        var basket = new LineItemCtnr();
        basket.defaultShipment = {
            custom: {
                shipmentType: 'instore'
            },
            productLineItems: [{
                custom: {
                    fromStoreId: 'fromStoreId',
                },
                setShipment: function () {
                    return {};
                }
            }],
            createShippingAddress: function () {
                return {};
            },
            setShippingMethod: function () {
                return {};
            }
        };
        basket.shipments = new ArrayList ([{
            custom: {},
            productLineItems: [{
                setShipment: function () {
                    return {};
                }
            }],
            createShippingAddress: function () {
                return {};
            },
            setShippingMethod: function () {
                return {};
            }
        },
        {
            custom: {},
            productLineItems: [{
                setShipment: function () {
                    return {};
                }
            }],
            createShippingAddress: function () {
                return {};
            },
            setShippingMethod: function () {
                return {};
            }
        }
    ])
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);

        var req = {
                session: {
                    privacyCache: {
                        get: function() {
                            return '';
                        },
                        set: function() {
                            return '';
                        }
                    }
                }
        };
        let result = checkoutHelpers.updateShipToAsDefaultShipment(req);
    });

    it('Testing method: updateStateCode', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            statesCodeMapping:'{}'
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return '{"MXX":{"MXX":""},"MX":{"MXX":""}}';
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var basket = {
            billingAddress: {
                stateCode: 'MXX',
                countryCode: {
                    value: 'MXX'
                }
            },
            getPaymentInstruments: function () {
                return [{}]
            },
            shipments: new ArrayList ([{
                shippingAddress: {
                    stateCode: 'MXX',
                    countryCode: {
                        value: 'MX'
                    }
                }
            }])
        };
        let result = checkoutHelpers.updateStateCode(basket);

        var basket = {
            billingAddress: {
                stateCode: 'mx',
                countryCode: {
                    value: 'MXX'
                }
            },
            getPaymentInstruments: function () {
                return [{}]
            },
            shipments: new ArrayList ([{
                shippingAddress: {
                    stateCode: 'mx',
                    countryCode: {
                        value: 'MX'
                    }
                }
            }])
        };
        result = checkoutHelpers.updateStateCode(basket);
    });

    it('Testing method: updateStateCode --> Test Custom Exception', () => {
        var result = checkoutHelpers.updateStateCode({});
        assert.isNotNull(result);
    });

    it('Testing method: eligibleForShipToCollectionPoint --> HALShippingEnabled', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '1';
                }
            }
        });
        var result = checkoutHelpers.eligibleForShipToCollectionPoint(null, null, null, null);
        assert.isNotNull(result);
    });

    it('Testing method: convertStoreWorkingHours', () => {
        var pickupLocations = {
            count: 1,
            locations:[{
                pickupHours:[{
                    openTime: '13:00',
                    closeTime: '23:00'
                }]
            }]
        }
        var result = checkoutHelpers.convertStoreWorkingHours(pickupLocations);
        assert.equal(result.count, 1);

        var pickupLocations = {
            count: 1,
            locations:[{
                pickupHours:[{
                    openTime: '00:00',
                    closeTime: '00:00'
                }]
            }]
        }
        var result = checkoutHelpers.convertStoreWorkingHours(pickupLocations);
        assert.equal(result.count, 1)
    });

    it('Testing method: convertStoreWorkingHours --> Test Custom Exception', () => {
        var pickupLocations = {
            count: 1,
            locations:[{
                pickupHours:[{
                    closeTime: '23:00'
                }]
            }]
        }
        var result = checkoutHelpers.convertStoreWorkingHours(pickupLocations);
        assert.isNull(result);
    });

    it('Testing method: autoCorrectPhonenumber', () => {
        var currentBasket = {
            billingAddress: {
                phone: '1222222222'
            }
        }
        var result = checkoutHelpers.autoCorrectPhonenumber(currentBasket);
        assert.equal(currentBasket.billingAddress.phone, '1222222222');
    });

    it('Testing method: autoCorrectPhonenumber --> Test Custom Exception', () => {
        var currentBasket = {
            billingAddress: {
                phone: {}
            }
        }
        checkoutHelpers.autoCorrectPhonenumber(currentBasket);
    });

    it('Testing method: updatePostalCode', () => {
        var currentBasket ={
            shipments: new ArrayList ([{
                shippingAddress: {
                    countryCode: {
                        value: 'CA',
                        postalCode: '11111'
                    }
                }
            }]),
            billingAddress: {
                postalCode: 'K1A0B1',
                countryCode: {
                    value: 'CA'
                }
            }
        }
       var result = checkoutHelpers.updatePostalCode(currentBasket);
       assert.isNotNull(result);
    });

    it('Testing method: updatePostalCode --> Test Custom Exception', () => {
        var currentBasket = {}
       var result = checkoutHelpers.updatePostalCode(currentBasket);
       assert.isNotNull(result);
    });

    it('Testing method: isShipBillPayExistInBasket', () => {
        var currentBasket = {
            defaultShipment: {
                shippingAddress: {}
            },
            getPaymentInstruments: function () {
                return [{}];
            },
            billingAddress: {}
        }
       var result = checkoutHelpers.isShipBillPayExistInBasket(currentBasket, 'placeOrder');
       assert.isTrue(result)
    });

    it('Testing method: isShipBillPayExistInBasket', () => {
        var currentBasket = {
            defaultShipment: {
                shippingAddress: {}
            },
            getPaymentInstruments: function () {
                return [{}];
            },
            billingAddress: {}
        }
       var result = checkoutHelpers.isShipBillPayExistInBasket(currentBasket, 'payment');
       assert.isTrue(result)
    });

    it('Testing method: validatePaymentCards --> case valid payment card', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        },
                        getApplicablePaymentCards: function () {
                            return {
                                contains: function () {
                                    return {};
                                }
                            };
                        }
                    }
                },
                getPaymentCard: function () {
                    return {};
                },
                getApplicablePaymentMethods: function () {
                    return {
                        contains: function () {
                            return {};
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '1';
                }
            }
        });
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        basket.createPaymentInstrument('GIFT_CERTIFICATE', new Money(30));
        basket.createPaymentInstrument('CREDIT_CARD', new Money(30));;

        var Customer = require('../../../../test/mocks/dw/dw_customer_Customer');
        var currentCustomer = new Customer();
        var result = checkoutHelpers.validatePaymentCards(basket, 'US', currentCustomer);
        assert.equal(result.error, false);
    });

    it('Testing method: validatePaymentCards --> case in valid payment card', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        },
                        getApplicablePaymentCards: function () {
                            return {
                                contains: function () {
                                    return {};
                                }
                            };
                        }
                    }
                },
                getPaymentCard: function () {
                    return null;
                },
                getApplicablePaymentMethods: function () {
                    return {
                        contains: function () {
                            return {};
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '1';
                }
            }
        });
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        basket.createPaymentInstrument('CREDIT_CARD', new Money(30));;

        var Customer = require('../../../../test/mocks/dw/dw_customer_Customer');
        var currentCustomer = new Customer();
        var result = checkoutHelpers.validatePaymentCards(basket, 'US', currentCustomer);
        assert.equal(result.error, true);
    });

    it('Testing method: ensureValidAddressType', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        },
                        getApplicablePaymentCards: function () {
                            return {
                                contains: function () {
                                    return {};
                                }
                            };
                        }
                    }
                },
                getPaymentCard: function () {
                    return null;
                },
                getApplicablePaymentMethods: function () {
                    return {
                        contains: function () {
                            return {};
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                },
                basketHasGiftCardItems: function () {
                    return {
                        onlyEGiftCards: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '1';
                }
            }
        });
        var basket = new LineItemCtnr();
        basket.getShipments().get(0).shippingAddress.custom.addressType = null
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        let result = checkoutHelpers.ensureValidAddressType(basket);
        assert.equal(result, false);
        basket.getShipments().get(0).ID = 'EGiftCardShipment';
        result = checkoutHelpers.ensureValidAddressType(basket);
        assert.isNotNull(result);
    });

    it('Testing method: containsAtleastOneLocaleAddress --> addressCountry != currentCountry', () => {
        var CustomerAddress = require('../../../mocks/dw/dw_customer_CustomerAddress');
        let result = checkoutHelpers.containsAtleastOneLocaleAddress('CA', [new CustomerAddress()]);
        assert.equal(result, false);
    });

    it('Testing method: getLocaleAddress', () => {
        var CustomerAddress = require('../../../mocks/dw/dw_customer_CustomerAddress');
        let result = checkoutHelpers.getLocaleAddress('US', [new CustomerAddress()]);
        assert.isNotNull(result);
    });

    it('Testing method: copyCustomerAddressToBasket', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: null
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: true
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {
                copyCustomerAddressToShipment: function () {
                    return {};
                },
                copyCustomerAddressToBilling: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8,
                    eGiftCard: 9,
                    returnLabel: 10
                }
            },
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            'dw/util/Locale': {
                getLocale: function () {
                    return {
                        country: 'US'
                    }
                }
            }
        });
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        var basket = require('../../../mocks/dw/dw_order_Basket');
        basket.billingAddress = null;
        var shipment = require('../../../mocks/dw/dw_order_Shipment');
        basket.shipments = [];
        basket.createShipment = function (shipment) {
            this.shipments.push(shipment);
            return shipment;
        }
        basket.defaultShipment = BasketMgr.getCurrentBasket().defaultShipment;
        basket.createShipment(new shipment());
        basket.shipments[0].shippingAddress = null;
        var customer  = {};
        customer.addressBook = {
            preferredAddress: {
                countryCode: 'US'
            }
        };
        var preferredAddress = {
            countryCode:'US',
            address1: '5 Wall St.',
            custom :{
                suburb:'suburb',
                district: 'district',
                businessName:'businessName'
            }
        }
        customer.addressBook.addresses = [
            preferredAddress
        ];
        customer.addressBook.preferredAddress = preferredAddress;
        basket.billingAddress = undefined;
        checkoutHelpers.copyCustomerAddressToBasket(basket, customer);

        var preferredAddress = {
            countryCode: {
                value: 'US'
            },
            address1: '5 Wall St.',
            custom :{
                suburb:'suburb',
                district: 'district',
                businessName:'businessName'
            }
        }
        customer.addressBook.addresses = [
            preferredAddress
        ];
        customer.addressBook.preferredAddress = preferredAddress;
        checkoutHelpers.copyCustomerAddressToBasket(basket, customer);
    });

    it('Testing method: updateBillingStateCode(', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            statesCodeMapping:'{}'
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return '{"MXX":{"MXX":""},"MX":{"MXX":""}}';
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var order = {
            billingAddress: {
                stateCode: 'MXX',
                countryCode: {
                    value: 'MXX'
                }
            },
            getPaymentInstruments: function () {
                return [{}]
            },
            shipments: new ArrayList ([{
                shippingAddress: {
                    stateCode: 'MXX',
                    countryCode: {
                        value: 'MX'
                    }
                }
            }])
        };
        let result = checkoutHelpers.updateStateCode(order);
        assert.isNotNull(result);

        var order = {
            billingAddress: {
                stateCode: 'mxx',
                countryCode: {
                    value: 'MXX'
                }
            },
            getPaymentInstruments: function () {
                return [{}]
            },
            shipments: new ArrayList ([{
                shippingAddress: {
                    stateCode: 'mx',
                    countryCode: {
                        value: 'MX'
                    }
                }
            }])
        };
        result = checkoutHelpers.updateBillingStateCode(order);
        assert.isNotNull(result);
    });

    it('Testing method: updateBillingStateCode --> statesCodeMapping null', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var order = {
            billingAddress: {
                stateCode: 'MXX',
                countryCode: {
                    value: 'MXX'
                }
            },
            getPaymentInstruments: function () {
                return [{}]
            },
            shipments: new ArrayList ([{
                shippingAddress: {
                    stateCode: 'MXX',
                    countryCode: {
                        value: 'MX'
                    }
                }
            }])
        };
        let result = checkoutHelpers.updateStateCode(order);
        assert.isNotNull(result);

        var order = {
            billingAddress: {
                stateCode: 'mxx',
                countryCode: {
                    value: 'MXX'
                }
            },
            getPaymentInstruments: function () {
                return [{}]
            },
            shipments: new ArrayList ([{
                shippingAddress: {
                    stateCode: 'mx',
                    countryCode: {
                        value: 'MX'
                    }
                }
            }])
        };
        result = checkoutHelpers.updateBillingStateCode(order);
    });

    it('Testing method: validateInputFieldsForShippingMethod', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return {
                        shippingAddressErrors: [{}]
                    };
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        var addressObject ={};
        var result = checkoutHelpers.validateInputFieldsForShippingMethod(addressObject);
        assert.isNotNull(result);
    });

    it('Testing method: checkEmptyEmojiNonLatinChars', () => {
        var address = {
            firstName: 'James',
            lastName: 'Bond',
            address1: '10 Oxford St',
            address2: 'suite 20',
            city: 'London',
            postalCode: '12345',
            countryCode: { value: 'NZ' },
            phone: '603-333-1212',
            stateCode: 'NH',
            suburb: ''
        };
        var addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'postalCode', 'countryCode'];
        let result = checkoutHelpers.checkEmptyEmojiNonLatinChars(address,addressFieldsToVerify, 'NZ');
        assert.isNotNull(result.postalCode);

        address.firstName = '';
        addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'postalCode'];
        result = checkoutHelpers.checkEmptyEmojiNonLatinChars(address,addressFieldsToVerify, 'NZ');
        assert.isObject(result);
        assert.equal(result.firstName, 'firstName is empty');
        address.firstName = 'tettestestTesttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt';
        session.custom.currentCountry = 'AU';
        addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'postalCode', 'suburb'];
        result = checkoutHelpers.checkEmptyEmojiNonLatinChars(address,addressFieldsToVerify, 'AU');
        session.custom.currentCountry = 'ID';
    });

    it('Testing method: validateInputFields', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return {
                        shippingAddressErrors: [{}]
                    };
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        let basket = new LineItemCtnr();
        basket.defaultShipment.giftMessage = 'Test';
        let result = checkoutHelpers.validateInputFields(basket);

        basket.customerEmail = 'test@ua..@com';
        basket.billingAddress.phone = '333-4445555';
        result = checkoutHelpers.validateInputFields(basket);
    });

    it('Testing method: giftCardCharactersValidations', () => {
        var giftCardForm = {};
        let result = checkoutHelpers.giftCardCharactersValidations(giftCardForm);
        assert.isNotNull(result);
    });

    it('Testing method: giftCardCharactersValidations --> gcAmount < 0', () => {
        var giftCardForm = {
            gcAmount: -1
        };
        let result = checkoutHelpers.giftCardCharactersValidations(giftCardForm);
        assert.isNotNull(result);
    });

    it('Testing method: setEmptyValueBillingForm', () => {
        var billingAddress = {};
        var billingForms = {
            firstName: '',
            lastName: '',
            address1: '',
            address2: '',
            city: '',
            postalCode: '',
            stateCode: ''
        };
        let result = checkoutHelpers.setEmptyValueBillingForm(billingAddress, billingForms);
        assert.isNotNull(result);
    });

    it('Testing method: setEmptyShippingAddressFields', () => {
        var basket = {};
        basket.defaultShipment = {
            shippingAddress: {}
        }
        let result = checkoutHelpers.setEmptyShippingAddressFields(basket);
        assert.isNotNull(result);
    });

    it('Testing method: bfOrdersMissingProductDetails', () => {
        var productLineItemsObject = new ArrayList([{
            product: null
        }]);
        let result = checkoutHelpers.bfOrdersMissingProductDetails(productLineItemsObject, 'bfBeforeSendBF');
        result = checkoutHelpers.bfOrdersMissingProductDetails(productLineItemsObject, 'bfboc');
        result = checkoutHelpers.bfOrdersMissingProductDetails(productLineItemsObject, 'bfaoc');
        assert.isNotNull(result);
    });

    it('Testing method: bfOrdersMissingProductDetails --> Test Custom Exception', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {},
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {},
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': {
                FRAUD_STATUS : {
                    PENDING: 'PENDING'
                }
            },
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '1';
                }
            }
        });
        var order ={
            getPaymentInstruments: function () {
                return [{}];
            }
        };
        let result = checkoutHelpers.handlePendingKlarnaOrder(order);
        assert.isNotNull(result);
    });

    it('Testing method: handlePaymentMethods', () => {
        var basket ={
            totalGrossPrice: 10,
            createPaymentInstrument: function () {
                return {};
            }
        };
        let result = checkoutHelpers.handlePaymentMethods(basket, 'PaymentMethodID');
        assert.isNotNull(result);
    });

    it('Testing method: isRadioPaymentExperienceEnabled -> cookie928 = 1', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            isRadioPaymentExperienceEnabled:'isRadioPaymentExperienceEnabled'
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '1';
                }
            }
        });
        let result = checkoutHelpers.isRadioPaymentExperienceEnabled();
        assert.isNotNull(result);
    });

    it('Testing method: isRadioPaymentExperienceEnabled -> cookie928 = 0', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            isRadioPaymentExperienceEnabled:'isRadioPaymentExperienceEnabled'
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '0';
                }
            }
        });
        let result = checkoutHelpers.isRadioPaymentExperienceEnabled();
        assert.isNotNull(result);
    });

    it('Testing method: isRadioPaymentExperienceEnabled -> cookie928 equal not valid value', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            isRadioPaymentExperienceEnabled:'isRadioPaymentExperienceEnabled'
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        let result = checkoutHelpers.isRadioPaymentExperienceEnabled();
        assert.isNotNull(result);
    });

    it('Testing method: isRadioPaymentExperienceEnabled ->Test Custom Exception', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            }
        });
        let result = checkoutHelpers.isRadioPaymentExperienceEnabled();
        assert.isNotNull(result);
    });

    it('Testing method: handleInvalidBopisItems', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                },
                moveItemFromBopisShipment: function () {
                    return {
                        movedToShipping: 'movedToShipping',
                        fullyRemoved: 'fullyRemoved'
                    };
                },
                splitItemFromBopisShipment: function () {
                    return {
                        partiallyMovedToShipping: 'partiallyMovedToShipping',
                        partiallyRemovedFromCart: 'partiallyRemovedFromCart'
                    };
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
                isCheckPointEnabled: function () {
                    return {};
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailability': {
                getMaoAvailability: function () {
                    return {};
                }
            }
        });
        var  cartModel = {};
        cartModel.items = [{
            id: 'ID'
        }]
        var currentBasket = {
            removeProductLineItem: function () {
                return {};
            }
        };
        currentBasket.shipments = new ArrayList([{
            custom: {
                fromStoreId: 'fromStoreId',
            },
            productLineItems: new ArrayList([{
                product: {
                    ID: 'ID'
                },
                custom: {}
            },
            {
                product: {
                    ID: 'ID1'
                },
                custom: {}
            }])
        }])
        var validatedBOPISProducts = {
            invalidItemsSku: [],
            partiallyAvailableBopisItems: [{
                id: 'ID'
            }],
            moveItemsToShipping: [{
                id: 'ID'
            },
            {
                id: 'ID1'
            }]
        }
        let result = checkoutHelpers.handleInvalidBopisItems(cartModel, currentBasket, validatedBOPISProducts);
        assert.isNotNull(result);

       // Test Custom Exception
       currentBasket.shipments = {}
       result = checkoutHelpers.handleInvalidBopisItems(cartModel, currentBasket, validatedBOPISProducts);
    });

    it('Testing method: getRenderedPaymentInstruments', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                },
                moveItemFromBopisShipment: function () {
                    return {
                        movedToShipping: 'movedToShipping',
                        fullyRemoved: 'fullyRemoved'
                    };
                },
                splitItemFromBopisShipment: function () {
                    return {
                        partiallyMovedToShipping: 'partiallyMovedToShipping',
                        partiallyRemovedFromCart: 'partiallyRemovedFromCart'
                    };
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            },
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            }
        });
        var req = {
            currentCustomer: {
                raw: {
                    authenticated: true,
                    registered: true,
                    profile: {
                        wallet: {
                            paymentInstruments: {
                                getLength: function () {
                                    return 1;
                                }
                            }
                        }
                    }
                }
            }
        }
       var result = checkoutHelpers.getRenderedPaymentInstruments(req, {});
       assert.isNotNull(result);
    });

    it('Testing method: getRenderedPaymentInstruments --> AurusEnabled', () => {
        var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/OrderMgr': {
                failOrder: function () {
                    return {}
                },
                cancelOrder: function() {
                    return 1;
                }
            },
            'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/order/PaymentMgr':{
                getPaymentMethod: function () {
                    return {
                        paymentProcessor: {
                            ID: 'ID'
                        }
                    }
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return false
                },
                callHook: function () {
                    return {
                        error: false
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                authorizeGiftCards: function () {
                    return {
                        error: false
                    }
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: function () {
                }
            },
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/basketHelper': {},
            '*/cartridge/scripts/checkout/shippingHelpers': {
                selectShippingMethod: function () {}
            },
            '*/cartridge/modules/providers': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/firstDataHelper': {
                generateGiftCards: function () {
                    return {
                        success: false,
                        giftCardData: [
                            {
                                cardNumber: 'cardNumber',
                                cardPIN: 'cardPIN'
                            }
                        ]
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/Calendar': function () {
                return {
                    toTimeString: function () {
                        return {};
                    }
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function () {
                    return true;
                },
                hasPreOrderItems: function () {
                    return false;
                },
                moveItemFromBopisShipment: function () {
                    return {
                        movedToShipping: 'movedToShipping',
                        fullyRemoved: 'fullyRemoved'
                    };
                },
                splitItemFromBopisShipment: function () {
                    return {
                        partiallyMovedToShipping: 'partiallyMovedToShipping',
                        partiallyRemovedFromCart: 'partiallyRemovedFromCart'
                    };
                }
            },
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
            'dw/order/PaymentInstrument': require('../../../mocks/dw/dw_order_PaymentInstrument'),
            '*/cartridge/scripts/MaoPreferences': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return '';
                }
            },
            'int_klarna_payments_sfra/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
                return {custom : {
                     kpFraudStatus: 'PENDING'
                }};
            }},
            '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
            '*/cartridge/scripts/basketHelper': {
                updateAddressType: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return true;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '22';
                }
            },
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            }
        });
        var req = {
            currentCustomer: {
                raw: {
                    authenticated: true,
                    registered: true,
                    profile: {
                        wallet: {
                            paymentInstruments: {
                                getLength: function () {
                                    return 1;
                                }
                            }
                        }
                    }
                }
            }
        }
       var result = checkoutHelpers.getRenderedPaymentInstruments(req, {});
       assert.isNotNull(result);
    });
});
