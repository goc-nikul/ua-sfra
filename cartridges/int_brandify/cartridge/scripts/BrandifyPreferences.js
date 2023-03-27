/* eslint-disable spellcheck/spell-checker */
const currentSite = require('dw/system/Site').getCurrent();
let BrandifyPreferences = {};
if (!empty(currentSite.preferences)) {
    BrandifyPreferences = {
        BrandifyAppKey: currentSite.getCustomPreferenceValue('brandifyAppKey'),
        BrandifyEnabled: currentSite.getCustomPreferenceValue('isBrandifyEnabled')
    };
}
module.exports = BrandifyPreferences;
