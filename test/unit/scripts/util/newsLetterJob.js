'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Spy = require('../../../helpers/unit/Spy');
let spy = new Spy();
global.PIPELET_ERROR ={
error:{}
}

class NewsletterProvider {
    constructor() {
        this.newsletter = {};
    }

    get(type, newsletter) {
        this.newsletter = newsletter;
        return this;
    }

    status() {
        return {
            MerkleCode: 10
        };
    }

    subscribe() {
        return {
            MerkleCode: 10
        };
    }
}

describe('app_ua_core/cartridge/scripts/util/newsLetterJob', function() {

    let newsLetterJob = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/newsLetterJob', {
	'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
	'PIPELET_ERROR':{},
	'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        'dw/object/CustomObjectMgr': {
                getAllCustomObjects: () => {
                    var customObj = [{
                        custom: {
                            country: 'en_US'
                        }
                    }];
                    var cnt = 0;
                    return {
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                }
            },
        'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (key) {
                            if (key === 'isMarketingAutoOptInEnabled') return false;
                        }
                    };
                }
            },
        '*/cartridge/modules/providers': new NewsletterProvider(),
        '*/cartridge/scripts/utils/PreferencesUtil': {
				getJsonValue: function () { return { emailWebSourceCodesJSON: {checkout : ''} }; }
			}
    });

    it('Testing method: execute', () => {
        var result = newsLetterJob.execute();
        assert.isDefined(result);
    });
});

describe('app_ua_core/cartridge/scripts/util/newsLetterJob', function() {

    let newsLetterJob = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/newsLetterJob', {
	'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
	'PIPELET_ERROR':{},
	'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        'dw/object/CustomObjectMgr': {
                getAllCustomObjects: () => {
                    var customObj = [{
                        custom: {
                            country: ''
                        }
                    }];
                    var cnt = 0;
                    return {
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                },
                remove: () => {
                    return 'removed'
                }
            },
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (key) {
                        if (key === 'isMarketingAutoOptInEnabled') return true;
                    }
                };
            }
        },
        '*/cartridge/modules/providers': new NewsletterProvider(),
        '*/cartridge/scripts/utils/PreferencesUtil': {
				getJsonValue: function () { return { emailWebSourceCodesJSON: {checkout : ''} }; }
			}
    });

    it('Testing method: execute', () => {
        var result = newsLetterJob.execute();
        assert.isDefined(result);
    });
});
