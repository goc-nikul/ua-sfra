var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var assert = chai.assert;

describe('patchProducts', function () {
    var patchProducts;
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
            transformPatchProduct: sinon.stub().returns({}),
            feedTypes: sinon.stub().returns({})
        };

        spies.createSyncAgent = sinon.stub().returns(spies.syncAgent);

        patchProducts = proxyquire('../../../../../cartridges/link_constructor_connect_custom/cartridge/scripts/jobs/patchProducts', {
            '*/cartridge/scripts/jobs/sync/products/parseProductParameters': spies.parseProductParameters,
            '*/cartridge/scripts/jobs/sync/products/productReader': {
                create: spies.createProductReader
            },
            '*/cartridge/scripts/jobs/sync/syncAgent': {
                create: spies.createSyncAgent
            },
            '*/cartridge/scripts/helpers/products/getLastModifiedDatePatch': spies.getLastModifiedDatePatch,
            '*/cartridge/scripts/jobs/sync/products/buildProductApiPayload': spies.buildProductApiPayload,
            '*/cartridge/scripts/helpers/products/transformPatchProduct': spies.transformPatchProduct,
            '*/cartridge/scripts/constants/feedTypes': spies.feedTypes
        });
    });

    describe('beforeStep', function () {
        var rawParameters = {};
        var stepExecution = {};

        it('should parse the product job parameters', function () {
            patchProducts.beforeStep(rawParameters, stepExecution);

            assert.isTrue(spies.parseProductParameters.calledOnce);
            assert.isTrue(spies.parseProductParameters.calledWith(rawParameters, stepExecution));
        });

        it('should initialize the reader', function () {
            patchProducts.beforeStep(rawParameters, stepExecution);

            assert.isTrue(spies.createProductReader.calledOnce);
        });

        it('should create a sync agent', function () {
            patchProducts.beforeStep(rawParameters, stepExecution);

            assert.isTrue(spies.createSyncAgent.calledOnce);
        });
    });

    describe('getTotalCount', function () {
        it('should call syncAgent.getTotalCount', function () {
            patchProducts.beforeStep({}, {});
            patchProducts.getTotalCount();

            assert.isTrue(spies.syncAgent.getTotalCount.calledOnce);
        });
    });

    describe('read', function () {
        it('should call syncAgent.read', function () {
            patchProducts.beforeStep({}, {});
            patchProducts.read();

            assert.isTrue(spies.syncAgent.read.calledOnce);
        });
    });

    describe('process', function () {
        it('should call syncAgent.process with the given record', function () {
            var record = { foo: 'bar' };

            patchProducts.beforeStep({}, {});
            patchProducts.process(record);

            assert.isTrue(spies.syncAgent.process.calledOnce);
            assert.isTrue(spies.syncAgent.process.calledWith(record));
        });
    });

    describe('write', function () {
        it('should call syncAgent.write with the given buffer', function () {
            var buffer = { toArray: function () { return []; } };

            patchProducts.beforeStep({}, {});
            patchProducts.write(buffer);

            assert.isTrue(spies.syncAgent.write.calledOnce);
            assert.isTrue(spies.syncAgent.write.calledWith(buffer));
        });
    });

    describe('afterStep', function () {
        it('should call syncAgent.afterStep', function () {
            patchProducts.beforeStep({}, {});
            patchProducts.afterStep();

            assert.isTrue(spies.syncAgent.afterStep.calledOnce);
        });
    });
});
