'use strict';

/**
 * Controller that provides a way to find site preferences within the Business Manager
 * @module controllers/Preferencesfinder
 */

var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Map the given attribute definition to a simple object
 * @param {dw/value/ObjectAttributeDefinition} attributeDefinition The attribute definition to map as simple object
 * @returns {Object} The mapping object
 */
var mapAttribute = function (attributeDefinition) {
    return {
        id: attributeDefinition.getID(),
        displayName: attributeDefinition.getDisplayName()
    };
};

/**
 * Map the given attribute group to a simple object
 *
 * @param {dw/value/ObjectAttributeGroup} groupDefinition The attribute group to map as simple object
 * @param {string} groupURL The URL of the group from the BM
 * @param {string} appendedParameter The parameter to append to the groupURL that will contain the group ID
 *
 * @returns {Object} The attribute group
 */
var mapGroup = function (groupDefinition, groupURL, appendedParameter) {
    return {
        id: groupDefinition.getID(),
        bm_link: groupURL.toString() + StringUtils.format(appendedParameter, groupDefinition.getID()),
        displayName: groupDefinition.getDisplayName(),
        description: groupDefinition.getDescription(),
        attributes: groupDefinition.getAttributeDefinitions().toArray().map(mapAttribute)
    };
};

/**
 * Loads the groups & attributes from the given preferences instance
 *
 * @param {dw/obkect/ExtensibleObject} preferences The preferences from which to load the groups & attributes
 * @param {string} groupURL The URL of the group from the BM
 * @param {string} appendedParameter The parameter to append to the groupURL that will contain the group ID
 *
 * @returns {Array} The result array
 */
var loadGroups = function (preferences, groupURL, appendedParameter) {
    var describe = preferences.describe();
    var preferencesGroups = describe.getAttributeGroups().toArray().map(function (groupDefinition) {
        return mapGroup(groupDefinition, groupURL, appendedParameter);
    });

    var orphanedAttributes = describe.getAttributeDefinitions().toArray().filter(function (attributeDefinition) {
        return attributeDefinition.getAttributeGroups().isEmpty();
    }).map(mapAttribute);
    if (orphanedAttributes.length > 0) {
        preferencesGroups.unshift({
            id: 'Orphaned',
            displayName: 'Orphaned attributes',
            description: 'Contains any attribute which is not part of any group',
            attributes: orphanedAttributes
        });
    }

    return preferencesGroups;
};

/**
 * Renders the preferences object definitions
 */
function start() {
    var csrf = request.httpParameterMap.csrf_token.stringValue;
    var globalPreferencesGroups = loadGroups(require('dw/system/System').getPreferences(), URLUtils.url('GlobalCustomPreferences-ViewGroup', 'csrf_token', csrf), '&PrefGroupID={0}');
    var sitePreferencesGroups = loadGroups(require('dw/system/Site').getCurrent().getPreferences(), URLUtils.url('ViewApplication-BM', 'csrf_token', csrf), '#/?preference#site_preference_group_attributes!id!{0}');

    app.getView({
        globalPreferencesGroups: globalPreferencesGroups,
        sitePreferencesGroups: sitePreferencesGroups,
        title: 'Preferences Finder'
    }).render('preferences/results');
}

/** Renders the site preferences object definitions
 * @see {@link module:controllers/Preferencesfinder~start} */
exports.Start = guard.ensure(['https'], start);
