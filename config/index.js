
var fs = require('fs');
var path = require('path');

var localConfigPath = path.join(__dirname, "config.private.json");
var localConfig = fs.existsSync(localConfigPath) && require(localConfigPath) || {};

var config = {
    sql: {
        server: localConfig.sql && localConfig.sql.server || process.env.DB_SERVER,
        userName: localConfig.sql && localConfig.sql.userName || process.env.DB_USER,
        password: localConfig.sql && localConfig.sql.password || process.env.DB_PASSWORD,
        options: {
            database: localConfig.sql && localConfig.sql.options && localConfig.sql.options.database || process.env.DB_NAME,
            encrypt: true
        }
    },
    storage: {
        account: localConfig.storage && localConfig.storage.account || process.env.STORAGE_ACCOUNT,
        key: localConfig.storage && localConfig.storage.key || process.env.STORAGE_KEY
    },
    auth: {
        google: {
            clientID: localConfig.auth && localConfig.auth.google && localConfig.auth.google.clientID || process.env.GOOGLE_CLIENT_ID,
            clientSecret: localConfig.auth && localConfig.auth.google && localConfig.auth.google.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: localConfig.auth && localConfig.auth.google && localConfig.auth.google.callbackURL || process.env.GOOGLE_CALLBACK_URL
        }
    }
};

if (!config.sql.server) throw new Error('Sql server was not provided, please add DB_SERVER to environment variables');
if (!config.sql.userName) throw new Error('Sql user was not provided, please add DB_USER to environment variables');
if (!config.sql.password) throw new Error('password for db was not provided, please add DB_PASSWORD to environment variables');
if (!config.sql.options.database) throw new Error('db name was not provided, please add DB_NAME to environment variables');


if (!config.storage.account) throw new Error('storage account was not provided, please add STORAGE_ACCOUNT to environment variables');
if (!config.storage.key) throw new Error('storage key was not provided, please add STORAGE_KEY to environment variables');

if (!config.auth.google.clientID) throw new Error('google client Id was not provided, please add GOOGLE_CLIENT_ID to environment variables');
if (!config.auth.google.clientSecret) throw new Error('google client secret was not provided, please add GOOGLE_CLIENT_SECRET to environment variables');
if (!config.auth.google.callbackURL) throw new Error('google callback URL was not provided, please add GOOGLE_CALLBACK_URL to environment variables');


module.exports = config;
