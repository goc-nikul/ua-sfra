'use strict';

/**
 * Controller that provides functions Business Manager Sessions.
 * @module controllers/BrowseRemote
 */
var KeyRef = require('dw/crypto/KeyRef');
var Logger = require('dw/system/Logger');
var HTTPClient = require('dw/net/HTTPClient');
var Status = require('dw/system/Status');
var HashMap = require('dw/util/HashMap');


/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');
var JWTUtil = require('*/cartridge/scripts/util/JWTUtil');

/**
 * Calls submits a request to the given URL.
 *
 * @param {string} requestURL The URL to call
 * @param {string} method The method to use
 * @param {string} body The body to use
 * @param {string} keyAlias The keyAlias to use
 * @param {string} serviceID The service ID to use
 * @param {boolean} useJWT Use JWT or not
 * @returns {Object} The pipeline dictionary object
 */
function performHttpRequest(requestURL, method, body, keyAlias, serviceID, useJWT) {
    if (!requestURL) {
        Logger.debug('ExecuteURL.ds: feedURI job parameter is missing.');
        return null;
    }

    var message = null;
    var requestResult = {};
    var responseHeaders = new HashMap();
    var status = new Status(Status.OK);
    var jwt;

    if (useJWT === true && !empty(body) && !empty(keyAlias)) {
        jwt = JWTUtil.getJWTWithCertificate(
            body,
            keyAlias
        );
    }

    if (empty(serviceID)) {
        var httpClient = new HTTPClient();
        try {
            httpClient.setTimeout(25000);
            if (!empty(keyAlias) && empty(jwt)) {
                httpClient.setIdentity(KeyRef(keyAlias));
            }
            if (useJWT === true && !empty(jwt)) {
                httpClient.setRequestHeader('Authorization', 'Bearer ' + jwt);
            }
            httpClient.open(method, requestURL);
            if (empty(body)) {
                httpClient.send();
            } else {
                httpClient.send(body);
            }

            if (httpClient.statusCode === 200) {
                message = httpClient.text;
            } else {
                // error handling
                status = new Status(Status.ERROR, httpClient.statusCode, 'Code: ' + httpClient.statusCode + ' Message: ' + httpClient.statusMessage);
            }

            httpClient.allResponseHeaders.keySet().toArray().forEach(function (key) {
                var value = httpClient.getResponseHeader(key);
                responseHeaders.put(key, value);
            });
            requestResult.ResponseHeaders = responseHeaders;
        } catch (e) {
            message = 'An error occured with status code ' + e;
            status = new Status(Status.ERROR, httpClient.statusCode, e);
        }
    } else {
        var service = require('dw/svc/LocalServiceRegistry').createService(serviceID, {
            createRequest: function createRequest(svc) {
                svc.setRequestMethod(method);
                svc.setURL(requestURL);
                if (!empty(keyAlias) && empty(jwt)) {
                    svc.setIdentity(KeyRef(keyAlias));
                }
                if (useJWT === true && !empty(jwt)) {
                    svc.addHeader('Authorization', 'Bearer ' + jwt);
                }
                return !empty(body) ? body : undefined;
            },
            parseResponse: function (svc, response) {
                return response.text;
            },
        });
        var resultService;

        try {
            resultService = service.call();
            if(resultService.status == 'OK') {
                message = resultService.object;
            } else {
                // Handle the error. See result.error for more information.
                status = new Status(Status.ERROR, resultService.object.statusCode, 'Code: ' + resultService.object.statusCode + ' Message: ' + resultService.errorMessage);
            }

            service.client.allResponseHeaders.keySet().toArray().forEach(function (key) {
                var value = service.client.getResponseHeader(key);
                responseHeaders.put(key, value);
            });
            requestResult.ResponseHeaders = responseHeaders;
        } catch (e) {
            message = 'An error occured with status code ' + e;
            status = new Status(Status.ERROR, resultService.object.statusCode, e);
        }
    }
    requestResult.RawData = message;
    requestResult.Status = status;
    return requestResult;
}

/**
 * Requests a given URL and returns it.
 */
function httpRequest() {
    var pdict = {
        mainmenuname: request.httpParameterMap.mainmenuname.value,
        CurrentMenuItemId: request.httpParameterMap.CurrentMenuItemId.value
    };

    var requestURL = app.getForm('browseremote.http.url').value();
    var method = app.getForm('browseremote.http.method').value();
    var body = app.getForm('browseremote.http.body').value();
    var keyAlias = app.getForm('browseremote.http.key').value();
    var serviceID = app.getForm('browseremote.http.serviceID').value();
    var useJWT = app.getForm('browseremote.http.usejwt').value();
    if (requestURL) {
        pdict.RequestResult = performHttpRequest(requestURL, method, body, keyAlias, serviceID, useJWT);
    }

    app.getView(pdict).render('browseremote/geturi');
}

/** Keeps a session alive.
 * @see {@link module:controllers/BrowseRemote~httpRequest} */
exports.Http = guard.ensure(['https'], httpRequest);
