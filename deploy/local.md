# Running the Video Tagging App locally
Follow these instructions to run the demo app on you local machine.

## Enable Google Authentication:
1. Browse to [Google Developer Console](https://console.developers.google.com/?pli=1). 
2. Under `Use Google APIs`, click `Enable and Manage APIs` link.
3. Select `Google+ API` and click `Enable`.
4. Open the `Credentials` tab. Click the `Create Credentials` select box and select `OAuth client ID`.
5. Select `Web Application` option from the menu and fill in the following details:
  * In the `Authorized Javascript origins`, add the Url for your website: `http://localhost:3000` in this case.
  * In the `Authorized redirect URIs`, add the callback Url: `http://localhost:3000/.auth/login/google/callback` in this case.
  * Click the `Create` button.
6. You'll get a `client Id` and a `client secret`. Copy these strings to a temporary file. We'll use it in a bit.

## SQL Server
We're using Sql DB to keep our app data. You'll need to create your own Sql DB, either locally or in the cloud.
You can use Sql Express (which is [free] (https://www.microsoft.com/en-gb/download/details.aspx?id=42299)) for running the app locally, or create a Sql database in [Azure] (https://azure.microsoft.com/en-gb/services/sql-database).
After creating your DB, you'll need to run a Sql script that will deploy the DB schema.

1. Download the `schema.sql` file located under `storage/sql` directory. Edit the file, scroll to the end of the file and edit the last line to add you as the first user of the tool:

![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img100.png)

2. If you're using Azure SQL, we need to enable access to the Sql server from your machine IP, so that you can connect and create the schema. Click the SQL Server instance on MS Azure portal --> `All Settings` --> `Firewall` and add your IP. For the sake of the demo, I'm enabling all IP range. Save your changes.

![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img115.png)

  * Use your favorite SQL Server client UI to connect to the SQL server. I'm using Sql Server Management Studio, you can also use Visual Studio in case you're using Windows. In case of other OS, look for Sql Server UI Client.
  * Use the SQL server settings, as defined when you created the SQL server. Click the `SQL Server` --> `Settings` to get the SQL server host name, and use the user and password you defined with the SQL Server Authentication scheme:
  
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img110.png)

3. After connecting, you'll see the database that was provisioned for you. Right-click and select `New Query`:

![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img120.png)

4. Copy-Paste the content of the `Schema.sql` file to this window, and click `F5` to execute the script and create all of the db objects:

![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img130.png)

## Storage Account
We're using Azure Storage Accont to store the videos. 
You can use the local storage account provided as part of Azure SDK, or provision a new account in Azure.

## Configuration
Create a `/config/config.private.json` file with your configuration and secret keys when running locally. Use `config/sample.config.private.json` file as a reference.
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

> When deploying the app to the cloud, it is recommended to use the environment variables instead of the config file.
> Take a look at `/config/index.js` file to get the names of the environment variables corresponding to the configuration items described above.


## Installing node modules and web app bower modules:
* Run `npm install` from the root directory
* Run `bower install` from `public` directory (if you don’t have bower, install it by running `npm install bower -g`)

## Running the app
Run `npm start` and browse to `http://localhost:3000`
