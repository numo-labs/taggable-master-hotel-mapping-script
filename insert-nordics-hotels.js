var geonames = require('lambda-taggable-geonames-indexer');

var ne_hotels = require('./ne-wvidemid-to-mhid-mapping.json');
console.log('Nordics Hotels:', ne_hotels.length);
var master_hotels = require('./mhid-data.json');
console.log('Master Hotels:', master_hotels.length);
var mhid_map = {};
master_hotels.forEach(function(h) {
  mhid_map[h.MID] = h;
});

function location (mhid) {
  var master = mhid_map[mhid];
  return !master ? {} : {
    lat: master.Latitude.toString().replace(',', '.'),
    lon: master.Longitude.toString().replace(',', '.')
  }
}

var records = []; // a valid tags record
ne_hotels.forEach(function (ne_hotel) {
  if(mhid_map[ne_hotel.MHID]) { // only map the NE hotels that have valid MHID
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
        }
      ],
      metadata: [
        {
          key: 'tripadvisor',
          values: [ ne_hotel.TripadvisorLocationID ]
        }
      ]
    });
  }
});
var nordics_hotels_tags_file = './ne-hotles-tags.json';
console.log('NE Mapped', records.length);
// console.log('Sample:', JSON.stringify(records[0], null, 2));

var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var lambda = new AWS.Lambda();
var limit = records.length;

function insert (record) {
  var params = {
    FunctionName: 'lambda-taggable-createdocument-v1', // the lambda function we are going to invoke
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: JSON.stringify(record)
  };

  lambda.invoke(params, function(err, data) {
    if (err) {
      console.log(' - - - - - - - - - - - - - - - ERROR:')
      console.log(err);
    } else {
      console.log(data);
      if(record._id.indexOf('hotel:NE') > -1) {
        return index();
      }
    }
    return;
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
    tags: []
  }
}


function index () {
  if(records.length > 0) {
    var record = records.pop();
    var master = get_master(record);
    // return;
    // console.log(record);
    // console.log(master);
    var lat = record.location.lat;
    var lon = record.location.lon;
    geonames.find(lat, lon, function (err, data) {
      // console.log(err, data);
      geonames.hierarchy(data.geonames[0].geonameId, function(err, hierarchy) {
        // console.log(hierarchy);
        hierarchy.geonames = hierarchy.geonames.splice(1, hierarchy.geonames);
        hierarchy.geonames.forEach(function (g) {
          // insert the Geonames record
          var geo_record = {
            _id: 'geo:geonames.' + g.geonameId,
            displayName: g.name,
            location: {
              lat: g.lat,
              lon: g.lng
            }
          }
          insert(geo_record);
        });
        var geo_tag = {
          tagId: 'geo:geonames.' + g.geonameId,
          source: 'geonames',
          inherited: false,
          active: true
        }
        var parent =
        master.tags.push(geo_tag);

        master.tags.push(geo_tag);

        insert(master);
        insert(record);
      });
    });
  }
  else {
    return true;
  }
}


index();
