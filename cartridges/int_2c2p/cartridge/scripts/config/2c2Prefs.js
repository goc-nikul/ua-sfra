'use strict';

var preferences = require('dw/system/Site').current.preferences.custom;

module.exports = {
    secret: 'secretKey2C2P' in preferences ? preferences.secretKey2C2P : null,
    merchantID: 'mid2C2P' in preferences ? preferences.mid2C2P : null,
    paymentChannel: '2c2PaymentChannel' in preferences ? preferences['2c2PaymentChannel'] : [],
    request3DS: '2c2pRequest3DS' in preferences ? preferences['2c2pRequest3DS'].value : null,
    frontendReturnUrl: '2c2FrontendReturnUrl' in preferences ? preferences['2c2FrontendReturnUrl'] : null,
    backendReturnUrl: '2c2pBackendReturnUrl' in preferences ? preferences['2c2pBackendReturnUrl'] : null,
    configuration2C2P: 'configuration2C2P' in preferences ? preferences.configuration2C2P : null,
    returnVersion: 'ReturnVersion2C2' in preferences ? preferences.ReturnVersion2C2 : 3.4,
    refundCancelMaxDays2C2: 'RefundCancelMaxDays2C2' in preferences ? preferences.RefundCancelMaxDays2C2 : 10
};
