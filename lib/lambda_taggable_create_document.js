var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var lambda = new AWS.Lambda();

var fs = require('fs');
var base = require('path').resolve(__dirname+ '/../records') + '/';
console.log(base);

module.exports = function insert (record, callback) {
  record.updated = new Date().toISOString();
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
    var filename = base + record._id.split(':')[1] + '.json';
    fs.writeFileSync(filename, JSON.stringify(record, null, 2));
    console.log(filename);
    console.log(record._id, record.displayName, record.tags.length);
    callback(err, data);
  });
};
