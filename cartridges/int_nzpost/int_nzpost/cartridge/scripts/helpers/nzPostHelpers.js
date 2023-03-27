'use strict';

var customObjectHelper = require('*/cartridge/scripts/helpers/customObjectHelpers');

/**
 * Access token from service
 * @returns {string|null} returns OAuth access token
 */
function getOAuthToken() {
    var nzpostService = require('*/cartridge/scripts/services/nzpostService');
    var serviceResult = nzpostService.getOAuthTokenService().call();
    if (!serviceResult.OK || !serviceResult.object || !serviceResult.object.text) return null;
    try {
        return JSON.parse(serviceResult.object.text);
    } catch (e) {
        e.stack; // eslint-disable-line
    }
    return null;
}

/**
 * validates error is due to Auth
 * @param {Object} parcelResponse service response
 * @returns {boolean} status indicates error is due to Auth or not
 */
function isAuthError(parcelResponse) {
    var isAuthErrorObj = (parcelResponse.error === 401 || parcelResponse.errorMessage.indexOf('invalid_grant') !== -1);
    if (isAuthErrorObj) customObjectHelper.resetAuthToken();
    return isAuthErrorObj;
}

/**
 * ConsignmentId from service
 * @param {string} orderNo order number
 * @param {string} email email
 * @returns {string | null} returns consignmentId
 */
function getConsignmentId(orderNo, email) {
    var accessToken = customObjectHelper.getAuthToken();
    if (!accessToken) {
        var oAuthToken = getOAuthToken();
        if (!oAuthToken) return null;
        accessToken = oAuthToken.access_token;
    }
    if (!accessToken) return null;
    // Pass the access token in header
    var Consigment = require('*/cartridge/models/request/consignment');
    var parcelService = require('*/cartridge/scripts/services/nzpostService').getParcelLabelService(accessToken);
    parcelService.setRequestMethod('POST');
    var parcelResponse = parcelService.call(new Consigment(orderNo, email));
    if (!parcelResponse.OK || !parcelResponse.object || !parcelResponse.object.text) {
        // If request fails because of Auth delete the value from custom object and reinstitate the request
        if (!isAuthError(parcelResponse)) return null;
        return getConsignmentId(orderNo, email);
    }
    try {
        var responseText = JSON.parse(parcelResponse.object.text);
        return responseText.success ? responseText.consignment_id : null;
    } catch (e) {
        e.stack; // eslint-disable-line
    }
    return null;
}

/**
 * Current consignmentId's Label status
 * @param {string} consignmentId consignmentId
 * @returns {string | null} returns status of label
 */
function getLabelStatus(consignmentId) {
    var accessToken = customObjectHelper.getAuthToken();
    if (!accessToken) {
        var oAuthToken = getOAuthToken();
        if (!oAuthToken) return null;
        accessToken = oAuthToken.access_token;
    }
    if (!accessToken) return null;
    // Pass the access token in header
    var parcelService = require('*/cartridge/scripts/services/nzpostService').getParcelLabelService(accessToken);
    parcelService.setRequestMethod('GET');
    parcelService.URL += ('/' + consignmentId + '/status');
    var parcelResponse = parcelService.call();
    if (!parcelResponse.OK || !parcelResponse.object || !parcelResponse.object.text) {
        // If request fails because of Auth delete the value from custom object and reinstitate the request
        if (!isAuthError(parcelResponse)) return null;
        return getLabelStatus(consignmentId);
    }
    try {
        var responseText = JSON.parse(parcelResponse.object.text);
        return (responseText.success && responseText.consignment_status && responseText.consignment_status === 'Complete' && responseText.labels.length > 0) ?
            responseText.labels[0].tracking_reference :
            null;
    } catch (e) {
        e.stack; // eslint-disable-line
    }
    return null;
}

/**
 * Get base64 encoded lable Image from service
 * @param {string} consignmentId consignmentId
 * @returns {string | null} base64 encoded label image
 */
function getPrintLabel(consignmentId) {
    var accessToken = customObjectHelper.getAuthToken() || getOAuthToken().access_token;
    if (!accessToken) return null;
    // Pass the access token in header
    var parcelService = require('*/cartridge/scripts/services/nzpostService').getParcelLabelService(accessToken);
    parcelService.setRequestMethod('GET');
    parcelService.URL += ('/' + consignmentId + '?format=PNG&page=1&base64=true');
    var parcelResponse = parcelService.call();
    if (!parcelResponse.OK || !parcelResponse.object || !parcelResponse.object.text) {
        // If request fails because of Auth delete the value from custom object and reinstitate the request
        if (!isAuthError(parcelResponse)) return null;
        return getPrintLabel(consignmentId);
    }
    try {
        var responseText = JSON.parse(parcelResponse.object.text);
        return responseText.success ? responseText.label.data : null;
    } catch (e) {
        e.stack; // eslint-disable-line
    }
    return null;
}

module.exports = {
    getConsignmentId: getConsignmentId,
    getOAuthToken: getOAuthToken,
    getLabelStatusAndTrackingNumber: getLabelStatus,
    getPrintLabel: getPrintLabel
};
