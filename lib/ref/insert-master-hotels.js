var fs = require('fs');
var master_hotels = require('./mhid-data.json');
var geonames = require('lambda-taggable-geonames-indexer');

var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var lambda = new AWS.Lambda();

function save(record, type) {
  var filename = './' + type + '/' + record._id.replace(':', '_') + '.json';
  fs.writeFile(filename, JSON.stringify(record, null, 2), function(err, data){
    // console.log(err, data);
  });
}

function insert (record) {
  var params = {
    FunctionName: 'lambda-taggable-createdocument-v1', // the lambda function we are going to invoke
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: JSON.stringify(record)
  };

  lambda.invoke(params, function(err, data) {
    save(record, 'records');
    if (err) {
      console.log(' - - - - - - - - - - - - - - - ERROR:')
      console.log(err);
      err._id = record._id;
      save(err, 'errors');
    } else {
      // console.log(typeof data);
      console.log(record._id);
      data._id = record._id;
      save(data, 'responses');
      if(record._id.indexOf('hotel:mhid') > -1) {
        return next();
      }
    }
  });
}


function next () {
  console.log(' - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ');
  console.log('Remaining Master Hotel Records:', master_hotels.length);
  if(master_hotels.length > 0) {
    var master = master_hotels.pop(); // a Nordics Record!
    var lat = master.Latitude;
    var lon = master.Longitude;
    if(lat === null || lon === null) { // don't lookup a record that does not have a lat lon in Geonames
      console.log('Record has not got lat/lon!', master);
      return next();
    }
    console.log('Record has lat/lon:', lat, lon, ' > Master Hotel ID:', master.MID);
    geonames.find(lat, lon, function (err, data) {
      if(!data.geonames || data.geonames.length === 0){
          console.log(err, data);
          return;
      }
      geonames.hierarchy(data.geonames[0].geonameId, function(err, hierarchy) {
        // hierarchy.geonames = hierarchy.geonames.splice(1, hierarchy.geonames.length); // remove the first item from the hierarchy (Earth);
        var geo_tag; // we use this to add a *single* geo tag the hotel below

        for(var i = 0; i < hierarchy.geonames.length; i++) {  // insert the Geonames record
          var g = hierarchy.geonames[i];
          // console.log(g);
          var geonames_tag_record = {
            _id: 'geo:geonames.' + g.geonameId,
            displayName: g.name,
            location: {
              lat: g.lat,
              lon: g.lng
            }
          }
          if(i > 0) { // earth does not have a parent in Geonames hierarchy
            var parent = hierarchy.geonames[i - 1]; // the previous item in the hierarchy
            geonames_tag_record.tags = [{
              tagId: 'geo:geonames.' + parent.geonameId,
              source: 'geonames',
              inherited: false,
              active: true
            }]
          }
          if(g.geonameId !== 6295630) { // don't re-insert earth thousands of times!
            insert(geonames_tag_record);
          }
          geo_tag = { // this is over-written until we get the last item in hierarchy
            tagId: 'geo:geonames.' + g.geonameId,
            source: 'geonames',
            inherited: false,
            active: true
          }
        }
        var record = {
          _id: 'hotel:mhid.' + master.MID,
          displayName: master.Name,
          displayName: master.Name,
          location:  {
            lat: master.Latitude.toString().replace(',', '.'),
            lon: master.Longitude.toString().replace(',', '.')
          },
          tags: [ geo_tag ],
        };
        insert(record);

      });
    });
  }
  else {
    return true;
  }
}

next();
