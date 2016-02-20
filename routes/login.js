var express = require('express');
var router = express.Router();

module.exports = function (passport) {
    
    router.get('/login', passport.authenticate('google', { scope : ['https://www.googleapis.com/auth/plus.profile.emails.read'] }));
    
    // the callback after google has authenticated the user
    router.get('/.auth/login/google/callback',
            passport.authenticate('google', {
            successRedirect : '/#/jobs',
            failureRedirect : '/Login'
    }));

    router.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    router.get('/profile', isLoggedIn, function (req, res) {
        res.json(req.user);
    });

    return router;
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();
    
    // if they aren't redirect them to the home page
    //res.redirect('/');
    return res.status(401).json({ error: 'user not logged in' });
}