'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_mao/cartridge/scripts/PubSubPreferences', () => {
    global.empty = (data) => {
        return !data;
    };

    var Logger = {
        getLogger: () => {
            return {
                error: () => {}
            }
        }
    };

    it('Testing if the pubSubPreferences contains all required properties', () => {
        const pubSubPreferences = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/PubSubPreferences.js', {
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': Logger
        });
        assert.property(pubSubPreferences, 'isEnabled');
        assert.property(pubSubPreferences, 'topic_id');
        assert.property(pubSubPreferences, 'organization');
        assert.property(pubSubPreferences, 'user');
        assert.property(pubSubPreferences, 'client_email');
        assert.property(pubSubPreferences, 'client_id');
        assert.property(pubSubPreferences, 'private_key_id');
        assert.property(pubSubPreferences, 'private_key');
        assert.property(pubSubPreferences, 'project_id');
    });

    it('Testing if the GooglePubSubConfig preference is filled up correctly', () => {
        var Site = require('../../../mocks/dw/dw_system_Site');
        Site.current.preferences.custom.GooglePubSubConfig = '{"project_id":"project_id","private_key_id":"private_key_id","private_key":"private_key","client_email":"client_email","client_id":"client_id"}';
        const pubSubPreferences = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/PubSubPreferences.js', {
            'dw/system/Site': Site,
            'dw/system/Logger': Logger
        });
        assert.equal(pubSubPreferences.client_email, 'client_email');
        assert.equal(pubSubPreferences.client_id, 'client_id');
        assert.equal(pubSubPreferences.private_key_id, 'private_key_id');
        assert.equal(pubSubPreferences.private_key, 'private_key');
        assert.equal(pubSubPreferences.project_id, 'project_id');
    });

    it('Testing if the GooglePubSubConfig preference does not contain required props', () => {
        var Site = require('../../../mocks/dw/dw_system_Site');
        Site.current.preferences.custom.GooglePubSubConfig = '{"project_id_":"","private_key_id_":"","private_key_":"","client_email_":"","client_id_":""}';
        const pubSubPreferences = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/PubSubPreferences.js', {
            'dw/system/Site': Site,
            'dw/system/Logger': Logger
        });
        assert.propertyVal(pubSubPreferences, 'client_email', '');
        assert.propertyVal(pubSubPreferences, 'client_id', '');
        assert.propertyVal(pubSubPreferences, 'private_key_id', '');
        assert.propertyVal(pubSubPreferences, 'private_key', '');
        assert.propertyVal(pubSubPreferences, 'project_id', '');
    });

    it('Testing if the GooglePubSubConfig preference contains corrupted JSON format', () => {
        var Site = require('../../../mocks/dw/dw_system_Site');
        Site.current.preferences.custom.GooglePubSubConfig = '{"project_id":"",private_k:""}';
        const pubSubPreferences = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/PubSubPreferences.js', {
            'dw/system/Site': Site,
            'dw/system/Logger': Logger
        });
        assert.propertyVal(pubSubPreferences, 'client_email', '');
        assert.propertyVal(pubSubPreferences, 'client_id', '');
        assert.propertyVal(pubSubPreferences, 'private_key_id', '');
        assert.propertyVal(pubSubPreferences, 'private_key', '');
        assert.propertyVal(pubSubPreferences, 'project_id', '');
    });
});
