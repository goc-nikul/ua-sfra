/**
 * Getting return label and tracking number from Canada Post Web Service
 * @param {order} order dw object
 * @param {string} rmaNumber - RMA Number
 * @returns {Object} args
 */
function createReturnLabel(order, rmaNumber) {
    var Logger = require('dw/system/Logger');
    var args = {}; // output object
    /* eslint-disable consistent-return */
    var serviceResult;
    var service;
    try {
        service = require('int_canadapost/cartridge/scripts/init/CanadaPostReturnService').createAuthorizedReturn;
        var requestObject = {
            order: order,
            rmaNumber: rmaNumber
        };
        serviceResult = service.call(requestObject);
        if (serviceResult.status !== 'OK') {
            Logger.error('CanadaPostCalls.js: ' + serviceResult.status + ':  ' + serviceResult.errorMessage);
            return args;
        }
        var authorizedReturnStatus = service.getResponse();
        if (authorizedReturnStatus.status === 'OK' && !empty(authorizedReturnStatus.artifactId) && !empty(authorizedReturnStatus.trackingNumber)) {
            args.trackingNumber = authorizedReturnStatus.trackingNumber;
            service = require('int_canadapost/cartridge/scripts/init/CanadaPostReturnService').getArtifact;
            serviceResult = service.call(authorizedReturnStatus.artifactId);
            if (serviceResult.status !== 'OK') {
                Logger.error('CanadaPostCalls.js: ' + serviceResult.status + ':  ' + serviceResult.errorMessage);
                return args;
            }
            var getArtifactReturnStatus = service.getResponse();
            if (getArtifactReturnStatus.status === 'OK' && !empty(getArtifactReturnStatus.shipLabel) && !empty(getArtifactReturnStatus.mimeType)) {
                args.shipLabel = getArtifactReturnStatus.shipLabel;
                args.mimeType = getArtifactReturnStatus.mimeType;
            }
        } else {
            args.errorDescription = authorizedReturnStatus.errorDescription;
        }
    } catch (e) {
        Logger.error('CanadaPostCalls.js: ' + e.message);
        return args;
    }
    return args;
    /* eslint-disable consistent-return */
}

exports.createReturnLabel = createReturnLabel;
