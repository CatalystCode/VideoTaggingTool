var azure = require('azure-storage');
var config = require('../config').storage;

var CONTAINER_NAME = 'vidoes1';
var URL_FORMAT = 'http://<storage-account-name>.blob.core.windows.net/<container-name>'
    .replace('<storage-account-name>', config.account)
    .replace('<container-name>', CONTAINER_NAME);

var blobSvc = azure.createBlobService(config.account, config.key);

function init(cb) {
    blobSvc.createContainerIfNotExists(CONTAINER_NAME, { publicAccessLevel : 'blob' }, 
        function (err, result, response) {
            if (err) {
                console.error('error creating container', CONTAINER_NAME, err);
                return cb(err);
            }

            return cb();
        }
    );
}

function upload(opts, cb) {
    init(function (err) {
        if (err) return cb(err);

        return blobSvc.createBlockBlobFromStream(CONTAINER_NAME, opts.name, opts.stream, opts.size, 
            { contentType: opts.contentType },
            function (err, file, result) {
            if (err) {
                console.error('error saving blob', opts, err);
                return cb(err);
            }
            return cb(null, { url: URL_FORMAT + '/' + opts.name });
        });
    });
}

function getSAS(opts) {

    var startDate = new Date();
    var expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 10);
    startDate.setMinutes(startDate.getMinutes() - 10);

    var sharedAccessPolicy = {
        AccessPolicy: {
            Permissions: azure.BlobUtilities.SharedAccessPermissions.READ,
            Start: startDate,
            Expiry: expiryDate
        }
    };
    var sasToken = blobSvc.generateSharedAccessSignature(CONTAINER_NAME, opts.name + '', sharedAccessPolicy);
    return sasToken;
}

function getVideoStream(opts, cb) {
    init(function (err) {
        return blobSvc.getBlobProperties(CONTAINER_NAME, opts.name, function(err, props){
            if (err) return cb(err);
            var stream = blobSvc.createReadStream(CONTAINER_NAME, opts.name);
            return cb(null, {
                stream: stream,
                contentType: props.contentType,
                contentLength: props.contentLength,
                etag: props.etag
            });

        });
    });
}

function getVideoUrl(id) {
    return URL_FORMAT + '/' + id;
}

function getVideoUrlWithSas(id) {
    return getVideoUrl(id) + '?' + getSAS({name: id});
}

module.exports = {
    init: init,
    upload: upload,
    getVideoStream: getVideoStream,
    getVideoUrlWithSas: getVideoUrlWithSas
};


