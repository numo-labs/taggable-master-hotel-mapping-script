process.env.GEONAMES_USERNAMES = 'numo,numo1,numo2,numo3,numo4,numo5'; // temp!

var fs = require('fs');

var geonames = require('lambda-taggable-geonames-indexer');
var ne_hotels = require('./ne-wvidemid-to-mhid-mapping.json');
console.log('Nordics Hotels:', ne_hotels.length);
var master_hotels = require('./mhid-data.json');
console.log('Master Hotels:', master_hotels.length);
var mhid_map = {};
master_hotels.forEach(function (h) {
  mhid_map[h.MID] = h;
});

function location (mhid) {
  var master = mhid_map[mhid];
  return (!master || !master.Latitude || !master.Longitude) ? {} : {
    lat: master.Latitude.toString().replace(',', '.'),
    lon: master.Longitude.toString().replace(',', '.')
  }
}

var records = []; // a valid tags record
ne_hotels.forEach(function (ne_hotel) {
  // if(mhid_map[ne_hotel.MHID] && ne_hotel.MHID === '8usai1c') { // only map the NE hotels that have valid MHID
  if(mhid_map[ne_hotel.MHID]) { // only insert an NE Hotel if it has a Master Hotel ID else we cannot find it!
    // var master = mhid_map[ne_hotel.MHID];
    records.push({
      _id: 'hotel:NE.wvHotelPartId.' + ne_hotel.WVitemID,
      displayName: ne_hotel.HotelName,
      location: location(ne_hotel.MHID),
      tags: [
        {
          tagId: 'hotel:mhid.' + ne_hotel.MHID,
          source: 'master_hotel_mapping',
          inherited: false,
          active: true
        },
        {
          tagId: 'hotel:mhid.' + ne_hotel.MHID + 'jimmy_chooz',
          source: 'master_hotel_mapping',
          inherited: false,
          active: true
        },
        {
          tagId: 'geo:geograph:jackistan',
          source: 'master_hotel_mapping',
          inherited: false,
          active: true
        }
      ],
      metadata: [
        {
          key: 'tripadvisor',
          values: [ ne_hotel.TripadvisorLocationID ]
        },
        {
          key: 'hello', values: ['Nikhi!']
        }
      ]
    });
  }
});
// var nordics_hotels_tags_file = './ne-hotles-tags.json';
records = records.splice(records.length - 1561, records.length);
console.log('NE Mapped', records.length);
// console.log('Sample:', JSON.stringify(records[0], null, 2));

var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var lambda = new AWS.Lambda();
var limit = records.length;

function save(record, type) {
  var filename = './' + type + '/' + record._id.replace(':', '_') + '.json';
  fs.writeFile(filename, JSON.stringify(record, null, 2), function(err, data){
    // console.log(err, data);
  });
}

function insert (record, callback) {
  var params = {
    FunctionName: 'lambda-taggable-createdocument-v1', // lambda function to invoke
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
      if(record._id.indexOf('hotel:NE') > -1) {
        // return next();
      }
    }
  });
}

function get_master (ne_record) {
  // console.log(ne_record);
  var m = mhid_map[ne_record.tags[0].tagId.split('.')[1]];
  // console.log(m);
  return {
    _id: 'hotel:mhid.' + m.MID,
    displayName: m.Name,
    location: location(m.MID),
    tags: [{
      tagId: 'hotel:NE.wvHotelPartId.101443',
      source: 'does_not_matter',
      inherited: false,
      active: true
    }]
  }
}


function next () {
  console.log(' - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ');
  console.log('Remaining Records:', records.length);
  if(records.length > 0) {
    var record = records.pop(); // a Nordics Record!
    var master = get_master(record); // master hotel record
    var lat = record.location.lat;
    var lon = record.location.lon;
    if (!lat || !lon) { // don't lookup a record that does not have a lat lon in Geonames
      console.log('Record has not got lat/lon!', record);
      return next();
    }
    console.log('Record has lat/lon:', lat, lon)
    geonames.find(lat, lon, function (err, data) {
      if(!data.geonames || data.geonames.length === 0){
          console.log(err, data);
          return;
      }
      // console.log(data.geonames);
      // return;
      geonames.hierarchy(data.geonames[0].geonameId, function(err, hierarchy) {
        // hierarchy.geonames = hierarchy.geonames.splice(1, hierarchy.geonames.length); // remove the first item from the hierarchy (Earth);
        // console.log(hierarchy);
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
          // master.tags.push(geo_tag);
        }
        master.tags.push(geo_tag); // attach a single geo tag to each master hotel

        // insert(master);
        insert(record); // Pascal instructed not to add geo tag to nordics record
        // console.log('master:',master);
        // console.log('record:', record);
      });
    });
  }
  else {
    return true;
  }
}

next();
