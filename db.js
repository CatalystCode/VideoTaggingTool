var tedious = require('tedious');
var TYPES = tedious.TYPES;

var _sqlConnection;

function connect(cb) {

    if(_sqlConnection && !_sqlConnection.closed) {
        return cb(null, _sqlConnection);
    }

    var configSql = require("./sql.azure.private.json");
    console.log('connecting to server', configSql.server);

    var Connection = tedious.Connection;
    var connection = new Connection(configSql);

    connection.on('connect', function(err) {
        if (err) {
            console.error('error connecting to sql server', configSql.server);
            return cb(err);
        }
        _sqlConnection = connection;
        console.log('connection established', !connection.closed);
        return cb(null, connection);
    });
}

function normalizeVideoRow(video) {
    if(video.VideoJson)
        video.Data = JSON.parse(video.VideoJson);
    delete video.VideoJson;
    return video;
}
function normalizeFrameRow(frame) {
    if(frame.TagsJson)
        frame.Tags = JSON.parse(frame.TagsJson);
    delete frame.TagsJson;
    return frame;
}
function normalizeJobRow(job) {
    if(job.ConfigJson)
        job.Config = JSON.parse(job.ConfigJson);
    delete job.ConfigJson;
    return job;
}

function getJobDetails(id, cb) {
    return getDataSets({
        sproc: 'GetJob',
        sets: ['job', 'video', 'user', 'frames'],
        params: [{name: 'Id', type: TYPES.Int, value: id}]
    }, function(err, result){
        if (err) return cb(err);
        var newResult = {
            job: result.job[0],
            video: result.video[0],
            user: result.user[0],
            frames: []
        };

        try {
            normalizeJobRow(newResult.job);
            normalizeVideoRow(newResult.video);
            for (var i=0; i<result.frames.length; i++) {
                newResult.frames.push(normalizeFrameRow(result.frames[i]));
            }
        }
        catch (err) {
            console.error('error:', err);
            return cb(err);
        }

        return cb(null, newResult);
    });
}


function getVideos(cb) {
    return getDataSets({
        sproc: 'GetVideos',
        sets: ['videos'],
        params: []
    }, function(err, result){
        if (err) return cb(err);

        var newResult = {
            videos: []
        };

        try {
            for (var i=0; i<result.videos.length; i++) {
                newResult.videos.push(normalizeVideoRow(result.videos[i]));
            }
        }
        catch (err) {
            console.error('error:', err);
            return cb(err);
        }

        return cb(null, newResult);
    });
}

function createOrModifyJob(req, cb) {
    connect(function(err, connection){
        if (err) return cb(err);

        try
        {
            var resultJobId;

            var request = new tedious.Request('UpsertJob', function(err) {
                if (err) {
                    console.error('error calling Upsert stored procedure', err);
                    return cb(err);
                }

                return cb(null, {jobId: resultJobId});
            });

            if(req.id)
                request.addParameter('Id', TYPES.Int, req.id);

            request.addParameter('VideoId', TYPES.Int, req.videoId);
            request.addParameter('UserId', TYPES.Int, req.userId);
            request.addParameter('Description', TYPES.VarChar, req.description);
            request.addParameter('CreatedById', TYPES.Int, req.createdById);

            if(req.configJson)
                request.addParameter('ConfigJson', TYPES.NVarChar, JSON.stringify(req.configJson));

            request.addOutputParameter('JobId', TYPES.Int);

            request.on('returnValue', function(parameterName, value, metadata) {
                if (parameterName == 'JobId') {
                    resultJobId = value;
                }
            });

            connection.callProcedure(request);
        }
        catch(err) {
            return cb(err);
        }

    });
}


function getDataSets(opts, cb) {
    connect(function(err, connection){
        if (err) return cb(err);

        var sproc = opts.sproc,
            sets = opts.sets,
            params = opts.params,
            currSetIndex = -1;

        var result = {};

        var request = new tedious.Request(sproc, function(err, rowCount, rows) {
            if (err) {
                console.error('error calling', sproc, 'stored procedure', err);
                return cb(err);
            }
        });

        for (var i=0; i<params.length; i++) {
            var param = params[i];
            request.addParameter(param.name, param.type, param.value);
        }

        request.on('columnMetadata', function (columns) {
            currSetIndex++;
            result[sets[currSetIndex]] = [];
        });

        request.on('row', function (columns) {
            var rowObj = {};
            for(var i=0; i<columns.length; i++) {
                rowObj[columns[i].metadata.colName] = columns[i].value;
            }
            result[sets[currSetIndex]].push(rowObj);
        });

        request.on('doneProc', function (rowCount, more, returnStatus, rows) {
            console.log('doneProc', rowCount, more, returnStatus, rows);

            cb(null, result);
        });

        connection.callProcedure(request);

    });
}

function createOrModifyFrame(req, cb) {
    connect(function(err, connection){
        if (err) return cb(err);

        try
        {
            var request = new tedious.Request('UpsertFrame', function(err) {
                if (err) {
                    console.error('error calling UpsertFrame stored procedure', err);
                    return cb(err);
                }

                return cb();
            });

            request.addParameter('JobId', TYPES.Int, req.jobId);
            request.addParameter('FrameIndex', TYPES.BigInt, req.frameIndex);
            request.addParameter('TagsJson', TYPES.NVarChar, JSON.stringify(req.tagsJson));

            connection.callProcedure(request);
        }
        catch(err) {
            return cb(err);
        }

    });
}

function getUserJobs(userId, cb) {
    return getDataSets({
        sproc: 'GetUserJobs',
        sets: ['jobs'],
        params: [{name: 'UserId', type: TYPES.Int, value: userId}]
    }, function(err, result){
        if (err) return cb(err);

        var newResult = {
            jobs: []
        };

        try {
            for (var i=0; i<result.jobs.length; i++) {
                newResult.jobs.push(normalizeJobRow(result.jobs[i]));
            }
        }
        catch (err) {
            console.error('error:', err);
            return cb(err);
        }
        return cb(null, newResult);
    });
}


module.exports = {
    connect: connect,
    createOrModifyJob: createOrModifyJob,
    getJobDetails: getJobDetails,
    getVideos: getVideos,
    createOrModifyFrame: createOrModifyFrame,
    getUserJobs: getUserJobs
}