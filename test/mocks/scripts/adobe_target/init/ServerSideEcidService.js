const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function proxyModel() {
    return proxyquire(
        '../../../../../cartridges/int_adobe_target/cartridge/scripts/init/ServerSideEcidService',
        {
            '~/cartridge/scripts/adobeTargetPreferences': require('../adobeTargetPreferences')
        }
    );
}

module.exports = proxyModel();
