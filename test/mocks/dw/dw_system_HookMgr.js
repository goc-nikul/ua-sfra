'use strict';

/* eslint-disable */

class HookMgr {
    constructor(status) {
        this.hooks = [];
        this.isCalled = false;
    }

    hasHook(hookID) {
        return this.hooks.includes(hookID) || true;
    }

    callHook(hookID) {
        this.isCalled = true;
        return this;
    }

    reinit() {
        this.isCalled = false;
        return this;
    }
}


module.exports = new HookMgr();
