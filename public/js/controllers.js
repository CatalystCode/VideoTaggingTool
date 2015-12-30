
var videoTaggingAppControllers = angular.module('videoTaggingAppControllers', []);

videoTaggingAppControllers
.service('state', ['$http', function ($http) {

        var data = {
            enums: {

            }
        };

        var api = {
            getUser: function () {
                return data.user;
            },
            setUser: function (user) {
                data.user = user;
            }
        };
        
        return api;

    }])
    
.controller('AppController', ['$scope', 'state', '$route', '$http', '$location', '$routeParams', function ($scope, state, $route, $http, $location, $routeParams) {
        
        var user = {
            name: 'Ami Turgman',
            id: 1
        };

        state.setUser(user);

        $scope.$route = $route;    
        $scope.user  = user;

    }])
    

.controller('JobsController', ['$scope', '$route', 'state', '$http', '$location', '$routeParams', function ($scope, $route, state, $http, $location, $routeParams) {
        
        $scope.btnMeOrAll = 'me';
        $scope.btnStatus = 'all';

        $http({ method: 'GET', url: '/api/jobs/statuses' })
        .success(function (result) {
            $scope.jobStatuses = result;
        });
        
        var jobs;
        
        getJobsFromServer('/api/users/' + state.getUser().id + '/jobs');
        
        function getJobsFromServer(url) {
            console.log('getting jobs', url);
            
            $http({ method: 'GET', url: url })
            .success(function (result) {
                jobs = result.jobs;
                _filter($scope.btnStatus);     
            });
        }
        
        function filterFetch(filter) {
            console.log('filter', filter);
            switch (filter) {
                case 'all':
                    getJobsFromServer('/api/jobs');
                    break;
                default:
                    getJobsFromServer('/api/users/' + state.getUser().id + '/jobs');
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
        
        $scope.edit = function (jobId) {
            $location.path('/jobs/' + jobId);
        }
        
        $scope.count = function (status) {
            return jobs && jobs.filter(function (job) {
                return !status || job.StatusId == status;
            }).length || 0;
        }

        $scope.getConfig = function (job) {
            return JSON.stringify(job.Config, true, 2);
        }

    }])
    
.controller('UpsertJobController', ['$scope', 'state', '$http', '$location', '$routeParams', function ($scope, state, $http, $location, $routeParams) {
        
        var defaultId = '[new]';
        $scope.jobId = defaultId;
        $scope.config = '{"locationtype":"Area","locationshape":"Rectangle","multilocations":"1","locationsize":"20","tags":["horse","bird"]}';
        
        if ($routeParams.id != 0) {
            $http({ method: 'GET', url: '/api/jobs/' + $routeParams.id })
            .success(function (result) {
                console.log('jobData', result);
                $scope.jobId = result.job.Id;
                $scope.selectedVideo = result.video;
                $scope.selectedUser = result.user;
                $scope.selectedStatus = { id: result.job.StatusId, name: result.job.StatusName } ;
                $scope.description = result.job.Description;
                $scope.config = result.job.Config && JSON.stringify(result.job.Config, true, 2);
            });
        }
      
        $http({ method: 'GET', url: '/api/jobs/statuses' })
        .success(function (result) {
            console.log('got statuses', result);
            $scope.jobStatuses = result;
        });

        $http({ method: 'GET', url: '/api/videos' })
            .success(function (result) {
            $scope.videos = result.videos;
            console.log('videos', result);
        });

        $http({ method: 'GET', url: '/api/users' })
            .success(function (result) {
            $scope.users = result.users;
            console.log('users', result);
        });

        $scope.submit = function () {
            
            clearMessages();

            var data = {
                videoId: $scope.selectedVideo.Id,
                userId: $scope.selectedUser.Id,
                createdById: state.getUser().id,
                description: $scope.description,
                statusId: $scope.selectedStatus.id,
                configJson: JSON.parse($scope.config)
            };
            
            if ($scope.jobId != defaultId) {
                data.id = $scope.jobId;
            }
            
            console.log('submitting', data);

            $http({ method: 'POST', url: '/api/jobs', data: data })
            .success(function (result) {
                console.log('result', result);
                info('job ' + result.jobId + ($scope.jobId == defaultId ? ' created' : ' modified') + ' successfully');
                $scope.jobId = result.jobId;
            })
            .error(function (err) {
                console.error(err);
                error(err.error.message);
            });
        }
        
        function error(err) {
            $scope.error = err;
        }
        
        function info(msg) {
            $scope.info = msg;
        }
        
        function clearMessages() {
            $scope.error = '';
            $scope.info = '';
        }
    }])
    
.controller('VideosController', ['$scope', '$route', 'state', '$http', '$location', '$routeParams', function ($scope, $route, state, $http, $location, $routeParams) {
        var videos = [];    

        $http({ method: 'GET', url: '/api/videos' })
        .success(function (result) {
            videos = $scope.videos = result.videos;
        });

        
        $scope.getMetadata = function (video) {
            return JSON.stringify(video.Data, true, 2);
        }

        
        $scope.edit = function (id) {
            $location.path('/videos/' + id);
        }
        

    }])

    
.controller('TagJobController', ['$scope', '$route', 'state', '$http', '$location', '$routeParams', function ($scope, $route, state, $http, $location, $routeParams) {
        
        var videoCtrl = document.getElementById('video-tagging');

        var jobId = $routeParams.id;

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
                        var url = jobData.video.Url + '?' + jobData.video._blobSasToken;
                       // url = '/api/videos/' + jobData.video.Id + '/movie';
                        console.log('video url', url);
                        videoCtrl.src = url;
                    });
        });

        function tagHandler(e) {
            var inputObject = e.detail.location;

            var msg = {};
            msg.tags = inputObject.locations;
            var json = JSON.stringify(msg)

            console.log(json);

            //POST
            $.ajax({
                type: "POST",
                url: "/api/jobs/" + jobId + "/frames/" + inputObject.frameIndex,
                dataType: "json",
                data: json,
                cache: false,
                contentType: "application/json"
            })
                .error(function(err){
                   console.error('error', err);
                })
                .success(function(){
                    console.log('success');
                });
        }

        window.addEventListener('onlocationchanged', tagHandler);

        $scope.$on('$destroy', function() {
            window.removeEventListener('onlocationchanged', tagHandler);
        })

    }])

.controller('UpsertVideoController', ['$scope', 'state', '$http', '$location', '$routeParams', function ($scope, state, $http, $location, $routeParams) {
        
        var defaultId = '[new]';
        $scope.videoId = defaultId;
        $scope.config = '{}';
        $scope.progress = null;

        if ($routeParams.id != 0) {
            $http({ method: 'GET', url: '/api/videos/' + $routeParams.id })
            .success(function (video) {
                console.log('video', video);
               
                $scope.videoId = video.Id;
                $scope.name = video.Name;
                $scope.url = video.Url;
                $scope.height = video.Height;
                $scope.width = video.Width;
                $scope.duration = video.DurationSeconds;
                $scope.framesPerSecond = video.FramesPerSecond;
                
                $scope.metadata = video.Data && JSON.stringify(video.Data);
                
            });
        }

        $scope.submit = function () {
            
            clearMessages();
            
            var data = {
                name: $scope.name,
                height: $scope.height,
                width: $scope.width,
                durationSeconds: $scope.duration,
                framesPerSecond: $scope.framesPerSecond,
                videoJson: JSON.parse($scope.metadata)
            };
            
            if ($scope.videoId != defaultId) {
                data.id = $scope.videoId;
            }
            
            console.log('submitting', data);
            
            $http({ method: 'POST', url: '/api/videos', data: data })
            .success(function (result) {
                console.log('result', result);
                info('video ' + result.videoId + ($scope.videoId == defaultId ? ' created' : ' modified') + ' successfully');
                $scope.videoId = result.videoId;
            })
            .error(function (err) {
                console.error(err);
                error(err.error.message);
            });
        }
        
        
        $scope.submitVideo = function() {
            clearMessages();
            
            var form = document.getElementById('uploadVideoForm');

            var formData = new FormData(form);
                        
            $.ajax({
                url: '/api/videos/' + $scope.videoId,
                type: 'POST',
                data: formData,
                //async: false,
                cache: false,
                contentType: false,
                processData: false,
                success: function (result) {
                    $scope.$apply(function () { 
                        console.log('video uploaded successfully');
                        info('video uploaded successfully');
                    });
                },
                error: function (err) {
                    $scope.$apply(function () { 
                        console.error('error uploading video', err);
                        error('error uploading video ' + err.message);
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

        function error(err) {
            $scope.error = err;
        }
        
        function info(msg) {
            $scope.info = msg;
        }
        
        function clearMessages() {
            $scope.error = '';
            $scope.info = '';
        }
       
    }])

    .controller('UsersController', ['$scope', '$route', 'state', '$http', '$location', '$routeParams', function ($scope, $route, state, $http, $location, $routeParams) {
    var users = [];

    $http({ method: 'GET', url: '/api/users' })
        .success(function (result) {
            users = $scope.users = result.users;
        });

    $scope.edit = function (id) {
        $location.path('/users/' + id);
    }

}]);