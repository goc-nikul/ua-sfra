'use strict';

class MessageDigest {
    constructor(method = 'MD5') {
        this.method = method;
        this.DIGEST_SHA_256 = 'SHA-256';
    }

    digestBytes(marker) {
        return marker.toString();
    }

    digest(marker) {
        return marker.toString();
    }
}

module.exports = MessageDigest;
