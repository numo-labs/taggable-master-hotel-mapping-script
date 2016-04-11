// var fs = require('fs');
// var path = require('path');
var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var lambda = new AWS.Lambda();

// function save(record, type) {
//   var dir = path.resolve('/../' + type)
//   console.log(dir);
//   var filename = dir + '/' + record._id.replace(':', '_') + '.json';
//   console.log(filename);
//   fs.writeFile(filename, JSON.stringify(record, null, 2), function(err, data) {
//     console.log(err, data);
//   });
// }

module.exports = function insert (record, callback) {
  var params = {
    FunctionName: 'lambda-taggable-createdocument-v1', // lambda function to invoke
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: JSON.stringify(record)
  };

  lambda.invoke(params, function(err, data) {
    // save(record, 'records');
    if (err) {
      console.log(' - - - - - - - - - - - - - - - ERROR:')
      console.log(err);
      err._id = record._id;
      // save(err, 'errors');
    } else {
      data._id = record._id;
      console.log(data);
      // save(data, 'responses');
      if(record._id.indexOf('hotel:NE') > -1) {
        callback(err, data);
      }
    }
  });
};
