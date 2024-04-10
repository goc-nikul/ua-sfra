var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var assert = chai.assert;

describe('syncCategories', function () {
    var syncCategories;
    var spies;

    beforeEach(function () {
        spies = {
            createCategoryReader: sinon.stub().returns({}),
            parseBaseParameters: sinon.stub().returns({}),
            syncAgent: {
                getTotalCount: sinon.stub().returns(1),
                read: sinon.stub(),
                process: sinon.stub(),
                write: sinon.stub(),
                afterStep: sinon.stub()
            },
            buildCategoryApiPayload: sinon.stub().returns({}),
            transformCategory: sinon.stub().returns({}),
            feedTypes: sinon.stub().returns({})
        };

        spies.createSyncAgent = sinon.stub().returns(spies.syncAgent);

        syncCategories = proxyquire('../../../../../cartridges/link_constructor_connect/cartridge/scripts/jobs/syncCategories', {
            '*/cartridge/scripts/jobs/sync/parseBaseParameters': spies.parseBaseParameters,
            '*/cartridge/scripts/jobs/sync/categories/buildCategoryApiPayload': spies.buildCategoryApiPayload,
            '*/cartridge/scripts/jobs/sync/categories/categoryReader': {
                create: spies.createCategoryReader
            },
            '*/cartridge/scripts/jobs/sync/syncAgent': {
                create: spies.createSyncAgent
            },
            '*/cartridge/scripts/helpers/categories/transformCategory': spies.transformCategory,
            '*/cartridge/scripts/constants/feedTypes': spies.feedTypes
        });
    });

    describe('beforeStep', function () {
        var rawParameters = {};
        var stepExecution = {};

        it('should parse the job parameters', function () {
            syncCategories.beforeStep(rawParameters, stepExecution);

            assert.isTrue(spies.parseBaseParameters.calledOnce);
            assert.isTrue(spies.parseBaseParameters.calledWith(rawParameters, stepExecution));
        });

        it('should initialize the reader', function () {
            syncCategories.beforeStep(rawParameters, stepExecution);

            assert.isTrue(spies.createCategoryReader.calledOnce);
        });

        it('should create a sync agent', function () {
            syncCategories.beforeStep(rawParameters, stepExecution);

            assert.isTrue(spies.createSyncAgent.calledOnce);
        });
    });

    describe('getTotalCount', function () {
        it('should call syncAgent.getTotalCount', function () {
            syncCategories.beforeStep({}, {});
            syncCategories.getTotalCount();

            assert.isTrue(spies.syncAgent.getTotalCount.calledOnce);
        });
    });

    describe('read', function () {
        it('should call syncAgent.read', function () {
            syncCategories.beforeStep({}, {});
            syncCategories.read();

            assert.isTrue(spies.syncAgent.read.calledOnce);
        });
    });

    describe('process', function () {
        it('should call syncAgent.process with the given record', function () {
            var record = { foo: 'bar' };

            syncCategories.beforeStep({}, {});
            syncCategories.process(record);

            assert.isTrue(spies.syncAgent.process.calledOnce);
            assert.isTrue(spies.syncAgent.process.calledWith(record));
        });
    });

    describe('write', function () {
        it('should call syncAgent.write with the given buffer', function () {
            var buffer = { toArray: function () { return []; } };

            syncCategories.beforeStep({}, {});
            syncCategories.write(buffer);

            assert.isTrue(spies.syncAgent.write.calledOnce);
            assert.isTrue(spies.syncAgent.write.calledWith(buffer));
        });
    });

    describe('afterStep', function () {
        it('should call syncAgent.afterStep', function () {
            syncCategories.beforeStep({}, {});
            syncCategories.afterStep();

            assert.isTrue(spies.syncAgent.afterStep.calledOnce);
        });
    });
});
