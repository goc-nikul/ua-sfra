'use strict';

/**
 * @returns {boolean} true/false
 */
function getDisableLiveChatLocales() {
    var Site = require('dw/system/Site');
    var exclusionsLocales = Site.getCurrent().getCustomPreferenceValue('sfscLiveChatDisableLocales');
    var currentLocale = request.locale.toLowerCase();
    return exclusionsLocales.map(locale => locale.toLowerCase()).includes(currentLocale);
}

module.exports = {
    getDisableLiveChatLocales: getDisableLiveChatLocales
};
