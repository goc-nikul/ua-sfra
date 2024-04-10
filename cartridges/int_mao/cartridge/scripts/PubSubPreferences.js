/* eslint-disable spellcheck/spell-checker */
const Logger = require('dw/system/Logger').getLogger('MaoOrderExport', 'MaoOrderExport');
const currentSite = require('dw/system/Site').getCurrent();
let PubSubPreferences = {};
if (!empty(currentSite.preferences)) {
    var pubSubConfig;
    var pubSubConfigPref = currentSite.getCustomPreferenceValue('GooglePubSubConfig');
    if (pubSubConfigPref) {
        try {
            pubSubConfig = JSON.parse(pubSubConfigPref);
        } catch (error) {
            Logger.error(JSON.stringify(error));
        }
    }
    PubSubPreferences = {
        isEnabled: currentSite.getCustomPreferenceValue('isPubSubEnabled'),
        topic_id: currentSite.getCustomPreferenceValue('pubSubTopicId'),
        organization: currentSite.getCustomPreferenceValue('pubSubOrganization'),
        user: currentSite.getCustomPreferenceValue('pubSubUser'),
        client_email: (pubSubConfig && pubSubConfig.client_email) ? pubSubConfig.client_email : '',
        client_id: (pubSubConfig && pubSubConfig.client_id) ? pubSubConfig.client_id : '',
        private_key_id: (pubSubConfig && pubSubConfig.private_key_id) ? pubSubConfig.private_key_id : '',
        private_key: (pubSubConfig && pubSubConfig.private_key) ? pubSubConfig.private_key : '',
        project_id: (pubSubConfig && pubSubConfig.project_id) ? pubSubConfig.project_id : ''
    };
}
module.exports = PubSubPreferences;
