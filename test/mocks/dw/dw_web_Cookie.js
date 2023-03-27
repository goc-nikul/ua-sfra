'use strict';
/* eslint-disable no-unused-vars */
class Cookie {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }

    setMaxAge(maxAge) {
        this.maxAge = maxAge;
    }

    setPath(path) {
        return this.path;
    }

    setHttpOnly(httpOnly) {
        this.httpOnly = httpOnly;
    }

    getMaxAge() {
        return this.maxAge;
    }

    getPath() {
        return this.path;
    }

}

module.exports = Cookie;
