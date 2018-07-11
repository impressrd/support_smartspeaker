'use strict';
const AWS = require('aws-sdk');
const Alexa = require('alexa-sdk');
const dynamo = new AWS.DynamoDB();
const tableName='toiletTraining';

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
    this.emit(':ask', this.t("トイレ行けたよ、と言ってね。"));
  },
  'record': function () {
    var message ="";
    var dt = new Date();
    var ms = dt.getTime();
    var today = Math.floor(ms / 1000).toString();
    const params = {
      TableName: tableName,
      Item: {
        "PK_DATE": {
          "N": today
        },
        "SOTO": {
          "N": '1'
         },
         "UCHI": {
           "N": '0'
         }
       }
     };
     var self=this;
     dynamo.putItem(params, function(err, data) {
       if (err) {
         console.error("Error occured", err);
         message = "ごめんね。記録にできなかったよ。少し待ってからまた伝えてね。";
       }else{
         console.log(data);
         var tmp = Math.floor( Math.random() * 5 );
         message = messageList.messages[tmp].content;
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
