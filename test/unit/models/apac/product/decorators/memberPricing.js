'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var object = {};
describe('app_ua_apac/cartridge/models/product/decorators/memberPricing.js', () => {
    it('Testing memberPricing.js', () => {
        var memberPricing = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/models/product/decorators/memberPricing.js', {
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        custom: {
                            body: {
                                markup: 'content'
                            }
                        }
                    };
                }
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            'dw/campaign/PromotionMgr': {
                getActivePromotions: function () {
                    return {
                        getProductPromotionsForDiscountedProduct(prod) {
                            return {
                                empty: true
                            };
                        }
                    };
                }
            }
        });

        memberPricing(object, {});
        assert.isFalse(object.memberPricing.hasMemberPrice);
        assert.equal(object.memberPricing.memberPricingUnlockCTA, 'content');

        memberPricing = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/models/product/decorators/memberPricing.js', {
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        custom: {
                            body: {
                                markup: 'content'
                            }
                        }
                    };
                }
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            'dw/campaign/PromotionMgr': {
                getActivePromotions: function () {
                    return {
                        getProductPromotionsForDiscountedProduct(prod) {
                            return {
                                empty: false,
                                toArray: function () {
                                    return [{
                                        ID: 'test',
                                        custom: {
                                            isMemberPricingPromo: false
                                        }
                                    }];
                                }
                            };
                        }
                    };
                }
            }
        });

        object = {};
        memberPricing(object, {});
        assert.isFalse(object.memberPricing.hasMemberPrice);
        assert.equal(object.memberPricing.memberPricingUnlockCTA, 'content');

        memberPricing = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/models/product/decorators/memberPricing.js', {
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        custom: {
                            body: {
                                markup: 'content'
                            }
                        }
                    };
                }
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            'dw/campaign/PromotionMgr': {
                getActivePromotions: function () {
                    return {
                        getProductPromotionsForDiscountedProduct() {
                            return {
                                empty: false,
                                toArray: function () {
                                    return [{
                                        ID: 'test',
                                        custom: {
                                            isMemberPricingPromo: true
                                        },
                                        getPromotionalPrice: function () {
                                            return {
                                                currencyCode: 'SGD',
                                                available: true
                                            };
                                        }
                                    }];
                                }
                            };
                        }
                    };
                },
                getActiveCustomerPromotions: function () {
                    return {
                        getProductPromotionsForDiscountedProduct() {
                            return {
                                empty: false,
                                toArray: function () {
                                    return [{
                                        ID: 'test',
                                        custom: {
                                            isMemberPricingPromo: true
                                        }
                                    }];
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: () => 'rendered HTML'
            }
        });
        object = {
            appliedPromotions: ['']
        };
        memberPricing(object, {});
        assert.isTrue(object.memberPricing.hasMemberPrice);
        assert.equal(object.memberPricing.memberPricingUnlockCTA, 'content');

        memberPricing = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/models/product/decorators/memberPricing.js', {
            'dw/content/ContentMgr': {
                getContent: function (id) {
                    if (id === 'member-pricing-unlock-message') {
                        return null;
                    }
                    if (id === 'member-pricing-cta-unlock') {
                        return null;
                    }
                    return {
                        custom: {
                            body: {
                                markup: 'content'
                            }
                        }
                    };
                }
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            'dw/campaign/PromotionMgr': {
                getActivePromotions: function () {
                    return {
                        getProductPromotionsForDiscountedProduct() {
                            return {
                                empty: false,
                                toArray: function () {
                                    return [{
                                        ID: 'test',
                                        custom: {
                                            isMemberPricingPromo: true
                                        },
                                        getPromotionalPrice: function () {
                                            return {
                                                currencyCode: 'SGD',
                                                available: true
                                            };
                                        }
                                    }];
                                }
                            };
                        }
                    };
                },
                getActiveCustomerPromotions: function () {
                    return {
                        getProductPromotionsForDiscountedProduct() {
                            return {
                                empty: false,
                                toArray: function () {
                                    return [{
                                        ID: 'test',
                                        custom: {
                                            isMemberPricingPromo: true
                                        }
                                    }];
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: () => 'rendered HTML'
            }
        });

        session.customer.registered = true;
        session.customer.authenticated = true;
        object = {};
        memberPricing(object, {});
        assert.isTrue(object.memberPricing.hasMemberPrice);

        memberPricing = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/models/product/decorators/memberPricing.js', {
            'dw/content/ContentMgr': {
                getContent: function (id) {
                    if (id === 'member-pricing-unlock-message') {
                        return null;
                    }
                    if (id === 'member-pricing-cta-unlock') {
                        return null;
                    }
                    if (id === 'member-pricing-badge') {
                        return null;
                    }
                    return {
                        custom: {
                            body: {
                                markup: 'content'
                            }
                        }
                    };
                }
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            'dw/campaign/PromotionMgr': {
                getActivePromotions: function () {
                    return {
                        getProductPromotionsForDiscountedProduct() {
                            return {
                                empty: false,
                                toArray: function () {
                                    return [{
                                        ID: 'test',
                                        custom: {
                                            isMemberPricingPromo: true
                                        },
                                        getPromotionalPrice: function () {
                                            return {
                                                currencyCode: 'SGD',
                                                available: true
                                            };
                                        }
                                    }];
                                }
                            };
                        }
                    };
                },
                getActiveCustomerPromotions: function () {
                    return {
                        getProductPromotionsForDiscountedProduct() {
                            return {
                                empty: true
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: () => 'rendered HTML'
            }
        });

        object = {};
        memberPricing(object, {});
        assert.isTrue(object.memberPricing.hasMemberPrice);
    });
});
