var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var config = require('./passport.google.private');
var db = require('./storage/db');

function findUser(user, cb) {
    db.getUserByEmail(user.email, cb);
}

module.exports = function(passport) {

    // used to serialize the user for the session
    passport.serializeUser(function(userProfile, cb) {
        return cb(null, userProfile);
    });

    // used to deserialize the user
    passport.deserializeUser(function (userProfile, cb) {
        return cb(null, userProfile);
    });
        
    passport.use('google', new GoogleStrategy(config,
        function(token, refreshToken, profile, cb) {

            // make the code asynchronous
            // User.findOne won't fire until we have all our data back from Google
            process.nextTick(function() {
            
            var userProfile = {
                name: profile.displayName,
                email: profile.emails[0].value 
             //   image: profile.image.url
            };

            // try to find the user based on their google id
            findUser(userProfile, function(err, user) {
                if (err) return cb(err);

                if (user) {
                    user.Authorized = true;
                    return cb(null, user);
                } 
                else {
                    return cb(null, {
                        Name: userProfile.name,
                        Email: userProfile.email,
                        Authorized: false
                    });
                }
            });
        });
    }));
};
