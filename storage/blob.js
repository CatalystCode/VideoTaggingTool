var azure = require('azure-storage');
var config = require('../config');
var url = require('url');

var CONTAINER_NAME = 'vidoes';
var URL_FORMAT = 'https://<storage-account-name>.blob.core.windows.net/<container-name>'
    .replace('<storage-account-name>', config.storage.account)
    .replace('<container-name>', CONTAINER_NAME);

var blobSvc = azure.createBlobService(config.storage.account, config.storage.key);

var cbUrl = config.auth.google.callbackURL,
  cbUrlElements = url.parse(cbUrl),
  host = cbUrlElements.protocol + '//' + cbUrlElements.host;
    
console.log('enabling blob CORS for host', host);
var serviceProperties = {
  Cors: {
    CorsRule: [{
      AllowedOrigins: [host],
      AllowedMethods: ['GET', 'PUT'],
      AllowedHeaders: ['*'],
      ExposedHeaders: ['*'],
      MaxAgeInSeconds: 30 * 60
    }]
  }
};
  
blobSvc.setServiceProperties(serviceProperties, function (err, result) { 
  if (err) return console.error('error setting service properties', err);
  console.log('result:', result);

  blobSvc.createContainerIfNotExists(CONTAINER_NAME, { publicAccessLevel : 'blob' }, 
    function (err, result, response) {
      if (err) return console.error('error creating container', CONTAINER_NAME, err);
    });
});

function upload(opts, cb) {
  return blobSvc.createBlockBlobFromStream(CONTAINER_NAME, opts.name, opts.stream, opts.size, 
    { contentType: opts.contentType },
    function (err, file, result) {
    if (err) {
      console.error('error saving blob', opts, err);
      return cb(err);
    }
    return cb(null, { url: URL_FORMAT + '/' + opts.name });
  });
}

function getSAS(opts) {

  var permissions = opts.permissions || azure.BlobUtilities.SharedAccessPermissions.READ;
  var startDate = new Date();
  var expiryDate = new Date(startDate);
  expiryDate.setMinutes(startDate.getMinutes() + 30);
  startDate.setMinutes(startDate.getMinutes() - 10);

  var sharedAccessPolicy = {
      AccessPolicy: {
          Permissions: permissions,
          Start: startDate,
          Expiry: expiryDate
      }
  };
  var sasToken = blobSvc.generateSharedAccessSignature(CONTAINER_NAME, opts.name + '', sharedAccessPolicy);
  console.log('sasToken', sasToken);
  return sasToken;
}

function getVideoStream(opts, cb) {
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
}

function getVideoUrl(id) {
    return URL_FORMAT + '/' + id;
}

function getVideoUrlWithSas(id) {
  return getVideoUrl(id) + '?' + getSAS({ name: id });
}

function getVideoUrlWithSasWrite(id) {
  return getVideoUrl(id) + '?' + getSAS({ name: id,
    permissions: azure.BlobUtilities.SharedAccessPermissions.WRITE});
}

module.exports = {
    upload: upload,
    getVideoStream: getVideoStream,
    getVideoUrlWithSas: getVideoUrlWithSas,
    getVideoUrlWithSasWrite: getVideoUrlWithSasWrite
};


