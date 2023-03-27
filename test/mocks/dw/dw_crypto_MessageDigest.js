'use strict';

class MessageDigest {
    constructor(method = 'MD5') {
        this.method = method;
    }

    digestBytes(marker) {
        return marker.toString();
    }
}

module.exports = MessageDigest;
