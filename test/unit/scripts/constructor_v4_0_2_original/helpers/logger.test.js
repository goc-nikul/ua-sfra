var sinon = require('sinon');
var chai = require('chai');
var assert = chai.assert;

describe('logger', function () {
    var flags = { flag1: 'value1', flag2: 'value2' };
    var message = 'Test message';
    var logger;
    var spies;

    beforeEach(function () {
        spies = {
            info: sinon.spy(),
            warn: sinon.spy(),
            debug: sinon.spy(),
            error: sinon.spy()
        };

        logger = require('../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/logger');

        // Mock dw Logger to add spies
        require('dw/system/Logger').getLogger = function () {
            return {
                info: spies.info,
                warn: spies.warn,
                debug: spies.debug,
                error: spies.error
            };
        };
    });

    describe('log', function () {
        it('should call logger.info', function () {
            logger.log(message);
            assert.isTrue(spies.info.calledWith('Test message'));
        });

        describe('when flags are provided', function () {
            it('should call logger.info with flags', function () {
                logger.log(message, flags);
                assert.isTrue(spies.info.calledWith('[flag1=value1] [flag2=value2] Test message'));
            });
        });

        describe('when the message is an object', function () {
            it('should call logger.info with the stringified message', function () {
                logger.log({ message: 'Test message' });
                assert.isTrue(spies.info.calledWith('{"message":"Test message"}'));
            });
        });
    });

    describe('warn', function () {
        it('should call logger.warn', function () {
            logger.warn(message);
            assert.isTrue(spies.warn.calledWith('Test message'));
        });

        describe('when flags are provided', function () {
            it('should call logger.warn with flags', function () {
                logger.warn(message, flags);
                assert.isTrue(spies.warn.calledWith('[flag1=value1] [flag2=value2] Test message'));
            });
        });

        describe('when the message is an object', function () {
            it('should call logger.warn with the stringified message', function () {
                logger.warn({ message: 'Test message' });
                assert.isTrue(spies.warn.calledWith('{"message":"Test message"}'));
            });
        });
    });

    describe('debug', function () {
        it('should call logger.debug', function () {
            logger.debug(message);
            assert.isTrue(spies.debug.calledWith('Test message'));
        });

        describe('when flags are provided', function () {
            it('should call logger.debug with flags', function () {
                logger.debug(message, flags);
                assert.isTrue(spies.debug.calledWith('[flag1=value1] [flag2=value2] Test message'));
            });
        });

        describe('when the message is an object', function () {
            it('should call logger.debug with the stringified message', function () {
                logger.debug({ message: 'Test message' });
                assert.isTrue(spies.debug.calledWith('{"message":"Test message"}'));
            });
        });
    });

    describe('error', function () {
        it('should call logger.error', function () {
            logger.error(message);
            assert.isTrue(spies.error.calledWith('Test message'));
        });

        describe('when flags are provided', function () {
            it('should call logger.error with flags', function () {
                logger.error(message, flags);
                assert.isTrue(spies.error.calledWith('[flag1=value1] [flag2=value2] Test message'));
            });
        });

        describe('when the message is an object', function () {
            it('should call logger.error with the stringified message', function () {
                logger.error({ message: 'Test message' });
                assert.isTrue(spies.error.calledWith('{"message":"Test message"}'));
            });
        });
    });
});
