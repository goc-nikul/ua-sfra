'use strict';
var Site = require('dw/system/Site');
/**
 * returns true if auruspay is enabled
 * @returns {boolean} true if auruspay is enabled else false
 */
function isAurusEnabled() {
    if (!empty(Site.current.getCustomPreferenceValue('enableAurusPay')) && Site.current.getCustomPreferenceValue('enableAurusPay')) {
        return true;
    }
    return false;
}
/**
 * returns true if savingExpeience is enabled
 * @returns {boolean} true if savingExpeience is enabled else false
 */
function showSavingExperience() {
    if (!empty(Site.current.getCustomPreferenceValue('enableSavingExperience')) && Site.current.getCustomPreferenceValue('enableSavingExperience')) {
        return Site.current.getCustomPreferenceValue('enableSavingExperience');
    }
    return false;
}
/**
 * returns number if floorPricing is enabled
 * @returns {number} Number if floorPricing is enabled
 */
function getFloorPricing() {
    let floorPricing = 0;
    if (!empty(Site.current.getCustomPreferenceValue('savingExperienceFloorPrice')) && Site.current.getCustomPreferenceValue('savingExperienceFloorPrice')) {
        floorPricing = Site.current.getCustomPreferenceValue('savingExperienceFloorPrice');
    }
    return floorPricing;
}
module.exports = {
    isAurusEnabled: isAurusEnabled,
    showSavingExperience: showSavingExperience,
    getFloorPricing: getFloorPricing
};
