'use strict';
/* eslint-disable no-unused-vars */
class Status {
    constructor(status, code, message) {
        this.status = status;
        this.code = code;
        this.message = message;
        this.details = {};
    }
    static setClassConstants() {
        this.ERROR = 1;
        this.OK = 2;
    }
    addDetail(key, value) {
        this.details[key] = value;
    }
}

Status.setClassConstants();

module.exports = Status;
