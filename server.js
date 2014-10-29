var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var https = require('https');
var port = process.env.PORT || 3000;
var fs = require('fs');
var request = require('request');
var path = require('path');
var lwip = require('lwip');
var aws = require('aws-sdk');
var gm = require('gm');

/*********************
 * app configuration *
 *********************/
app.use(express.static(__dirname + '/')); //set '/' as the root of files
app.use(bodyParser.urlencoded({extend: false}));
app.set('view engine', 'ejs'); //use ejs as the views

/* aws configuration */
aws.config.loadFromPath('config.json');
var s3 = new aws.S3();

/************************
 * customized functions *
 ************************/
var downloadFile = function (arr, currentId, callback) {
	if (currentId == arr.length) {
		callback();
		return;
	}

	var file = fs.createWriteStream(arr[currentId].path);
	var req = https.get(arr[currentId].url, function (res) {
		res.pipe(file);
	});

	file.on('close', function() {
		downloadFile(arr, currentId + 1, callback);
	});
}

var downloadFiles = function (arr, callback) {
	downloadFile(arr, 0, function() {
		callback();
	});
}

var removeFile = function(filepath) {
	fs.unlink(filepath, function(err) {
		if (err) throw err;
		console.log('remove ' + filepath);
	});				
}

var removeFilesWithPrefix = function(dir, prefix) {
	console.log('I am removing the files!');

	fs.readdir(dir, function(err, files) {
		if (err) throw err;

		files.forEach(function(elem, index, arr) {
			if (elem.trim().indexOf(prefix) == 0) {
				removeFile(dir + elem);
			}
		});
	})
}

var uploadGeneratedImages = function(filepath, filename, callback) {
	var prefix = 'facebook';

	var options = {
		Bucket: 'mvmt-clients',
		Key: 'mycaptainspicks/' + prefix + filename,
		Body: fs.createReadStream(filepath),
		ACL: 'public-read'
	};

	console.log('uploading images');

	s3.putObject(options, function(err, data) {
		if (err) {
			console.log('Error in putObject:');
			console.log(err);
		} else {
			console.log('finish putting object');

			var imageUrl = 'http://cdn.mvmt.io/mycaptainspicks/' + prefix + filename;
			callback(imageUrl);
		}
	});
}

var drawArr = function(gm_image, type, x, y, textArr, cnt, step, callback) {
	var new_x = x, new_y = y;
	var len = textArr.length;
	var font, font_size;
	if (type == 1) {
		font = 'Bangers.ttf';
		font_size = 70;
		new_y = y + (5 - len)*step;
	}
	else if (type == 2) {
		font = 'AlfaSlabOne.ttf';
		font_size = 30;
	}
	else if (type == 3) {
		font = 'OpenSans.ttf';
		font_size = 60;
	}
	gm_image.font('font/' + font, font_size);
	for(var i = 0; i < cnt; ++i) {
		var text = textArr[i];
		var new_x;
		if (type == 1) new_x = x;
		else if (type == 2)new_x = x - (text.length-1/2)/2*font_size;
		else if (type == 3) new_x = x - (text.length-1/2)/2*font_size/2;
		if (type == 1) {
			if (i != len-1) gm_image.fill('black').drawText(new_x-2, new_y-2, text).fill('white').drawText(new_x, new_y, text);
			else gm_image.fill('black').drawText(new_x-2+100, new_y-2, text).fill('white').drawText(new_x+100, new_y, text);
		}
		else if (type == 2) gm_image.fill('#B1236A').drawText(new_x, new_y, text);
		else if (type == 3) gm_image.fill('black').drawText(new_x-2, new_y-2, text).fill('white').drawText(new_x, new_y, text);
		new_y = Number(new_y) + step;
	}
	callback(gm_image);
}
var pasteImageToBackground = function(bgImage, imageArr, currentId, cnt, type, callback) {
	if (currentId == cnt) {
		var timestamp = Date.parse(new Date());
		var rand = Math.ceil(Math.random()*10000);
		var prefix = imageArr[0].prefix;
		var filename = '_' + timestamp + '_' + rand + '.jpg';
		var dir = 'tmp/';

		bgImage.writeFile(dir + prefix + filename, function(err) {
			if (err) throw err;
		
			uploadGeneratedImages(dir + prefix + filename, filename, function(url) {
				callback(url);
			});
		});
		return;
	}
  else {
  	var imgSrc = imageArr[currentId].path;
		if (type == 1) {
			var width = 240;
			lwip.open(imgSrc, function (err, image) {
				if (err) throw err;

				image.resize(width, width, function (err, image) {
					if (err) throw err;

					bgImage.paste(15 + currentId*(width + 25), 1735, image, function (err, image) {
						if (err) throw err;
						pasteImageToBackground(image, imageArr, currentId + 1, cnt, type, callback);
					});
				});
			});
		}
		else if (type == 2) {
			lwip.open(imgSrc, function (err, image) {
				if (err) throw err;
				var width = 240, x = 0, y = 0;
				switch(currentId) {
					case 0:
						width = 202;
						x = 70, y = 1181;
						break;
					case 1:
						width = 162;
						x = 808, y = 1211;
						break;
					case 2:
						width = 160;
						x = 1094, y = 1552;
						break;
					case 3:
						width = 164;
						x = 616, y = 993; 
						break;
					case 4:
						width = 164;
						x = 330, y = 930;
						break;
				}
				image.resize(width, width, function (err, image) {
					if (err) throw err;

					bgImage.paste(x, y, image, function (err, image) {
						if (err) throw err;
						pasteImageToBackground(image, imageArr, currentId + 1, cnt, type, callback);
					});
				});
			});
		}
		else if (type == 3) {
			var width = 185;
			lwip.open(imgSrc, function (err, image) {
				if (err) throw err;

				image.resize(width, width, function (err, image) {
					if (err) throw err;

					bgImage.paste(154 + currentId*(width + 28), 61, image, function (err, image) {
						if (err) throw err;
						pasteImageToBackground(image, imageArr, currentId + 1, cnt, type, callback);
					});
				});
			});
		}
	}
}
var combineImages = function (arr, id, names, callback) {
	var cnt = arr.length;
	var currentId = 0;

	console.log('combining image ' + id);
	var timestamp = Date.parse(new Date());
	var rand = Math.ceil(Math.random()*10000);
	var filename = timestamp + '_' + rand + '.jpg';
	var dir = 'tmp/';
	var path = dir + filename;
	var x, y, step;
	if (id == 1) {
		x = 55, y = 480, step = 90;
	} else if (id == 2) {
		x = 330, y = 1535, step = 40;
	} else if (id == 3) {
		x = 675, y = 1600, step = 80;
	}
	drawArr(gm('bg-images/bg-' + id + '.jpg'), id, x, y, names, cnt, step, function(gm_image) {
		gm_image.write(path, function(err) {
			if (!err) {
				lwip.open(path, function (err, bgImage) {
					if (err) throw err;
					pasteImageToBackground(bgImage, arr, currentId, cnt, id, callback);
				});
			}
			else console.log(err);
		});
	});
}

var processData = function (dir, arr) {
	var names = [];
	var rtarr = [];
	var timestamp = Date.parse(new Date());
	var rand = Math.ceil(Math.random()*10000);
	var prefix = timestamp +  '_' + rand + '_';
	var postfix = '.jpg';

	/* friends image data */
	arr.forEach(function(elem, index, arr) {
		rtarr[index] = {path: dir + prefix + elem.name.trim().split(' ').join('') + postfix, url: elem.url, name: elem.name};
		names[index] = elem.name;
	});

	return [rtarr, names];
}

/***********
 * rounter *
 ***********/
app.get('/', function (req, res) {
	res.render('index');
});

app.post('/combine', function (req, res) {
	if (!req.body) return res.sendStatus(400);

	var dataReceived = req.body;
	var data = dataReceived.cast_role;
	// console.log(data);
	var ret = processData('tmp/', data); //process image array for combination function
	var imageData =  ret[0];
	var names = ret[1];
	/* download user and friend images */
	downloadFiles(imageData, function() {
		/* combine images after download */
		combineImages(imageData, 1, names, function(imageUrl1) {
			combineImages(imageData, 2, names, function(imageUrl2) {
				combineImages(imageData, 3, names, function(imageUrl3) {
					var prefix = imageData[0].prefix;
					/* remove the src images after the ouput image is generated */
					removeFilesWithPrefix('tmp/', prefix);

					console.log(imageUrl1);
					console.log(imageUrl2);
					console.log(imageUrl3);
					res.send({success: true, urls: [imageUrl1, imageUrl2, imageUrl3]});
				})
			})
		});
		
	}); 

});


app.listen(port);
// // type-3
// drawArr(gm('bg-images/bg-3.jpg'), 3, 675, 1600, names, 80, function(gm_image) {
// 	gm_image.write('tmp/tmp3.jpg', function(err) {
// 		if (!err) {						
// 			lwip.open('tmp/tmp3.jpg', function (err, bgImage) {
// 				if (err) throw err;
// 				pastePhotos(3, 1, bgImage);
// 			});
// 		}
// 		else console.log(err);
// 	});
// });

// // type-2
// drawArr(gm('bg-images/bg-2.jpg'), 2, 330, 1535, names, 40, function(gm_image) {
// 	gm_image.write('tmp/tmp2.jpg', function(err) {
// 		if (!err) {	
// 			lwip.open('tmp/tmp2.jpg', function (err, bgImage) {
// 				if (err) throw err;
// 				pastePhotos(2, 1, bgImage);
// 			});
// 		}
// 		else console.log(err);
// 	});
// });

// //type-1
// drawArr(gm('bg-images/bg-1.jpg'), 1, 55, 480, names, 90, function(gm_image) {
// 	gm_image.write('tmp/tmp1.jpg', function(err) {
// 		if (!err) {
// 			lwip.open('tmp/tmp1.jpg', function (err, bgImage) {
// 				if (err) throw err;
// 				pastePhotos(1, 1, bgImage);
// 			});
// 		}
// 		else console.log(err);
// 	});
// });