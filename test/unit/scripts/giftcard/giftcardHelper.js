/* eslint-disable no-unused-vars */
/* eslint-disable spellcheck/spell-checker */
'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const gcPaymentMethodId = 'GIFT_CARD';
const ccPaymentMethodId = 'Paymetric';
const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
var ArrayList = require('../../../mocks/scripts/util/dw.util.Collection');
var Site = require('../../../mocks/dw/dw_system_Site');
var sinon = require('sinon');
const eGiftCard = 'EGIFT_CARD';
var Money = require('../../../mocks/dw/dw_value_Money');

var mockOptions = [{
    optionId: 'option 1',
    selectedValueId: '123'
}];

var availabilityModelMock = {
    inventoryRecord: {
        ATS: {
            value: 3
        }
    }
};

var productLineItemMock = {
    productID: 'someProductID',
    quantity: {
        value: 1
    },
    setQuantityValue: function () {
        return;
    },
    quantityValue: 1,
    product: {
        availabilityModel: availabilityModelMock,
        custom: {
            giftCard: {
                value: eGiftCard
            }
        }
    },
    optionProductLineItems: new ArrayList(mockOptions),
    bundledProductLineItems: new ArrayList([])
};

var stubGetBonusLineItems = function () {
    var bonusProducts = [{
        ID: 'pid_1'
    },
    {
        ID: 'pid_2'
    }];
    var index2 = 0;
    var bonusDiscountLineItems = [
        {
            name: 'name1',
            ID: 'ID1',
            description: 'description 1',
            UUID: 'uuid_string',
            maxBonusItems: 1,
            bonusProducts: {
                iterator: function () {
                    return {
                        items: bonusProducts,
                        hasNext: function () {
                            return index2 < bonusProducts.length;
                        },
                        next: function () {
                            return bonusProducts[index2++];
                        }
                    };
                }
            }
        }
    ];
    var index = 0;

    return {
        id: 2,
        name: '',
        iterator: function () {
            return {
                items: bonusDiscountLineItems,
                hasNext: function () {
                    return index < bonusDiscountLineItems.length;
                },
                next: function () {
                    return bonusDiscountLineItems[index++];
                }
            };
        }
    };
};

var createApiBasket = function (productInBasket) {
    var currentBasket = {
        defaultShipment: {},
        createProductLineItem: function () {
            return {
                setQuantityValue: function () {
                    return;
                }
            };
        },
        getBonusDiscountLineItems: stubGetBonusLineItems
    };
    if (productInBasket) {
        currentBasket.productLineItems = new ArrayList([productLineItemMock]);
        currentBasket.allLineItems = {};
        currentBasket.allLineItems.length = 1;
    } else {
        currentBasket.productLineItems = new ArrayList([]);
    }
    currentBasket.getAllProductLineItems = function () {
        return this.productLineItems;
    };
    return currentBasket;
};

const giftCardHelper = require('../../../mocks/scripts/giftcard/giftcardHelper').giftCardHelper;
const giftCardHooks = require('../../../mocks/scripts/giftcard/giftcardHelper').giftCardHooks;

describe('app_ua_core/cartridge/scripts/giftcard/giftcardHelper test', () => {
    var findStub = sinon.stub();
    findStub.withArgs([productLineItemMock]).returns(productLineItemMock);
    var cartHelpers = proxyquire('../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/cart/cartHelpers', {
        'dw/catalog/ProductMgr': {
            getProduct: function () {
                return {
                    optionModel: {
                        getOption: function () {},
                        getOptionValue: function () {},
                        setSelectedOptionValue: function () {}
                    },
                    availabilityModel: availabilityModelMock
                };
            }
        },
        '*/cartridge/scripts/util/collections': proxyquire('../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
            'dw/util/ArrayList': ArrayList
        }),
        '*/cartridge/scripts/checkout/shippingHelpers': {},
        'dw/system/Transaction': {
            wrap: function (item) {
                item();
            }
        },
        '*/cartridge/scripts/util/array': { find: findStub },
        'dw/web/Resource': {
            msg: function () {
                return 'someString';
            },
            msgf: function () {
                return 'someString';
            }
        },
        '*/cartridge/scripts/helpers/productHelpers': {
            getOptions: function () {},
            getCurrentOptionModel: function () {}
        },
        'dw/web/URLUtils': {
            url: function () {
                return {
                    toString: function () {
                        return 'string URL';
                    }
                };
            }
        }
    });

    global.empty = (data) => {
        return !data;
    };

    it('Test getGcRedeemedAmount method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createPaymentInstrument(gcPaymentMethodId, new Money(20));
        var gcRedeemedAmount = giftCardHelper.getGcRedeemedAmount(lineItemCtnr);
        assert.equal(20, gcRedeemedAmount);

        giftCardHelper.removeGcPaymentInstruments(lineItemCtnr);
        gcRedeemedAmount = giftCardHelper.getGcRedeemedAmount(lineItemCtnr);
        assert.equal(0, gcRedeemedAmount);
    });

    it('Test isOrderTotalRedeemed method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 30;
        lineItemCtnr.createPaymentInstrument(gcPaymentMethodId, new Money(20));
        var result = giftCardHelper.isOrderTotalRedeemed(lineItemCtnr);
        assert.equal(false, result);

        lineItemCtnr.createPaymentInstrument(gcPaymentMethodId, new Money(10));
        result = giftCardHelper.isOrderTotalRedeemed(lineItemCtnr);
        assert.equal(true, result);
    });

    it('Test removeNonGcPaymentInstruments method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createPaymentInstrument(ccPaymentMethodId, new Money(20));
        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(20));
        giftCardHelper.removeNonGcPaymentInstruments(lineItemCtnr);
        var result = lineItemCtnr.getPaymentInstruments().size();
        assert.equal(0, result);

        lineItemCtnr.createPaymentInstrument(gcPaymentMethodId, new Money(20));
        giftCardHelper.removeNonGcPaymentInstruments(lineItemCtnr);
        result = lineItemCtnr.getPaymentInstruments().size();
        assert.equal(1, result);
    });

    it('Test removeGcPaymentInstrument method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createPaymentInstrument(gcPaymentMethodId, new Money(20));
        giftCardHelper.removeGcPaymentInstruments(lineItemCtnr, '1234');
        var result = lineItemCtnr.getPaymentInstruments().size();
        assert.equal(0, result);

        lineItemCtnr.createPaymentInstrument('VIP_POINTS', new Money(20));
        giftCardHelper.removeGcPaymentInstruments(lineItemCtnr, '1234');
        result = lineItemCtnr.getPaymentInstruments().size();
        assert.equal(1, result);
    });

    it('Test removeGcPaymentInstruments method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createPaymentInstrument(gcPaymentMethodId, new Money(20));
        lineItemCtnr.createPaymentInstrument(gcPaymentMethodId, new Money(30));
        lineItemCtnr.createPaymentInstrument(ccPaymentMethodId, new Money(20));
        giftCardHelper.removeGcPaymentInstruments(lineItemCtnr);
        var result = lineItemCtnr.getPaymentInstruments().size();
        assert.equal(1, result);
    });

    it('Test applyGiftCard method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 10;
        var expectedResult = {
            balanceApplied: '$10',
            balanceRemaining: '$90',
            gcNumber: '7777007070034567',
            isOrderTotalRedeemed: true,
            maskedGcLastFourNumber: '4567',
            maskedGcNumber: '************4567',
            maskedGcPin: '******59',
            message: 'testMsg',
            success: true
        };
        var result = giftCardHelper.applyGiftCard(lineItemCtnr, '7777007070034567', '07068859');
        assert.deepEqual(expectedResult, result);

        result = giftCardHelper.applyGiftCard(lineItemCtnr, '7777007070034567', '07068859');
        assert.isTrue(result.isOrderTotalRedeemed);

        const gcPaymentInstruments = lineItemCtnr.getPaymentInstruments(gcPaymentMethodId);
        if (gcPaymentInstruments.size() > 0) {
            var gcPaymentInstrumentsIt = gcPaymentInstruments.iterator();
            while (gcPaymentInstrumentsIt.hasNext()) {
                var gcInstrument = gcPaymentInstrumentsIt.next();
                // eslint-disable-next-line no-loop-func
                var value = gcInstrument.custom.gcNumber;
                gcInstrument.custom.gcNumber = {
                    value: value,
                    // eslint-disable-next-line no-loop-func
                    equals(input) {
                        return value === input;
                    }
                };
            }
        }

        lineItemCtnr.totalGrossPrice.value = 300;
        result = giftCardHelper.applyGiftCard(lineItemCtnr, '7777007070034050', '07068859');
        assert.equal(result.gcNumber, '7777007070034050');
    });

    it('Test giftCardFormData method', function () {
        var basket = new LineItemCtnr();
        basket.totalGrossPrice.value = 10;
        giftCardHelper.applyGiftCard(basket, '7777007070034567', '07068859');
        var BasketMgr = require('../../../mocks/dw/dw_order_BasketMgr');
        var BasketMgrObj = new BasketMgr();
        BasketMgr.setCurrentBasket(basket);
        var result = giftCardHelper.giftCardFormData('csrf');
        assert.equal('$0.00', result.gcResults.getRemaingBalance);
        assert.equal(true, result.gcResults.isOrderTotalRedeemed);
    });

    it('Test getGcPaymentInstruments method', function () {
        const lineItemCtnr = new LineItemCtnr();
        var expectedGiftCards = [
            {
                'gcBalanceRemaining': false,
                'gcNumber': '7777007069967974',
                'gcPin': '91260152',
                'maskedGcLastFourNumber': '7974',
                'maskedGcNumber': '**** **** **** 7974',
                'maskedGcPin': '**** **52',
                'uuid': '1234567890',
                'appliedAmount': '$20'
            },
            {
                'gcBalanceRemaining': false,
                'gcNumber': '7777007069967974',
                'gcPin': '91260152',
                'maskedGcLastFourNumber': '7974',
                'maskedGcNumber': '**** **** **** 7974',
                'maskedGcPin': '**** **52',
                'uuid': '1234567890',
                'appliedAmount': '$30'
            }
        ];
        lineItemCtnr.createPaymentInstrument(gcPaymentMethodId, new Money(20));
        lineItemCtnr.createPaymentInstrument(gcPaymentMethodId, new Money(30));
        var gcPaymentInstruments = giftCardHelper.getGcPaymentInstruments(lineItemCtnr);
        assert.deepEqual(expectedGiftCards, gcPaymentInstruments);
    });

    it('Test basketHasOnlyEGiftCards method', function () {
        const currentBasket = createApiBasket(true);
        var spy = sinon.spy(currentBasket.productLineItems.toArray()[0], 'setQuantityValue');
        spy.withArgs(1);

        cartHelpers.addProductToCart(currentBasket, 'someProductID', 1, [], mockOptions);
        assert.isTrue(spy.calledOnce);
        currentBasket.productLineItems.toArray()[0].setQuantityValue.restore();

        var result = giftCardHelper.basketHasOnlyEGiftCards(currentBasket);
        assert.equal(true, result);
    });

    it('Test basketHasEGiftCards method', function () {
        const currentBasket = createApiBasket(true);
        var spy = sinon.spy(currentBasket.productLineItems.toArray()[0], 'setQuantityValue');
        spy.withArgs(1);

        cartHelpers.addProductToCart(currentBasket, 'someProductID', 1, [], mockOptions);
        assert.isTrue(spy.calledOnce);
        currentBasket.productLineItems.toArray()[0].setQuantityValue.restore();

        var result = giftCardHelper.basketHasEGiftCards(currentBasket);
        assert.equal(true, result);
    });

    it('Test getEGiftCardLineItems method', function () {
        const currentBasket = createApiBasket(true);
        var spy = sinon.spy(currentBasket.productLineItems.toArray()[0], 'setQuantityValue');
        spy.withArgs(1);

        cartHelpers.addProductToCart(currentBasket, 'someProductID', 1, [], mockOptions);
        assert.isTrue(spy.calledOnce);
        currentBasket.productLineItems.toArray()[0].setQuantityValue.restore();

        var result = giftCardHelper.getEGiftCardLineItems(currentBasket);
        var productLineItem = currentBasket.productLineItems.get(0);
        assert.deepEqual(productLineItem, result[0]);
    });

    it('Test updateGiftCardShipments method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'None'
                }
            },
            ID: 'test',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        giftCardHelper.updateGiftCardShipments(lineItemCtnr);
        assert.equal(1, lineItemCtnr.shipments.length);
        lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: 'test',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        giftCardHelper.updateGiftCardShipments(lineItemCtnr);
        assert.equal(2, lineItemCtnr.shipments.length);
    });

    it('Test removeEmptyShipments method', function () {
        const lineItemCtnr = new LineItemCtnr();
        var lineItem = lineItemCtnr.createProductLineItem(null, lineItemCtnr.getDefaultShipment());
        lineItemCtnr.getDefaultShipment().default = false;
        lineItemCtnr.getDefaultShipment().productLineItems = [];
        giftCardHelper.removeEmptyShipments(lineItemCtnr);
        assert.equal(0, lineItemCtnr.shipments.length);
    });

    it('Test updateEGiftCardData method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
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
        var BasketMgr = require('../../../mocks/dw/dw_order_BasketMgr');
        var BasketMgrObj = new BasketMgr();
        BasketMgr.setCurrentBasket(lineItemCtnr);
        giftCardHelper.updateEGiftCardData(productId, uuid, JSON.stringify(eGiftCardFormData));
        assert.equal('Yesh', lineItemCtnr.getProductLineItems().get(0).custom.gcFrom);
    });

    it('Test getTotalGiftCardsItems method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        var lineItem = lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        var result = giftCardHelper.getTotalGiftCardsItems(lineItemCtnr);
        assert.equal(2, result);

        lineItemCtnr.removeProductLineItem(lineItem);
        result = giftCardHelper.getTotalGiftCardsItems(lineItemCtnr);
        assert.equal(1, result);
    });

    it('Test basketHasGiftCard method', function () {
        const lineItemCtnr = new LineItemCtnr();
        var lineItem1 = lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        var lineItem2 = lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        var result = giftCardHelper.basketHasGiftCard(lineItemCtnr);
        assert.equal(true, result);

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
        lineItemCtnr.removeProductLineItem(lineItem1);
        lineItemCtnr.removeProductLineItem(lineItem2);
        result = giftCardHelper.basketHasGiftCard(lineItemCtnr);
        assert.equal(false, result);
    });
    it('Test getEGiftCardAmountRange method', function () {
        var result = giftCardHelper.getEGiftCardAmountRange();
        assert.equal(result, '$10 - $2000');
        Site.getCurrent().setCustomPreferenceValue('eGiftCardAmountMin', 100);
        Site.getCurrent().setCustomPreferenceValue('eGiftCardAmountMax', 100);
        result = giftCardHelper.getEGiftCardAmountRange();
        assert.equal(result, '$0 - $100');
    });

    it('Test getAppliedGiftCards method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 30;
        giftCardHelper.applyGiftCard(lineItemCtnr, '7777007070034567', '07068859');
        var result = giftCardHelper.getAppliedGiftCards(lineItemCtnr, false);
        assert.equal(result[0].amount, 30);
    });

    it('Test basketHasGCPaymentInstrument method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 30;
        giftCardHelper.applyGiftCard(lineItemCtnr, '7777007070034567', '07068859');
        var result = giftCardHelper.basketHasGCPaymentInstrument(lineItemCtnr);
        assert.isTrue(result);
    });

    it('Test giftCardOrderData method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.totalGrossPrice.value = 30;
        giftCardHelper.applyGiftCard(lineItemCtnr, '7777007070034567', '07068859');
        var result = giftCardHelper.giftCardOrderData(lineItemCtnr);
        assert.equal(result.getGcRedeemedAmount, '$30');
    });

    it('Test getGCShipmentBadge method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        var result = giftCardHelper.getGCShipmentBadge(lineItemCtnr);
        assert.equal(result, 'test');
    });

    it('Test orderTotalGCCouponAmount method', function () {
        const lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        lineItemCtnr.createPaymentInstrument(gcPaymentMethodId, new Money(90));
        var result = giftCardHelper.orderTotalGCCouponAmount(lineItemCtnr);
        assert.equal(result.nonGCPaymentRemainingBalance, '$0');
    });

    xit('Test giftCardOrderData method', function () {
        global.request = {
            locale: 'en_US'
        };
        global.session = {
            custom: {
                customerCountry: 'US'
            }
        };
        const order = new LineItemCtnr();
        order.totalGrossPrice.value = 30;
        giftCardHelper.applyGiftCard(order, '7777007070034567', '07068859');
        var result = giftCardHelper.authorizeGiftCards(order);
        assert.isTrue(result.success);
    });

    it('Test eGiftCardDateValidatation method', function () {
        var eGiftCardDeliveryDate = new Date();
        var result = giftCardHelper.eGiftCardDateValidatation(eGiftCardDeliveryDate);
        assert.isTrue(result);
    });

    it('Test eGCDataToeGiftForm method', function () {
        const lineItemCtnr = new LineItemCtnr();
        var eGiftCardFormData = {
            egiftcard: {
                gcRecipientName: {
                    setValue: function () { },
                    getValue: function () { return 'aaaa'; }
                },
                gcRecipientEmail: {
                    setValue: function () { }
                },
                gcFrom: {
                    setValue: function () { }
                },
                gcAmount: {
                    setValue: function () { }
                },
                gcDeliveryDate: {
                    setValue: function () { }
                },
                gcMessage: {
                    setValue: function () { }
                }
            }
        };
        lineItemCtnr.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, lineItemCtnr.getDefaultShipment());
        var result = giftCardHelper.eGCDataToeGiftForm(lineItemCtnr, eGiftCardFormData);
        assert.equal(result.egiftcard.gcRecipientName.getValue(), 'aaaa');
    });

    it('Test eGCDataToeGiftForm method', function () {
        var lineItemCtnr;
        var eGiftCardFormData = {
            egiftcard: {
                gcRecipientName: {
                    setValue: function () { },
                    getValue: function () { return 'aaaa'; }
                },
                gcRecipientEmail: {
                    setValue: function () { }
                },
                gcFrom: {
                    setValue: function () { }
                },
                gcAmount: {
                    setValue: function () { }
                },
                gcDeliveryDate: {
                    setValue: function () { }
                },
                gcMessage: {
                    setValue: function () { }
                }
            },
            clear: function () { }
        };
        var result = giftCardHelper.eGCDataToeGiftForm(lineItemCtnr, eGiftCardFormData);
        assert.equal(result.egiftcard.gcRecipientName.getValue(), 'aaaa');
    });

    it('Test copyeGiftCardFromListToWishlist method', function () {
        var wishlistModel = {
            items: [{
                product: {
                    custom: {
			            giftCard: {
			                value: 'EGIFT_CARD'
			            },
			            'gcRecipientName': 'aaaa',
			            'gcRecipientEmail': 'amedhegar@pfsweb.com',
			            'gcFrom': 'Yesh',
			            'gcAmount': 100,
			            'gcDeliveryDate': '2020-05-05',
			            'gcMessage': 'Happy new year'
			       		 }
                },
                custom: {
			            giftCard: {
			                value: 'EGIFT_CARD'
			            },
			            'gcRecipientName': 'aaaa',
			            'gcRecipientEmail': 'amedhegar@pfsweb.com',
			            'gcFrom': 'Yesh',
			            'gcAmount': 100,
			            'gcDeliveryDate': '2020-05-05',
			            'gcMessage': 'Happy new year'
			       		 }
                
            }]
        };
        var list = {
            items: [{
                product: {
                    custom: {
			            giftCard: {
			                value: 'EGIFT_CARD'
			            }
			        }
                },
                custom: {
			            giftCard: {
			                value: 'EGIFT_CARD'
			            }
			        }
            }]
        };
        giftCardHelper.copyeGiftCardFromListToWishlist(list, wishlistModel);
        assert.equal(wishlistModel.items[0].product.custom.gcRecipientName, 'aaaa');
    });

    xit('Test handleGiftCardPayment method', function () {
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        var req = {
            session: {
                privacyCache: {
                    set: function () {
                        return '';
                    },
                    get: function () {
                        return '';
                    }
                }
            },
            locale: {
                id: 'someId'
            }
        };
        var res = {
            setViewData: function (data) {
                return data;
            }
        };
        basket.createPaymentInstrument(gcPaymentMethodId, new Money(90));
        var result = giftCardHelper.handleGiftCardPayment(req, res);
        assert.isDefined(result);
    });

    it('Test updatePaymentTransaction method', function () {
        const basket = new LineItemCtnr();
        delete basket.customer.profile.custom.vipAccountId;
        basket.totalGrossPrice.value = 30;        
        giftCardHelper.applyGiftCard(basket, '7777007070034567', '07068859');
        basket.totalGrossPrice.value = 50;
        giftCardHelper.updatePaymentTransaction(basket);
        var gcPaymentInstruments = basket.getPaymentInstruments(gcPaymentMethodId).items[0];
        assert.equal(gcPaymentInstruments.paymentTransaction.amount.value, 50);

        basket.totalGrossPrice.value = 200;
        giftCardHelper.updatePaymentTransaction(basket);
        gcPaymentInstruments = basket.getPaymentInstruments(gcPaymentMethodId).items[0];
        assert.equal(gcPaymentInstruments.paymentTransaction.amount.value, 100);

        var fromPromo = 'Test';
        basket.totalGrossPrice.value = 200;
        giftCardHelper.updatePaymentTransaction(basket, fromPromo);
        gcPaymentInstruments = basket.getPaymentInstruments(gcPaymentMethodId).items[0];
        assert.equal(gcPaymentInstruments.paymentTransaction.amount.value, 100);
    });
});

describe('app_ua_core/cartridge/scripts/giftcard/hooks/giftcardHooks test', () => {
    it('Test Authorize  method', function () {
        global.request = {
            locale: 'en_US'
        };
        global.session = {
            custom: {
                customerCountry: 'US'
            }
        };
        const basket = new LineItemCtnr();
        basket.totalGrossPrice.value = 30;
        giftCardHelper.applyGiftCard(basket, '7777007070034567', '07068859');
        var gcPaymentInstruments = basket.getPaymentInstruments(gcPaymentMethodId).items[0];
        // eslint-disable-next-line new-cap
        var BasketMgr = require('../../../mocks/dw/dw_order_BasketMgr');
        var BasketMgrObj = new BasketMgr();
        BasketMgr.setCurrentBasket(basket);
        // eslint-disable-next-line new-cap
        var result = giftCardHooks.Authorize('123455677', gcPaymentInstruments);
        assert.equal(result.giftCardData.transactionNumber, '234567890');
    });

    it('Test Handle method', function () {
        // eslint-disable-next-line new-cap
        var result = giftCardHooks.Handle();
        assert.equal(result.error, false);
    });

    it('Test processForm method', function () {
        // eslint-disable-next-line new-cap
        var result = giftCardHooks.processForm({});
        assert.equal(result.error, false);
    });

    it('Test reverseGiftCardsAmount  method', function () {
        const basket = new LineItemCtnr();
        basket.totalGrossPrice.value = 30;
        giftCardHelper.applyGiftCard(basket, '7777007070034567', '07068859');
        // eslint-disable-next-line new-cap
        var result = giftCardHooks.reverseGiftCardsAmount(basket);
        assert.equal(result.success, true);
    });
});

