const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;

describe('int_mao/cartridge/scripts/services/GoogleServiceAccountAuth', function () {
    var GoogleServiceAccountAuth;
    var payload = {
        payload: 'payload'
    }
    
    before(() => {
        GoogleServiceAccountAuth = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/services/GoogleServiceAccountAuth', {
            'dw/util/Bytes': function Bytes(stringToBytes) {
                this.stringToBytes = stringToBytes;
                this.replace = () => {
                    return this.stringToBytes;
                }
            },
            'dw/crypto/Encoding': {
                toBase64: (stringToEncode) => {
                    return stringToEncode;
                }
            },
            'dw/crypto/Signature': function Signature() {
                this.sign = (contentToSign, privateKey, signatureAlgorithm) => {
                    return signatureAlgorithm + privateKey;
                };
            }
        });
    });

    it('Testing function generateJWT, required argumants are undefined', () => {
        var privateKeyId = undefined;
        var privateKey = undefined;
        var jwt = GoogleServiceAccountAuth.generateJWT(payload, privateKeyId, privateKey);
        assert.equal(jwt, '');
    });

    it('Testing function generateJWT, expected result', () => {
        var privateKeyId = 'privateKeyId';
        var privateKey = 'privateKey';

        var header = JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: privateKeyId });
        var payloadString = JSON.stringify(payload);
        var signatureAlgorithm = 'SHA256withRSA';
        var signature = signatureAlgorithm + privateKey;

        var expectedJwtFormat = header + '.' + payloadString + '.' + signature;

        var jwt = GoogleServiceAccountAuth.generateJWT(payload, privateKeyId, privateKey);
        assert.equal(jwt, expectedJwtFormat);
    });
});
