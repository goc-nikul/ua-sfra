'use strict';

const Logger = require('dw/system/Logger').getLogger('constructor', 'constructor');
const Transaction = require('dw/system/Transaction');
const invStateMgr = require('*/cartridge/scripts/constructorio/inventoryStateManager');

/**
 * Setup HTTP PATCH Request to send Payload Data from Custom Object to Constructor.IO
 * @param {*} parameters 
 */
function exportToCIO(parameters) {
    var Site = require('dw/system/Site');
    var Bytes = require('dw/util/Bytes');
    var encoding = require('dw/crypto/Encoding');

    var config = require('link_constructor_connect_legacy/cartridge/scripts/helpers/config');
    var serviceDefinition = require('../../../../link_constructor_connect_legacy/cartridge/scripts/services/serviceDefinition');

    var cio = {
        key: config.getCredentialsOrNull(parameters.ApiKeyOverride, parameters.Locale),
        notification_email: Site.current.getCustomPreferenceValue('Constructor_APINotificationEmail'),
        service_url: Site.current.getCustomPreferenceValue('Constructor_ServiceURL')
    };

    var tokenBytes = new Bytes(Site.current.getCustomPreferenceValue('Constructor_ApiToken') + ':', 'UTF8');
    var authCode = 'Basic ' + encoding.toBase64(tokenBytes);
    var customObject = invStateMgr.getCustomObject();
    var inventoryJSON = (customObject && customObject.custom && customObject.custom.products) ? customObject.custom.products : undefined;
    var inventory = invStateMgr.createMapFromString(inventoryJSON);

    var service = serviceDefinition.init();
    var apiCallResult = null;
    var payload = { variations: invStateMgr.cioExport(inventory) };

    service.setURL(cio.service_url + 'v2/variations');
    service.setAuthentication('BASIC');
    service.addHeader('Authorization', authCode);
    service.addHeader('Content-Type', 'application/json');
    service.setRequestMethod('PATCH');
    service.addParam('key', cio.key);

    if (cio.notification_email) {
        service.addParam('notification_email', cio.notification_email);
    }

    if (parameters.onMissing) {
        service.addParam('on_missing', parameters.onMissing);
    }

    apiCallResult = service.call(JSON.stringify(payload));

    if (apiCallResult.isOk()) {
        Logger.info('inventoryManagement', 'info', 'Successfully sent one delta with ' + invStateMgr.numberOfObjects(payload) + ' records');
    } else {
        Logger.info('inventoryManagement', 'error', 'Error while sending one delta: ' + apiCallResult.getErrorMessage());
    }

    // Purge object
    if (parameters.purge) {
        Transaction.wrap(function () {
            customObject.custom.products = '';
        });
    }
}

module.exports.exportToCIO = exportToCIO;
