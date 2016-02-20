# Deploying Video Tagging App to Azure
Follow these instructions to deploy the demo app to Azure.

## Allocate resources in Azure Management Portal
1. Open [Azure Management Portal] (https://ms.portal.azure.com)
2. Press the `+` sign and search for `Web App + SQL`. Select it, and press `Create`:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img10.png)
3. Fill in the App Name, Database and create a new Resource Group to contain all of the related resources:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img20.png)
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img30.png)
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img40.png)
4. Click `Create`, and wait while deployment is running. When deployment is ready, you'll be automatically redirected to the resource group and see the list of the resources allocated for you:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img50.png)
5. Before setting up the resources, we need to create a Storage Account where the videos are being stored. Press the `+` sign, and search for a `Storage Account`. Click `Create`:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img60.png)
6. Type a name, make sure to selected the same resource group, and the same region for your storage account:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img70.png)
7. Click `Create` and wait until deployment is ready.
8. After storage account is created, click the Keys icon on the top bar and copy the storage account `Name` and `Access Key` (Key 1) to a temporary file. We'll use it in a bit. 
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img80.png)
9. Go back to your resource group by clicking on it's tile on the Dashboard, or looking for it under the `Resource Groups` menu item on the left. 
You should now see all resources:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img90.png)

## Setting up SQL Server schema:
1. Fork the [Video Tagging Tool repository](https://github.com/CatalystCode/VideoTaggingTool) to your own GitHub account.
2. Download the `schema.sql` file located under `storage/sql` directory. Edit the file, scroll to the end of the file and edit the last line to add you as the first user of the tool:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img100.png)
3. Next step will be to setup the environment to host the website:
  * First we need to enable access to the Sql server from your machine IP, so that you can connect and create the schema. Click `videotaggingsrv` --> `All Settings` --> `Firewall` and add your IP. For the sake of the demo, I'm enabling all IP range. Save your changes.
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img115.png)
  * Use your favorite SQL Server client UI to connect to the SQL server. I'm using Sql Server Management Studio, you can also use Visual Studio in case you're using Windows. In case of other OS, look for Sql Server UI Client.
  * Use the SQL server settings, as defined when you created the SQL server. Click the `SQL Server` --> `Settings` to get the SQL server host name, and use the user and password you defined with the SQL Server Authentication scheme:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img110.png)
4. After connecting, you'll see the database that was provisioned for you. Right-click and select `New Query`:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img120.png)
5. Copy-Paste the content of the `Schema.sql` file to this window, and click `F5` to execute the script and create all of the db objects:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img130.png)

## Enable Google Authentication:
1. Browse to [Google Developer Console](https://console.developers.google.com/?pli=1). 
2. Under `Use Google APIs`, click `Enable and Manage APIs` link.
3. Select `Google+ API` and click `Enable`.
4. Open the `Credentials` tab. Click the `Create Credentials` select box and select `OAuth client ID`.
5. Select `Web Application` option from the menu and fill in the following details:
  * In the `Authorized Javascript origins`, add the Url for your website. This can be copied from the web app properties in the Azure portal.
  * In the `Authorized redirect URIs`, copy the same Url (**with https scheme**), and add `/.auth/login/google/callback` as demonstrated below:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img140.png)
  * Click the `Create` button.
6. You'll get a `client Id` and a `client secret`. Copy these strings to a temporary file. We'll use it in a bit:
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img150.png)

## Setting web app environment variables:
Next step will be to set up the web app environment variables. Go back to the MS Azure portal, 
and click the Web App icon on the resource group list.

Click `All Settings` --> `Application Settings` and add the following entries under the `App Settings` section.
**Make sure you're under the `Application Settings` section and not under the `Connection Strings` section**:

* `DB_SERVER` - The SQL server host name (`videotaggingsrv.database.windows.net` in our case)
* `DB_NAME`- The database name (`videoTaggingDemoDb` in our case)
* `DB_USER` - The SQL server user name (`video` in our case)
* `DB_PASSWORD`- The SQL server password
* `STORAGE_ACCOUNT`- The storage account (`videotaggingdemo` in our case)
* `STORAGE_KEY`- The storage key
* `GOOGLE_CLIENT_ID`- Google's client Id
* `GOOGLE_CLIENT_SECRET`- Google client secret
* `GOOGLE_CALLBACK_URL`- The website URL (**using https scheme**) + `/.auth/login/google/callback` (`https://video-tagging-demo.azurewebsites.net/.auth/login/google/callback` in our case).

![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img160.png)

## Setting up Continuous Integration and deploying the app from Github
1. Click the `Continuous deployment` option under the `Publishing` option for the Web App.
2. Select `Github` as the source and set up your authentication.
3. Choose the forked repository and select the `master` branch.
![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img170.png)
Click `OK`, and hope for the best :-)

After a few minutes, if everything went well, you should be able to point your browser to the website URL and log in to the tool.
Since you're the only Admin user, you'll be able to add more users under the `Users` tab.

![screenshot](https://github.com/CatalystCode/VideoTaggingTool/raw/master/deploy/img/img180.png)


Enjoy!
