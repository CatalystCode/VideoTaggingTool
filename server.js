var http = require('http');
var express = require('express');
var bodyParser = require('body-parser')
var db = require('./db');

var port = process.env.PORT || 3003;

var app = express();

app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function(req, res){
    res.end('welcome to video tagging tool');
});


app.post('/job', function(req, res){
    db.createOrModifyJob(req.body, function(err, result){
        if(err) return res.status(500).json({ error: err });
        res.json(result);
    });
});

app.get('/jobs/:id', function(req, res){
    var id = req.params.id;
    console.log('getting job id', id);
    db.getJobDetails(id, function(err, resp) {
        if(err) return res.status(500).json({ error: err });
        console.log('resp:', resp);
        res.json(resp);
    });
});

app.post('/jobs/:id/frame/:frameId', function(req, res){
    var id = req.params.id;
    console.log('getting jobs for user id', id);
    // **************
    db.getJobDetails(id, function(err, resp) {
        if(err) return res.status(500).json({ error: err });
        console.log('resp:', resp);
        res.json(resp);
    });
});

app.get('users/:id/jobs', function(req, res){
    var id = req.params.id;
    console.log('getting jobs for user id', id);
    // **************
    db.getJobDetails(id, function(err, resp) {
        if(err) return res.status(500).json({ error: err });
        console.log('resp:', resp);
        res.json(resp);
    });
});


app.get('/videos', function(req, res){
    console.log('getting videos');
    db.getVideos(function(err, resp) {
        if(err) return res.status(500).json({ error: err });
        console.log('resp:', resp);
        res.json(resp);
    });
});



http.createServer(app).listen(port, function(err){
    if (err) return console.error('error creating server', err);
    console.log('listening on port', port);
});



