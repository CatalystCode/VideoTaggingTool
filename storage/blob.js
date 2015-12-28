var azure = require('azure-storage');
var config = require('./storage.private.json');

var CONTAINER_NAME = 'vidoes1';
var URL_FORMAT = 'http://<storage-account-name>.blob.core.windows.net/<container-name>'
    .replace('<storage-account-name>', config.account)
    .replace('<container-name>', CONTAINER_NAME);


var blobSvc = azure.createBlobService(config.account, config.key);

function init(cb) {
    blobSvc.createContainerIfNotExists(CONTAINER_NAME, { publicAccessLevel : 'blob' }, function (err, result, response) {
        if (err) {
            console.error('error creating container', CONTAINER_NAME, err);
            return cb(err);
        }

        return cb();
    });
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

function getVideoUrl(id) {
    return URL_FORMAT + '/' + id;
}

module.exports = {
    init: init,
    upload: upload,
    getVideoUrl: getVideoUrl
};

