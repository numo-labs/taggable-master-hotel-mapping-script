var assert = require('assert');
var s3_create = require('../lib/s3_create');
var base_url = 'https://numo-taggy.s3-eu-west-1.amazonaws.com/ci/'

describe('Save record to S3', function () {
  it('create a record on S3 with json data', function (done) {

	var obj = {
	  displayName: 'hello world',
	  _id: '123'
	}

	s3_create('test', obj, function(err, data){
	  if (err) {
	    console.log("Error uploading data: ", err);
	  } else {
	    console.log(data);
	  }
	  assert(data.Location === base_url + 'test/123.json');
	  done();
	})

  });

  it('create a record with ARN-style filename', function (done) {

	var obj = {
	  displayName: 'My Amazing Hotel',
	  _id: 'hotel:NE.wvHotelPartId.1234'
	}

	s3_create('test', obj, function(err, data){
	  if (err) {
	    console.log("Error uploading data: ", err);
	  } else {
	    console.log(data);
	  }
	  // see: https://github.com/numo-labs/taggable-master-hotel-mapping-script/issues/2
	  assert(data.Location === base_url + 'test/hotel%3ANE.wvHotelPartId.1234.json');
	  done();
	})

  });
});
