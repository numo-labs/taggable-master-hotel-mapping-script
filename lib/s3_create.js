var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var bucket = 'numo-taggy';
var s3bucket = new AWS.S3({params: {Bucket: bucket}});

module.exports = function s3_create (type, record, callback) {
  var params = {
    Key: 'ci/' + type + '/' + record._id + '.json',
    Body: JSON.stringify(record, null, 2),
    ContentType: 'application/json',
    ACL: 'public-read'};
  s3bucket.upload(params, function(err, data) {
    callback(err, data);
  });
}

