'use strict';

class CustomString extends String {
    constructor(value) {
        super(value);
    }
    equals(str) {
        return this.toLocaleLowerCase() === str.toLocaleLowerCase();
    }
    equalsIgnoreCase(str) {
        return this.toLocaleLowerCase() === str.toLocaleLowerCase();
    }
}

module.exports = CustomString;
