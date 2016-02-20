var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var config = require('../config').auth.google;
var db = require('../storage/db');

function findUser(email, cb) {
    db.getUserByEmail(email, cb);
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
                email: profile.emails[0].value,
                image: profile.photos.length && profile.photos[0] && profile.photos[0].value
            };

            // try to find the user based on their google id
            findUser(userProfile.email, function(err, user) {
                if (err) return cb(err);

                if (user) {
                    user.Authorized = true;
                    user.ImageUrl = userProfile.image;
                    return cb(null, user);
                } 
                else {
                    return cb(null, {
                        Name: userProfile.name,
                        Email: userProfile.email,
                        ImageUrl: userProfile.image,
                        Authorized: false
                    });
                }
            });
        });
    }));
};
