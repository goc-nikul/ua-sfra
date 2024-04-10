var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var assert = chai.assert;

describe('SyncAgent', function () {
    var SyncAgent;
    var spies;
    var args;

    beforeEach(function () {
        spies = {
            sendDeltaV2: sinon.stub().returns(Promise.resolve({
                statusCode: 200,
                response: JSON.stringify({ id: 'salesforceFeedId' })
            })),
            completeFeed: sinon.stub(),
            updateLastSyncDate: sinon.stub(),
            getSalesforceFeedId: sinon.stub()
        };

        SyncAgent = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/jobs/sync/syncAgent', {
            '*/cartridge/scripts/helpers/config/lastSyncDate/updateLastSyncDate': spies.updateLastSyncDate,
            '*/cartridge/scripts/helpers/api/getSalesforceFeedId': spies.getSalesforceFeedId,
            '*/cartridge/scripts/helpers/api/completeFeed': spies.completeFeed,
            '*/cartridge/scripts/helpers/api/sendDeltaV2': spies.sendDeltaV2,
            '*/cartridge/scripts/constants/feedTypes': require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/constants/feedTypes'),
            '*/cartridge/scripts/helpers/logger': require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/logger')
        });

        args = {
            type: 'product',
            parameters: {
                hasFilters: false,
                startedAt: new Date('1970-01-01T00:00:00.000Z'),
                locale: 'en_US',
                jobID: 'jobID',
                credentials: {
                    apiToken: 'api-token',
                    apiKey: 'api-key'
                }
            },
            transformer: function () {
                return { transformed: true };
            },
            buildCustomApiPayload: function () {
                return { api: 'payload' };
            },
            reader: {
                getTotalCount: function () { return 1; },
                readNextCountLine: function () {
                    return {
                        data: {},
                        valid: true,
                        record: { foo: 'bar' }
                    };
                },
                readNextRecordLine: function () {
                    return {
                        data: {},
                        valid: true,
                        record: { foo: 'bar' }
                    };
                },
                reset: function () {}
            }
        };
    });

    describe('create', function () {
        it('should create a new SyncAgent instance', function () {
            var syncAgent = SyncAgent.create(args);
            assert.ok(syncAgent instanceof SyncAgent);
        });

        it('should initialize the instance with correct arguments', function () {
            var syncAgent = SyncAgent.create(args);
            assert.equal(syncAgent.buildCustomApiPayload, args.buildCustomApiPayload);
            assert.equal(syncAgent.transformer, args.transformer);
            assert.equal(syncAgent.parameters, args.parameters);
            assert.equal(syncAgent.reader, args.reader);
            assert.equal(syncAgent.type, args.type);
        });
    });

    describe('getTotalCount', function () {
        it('should return the result of the `getTotalCount` method', function () {
            args.reader.getTotalCount = sinon.stub().returns(1);
            var syncAgent = SyncAgent.create(args);
            var totalCount = syncAgent.getTotalCount();
            sinon.assert.calledOnce(args.reader.getTotalCount);
            assert.equal(totalCount, 1);
        });

        it('should paginate the count with the `readNextCountLine` method', function () {
            args.reader = {
                timesRead: 0,
                getTotalCount: undefined,
                readNextCountLine: function () {
                    switch (this.timesRead++) {
                        case 0:
                            return { record: { foo: 'bar' }, valid: true };
                        case 1:
                            return { record: { foo: 'bar' }, valid: false };
                        default:
                            return null;
                    }
                }
            };
            var syncAgent = SyncAgent.create(args);
            var totalCount = syncAgent.getTotalCount();
            assert.equal(totalCount, 1);
        });

        it('should call the `reset` method after reading', function () {
            args.reader.reset = sinon.stub();
            var syncAgent = SyncAgent.create(args);
            syncAgent.getTotalCount();
            sinon.assert.calledOnce(args.reader.reset);
        });
    });

    describe('SyncAgent creation with missing parameters', function () {
        const baseArgs = {
            transformer: function () { return { transformed: true }; },
            parameters: {
                hasFilters: false,
                startedAt: new Date('1970-01-01T00:00:00.000Z'),
                locale: 'en_US',
                jobID: 'jobID',
                credentials: {
                    apiToken: 'api-token',
                    apiKey: 'api-key'
                }
            },
            reader: {
                getTotalCount: function () { return 1; },
                readNextCountLine: function () {
                    return {
                        data: {},
                        valid: true,
                        record: { foo: 'bar' }
                    };
                },
                readNextRecordLine: function () {
                    return {
                        data: {},
                        valid: true,
                        record: { foo: 'bar' }
                    };
                },
                reset: function () {}
            },
            type: 'product'
        };
    
        const requiredParameters = ['transformer', 'parameters', 'reader', 'type'];
    
        requiredParameters.forEach(parameter => {
            it(`should throw an error if '${parameter}' is missing`, function () {
                let args = { ...baseArgs };
                delete args[parameter];
    
                assert.throws(() => {
                    SyncAgent.create(args);
                }, Error, `SyncAgent: Missing required parameter "${parameter}"`);
            });
        });
    });

    describe('read', function () {
        it('should return the next valid record', function () {
            var syncAgent = SyncAgent.create(args);
            var result = syncAgent.read();
            assert.deepEqual(result.record, { foo: 'bar' });
            assert.deepEqual(result.valid, true);
            assert.deepEqual(result.data, {});
        });

        it('should return null after reading all records', function () {
            args.reader = {
                timesRead: 0,
                readNextRecordLine: function () {
                    switch (this.timesRead) {
                        case 0:
                            this.timesRead += 1;
                            return {
                                record: { foo: 'bar' },
                                valid: true,
                                data: {}
                            };
                        case 1:
                            this.timesRead += 1;
                            return {
                                record: { foo: 'bar' },
                                valid: false,
                                data: {}
                            };
                        default:
                            return null;
                    }
                }
            };
            var syncAgent = SyncAgent.create(args);
            var result1 = syncAgent.read();
            assert.deepEqual(result1.record, { foo: 'bar' });
            assert.deepEqual(result1.valid, true);
            assert.deepEqual(result1.data, {});
            var result2 = syncAgent.read();
            assert.equal(result2, null);
        });
    });

    describe('process', function () {
        it('should transform the record with the `transformer` function', function (done) {
            args.transformer = sinon.stub().returns({ transformed: true });
            var syncAgent = SyncAgent.create(args);
            var record = { record: { foo: 'bar' }, valid: true, data: {} };
            var transformedRecord = syncAgent.process(record);
            try {
                sinon.assert.calledOnce(args.transformer);
                assert.deepEqual(transformedRecord, { transformed: true });
                done();
            } catch (error) {
                done(error);
            }
        });
    });

    describe('write', function () {
        var buffer;

        beforeEach(function () {
            buffer = {
                toArray: function () {
                    return [{ foo: 'bar' }];
                }
            };

            spies.sendDeltaV2.returns({
                statusCode: 200,
                response: JSON.stringify({ id: 'expectedSalesforceFeedId' })
            });
            spies.getSalesforceFeedId.returns('expectedSalesforceFeedId');
        });

        it('should call `sendDeltaV2` with the base arguments when `buildCustomApiPayload` function is not present', function () {
            args.buildCustomApiPayload = undefined;
            var syncAgent = SyncAgent.create(args);
            syncAgent.write(buffer);
            assert.isTrue(spies.sendDeltaV2.calledOnce);
            var callArgs = spies.sendDeltaV2.firstCall.args[0];
            assert.isNull(callArgs.salesforceFeedId);
            assert.deepEqual(callArgs.records, buffer.toArray());
        });

        it('should call `sendDeltaV2` with the base arguments and the custom payload when `buildCustomApiPayload` function is present', function () {
            var customPayload = { customApi: 'payload' };
            args.buildCustomApiPayload = sinon.stub().returns(customPayload);
            var syncAgent = SyncAgent.create(args);

            syncAgent.write(buffer);

            assert.isTrue(spies.sendDeltaV2.calledOnce, 'sendDeltaV2 should have been called once');
            var callArgs = spies.sendDeltaV2.firstCall.args[0];
            assert.include(callArgs, customPayload, 'Payload should include custom API payload');
        });

        it('should send salesforceFeedId as null when sending the first request', function () {
            var syncAgent = SyncAgent.create(args);

            syncAgent.write(buffer);

            var callArgs = spies.sendDeltaV2.firstCall.args[0];
            assert.isNull(callArgs.salesforceFeedId, 'salesforceFeedId should be null on first request');
        });

        it('should initialize the salesforceFeedId after sending the first request', function () {
            var syncAgent = SyncAgent.create(args);

            syncAgent.write(buffer);

            assert.equal(syncAgent.salesforceFeedId, 'expectedSalesforceFeedId', 'salesforceFeedId should be initialized after first write');
        });

        it('should send the salesforceFeedId when sending the second and further requests', function () {
            var syncAgent = SyncAgent.create(args);

            // First request to initialize salesforceFeedId
            syncAgent.write(buffer);
            // Second request
            syncAgent.write(buffer);

            var secondCallArgs = spies.sendDeltaV2.secondCall.args[0];
            assert.equal(secondCallArgs.salesforceFeedId, 'expectedSalesforceFeedId', 'salesforceFeedId should be sent on subsequent requests');
        });

        it('should increment the sentChunksCount', function () {
            var syncAgent = SyncAgent.create(args);

            syncAgent.write(buffer);

            assert.equal(syncAgent.sentChunksCount, 1, 'sentChunksCount should be incremented after write');
        });
    });

    describe('write operation without a valid Salesforce feed ID', function () {
        beforeEach(function () {
            spies.sendDeltaV2.returns({
                statusCode: 200,
                response: JSON.stringify({})
            });
        });
    
        it('should throw an error if unable to obtain a Salesforce feed ID', function () {
            var syncAgent = SyncAgent.create(args);
    
            try {
                syncAgent.write({ toArray: () => [{ foo: 'bar' }] });
                assert.fail('Expected an error to be thrown due to missing Salesforce feed ID.');
            } catch (error) {
                assert.include(error.message, 'Error while obtaining Salesforce feed ID');
            }
        });
    });

    describe('afterStep', function () {
        it('should not update the last sync date if the salesforceFeedId is not initialized', function () {
            var syncAgent = SyncAgent.create(args);
            syncAgent.afterStep();
            assert.isFalse(spies.updateLastSyncDate.called);
        });

        it('should not update the last sync date when there are filters', function () {
            args.parameters.hasFilters = true;
            var syncAgent = SyncAgent.create(args);
            syncAgent.afterStep();
            assert.isFalse(spies.updateLastSyncDate.called);
        });

        it('should not update the last sync date when the feed type is `category`', function () {
            args.type = 'category';
            var syncAgent = SyncAgent.create(args);
            syncAgent.afterStep();
            assert.isFalse(spies.updateLastSyncDate.called);
        });

        it('should not complete the feed if salesforceFeedId is not initialized', function () {
            var syncAgent = SyncAgent.create(args);
            syncAgent.salesforceFeedId = null;
            syncAgent.afterStep();
            assert.isFalse(spies.completeFeed.called, 'completeFeed should not have been called');
        });

        it('should complete the feed when the salesforceFeedId is initialized', function () {
            var syncAgent = SyncAgent.create(args);
            syncAgent.salesforceFeedId = 'someSalesforceFeedId';

            syncAgent.afterStep();

            assert.isTrue(spies.completeFeed.calledOnce, 'completeFeed should have been called once');
        });

        it('should update the last sync date with a valid salesforce feed, no filters, and a `product` feed', function () {
            var syncAgent = SyncAgent.create(args);
            syncAgent.salesforceFeedId = 'someSalesforceFeedId';
            syncAgent.type = 'product';
            syncAgent.parameters.hasFilters = false;

            syncAgent.afterStep();

            assert.isTrue(spies.updateLastSyncDate.calledOnce, 'updateLastSyncDate should have been called once');
        });
    });
});
