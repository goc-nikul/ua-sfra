'use strict';

const {
    assert
} = require('chai');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class Bytes {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }
    toString() {
        return this.secretKey;
    }
}

class Cipher {
    encrypt(input) {
        return input;
    }
}

class Test {
    constructor(product) {
        this.product = product;
    }
}

var images = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/product/decorators/images', {
    '~/cartridge/models/product/productImages': Test
});

var OrderUtils = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/OrderUtils', {
    'dw/crypto/Encoding': {
        toBase64: function(input) {
            return input;
        }
    },
    'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
    'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
    'dw/crypto/Cipher': Cipher,
    'dw/util/Bytes': Bytes,
    'int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds': {
        prepareURLForLocale: function(url, locale) {
            return url + '/' + locale;
        }
    },
    '*/cartridge/models/product/decorators/images': images
});
        
var Site = {
    current: {}
};
var utilHelper = {
    orderStatusModel: () => {
        return {
            DELIVERED: null
        };
    },
    fulfillmentStatus: () => {
        return {
            DELIVERED: null
        };
    },
    bopisOrderStatus: () => {
        return {
            '': null
        };
    },
    orderStatusMapping: () => {
        return {
            DELIVERED: null
        };
    },
    bopisStatusMapping: () => {
        return {
            Fulfilled: 'PICKED_UP'
        };
    }
};

global.empty = (params) => !params;

function Calendar() {
    this.add = () => null;
    this.toTimeString = () => null;
    this.before = () => false;
}

function Calendarbefore() {
    this.add = () => null;
    this.toTimeString = () => null;
    this.before = () => true;
}

describe('int_OIS/cartridge/models/OIS/order.js', () => {

    it('Testing model with edges is empty and orderDeliverThresholdDays is null', () => {
        Site.current = {
            getCustomPreferenceValue: () => null
        };
        global.request = {
            httpPath: 'order-Detail'
        };
        var OrderModel = proxyquire('../../../../cartridges/int_OIS/cartridge/models/OIS/order.js', {
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/utilHelper': utilHelper,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/Calendar': {},
            'dw/system/System': require('../../../mocks/dw/dw_system_System'),
            'dw/system/Site': Site,
            'dw/catalog/ProductMgr': {},
            'dw/catalog/StoreMgr': {},
            'app_ua_core/cartridge/scripts/util/OrderUtils' : OrderUtils
        });
        var order;
        assert.doesNotThrow(() => {
            var customerOrders = {
                edges: []
            };
            order = new OrderModel(customerOrders);
        });
        assert.isDefined(order, 'order is not defined');
        assert.isNotNull(order, 'order is null');
        delete Site.current.getCustomPreferenceValue;
    });

    it('Testing model with edges is not empty and orderDeliverThresholdDays is null and in Order detail page with product offline', () => {
        Site.current = {
            getCustomPreferenceValue: () => 10
        };
        global.request = {
            httpPath: 'Account-Show'
        };

        utilHelper.orderStatusModel = () => {
            return {
                DELIVERED: null
            };
        };

        var OrderModel = proxyquire('../../../../cartridges/int_OIS/cartridge/models/OIS/order.js', {
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/utilHelper': utilHelper,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/Calendar': Calendar,
            'dw/system/System': {
                getCalendar: () => {
                    return {
                        add: () => null,
                        getTime: () => {
                            return {
                                getTime: () => 100000
                            }
                        }
                    };
                }
            },
            'dw/system/Site': Site,
            'dw/catalog/ProductMgr': {
                getProduct: () => {
                    return {
                        online: false
                    };
                }
            },
            'dw/catalog/StoreMgr': {},
            'app_ua_core/cartridge/scripts/util/OrderUtils' : OrderUtils
        });
        var order;
        assert.doesNotThrow(() => {
            var customerOrders = {
                edges: [{
                    node: {
                        status: 'DELIVERED',
                        creationDate: new Date(),
                        orderNo: '100',
                        orderItems: [{
                            productItem: {
                                product: {
                                    upc: '000'
                                }
                            }
                        }],
                        fulfillmentGroups: [{
                            fulfillmentStatus: 'DELIVERED',
                            items: []
                        }]
                    }
                }]
            };
            order = new OrderModel(customerOrders);
        });
        assert.isDefined(order, 'order is not defined');
        assert.isNotNull(order, 'order is null');
        assert.isNotNull(order[0], 'order does not have any items');
        delete Site.current.getCustomPreferenceValue;
    });

    it('Testing model with edges is not empty and orderDeliverThresholdDays is null and in Order detail page with product online', () => {
        Site.current = {
            getCustomPreferenceValue: () => 10
        };
        global.request = {
            httpPath: 'Account-Show'
        };

        utilHelper.orderStatusModel = () => {
            return {
                DELIVERED: null
            };
        };

        var OrderModel = proxyquire('../../../../cartridges/int_OIS/cartridge/models/OIS/order.js', {
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/utilHelper': utilHelper,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/Calendar': Calendar,
            'dw/system/System': {
                getCalendar: () => {
                    return {
                        add: () => null,
                        getTime: () => {
                            return {
                                getTime: () => 100000
                            }
                        }
                    };
                }
            },
            'dw/system/Site': Site,
            'dw/catalog/ProductMgr': {
                getProduct: () => {
                    return {
                        online: true
                    };
                }
            },
            'dw/catalog/StoreMgr': {},
            'app_ua_core/cartridge/scripts/util/OrderUtils' : OrderUtils
        });
        var order;
        assert.doesNotThrow(() => {
            var customerOrders = {
                edges: [{
                    node: {
                        status: 'DELIVERED',
                        creationDate: new Date(),
                        orderNo: '100',
                        orderItems: [{
                            productItem: {
                                product: {
                                    upc: '000',
                                    copy: 'product-name',
                                    sku: '1234',
                                    assets: {
                                        images: null
                                    },
                                    color: 'black'
                                }
                            },
                            fulfillmentStatus: 'DELIVERED'
                        }],
                        fulfillmentGroups: [{
                            fulfillmentStatus: 'DELIVERED',
                            items: []
                        }]
                    }
                }]
            };
            order = new OrderModel(customerOrders);
        });
        assert.isDefined(order, 'order is not defined');
        assert.isNotNull(order, 'order is null');
        assert.isNotNull(order[0], 'order does not have any items');
        assert.equal(order[0].orderTotal, '$0');
        assert.isFalse(order[0].isOrderHasBopisItems);
        assert.equal(order[0].displayStatus, 'DELIVERED');
        assert.equal(order[0].orderItems[0].sku, '1234');
        assert.equal(order[0].orderItems[0].upc, '000');
        assert.equal(order[0].orderItems[0].color, 'black');
        delete Site.current.getCustomPreferenceValue;
    });

    it('Testing model with edges is not empty and orderDeliverThresholdDays is null and in Order detail page with product online with status SHIPPED', () => {
        Site.current = {
            getCustomPreferenceValue: () => 10
        };
        global.request = {
            httpPath: 'Account-Show'
        };

        utilHelper.orderStatusModel = () => {
            return {
                DELIVERED: null
            };
        };

        var OrderModel = proxyquire('../../../../cartridges/int_OIS/cartridge/models/OIS/order.js', {
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/utilHelper': utilHelper,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/Calendar': Calendar,
            'dw/system/System': {
                getCalendar: () => {
                    return {
                        add: () => null,
                        getTime: () => {
                            return {
                                getTime: () => 100000
                            }
                        }
                    };
                }
            },
            'dw/system/Site': Site,
            'dw/catalog/ProductMgr': {
                getProduct: () => {
                    return {
                        online: true
                    };
                }
            },
            'dw/catalog/StoreMgr': {
                getStore: () => {}
            },
            'app_ua_core/cartridge/scripts/util/OrderUtils' : OrderUtils
        });
        var order;
        assert.doesNotThrow(() => {
            var customerOrders = {
                edges: [{
                    node: {
                        status: 'SHIPPED',
                        creationDate: new Date(),
                        orderNo: '100',
                        orderItems: [{
                            productItem: {
                                product: {
                                    upc: '000',
                                    copy: 'product-name',
                                    sku: '1234',
                                    assets: {
                                        images: null
                                    },
                                    color: 'black'
                                }
                            },
                            fulfillmentStatus: 'SHIPPED',
                            storeId: '1234'
                        }],
                        fulfillmentGroups: [{
                            fulfillmentStatus: 'SHIPPED',
                            items: []
                        }]
                    }
                }]
            };
            order = new OrderModel(customerOrders);
        });
        assert.isDefined(order, 'order is not defined');
        assert.isNotNull(order, 'order is null');
        assert.isNotNull(order[0], 'order does not have any items');
        assert.equal(order[0].orderTotal, '$0');
        assert.isTrue(order[0].isOrderHasBopisItems);
        assert.equal(order[0].displayStatus, 'SHIPPED');
        assert.equal(order[0].orderItems[0].sku, '1234');
        assert.equal(order[0].orderItems[0].upc, '000');
        assert.equal(order[0].orderItems[0].color, 'black');
        delete Site.current.getCustomPreferenceValue;
    });

    it('Testing model with edges is not empty and orderDeliverThresholdDays is null and in Order detail page with product online with status DELIVERED', () => {
        Site.current = {
            getCustomPreferenceValue: () => 10
        };
        global.request = {
            httpPath: 'Account-Show'
        };

        utilHelper.orderStatusModel = () => {
            return {
                DELIVERED: null
            };
        };

        var OrderModel = proxyquire('../../../../cartridges/int_OIS/cartridge/models/OIS/order.js', {
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/utilHelper': utilHelper,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/Calendar': Calendar,
            'dw/system/System': {
                getCalendar: () => {
                    return {
                        add: () => null,
                        getTime: () => {
                            return {
                                getTime: () => 100000
                            }
                        }
                    };
                }
            },
            'dw/system/Site': Site,
            'dw/catalog/ProductMgr': {
                getProduct: () => {
                    return {
                        online: true
                    };
                }
            },
            'dw/catalog/StoreMgr': {
                getStore: () => {}
            },
            'app_ua_core/cartridge/scripts/util/OrderUtils' : OrderUtils
        });
        var order;
        assert.doesNotThrow(() => {
            var customerOrders = {
                edges: [{
                    node: {
                        status: 'SHIPPED',
                        creationDate: new Date(),
                        orderNo: '100',
                        orderItems: [{
                            productItem: {
                                product: {
                                    upc: '000',
                                    copy: {
                                        name: 'product-name'
                                    },
                                    sku: '1234',
                                    assets: {
                                        images: null
                                    },
                                    color: 'black'
                                }
                            },
                            fulfillmentStatus: 'DELIVERED',
                            storeId: '1234'
                        }],
                        fulfillmentGroups: [{
                            fulfillmentStatus: 'SHIPPED',
                            items: []
                        }]
                    }
                }]
            };
            order = new OrderModel(customerOrders);
        });
        assert.isDefined(order, 'order is not defined');
        assert.isNotNull(order, 'order is null');
        assert.isNotNull(order[0], 'order does not have any items');
        assert.equal(order[0].orderTotal, '$0');
        assert.isTrue(order[0].isOrderHasBopisItems);
        assert.equal(order[0].displayStatus, 'SHIPPED');
        assert.equal(order[0].orderItems[0].name, 'product-name');
        assert.equal(order[0].orderItems[0].sku, '1234');
        assert.equal(order[0].orderItems[0].upc, '000');
        assert.equal(order[0].orderItems[0].color, 'black');
        delete Site.current.getCustomPreferenceValue;
    });

    it('Testing model with edges is not empty and order detail page', () => {
        Site.current = {
            getCustomPreferenceValue: () => 10
        };
        global.request = {
            httpPath: 'Account-Show'
        };

        utilHelper.orderStatusModel = () => {
            return {
                DELIVERED: null
            };
        };

        var OrderModel = proxyquire('../../../../cartridges/int_OIS/cartridge/models/OIS/order.js', {
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/utilHelper': utilHelper,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/Calendar': Calendarbefore,
            'dw/system/System': {
                getCalendar: () => {
                    return {
                        add: () => null,
                        getTime: () => {
                            return {
                                getTime: () => 100000
                            }
                        }
                    };
                }
            },
            'dw/system/Site': Site,
            'dw/catalog/ProductMgr': {
                getProduct: () => {
                    return {
                        online: true
                    };
                }
            },
            'dw/catalog/StoreMgr': {
                getStore: () => {}
            },
            'app_ua_core/cartridge/scripts/util/OrderUtils' : OrderUtils
        });
        var order;
        assert.doesNotThrow(() => {
            var customerOrders = {
                edges: [{
                    node: {
                        status: 'SHIPPED',
                        creationDate: new Date(),
                        orderNo: '100',
                        orderItems: [{
                            productItem: {
                                product: {
                                    upc: '000',
                                    copy: {
                                        name: 'product-name'
                                    },
                                    sku: '1234',
                                    assets: {
                                        images: [{
                                            url: 'imageurl'
                                        }]
                                    },
                                    color: 'black'
                                }
                            },
                            fulfillmentStatus: 'DELIVERED',
                            storeId: '1234'
                        }],
                        fulfillmentGroups: [{
                            fulfillmentStatus: 'SHIPPED',
                            items: []
                        }]
                    }
                }]
            };
            order = new OrderModel(customerOrders);
        });
        assert.isDefined(order, 'order is not defined');
        assert.isNotNull(order, 'order is null');
        assert.isNotNull(order[0], 'order does not have any items');
    });

});
