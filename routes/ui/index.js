var express = require('express');
var router = express.Router();
var redis = require('redis');
var client = redis.createClient(6379, "127.0.0.1");

/* GET home page. */
router.get('/', function (req, res, next) {
	// client.hset("hash key", "hashtest 1", "some value", redis.print);
	// client.hset('hash key', 'hashtest 2', 'some Test', redis.print);
	res.render('index', {
		title: 'Express'
	});
});

router.get('/calendar', function (req, res) {
	res.render('calendar');
})

/* 
 * Data Input Post.
 */
router.post('/api/calendar', function (req, res) {
	console.log('/api/calendar');
	var dateStart = req.body.dateStart;
	var inputData = req.body;
	// delete inputData.dateStart;

	var result = {
		resCode: "false",
	}
	inputData.id = 1;

	var multiInputData = new Array();
	new Promise(function (resolve, reject) {
		client.hexists("calendar", dateStart, function (err, reply) {
			if (err) reject(err);
			if (reply) {
				//이미 data가있다면 풀어헤쳐서 array에 집어넣는다.
				client.hget("calendar", dateStart, function (err, result) {
          if(err) reject(err);
					var resultArray = JSON.parse(result);
					for(var i = 0 ; i < resultArray.length; i++) {
						multiInputData.push(resultArray[i]);
					}
					inputData.id = resultArray.length + 1;
					// multiInputData.push(JSON.parse(result));
					multiInputData.push(inputData);
					client.hset('calendar',dateStart,JSON.stringify(multiInputData),function(err,reply){
            if(err) reject(err);
            resolve();
          });
				});
			} else {
				//data가 없다면 그냥 하나만 저장한다.
				multiInputData.push(inputData);
				client.hset("calendar", dateStart, JSON.stringify(multiInputData),function(err,reply){
          if(err) reject(err);
			  	resolve();
        });
			}
		})
	}).then(function () {
		res.send(result);
	}).catch(function (err) {
		console.log(err);
		return;
	});
});

//날짜별로 약속 조회
router.post('/api/calendar/appointment', function (req, res) {
	console.log('/api/calendar/appointment');
	var _result = {
		resCode: "false",
		appointment: []
	}
	var year = req.body.year;
	var month = req.body.month;
	var searchKey = year + month;

	var myArray = new Array();
	// console.log('####');
	// console.log(typeof myArray);

	new Promise(function (resolve, reject) {
		client.hkeys("calendar", function (err, replies) {
			if (err) reject(err)
			replies.forEach(function (reply, i) {
				client.hget("calendar", reply, function (err, result) {
					if (err) reject(err)
					var parseResult = JSON.parse(result);
					parseResult.dateStart = reply;
					//result에 hashkey값 추가
					// parseResult.subject = reply;
					if (parseResult.dateStart.substr(0, 6) == searchKey) {
						_result.appointment.push(parseResult);
						_result.resCode = 'true';
					}
					resolve(_result);
				})
			})
		})
	}).then(function (_result) {
		res.send(_result);
	}).catch(function (err) {
		console.log(err);
		res.send(_result);
		return;
	});
});

//특정날짜 data조회
router.post('/api/calendar/specificDate', function (req, res) {
  console.log('/api/calendar/specificDate');
  var dateValue = req.body.startDate;
  var _result = {
    resCode : "false"
  }

  new Promise(function (resolve,reject){
    client.hget('calendar',dateValue,function(err,reply){
      if(err) reject(err);
      if(reply == null) { 
        _result.resCode = "empty";
      } else {
        _result.resCode = "success";
        _result.replyData = reply;
      }
      resolve();
    });
  }).then(function(){
    res.send(_result);
  }).catch(function(err){
    console.log(err);
    return;
  })

  console.log(req.body);
});

//id를 이용한 특정 data 도출
router.post('/api/calendar/getValueById',function(req,res){ 
	console.log('/api/calendar/getValueById');
	console.log(req.body);
	var date = req.body.date;
	var id = req.body.id;

	var _result = {
		resCode : "false"
	};

	new Promise(function (resolve,reject) {
		client.hget('calendar',date,function(err,reply){
			if(err) reject(err);
			for(var i = 0 ; i < reply.length ; i ++) { 
				console.log('$$$ : ' + reply[i].id);
				if(reply[i].id == id) {
					console.log('###');
					console.log(reply[i].subject);
				}
			}			

		})
	}).then(function(){
		res.send(_result);
	}).catch(function(err){
		console.log(err);
		return;
	})
});

module.exports = router;