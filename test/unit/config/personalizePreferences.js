'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('plugin_productpersonalize/cartridge/config/peronslizePreferences', () => {
    const preferences = proxyquire('../../../cartridges/plugin_productpersonalize/cartridge/config/peronslizePreferences', {
        'dw/system/Site': require('../../mocks/dw/dw_system_Site')
    });

    it('Testing config preferences isPersonalizationEnable properties, if enablePersonalization not exists', () => {
        const preferencesIsPersonalizationEnable = proxyquire('../../../cartridges/plugin_productpersonalize/cartridge/config/peronslizePreferences', {
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {}
                    }
                }
            }
        });
        assert.isFalse(preferencesIsPersonalizationEnable.isPersonalizationEnable, 'Not eligible for preferences');
    });

    it('Testing config preferences isPersonalizationEnable properties', () => {
        assert.isTrue(preferences.isPersonalizationEnable, 'Not eligible for preferences');
    });

    it('Testing config preferences personalizationMaxName properties', () => {
        assert.equal(preferences.personalizationMaxName, 12);
    });

    it('Testing config preferences personalizationMaxNumber properties', () => {
        assert.equal(preferences.personalizationMaxNumber, 2);
    });

    it('Testing config preferences personalizationNegativeWordList properties', () => {
        assert.isBelow(preferences.personalizationNegativeWordList.indexOf('Testing'), 0, 'Current content is in Negative word list');
    });

    it('Testing config preferences scene7BaseURL properties', () => {
        assert.equal(preferences.scene7BaseURL, 'https://underarmour.scene7.com/is/image/');
    });

});
