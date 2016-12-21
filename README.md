# Video Tagging App
A single-page, angular.js based web application that provides a basic holistic solution for managing users, videos and tagging jobs. It uses the [Video-Tagging HTML control](https://github.com/CatalystCode/Video-Tagging) to demonstrate a real use of it in an actual web app. 
The tool comes with built-in authentication and authorization mechanisms. We used google for the authentication, and defined two main roles for the authorization. Each user is either an Admin or an Editor. 

An Admin is able to access all of the areas in the app, to add users, upload videos and create video-tagging jobs (assigning users to videos). An Admin can also review and approve video-tagging jobs, as well as fix specific tags while reviewing. 
An Editor can only view his jobs list, and do the actual tagging work. When the tagging-work is done, the editor sends the job for review, which is done by an Admin that reviews and approves it. 
In the end, the tags can also be downloaded (json format) to be used with the video-processing algorithms.

The data that we save for each entity (user, video, job) was designed to be extensible. Users can use the tool as is, with its current DB schema (Sql server), and add more data items without changing the schema. In the tool, for example, we keep various of metadata items for a job, like RegionType for example, to define if we would like to tag a specific location, or an area in the frames.
 
The server side code isn't aware of this data. It is just being used as a pipe between the client side and the storage layer. It was important for us to provide a framework that will enable adding features without changing the schema, or at least minimizing the amount of changes required to add more feature to the tool.

## Features
* **Google authentication**
* **User management**- add/modify users
* **Roles**- users can be either Admins or Editors
* **Authorization**- users only see content based on their role. Also- authorization is being enforced on the server side
* **Uploading videos + labeling**- manage videos, upload/modify and label them. Sort videos by labels
* **Jobs**- creating tagging jobs for users, assigning videos to users
* **Video Tagging**- using the [Video Tagging](https://github.com/CatalystCode/video-tagging) control to tag videos frame by frame

## Deploying the app
* Follow [these](deploy/azure.md) instructions to deploy the app on Azure.
* Follow [these](deploy/local.md) instructions to run the app locally.

[![Deploy to Azure](http://azuredeploy.net/deploybutton.png)](https://azuredeploy.net/)

# License
[MIT](LICENSE)
