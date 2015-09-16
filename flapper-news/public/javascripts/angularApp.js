var app=angular.module('flapperNews', ['ui.router'])

app.factory('auth', ['$http', '$window', function($http, $window) {
	var auth = {};

	auth.saveToken = function(token) {
		$window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function() {
		return $window.localStorage['flapper-news-token'];
	};

	auth.isLoggedIn = function() {
		var token = auth.getToken();

		if(token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function() {
		if(auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function(user) {
		return $http.post('/register', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logIn = function(user) {
		return $http.post('/login', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function() {
		$window.localStorage.removeItem('flapper-news-token');
	};

	return auth;
}])

app.factory('postService', ['$http', 'auth', function($http, auth) {
	var service = {
		posts: []
	};

	service.getAll = function() {
		return $http.get('/posts').success(function(data) {
			angular.copy(data, service.posts);
		});
	};

	service.create = function(post) {
		return $http.post('/posts', post, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		}).success(function(data) {
			service.posts.push(data);
		});
	};

	service.upvote = function(post) {
		return $http.put('/posts/' + post._id + '/upvote', null, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		}).success(function(data) {
				post.upvotes += 1;
			});
	};

	service.get = function(id) {
		return $http.get('/posts/' + id)
			.then(function(res) {
				return res.data;
			})
	};

	service.addComment = function(id, comment) { 
		return $http.post('/posts/' + id + '/comments', comment, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		});
	};

	service.upvoteComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		}).success(function(data) {
				comment.upvotes += 1;
		});
	};

	return service;
}]);

app.controller('MainCtrl', [
	'$scope',
	'postService',
	'auth',
	function($scope, postService, auth) {
		$scope.posts = postService.posts;
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.addPost = function() {
			if(!$scope.title || $scope.title == '') {	return;	}
			postService.create({
				title: $scope.title, 
				link: $scope.link,
			});
			$scope.title = '';
			$scope.link = '';
		};

		$scope.incrementUpvotes = function(post) {
			postService.upvote(post);
		};
	}]);

app.controller('PostsCtrl', [
'$scope',
'postService',
'post',
'auth',
function($scope, postService, post, auth) {
	$scope.post = post;
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.addComment = function() {
		if($scope.body === '') { return; }
		postService.addComment(post._id, {
			body: $scope.body,
			author: $scope.author
		}).success(function(comment) {
			$scope.post.comments.push(comment);
		});
		$scope.body = '';
		$scope.author = '';
	};

	$scope.incrementUpvotes = function(comment) {
		postService.upvoteComment(post, comment);
	};
}]);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
  $stateProvider
	.state('home', {
      url: '/home',
	  templateUrl: '/home.html',
	  controller: 'MainCtrl',
	  resolve: {
	  	postPromise: ['postService', function(postService) {
	  		return postService.getAll();
	  	}]
	  }
	})
	.state('posts', {
	  url: '/posts/{id}',
	  templateUrl: '/posts.html',
	  controller: 'PostsCtrl',
	  resolve: {
	  	post: ['$stateParams', 'postService', function($stateParams, postService) {
	  		return postService.get($stateParams.id);
	  	}]
	  }
	})
	.state('register', {
		url: '/register',
		templateUrl: '/register.html',
		controller: 'AuthCtrl',
		onEnter: ['$state', 'auth', function($state, auth) {
			if(auth.isLoggedIn()) {
				$state.go('home');
			}
		}]
	})
	.state('login', {
		url: '/login',
		templateUrl: '/login.html',
		controller: 'AuthCtrl',
		onEnter: ['$state', 'auth', function($state, auth) {
			if(auth.isLoggedIn()) {
				$state.go('home');
			}
		}]
	});
		
	$urlRouterProvider.otherwise('home');
}]);

app.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth) {
		$scope.user = {};

		$scope.register = function() {
			auth.register($scope.user).error(function(error) {
				$scope.error = error;
			}).then(function() {
				$state.go('home');
			});
		};

		$scope.logIn = function() {
			auth.logIn($scope.user).error(function(error) {
				$scope.error = error;
			}).then(function() {
				$state.go('home');
			});
		};
}])

app.controller('NavCtrl', [
	'$scope',
	'auth',
	function($scope, auth) { 
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logout = auth.logOut;
}]);