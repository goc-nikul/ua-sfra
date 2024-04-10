var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var assert = chai.assert;

describe('syncCategoriesSection', function () {
    var syncCategoriesSection;
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
            buildCategorySectionApiPayload: sinon.stub().returns({}),
            transformCategorySection: sinon.stub().returns({}),
            feedTypes: sinon.stub().returns({})
        };

        spies.createSyncAgent = sinon.stub().returns(spies.syncAgent);

        syncCategoriesSection = proxyquire('../../../../../cartridges/link_constructor_connect_custom/cartridge/scripts/jobs/syncCategoriesSection', {
            '*/cartridge/scripts/jobs/sync/parseBaseParameters': spies.parseBaseParameters,
            '*/cartridge/scripts/jobs/sync/categories/buildCategorySectionApiPayload': spies.buildCategorySectionApiPayload,
            '*/cartridge/scripts/jobs/sync/categories/categoryReader': {
                create: spies.createCategoryReader
            },
            '*/cartridge/scripts/jobs/sync/syncAgent': {
                create: spies.createSyncAgent
            },
            '*/cartridge/scripts/helpers/categories/transformCategorySection': spies.transformCategorySection,
            '*/cartridge/scripts/constants/feedTypes': spies.feedTypes
        });
    });

    describe('beforeStep', function () {
        var rawParameters = {};
        var stepExecution = {};

        it('should parse the job parameters', function () {
            syncCategoriesSection.beforeStep(rawParameters, stepExecution);

            assert.isTrue(spies.parseBaseParameters.calledOnce);
            assert.isTrue(spies.parseBaseParameters.calledWith(rawParameters, stepExecution));
        });

        it('should initialize the reader', function () {
            syncCategoriesSection.beforeStep(rawParameters, stepExecution);

            assert.isTrue(spies.createCategoryReader.calledOnce);
        });

        it('should create a sync agent', function () {
            syncCategoriesSection.beforeStep(rawParameters, stepExecution);

            assert.isTrue(spies.createSyncAgent.calledOnce);
        });
    });

    describe('getTotalCount', function () {
        it('should call syncAgent.getTotalCount', function () {
            syncCategoriesSection.beforeStep({}, {});
            syncCategoriesSection.getTotalCount();

            assert.isTrue(spies.syncAgent.getTotalCount.calledOnce);
        });
    });

    describe('read', function () {
        it('should call syncAgent.read', function () {
            syncCategoriesSection.beforeStep({}, {});
            syncCategoriesSection.read();

            assert.isTrue(spies.syncAgent.read.calledOnce);
        });
    });

    describe('process', function () {
        it('should call syncAgent.process with the given record', function () {
            var record = { foo: 'bar' };

            syncCategoriesSection.beforeStep({}, {});
            syncCategoriesSection.process(record);

            assert.isTrue(spies.syncAgent.process.calledOnce);
            assert.isTrue(spies.syncAgent.process.calledWith(record));
        });
    });

    describe('write', function () {
        it('should call syncAgent.write with the given buffer', function () {
            var buffer = { toArray: function () { return []; } };

            syncCategoriesSection.beforeStep({}, {});
            syncCategoriesSection.write(buffer);

            assert.isTrue(spies.syncAgent.write.calledOnce);
            assert.isTrue(spies.syncAgent.write.calledWith(buffer));
        });
    });

    describe('afterStep', function () {
        it('should call syncAgent.afterStep', function () {
            syncCategoriesSection.beforeStep({}, {});
            syncCategoriesSection.afterStep();

            assert.isTrue(spies.syncAgent.afterStep.calledOnce);
        });
    });
});
