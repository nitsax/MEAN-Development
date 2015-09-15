var app=angular.module('flapperNews', ['ui.router'])

app.factory('postService', ['$http', function($http) {
	var service = {
		posts: []
	};

	service.getAll = function() {
		return $http.get('/posts').success(function(data) {
			angular.copy(data, service.posts);
		});
	};

	service.create = function(post) {
		return $http.post('/posts', post).success(function(data) {
			service.posts.push(data);
		});
	};

	service.upvote = function(post) {
		return $http.put('/posts/' + post._id + '/upvote')
			.success(function(data) {
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
		return $http.post('/posts/' + id + '/comments', comment);
	};

	service.upvoteComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote')
			.success(function(data) {
				comment.upvotes += 1;
			});
	};

	return service;
}]);

app.controller('MainCtrl', [
	'$scope',
	'postService',
	function($scope, postService) {
		$scope.posts = postService.posts;
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
function($scope, postService, post) {
	$scope.post = post;
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
	});
		
	$urlRouterProvider.otherwise('home');
}]);