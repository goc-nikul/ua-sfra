'use strict';

const currentSite = require('dw/system/Site').getCurrent();
let adobeTargetPreferences = {};
if (!empty(currentSite.preferences)) {
    adobeTargetPreferences = {
        isVecEnabled: currentSite.getCustomPreferenceValue(
            'adobeTargetIsVecEnabled'
        ),
        clientCode: currentSite.getCustomPreferenceValue(
            'adobeTargetClientCode'
        ),
        propertyId: currentSite.getCustomPreferenceValue('adobeTargetProperty'),
        orgId: currentSite.getCustomPreferenceValue('adobeTargetOrgId'),
        rsid: currentSite.getCustomPreferenceValue('adobeTargetRsid')
    };
}
module.exports = adobeTargetPreferences;
