'use script';

/**
 * Determine if requets is transactional for OCAPI request. It is not transactional on 'GET' requests.
 * @param {Object} request - request object
 * @returns {boolean} - boolean to indicate if request is transactional.
 */
function isRequestTransactional(request) {
    const isGetHttpRequest = request && request.httpMethod === 'GET';
    const isOcapiRequest = !!(request && request.clientId && !request.SCAPI && request.ocapiVersion);

    return !(isGetHttpRequest && isOcapiRequest);
}
exports.isRequestTransactional = isRequestTransactional;
