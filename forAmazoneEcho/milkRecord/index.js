'use strict';
const Alexa = require('alexa-sdk');
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB();
const dynamoDC = new AWS.DynamoDB.DocumentClient();
const tableName="milkRecord";

var message = "";

var handlers = {
  'LaunchRequest': function () {
    this.emit(':ask', this.t("〇〇ミリリットル飲んだよ、とか、最後のミルクを教えて、と伝えてください。"));
  },
  'capacityIntent': function () {
    var today = getDateTime();
    var milkCapa = this.event.request.intent.slots.capacity.value;

    const params = {
      TableName: tableName,
      Item: {
        "PK_DATE": {
          "N": today
        },
        "AMOUNT": {
          "N": milkCapa
        }
      }
    };
    var self=this;
    dynamo.putItem(params, function(err, data) {
      if (err) {
        console.error("Error occured", err);
        message = "記録に失敗しました。少し待ってから試してください";
      }else{
        console.log(data);
        message = "ミルクを"+milkCapa+"ミリリットルですね。お疲れ様です。";
      }
      self.emit(':tell', message);
    });
  },
  'lastMilkIntent': function() {
    //var today = getDateTime();
    var scanParam = {
      TableName : tableName
    };
    var self=this;
    dynamoDC.scan(scanParam, function(error, data){
      if(error){
        console.log(error);
        message = "取得に失敗しました。少し待ってから試してください";
      }else{
        if (data.Count > 0){
          var nursingTimes = data.Count;
          var nursingDateTmp = 0;
          var lastNursingCount = 0;
          for (var i=0; i<nursingTimes-1; i++){
            if (nursingDateTmp < data.Items[i].PK_DATE) {
              nursingDateTmp = data.Items[i].PK_DATE;
              lastNursingCount = i;
            }
          }
          var lastMilkQua = data.Items[lastNursingCount].AMOUNT;
          //最後のミルクの時刻と経過時刻を取得
          //経過時刻
          var distLastMilkTime ="";
          var today = getDateTime();
          var lastMilkTimeSec = data.Items[lastNursingCount].PK_DATE;
          var lastMilkTimeTmp = new Date(lastMilkTimeSec*1000);
          lastMilkTimeTmp.setTime(lastMilkTimeTmp.getTime() + 1000*60*60*9);// JSTに変換
          var lastMilkTime = ""+lastMilkTimeTmp.getHours()+"時"+lastMilkTimeTmp.getMinutes()+"分";
          var dstMilSec = today - lastMilkTimeSec;
          var dstTmpMin = Math.floor(dstMilSec / 60); //経過時間全体を分で取得
          if (dstTmpMin > 60 ){ //経過時間全体が60分以上であるか
            var dstHour = Math.floor(dstTmpMin / 60); //x時間を取得
             var distMin = dstTmpMin - (dstHour * 60); //x時間を分に戻して、経過時間全体から減算して分を取得。
            distLastMilkTime = dstHour + "時間　" + distMin + "分、経過しています。";
          }else{
            distLastMilkTime = dstTmpMin+"分、経過しています。";
          }
           message = "最後にミルクを飲んだのは、"+ lastMilkTime +"です。　"+ distLastMilkTime +"量は"+ lastMilkQua +"ミリリットル　でした。";
        }else{
          message = "記録がありません。記録してから聞いてくださいね。";
        }
      }
      self.emit(':tell', message);
    });
  },
  'todayMilkIntent': function(){
    var today = getDateTime("today");
    var scanParam = {
      TableName : tableName,
      FilterExpression : "PK_DATE >= :val",
      ExpressionAttributeValues : {":val" : Number(today)}
    };
    var self=this;
    dynamoDC.scan(scanParam, function(error, data){
      if(error){
        console.log(error);
        message = "取得に失敗しました。少し待ってから試してください";
      }else{
        if (data.Count > 0){
          var nursingTimes = data.Count;
          var nursingQua = 0;
          for (var i=0; i<nursingTimes-1; i++){
            nursingQua = nursingQua + data.Items[i].AMOUNT;
          }
          var nursingQuaAvg = Math.floor(nursingQua / nursingTimes);
          message = "今日は" + nursingTimes + "回飲みました。 。合計は"+ nursingQua + "ミリリットル、平均は"+nursingQuaAvg+"ミリリットルです";
        }else{
          message = "今日は記録がありません。記録してから聞いてくださいね";
        }
      }
      self.emit(':tell', message);
    });

  },
  'SessionEndedRequest': function() {
  }
};

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context, callback);
  alexa.resources = languageString;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

function getDateTime(format) {
  // 現在時刻の取得
  // 現在時刻をコンピュータで扱いやすいエポックタイムで取得する
  var dt = new Date();
  var ut = "";
  var utMill = "";
  if(!format){
    utMill = dt.getTime();
  }
  if(format=="today"){
    dt.setTime(dt.getTime() + 1000*60*60*9);// JSTに変換
    var utYear = dt.getFullYear();
    var utMonth = dt.getMonth();
    var utDay = dt.getDate();
    utMill = new Date(utYear, utMonth, utDay, -9);
  }
  ut = Math.floor(utMill / 1000 );
  return ut.toString();
}
