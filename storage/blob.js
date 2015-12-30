var azure = require('azure-storage');
var config = require('./storage.private.json');

var crypto = require('crypto'),
    _ = require('underscore'),
    XDate = require('xdate'),
    url = require('url');


_.str = require('underscore.string');
_.mixin(_.str.exports());

var httpProxy = require('http-proxy');

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

function getSAS(opts) {


    var startDate = new Date();
    var expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 100);
    startDate.setMinutes(startDate.getMinutes() - 100);

    var sharedAccessPolicy = {
        AccessPolicy: {
            Permissions: azure.BlobUtilities.SharedAccessPermissions.READ,
            Start: startDate,
            Expiry: expiryDate
        }
    };

    var sasToken = blobSvc.generateSharedAccessSignature(CONTAINER_NAME, opts.name, sharedAccessPolicy);
    console.log('sasToken', sasToken);
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


var options = {};
var proxy = httpProxy.createProxyServer(options);

function _getVideoStream(opts, cb) {

    console.log('_getVideoStream');
    var url = getVideoUrl(opts.name);
    console.log('videoUrl', url);

    opts.req.url = url;
console.log('req.url', opts.req.url);

    opts.req.headers.host = 'videotagging.blob.core.windows.net';
    opts.req.headers.path = '/vidoes1/zoe.jpg';
    console.log('req.headers before', opts.req.headers);


    var additionalHeaders = sign(opts.req, config.key, stringForBlobOrQueue);
    for(var header in additionalHeaders) {
        opts.req.headers[header] = additionalHeaders[header];
    }

    console.log('req.headers after', opts.req.headers);
console.log('****************************************************');

    for(var key in opts.req.headers) {
        console.log(key + ':' + opts.req.headers[key]);
    }

    console.log('****************************************************');





    proxy.web(opts.req, opts.res, {
        forward: url,
        //target: url,
        //toProxy: url,
        ignorePath: true,
    }, function(err){
        if (err) return console.error('error', err);
    });
}


function getVideoUrl(id) {
    return URL_FORMAT + '/' + id;
}


function canonicalizedResource(parsedUrl) {
    console.log('canonicalizedResource', parsedUrl);

    return '/videotagging/vidoes1/zoe.jpg';
    //
    return '/' + parsedUrl.hostname.split('.')[0] + (parsedUrl.pathname || '/') +
        _.chain(querystring.parse(parsedUrl.query)).pairs().sortBy(function (pair) { return pair[0]; }).map(function (pair) {
            return '\n' + pair[0] + ':' + pair[1];
        }).value().join('');
}

function canonicalizedHeaders(headers) {
    console.log('canonicalizedHeaders', headers);
    return _.chain(headers).pairs().filter(function (pair) {
        return _.startsWith(pair[0], 'x-ms-');
    }).sortBy(function (pair) {
            return pair[0];
        }).map(function (pair) {
            return pair[0] + ':' + pair[1] + '\n';
        }).value().join('');
}

function getHeader(headers, name, additionalHeaders) {
    if (headers[name] !== undefined) {
        return headers[name];
    } else if (additionalHeaders && additionalHeaders[name] !== undefined) {
        return additionalHeaders[name];
    } else {
        return '';
    }
}

function stringForBlobOrQueue(req, parsedUrl, additionalHeaders) {
    return req.method + '\n' +
        getHeader(req.headers, 'content-encoding') + '\n' +
        getHeader(req.headers, 'content-language') + '\n' +
        getHeader(req.headers, 'content-length') + '\n' +
        getHeader(req.headers, 'content-md5') + '\n' +
        getHeader(req.headers, 'content-type') + '\n' +
        getHeader(req.headers, 'date') + '\n' +
        getHeader(req.headers, 'if-modified-since') + '\n' +
        getHeader(req.headers, 'if-match') + '\n' +
        getHeader(req.headers, 'if-none-match') + '\n' +
        getHeader(req.headers, 'if-unmodified-since') + '\n' +
        getHeader(req.headers, 'range') + '\n' +
        canonicalizedHeaders(_.extend(req.headers, additionalHeaders)) +
        canonicalizedResource(parsedUrl);
}

function sign(req) {

    var parsedUrl = url.parse(req.url);
    var account = config.account; //parsedUrl.hostname.split('.')[0];
    var additionalHeaders = {};
    if (!_.contains(req.headers, 'x-ms-version')) {
        additionalHeaders['x-ms-version'] = '2011-08-18';
    }
    if (!_.contains(req.headers, 'x-ms-date')) {
        additionalHeaders['x-ms-date'] = new XDate().toUTCString("ddd, dd MMM yyyy HH:mm:ss 'GMT'");
    }
    var stringToSign = stringForBlobOrQueue(req, parsedUrl, additionalHeaders);
console.log('stringToSign', stringToSign);
    var hmac = crypto.createHmac('sha256', new Buffer(config.key, 'base64').toString('binary'));
    hmac.update(stringToSign);
    additionalHeaders['Authorization'] = 'SharedKey ' + config.account + ':' + hmac.digest('base64');
    return additionalHeaders;
}







module.exports = {
    init: init,
    upload: upload,
    getVideoUrl: getVideoUrl,
    getVideoStream: getVideoStream,
    _getVideoStream: _getVideoStream,
    getSAS: getSAS
};


