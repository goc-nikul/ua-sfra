'use strict';

const { assert } = require('chai');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

class Sites {
    constructor() {
        this.preferenceMap = {
            isBOPISEnabled: true,
            enableVIPCheckoutExperience: true,
            returnService: 'FedEx',
            smartPostEligibleStateCodes: 'AK'

        };
        this.preferences = {
            custom: this.preferenceMap
        };
    }
    getCustomPreferenceValue(key) {
        return this.preferenceMap[key];
    }
    getPreferences() {
        return {
            getCustom: () => {
                return this.preferenceMap;
            },
            custom: this.preferenceMap
        };
    }
    // dw.system.Site methods
    static getCurrent() {
        if (Sites.current) {
            return Sites.current;
        }
        return new Sites();
    }
}
Sites.current = Sites.getCurrent();


var printLabelHelpers = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
    'dw/system/Site': Sites,
    'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
    'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
    '*/cartridge/scripts/renderTemplateHelper': {
        getRenderedHtml: function () {
            return {};
        }
    },
    '*/cartridge/scripts/order/returnHelpers': {
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
    'dw/system/HookMgr': {
        hasHook: function (hookID) {
            return true;
        },
        callHook: function (hookID) {
            return {
                isCalled: true,
                shipLabel: 'TestShipLabel',
                isReturnCase: true,
                trackingNumber: '12345'
            };
        }
    },
    'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
    'dw/object/CustomObjectMgr': {
        getCustomObject: () => null,
        createCustomObject: (param) => {
            return {
                custom: {
                    fileType: '',
                    base64encodedFileData: '',
                    returnLabelUrl: '',
                    sfmcData: '',
                    customerNo: ''
                }
            };
        }
    }
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

    it('Testing method: getPDF --> Test error in createRmaMutation response', () => {
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            }
        });
        var result = printLabelHelpersRes.getPDF('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isTrue(result.errorInResponse);
        assert.isDefined(result.errorMessage, 'Error message is Defined');
    });

    it('Testing method: getPDF --> Test case createRmaMutation return null in the response', () => {
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var result = printLabelHelpersRes.getPDF('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isTrue(result.errorInResponse);
        assert.isDefined(result.errorMessage, 'Error message is Defined');
    });

    it('Testing method: getPDF --> Test case returnService is empty', () => {
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
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
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            }
        });
        var result = printLabelHelpersRes.getPDF('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
        assert.isFalse(result.errorInResponse);
    });

    it('Testing method: getPDF --> Test Custom Exception', () => {
        var stub = sinon.stub();
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                getGuestOrderRMARequestBody: stub,
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.getPDF('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
        // assert.equal(result, 'testMsg');
        // assert.isDefined(result.errorMessage, 'Error message is Defined');
    });

    it('Testing method: getPDF --> Test Custom Exception in getPDF method', () => {
        var stub = sinon.stub();
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.getPDF('createGuestStoreRma', order, {}, {}, true);
        assert.isNotNull(result);
    });

    it('Testing method: getPDF --> Test error in PDF response', () => {
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                },
                generateRmaNumber: () => {
                    return 'ReturnNumber';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            }
        });
        printLabelHelpersRes.getPDFService = '';
        var result = printLabelHelpersRes.getPDF(order, '1234', false);
        assert.isNotNull(result);
        assert.isTrue(result.errorInResponse);
        assert.isDefined(result.errorMessage, 'Error message is Defined');
    });

    it('Testing method: getPDF --> Test In Case requestType is createItemizedRma and fileType is PDF', () => {
        var stub = sinon.stub();
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345',
                        mimeType: 'application/pdf'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.getPDF('createGuestItemizedRma', order, {}, {}, true);
        assert.equal(result.errorInResponse, false);
        assert.isNotNull(result);
        result = printLabelHelpersRes.getPDF('createItemizedRma', order, {}, {}, true);
        assert.equal(result.errorInResponse, false);
        assert.isNotNull(result);
    });

    it('Testing method: getPDF -->  Test In Case fileType is PDF', () => {
        var stub = sinon.stub();
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345',
                        mimeType: 'image/png'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.getPDF('createGuestItemizedRma', order, {}, {}, true);
        assert.equal(result.errorInResponse, false);
        assert.isNotNull(result);
    });

    it('Testing method: getPDF --> authFormObject country not US ', () => {
        var stub = sinon.stub();
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345',
                        mimeType: 'image/png'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.getPDF('createGuestItemizedRma', order, {}, {}, false);
        assert.equal(result.errorInResponse, false);
        assert.isNotNull(result);
    });

    it('Testing method: getPDF --> Test createAuthFormObj with country US in getPDF method', () => {
        var stub = sinon.stub();
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345',
                        mimeType: 'image/png'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                    return {
                        country: 'US'
                    };
                },
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: function () {
                    return {};
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.getPDF('createGuestItemizedRma', order, {}, {}, false);
        assert.equal(result.errorInResponse, false);
        assert.isNotNull(result);
    });

    it('Testing method: getPDF --> Test createAuthFormObj with country US', () => {
        var stub = sinon.stub();
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: '12345',
                        mimeType: 'image/png'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                    return {
                        country: 'US'
                    };
                },
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: function () {
                    return {};
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.getPDF('createGuestItemizedRma', order, {}, {}, false);
        assert.equal(result.errorInResponse, false);
        assert.isNotNull(result);
    });

    it('Testing method: getPDF --> Test catch block with tracker number null in getPDF method', () => {
        var stub = sinon.stub();
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: null,
                        mimeType: 'image/png'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                    return {
                        country: 'US'
                    };
                },
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: function () {
                    return {};
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.getPDF('createGuestItemizedRma', order, {}, {}, false);
        assert.equal(result.errorInResponse, true);
        assert.isNotNull(result);
    });

    it('Testing method: getPDF --> Test catch block with Hooks is  null in getPDF method', () => {
        var stub = sinon.stub();
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Sites,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return false;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: null,
                        mimeType: 'image/png'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                    return {
                        country: 'US'
                    };
                },
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: function () {
                    return {};
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.getPDF('createGuestItemizedRma', order, {}, {}, false);
        assert.equal(result.errorInResponse, true);
        assert.isNotNull(result);
    });


    it('Testing method: getPDF --> Test catch block with hasHook return false in getPDF method', () => {
        var stub = sinon.stub();
        class Site {
            constructor() {
                this.preferenceMap = {
                    isBOPISEnabled: true,
                    enableVIPCheckoutExperience: true,
                    returnService: null,
                    smartPostEligibleStateCodes: 'AK'
        
                };
                this.preferences = {
                    custom: this.preferenceMap
                };
            }
            getCustomPreferenceValue(key) {
                return this.preferenceMap[key];
            }
            getPreferences() {
                return {
                    getCustom: () => {
                        return this.preferenceMap;
                    },
                    custom: this.preferenceMap
                };
            }
            // dw.system.Site methods
            static getCurrent() {
                if (Site.current) {
                    return Site.current;
                }
                return new Site();
            }
        }
        Site.current = Site.getCurrent();
        var printLabelHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Site': Site,
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return false;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 'TestShipLabel',
                        isReturnCase: true,
                        trackingNumber: null,
                        mimeType: 'image/png'
                    };
                }
            },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
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
                createAuthFormObj: function () {},
                getRMARequestBody: function () {
                    return {};
                },
                getGuestOrderRMARequestBody: function () {
                    return {};
                },
                generateRmaNumber: function () {
                    return 'return123AK';
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: (param) => {
                    return {
                        custom: {
                            fileType: '',
                            base64encodedFileData: '',
                            returnLabelUrl: '',
                            sfmcData: '',
                            customerNo: ''
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        stub.throws(new Error('custom exception'));
        var result = printLabelHelpersRes.getPDF('createGuestItemizedRma', order, {}, {}, false);
        assert.equal(result.errorInResponse, true);
        assert.isNotNull(result);
    });
});
