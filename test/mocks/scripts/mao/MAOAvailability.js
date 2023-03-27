var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
const currentSite = require('../../dw/dw_system_Site').getCurrent();
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
var maoAuthTokenHelperStub = sinon.stub();
maoAuthTokenHelperStub.returns({
    getValidToken: function () {
        return {
            accessToken: 'sadsfdsgfdgfdgdss'
        };
    }
});


function proxyModel() {
    var maoAvailability = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/availability/MAOAvailability', {
        'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': require('./MAOAvailabilityHelper'),
        'int_mao/cartridge/scripts/services/MaoService': require('./MaoService'),
        'int_mao/cartridge/scripts/MAOAuthTokenHelper': maoAuthTokenHelperStub,
        '~/cartridge/scripts/MaoPreferences': MAOPreferences,
        'dw/system/Logger': require('../../dw/dw_system_Logger')
    });
    return maoAvailability;
}

module.exports = proxyModel();
