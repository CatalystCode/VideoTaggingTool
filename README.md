# Video Tagging App
This is a basic web app to tag and annotate videos, frame by frame.

## Features
* **Google authentication**
* **User management**- add/modify users
* **Roles**- users can be either Admins or Editors
* **Authorization**- users only see content based on their role. Also- authorization is being enforced on the server side
* **Uploading videos + labeling**- manage videos, upload/modify and label them. Sort videos by labels
* **Jobs**- creating tagging jobs for users, assigning videos to users
* **Video Tagging**- using the [Video Tagging](https://github.com/TBD) control to tag videos frame by frame


## Running the app locally

### Google Authentication
Since we're using Google Authentication, you'll need to on board with Google to enable Google Authentication for your app. Please follow the [following] (https://developers.google.com/identity/sign-in/web/devconsole-project) instructions to enable Google Authentication.
Don't forget to add `http://localhost:3000/.auth/login/google/callback` to the callbackUrl list so that it will also work when running the app locally.

### Sql Server
We're using Sql DB to keep our app data. You'll need to create your own Sql DB, either locally or in the cloud.
You can use Sql Express (which is [free] (https://www.microsoft.com/en-gb/download/details.aspx?id=42299)) for running the app locally, or create a Sql database in [Azure] (https://azure.microsoft.com/en-gb/services/sql-database).
After creating your DB, you'll need to run a Sql script that will deploy the DB schema.

Before running this script, we want to define the first user which will be the first Admin in the tool.
Please edit the file `storage/sql/schema.sql` and edit the last line with your name and google email.
After doing that, use your favorite Sql tool (Sql management studio, Visual Studio) to connect to the Sql server and execute the schema.sql script.

## Configuration
* Create a `/config/config.private.json` file with your configuration and secret keys when running locally. Use `config/sample.config.public.json` file as a reference.
You can start by copying this file to `/config/config.private.json` and then edit the content accordingly:
    * `sql.server`- your Sql server name
    * `sql.userName`- your Sql server name
    * `sql.password`- your Sql password
    * `sql.options.database`- your Sql database name
    * `storage.account`- your Azure storage account name
    * `storage.key`- your Azure storage account key
    * `auth.google.clientID`- your google client Id
    * `auth.google.clientSecret`- your google client secret
    * `auth.google.callbackURL`- your google client URL- this is the URL that will be called with the authentication token after the user provides his consent. Use `http://localhost:3000/.auth/login/google/callback` when working locally.

Installing node modules and web app bower modules:
* Run `npm install` from the root directory
* Run `bower install` from `public` directory (if you don’t have bower, install it by running `npm install bower -g`)

## Running the app
Run `npm start` and browse to `http://localhost:3000`

# License
[MIT](LICENSE)
