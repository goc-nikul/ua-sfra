'use strict';

const { assert } = require('chai');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

function S3TransferClient() {
    this.getPreSignedUrl = () => 'getPreSignedUrl';
    this.before = () => true;
}

var svc = {
    setRequestMethod: () => null,
    setURL: () => null
};

var params = {
    url: null
};

var LocalServiceRegistryStub = sinon.stub().returns({
    createService: (svcId, callback) => {
        callback.createRequest(svc, params);
        return callback.parseResponse();
    }
});

var printLabelHelpers = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers//order/printLabelHelpers.js', {
    'dw/system/Site': {
        getCurrent: function () {
            return {
                getCustomPreferenceValue: function (pref) {
                    if (pref === 'returnService') {
                        return {
                            value: 'FedEx'
                        };
                    } else if (pref === 'smartPostEligibleStateCodes') {
                        return ['AK'];
                    }
                }
            };
        }
    },
    'dw/svc/LocalServiceRegistry': new LocalServiceRegistryStub(),
    'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
    'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
    '*/cartridge/scripts/renderTemplateHelper': {
        getRenderedHtml: function () {
            return {};
        }
    },
    '*/cartridge/scripts/UACAPI/helpers/order/returnHelpers': {
        getGuestRMARequestBody: function () {
            return {};
        },
        createRmaMutation: function () {
            return {
                error: false,
                rma: {
                    returnLabelId: {}
                }
            };
        },
        createAuthFormObj: function () {
            return {};
        },
        getRMARequestBody: function () {
            return {};
        },
        getGuestOrderRMARequestBody: function () {
            return {};
        }
    },
    'int_s3/cartridge/scripts/lib/S3TransferClient.js': S3TransferClient,
    'dw/system/System': {
        getPreferences: function () {
            return {
                getCustom: function () {
                    return {
                        s3preSignedUrlExpiry: 12345
                    };
                }
            };
        }
    },
    'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
});

String.prototype.equalsIgnoreCase = function (str) {
    return this.toLocaleLowerCase() === str.toLocaleLowerCase();
};

describe('int_mao/cartridge/scripts/UACAPI/helpers//order/printLabelHelpers.js', () => {

    var order = {
        shippingAddress: {
            stateCode: 'AK'
        }
    };

    it('Testing method: submitReturn --> Test requestType is createGuestItemizedRma', () => {
        var result = printLabelHelpers.submitReturn('createGuestItemizedRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isFalse(result.errorInResponse);
    });

    it('Testing method: submitReturn --> Test requestType is createItemizedRma', () => {
        var result = printLabelHelpers.submitReturn('createItemizedRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isFalse(result.errorInResponse);
    });

    it('Testing method: submitReturn --> Test requestType is createGuestStoreRma', () => {

        var result = printLabelHelpers.submitReturn('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isFalse(result.errorInResponse);
    });

    it('Testing method: submitReturn --> Test requestType is empty', () => {

        var result = printLabelHelpers.submitReturn('', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isTrue(result.errorInResponse);
    });

    it('Testing method: submitReturn --> Test Case State code not exist in shipping Address', () => {
        order = {
            shippingAddress: {
                stateCode: ''
            }
        };
        var printLabelHelpersRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers//order/printLabelHelpers.js', {
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (pref) {
                            if (pref === 'returnService') {
                                return {
                                    value: 'FedEx'
                                };
                            } else if (pref === 'smartPostEligibleStateCodes') {
                                return ['AA'];
                            }
                        }
                    };
                }
            },
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/UACAPI/helpers/order/returnHelpers': {
                getGuestRMARequestBody: function () {
                    return {};
                },
                createRmaMutation: function () {
                    return {
                        error: false,
                        rma: {
                            returnLabelId: {}
                        }
                    };
                },
                createAuthFormObj: function () {
                    return {};
                },
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: function () {
                    return {};
                }
            },
            'int_s3/cartridge/scripts/lib/S3TransferClient.js': S3TransferClient,
            'dw/system/System': {
                getPreferences: function () {
                    return {
                        getCustom: function () {
                            return {
                                s3preSignedUrlExpiry: 12345
                            };
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
        });
        var result = printLabelHelpersRes.submitReturn('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isFalse(result.errorInResponse);
        assert.isDefined(result.errorMessage, 'Error message is not Defined');
    });

    it('Testing method: submitReturn --> Test error in createRmaMutation response', () => {
        var printLabelHelpersRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers//order/printLabelHelpers.js', {
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (pref) {
                            if (pref === 'returnService') {
                                return {
                                    value: 'FedEx'
                                };
                            } else if (pref === 'smartPostEligibleStateCodes') {
                                return ['AK'];
                            }
                        }
                    };
                }
            },
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/UACAPI/helpers/order/returnHelpers': {
                getGuestRMARequestBody: function () {
                    return {};
                },
                createRmaMutation: function () {
                    return {
                        error: true
                    };
                },
                createAuthFormObj: function () {
                    return {};
                },
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: function () {
                    return {};
                }
            },
            'int_s3/cartridge/scripts/lib/S3TransferClient.js': S3TransferClient,
            'dw/system/System': {
                getPreferences: function () {
                    return {
                        getCustom: function () {
                            return {
                                s3preSignedUrlExpiry: 12345
                            };
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
        });
        var result = printLabelHelpersRes.submitReturn('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isTrue(result.errorInResponse);
        assert.isDefined(result.errorMessage, 'Error message is Defined');
    });

    it('Testing method: submitReturn --> Test case createRmaMutation return null in the response', () => {
        var printLabelHelpersRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers//order/printLabelHelpers.js', {
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (pref) {
                            if (pref === 'returnService') {
                                return {
                                    value: 'FedEx'
                                };
                            } else if (pref === 'smartPostEligibleStateCodes') {
                                return ['AK'];
                            }
                        }
                    };
                }
            },
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/UACAPI/helpers/order/returnHelpers': {
                getGuestRMARequestBody: function () {
                    return {};
                },
                createRmaMutation: function () {
                    return null;
                },
                createAuthFormObj: function () {
                    return {};
                },
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: function () {
                    return {};
                }
            },
            'int_s3/cartridge/scripts/lib/S3TransferClient.js': S3TransferClient,
            'dw/system/System': {
                getPreferences: function () {
                    return {
                        getCustom: function () {
                            return {
                                s3preSignedUrlExpiry: 12345
                            };
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
        });
        var result = printLabelHelpersRes.submitReturn('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isTrue(result.errorInResponse);
        assert.isDefined(result.errorMessage, 'Error message is Defined');
    });

    it('Testing method: submitReturn --> Test case returnService is empty', () => {
        var printLabelHelpersRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers//order/printLabelHelpers.js', {
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (pref) {
                            if (pref === 'returnService') {
                                return '';
                            } else if (pref === 'smartPostEligibleStateCodes') {
                                return ['AZ'];
                            }
                        }
                    };
                }
            },
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/UACAPI/helpers/order/returnHelpers': {
                getGuestRMARequestBody: function () {
                    return {};
                },
                createRmaMutation: function () {
                    return {
                        error: false,
                        rma: {
                            returnLabelId: {}
                        }
                    };
                },
                createAuthFormObj: function () {
                    return {};
                },
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: function () {
                    return {};
                }
            },
            'int_s3/cartridge/scripts/lib/S3TransferClient.js': S3TransferClient,
            'dw/system/System': {
                getPreferences: function () {
                    return {
                        getCustom: function () {
                            return {
                                s3preSignedUrlExpiry: 12345
                            };
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
        });
        var result = printLabelHelpersRes.submitReturn('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isFalse(result.errorInResponse);
    });

    it('Testing method: submitReturn --> Test Custom Exception', () => {
        var stub = sinon.stub();
        var printLabelHelpersRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers//order/printLabelHelpers.js', {
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (pref) {
                            if (pref === 'returnService') {
                                return '';
                            } else if (pref === 'smartPostEligibleStateCodes') {
                                return ['AZ'];
                            }
                        }
                    };
                }
            },
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/UACAPI/helpers/order/returnHelpers': {
                getGuestRMARequestBody: function () {
                    return {};
                },
                createRmaMutation: function () {
                    return {
                        error: false,
                        rma: {
                            returnLabelId: {}
                        }
                    };
                },
                createAuthFormObj: function () {
                    return {};
                },
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: stub
            },
            'int_s3/cartridge/scripts/lib/S3TransferClient.js': S3TransferClient,
            'dw/system/System': {
                getPreferences: function () {
                    return {
                        getCustom: function () {
                            return {
                                s3preSignedUrlExpiry: 12345
                            };
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.submitReturn('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isTrue(result.errorInResponse);
        assert.isDefined(result.errorMessage, 'Error message is Defined');
    });

    it('Testing method: submitReturn --> Test Custom Exception in getReturnInstructionText method', () => {
        var stub = sinon.stub();
        var printLabelHelpersRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers//order/printLabelHelpers.js', {
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: stub
                    };
                }
            },
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/UACAPI/helpers/order/returnHelpers': {
                getGuestRMARequestBody: function () {
                    return {};
                },
                createRmaMutation: function () {
                    return {
                        error: false,
                        rma: {
                            returnLabelId: {}
                        }
                    };
                },
                createAuthFormObj: function () {
                    return {};
                },
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: function () {
                    return {};
                }
            },
            'int_s3/cartridge/scripts/lib/S3TransferClient.js': S3TransferClient,
            'dw/system/System': {
                getPreferences: function () {
                    return {
                        getCustom: function () {
                            return {
                                s3preSignedUrlExpiry: 12345
                            };
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.submitReturn('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isFalse(result.errorInResponse);
        assert.isDefined(result.errorMessage, 'Error message is not Defined');
    });

    it('Testing method: getPDF --> Test error in PDF response', () => {
        var printLabelHelpersRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers//order/printLabelHelpers.js', {
            'int_s3/cartridge/scripts/lib/S3TransferClient.js': S3TransferClient,
            'dw/system/Site': {
                current: {
                    ID: null
                }
            },
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/UACAPI/helpers/order/returnHelpers': {
                getGuestRMARequestBody: function () {
                    return {};
                },
                createRmaMutation: function () {
                    return {
                        error: false,
                        rma: {
                            returnLabelId: {}
                        }
                    };
                },
                createAuthFormObj: function () {
                    return {};
                },
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: function () {
                    return {};
                }
            },
            'dw/svc/LocalServiceRegistry': {
                createService: function () {
                    return {
                        call: function () {
                            return {
                                ok: true,
                                object: {
                                    status: 'SUCCESS'
                                }
                            };
                        }
                    }
                }
            },
            'dw/crypto/Encoding': {
                toBase64: function (bytes) {
                    return {};
                }
            }
        });
        printLabelHelpersRes.getPDFService = '';
        var result = printLabelHelpersRes.getPDF(order, '1234', false);
        assert.isNotNull(result);
        assert.isFalse(result.errorInResponse);
        assert.isDefined(result.errorMessage, 'Error message is Defined');
    });
});
