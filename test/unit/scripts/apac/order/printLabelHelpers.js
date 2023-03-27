'use strict';
/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../../test/mockModuleSuperModule');

var printLabelHelpers;
var base = module.superModule;
function Base() {}
 Base.getReturnInstructionText = function(param){
    return 'Test Instruction';
 }
describe('app_ua_apac/cartridge/scripts/order/printLabelHelpers', function () {
    before(function () {
        mockSuperModule.create(Base);
    });
    var items = [
        {
            orderItemID: 'test1',
            authorizedQuantity: {
                value: 3
            },
            orderItem: {
                lineItem: {
                    quantityValue: 3
                }
            }
        }
    ];
    var order = {
        custom: {
            customerLocale: 'AU'
        },
        getReturnCaseItems: function () {
            return {
                asMap: function () {
                    return {
                        values: function (){
                            return items;
                        }
                    };
                }
            };
        }
    };
    var returnObj = {
        returnArray: [
            {
                orderItemID: 'testOrderID'
            }
        ]
    };
    var ReturnsUtils = function () {
        return {
            getPreferenceValue: function (service, locale) {
                if (service === 'returnService') {
                    if (locale === 'AU') {
                        return 'aupost';
                    } else if (locale === 'NZ') {
                        return 'nzpost';
                    }
                } else if (service === 'enableReturnXMLs') {
                    return true;
                }
            }
        };
    };
    before(function () {
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
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
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () { return 'rendered HTML'; }
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/scripts/orders/CreateObject': {
                createObj: function (order, returnCase, exportStatus) {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                sendReturnCreatedConfirmationEmail: function (order, returnCase) {
                    return {};
                },
                createAuthFormObj: function (returnCase) {
                    return {};
                }
            },
            '*/cartridge/scripts/orders/CreateReturnCase': {
                create: function (params) {
                    return {
                        returnCase: 'returnCase',
                        custom:{}
                    };
                }
            },
            'app_ua_emea/cartridge/scripts/order/printLabelHelpers':{
                getReturnInstructionText: function (params) {
                    return 'Test Instruction';
                }
            }
        });
    });

    it('Testing method: printLabelHelpers AUPOST', () => {
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isFalse(result.errorInResponse);
    });

    it('Testing method: printLabelHelpers NZPOST', () => {
        order.custom.customerLocale = 'NZ';
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isFalse(result.errorInResponse);
    });

    it('Testing method: printLabelHelpers item cant be returned', () => {
        returnObj = {
            returnArray: [
                {
                    orderItemID: 'test1',
                    qty: 2
                }
            ]
        };
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isTrue(result.errorInResponse);
    });

    it('Testing method: printLabelHelpers : Error in return services', () => {
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        isReturnCase: true,
                        trackingNumber: '12345',
                        isError: true
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () { return 'rendered HTML'; }
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/scripts/orders/CreateObject': {
                createObj: function (order, returnCase, exportStatus) {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                sendReturnCreatedConfirmationEmail: function (order, returnCase) {
                    return '';
                },
                createAuthFormObj: function (returnCase) {
                    return '';
                }
            },
            '*/cartridge/scripts/orders/CreateReturnCase': {
                create: function (params) {
                    return {
                        returnCase: 'returnCase',
                        custom:{}
                    };
                }
            },
            'app_ua_emea/cartridge/scripts/order/printLabelHelpers':{
                getReturnInstructionText: function (params) {
                    return 'Test Instruction';
                }
            },
            'dw/content/ContentMgr': {
                getContent: function (params) {
                    return {
                        custom: {
                            body: {
                                source: 'return-label-not-available'
                            }
                        }
                    };
                }
            }
        });
        returnObj = {
            returnArray: [
                {
                    orderItemID: 'test1'
                }
            ]
        };
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isTrue(result.errorInResponse);
    });

    it('Testing method: printLabelHelpers : Error in return case', () => {
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        isReturnCase: false,
                        trackingNumber: '12345',
                        isError: true,
                        errorDescription: 'error'
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () { return 'rendered HTML'; }
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/scripts/orders/CreateObject': {
                createObj: function (order, returnCase, exportStatus) {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                sendReturnCreatedConfirmationEmail: function (order, returnCase) {
                    return '';
                },
                createAuthFormObj: function (returnCase) {
                    return '';
                }
            },
            '*/cartridge/scripts/orders/CreateReturnCase': {
                create: function (params) {
                    return {
                        returnCase: 'returnCase',
                        custom:{}
                    };
                }
            },
            'app_ua_emea/cartridge/scripts/order/printLabelHelpers': {
                getReturnInstructionText: function (params) {
                    return 'Test Instruction';
                }
            },
            'dw/content/ContentMgr': {
                getContent: function (params) {
                    return {
                        custom: {
                            body: {
                                source: 'return-label-not-available'
                            }
                        }
                    };
                }
            }
        });
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isTrue(result.errorInResponse);
    });

    it('Testing method: printLabelHelpers : Error in return case', () => {
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return false;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        isReturnCase: false,
                        trackingNumber: '12345',
                        isError: true,
                        errorDescription: 'error'
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () { return 'rendered HTML'; }
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/scripts/orders/CreateObject': {
                createObj: function (order, returnCase, exportStatus) {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                sendReturnCreatedConfirmationEmail: function (order, returnCase) {
                    return '';
                },
                createAuthFormObj: function (returnCase) {
                    return '';
                }
            },
            '*/cartridge/scripts/orders/CreateReturnCase': {
                create: function (params) {
                    return {
                        returnCase: 'returnCase',
                        custom:{}
                    };
                }
            },
            'app_ua_emea/cartridge/scripts/order/printLabelHelpers': {
                getReturnInstructionText: function (params) {
                    return 'Test Instruction';
                }
            },
            'dw/content/ContentMgr': {
                getContent: function (params) {
                    return {
                        custom: {
                            body: {
                                source: 'return-label-not-available'
                            }
                        }
                    };
                }
            }
        });
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isTrue(result.errorInResponse);
    });


    var ReturnsUtils = function () {
        return {
            getPreferenceValue: function (service, locale) {
                if (service === 'returnService') {
                    if (locale === 'AU') {
                        return 'aupost';
                    } else if (locale === 'NZ') {
                        return 'nzpost';
                    }
                } else if (service === 'enableReturnXMLs') {
                    return true;
                }
            }
        };
    };
    it('Testing method: printLabelHelpers : Error in return case', () => {
        var ReturnsUtil = function () {
            return {
                getPreferenceValue: () => null
            };
        };
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return false;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        isReturnCase: false,
                        trackingNumber: '12345',
                        isError: true,
                        errorDescription: 'error'
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () { return 'rendered HTML'; }
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtil,
            '*/cartridge/scripts/orders/CreateObject': {
                createObj: function (order, returnCase, exportStatus) {
                    return {};
                }
            },
            '*/cartridge/scripts/order/returnHelpers': {
                sendReturnCreatedConfirmationEmail: function (order, returnCase) {
                    return '';
                },
                createAuthFormObj: function (returnCase) {
                    return '';
                }
            },
            '*/cartridge/scripts/orders/CreateReturnCase': {
                create: function (params) {
                    return {
                        returnCase: 'returnCase',
                        custom:{}
                    };
                }
            },
            'app_ua_emea/cartridge/scripts/order/printLabelHelpers': {
                getReturnInstructionText: function (params) {
                    return 'Test Instruction';
                }
            },
            'dw/content/ContentMgr': {
                getContent: function (params) {
                    return {
                        custom: {
                            body: {
                                source: 'return-label-not-available'
                            }
                        }
                    };
                }
            }
        });
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isTrue(result.errorInResponse);
    });
    it('Testing method: printLabelHelpers : Error in return case for shipLabel as object', () => {
    printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/order/printLabelHelpers', {
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/system/HookMgr': {
            hasHook: function (hookID) {
                return true;
            },
            callHook: function (hookID) {
                return {
                    isCalled: true,
                    shipLabel: [{"emailSent":true,"date":"2022-03-31T01:01:01.000Z","carrier":"UPS-STD","deliveryNumber":"852613375630050D","trackingCode":"883613727547322E","trackingLink":"","items":{"1361379-001-XS":"1"}}],
                    isReturnCase: true,
                    trackingNumber: '12345'
                };
            }
        },
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        '*/cartridge/scripts/renderTemplateHelper': {
            getRenderedHtml: function () { return 'rendered HTML'; }
        },
        '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
        '*/cartridge/scripts/orders/CreateObject': {
            createObj: function (order, returnCase, exportStatus) {
                return {};
            }
        },
        '*/cartridge/scripts/order/returnHelpers': {
            sendReturnCreatedConfirmationEmail: function (order, returnCase) {
                return {};
            },
            createAuthFormObj: function (returnCase) {
                return {};
            }
        },
        '*/cartridge/scripts/orders/CreateReturnCase': {
            create: function (params) {
                return {
                    returnCase: 'returnCase',
                    custom:{}
                };
            }
        },
        'app_ua_emea/cartridge/scripts/order/printLabelHelpers':{
            getReturnInstructionText: function (params) {
                return 'Test Instruction';
            }
        }
    });
    var result = printLabelHelpers.getPDF(order, returnObj);
    assert.isFalse(result.errorInResponse);
});
});
