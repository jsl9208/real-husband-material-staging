var cnt_cast; //the number of casting role added by user

/*
 * logout this app and facebook
 */
function logout() {
	FB.logout(function(response) {
		console.log(response);
		$('#choose-cast').addClass('hide');
		$('#friend-list').empty();
		$('#my-avatar').attr("src", "");
		$('.cast-role').empty();

		$('#login').removeClass('hide');
	});
}

/*
 * get the avatar of the user
 */
function getMyInfo() {
	FB.api('/me/picture?type=large', function(response) {
		$('#my-avatar').attr('src', response.data.url);
	});

	FB.api('/me', function(response) {
		$('#my-avatar').attr('title', response.name);
	})
}

/*
 * get the friend list of the user and show it on the page
 */
function getFriendLists() {
	FB.api('/me/taggable_friends?fields=name,picture.width(100).height(100)', function(response) {
		//console.log(response);
		var friendsArr = response['data'];
		var tpl = Handlebars.compile($('#friend-template').html());
		var list = $('#friend-list');

		$.each(friendsArr, function(index, val) {
			var id = val.id;
			var name = val.name.trim();
			var avatar = val.picture.data.url;

			list.append(tpl({id:id, name: name, avatar:avatar, no:index}));
		});

		cnt_cast = 0;
		addCastRole();
		addSearch();
		
		$('#friend-list').mCustomScrollbar({
			theme: '3d-thick',
			scrollButtons: {enable:true}
		});
	});
}

/*
 * add a cast role when the user selects a friend
 */
function addCastRole() {
	$('.friend input[type=checkbox]').on('click', function(e) {
		var checked = $(this).prop('checked') == false;
		var imgsrc = $(this).closest('.friend').find('.avatar img').attr('src');
		var name = $(this).closest('.friend').find('.name').text();

		if (!checked && cnt_cast < 4) {
			$('.cast-role').eq(cnt_cast+1).html('<img src="' + imgsrc + '" title="' + name.trim() + '">');

			cnt_cast++;
			if (cnt_cast == 4) {
				$('.friend input[type=checkbox]').each(function(e) {
					if ($(this).prop('checked') == false) {
						$(this).prop('disabled', true).addClass('disabled');
					}
				}) ;
			}
		} else if (checked && cnt_cast <= 4) {
			$('.cast-role').each(function(index) {
				if (index >= 1 && $(this).find('img').attr('src') == imgsrc) {
					$(this).html('<div class="placeholder"></div>');
					$('#cast-list').append($(this).detach());
				}
			});

			$('.cast-role').each(function(index) {
				if (index >= 1) {
					if ($(this).find('img').length == 0) {
						var text = 'costar ' + index;
						if (index <= 2) {
							text += '*';
						}

						$(this).find('.placeholder').text(text);
					}

					if (index <= 2) {
						$(this).removeClass('optional');
					} else {
						$(this).addClass('optional');
					}
				}
			});

			cnt_cast--;
			$('.friend input[type=checkbox]').prop('disabled', false).removeClass('disabled');
		}

	});
}

/*
 * the search function filtering friends by name
 */
function addSearch() {
	$('#search-friends').keyup(function() {
		var val = $(this).val().toLowerCase();

		$('.friend').each(function(index) {
			var name = $(this).find('.name').text().toLowerCase();
			if (name.indexOf(val) >= 0) {
				$(this).removeClass('hide');
			} else {
				$(this).addClass('hide');
			}
		});
	});
}

function showPosters(urls) {
	console.log('show posters');

	$('#btn-submit').removeClass('active');
	$('#submit-error').html('');
	$('#choose-cast').addClass('hide');
	$('#display-poster').removeClass('hide');
	$('#poster-1').attr('src', urls[0]);
	$('#poster-2').attr('src', urls[1]);
	$('#poster-3').attr('src', urls[2]);

	$('#btn-changeCast').click(function(e) {
		console.log('btn-changeCast');
		$('#display-poster').addClass('hide');
		$('#choose-cast').removeClass('hide');
		$('#poster-1').attr('src', '');
	});

	$('#btn-saveAndShare').click(function(e) {
		clearEventsForSharePage();
		showSharePage(urls);
	});

	$('#select-display').on('change', function(e) {
		var val = $(this).find('option:selected').val();

		console.log(val);

		if (val == 1) {
			$('#poster-1').removeClass('hide');
			$('#poster-2').addClass('hide');
			$('#poster-3').addClass('hide');
		} else if (val == 2) {
			$('#poster-1').addClass('hide');
			$('#poster-2').removeClass('hide');
			$('#poster-3').addClass('hide');
		} else {
			$('#poster-1').addClass('hide');
			$('#poster-2').addClass('hide');
			$('#poster-3').removeClass('hide');
		}
	});
}

function clearEventsForSharePage() {
	$('#btn-download').off('click');
	$('#btn-shareToTwitter').off('click');
	$('#btn-shareToFacebook').off('click');
	$('#btn-startover').off('click');
}

function shareToFaceBook() {
	var imageUrl = $('#shareItem-1').attr('src');

	FB.ui({
		method: 'feed',
		link: 'http://www.baidu.com',
		name: 'Test Facebook App',
		picture: imageUrl,
		description: 'Epik High ZZang!!!'
	});
}

function shareToTwitter() {
	var imageUrl = $('#shareItem-1').attr('src');

	// common social content
	var social = {
		title: 'My Facebook App',
		copy: 'If Tom Watson picks these 3 as his #MyCaptainsPicks I could win a trip for 2 to the 2014 Ryder Cup. Visit www.mycaptainspicks.com to enter.',
		link: 'http://www.baidu.com',
		image: imageUrl
	};

	var id = social.image.split('facebook_')[1].split('.png')[0];

	// shorten the URL
	var url = 'https://api-ssl.bitly.com/v3/shorten'
		  + '?apiKey=R_8a718cfc248cafe5a31231c9f5df7c4f'
		  + '&login=movementdev'
		  + '&uri=' + social.link + '/showImage?img=' + id;

	$.ajax({
		type: 'GET',
		url: url,
		dataType: 'jsonp',
		success: function(response, textStatus, jqXHR) {
			var bitly = response.data.url;
			var copy = '> <: ';
			copy += bitly;
			copy += ' Beast ZZang!!!';
			var twitterURL = 'https://twitter.com/share?url=' + encodeURIComponent(social.link) + '&text=' + encodeURIComponent(copy);
			window.open(twitterURL, social.title, 'width=450,height=450');
		}
	});

}

function showSharePage(urls) {
	$('#display-poster').addClass('hide');
	$('#share-posters').removeClass('hide');
	$('#shareItem-1').attr('src', urls[0]);

	$('#btn-shareToTwitter').click(function(e) {
		console.log('I want to share to twitter');
		shareToTwitter();
	});

	$('#btn-shareToFacebook').click(function(e) {
		console.log('I want to share to Facebook');
		shareToFaceBook();
	});

	$('#btn-startover').click(function(e) {
		$('#share-posters').addClass('hide');
		$('#poster-1').attr('src', '');
		$('#shareItem-1').attr('src', '');

		clearCastRoles();
		$('#choose-cast').removeClass('hide');
	});

	$('#btn-download').click(function(e) {
		window.open($('#shareItem-1').attr('src'));
	});
}

function clearCastRoles() {
	$('.cast-role').each(function(index) {
		if (index >= 1) {
			$(this).html('<div class="placeholder"></div>');
		}
	});

	$('.cast-role').each(function(index) {
		if (index >= 1) {
			if ($(this).find('img').length == 0) {
				var text = 'costar ' + index;
				if (index <= 2) {
					text += '*';
				}

				$(this).find('.placeholder').text(text);
			}

			if (index <= 2) {
				$(this).removeClass('optional');
			} else {
				$(this).addClass('optional');
			}
		}
	});

	$('.friend input[type=checkbox]').prop('checked', false).prop('disabled', false).removeClass('disabled');
	cnt_cast = 0;
}

function sendImageData(arr) {
	$.post('/combinetest', 
		{cast_role: arr}, 
		function(response) {
			if (response.success) {
				console.log(response);
				showPosters(response.urls);
			}
		});
}

function checkSubmit() {
	var yes = $('#condition-check').prop('checked');
	var friend_cnt = $('.cast-role img').length - 1;
	var $error = $('#submit-error');

	if (yes && friend_cnt >= 2) {
		$('#btn-submit').addClass('active');
		$error.html('Processing posters <i class="icon-spinner icon-spin"></i>');
		return true;
	} else if (yes) {
		$error.text('*Please select at least 2 friends.');
	} else if (friend_cnt >= 2) {
		$error.text('*Please agree with the terms.');
	} else {
		$error.text('*Please select at least 2 friends and agree with the terms');
	}

	return false;
}

function bindSubmitToSend() {
	$('#btn-submit').click(function(e) {
		if (checkSubmit()) {
			var imageData = [];
			$('.cast-role').each(function(index) {
				var url = $(this).find('img').attr('src');
				var name = $(this).find('img').attr('title');

				imageData.push({url: url, name: name});
			});

			sendImageData(imageData);
		}
	});
}
/*
 * work according to the user status
 */
function statusChangeCallback(response) {
	if (response.status === 'connected') {
	  // Logged into your app and Facebook.
	  $('#login').addClass('hide');
	  $('#choose-cast').removeClass('hide');

	  getMyInfo();
	  getFriendLists();
	  bindSubmitToSend();
	} else if (response.status === 'not_authorized') {
	  // The person is logged into Facebook, but not your app.
	  $('#login').removeClass('hide');
	} else {
	  // The person is not logged into Facebook, so we're not sure if
	  // they are logged into this app or not.
	  $('#login').removeClass('hide');
	}
}

// This function is called when someone finishes with the Login
// Button.  See the onlogin handler attached to it in the sample
// code below.
function checkLoginState() {
	FB.getLoginStatus(function(response) {
	  statusChangeCallback(response);
	});
}
