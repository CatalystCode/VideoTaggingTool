var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var path = require('path');
var db = require('../storage/db');
var blob = require('../storage/blob');



router.post('/jobs', function (req, res) {
    db.createOrModifyJob(req.body, function (err, result) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});

router.post('/users', function (req, res) {
    db.createOrModifyUser(req.body, function (err, result) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});

router.post('/videos', function (req, res) {
    db.createOrModifyVideo(req.body, function (err, result) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});


router.post('/videos/:id', function (req, res) {
    var id = req.params.id;
    console.log('uploading video', id);
    
    var file;

    var form = new multiparty.Form({
        maxFilesSize: 100000,
        encoding: 'utf8'
    });
    
    form.on('field', function (name, value) {
        console.log('field', name, value);
    });
    
    form.on('part', function (part) {
        if (!part.filename) {
            part.read();
            return console.info('no file provided');
        }
        
        var contentType = part.headers['content-type'];

        blob.upload({
            name: id,
            stream: part,
            size: part.byteCount,
            contentType: contentType
        }, function (err, result) {
            if (err) {
                console.error('Error parsing form: ' + err.stack);
                res.writeHead(500);
                return res.end(err.message);
            }
            return res.json(result);
        });
    });
    
    form.on('error', function (err) {
        console.error('Error parsing form: ' + err.stack);
        res.writeHead(500);
        return res.end();
    });
    
    form.parse(req);
});


router.get('/jobs/statuses', function (req, res) {
    console.log('getting jobs statuses');
    
    var statuses = [
        { id: 1, name: 'Active', description: 'Active jobs' },
        { id: 2, name: 'Pending', description: 'Pending jobs' },
        { id: 3, name: 'Approved', description: 'Approved jobs' }
    ];
    
    res.json(statuses);

});


router.get('/jobs/:id/frames', function (req, res) {
    var id = req.params.id;
    console.log('getting frames for job', id);
    db.getVideoFramesByJob(id, function (err, resp) {
        if (err) return res.status(500).json({ error: err });
        console.log('resp:', resp);
        res.json(resp);
    });
});


router.get('/jobs/:id', function (req, res) {
    var id = req.params.id;
    console.log('getting job id', id);
    db.getJobDetails(id, function (err, resp) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }

        resp.video._blobSasToken = blob.getSAS({name: resp.video.Id});

        console.log('url:', resp.video.Url + '?' + resp.video._blobSasToken);
        res.json(resp);
    });
});

router.get('/jobs', function (req, res) {
    console.log('getting all jobs');
    db.getAllJobs(function (err, resp) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        console.log('resp:', resp);
        res.json(resp);
    });
});

router.post('/jobs/:id/frames/:index', function (req, res) {
    var options = {
        tagsJson: req.body.tags
    };
    options.jobId = req.params.id;
    options.frameIndex = req.params.index;
    
    console.log('posing frame index', options.frameIndex, 'for job', options.jobId);
    db.createOrModifyFrame(options, function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({});
    });
});

router.get('/users/:id/jobs', function (req, res) {
    var userId = req.params.id;
    console.log('getting jobs for user id', userId);
    db.getUserJobs(userId, function (err, resp) {
        if (err) return res.status(500).json({ error: err });
        console.log('resp:', resp);
        res.json(resp);
    });
});

router.get('/videos', function (req, res) {
    console.log('getting videos');
    db.getVideos(function (err, resp) {
        if (err) return res.status(500).json({ error: err });
        console.log('resp:', resp);
        res.json(resp);
    });
});

router.get('/videos/:id', function (req, res) {
    var id = req.params.id;
    console.log('getting video', id);
    db.getVideo(id, function (err, resp) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        console.log('resp:', resp);
        res.json(resp);
    });
});

router.get('/videos/:id/movie', function (req, res) {
    var id = req.params.id;
    console.log('getting video file', id);

    return blob.getVideoStream({ name: id },
        function (err, result) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }

            console.log('stream', result);

            res.setHeader('content-type', result.contentType);
            res.setHeader('content-length', result.contentLength);
            res.setHeader('etag', result.etag);

            result.stream.on('error', function(err){
                console.error(err);
                return res.status(500).json({ error: err.message });
            });

            result.stream.pipe(res);
    });
});

router.get('/videos/:id/movie2', function (req, res) {
    var id = req.params.id;
    console.log('getting video file*', id);

    return blob._getVideoStream({ name: id, req: req, res: res });
});

router.get('/users', function (req, res) {
    console.log('getting users');
    db.getUsers(function (err, resp) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        console.log('resp:', resp);
        res.json(resp);
    });
});


router.get('/videos/:id/frames', function (req, res) {
    var id = req.params.id;
    console.log('getting frames for video', id);
    db.getVideoFrames(id, function (err, resp) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        console.log('resp:', resp);
        res.json(resp);
    });
});

module.exports = router;