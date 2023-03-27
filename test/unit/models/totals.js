'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../mockModuleSuperModule');
var sinon = require('sinon');
var totals;
var TotalsModel;
var stubisKlarnaPaymentEnabled = sinon.stub();

function baseTotalsModelMock() {
    this.orderLevelDiscountTotal = {
        value: 0
    };
    this.shippingLevelDiscountTotal = {
        value: 0
    };
}

var total = {
    available: '',
    value: '40'
};

var priceAdjustment = {
    promotion: {
        calloutMsg: 'Hello',
        ID: '2HGDDJ',
        custom: {
            isEmployeeDiscount: true,
            isLoyaltyDiscount: true
        },
        getPromotionClass: function () {
            return {};
        }
    },
    price:{
        value:231
    }
};

var priceAdjustments = {
    item: [{
        promotion: [Object],
        price: 90
    }],
    basedOnCoupon: true,
    price: 67,
    empty: true,
    length: 1,
    promotion: {
        basedOnSourceCodes: [{
            ID: 'RTE345'
        }],
        sourceCodeGroups: [{
            ID: 'RTE345'
        }],
        custom: {
            isEmployeeDiscount: true,
            isLoyaltyDiscount: true
        }
    }
};

var couponLineItem = {
    priceAdjustments: [priceAdjustment],
    promotion: {
        calloutMsg: 'Hello',
        custom: {
            isEmployeeDiscount: true,
            discountValue: {
                value: 234
            },
            isLoyaltyDiscount: true
        },
        getPromotionClass: function () {
            return {};
        }
    }
};

var lineItemContainer = {
    getTotalGrossPrice: () => {
        return 30;
    },
    currencyCode: '$',
    couponLineItems: [couponLineItem],
    priceAdjustments: [priceAdjustments],
    allShippingPriceAdjustments: [priceAdjustments],
    custom: 'ABS',
    custom: {
        estimatedLoyaltyPoints: 93
    },
    getPriceAdjustments: () => {
        return {
            toArray: () => {
                return [priceAdjustments];
            }
        };
    },
    getAllProductLineItems: () => {
        return [{
            getPrice: () => {
                return {
                    subtract: () => {
                        return {
                            value: 123
                        }
                    }
                }
            },
            getAdjustedNetPrice: () => {
                return {
                    price: 40
                }
            },
            product: {
                priceModel: 1,
                custom: {}
            },
            priceAdjustments: []
        },
        {
            getPrice: () => {
                return {
                    subtract: () => {
                        return {
                            value: 0
                        };
                    }
                };
            },
            getAdjustedNetPrice: () => {
                return {
                    price: 0
                }
            },
            product: null,
            priceAdjustments: []
        }
    ]
    },
    getAdjustedMerchandizeTotalPrice: () => {
        return {
            subtract: () => {
                return {
                    add: () => {
                        return {
                            value: 345
                        }
                    }
                }
            }
        }
    },
    shippingTotalPrice: total,
    getMerchandizeTotalPrice: () => {
        return total;
    },
    price: {
        value: 100
    }
}

var Template = function () {
    return {
        render: function () {
            return {
                text: 'returning text'
            }
        }
    }
};

function ContentModel() {
    return this;
}

global.empty = function (params) {
    return !params;
}

describe('app_ua_core/cartridge/models/totals.js', () => {

    before(() => {
        mockSuperModule.create(baseTotalsModelMock);

        TotalsModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/totals.js', {
            'dw/util/HashMap' : require('../../mocks/dw/dw_util_HashMap'),
            'dw/util/Template' : Template,
            '*/cartridge/scripts/util/collections' : require('../../mocks/scripts/util/collections.js'),
            'dw/util/StringUtils' : {
                formatMoney : function () {
                    return 'formatted money';
                }
            },
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            '*/cartridge/scripts/marketing/klarnaOSM': {
                formatPurchaseAmount : function () {
                    return 657;
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                isKlarnaPaymentEnabled : stubisKlarnaPaymentEnabled
            },
            'dw/content/ContentMgr': {
                getContent: function () {
                    return 'content'
                }
            },
            '*/cartridge/models/content': ContentModel,
            'dw/system/Site': {

                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'MX';
                        }
                    };
                }
            },
            '*/cartridge/scripts/factories/price': {
                getListPrice: function () {
                    return null;
                }
            }
        });
    });

    it('Testing for store model is null', () => {
        totals = new TotalsModel();

        assert.isNotNull(totals, 'online should not exists');
    });

    it('Testing for store model is not null', () => {
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing totals model for available value', () => {
        lineItemContainer.shippingTotalPrice.available = 10;
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing totals model for available value is null', () => {
        lineItemContainer.shippingTotalPrice.available = null;
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing totals model for priceAdjustments isEmployeeDiscount is null', () => {
        couponLineItem.promotion.custom.isEmployeeDiscount = null;
        lineItemContainer.couponLineItems = [couponLineItem];
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing totals model for priceAdjustments isLoyaltyDiscount is null', () => {
        couponLineItem.promotion.custom.isLoyaltyDiscount = null;
        lineItemContainer.couponLineItems = [couponLineItem];
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing totals model for priceAdjustment promotion is null', () => {
        couponLineItem.priceAdjustments.promotion = null;
        lineItemContainer.couponLineItems = [couponLineItem];
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing totals model for priceAdjustment promotion is null', () => {
        priceAdjustment.promotion = null;
        couponLineItem.priceAdjustments = [priceAdjustment];
        lineItemContainer.couponLineItems = [couponLineItem];
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing totals model for couponLineItem promotion is null', () => {
        couponLineItem.promotion = null;
        lineItemContainer.couponLineItems = [couponLineItem];
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing totals model for couponLineItem priceAdjustment length is null', () => {
        couponLineItem.priceAdjustments.length = null;
        lineItemContainer.couponLineItems = [couponLineItem];
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing totals model for lineItemContainer custom is null', () => {
        lineItemContainer.custom.estimatedLoyaltyPoints = null;
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing stubisKlarnaPaymentEnabled is enabled', () => {
        stubisKlarnaPaymentEnabled.returns(true);
        stubisKlarnaPaymentEnabled.reset();

        totals = new TotalsModel(lineItemContainer);
        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing stubisKlarnaPaymentEnabled is disabled', () => {
        stubisKlarnaPaymentEnabled.returns(false);
        stubisKlarnaPaymentEnabled.reset();

        totals = new TotalsModel(lineItemContainer);
        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing totals model for priceAdjustments basedOnCoupon is null', () => {
        priceAdjustments.basedOnCoupon = null;
        lineItemContainer.priceAdjustments = [priceAdjustments];
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing totals model for priceAdjustments promotion is null', () => {
        lineItemContainer.priceAdjustments = [priceAdjustments];
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
    });
});
