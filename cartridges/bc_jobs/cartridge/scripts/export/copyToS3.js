'use strict';

const Status = require('dw/system/Status');
const Logger = require('dw/system/Logger');
const File = require('dw/io/File');

exports.copy = function (parameters) {
    const S3TransferClient = require('bc_jobs/cartridge/scripts/utils/S3TransferClient.js');

    const bucketName = parameters.bucketName;
    const AWSAccessKeyID = parameters.AWSAccessKeyID;
    const AWSAccessKeySecret = parameters.AWSAccessKeySecret;
    const AWSRegion = parameters.AWSRegion;
    let S3Folder = parameters.remoteFolder || '';

    if (S3Folder && !S3Folder.endsWith(File.SEPARATOR)) {
        S3Folder += File.SEPARATOR;
    }

    var myS3Client = new S3TransferClient(
        bucketName, /* S3 bucket ID */
        AWSAccessKeyID, /* AWS Access Key ID */
        AWSAccessKeySecret, /* AWS Secret Access Key */
        AWSRegion, /* AWS Zone ID */
        'image/png', /* standard MIME types */
        1000, /* Timeout in milliseconds */
        S3Folder /* Folder within bucket */
    );

    /*
     * Initialize a File class instance referring to a local file (may or may not already exist)
     */
    const sourcePath = File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + parameters.fileNamePattern;
    const localFile = new File(sourcePath);

    if (!localFile.exists()) {
        return new Status(Status.ERROR, 'ERROR', 'File ' + sourcePath + ' doesn\'t exists.');
    }

    var uploadSuccess = myS3Client.putBinary(S3Folder + localFile.name, localFile);
    if (uploadSuccess) {
        // your file uploaded and is now available on your S3 bucket as 'MokuLogo.png'
        return new Status(Status.OK, 'OK', 'File ' + localFile.name + ' uploaded Successfully to S3 Bucket.');
    } else {
        // there was an error and your file was not uploaded, check error logs.
        return new Status(Status.ERROR, 'ERROR', "An error occurred.");
    }
}
