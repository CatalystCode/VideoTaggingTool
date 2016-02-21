
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
        regionTypes: { values: ['Rectangle', 'Point'], default: 'Rectangle' },
        multiRegions: { values: [{ id: '0', name: 'False' }, { id: '1', name: 'True' }], default: '1' },
        regionSizes: { values: Array.apply(null, Array(100)).map(function (item, i) { return i + 1 }), default: 20 }
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
                if(!user.Authorized) {
                    console.warn('user authenticated but is not authorized to use the system');
                    return $location.path('/#/');
                }
            $rootScope.user = user;
        })
        .error(function (err, statusCode){
            if(statusCode == 401) {
                console.warn('user is not logged in');
            }
            else {
                console.error(err);
            }

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
        var defaultId = -1;
        $scope.jobId = defaultId;

        $scope.regiontype = $scope.jobSetup.regionTypes.default;
        $scope.multiregions = $scope.jobSetup.multiRegions.default;
        $scope.regionsize = $scope.jobSetup.regionSizes.default;
        $scope.selectedStatus = { Id: $scope.jobStatuses['Active'] };

        if ($routeParams.id != 0) {
            $scope.ajaxStart();
            $http({ method: 'GET', url: '/api/jobs/' + $routeParams.id })
            .success(function (result) {
                console.log('jobData', result);
                $scope.jobId = result.job.Id;
                $scope.selectedVideo = result.video;
                $scope.selectedUser = result.user;
                $scope.selectedStatus = { Id: result.job.StatusId };
                console.log(' $scope.selectedStatus', $scope.selectedStatus);
                $scope.description = result.job.Description;
                
                $scope.config = result.job.Config;
                $scope.regiontype = result.job.Config.regiontype;
                $scope.multiregions = result.job.Config.multiregions;
                $scope.regionsize = result.job.Config.regionsize;

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
            if(!$scope.regiontype) return $scope.showError('regiontype was not provided');
            if(!$scope.multiregions) return $scope.showError('multiregions was not provided');
            if(!$scope.regionsize) return $scope.showError('regionsize was not provided');

            var data = {
                videoId: $scope.selectedVideo.Id,
                userId: $scope.selectedUser && $scope.selectedUser.Id,
                description: $scope.description,
                statusId: $scope.selectedStatus.Id,
                configJson: {
                    regiontype: $scope.regiontype,
                    multiregions: $scope.multiregions,
                    regionsize: $scope.regionsize,
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
                    $scope.showError(err.message);
                    $scope.ajaxCompleted();
            });
        }
    }])

.controller('UpsertUserController', ['$scope', '$http', '$location', '$routeParams', function ($scope, $http, $location, $routeParams) {

        $scope.clearMessages();
        var defaultId = -1;
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
                $scope.showError(err.message);
                $scope.ajaxCompleted();
            });
        }
    }])
    

.controller('VideosController', ['$scope', '$route', '$http', '$location', '$routeParams', function ($scope, $route, $http, $location, $routeParams) {

        $scope.btnAllOrUnassigned = 0;
        getVideos();

        $scope.ajaxStart();
        $http({ method: 'GET', url: '/api/labels' })
        .success(function (result) {
            $scope.labels = result.labels;
        });

        function getVideos() {

            var selectedFilters =  $("input:checkbox[name=filterLabel]:checked").map(function(){
                return $(this).val();
            }).toArray();

            console.log('selected filters:', selectedFilters);
            var filter = selectedFilters.join(',');

            var url = '/api/videos';
            if (filter)
                url += "?filter=" + filter + '&unassigned=' + $scope.btnAllOrUnassigned;
            else
                url += '?unassigned=' + $scope.btnAllOrUnassigned;

            $scope.ajaxStart();
            $http({ method: 'GET', url: url })
                .success(function (result) {
                    $scope.videos = result.videos;
                    angular.forEach($scope.videos, function (video) {
                        video.Labels = video.Labels && video.Labels.split(',');
                    })
                    $scope.ajaxCompleted();
                });
        }

        $scope.filterFetch = function(mode) {
            $scope.btnAllOrUnassigned = mode;
            getVideos();
        }

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

        $scope.download = function () {
            var videoId = this.video.Id;
            var url = '/api/videos/' + videoId + '/frames';
            window.open(url, '_blank');
        }

        $scope.filter = function() {
            getVideos();
        }
    }])

.controller('TagJobController', ['$scope', '$route', '$http', '$location', '$routeParams', '$timeout', 'state', function ($scope, $route, $http, $location, $routeParams, $timeout, state) {

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

                videoCtrl.regiontype = jobData.job.Config.regiontype;
                videoCtrl.multiregions = jobData.job.Config.multiregions;
                videoCtrl.regionsize = jobData.job.Config.regionsize;

                videoCtrl.inputtagsarray = jobData.job.Config.tags;

                $http({ method: 'GET', url: '/api/jobs/' + $routeParams.id + '/frames' })
                    .success(function (result) {
                        videoCtrl.inputframes = result.frames;
                        console.log(videoCtrl.inputframes)
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
            console.log('handler called');
            var inputObject = e.detail.frame;
            var msg = {};
            msg.tags = inputObject.regions;
            $http({ method: 'POST', url: '/api/jobs/' + jobId + '/frames/' + inputObject.frameIndex, data: msg })
            .success(function (result) {
                    console.log('frame saved successfully');
                    $scope.clearMessages();
            })
            .error(function (err) {
                console.error('error', err);
                $scope.showError('error saving frame: ' + err.message || '');
            });
        }

        videoCtrl.addEventListener('onregionchanged', tagHandler);

        $scope.$on('$destroy', function() {
            videoCtrl.removeEventListener('onregionchanged', tagHandler);
        })
    }])

.controller('UpsertVideoController', ['$scope', '$http', '$location', '$routeParams', function ($scope, $http, $location, $routeParams) {
        
        var defaultId = -1;

        $scope.videoId = defaultId;
        $scope.config = '{}';
        $scope.progress = null;

        function getLabels(cb) {
            var labels = [];
            $http({ method: 'GET', url: '/api/labels' })
                .success(function (result) {
                    angular.forEach(
                        result.labels,
                        function(label) {
                            label.value = label.Name;
                            labels.push(label);
                        });
                    return cb(labels);
                });
        }

        function initTokenField(labels) {
            $('#tokenfield').tokenfield({
                autocomplete: {
                    source: labels,
                    delay: 100
                },
                showAutocompleteOnFocus: true
            });
        }


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
                $scope.videoUploaded = video.VideoUploaded;
                $scope.videoLabels = video.Labels;

                getLabels(function(labels){
                    initTokenField(labels);
                });

                $scope.ajaxCompleted();
            });
        }
        else {
            getLabels(function(labels){
                initTokenField(labels);
            });
        }

        $scope.submit = function () {
            
            $scope.clearMessages();

            if(!$scope.name) return $scope.showError('name was not provided');
            if(!$scope.height) return $scope.showError('height was not provided');
            if(!$scope.width) return $scope.showError('width was not provided');
            if(!$scope.duration) return $scope.showError('duration was not provided');
            if(!$scope.framesPerSecond) return $scope.showError('framesPerSecond was not provided');

            var labels = $('#tokenfield').tokenfield('getTokens').map(function(label) {return label.value;});

            // First add the video to the database
            var data = {
                name: $scope.name,
                height: $scope.height,
                width: $scope.width,
                durationSeconds: $scope.duration,
                framesPerSecond: $scope.framesPerSecond,
                labels: labels
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
                    $scope.showError(err.message);
                    $scope.ajaxCompleted();
            });
        }
        
        
        $scope.submitVideo = function () {
          $scope.clearMessages();
          var file = document.getElementById('inputFile').files[0];

          $.get('/api/videos/' + $scope.videoId + '/url')
            .success(function (result) {
              console.log('url', result);
              uploadImage(result.url);
            })
            .error(function (err) {
              console.error('error getting blob Url', err);
            });

          function uploadImage(url) {

            var maxBlockSize = 256 * 1024; //Each file will be split in 256 KB.
            var numberOfBlocks = 1;
            var selectedFile = file;
            var currentFilePointer = 0;
            var totalBytesRemaining = 0;
            var blockIds = new Array();
            var blockIdPrefix = "block-";
            var submitUri = url;
            var bytesUploaded = 0;

            var fileSize = selectedFile.size;
            if (fileSize < maxBlockSize) {
              maxBlockSize = fileSize;
              console.log("max block size = " + maxBlockSize);
            }
            totalBytesRemaining = fileSize;
            if (fileSize % maxBlockSize == 0) {
              numberOfBlocks = fileSize / maxBlockSize;
            } else {
              numberOfBlocks = parseInt(fileSize / maxBlockSize, 10) + 1;
            }

            console.log("total blocks = " + numberOfBlocks);
            console.log(submitUri);

            var reader = new FileReader();

            reader.onloadend = function (evt) {
              if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                var uri = submitUri + '&comp=block&blockid=' + blockIds[blockIds.length - 1];
                var requestData = new Uint8Array(evt.target.result);
                $.ajax({
                  url: uri,
                  type: "PUT",
                  data: requestData,
                  processData: false,
                  beforeSend: function (xhr) {
                    xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
                  },
                  success: function (data, status) {
                    console.log(data);
                    console.log(status);
                    bytesUploaded += requestData.length;
                    var percentComplete = ((parseFloat(bytesUploaded) / parseFloat(selectedFile.size)) * 100).toFixed(2);
                    updateProgress(percentComplete);
                    console.log(percentComplete + " %");
                    uploadFileInBlocks();
                  },
                  error: function (xhr, desc, err) {
                    console.log(desc);
                    console.log(err);
                  }
                });
              }
            };

            uploadFileInBlocks();
            function uploadFileInBlocks() {
              if (totalBytesRemaining > 0) {
                console.log("current file pointer = " + currentFilePointer + " bytes read = " + maxBlockSize);
                var fileContent = selectedFile.slice(currentFilePointer, currentFilePointer + maxBlockSize);
                var blockId = blockIdPrefix + pad(blockIds.length, 6);
                console.log("block id = " + blockId);
                blockIds.push(btoa(blockId));
                reader.readAsArrayBuffer(fileContent);
                currentFilePointer += maxBlockSize;
                totalBytesRemaining -= maxBlockSize;
                if (totalBytesRemaining < maxBlockSize) {
                  maxBlockSize = totalBytesRemaining;
                }
              } else {
                commitBlockList();
              }
            }

            function commitBlockList() {
              var uri = submitUri + '&comp=blocklist';
              console.log(uri);
              var requestBody = '<?xml version="1.0" encoding="utf-8"?><BlockList>';
              for (var i = 0; i < blockIds.length; i++) {
                requestBody += '<Latest>' + blockIds[i] + '</Latest>';
              }
              requestBody += '</BlockList>';
              console.log(requestBody);
              $.ajax({
                url: uri,
                type: "PUT",
                data: requestBody,
                beforeSend: function (xhr) {
                  xhr.setRequestHeader('x-ms-blob-content-type', selectedFile.type);
                },
                success: function (data, status) {
                  console.log(data);
                  console.log(status);
                  updateVideoAsLoaded();
                },
                error: function (xhr, desc, err) {
                  console.log(desc);
                  console.log(err);
                }
              });
            }
            function pad(number, length) {
              var str = '' + number;
              while (str.length < length) {
                str = '0' + str;
              }
              return str;
            }

            function updateProgress(progress) {
              $scope.$apply(function () {
                console.log('got progress', progress);

                $scope.progress = progress;
                if (progress == 100) {
                  setTimeout(function () {
                    $scope.$apply(function () {
                      $scope.progress = null;
                    });
                  }, 3000);
                }
              });
            }

            function updateVideoAsLoaded() {
              $.ajax({
                url: '/api/videos/' + $scope.videoId,
                type: "POST",
                success: function (data, status) {
                  console.log('upload success!!!')
                },
                error: function (xhr, desc, err) {
                  console.log(desc);
                  console.log(err);
                }
              });
            }
          }
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