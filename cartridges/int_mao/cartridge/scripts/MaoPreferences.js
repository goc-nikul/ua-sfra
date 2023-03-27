/* eslint-disable spellcheck/spell-checker */
const currentSite = require('dw/system/Site').getCurrent();
let Resource = require('dw/web/Resource');
let MAOPreferences = {};
if (!empty(currentSite.preferences)) {
    MAOPreferences = {
        MaoDomTokenChildOrgUsername: currentSite.getCustomPreferenceValue('MaoDomTokenChildOrgUsername'),
        MaoDomTokenChildOrgPassword: currentSite.getCustomPreferenceValue('MaoDomTokenChildOrgPassword'),
        MaoDomSaveOrderEndpointUrl: currentSite.getCustomPreferenceValue('MaoDomSaveOrderEndpointUrl'),
        MaoViewDefinition: currentSite.getCustomPreferenceValue('maoViewDefinition'),
        MaoBOPISViewDefinition: currentSite.getCustomPreferenceValue('maoBOPISViewDefinition'),
        RealTimeInventoryCheckPoints: currentSite.getCustomPreferenceValue('realTimeInventoryCheckPoints'),
        MaoAvailabilityEndpointUrl: currentSite.getCustomPreferenceValue('MaoAvailabilityEndpointUrl'),
        MaoAuthTokenEndpointUrl: currentSite.getCustomPreferenceValue('MaoAuthTokenEndpointUrl'),
        CustomerServicePhone: currentSite.getCustomPreferenceValue('customerServicePhone'),
        MaoBOPISAvailabilityEndpointUrl: currentSite.getCustomPreferenceValue('MaoBOPISAvailabilityEndpointUrl'),
        MaoDeliveryPriorityDays: currentSite.getCustomPreferenceValue('MaoDeliveryPriorityDays'),
        MaoSpecialZipCodes: !empty(currentSite.getCustomPreferenceValue('maoSpecialZipCodes')) ? currentSite.getCustomPreferenceValue('maoSpecialZipCodes').split(',') : '',
        MaoSpecialZipCodesCarrierCode: currentSite.getCustomPreferenceValue('maoSpecialZipCodesCarrierCode'),
        ManipulatePostalCode: currentSite.getCustomPreferenceValue('maoManipulatePostalCode'),
        ManipulatePostalCodeSeparator: Resource.msg('manipulatePostalCode.separator', 'mao', null),
        ManipulatePostalCodePosition: Resource.msg('manipulatePostalCode.position', 'mao', null),
        xiPayPayPalAuthEnabled: currentSite.getCustomPreferenceValue('Paymetric_XiPay_Is_PayPal_Auth_Enabled'),
        maoMaxFailedCount: currentSite.getCustomPreferenceValue('maoMaxFailedCount'),
        maoCarrierCodes: currentSite.getCustomPreferenceValue('shopRunnerCarrierCodes')
    };
}
module.exports = MAOPreferences;
