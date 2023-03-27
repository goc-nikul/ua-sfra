'use strict';
const currentSite = require('dw/system/Site').getCurrent();
let firstDataPreferences = {};
if (!empty(currentSite.preferences)) {
    firstDataPreferences = {
        clientId: currentSite.getCustomPreferenceValue('firstDataAuthClientId'),
        clientSecret: currentSite.getCustomPreferenceValue('firstDataAuthClientSecret'),
        audience: currentSite.getCustomPreferenceValue('firstDataAuthAudience'),
        grantType: currentSite.getCustomPreferenceValue('firstDataAuthGrantType'),
        authHostname: currentSite.getCustomPreferenceValue('firstDataAuthHostname'),
        graphQLApiUrl: currentSite.getCustomPreferenceValue('firstDataGraphQLApiUrl'),
        maxGiftcards: currentSite.getCustomPreferenceValue('firstDataMaxGiftcards') ? currentSite.getCustomPreferenceValue('firstDataMaxGiftcards') : 2
    };
}
module.exports = firstDataPreferences;
