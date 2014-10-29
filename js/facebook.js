var Facebook = (function (FB) {
	checkLoginState: function() {
		FB.getLoginStatus(function(res) {
			console.log(res);
		})
	}
})(FB);