var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(__dirname+'/public'));


//크로스도메인 이슈 대응 (CORS)
var cors = require('cors')();
app.use(cors);


var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'test1234',
  database : 'restful'
}); 
connection.connect();

/*
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/restful';
var dbObj = null;
MongoClient.connect(url, function(err, db) {
  console.log("Connected correctly to server");
  dbObj = db;
});

var ObjectID = require('mongodb').ObjectID;
app.get('/user/message/:id',function(req,res) {
	var messages = dbObj.collection('messages');
	messages.findOne(
		{_id:ObjectID.createFromHexString(req.params.id)},
		function(err, result){
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				res.send(JSON.stringify(result));
			}
		});
});

*/

var multer = require('multer');
var Storage = multer.diskStorage({
     destination: function(req, file, callback) {
         callback(null, "./public/upload_image/");
     },
     filename: function(req, file, callback) {
     		file.uploadedFile = file.fieldname + "_" + 
     			Date.now() + "_" + file.originalname;
     		console.log('file.uploadedFile:'+file.uploadedFile);
         callback(null, file.uploadedFile);
     }
 });

 var upload = multer({
     storage: Storage
 }).single("image");
app.post('/user/picture',function(req, res) {
	upload(req, res, function(err) {
		if (err) {
			res.send(JSON.stringify(err));
		} else {
			res.send(JSON.stringify({url:req.file.uploadedFile,
				description:req.body.description}));
		}
	});
});

app.get('/user/message',function(req,res) {
	console.log(req.query.sender_id);
	var condition = {};
	if (req.query.sender_id != undefined)
		condition = {sender_id:req.query.sender_id};
	var messages = dbObj.collection('messages');
	messages.find(condition)
		.toArray(function(err, results){
		if (err) {
			res.send(JSON.stringify(err));
		} else {
			res.send(JSON.stringify(results));
		}
	});
});
app.post('/user/message',function(req,res) {
	console.log(req.body.sender_id);
	console.log(req.body.reciever_id);
	console.log(req.body.message);
	connection.query(
		'select id,name from user where id=? or id=?',
		[req.body.sender_id,req.body.reciever_id],
		function(err, results, fields) {
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				var sender = {};
				var reciever = {};
				for (var i = 0; i < results.length; i++){
					if (results[i].id == 
						Number(req.body.sender_id)) {
						sender = results[i];
					}
					if (results[i].id ==
						Number(req.body.reciever_id)) {
						reciever = results[i];
					}
				}
				var object = {
					sender_id:req.body.sender_id,
					reciever_id:req.body.reciever_id,
					sender:sender, reciever:reciever,
					message:req.body.message,
					created_at:new Date()
				}
				var messages = dbObj.collection('messages');
				messages.save(object, function(err, result){
					if (err) {
						res.send(JSON.stringify(err));
					} else {
						res.send(JSON.stringify(result));
					}
				});
			}
		});
});
app.delete('/user/message/:id',function(req,res) {
	var messages = dbObj.collection('messages');
	messages.remove(
		{_id:ObjectID.createFromHexString(req.params.id)},
		function(err, result){
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				res.send(JSON.stringify(result));
			}
		});
});
app.get('/user',function(req,res) {
	connection.query('select * from user', 
		function(err,results,fields) {
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				res.send(JSON.stringify(results));
			}
		});
});
app.get('/user/:id',function(req,res){
	connection.query('select * from user where id=?',
		[req.params.id], function(err, results, fields) {
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				if (results.length > 0) {
					res.send(JSON.stringify(results[0]));
				} else {
					res.send(JSON.stringify({}));
				}
				
			}
		});
});
app.post('/user/nologin',function(req,res){
	connection.query(
		'insert into user_nologin(device_token) values(?)',
		[ req.body.device_token ], 
		function(err, result) {
			if (err) {
				res.send(JSON.stringify({result:false,err:err}));
			} else {
				res.send(JSON.stringify({result:true,db_result:result}));
			}
		})
});



var crypto = require('crypto');
app.post('/user',function(req,res){
	var password = req.body.password;
	var hash = crypto.createHash('sha256').
		update(password).digest('base64');
	connection.query(
		'insert into user(user_id,password,name,age) values(?,?,?,?)',
		[ req.body.user_id, hash, req.body.name, req.body.age ], 
		function(err, result) {
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				res.send(JSON.stringify(result));
			}
		})
});

var jwt = require('json-web-token');
app.post('/user/login',function(req,res){
	var password = req.body.password;
	var hash = crypto.createHash('sha256').
		update(password).digest('base64');
	connection.query(
		'select id from user where user_id=? and password=?',
		[ req.body.user_id, hash ], function(err, results, fields){
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				if (results.length > 0) {//조건만족 -> 로그인 성공
					var cur_date = new Date();
					var settingAddHeaders = {
						payload: {
							"iss":"shinhan",
							"aud":"mobile",
							"iat":cur_date.getTime(),
							"typ":"/online/transactionstatus/v2",
							"request":{
								"myTransactionId":req.body.user_id,
								"merchantTransactionId":hash,
								"status":"SUCCESS"
							}
						},
						header:{
							kid:'abcdefghijklmnopqrstuvwxyz1234567890'
						}
					};
					var secret = "SHINHANMOBILETOPSECRET!!!!!!!!";
					//고유한 토큰 생성
					jwt.encode(secret, settingAddHeaders, 
						function(err, token) {
							if (err) {
								res.send(JSON.stringify(err));
							} else {
								var tokens = token.split(".");
								connection.query(
									'insert into user_login('+
									'token,user_real_id) values(?,?)',
									[tokens[2], results[0].id],
									function(err, result) {
										if (err) {
											res.send(JSON.stringify(err));
										} else {
											res.send(JSON.stringify({
												result:true,
												token:tokens[2],
												db_result:result
											}));
										}
									});
							}
						});
				} else {//조건불만족 -> 로그인 실패
					res.send(JSON.stringify({result:false}));
				}
			}
		});
});


app.put('/user/:id',function(req,res){
	connection.query(
		'update user set name=?,age=? where id=?',
		[ req.body.name, req.body.age, req.params.id ],
		function(err, result) {
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				res.send(JSON.stringify(result));
			}
		})
});
app.delete('/user/:id',function(req,res){
	connection.query('delete from user where id=?',
		[ req.params.id ], function(err, result) {
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				res.send(JSON.stringify(result));
			}
		});
});
app.listen(52273,function() {
	console.log('Server running');
});