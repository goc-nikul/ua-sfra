'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_mao/cartridge/scripts/MaoPreferences', () => {
    global.empty = (data) => {
        return !data;
    };

    const maoPreferences = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoPreferences.js', {
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource')
    });

    it('Testing config preferences MaoDomTokenChildOrgUsername properties, if enablePersonalization not exists', () => {
        const preferencesMaoDomTokenChildOrgUsername = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoPreferences.js', {
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {}
                    }
                },
                getCurrent: function () {return {
                    getCustomPreferenceValue: function(param) {
                        return null
                    },
                    preferences:{}
                }}
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource')
        });
        var result = preferencesMaoDomTokenChildOrgUsername.MaoDomTokenChildOrgUsername;
        assert.isNull(result, 'preferences MaoDomTokenChildOrgUsername is undefined')
    });

    it('Testing config maoPreferences MaoDomTokenChildOrgUsername properties', () => {
        assert.isNotNull(maoPreferences.MaoDomTokenChildOrgUsername);
    });

    it('Testing config maoPreferences MaoDomTokenChildOrgPassword properties', () => {
        assert.isNotNull(maoPreferences.MaoDomTokenChildOrgPassword);
    });

    it('Testing config maoPreferences MaoDomSaveOrderEndpointUrl properties', () => {
        assert.equal(maoPreferences.MaoDomSaveOrderEndpointUrl, 'https://uarms.omni.manh.com/order/api/order/order/save');
    });

    it('Testing config maoPreferences maoViewDefinition properties', () => {
        assert.isUndefined(maoPreferences.maoViewDefinition, 'maoViewDefinition  is undefined');
    });

    it('Testing config maoPreferences MaoBOPISViewDefinition properties', () => {
        assert.isNotNull(maoPreferences.MaoBOPISViewDefinition);
    });
    it('Testing config maoPreferences RealTimeInventoryCheckPoints properties', () => {
        assert.isNotNull(maoPreferences.RealTimeInventoryCheckPoints);
    });
    it('Testing config maoPreferences MaoAvailabilityEndpointUrl properties', () => {
        assert.isNotNull(maoPreferences.MaoAvailabilityEndpointUrl);
    });
    it('Testing config maoPreferences MaoAuthTokenEndpointUrl properties', () => {
        assert.isNotNull(maoPreferences.MaoAuthTokenEndpointUrl);
    });
    it('Testing config maoPreferences CustomerServicePhone properties', () => {
        assert.isNotNull(maoPreferences.CustomerServicePhone);
    });
    it('Testing config maoPreferences MaoBOPISAvailabilityEndpointUrl properties', () => {
        assert.isNotNull(maoPreferences.MaoBOPISAvailabilityEndpointUrl);
    });
    it('Testing config maoPreferences MaoDeliveryPriorityDays properties', () => {
        assert.isUndefined(maoPreferences.MaoDeliveryPriorityDays,'MaoDeliveryPriorityDays is undefined');
    });
    it('Testing config maoPreferences MaoSpecialZipCodes properties', () => {
        assert.isNotNull(maoPreferences.MaoSpecialZipCodes);
    });
    it('Testing config maoPreferences MaoSpecialZipCodesCarrierCode properties', () => {
        assert.isUndefined(maoPreferences.MaoSpecialZipCodesCarrierCode, 'MaoSpecialZipCodesCarrierCode is undefined' );
    });
    it('Testing config maoPreferences ManipulatePostalCode properties', () => {
        assert.isNotNull(maoPreferences.ManipulatePostalCode);
    });
    it('Testing config maoPreferences ManipulatePostalCodeSeparator properties', () => {
        assert.isNotNull(maoPreferences.ManipulatePostalCodeSeparator);
    });
    it('Testing config maoPreferences ManipulatePostalCodePosition properties', () => {
        assert.isNotNull(maoPreferences.ManipulatePostalCodePosition);
    });
    it('Testing config maoPreferences xiPayPayPalAuthEnabled properties', () => {
        assert.isNotNull(maoPreferences.xiPayPayPalAuthEnabled);
    });
    it('Testing config maoPreferences maoMaxFailedCount properties', () => {
        assert.isNotNull(maoPreferences.maoMaxFailedCount);
    });
    it('Testing config maoPreferences maoCarrierCodes properties', () => {
        assert.isNotNull(maoPreferences.maoCarrierCodes);
    });

    it('Testing config maoPreferences maoSpecialZipCodes properties when no value exist', () => {
        const preferencesmaoSpecialZipCodes = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoPreferences.js', {
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {}
                    }
                },
                getCurrent: function () {return {
                    getCustomPreferenceValue: function(param) {
                        return null
                    }
                }}
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource')
        });
        assert.isNotNull(preferencesmaoSpecialZipCodes.maoCarrierCodes);
    });

});
