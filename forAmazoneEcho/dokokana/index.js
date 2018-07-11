'use strict';
const Alexa = require('alexa-sdk');
const AWS = require ('aws-sdk');
const dynamo = new AWS.DynamoDB();
const dynamoDC = new AWS.DynamoDB.DocumentClient();
const tableName="dokokana";

const videoList = {
  train : 'XXXXXXXXXX',
  bus : 'XXXXXXXXXX',
  shinkansen : 'XXXXXXXXXX',
  taxi : 'XXXXXXXXXX',
  airplain : 'XXXXXXXXXX',
  subway : 'XXXXXXXXXX',
  noTrans : 'XXXXXXXXXX'
};

var message = "";
var transportation = "";
var video = "";

const handlers = {
  'LaunchRequest': function () {

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
      transportation = data.Items[0].transportation;
      message = data.Items[0].comment;
      switch (transportation) {
        case "train":
          video = videoList.train;
          break;
        case "bus":
          video = videoList.bus;
          break;
        case "shinkansen":
          video = videoList.shinkansen;
          break;
        case "taxi":
          video = videoList.taxi;
          break;
        case "airplain":
          video = videoList.airplain;
          break;
        case "subway":
          video = videoList.subway;
          break;
        case "noTrans":
          video = videoList.noTrans;
          break;
        default:
          break;
      }
      if (self.event.context.System.device.supportedInterfaces.VideoApp) {
        self.response.playVideo(video);
      }
    }else{
      message = "情報が見つかりませんでした。";
    }
  }
  self.response.speak(message);
  self.emit(':responseReady');  
  });
},
  'SessionEndedRequest': function () {
  }
};

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(handlers);
  alexa.execute();
};
