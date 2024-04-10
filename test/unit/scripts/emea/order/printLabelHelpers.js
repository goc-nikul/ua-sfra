'use strict';
/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../../test/mockModuleSuperModule');
const Site = require('../../../../mocks/dw/dw_system_Site');

var printLabelHelpers;
var base = module.superModule;

class Sites {
    constructor() {
        this.preferenceMap = {
            isBOPISEnabled: true,
            enableVIPCheckoutExperience: true,
            returnService: { value : 'UPS' }
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

function Base() {}
 Base.getReturnInstructionText = function(param){
    return 'Test Instruction';
 }
describe('app_ua_emea/cartridge/scripts/order/printLabelHelpers', function () {
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
            customerLocale: 'AT'
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
                    if (locale) {
                        return 'UPS';
                    }
                } else if (service === 'enableReturnXMLs') {
                    return true;
                }
            }
        };
    };
    before(function () {
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/printLabelHelpers', {
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
            'dw/system/Site': Sites
        });
    });

    it('Testing method: printLabelHelpers', () => {
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isFalse(result.errorInResponse);
        result = printLabelHelpers.getReturnInstructionText(order);
        assert.equal(result, 'testMsg');
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
        assert.equal(result.errorMessage, 'testMsg');
    });

    it('Testing method: printLabelHelpers : Error in return services', () => {
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/printLabelHelpers', {
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
            },
            'dw/system/Site': Sites
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
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/printLabelHelpers', {
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
            },
            'dw/system/Site': Sites
        });
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isTrue(result.errorInResponse);
    });

    it('Testing method: printLabelHelpers : shipLabel returned as part of pdfObject service response', () => {
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: [{"emailSent":true,"date":"2022-03-31T01:01:01.000Z","carrier":"UPS-STD","deliveryNumber":"852613375630050D","trackingCode":"883613727547322E","trackingLink":"","items":{"1361379-001-XS":"1"},"sentToPaazl":true}],
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
            'dw/system/Site': Sites
        });
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isFalse(result.errorInResponse);
    });

    it('Testing method: getPDF - printLabelHelpers : Error in return case', () => {
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 123,
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
            'dw/system/Site': Sites
        });
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isFalse(result.errorInResponse);
    });

    it('Testing method: getPDF - printLabelHelpers : Error in return case, trackingNumber and shipLabel not exist in the service response', () => {
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return false;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 123,
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
            'dw/system/Site': Sites
        });
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isTrue(result.errorInResponse);
        assert.equal(result.errorMessage, 'testMsg');
    });

    
    it('Testing method: getPDF - printLabelHelpers : Error in return case, returnService not configured', () => {
        class Site {
            constructor() {
                this.preferenceMap = {
                    returnService: false
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
        
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return false;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 123,
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
            'dw/system/Site': Site
        });
        var result = printLabelHelpers.getPDF(order, returnObj);
        assert.isTrue(result.errorInResponse);
        assert.equal(result.errorMessage, 'testMsg');
    });

    it('Testing method: getReturnInstructionText- printLabelHelpers : Error in return case', () => {
        printLabelHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/printLabelHelpers', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/system/HookMgr': {
                hasHook: function (hookID) {
                    return true;
                },
                callHook: function (hookID) {
                    return {
                        isCalled: true,
                        shipLabel: 123,
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
            'dw/system/Site': {
                getCurrent: () => {
                   return {
                        getCustomPreferenceValue: () => null
                    };
                }
            }
        });
        var result = printLabelHelpers.getReturnInstructionText(order);
        assert.equal(result, 'testMsg');
        result = printLabelHelpers.getReturnInstructionText();
        assert.equal(result, '');
    });
});

