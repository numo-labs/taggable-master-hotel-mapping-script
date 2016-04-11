var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var lambda = new AWS.Lambda();

module.exports = function insert (record, callback) {
  var params = {
    FunctionName: 'lambda-taggable-createdocument-v1', // lambda function to invoke
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: JSON.stringify(record)
  };

  lambda.invoke(params, function(err, data) {

    if (err) {
      console.log(' - - - - - - - - - - - - - - - ERROR:')
      console.log(err);
      err._id = record._id;
    } else {
      data._id = record._id;
    }
    console.log(record._id);
    callback(err, data);
  });
};
