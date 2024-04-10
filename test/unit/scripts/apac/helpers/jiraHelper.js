'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_apac/cartridge/scripts/helpers/jiraHelper', function() {

    var svc = {
        setRequestMethod: () => true,
        setAuthentication: () => true,
        addHeader: () => true,
        addParam: () => true
    };

    var createService = function (serviceName, callObj) {
        callObj.createRequest(svc, {
            payload: 'Abc' || null
        });
        callObj.filterLogMessage(svc, {
            payload: 'Abc'
        });
        return callObj.parseResponse(null, {
            payload: 'Abc',
            addHeader: function (key, value) {
                this[key] = value;
            },
            setRequestMethod: function (method) {
                this[method] = method;
            },
            URL: {
                endsWith: function (Test77) {
                    return true;
                }
            },
            call: function (params) {
                var result = {
                    status: 'OK',
                    object: {
                        text: '{"id": "test11", "key": "test22"}'
                    }

                };
                return result;
            }
        });
    };

    let jiraHelper = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/jiraHelper.js', {
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Site': {
            current: {
                getCustomPreferenceValue: function (param) {
                    if (param === 'DeleteAccountJiraProject') {
                        return 'test'
                    } else if (param === 'DeleteAccountJiraAssignee') {
                        return 'test2'
                    } else if (param === 'DeleteAccountJiraAPIUser') {
                        return 'test3'
                    } else if (param === 'DeleteAccountJiraAPIPassword') {
                        return 'test4'
                    }
                }
            }
        },
        'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/svc/LocalServiceRegistry': {
            createService: createService
        }
    });
    var result;
    var email = 'test@gmail.com';
    it('Testing method: createAccountDeletionTicket', () => {
        result = jiraHelper.createAccountDeletionTicket(email);
        assert.isDefined(result, 'result is undefined');
    });

    it('Testing method: createAccountDeletionTicket', () => {
        let jiraHelper = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/jiraHelper.js', {
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: function (param) {
                        if (param === 'DeleteAccountJiraProject') {
                            return 'test'
                        } else if (param === 'DeleteAccountJiraAssignee') {
                            return 'test2'
                        } else if (param === 'DeleteAccountJiraAPIUser') {
                            return 'test3'
                        } else if (param === 'DeleteAccountJiraAPIPassword') {
                            return 'test4'
                        }
                    }
                }
            },
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/svc/LocalServiceRegistry': {
                createService:  function (serviceName, callObj) {
                    callObj.createRequest(svc, {
                        payload: 'Abc' || null
                    });
                    callObj.filterLogMessage(svc, {
                        payload: 'Abc'
                    });
                    return callObj.parseResponse(null, {
                        payload: 'Abc',
                        addHeader: function (key, value) {
                            this[key] = value;
                        },
                        setRequestMethod: function (method) {
                            this[method] = method;
                        },
                        URL: {
                            endsWith: function (Test77) {
                                return true;
                            }
                        },
                        call: function (params) {
                            var result = {
                                status: 'error',
                                msg: 'test11'
                            };
                            return result;
                        }
                    });
                }
            }
        });
        result = jiraHelper.createAccountDeletionTicket(email);
        assert.isDefined(result, 'result is undefined');
    });

    var issueID;
    var watchers = ['Test1', 'Test2'];
    it('Testing method: addWatchers', () => {
        result = jiraHelper.addWatchers(issueID, watchers);
        assert.isUndefined(result, 'result is defined');
    });

    it('Testing method: addWatchers', () => {
        let jiraHelper = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/jiraHelper.js', {
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: function (param) {
                        if (param === 'DeleteAccountJiraProject') {
                            return 'test'
                        } else if (param === 'DeleteAccountJiraAssignee') {
                            return 'test2'
                        } else if (param === 'DeleteAccountJiraAPIUser') {
                            return 'test3'
                        } else if (param === 'DeleteAccountJiraAPIPassword') {
                            return 'test4'
                        }
                    }
                }
            },
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/svc/LocalServiceRegistry': {
                createService: function (serviceName, callObj) {
                    callObj.createRequest(svc, {
                        payload: 'Abc' || null
                    });
                    callObj.filterLogMessage(svc, {
                        payload: 'Abc'
                    });
                    return callObj.parseResponse(null, {
                        payload: 'Abc',
                        addHeader: function (key, value) {
                            this[key] = value;
                        },
                        setRequestMethod: function (method) {
                            this[method] = method;
                        },
                        URL: {
                            endsWith: function (Test77) {
                                return false;
                            }
                        },
                        call: function (params) {
                            var result = {
                                status: 'error',
                                ok: false,
                                msg: 'test msg'
                            };
                            return result;
                        }
                    });
                }
            }
        });
        result = jiraHelper.addWatchers(issueID, watchers);
        assert.isUndefined(result, 'result is defined');
    });
});