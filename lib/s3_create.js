var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var bucket = 'numo-taggy';
var s3bucket = new AWS.S3({params: {Bucket: bucket}});
var fs = require('fs');
var path = require('path');
var base = path.resolve('./records/') + '/';
console.log('BASE:', base);

module.exports = function s3_create (type, record, callback) {
  var filepath = type + '/' + record._id + '.json';
  // console.log(filepath);
  var params = {
    Key: 'ci/' + filepath,
    Body: JSON.stringify(record, null, 2),
    ContentType: 'application/json',
    ACL: 'public-read'};
  s3bucket.upload(params, function(err, data) {
    var filename = base + filepath.replace(':','_');
    // console.log('filename:', filename);
    fs.writeFileSync(filename, JSON.stringify(record, null, 2));
    callback(err, data);
  });
}

