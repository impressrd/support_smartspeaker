'use strict';
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB();
const tableName='toiletTraining';

exports.handler = function(event, context, callback) {
  var dt = new Date();
  var ms = dt.getTime();
  var today = Math.floor(ms / 1000).toString();
  const params = {
    TableName: table
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
  dynamo.putItem(params, function(err, data) {
    if (err) {
        console.error("Error occured", err);
    }else{
       c onsole.log(data);
       }
  });
}
