var tedious = require('tedious');
var TYPES = tedious.TYPES;
var fs = require('fs');
var path = require('path');

var DBErrors = {
    duplicate: 2601
}

var blob = require('./blob');

var localDbConfigPath = path.join(__dirname, "sql.private.json");
var localSqlConfig = fs.existsSync(localDbConfigPath) && require(localDbConfigPath) || {};
var configSql = {
    server: localSqlConfig.server || process.env.DB_SERVER,
    userName: localSqlConfig.userName || process.env.DB_USER,
    password: localSqlConfig.password || process.env.DB_PASSWORD,
    options: {
        database: localSqlConfig.options && localSqlConfig.options.database || process.env.DB_NAME,
        "encrypt": true
    }
};

if (!configSql.server) return console.error('Sql server was not provided, please add DB_SERVER to environment variables');
if (!configSql.userName) return console.error('Sql user was not provided, please add DB_USER to environment variables');
if (!configSql.password) return console.error('password for db was not provided, please add DB_PASSWORD to environment variables');
if (!configSql.options.database) return console.error('db name was not provided, please add DB_NAME to environment variables');

function connect(cb) {
    console.log('connecting to server', configSql.server);

    var Connection = tedious.Connection;
    var connection = new Connection(configSql);

    connection.on('connect', function(err) {
        if (err) {
            console.error('error connecting to sql server', configSql.server);
            return cb(err);
        }
        console.log('connection established', !connection.closed);
        return cb(null, connection);
    });
}

function normalizeVideoRow(video) {
    if(video.VideoJson)
        video.Data = JSON.parse(video.VideoJson);
    delete video.VideoJson;
    
    video.Url = blob.getVideoUrlWithSas(video.Id);
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
        if (err) return logError(err, cb);

        var newResult = {
            job: result.job[0],
            video: result.video[0],
            user: result.user[0]
        };

        try {
            normalizeJobRow(newResult.job);
            normalizeVideoRow(newResult.video);
        }
        catch (err) {
            return logError(err, cb);
        }

        return cb(null, newResult);
    });
}


function getUsers(cb) {
    return getDataSets({
        sproc: 'GetUsers',
        sets: ['users'],
        params: []
    }, function (err, result) {
        if (err) return logError(err, cb);
        
        var newResult = {
            users: []
        };
        
        try {
            for (var i = 0; i < result.users.length; i++) {
                newResult.users.push(result.users[i]);
            }
        }
        catch (err) {
            return logError(err, cb);
        }
        
        return cb(null, newResult);
    });
}



function createOrModifyUser(req, cb) {
    connect(function (err, connection) {
        if (err) return cb(err);

        try {
            var resultUserId;

            var request = new tedious.Request('UpsertUser', function (err) {
                if (err) return logError(err, cb);
                return cb(null, { userId: resultUserId });
            });

            if (req.id)
                request.addParameter('Id', TYPES.Int, req.id);

            request.addParameter('Name', TYPES.NVarChar, req.name);
            request.addParameter('Email', TYPES.NVarChar, req.email);
            request.addParameter('RoleId', TYPES.TinyInt, req.roleId);

            request.addOutputParameter('UserId', TYPES.Int);

            request.on('returnValue', function (parameterName, value, metadata) {
                if (parameterName == 'UserId') {
                    resultUserId = value;
                }
            });

            connection.callProcedure(request);
        }
        catch (err) {
            return cb(err);
        }

    });
}


function updateJobStatus(req, cb) {
    connect(function (err, connection) {
        if (err) return cb(err);
        
        try {
            
            var request = new tedious.Request('UpdateJobStatus', function (err) {
                if (err) return logError(err, cb);
                return cb();
            });
            
            request.addParameter('Id', TYPES.Int, req.id);
            request.addParameter('UserId', TYPES.Int, req.userId);
            request.addParameter('StatusId', TYPES.TinyInt, req.statusId);
            
            connection.callProcedure(request);
        }
        catch (err) {
            return cb(err);
        }

    });
}

function getVideos(cb) {
    return getDataSets({
        sproc: 'GetVideos',
        sets: ['videos'],
        params: []
    }, function(err, result){
        if (err) return logError(err, cb);

        var newResult = {
            videos: []
        };

        try {
            for (var i=0; i<result.videos.length; i++) {
                newResult.videos.push(normalizeVideoRow(result.videos[i]));
            }
        }
        catch (err) {
            return logError(err, cb);
        }

        return cb(null, newResult);
    });
}


function getJobstatuses(cb) {
    return getDataSets({
        sproc: 'GetJobStatuses',
        sets: ['statuses'],
        params: []
    }, function (err, result) {
        if (err) return logError(err, cb);
        return cb(null, result);
    });
}

function getRoles(cb) {
    return getDataSets({
        sproc: 'GetRoles',
        sets: ['roles'],
        params: []
    }, function (err, result) {
        if (err) return logError(err, cb);
        return cb(null, result);
    });
}


function getVideo(id, cb) {
    return getDataSets({
        sproc: 'GetVideo',
        sets: ['videos'],
        params: [{ name: 'Id', type: TYPES.Int, value: id }]
    }, function (err, result) {
        if (err) return logError(err, cb);
               
        if (result.videos.length) {
            return cb(null, normalizeVideoRow(result.videos[0]));
        }
        
        return cb(null, {});
    });
}

function getUserById(id, cb) {
    return getDataSets({
        sproc: 'GetUserById',
        sets: ['users'],
        params: [{ name: 'Id', type: TYPES.Int, value: id}]
    }, function (err, result) {
        if (err) return logError(err, cb);
        
        if (result.users.length) {
            return cb(null, result.users[0]);
        }
        
        return cb(null, {});
    });
}


function getUserByEmail(email, cb) {
    return getDataSets({
        sproc: 'GetUserByEmail',
        sets: ['users'],
        params: [{ name: 'Email', type: TYPES.VarChar, value: email }]
    }, function (err, result) {
        if (err) return logError(err, cb);
        
        if (result.users && result.users.length) {
            return cb(null, result.users[0]);
        }
        
        return cb(null, {});
    });
}


function createOrModifyVideo(req, cb) {
    connect(function (err, connection) {
        if (err) return cb(err);
        
        try {
            var resultVideoId;
            
            var request = new tedious.Request('UpsertVideo', function (err) {
                if (err) return logError(err, cb);
                return cb(null, { videoId: resultVideoId });
            });
            
            if (req.id)
                request.addParameter('Id', TYPES.Int, req.id);
            
            request.addParameter('Name', TYPES.NVarChar, req.name);
            request.addParameter('Width', TYPES.Int, req.width);
            request.addParameter('Height', TYPES.Int, req.height);
            request.addParameter('DurationSeconds', TYPES.Real, req.durationSeconds);
            request.addParameter('FramesPerSecond', TYPES.Real, req.framesPerSecond);
            
            if (req.videoJson)
                request.addParameter('VideoJson', TYPES.NVarChar, JSON.stringify(req.videoJson));
            
            request.addOutputParameter('VideoId', TYPES.Int);
            
            request.on('returnValue', function (parameterName, value, metadata) {
                if (parameterName == 'VideoId') {
                    resultVideoId = value;
                }
            });
            
            connection.callProcedure(request);
        }
        catch (err) {
            return logError(err, cb);
        }

    });
}


function createOrModifyJob(req, cb) {
    connect(function(err, connection){
        if (err) return logError(err, cb);

        try
        {
            var resultJobId;

            var request = new tedious.Request('UpsertJob', function(err) {
                if (err && err.number == DBErrors.duplicate) return logError(new Error('video already assigned to user'), cb);
                if (err) return logError(err, cb);

                return cb(null, {jobId: resultJobId});
            });

            if(req.id)
                request.addParameter('Id', TYPES.Int, req.id);

            request.addParameter('VideoId', TYPES.Int, req.videoId);
            request.addParameter('UserId', TYPES.Int, req.userId);
            request.addParameter('StatusId', TYPES.TinyInt, req.statusId);
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
            return logError(err, cb);
        }

    });
}


function getDataSets(opts, cb) {
    connect(function(err, connection){
        if (err) return logError(err, cb);

        var sproc = opts.sproc,
            sets = opts.sets,
            params = opts.params,
            currSetIndex = -1;

        var result = {};

        var request = new tedious.Request(sproc, function(err, rowCount, rows) {
            if (err) return logError(err, cb);
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
                if (err) return logError(err, cb);
                return cb();
            });

            request.addParameter('JobId', TYPES.Int, req.jobId);
            request.addParameter('FrameIndex', TYPES.BigInt, req.frameIndex);
            request.addParameter('TagsJson', TYPES.NVarChar, JSON.stringify(req.tagsJson));

            connection.callProcedure(request);
        }
        catch(err) {
            return logError(err, cb);
        }

    });
}

function getUserJobs(userId, cb) {
    return getDataSets({
        sproc: 'GetUserJobs',
        sets: ['jobs'],
        params: [{name: 'UserId', type: TYPES.Int, value: userId}]
    }, function(err, result){
        if (err) return logError(err, cb);

        var newResult = {
            jobs: []
        };

        try {
            for (var i=0; i<result.jobs.length; i++) {
                newResult.jobs.push(normalizeJobRow(result.jobs[i]));
            }
        }
        catch (err) {
            return logError(err, cb);
        }
        return cb(null, newResult);
    });
}


function getAllJobs(cb) {
    return getDataSets({
        sproc: 'GetAllJobs',
        sets: ['jobs'],
        params: []
    }, function (err, result) {
        if (err) return logError(err, cb);
        
        var newResult = {
            jobs: []
        };
        
        try {
            for (var i = 0; i < result.jobs.length; i++) {
                newResult.jobs.push(normalizeJobRow(result.jobs[i]));
            }
        }
        catch (err) {
            return logError(err, cb);
        }
        return cb(null, newResult);
    });
}

function getVideoFrames(id, cb) {
    return getDataSets({
        sproc: 'GetVideoFrames',
        sets: ['frames'],
        params: [{name: 'VideoId', type: TYPES.Int, value: id}]
    }, function(err, result){
        if (err) return logError(err, cb);

        var newResult = {
            frames: []
        };

        try {
            for (var i=0; i<result.frames.length; i++) {
                var frame = normalizeFrameRow(result.frames[i]);
                newResult.frames.push({
                    frameIndex: frame.FrameIndex,
                    tags: frame.Tags
                });
            }
        }
        catch (err) {
            return logError(err, cb);
        }

        return cb(null, newResult);
    });
}


function getVideoFramesByJob(id, cb) {
    return getDataSets({
        sproc: 'GetVideoFramesByJob',
        sets: ['frames'],
        params: [{name: 'JobId', type: TYPES.Int, value: id}]
    }, function(err, result){
        if (err) return logError(err, cb);

        var newResult = {
            frames: {}
        };

        try {
            for (var i=0; i<result.frames.length; i++) {
                var frame = normalizeFrameRow(result.frames[i]);
                newResult.frames[frame.FrameIndex] = frame.Tags;
            }
        }
        catch (err) {
            return logError(err, cb);
        }

        return cb(null, newResult);
    });
}

function logError(err, cb) {
    console.error('error:', err);
    return cb(err);
}

module.exports = {
    connect: connect,
    createOrModifyJob: createOrModifyJob,
    createOrModifyVideo: createOrModifyVideo,
    getJobDetails: getJobDetails,
    getJobstatuses: getJobstatuses,
    getRoles: getRoles,
    getVideos: getVideos,
    getVideo: getVideo,
    createOrModifyFrame: createOrModifyFrame,
    getUserJobs: getUserJobs,
    getAllJobs: getAllJobs,
    getVideoFrames: getVideoFrames,
    getVideoFramesByJob: getVideoFramesByJob,
    getUsers: getUsers,
    getUserByEmail: getUserByEmail,
    getUserById: getUserById,
    createOrModifyUser: createOrModifyUser,
    updateJobStatus: updateJobStatus
}