'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');
const putBinaryStub = sinon.stub();


const noExistingFile = '1234.zip';
const existingFile = '1.zip';

const mockFile = class File {
    constructor(fileName) {
        this._fileName = fileName;
        this.name = fileName;
    }
    exists() {
        return this._fileName === (File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + existingFile);
    }
};
mockFile.SEPARATOR = '/';
mockFile.IMPEX = 'impex';

const mockStatus = class Status {
    constructor(status, code, message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
};
mockStatus.ERROR = 1;
mockStatus.OK = 2;

const mockS3TransferClient = function () {
    this.putBinary = putBinaryStub;
}

describe('bc_jobs/cartridge/scripts/export/copyToS3.js test', () => {
    var copyToS3 = proxyquire('../../../../cartridges/bc_jobs/cartridge/scripts/export/copyToS3.js', {
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Status': mockStatus,
        'dw/io/File': mockFile,
        'bc_jobs/cartridge/scripts/utils/S3TransferClient.js': mockS3TransferClient
    });

    it('should fails when local file doesn\'t exists', () => {
        const parameters = {
            bucketName: '',
            AWSAccessKeyID: '',
            AWSAccessKeySecret: '',
            AWSRegion: '',
            remoteFolder: '',
            fileNamePattern: noExistingFile
        }

        const result = copyToS3.copy(parameters);
        assert.isNotNull(result, 'status is null');
        assert.isDefined(result, 'status is undefined');
        assert.equal(result.status, mockStatus.ERROR, 'Result status is not ERROR.');
    });

    it('should fails when file couldn\'t upload to S3 bucket', () => {
        const parameters = {
            bucketName: '',
            AWSAccessKeyID: '',
            AWSAccessKeySecret: '',
            AWSRegion: '',
            remoteFolder: '',
            fileNamePattern: existingFile
        }

        const result = copyToS3.copy(parameters);
        assert.isNotNull(result, 'status is null');
        assert.isDefined(result, 'status is undefined');
        assert.equal(result.status, mockStatus.ERROR, 'Job result should be ERROR.');
    });

    it('should success when file could upload to S3 bucket', () => {
        const parameters = {
            bucketName: '',
            AWSAccessKeyID: '',
            AWSAccessKeySecret: '',
            AWSRegion: '',
            remoteFolder: '',
            fileNamePattern: existingFile
        }
        putBinaryStub.returns(true);

        const result = copyToS3.copy(parameters);

        assert.isNotNull(result, 'status is null');
        assert.isDefined(result, 'status is undefined');
        assert.equal(result.status, mockStatus.OK, 'Job should end successfully.');

        putBinaryStub.reset();
    })
});
