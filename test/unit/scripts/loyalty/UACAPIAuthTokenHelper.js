'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
const { expect } = require('chai');
const sinon = require('sinon');

function Calendar() {
    this.toTimeString = () => '01/01/2022';
    this.before = () => true;
    this.add = () => (new Date() + 86400);
    this.getTime = () => new Date();
}

class TimezoneHelper {
    getCurrentSiteTime() {
        return new Date();
    }
}

describe('int_loyalty/cartridge/scripts/services/UACAPIAuthTokenHelper.js TEST', () => {
    global.empty = (data) => {
        return !data;
    };

    let mockLoyaltyDataService;
    let mockLoyaltyServiceHelper;
    let UACAPIAuthTokenLoyaltyHelperRes;
    beforeEach(() => {
        mockLoyaltyDataService = {};
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true
                    };
                }
            };
        };
        mockLoyaltyDataService.getTokenData = () => {
            return {
                call: () => {
                    return {
                        status: 'OK',
                        object: {
                            text: '{"access_token": 12344,"expires_in": 86400, "token_type": "Bearer"}'
                        }
                    };
                }
            };
        };
        mockLoyaltyServiceHelper = {
            getGraphQLParams: () => {
                return {};
            },
            getUACAPITokenServiceRequest: () => {
                var Site = require('../../../mocks/dw/dw_system_Site');
                var requestBody = {};
                requestBody.client_id = Site.current.getCustomPreferenceValue('UACAPIClientId');
                requestBody.client_secret = Site.current.getCustomPreferenceValue('UACAPIClientSecret');
                requestBody.grant_type = 'client_credentials';
                requestBody.audience = Site.current.getCustomPreferenceValue('UACAPIClientAudience');
                return requestBody;
            }
        };

        UACAPIAuthTokenLoyaltyHelperRes = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/services/UACAPIAuthTokenHelper', {
            'dw/util/Calendar': Calendar,
            '~/cartridge/scripts/services/loyaltyDataService': mockLoyaltyDataService,
            '~/cartridge/scripts/services/serviceHelper': mockLoyaltyServiceHelper,
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: function () {
                    return {
                        getCustom: function () {
                            return {};
                        }
                    };
                },
                createCustomObject: function () {
                    return {};
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction')
        });
    });

    it('Testing method: getValidToken and auth request service return error in the response', () => {
        let payload = mockLoyaltyServiceHelper.getUACAPITokenServiceRequest();
        mockLoyaltyDataService.getTokenData = () => {
            return {
                call: (payload) => {
                    return {
                        status: 'error',
                        object: {
                            text: ''
                        }
                    };
                }
            };
        };
        var UACAPIAuthTokenLoyaltyelperObj = new UACAPIAuthTokenLoyaltyHelperRes();
        var result = UACAPIAuthTokenLoyaltyelperObj.getValidToken();
        assert.isNotNull(result);
        assert.isFalse(result);
    });

    it('Testing method: getValidToken and auth request service return success in the response', () => {
        var UACAPIAuthTokenLoyaltyHelperObj = new UACAPIAuthTokenLoyaltyHelperRes();
        var result = UACAPIAuthTokenLoyaltyHelperObj.getValidToken();
        assert.isNotNull(result);
        assert.isNotNull(result.accessToken);
        assert.equal(result.accessToken, '12344');
    });
});
