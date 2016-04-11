process.env.GEONAMES_USERNAMES = 'numo,numo0,numo1,numo2,numo3,numo4,numo5,numo6,numo7,numo8,numo9,numo10'; // a few usernames!
var fs = require('fs');
var geonames = require('lambda-taggable-geonames-indexer');
var format_ne_hotel_as_taggable_tag = require('./lib/format_ne_hotel_as_taggable_tag');
var lambda_taggable_create_document = require('./lib/lambda_taggable_create_document');
var format_master_hotel_record = require('./lib/format_master_hotel_record_as_taggable_tag.js')

// Load the full list of NE Hoteles which have Package Holidays
var all_ne_hotels = require('./data/all_ne_hotels.json');
// the keys in all_ne_hotels are the WVItemId (NE Hotel ID)
console.log('All NE Hotels with Packages:', Object.keys(all_ne_hotels).length);

var ne_hotel_ids = Object.keys(all_ne_hotels); // Array of Ids so we can itterate
// var ne_hotel_ids = ne_hotel_ids.splice(ne_hotel_ids.length - 10, ne_hotel_ids.length);

var records_inserted = [];

function next () {
  console.log(' - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ');
  console.log('Remaining Records:', ne_hotel_ids.length);
  if(ne_hotel_ids.length > 0) {
    var ne_hotel_id = ne_hotel_ids.pop(); // the NE Hotel ID of next record
    var ne_hotel_record = format_ne_hotel_as_taggable_tag(all_ne_hotels[ne_hotel_id]);

    // only lookup & format Master Hotel Record if a mapping exists
    if(ne_hotel_record.tags.length > 0 && ne_hotel_record.tags[0].tagId.indexOf('NO_MHID') === -1) {
      // console.log(ne_hotel_record.tags[0]);
      var master_hotel_record = format_master_hotel_record(ne_hotel_record);
    }


    var lat = ne_hotel_record.location.lat;
    var lon = ne_hotel_record.location.lon;
    if (!lat || !lon) { // don't lookup a record that does not have a lat lon in Geonames
      console.log('Nordics Hotel ha NO lat/lon!', ne_hotel_record._id);
      return next();
    }
    console.log('Record has lat/lon:', lat, lon);
    geonames.find(lat, lon, function (err, data) {
      if(!data.geonames || data.geonames.length === 0){
          console.log(' - - - - - - - - - - - - - - - Geonames ERROR:')
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
            lambda_taggable_create_document(geonames_tag_record, cb);
          }

          geo_tag = {
            tagId: 'geo:geonames.' + g.geonameId,
            source: 'geonames',
            inherited: false,
            active: true
          }
          if (master_hotel_record) {
            master_hotel_record.tags.push(geo_tag); // attach a single geo tag to each master hotel
          }
          ne_hotel_record.tags.push(geo_tag);
        }
        // 
        if (master_hotel_record) {
          lambda_taggable_create_document(master_hotel_record, cb);
        }

        lambda_taggable_create_document(ne_hotel_record, function (err, data) {
          records_inserted.push(data._id);
          next();
        });
      });
    });
  }
  else {
    var unique = records_inserted.sort().filter(function(item, pos) {
        return records_inserted.indexOf(item) == pos;
    });
    console.log('records_inserted:', records_inserted.length, unique.length);
    return true;
  }
}

function cb (err, data) {
  records_inserted.push(data._id);
  // console.log(err, data);
} // does nothing. 

next();