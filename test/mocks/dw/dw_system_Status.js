'use strict';
/* eslint-disable no-unused-vars */
class Status {
    static setClassConstants() {
        this.ERROR = 1;
        this.OK = 2;
    }
    addDetail(key, value) {
    }
}

Status.setClassConstants();

module.exports = Status;
