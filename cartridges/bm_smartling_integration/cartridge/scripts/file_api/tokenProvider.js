"use strict";
importPackage(dw.util);

var httpUtils = require('/bm_smartling_integration/cartridge/scripts/file_api/httpUtils.js');
var smartlingConfig = require('/bm_smartling_integration/cartridge/scripts/dao/configuration.ds');
var dwSystem = require('dw/system');
var dwNet = require('dw/net');
var ExceptionLog = require('/bm_smartling_integration/cartridge/scripts/utils/ExceptionLog.ds').ExceptionLog;
var LOGGER = new ExceptionLog(dwSystem.Logger.getLogger("smartling", "tokenProvider"));

var SMARTLING_API_URL = "https://api.smartling.com";
var AUTH_API_V2_AUTHENTICATE = "/auth-api/v2/authenticate";
var AUTH_API_V2_AUTHENTICATE_REFRESH = "/auth-api/v2/authenticate/refresh";
var APPLICATION_JSON_TYPE = "application/json";
var POST_REQUEST = "POST";

var accessTokenExpiresAt = null;
var refreshTokenExpiresAt = null;
var refreshToken = null;
var accessToken = null;

function getAuthenticationToken() {
    if (accessTokenIsNotValid()) {
        if (refreshTokenIsNotValid()) {
            return getNewAccessToken();
        } else {
            return refreshAccessToken();
        }
    } else {
        return accessToken;
    }
}

function resetTokens() {
    accessToken = null;
    refreshToken = null;
    accessTokenExpiresAt = null;
    refreshTokenExpiresAt = null;
}

function getNewAccessToken() {
    return authenticateWithCredentials(smartlingConfig.getUserIdentifier(), smartlingConfig.getUserSecret());
}

function checkConnection(userIdentifier, userSecret) {
    // "Check Connection" sends an empty secret if it isn't changed by the user
    if (empty(userSecret)) {
        userSecret = smartlingConfig.getUserSecret();
    }
    return authenticateWithCredentials(userIdentifier, userSecret);
}

function authenticateWithCredentials(userIdentifier, userSecret) {

    var client = createJsonPostRequest(SMARTLING_API_URL + AUTH_API_V2_AUTHENTICATE);
    var oauthRequest = JSON.stringify({
        "userIdentifier": userIdentifier,
        "userSecret": userSecret
    });

    LOGGER.debug("Sending request to: {0} {1}", AUTH_API_V2_AUTHENTICATE, oauthRequest);
    client.send(oauthRequest);

    var response = httpUtils.parseResponse(client);
    return extractDataFromResponse(response);
}

function refreshAccessToken() {
    try {
        var client = createJsonPostRequest(SMARTLING_API_URL + AUTH_API_V2_AUTHENTICATE_REFRESH);
        var oauthRequest = JSON.stringify({"refreshToken": refreshToken});

        LOGGER.debug("Sending request to: {0} {1}", AUTH_API_V2_AUTHENTICATE_REFRESH, oauthRequest);
        client.send(oauthRequest);

        var response = httpUtils.parseResponse(client);
        return extractDataFromResponse(response);
    } catch (e) {
        LOGGER.errorException('Got error during refreshing access token', e);
        return getNewAccessToken();
    }
}

function extractDataFromResponse(response) {
    refreshToken = response["response"]["data"]["refreshToken"];
    accessToken = response["response"]["data"]["accessToken"];
    var refreshTokenExpiresIn = response["response"]["data"]["refreshExpiresIn"];
    var accessTokenExpiresIn = response["response"]["data"]["expiresIn"];
    accessTokenExpiresAt = new Calendar();
    accessTokenExpiresAt.add(Calendar.SECOND, accessTokenExpiresIn);
    LOGGER.debug("Got new access token that will expire at: {0} ", accessTokenExpiresAt.getTime());
    refreshTokenExpiresAt = new Calendar();
    refreshTokenExpiresAt.add(Calendar.SECOND, refreshTokenExpiresIn);
    LOGGER.debug("Got new refresh token that will expire at: {0} ", refreshTokenExpiresAt.getTime());
    return accessToken;
}

function createJsonPostRequest(url) {
    var client = new dwNet.HTTPClient();
    client.open(POST_REQUEST, url);
    client.setRequestHeader('Content-Type', APPLICATION_JSON_TYPE);
    return client;
}

function accessTokenIsNotValid() {
    return accessToken == null || accessTokenExpiresAt == null || accessTokenIsExpired();
}

function accessTokenIsExpired() {
    var currentTime = new Calendar();
    accessTokenExpiresAt.add(Calendar.SECOND, -3);
    var expired = currentTime.after(accessTokenExpiresAt);
    if (expired) {
        LOGGER.debug("Access token expired at: {0}[now: {1}] ", accessTokenExpiresAt.getTime(), currentTime.getTime());
    }
    return expired;
}

function refreshTokenIsNotValid() {
    return refreshToken == null || refreshTokenExpiresAt == null || refreshTokenIsExpired();
}

function refreshTokenIsExpired() {
    var currentTime = new Calendar();
    refreshTokenExpiresAt.add(Calendar.SECOND, -3);
    var expired = currentTime.after(refreshTokenExpiresAt);
    if (expired) {
        LOGGER.debug("Refresh token expired at: {0}[now: {1}] ", refreshTokenExpiresAt.getTime(), currentTime.getTime());
    }
    return expired;
}

exports.getAuthenticationToken = getAuthenticationToken;
exports.resetTokens = resetTokens;
exports.checkConnection = checkConnection;