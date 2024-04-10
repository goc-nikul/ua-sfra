'use strict';


const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var Collections = require('../../../mocks/dw/dw_util_Collection');

describe('int_ocapi/cartridge/scripts/paymentHelper.js', () => {
    var paymentHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/paymentHelper.js', {
        'dw/system/HookMgr': {
            callHook: function () {
                return {
                    error: false
                };
            },
            hasHook: function () {
                return true;
            }
        },
        'dw/system/Status': function () {},
        '*/cartridge/scripts/helpers/sitePreferencesHelper': {
            isAurusEnabled: function () {
                return true;
            }
        },
        'dw/order/BasketMgr': {
            getCurrentBasket: function () {
                return {
                    getPaymentInstruments: function () {
                        return {};
                    },
                    removePaymentInstrument: function () {
                        return {};
                    }
                };
            }
        },
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            calculateNonGiftCertificateAmount: function () {
                return {};
            }
        },
        '*/cartridge/scripts/giftcard/giftcardHelper': {
            basketHasGCPaymentInstrument: function () {
                return {};
            },
            updatePaymentTransaction: function () {
                return {};
            },
            getRemainingBalance: function () {
                return {};
            }
        },
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/util/loggerHelper': {
            logException: function () {
                return {};
            }
        }
    });

    it('Testing updatePaymentInstrument', () => {
        var paymentInstrumentRequest = {
            paymentMethodId: 'paymentMethodId'
        };
        var result = paymentHelper.updatePaymentInstrument(paymentInstrumentRequest);
        assert.isNotNull(result);
    });

    it('Testing updatePaymentInstrument --> callHook return an error', () => {

        paymentHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/paymentHelper.js', {
            'dw/system/HookMgr': {
                callHook: function () {
                    return {
                        error: true
                    };
                },
                hasHook: function () {
                    return true;
                }
            },
            'dw/system/Status': function () {},
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                    return true;
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/giftcard/giftcardHelper': {},
            'dw/system/Transaction': {},
            '*/cartridge/scripts/util/loggerHelper': {
                logException: function () {
                    return {};
                }
            }
        });
        var paymentInstrumentRequest = {
            paymentMethodId: 'paymentMethodId'
        };
        var result = paymentHelper.updatePaymentInstrument(paymentInstrumentRequest);
        assert.isNotNull(result);
    });

    it('Testing adjustPaymentInstrument', () => {
        var paymentInstrumentRequest = {
            paymentMethodId: 'paymentMethodId'
        };
        var result = paymentHelper.adjustPaymentInstrument(paymentInstrumentRequest);
        assert.isNotNull(result);
    });

    it('Testing adjustPaymentInstrument --> callHook return an error', () => {
        paymentHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/paymentHelper.js', {
            'dw/system/HookMgr': {
                callHook: function () {
                    return {
                        error: false
                    };
                },
                hasHook: function () {
                    return true;
                }
            },
            'dw/system/Status': function () {},
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                    return true;
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/giftcard/giftcardHelper': {},
            'dw/system/Transaction': {},
            '*/cartridge/scripts/util/loggerHelper': {
                logException: function () {
                    return {};
                }
            }
        });
        var paymentInstrumentRequest = {
            paymentMethodId: 'paymentMethodId'
        };
        var result = paymentHelper.adjustPaymentInstrument(paymentInstrumentRequest);
        assert.isNotNull(result);
    });

    it('Testing adjustPaymentInstrument --> callHook return an error with result code', () => {
        paymentHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/paymentHelper.js', {
            'dw/system/HookMgr': {
                callHook: function () {
                    return {
                        error: true,
                        errorCode: 'errorCode'
                    };
                },
                hasHook: function () {
                    return true;
                }
            },
            'dw/system/Status': function () {},
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                    return true;
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/giftcard/giftcardHelper': {},
            'dw/system/Transaction': {},
            '*/cartridge/scripts/util/loggerHelper': {
                logException: function () {
                    return {};
                }
            }
        });
        var paymentInstrumentRequest = {
            paymentMethodId: 'paymentMethodId'
        };
        var result = paymentHelper.adjustPaymentInstrument(paymentInstrumentRequest);
        assert.isNotNull(result);
    });

    it('Testing modifyPaymentResponse', () => {
        var paymentInstrumentRequest = {
            paymentMethodId: 'paymentMethodId'
        };
        var result = paymentHelper.modifyPaymentResponse({}, {}, paymentInstrumentRequest);
        assert.isNotNull(result);
    });

    it('Testing modifyPaymentResponse --> callHook return an error', () => {
        paymentHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/paymentHelper.js', {
            'dw/system/HookMgr': {
                callHook: function () {
                    return {
                        error: false
                    };
                },
                hasHook: function () {
                    return true;
                }
            },
            'dw/system/Status': function () {},
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                    return true;
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/giftcard/giftcardHelper': {},
            'dw/system/Transaction': {},
            '*/cartridge/scripts/util/loggerHelper': {
                logException: function () {
                    return {};
                }
            }
        });
        var paymentInstrumentRequest = {
            paymentMethodId: 'paymentMethodId'
        };
        var result = paymentHelper.modifyPaymentResponse({}, {}, paymentInstrumentRequest);
        assert.isNotNull(result);
    });

    it('Testing autoAdjustBasketPaymentInstruments', () => {
        paymentHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/paymentHelper.js', {
            'dw/system/HookMgr': {
                callHook: function () {
                    return {
                        error: false
                    };
                },
                hasHook: function () {
                    return true;
                }
            },
            'dw/system/Status': function () {},
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                    return true;
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {
                        getPaymentInstruments: function () {
                            return paymentInstrument;
                        },
                        removePaymentInstrument: function () {
                            return {};
                        }
                    };
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                calculateNonGiftCertificateAmount: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGCPaymentInstrument: function () {
                    return {};
                },
                updatePaymentTransaction: function () {
                    return {};
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/loggerHelper': {
                logException: function () {
                    return {};
                }
            }
        });
        var Money = require('../../../mocks/dw/dw_value_Money');
        var PaymentInstrument = require('../../../mocks/dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument('testID', new Money(10));
        var basket = {};
        basket.getPaymentInstruments = function () {
            return new Collections({
                getPaymentMethod: function () {
                    return 'PayPal';
                },
                paymentTransaction: {
                    setAmount: function () {
                        return {};
                    }
                }
            },
            );
        };
        var result = paymentHelper.autoAdjustBasketPaymentInstruments(basket);
        assert.isNotNull(result);
    });

    it('Testing autoAdjustBasketPaymentInstruments --> nonGiftCertificateAmount less than 0', () => {
        paymentHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/paymentHelper.js', {
            'dw/system/HookMgr': {
                callHook: function () {
                    return {
                        error: false
                    };
                },
                hasHook: function () {
                    return true;
                }
            },
            'dw/system/Status': function () {},
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                    return true;
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {
                        getPaymentInstruments: function () {
                            return paymentInstrument;
                        },
                        removePaymentInstrument: function () {
                            return {};
                        }
                    };
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                calculateNonGiftCertificateAmount: function () {
                    return {
                        value: -1
                    };
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGCPaymentInstrument: function () {
                    return {};
                },
                updatePaymentTransaction: function () {
                    return {};
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/loggerHelper': {
                logException: function () {
                    return {};
                }
            }
        });
        var Money = require('../../../mocks/dw/dw_value_Money');
        var PaymentInstrument = require('../../../mocks/dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument('testID', new Money(10));
        var basket = {};
        basket.removePaymentInstrument = function () {
            return {};
        };
        basket.getPaymentInstruments = function () {
            return new Collections({
                getPaymentMethod: function () {
                    return 'PayPal';
                },
                paymentTransaction: {
                    setAmount: function () {
                        return {};
                    }
                }
            },
            );
        };
        var result = paymentHelper.autoAdjustBasketPaymentInstruments(basket);
        assert.isNotNull(result);
    });

    it('Testing updateRemainingBalance', () => {
        paymentHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/paymentHelper.js', {
            'dw/system/HookMgr': {
                callHook: function () {
                    return {
                        error: false
                    };
                },
                hasHook: function () {
                    return true;
                }
            },
            'dw/system/Status': function () {},
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                    return true;
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {
                        getPaymentInstruments: function () {
                            return {};
                        },
                        removePaymentInstrument: function () {
                            return {};
                        }
                    };
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                calculateNonGiftCertificateAmount: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGCPaymentInstrument: function () {
                    return {};
                },
                updatePaymentTransaction: function () {
                    return {};
                },
                getRemainingBalance: function () {
                    return {};
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/loggerHelper': {
                logException: function () {
                    return {};
                }
            }
        });
        var result = paymentHelper.updateRemainingBalance({}, {});
        assert.isNotNull(result);
    });

    it('Testing patchPaymentInstrument', () => {
        paymentHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/paymentHelper.js', {
            'dw/system/HookMgr': {
                callHook: function () {
                    return {
                        error: false
                    };
                },
                hasHook: function () {
                    return true;
                }
            },
            'dw/system/Status': function () {},
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                    return true;
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {
                        getPaymentInstruments: function () {
                            return {};
                        },
                        removePaymentInstrument: function () {
                            return {};
                        }
                    };
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                calculateNonGiftCertificateAmount: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGCPaymentInstrument: function () {
                    return {};
                },
                updatePaymentTransaction: function () {
                    return {};
                },
                getRemainingBalance: function () {
                    return {};
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/loggerHelper': {
                logException: function () {
                    return {};
                }
            }
        });
        var paymentInstrumentRequest = {
            paymentMethodId: 'paymentMethodId'
        };
        var result = paymentHelper.patchPaymentInstrument({}, {}, paymentInstrumentRequest);
        assert.isNotNull(result);
    });

    it('Testing patchPaymentInstrument --> failuer case-callHook return error', () => {
        paymentHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/paymentHelper.js', {
            'dw/system/HookMgr': {
                callHook: function () {
                    return {
                        error: true
                    };
                },
                hasHook: function () {
                    return true;
                }
            },
            'dw/system/Status': function () {},
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                    return true;
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {
                        getPaymentInstruments: function () {
                            return {};
                        },
                        removePaymentInstrument: function () {
                            return {};
                        }
                    };
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                calculateNonGiftCertificateAmount: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGCPaymentInstrument: function () {
                    return {};
                },
                updatePaymentTransaction: function () {
                    return {};
                },
                getRemainingBalance: function () {
                    return {};
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/util/loggerHelper': {
                logException: function () {
                    return {};
                }
            }
        });
        var paymentInstrumentRequest = {
            paymentMethodId: 'paymentMethodId'
        };
        var result = paymentHelper.patchPaymentInstrument({}, {}, paymentInstrumentRequest);
        assert.isNotNull(result);
    });
});
