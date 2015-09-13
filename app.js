var app=angular.module('flapperNews', ['ui.router'])

app.factory('postService', [function() {
	var service = {
		posts: []
	};

	return service;
}]);

app.controller('MainCtrl', [
	'$scope',
	'postService',
	function($scope, postService) {
		$scope.posts = postService.posts;
		$scope.addPost = function() {
			if(!$scope.title || $scope.title=='')
			{
				return;
			}
			$scope.posts.push({
				title: $scope.title, 
				link: $scope.link,
				upvotes: 0,
				comments: [
					{author: 'Joe', body: 'Cool post!', upvotes: 0},
					{author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
				]
			});
			$scope.title = '';
			$scope.link = '';
		};

		$scope.incrementUpvotes = function(post) {
			post.upvotes +=1;
		};
	}]);

app.controller('PostsCtrl', [
'$scope',
'$stateParams',
'postService',
function($scope, $stateParams, postService) {
	$scope.post = postService.posts[$stateParams.id];
	$scope.addComment = function() {
		if($scope.body === '') { return; }
		$scope.post.comments.push({
			body: $scope.body,
			author: $scope.author,
			upvotes: 0 
		});
		$scope.body = '';
		$scope.author = '';
	};

	$scope.incrementUpvotes = function(comment) {
		comment.upvotes +=1;
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
	  controller: 'MainCtrl'
	})
	.state('posts', {
	  url: '/posts/{id}',
	  templateUrl: '/posts.html',
	  controller: 'PostsCtrl'
	});
		
	$urlRouterProvider.otherwise('home');
}]);