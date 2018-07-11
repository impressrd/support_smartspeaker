'use strict';
const Alexa = require('alexa-sdk');
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB();
const dynamoDC = new AWS.DynamoDB.DocumentClient();
const tableName="toiletTraining";

//発話用の変数を初期化する
var message = "";

const messageList = {
  messages: [
    {content: "すっごーい！"},
    {content: "今日も上手にできたねー！"},
    {content: "その調子！その調子！！"},
    {content: "いいね！いいね！！"},
    {content: "頑張れ！頑張れ！！"}
  ]  
};

var handlers = {
  'LaunchRequest': function () {
     this.emit('check');
  },
  'check': function() {
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
          message = "今日は、";
          if (data.Count > 0){
            var uchi = 0;
            var soto =0; 
            for (var i=0; i<data.Count-1; i++){
              uchi = uchi + data.Items[i].UCHI;
              soto = soto + data.Items[i].SOTO;
            }
            if (uchi > 0){
              message = message + "おうちで" + uchi + "回。できました。";
            }
            if (soto > 0){
              message = message + "おそとで" + soto + "回。できました。";
            }
          }else{
            message = message+"記録がありません。記録してから聞いてくださいね";
          }
        }
          self.emit(':tell', message);
     });
  },
  'uchi': function () {
    var today = getDateTime();
    const params = {
      TableName: tableName,
      Item: {
        "PK_DATE": {
          "N": today
        },
        "UCHI": {
          "N": '1'
        },
        "SOTO": {
          "N": '0'
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
        var tmp = Math.floor( Math.random() * 5 );
        message = "おうちでトイレできたんだねー！" +messageList.messages[tmp].content;
      }
      self.emit(':tell', message);
    });
  },
  'soto': function() {
    var today = getDateTime();
    const params = {
      TableName: tableName,
      Item: {
        "PK_DATE": {
          "N": today
        },
        "UCHI": {
          "N": '0'
        },
        "SOTO": {
          "N": '1'
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
      var tmp = Math.floor( Math.random() * 5 );
      message = "おそとでトイレできたんだねー！"+messageList.messages[tmp].content;
    }
      self.emit(':tell', message);
    });      
  },
  'SessionEndedRequest': function() {
  }
};

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context, callback);
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
