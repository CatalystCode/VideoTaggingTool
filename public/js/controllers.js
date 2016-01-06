﻿
var videoTaggingAppControllers = angular.module('videoTaggingAppControllers', []);

videoTaggingAppControllers

.factory('state', ['$http', '$rootScope', function ($http, $rootScope) {
    
    var jobStatus = {};
    
    $http({ method: 'GET', url: '/api/jobs/statuses' })
        .success(function (result) {
            console.log('got statuses', result);
            result.statuses.forEach(function (status) {
                jobStatus[status.Name] = status.Id;
            });
    })
    .error(function (err) {
        console.error(err);
    });
        
    $rootScope.jobSetup = {
        locationTypes: { values: ['Area', 'Point'], default: 'Area' },
        locationShapes: { values: ['Rectangle', 'Circle'], default: 'Rectangle' },
        multiLocations: { values: [{ id: '0', name: 'False' }, { id: '1', name: 'True' }], default: '1' },
        locationSizes: { values: Array.apply(null, Array(100)).map(function (item, i) { return i + 1 }), default: 20 }
    };

    $rootScope.jobStatuses = {
        Active: 1,
        Pending: 2,
        Approved: 3
    };

    return {
            getJobStatusByName: function () {
                return jobStatus;
            }
    };

}])

.controller('AppController', ['$scope', '$rootScope', '$route', '$http', '$location', '$routeParams', 'state', function ($scope, $rootScope, $route, $http, $location, $routeParams, state) {
    
        
        $http({ method: 'GET', url: '/profile' })
        .success(function (user) {
            console.log('got user profile', user);
            $rootScope.user = user;
        })
        .error(function (err){
            console.error(err);
        });

        $scope.logout = function (){
            $rootScope.user = user;
        }
        
        $scope.$route = $route;

        $rootScope.ajaxStart = function() {
            $rootScope.ajax = true;
        }
        $rootScope.ajaxCompleted = function() {
            $rootScope.ajax = false;
        }

        $rootScope.showError = function(err) {
            $rootScope.error = err;
        }

        $rootScope.showInfo = function(msg) {
            $rootScope.info = msg;
        }

        $rootScope.clearMessages = function() {
            $rootScope.error = '';
            $rootScope.info = '';
        }

    }])
    

.controller('JobsController', ['$scope', '$route', '$http', '$location', '$routeParams', function ($scope, $route, $http, $location, $routeParams) {

        $scope.clearMessages();
        $scope.btnMeOrAll = 'me';
        $scope.btnStatus = 'all';

        $scope.ajaxStart();
        $http({ method: 'GET', url: '/api/jobs/statuses' })
        .success(function (result) {
            $scope.jobStatuses = result.statuses;
            $scope.ajaxCompleted();
        });
        
        var jobs;

        getJobsFromServer('/api/users/' + $scope.user.Id + '/jobs');
        
        function getJobsFromServer(url) {
            console.log('getting jobs', url);

            $scope.ajaxStart();
            $http({ method: 'GET', url: url })
            .success(function (result) {
                jobs = result.jobs;
                _filter($scope.btnStatus);
                $scope.ajaxCompleted();
            })
        }
        
        function filterFetch(filter) {
            console.log('filter', filter);
            switch (filter) {
                case 'all':
                    getJobsFromServer('/api/jobs');
                    break;
                default:
                    getJobsFromServer('/api/users/' + $scope.user.Id + '/jobs');
            }
        }
        
        $scope.filterFetch = function (filter) {
            $scope.btnMeOrAll = filter;
            filterFetch(filter);
            console.log(this);
        }
        
        $scope.filter = function (status) {
            $scope.btnStatus = status;
            _filter(status);
        }
        
        function _filter(status) {
            $scope.jobs = jobs.filter(function (job) {
                return status==='all' || job.StatusName == status;
            });
        }
        
        $scope.count = function (status) {
            return jobs && jobs.filter(function (job) {
                return !status || job.StatusId == status;
            }).length || 0;
        }

        $scope.getConfig = function (job) {
            return JSON.stringify(job.Config, true, 2);
        }

        $scope.addJob = function () {
            $location.path('/jobs/0');
        }

        $scope.editJob = function () {
            var jobId = this.job.JobId;
            $location.path('/jobs/' + jobId);
        }

        $scope.tagJob = function() {
            var jobId = this.job.JobId;
            $location.path('/jobs/' + jobId + '/tag');
        }
    }])
    
.controller('UpsertJobController', ['$scope', '$http', '$location', '$routeParams', 'state', function ($scope, $http, $location, $routeParams, state) {

        $scope.clearMessages();
        var defaultId = '[new]';
        $scope.jobId = defaultId;

        $scope.locationtype = $scope.jobSetup.locationTypes.default;
        $scope.locationshape = $scope.jobSetup.locationShapes.default;
        $scope.multilocations = $scope.jobSetup.multiLocations.default;
        $scope.locationsize = $scope.jobSetup.locationSizes.default;
        $scope.selectedStatus = { Id: $scope.jobStatuses['Active'] };

        if ($routeParams.id != 0) {
            $scope.ajaxStart();
            $http({ method: 'GET', url: '/api/jobs/' + $routeParams.id })
            .success(function (result) {
                console.log('jobData', result);
              //  $scope.jobData = result;
                $scope.jobId = result.job.Id;
                $scope.selectedVideo = result.video;
                $scope.selectedUser = result.user;
                $scope.selectedStatus = { Id: result.job.StatusId };
                console.log(' $scope.selectedStatus', $scope.selectedStatus);
                $scope.description = result.job.Description;
                
                $scope.config = result.job.Config;
                $scope.locationtype = result.job.Config.locationtype;
                $scope.locationshape = result.job.Config.locationshape;
                $scope.multilocations = result.job.Config.multilocations;
                $scope.locationsize = result.job.Config.locationsize;

                $scope.tags = result.job.Config && result.job.Config.tags && result.job.Config.tags.join(', ');
                $scope.ajaxCompleted();
            });
        }

        $scope.ajaxStart();
        $http({ method: 'GET', url: '/api/jobs/statuses' })
        .success(function (result) {
            console.log('got statuses', result);
            $scope.jobStatuses = result.statuses;
            $scope.ajaxCompleted();
        });

        $http({ method: 'GET', url: '/api/videos' })
            .success(function (result) {
                $scope.videos = result.videos;
                console.log('videos', result);
                $scope.ajaxCompleted();

                if ($routeParams.id == 0) {
                    var videoId = $location.search()['videoId'];

                    var selectedVideoArr = $scope.videos.filter(function(video){
                        return video.Id == videoId
                    });
                    $scope.selectedVideo = selectedVideoArr.length && selectedVideoArr[0];
                    $scope.description = $scope.selectedVideo ? 'new job for video ' + $scope.selectedVideo.Name : 'new job';
            }
        });

        $http({ method: 'GET', url: '/api/users' })
            .success(function (result) {
                $scope.users = result.users;
                console.log('users', result);
                $scope.ajaxCompleted();
        });

        $scope.submit = function () {
            
            $scope.clearMessages();

            if(!$scope.selectedVideo || !$scope.selectedVideo.Id) return $scope.showError('video was not provided');
            if(!$scope.selectedUser || !$scope.selectedUser.Id) return $scope.showError('user was not provided');
            if(!$scope.description) return $scope.showError('description was not provided');
            if(!$scope.selectedStatus || !$scope.selectedStatus.Id) return $scope.showError('status was not provided');
            if(!$scope.locationtype) return $scope.showError('locationtype was not provided');
            if(!$scope.locationshape) return $scope.showError('locationshape was not provided');
            if(!$scope.multilocations) return $scope.showError('multilocations was not provided');
            if(!$scope.locationsize) return $scope.showError('locationsize was not provided');

            var data = {
                videoId: $scope.selectedVideo.Id,
                userId: $scope.selectedUser && $scope.selectedUser.Id,
                description: $scope.description,
                statusId: $scope.selectedStatus.Id,
                configJson: {
                    locationtype: $scope.locationtype,
                    locationshape: $scope.locationshape,
                    multilocations: $scope.multilocations,
                    locationsize: $scope.locationsize,
                    tags: ($scope.tags && $scope.tags.split(',').map(function (tag) { return tag.trim(); })) || ''
                }
            };

            if (!$scope.selectedUser || !$scope.selectedUser.Id) {
                return $scope.showError('user was not provided');
            }

            if ($scope.jobId != defaultId) {
                data.id = $scope.jobId;
            }
            
            console.log('submitting', data);

            $scope.ajaxStart();
            $http({ method: 'POST', url: '/api/jobs', data: data })
            .success(function (result) {
                    console.log('result', result);
                    $scope.showInfo('job ' + result.jobId + ($scope.jobId == defaultId ? ' created' : ' modified') + ' successfully');
                    $scope.jobId = result.jobId;
                    $scope.ajaxCompleted();
            })
            .error(function (err) {
                    console.error(err);
                    $scope.showError(err.error);
                    $scope.ajaxCompleted();
            });
        }
    }])
    
    
.controller('UpsertUserController', ['$scope', '$http', '$location', '$routeParams', function ($scope, $http, $location, $routeParams) {

        $scope.clearMessages();
        var defaultId = '[new]';
        $scope.userId = defaultId;
        
        if ($routeParams.id != 0) {
            $scope.ajaxStart();
            $http({ method: 'GET', url: '/api/users/' + $routeParams.id })
            .success(function (result) {
                console.log('userData', result);
                $scope.userId = result.Id;
                $scope.name = result.Name;
                $scope.email = result.Email;

                $scope.selectedRole = { Id: result.RoleId, name: result.RoleName };
                $scope.ajaxCompleted();
            });
        }

        $scope.ajaxStart();
        $http({ method: 'GET', url: '/api/roles' })
        .success(function (result) {
            console.log('got statuses', result);
            $scope.roles = result.roles;
            $scope.ajaxCompleted();
        });
        
        
        $scope.submit = function () {

            $scope.clearMessages();

            if(!$scope.name) return $scope.showError('name was not provided');
            if(!$scope.email) return $scope.showError('email was not provided');
            if(!$scope.selectedRole || !$scope.selectedRole.Id) return $scope.showError('role was not provided');

            var data = {
                name: $scope.name,
                email: $scope.email,
                roleId: $scope.selectedRole.Id
            };
            
            if ($scope.userId != defaultId) {
                data.id = $scope.userId;
            }
            
            console.log('submitting', data);
            $scope.ajaxStart();
            $http({ method: 'POST', url: '/api/users', data: data })
            .success(function (result) {
                console.log('result', result);
                $scope.showInfo('user ' + result.userId + ($scope.userId == defaultId ? ' created' : ' modified') + ' successfully');
                $scope.userId = result.userId;
                $scope.ajaxCompleted();
            })
            .error(function (err) {
                console.error(err);
                $scope.showError(err.error);
                $scope.ajaxCompleted();
            });
        }
    }])
    

.controller('VideosController', ['$scope', '$route', '$http', '$location', '$routeParams', function ($scope, $route, $http, $location, $routeParams) {
        var videos = [];

        $scope.ajaxStart();
        $http({ method: 'GET', url: '/api/videos' })
        .success(function (result) {
            videos = $scope.videos = result.videos;
                $scope.ajaxCompleted();
        });

        $scope.addVideo = function () {
            $location.path('/videos/0');
        }

        $scope.editVideo = function () {
            var videoId = this.video.Id;
            $location.path('/videos/' + videoId);
        }

        $scope.createJob = function() {
            var videoId = this.video.Id;
            console.log('creating job for video id', videoId);
            $location.path('/jobs/0').search({'videoId': videoId });
        }
    }])

    
.controller('TagJobController', ['$scope', '$route', '$http', '$location', '$routeParams', 'state', function ($scope, $route, $http, $location, $routeParams, state) {

        $scope.clearMessages();
        var videoCtrl = document.getElementById('video-tagging');
        var jobId = $routeParams.id;

        $scope.ajaxStart();
        $http({ method: 'GET', url: '/api/jobs/' + jobId })
        .success(function (jobData) {
            $scope.jobData = jobData;
            console.log('jobData', jobData);

                videoCtrl.videoduration = jobData.video.DurationSeconds;
                videoCtrl.videowidth = jobData.video.Width;
                videoCtrl.videoheight = jobData.video.Height;
                videoCtrl.framerate = jobData.video.FramesPerSecond;

                videoCtrl.locationshape = jobData.job.Config.locationshape;
                videoCtrl.locationtype = jobData.job.Config.locationtype;
                videoCtrl.multilocations = jobData.job.Config.multilocations;
                videoCtrl.locationsize = jobData.job.Config.locationsize;

                videoCtrl.inputtagsarray = jobData.job.Config.tags;

                $http({ method: 'GET', url: '/api/jobs/' + $routeParams.id + '/frames' })
                    .success(function (result) {
                        videoCtrl.inputFrames = result.frames;
                        videoCtrl.src = '';
                        console.log('video url', jobData.video.Url);
                        videoCtrl.src = jobData.video.Url;
                        $scope.ajaxCompleted();
                    });
        });

        $scope.updateJobStatus = function (status) {
            $scope.clearMessages();
            var statusId = state.getJobStatusByName()[status];
            var data = { statusId: statusId };

            $scope.ajaxStart();
            $http({ method: 'POST', url: "/api/jobs/" + jobId + "/status", data: data })
            .success(function () {
                console.log('success');
                $scope.showInfo('job updated');
                $scope.ajaxCompleted();
            })
            .error(function (err) {
                console.error(err);
                $scope.showError('error updating job: ' + err.message);
                $scope.ajaxCompleted();
            });
        }

        function tagHandler(e) {
            var inputObject = e.detail.location;

            var msg = {};
            msg.tags = inputObject.locations;
            
            $http({ method: 'POST', url: '/api/jobs/' + jobId + '/frames/' + inputObject.frameIndex, data: msg })
            .success(function (result) {
                console.log('success');
                $scope.showInfo('frame saved successfully');
            })
            .error(function (err) {
                console.error('error', err);
                $scope.showError('error saving frame: ' + error.message || '');
            });
        }

        window.addEventListener('onlocationchanged', tagHandler);

        $scope.$on('$destroy', function() {
            window.removeEventListener('onlocationchanged', tagHandler);
        })
    }])

.controller('UpsertVideoController', ['$scope', '$http', '$location', '$routeParams', function ($scope, $http, $location, $routeParams) {
        
        var defaultId = '[new]';
        $scope.videoId = defaultId;
        $scope.config = '{}';
        $scope.progress = null;

        if ($routeParams.id != 0) {
            $scope.ajaxStart();
            $http({ method: 'GET', url: '/api/videos/' + $routeParams.id })
            .success(function (video) {
                console.log('video', video);
               
                $scope.videoId = video.Id;
                $scope.name = video.Name;
                $scope.url = video.Url;
                $scope.height = video.Height;
                $scope.width = video.Width;
                $scope.duration = video.DurationSeconds.toFixed(2);
                $scope.framesPerSecond = video.FramesPerSecond.toFixed(2);
                $scope.ajaxCompleted();
            });
        }

        $scope.submit = function () {
            
            $scope.clearMessages();

            if(!$scope.name) return $scope.showError('name was not provided');
            if(!$scope.height) return $scope.showError('height was not provided');
            if(!$scope.width) return $scope.showError('width was not provided');
            if(!$scope.duration) return $scope.showError('duration was not provided');
            if(!$scope.framesPerSecond) return $scope.showError('framesPerSecond was not provided');

            var data = {
                name: $scope.name,
                height: $scope.height,
                width: $scope.width,
                durationSeconds: $scope.duration,
                framesPerSecond: $scope.framesPerSecond
            };
            
            if ($scope.videoId != defaultId) {
                data.id = $scope.videoId;
            }
            
            console.log('submitting', data);

            $scope.ajaxStart();
            $http({ method: 'POST', url: '/api/videos', data: data })
            .success(function (result) {
                    console.log('result', result);
                    $scope.showInfo('video ' + result.videoId + ($scope.videoId == defaultId ? ' created' : ' modified') + ' successfully');
                    $scope.videoId = result.videoId;
                    $scope.ajaxCompleted();
            })
            .error(function (err) {
                    console.error(err);
                    $scope.showError(err.error);
                    $scope.ajaxCompleted();
            });
        }
        
        
        $scope.submitVideo = function() {
            $scope.clearMessages();
            
            var form = document.getElementById('uploadVideoForm');

            var formData = new FormData(form);
           
            $.ajax({
                url: '/api/videos/' + $scope.videoId,
                type: 'POST',
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
                success: function (result) {
                    $scope.$apply(function () { 
                        console.log('video uploaded successfully');
                        $scope.showInfo('video uploaded successfully');
                    });
                },
                error: function (err) {
                    $scope.$apply(function () { 
                        console.error('error uploading video', err);
                        $scope.showError('error uploading video ' + err.message);
                    });
                },
                xhr: function () {
                    var xhr = new window.XMLHttpRequest();
                    //Upload progress
                    xhr.upload.addEventListener('progress', updateProgress, true);
                    //Download progress
                    xhr.addEventListener("progress", updateProgress, false);
                    return xhr;
                }
            });

        }
        
        function updateProgress(e) {
            $scope.$apply(function () {
                console.log('got progress', e);
                if (e.lengthComputable) {
                    var pct = Math.ceil((e.loaded / e.total) * 100);
                    console.log('progress', pct);
                    $scope.progress = pct;
                    if(pct == 100) {
                        setTimeout(function(){
                            $scope.$apply(function () {
                                $scope.progress = null;
                            });
                        }, 3000);
                    }
                } else {
                    console.warn('Content Length not reported!');
                }
            });
        }
    }])

    .controller('UsersController', ['$scope', '$route', '$http', '$location', '$routeParams', function ($scope, $route, $http, $location, $routeParams) {
    var users = [];

    $scope.ajaxStart();
    $http({ method: 'GET', url: '/api/users' })
        .success(function (result) {
            users = $scope.users = result.users;
            $scope.ajaxCompleted();
        });

    $scope.editUser = function () {
        $location.path('/users/' + this.user.Id);
    }


    $scope.addUser = function () {
        $location.path('/users/0');
    }

}]);