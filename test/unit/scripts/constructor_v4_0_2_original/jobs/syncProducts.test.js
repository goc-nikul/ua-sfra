var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();

describe('syncProducts', function () {
    var syncProducts;
    var spies;

    beforeEach(function () {
        spies = {
            createProductReader: sinon.stub().returns({}),
            parseProductParameters: sinon.stub().returns({}),
            syncAgent: {
                getTotalCount: sinon.stub().returns(1),
                read: sinon.stub(),
                process: sinon.stub(),
                write: sinon.stub(),
                afterStep: sinon.stub()
            },
            getLastModifiedDatePatch: sinon.stub().returns({}),
            buildProductApiPayload: sinon.stub().returns({}),
            transformProduct: sinon.stub().returns({}),
            feedTypes: sinon.stub().returns({})
        };

        spies.createSyncAgent = sinon.stub().returns(spies.syncAgent);

        syncProducts = proxyquire('../../../../../cartridges/link_constructor_connect/cartridge/scripts/jobs/syncProducts', {
            '*/cartridge/scripts/jobs/sync/products/parseProductParameters': spies.parseProductParameters,
            '*/cartridge/scripts/jobs/sync/products/productReader': {
                create: spies.createProductReader
            },
            '*/cartridge/scripts/jobs/sync/syncAgent': {
                create: spies.createSyncAgent
            },
            '*/cartridge/scripts/helpers/products/getLastModifiedDatePatch': spies.getLastModifiedDatePatch,
            '*/cartridge/scripts/jobs/sync/products/buildProductApiPayload': spies.buildProductApiPayload,
            '*/cartridge/scripts/helpers/products/transformProduct': spies.transformProduct,
            '*/cartridge/scripts/constants/feedTypes': spies.feedTypes
        });
    });


    describe('beforeStep', function () {
        var rawParameters = {};
        var stepExecution = {};

        it('should parse the product job parameters', function () {
            syncProducts.beforeStep(rawParameters, stepExecution);

            sinon.assert.calledOnce(spies.parseProductParameters);
            sinon.assert.calledWith(spies.parseProductParameters, rawParameters, stepExecution);
        });

        it('should initialize the reader', function () {
            syncProducts.beforeStep(rawParameters, stepExecution);

            sinon.assert.calledOnce(spies.createProductReader);
        });

        it('should create a sync agent', function () {
            syncProducts.beforeStep(rawParameters, stepExecution);

            sinon.assert.calledOnce(spies.createSyncAgent);
        });
    });

    describe('getTotalCount', function () {
        it('should call syncAgent.getTotalCount', function () {
            syncProducts.beforeStep({}, {});
            syncProducts.getTotalCount();

            sinon.assert.calledOnce(spies.syncAgent.getTotalCount);
        });
    });

    describe('read', function () {
        it('should call syncAgent.read', function () {
            syncProducts.beforeStep({}, {});
            syncProducts.read();

            sinon.assert.calledOnce(spies.syncAgent.read);
        });
    });

    describe('process', function () {
        it('should call syncAgent.process with the given record', function () {
            var record = { foo: 'bar' };

            syncProducts.beforeStep({}, {});
            syncProducts.process(record);

            sinon.assert.calledOnce(spies.syncAgent.process);
            sinon.assert.calledWith(spies.syncAgent.process, record);
        });
    });

    describe('write', function () {
        it('should call syncAgent.write with the given buffer', function () {
            var buffer = { toArray: function () { return []; } };

            syncProducts.beforeStep({}, {});
            syncProducts.write(buffer);

            sinon.assert.calledOnce(spies.syncAgent.write);
            sinon.assert.calledWith(spies.syncAgent.write, buffer);
        });
    });

    describe('afterStep', function () {
        it('should call syncAgent.afterStep', function () {
            syncProducts.beforeStep({}, {});
            syncProducts.afterStep();

            sinon.assert.calledOnce(spies.syncAgent.afterStep);
        });
    });
});
