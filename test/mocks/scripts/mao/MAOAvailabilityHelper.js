var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const currentSite = require('../../dw/dw_system_Site').getCurrent();

function proxyModel() {
    let MAOPreferences = {
        MaoDomTokenChildOrgUsername: currentSite.getCustomPreferenceValue('MaoDomTokenChildOrgUsername'),
        MaoDomTokenChildOrgPassword: currentSite.getCustomPreferenceValue('MaoDomTokenChildOrgPassword'),
        MaoDomSaveOrderEndpointUrl: currentSite.getCustomPreferenceValue('MaoDomSaveOrderEndpointUrl'),
        MaoViewDefinition: currentSite.getCustomPreferenceValue('maoViewDefinition'),
        MaoBOPISViewDefinition: currentSite.getCustomPreferenceValue('maoBOPISViewDefinition'),
        RealTimeInventoryCheckPoints: currentSite.getCustomPreferenceValue('realTimeInventoryCheckPoints'),
        MaoAvailabilityEndpointUrl: currentSite.getCustomPreferenceValue('MaoAvailabilityEndpointUrl'),
        MaoAuthTokenEndpointUrl: currentSite.getCustomPreferenceValue('MaoAuthTokenEndpointUrl'),
        CustomerServicePhone: currentSite.getCustomPreferenceValue('customerServicePhone'),
        MaoBOPISAvailabilityEndpointUrl: currentSite.getCustomPreferenceValue('MaoBOPISAvailabilityEndpointUrl')
    };

    var maoAvailability = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/availability/MAOAvailabilityHelper', {
        '~/cartridge/scripts/MaoPreferences': MAOPreferences,
        '*/cartridge/scripts/util/collections': require('../util/collections'),
        'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger')
    });
    return maoAvailability;
}

module.exports = proxyModel();
