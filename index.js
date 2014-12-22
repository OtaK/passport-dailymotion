var util = require('util');
    _    = require('lodash');

var OAuth2Strategy      = require('passport-oauth').OAuth2Strategy,
    InternalOAuthError  = require('passport-oauth').InternalOAuthError;

var Strategy = function(options, verify) {
    options = options || {};
    options.authorizationURL = options.authorizationURL || 'https://www.dailymotion.com/oauth/authorize';
    options.tokenURL = options.tokenURL || 'https://www.dailymotion.com/oauth/token';
    options.scopeSeparator = options.scopeSeparator || ',';

    OAuth2Strategy.call(this, options, verify);
    this.name = 'dailymotion';
    this._profileURL = options.profileURL || 'https://api.dailymotion.com/me';
};

util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.userProfile = function(accessToken, done) {
    var url = this._profileURL;

    this._oauth2.getProtectedResource(url, accessToken, function(err, body, res) {
        if (!!err)
            return done(new InternalOAuthError('failed to fetch user profile', err));

        try { var json = JSON.parse(body); }
        catch(e) { done(e); }

        var dmProfile = { provider: 'dailymotion' };
        dmProfile.displayName = dmProfile.screenname;

        var nameComponents = dmProfile.displayName.split(' ');
        var pName = { familyName: '', givenName: nameComponents[0] };

        if (nameComponents.length > 0)
            pName.familyName = nameComponents[nameComponents.length - 1];

        dmProfile.name = pName;

        dmProfile._raw = body;
        dmProfile._json = json;

        done(null, dmProfile);
    });
};

Strategy.prototype._convertProfileFields = function(profileFields) {
    var map = {
        id: 'id',
        displayName: 'screenname',
        username: 'username'
    };

    var fields = [];

    return _.map(profileFields, function(f) {
        if (typeof map[f] !== 'undefined') return map[f];
    }).join(',');
};

Strategy.prototype.authorizationParams = function(options) {
    var params = {};
    if (!!options.accessType)
        params.access_type = options.accessType;

    if (!!options.approvalPrompt)
        params.approval_prompt = options.approvalPrompt;

    return params;
};

module.exports.Strategy = Strategy;
