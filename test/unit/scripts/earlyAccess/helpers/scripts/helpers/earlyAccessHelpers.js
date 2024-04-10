const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_earlyaccess/cartridge/scripts/helpers/earlyAccessHelpers', () => {
    var earlyAccessHelpers = proxyquire('../../../../../../../cartridges/int_earlyaccess/cartridge/scripts/helpers/earlyAccessHelpers', {
        'dw/content/ContentMgr': {
            getContent: function () {
                return {
                    online: true,
                    custom: {
                        body: {
                            markup: 'markup'
                        }
                    }
                };
            }
        },
        'dw/web/Resource': {
            msg: function (params) { return params; }
        },
        'dw/web/URLUtils': { url: function () { return 'URL'; } }
    });

    it('Testing method: checkEarlyAccess normal product', () => {
        var earlyAccess = earlyAccessHelpers.checkEarlyAccess({
            ID: '12345',
            custom: {
            }
        });
        assert.isObject(earlyAccess);
        assert.isFalse(earlyAccess.isEarlyAccessProduct);
        assert.isFalse(earlyAccess.hideProduct);
    });

    it('Testing method: checkEarlyAccess product with early access variant and master NO', () => {
        var earlyAccess = earlyAccessHelpers.checkEarlyAccess({
            ID: '12345',
            custom: {
                earlyAccessConfigs: {
                    value: 'NO'
                }
            },
            variant: true,
            getVariationModel: function () {
                return {
                    master: {
                        custom: {
                            earlyAccessConfigs: {
                                value: 'NO'
                            }
                        },
                    }
                };
            }
        });
        assert.isObject(earlyAccess);
        assert.isFalse(earlyAccess.isEarlyAccessProduct);
        assert.isFalse(earlyAccess.hideProduct);
    });

    it('Testing method: checkEarlyAccess product with early access variant NO and master YES', () => {
        session.customer = {
            registered: true,
            authenticated: true,
            externallyAuthenticated: true,
            getCustomerGroups: function () {
                return {
                    toArray: function () {
                        return [{
                            ID: 'test'
                        }];
                    }
                };
            }
        };
        var earlyAccess = earlyAccessHelpers.checkEarlyAccess({
            ID: '12345',
            custom: {
                earlyAccessConfigs: {
                    value: 'NO'
                }
            },
            variant: true,
            getVariationModel: function () {
                return {
                    master: {
                        ID: '123',
                        custom: {
                            earlyAccessConfigs: {
                                value: 'YES'
                            },
                            earlyAccessCustomerGroup: 'test',
                            earlyAccessBadge: 'test badge'
                        }
                    }
                };
            }
        });

        assert.isObject(earlyAccess);
        assert.isTrue(earlyAccess.isEarlyAccessProduct);
        assert.isFalse(earlyAccess.hideProduct);
        assert.isTrue(earlyAccess.isEarlyAccessCustomer);
    });

    it('Testing method: checkEarlyAccess product with early access variant YES', () => {
        session.customer = {
            registered: true,
            authenticated: false,
            externallyAuthenticated: true,
            getCustomerGroups: function () {
                return {
                    toArray: function () {
                        return [{
                            ID: 'test'
                        }];
                    }
                };
            }
        };
        var earlyAccess = earlyAccessHelpers.checkEarlyAccess({
            ID: '12345',
            custom: {
                earlyAccessConfigs: {
                    value: 'YES'
                },
                earlyAccessCustomerGroup: 'test',
                earlyAccessBadge: 'test badge'
            },
            variant: true,
            getVariationModel: function () {
                return {
                    master: {
                        ID: '123',
                        custom: {
                            earlyAccessConfigs: {
                                value: 'YES'
                            },
                            earlyAccessCustomerGroup: 'test',
                            earlyAccessBadge: 'test badge'
                        }
                    }
                };
            }
        });

        assert.isObject(earlyAccess);
        assert.isTrue(earlyAccess.isEarlyAccessProduct);
        assert.isFalse(earlyAccess.hideProduct);
        assert.isTrue(earlyAccess.isEarlyAccessCustomer);
    });

    it('Testing method: checkEarlyAccess product with empty early access customer group attr', () => {
        session.customer = {
            registered: true,
            authenticated: true,
            getCustomerGroups: function () {
                return {
                    toArray: function () {
                        return [{
                            ID: 'test'
                        }];
                    }
                };
            }
        };
        var earlyAccess = earlyAccessHelpers.checkEarlyAccess({
            ID: '12345',
            custom: {
                earlyAccessConfigs: {
                    value: 'YES'
                },
                earlyAccessBadge: 'test badge'
            },
            variant: true,
            getVariationModel: function () {
                return {
                    master: {
                        ID: '123',
                        custom: {
                            earlyAccessConfigs: {
                                value: 'YES'
                            },
                            earlyAccessBadge: 'test badge'
                        }
                    }
                };
            }
        });

        assert.isObject(earlyAccess);
        assert.isFalse(earlyAccess.isEarlyAccessProduct);
        assert.isFalse(earlyAccess.hideProduct);
    });

    it('Testing method: checkEarlyAccess customer does not belong to any group', () => {
        session.customer = {
            registered: true,
            authenticated: true,
            getCustomerGroups: function () {
                return {
                    toArray: function () {
                        return null;
                    }
                };
            }
        };
        var earlyAccess = earlyAccessHelpers.checkEarlyAccess({
            ID: '12345',
            custom: {
                earlyAccessConfigs: {
                    value: 'YES'
                },
                earlyAccessCustomerGroup: 'test',
                earlyAccessBadge: 'test badge'
            },
            variant: true,
            getVariationModel: function () {
                return {
                    master: {
                        ID: '123',
                        custom: {
                            earlyAccessConfigs: {
                                value: 'YES'
                            },
                            earlyAccessBadge: 'test badge'
                        }
                    }
                };
            }
        });

        assert.isObject(earlyAccess);
        assert.isTrue(earlyAccess.isEarlyAccessProduct);
        assert.isFalse(earlyAccess.hideProduct);
        assert.isFalse(earlyAccess.isEarlyAccessCustomer);
    });
});

