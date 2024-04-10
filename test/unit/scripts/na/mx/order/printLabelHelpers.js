'use strict';

require('dw-api-mock/demandware-globals');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

let printLabelHelpers;
let defaultStubs;
let Site;
let Resource;
let HookMgr;
let returnService;
let renderedHtml;
let Logger;

describe('app_ua_mx/cartridge/scripts/order/printLabelHelpers.js', () => {
    before(() => {
        renderedHtml = '<html></html>'
        returnService = 'FedEx';
        Site = new (require('dw/system/Site'))();
        Site.getCurrent = () => Site;
        Site.preferences.getCustom = () => {
            return {
                'returnService': {
                    value: returnService
                }
            }
        };
        Resource = new (require('dw/web/Resource'))();
        HookMgr = new (require('dw/system/HookMgr'))();
        Logger = {
            error: sinon.spy(() => {})
        };
    });

    beforeEach(() => {
        defaultStubs = {
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: () => renderedHtml
            },
            '*/cartridge/scripts/orders/ReturnsUtils': function ReturnsUtils() {
                this.getPreferenceValue = (key) => {
                    var values = {
                        'returnService': {
                            value: returnService
                        },
                        'enableReturnXMLs': {}
                    };
                    return values[key] || null;
                }
            },
            '*/cartridge/scripts/orders/CreateObject': {
                createObj: () => {}
            },
            '*/cartridge/scripts/order/returnHelpers': {
                generateRmaNumber: () => 'RMA102030405060',
                sendReturnCreatedConfirmationEmail: () => {},
                createAuthFormObj: () => {}
            },
            '*/cartridge/scripts/orders/CreateReturnCase': {
                create: () => {
                    return {
                        custom: {}
                    }
                }
            }, 
            'dw/system/Site': Site,
            'dw/web/Resource': Resource,
            'dw/system/HookMgr': HookMgr,
            'dw/system/Logger': Logger
        };
        printLabelHelpers = proxyquire('../../../../../../cartridges/app_ua_mx/cartridge/scripts/order/printLabelHelpers.js', defaultStubs);
    });

    it('Testing method: getReturnInstructionText', () => {
        var returnInstructionText;
        var order = new (require('dw/order/Order'))();
        var resourceKeyPrefix = 'order.return.instruction'
        var messages = {
            'order.return.instruction.FedEx': 'FedExIncstructions' 
        };
        Resource.msg = (resourceKey) => messages[resourceKey];

        // returnService data is in countryOverride prefs
        assert.doesNotThrow(() => returnInstructionText = printLabelHelpers.getReturnInstructionText(order));
        assert.equal(returnInstructionText, messages[resourceKeyPrefix + '.' + returnService]);

        // returnService data is in site prefs
        Site.setCustomPreferenceValue('returnService', {
            value: returnService
        });
        assert.doesNotThrow(() => returnInstructionText = printLabelHelpers.getReturnInstructionText(order));
        assert.equal(returnInstructionText, messages[resourceKeyPrefix + '.' + returnService]);
    });

    it('Testing method: getPDF', () => {
        var result;
        var caseItem = {
            orderItemID: 12345,
            authorizedQuantity: {
                value: 1
            },
            orderItem: {
                lineItem: {
                    quantityValue: 2
                }
            }
        };
        var order = new (require('dw/order/Order'))();
        order.getReturnCaseItems = () => {
            return {
                asMap: () => {
                    return {
                        values: () => {
                            return [
                                caseItem
                            ];
                        }
                    };
                }
            }
        };
        var returnObj = {
            returnArray: [
                {
                    orderItemID: 12345,
                    qty: 4
                }
            ]
        };
        Site.setCustomPreferenceValue('returnService', {
            value: returnService
        });
        var errorDescription = 'errorDescription';
        HookMgr.hasHook = () => true;
        HookMgr.callHook = () => {
            return {
                errorDescription: errorDescription
            }
        };
        // trackingNumber and shipLabel are not provided
        assert.doesNotThrow(() => result = printLabelHelpers.getPDF(order, returnObj));
        assert.equal(result.errorMessage, errorDescription);

        // trackingNumber and shipLabel are provided, but too many items to return, failing returnCase creation
        HookMgr.callHook = () => {
            return {
                trackingNumber: 'TR01020304',
                shipLabel: 'a3b5c7',
                ConsignmentID: '1324'
            }
        };
        Site.setCustomPreferenceValue('returnService', returnService);
        assert.doesNotThrow(() => result = printLabelHelpers.getPDF(order, returnObj));
        assert(Logger.error.calledWith('To many items of {0} to return, failing returnCase creation'));

        // Correct number of items to return, success returnCase creation
        returnObj.returnArray[0].qty = 1;
        assert.doesNotThrow(() => result = printLabelHelpers.getPDF(order, returnObj));
        assert.equal(result.renderedTemplate, renderedHtml);
        assert.isFalse(result.errorInResponse);
        assert.equal(result.errorMessage, '');

        // shipLabel is an object
        HookMgr.callHook = () => {
            return {
                trackingNumber: 'TR01020304',
                shipLabel: {}
            }
        };
        assert.doesNotThrow(() => result = printLabelHelpers.getPDF(order, returnObj));
        assert.equal(result.renderedTemplate, renderedHtml);
        assert.isFalse(result.errorInResponse);
        assert.equal(result.errorMessage, '');

        // Hook doesn't exist
        HookMgr.hasHook = () => false;
        assert.doesNotThrow(() => result = printLabelHelpers.getPDF(order, returnObj));
        assert(Logger.error.calledWith('Order.js: Empty hook extension point'));

        // returnService costom pref is not provided
        Site.preferences.getCustom = () => {
            return {}
        };
        assert.doesNotThrow(() => result = printLabelHelpers.getPDF(order, returnObj));
        assert(Logger.error.calledWith('Order.js: Site Preference not configured'));
    });
});
