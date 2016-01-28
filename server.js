
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var api = require('./routes/api');

var passport = require('passport');
var flash    = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

require('./auth/passport')(passport);

var app = express();

app.use(morgan('dev')); // log every request to the console

app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// required for passport
app.use(session({ secret: 'mysecretsesson123456789' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.use(require('./routes/login')(passport));
app.use('/api', api());

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res) {
    return res.status(404).json({ error: 'not found' });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + server.address().port);
});

