'use strict';

class Spy {
    constructor() {
        this.data = {};
        this.called = false;
    }

    use(data) {
        this.called = true;
        this.data = data;
    }

    init() {
        this.data = {};
        this.called = false;
    }
}

module.exports = Spy;
