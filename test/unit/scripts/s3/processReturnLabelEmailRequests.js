'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class File {
    constructor(filePath) {
        this.filePath = filePath;
    }

    createNewFile() {
        return 'New File';
    }

    exists() {
        return false;
    }

    mkdir() {
        return 'New File';
    }

    remove() {
        return 'New File';
    }
}

class FileWriter {
    constructor(filePath) {
        this.filePath = filePath;
    }

    write() {
        return 'New File';
    }

    close() {
        return 'New File';
    }
}

class S3TransferClient {
    constructor(data) {
        this.data = data;
    }

    putBinary() {
        return 'New File';
    }

    getPreSignedUrl() {
        return 'New File';
    }
}

describe('int_s3/cartridge/scripts/processReturnLabelEmailRequests.js', () => {
    it('Testing S3: processReturnLabelEmailRequests returnLabelUrl is not present', () => {
        var processReturnLabelEmailRequests = proxyquire('../../../../cartridges/int_s3/cartridge/scripts/processReturnLabelEmailRequests.js', {
            'int_OIS/cartridge/scripts/order/returnHelpers': {
                sendReturnLabel: () => {}
            },
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': {
                abs: () => ''
            },
            'dw/system/System': require('../../../mocks/dw/dw_system_System'),
            'dw/object/CustomObjectMgr': {
                getAllCustomObjects: () => {
                    var cnt = 0;
                    return {
                        getCount: () => 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => {
                            return {
                                getCustom: () => {
                                    return {
                                        returnLabelUrl: '',
                                        rmaId: 'aaaa',
                                        sfmcData: "{\"CustomerEmail\":\"aaaa\",\"CustomerFirstName\":\"aaaa\"}",
                                        base64encodedFileData: 'pdf',
                                        fileType: 'pdf',
                                        customerNo: '123456'
                                    };
                                }
                            };
                        }
                    };
                }
            },
            'int_s3/cartridge/scripts/lib/S3TransferClient.js': S3TransferClient,
            'dw/util/StringUtils': {
                decodeBase64: () => ''
            },
            'dw/io/File': File,
            'dw/io/FileWriter': FileWriter,
            './lib/logger': {
                getLogger: () => {
                    return { error: () => '', debug: () => '', warn: () => '' };
                }
            }
        });

        var jobParameters = {
            returnLabelDir: 'returnLabelDir',
            awstimeoutinms: '2500'
        };
        var result = processReturnLabelEmailRequests.process(jobParameters);
        assert.isDefined(result, 'result not defined');
    });

    it('Testing S3: processReturnLabelEmailRequests returnLabelUrl is present', () => {
        var processReturnLabelEmailRequests = proxyquire('../../../../cartridges/int_s3/cartridge/scripts/processReturnLabelEmailRequests.js', {
            'int_OIS/cartridge/scripts/order/returnHelpers': {
                sendReturnLabel: () => {}
            },
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': {
                abs: () => ''
            },
            'dw/system/System': require('../../../mocks/dw/dw_system_System'),
            'dw/object/CustomObjectMgr': {
                getAllCustomObjects: () => {
                    var cnt = 0;
                    return {
                        getCount: () => 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => {
                            return {
                                getCustom: () => {
                                    return {
                                        returnLabelUrl: 'aaaa',
                                        rmaId: 'aaaa',
                                        sfmcData: "{\"CustomerEmail\":\"aaaa\",\"CustomerFirstName\":\"aaaa\"}",
                                        base64encodedFileData: 'pdf',
                                        fileType: 'pdf',
                                        customerNo: '123456'
                                    };
                                }
                            };
                        }
                    };
                },
                remove: () => ''
            },
            'int_s3/cartridge/scripts/lib/S3TransferClient.js': S3TransferClient,
            'dw/util/StringUtils': {
                decodeBase64: () => ''
            },
            'dw/io/File': File,
            'dw/io/FileWriter': FileWriter,
            './lib/logger': {
                getLogger: () => {
                    return { error: () => '', debug: () => '', warn: () => '' };
                }
            }
        });

        var jobParameters = {
            returnLabelDir: 'returnLabelDir',
            awstimeoutinms: '2500'
        };
        var result = processReturnLabelEmailRequests.process(jobParameters);
        assert.isDefined(result, 'result not defined');
    });
    
    it('Testing S3: processReturnLabelEmailRequests throws erroe', () => {
        var processReturnLabelEmailRequests = proxyquire('../../../../cartridges/int_s3/cartridge/scripts/processReturnLabelEmailRequests.js', {
            'int_OIS/cartridge/scripts/order/returnHelpers': {
                sendReturnLabel: () => {}
            },
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': {
                abs: () => ''
            },
            'dw/system/System': require('../../../mocks/dw/dw_system_System'),
            'dw/object/CustomObjectMgr': {
                getAllCustomObjects: () => {
                    var cnt = 0;
                    return {
                        getCount: () => 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        }
                    };
                },
                remove: () => ''
            },
            'int_s3/cartridge/scripts/lib/S3TransferClient.js': S3TransferClient,
            'dw/util/StringUtils': {
                decodeBase64: () => ''
            },
            'dw/io/File': File,
            'dw/io/FileWriter': FileWriter,
            './lib/logger': {
                getLogger: () => {
                    return { error: () => '', debug: () => '', warn: () => '' };
                }
            }
        });

        var jobParameters = {
			returnLabelDir: 'returnLabelDir',
            awstimeoutinms: '2500'
        };
        var result = processReturnLabelEmailRequests.process(jobParameters);
        assert.isDefined(result, 'result not defined');
    });
});
