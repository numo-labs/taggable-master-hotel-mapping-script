process.env.GEONAMES_USERNAMES = 'numo,numo0,numo1,numo2,numo3,numo4,numo5,numo6,numo7,numo8,numo9,numo10';
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
var ne_hotel_ids = ne_hotel_ids.splice(ne_hotel_ids.length - 2, ne_hotel_ids.length);

var records_inserted = []; // count the number of records inserted into CloudSearch
var AMENITIES = []; // add Amenity to this array once inserted into CloudSearch (avoid dupes)

/**
 * next gets the next NE Hotel record from the list and processes it.
 * gets called recursively until there are no more records left to process.
 */
function next () {
  if(ne_hotel_ids.length > 0) {
    console.log(' - - - - - - - - - - > Remaining Records:', ne_hotel_ids.length);
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
        return console.log(' - - - - - - - -Geonames ERROR:', err, data);
      }
      geonames.hierarchy(data.geonames[0].geonameId, function (err, hierarchy) {

        var geo_tags = geonames.format_hierarchy_as_tags(hierarchy); // https://git.io/vwm8Y

        geo_tags.forEach(function (g) {
          if (!g._id.match(/6295630/)) { // don't re-insert earth thousands of times!
            lambda_taggable_create_document(g, cb);
            var geo_tag = format_geo_tag(g);
            // console.log(g);
            if (master_hotel_record) {
              master_hotel_record.tags.push(geo_tag); // attach a single geo tag to each master hotel
              g.tags.forEach(function (parent_tag) { master_hotel_record.tags.push(parent_tag); });
            }
            ne_hotel_record.tags.push(geo_tag);
            g.tags.forEach(function (parent_tag) { ne_hotel_record.tags.push(parent_tag); });
          }
        });
        if (master_hotel_record) {
          lambda_taggable_create_document(master_hotel_record, cb);
        } // obviously only insert a master_hotel_record if it exists

        lambda_taggable_create_document(ne_hotel_record, function (err, data) {
          records_inserted.push(data._id);
          next();
        });
      });
    });
  }
  else {
    console.log(' - - - - - - - - - - > Done!', records_inserted.length);
    var unique = records_inserted.sort().filter(function(item, pos) {
        return records_inserted.indexOf(item) == pos;
    });
    console.log('Unique Records', unique.length);
    return;
  }
}

function cb (err, data) {
  records_inserted.push(data._id);
  // console.log(err, data); // uncomment this for debugging
} // does nothing.

function format_geo_tag (g) {
  return { // the tag we add to other tags
    tagId: g._id,
    displayName: g.displayName,
    source: 'geonames',
    inherited: false,
    active: true
  }
}

next(); // start script!
