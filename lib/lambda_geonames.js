var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var lambda = new AWS.Lambda();

module.exports = function get_geo_tags (record, callback) {

  var params = {
    FunctionName: 'tag-e-geo-v1', // lambda function to invoke
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
    // console.log(record._id, record.displayName + ' | has ' + record.tags.length + ' tags');
    callback(err, data);
  });
};
