'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockCollections = require('../../../../mocks/util/collections');

function proxyModel() {
    return proxyquire(
        '../../../../../cartridges/int_adobe_target/cartridge/scripts/util/DeliveryHelper',
        {
            '*/cartridge/scripts/helpers/cookieHelpers': require('../../../../../cartridges/app_ua_core/cartridge/scripts/helpers/cookieHelpers'),
            '~/cartridge/scripts/adobeTargetPreferences': require('./../adobeTargetPreferences'),
            'int_adobe_target/cartridge/scripts/init/ServerSideEcidService': require('./../init/ServerSideEcidService'),
            '*/cartridge/scripts/util/collections': {
                map: mockCollections.map
            }
        }
    );
}

module.exports = proxyModel();
