'use strict';

/* eslint-disable spellcheck/spell-checker */
const currentSite = require('dw/system/Site').getCurrent();
let idmPreferences = {};
if (!empty(currentSite.preferences)) {
    idmPreferences = {
        isIdmEnabled: currentSite.getCustomPreferenceValue('uaidmIsEnabled'),
        updateProfileOnLogin: currentSite.getCustomPreferenceValue('uaidmUpdateProfileOnLogin'),
        oauthProviderId: currentSite.getCustomPreferenceValue('uaidmOauthProviderId'),
        clientId: currentSite.getCustomPreferenceValue('uaidmClientId'),
        clientSecret: currentSite.getCustomPreferenceValue('uaidmClientSecret'),
        jwtSigningKeyId: currentSite.getCustomPreferenceValue('uaidmJwtSigningKeyId'),
        jwtSigningKey: currentSite.getCustomPreferenceValue('uaidmJwtSigningKey'),
        storefrontPassword: currentSite.getCustomPreferenceValue('uaidmSfccStorefrontPassword'),
        redirectURI: currentSite.getCustomPreferenceValue('uaidmRedirectURI'),
        fbAppID: currentSite.getCustomPreferenceValue('facebookAppID'),
        accountLinksDomain: currentSite.getCustomPreferenceValue('uaidmAccountLinksDomain'),
        uaidmEnableRegisterFEValidation: currentSite.getCustomPreferenceValue('uaidmEnableRegisterFEValidation'),
        enableForcePasswordReset: currentSite.getCustomPreferenceValue('enableForcePasswordReset')
    };
}
module.exports = idmPreferences;
