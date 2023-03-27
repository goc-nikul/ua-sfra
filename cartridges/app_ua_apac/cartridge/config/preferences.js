'use strict';

var base = module.superModule;
var Site = require('dw/system/Site');
var preferences = Site.current.preferences.custom;

/**
 * Get Locale specific country code
 * @returns {string} return locale specific country code
 */
function getLocaleCountry() {
    return require('dw/util/Locale').getLocale(request.locale).country;// eslint-disable-line
}

base.qasValidCountries = 'qasValidCountries' in preferences ? preferences.qasValidCountries : null;
base.businessTypeAddressEnabled = 'businessTypeAddressEnabled' in preferences ? preferences.businessTypeAddressEnabled : null;
base.isPersonalizationEnable = 'enablePersonalization' in preferences ? preferences.enablePersonalization : false;
base.isZipPayEnabled = 'enableZippay' in preferences && preferences.enableZippay.length > 0 && preferences.enableZippay.indexOf(getLocaleCountry()) !== -1;
base.DaumLoaderScript = 'DaumLoaderScript' in preferences && preferences.DaumLoaderScript.length > 0 ? preferences.DaumLoaderScript : '';
base.isDaumAddressLookupEnabled = 'enableDaumAddressLookup' in preferences && base.DaumLoaderScript !== '' ? preferences.enableDaumAddressLookup : false;
base.isShowOnlyLastNameAsNameFieldEnabled = 'showOnlyLastNameAsNameField' in preferences ? preferences.showOnlyLastNameAsNameField : false;
base.isShowSplitPhoneMobileField = 'showSplitPhoneMobileField' in preferences && preferences.showSplitPhoneMobileField;
base.isShowSplitEmailField = 'showSplitEmailField' in preferences && preferences.showSplitEmailField;
base.isKRCustomCheckoutEnabled = 'isKRCustomCheckoutEnabled' in preferences && preferences.isKRCustomCheckoutEnabled;
base.MinimumAgeRestriction = 'minimumAgeRestriction' in preferences && preferences.minimumAgeRestriction;
base.ShowBirthYearField = 'showBirthYearField' in preferences && preferences.showBirthYearField;

module.exports = base;
