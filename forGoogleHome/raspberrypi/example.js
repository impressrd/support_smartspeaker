var express = require('express');
var googlehome = require('./google-home-notifier');
var ngrok = require('ngrok');
var bodyParser = require('body-parser');
var googleSpreadsheet = require('google-spreadsheet');
var inboundUrlFile = new GoogleSpreadsheet('****');
var credentialKeyFile = require('./GoogleHomeNotifierKey.json');
var fs = require('fs');
var app = express();
const serverPort = 8091; // default port

var deviceName = '****';
var ip = '****';

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var urlRecordsheet;
inboundUrlFile.useServiceAccountAuth(credentialKeyFile, function(err){
   inboundUrlFile.getInfo(function(err, data){
      urlRecordSheet = data.worksheets[0];
   });
});


app.post('/google-home-notifier', urlencodedParser, function (req, res) {
  
  if (!req.body) return res.sendStatus(400)
  console.log(req.body);
  
  var text = req.body.text;
  
  if (req.query.ip) {
     ip = req.query.ip;
  }

  var language = 'ja'; // default language code
  if (req.query.language) {
    language;
  }

  googlehome.ip(ip, language);
  googlehome.device(deviceName,language)

  if (text){
    try {
      if (text.startsWith('http')){
        var mp3_url = text;
        googlehome.play(mp3_url, function(notifyRes) {
          console.log(notifyRes);
          res.send(deviceName + ' will play sound from url: ' + mp3_url + '\n');
        });
      } else {
        googlehome.notify(text, function(notifyRes) {
          console.log(notifyRes);
          res.send(deviceName + ' will say: ' + text + '\n');
        });
      }
    } catch(err) {
      console.log(err);
      res.sendStatus(500);
      res.send(err);
    }
  }else{
    //res.send('Please GET "text=Hello Google Home"');
  }
})

app.get('/google-home-notifier', function (req, res) {

  console.log(req.query);

  var text = req.query.text;

  if (req.query.ip) {
     ip = req.query.ip;
  }

  var language = 'ja'; // default language code
  if (req.query.language) {
    language;
  }

  googlehome.ip(ip, language);
  googlehome.device(deviceName,language)

  if (text) {
    try {
      if (text.startsWith('http')){
        var mp3_url = text;
        googlehome.play(mp3_url, function(notifyRes) {
          console.log(notifyRes);
          res.send(deviceName + ' will play sound from url: ' + mp3_url + '\n');
        });
      } else {
        googlehome.notify(text, function(notifyRes) {
          console.log(notifyRes);
          res.send(deviceName + ' will say: ' + text + '\n');
        });
      }
    } catch(err) {
      console.log(err);
      res.sendStatus(500);
      res.send(err);
    }
  }else{
    //res.send('Please GET "text=Hello+Google+Home"');
  }
})

app.listen(serverPort, function () {
//ngrok.connect(serverPort, function (err, url) {
  ngrok.connect({
    authtoken: 'xAvwKDjYq9HLdpVoXuyY_3PZUveDHSWaydSEmFhXno', 
    addr: serverPort, 
    region: 'ap'
   }, function (err, url) {
	console.log('Endpoints:');
	console.log('    http://' + ip + ':' + serverPort + '/google-home-notifier');
	console.log('    ' + url + '/google-home-notifier');
	console.log('GET example:');
	console.log('curl -X GET ' + url + '/google-home-notifier?text=Hello+Google+Home');
	console.log('POST example:');
	console.log('curl -X POST -d "text=Hello Google Home" ' + url + '/google-home-notifier');
	// sheetの一番左上のCellを取得
	urlRecordSheet.getCells({
	  'min-row': 1,
	  'max-row': 1,
  	  'min-col': 1,
	  'max-col': 1,
	  'return-empty': true
    }, function(error, cells) {
          var cell = cells[0];
          cell.value = url + '/google-home-notifier'; //アクセスしてほしいURLをセット
          cell.save(); //保存
          console.log('spread sheet update successful!!');
    });  
  });
})

app.get('/google-home-notifier/:audioName', (req, res) => {
  const audioName = req.params.audioName;
  if (!audioName) {
    res.status(400).send('Invalid Parameters.');
  }
  const file = fs.readFileSync(__dirname + '/tmp/' + audioName, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});
