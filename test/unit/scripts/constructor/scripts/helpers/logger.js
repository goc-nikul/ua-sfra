const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var logger = require('../../../../../mocks/constructor/helpers/logger');

describe('log function', function () {
    it('should log an error message', function () {
        var moduleName = 'ModuleName';
        var type = 'error';
        var message = 'Error message';
        var content = '[' + type + '] ' + moduleName + ': ' + message;

        var result = logger.log(moduleName, type, message);

        expect(result).to.equal(content);
    });

    it('should log an info message', function () {
        var moduleName = 'ModuleName';
        var type = 'info';
        var message = 'Info message';
        var content = '[' + type + '] ' + moduleName + ': ' + message;

        var result = logger.log(moduleName, type, message);

        expect(result).to.equal(content);
    });
});
