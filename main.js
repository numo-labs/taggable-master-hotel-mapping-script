process.env.GEONAMES_USERNAMES = 'numo,numo0,numo1,numo2,numo3,numo4,numo5,numo6,' 
  + 'numo7,numo8,numo9,numo10,numo11,numo12,numo13,numo14,numo15';
var lambda_geonames = require('./lib/lambda_geonames');
var format_ne_hotel_as_taggable_tag = require('./lib/format_ne_hotel_as_taggable_tag');
// var lambda_taggable_create_document = require('./lib/lambda_taggable_create_document');
var s3_create = require('./lib/s3_create');
// var neo4j_create = require('./lib/neo4j_create');
var format_master_hotel_record = require('./lib/format_master_hotel_record_as_taggable_tag.js')

// Load the full list of NE Hoteles which have Package Holidays
var all_ne_hotels = require('./data/all_ne_hotels.json');
// the keys in all_ne_hotels are the WVItemId (NE Hotel ID)
console.log('All NE Hotels with Packages:', Object.keys(all_ne_hotels).length);

var ne_hotel_ids = Object.keys(all_ne_hotels); // Array of Ids so we can itterate
// ne_hotel_ids = ne_hotel_ids.splice(ne_hotel_ids.length - 200, ne_hotel_ids.length);

/**
 * next gets the next NE Hotel record from the list and processes it.
 * gets called by setInterval until there are no more records left to process.
 */
function next () {
  var ne_hotel_id = ne_hotel_ids.pop(); // the NE Hotel ID of next record
  var ne_hotel_record = format_ne_hotel_as_taggable_tag(all_ne_hotels[ne_hotel_id]);

  // only lookup & format Master Hotel Record if a mapping exists
  if(ne_hotel_record.tags.length > 0 && ne_hotel_record.tags[0].node.indexOf('NO_MHID') === -1) {
    var master_hotel_record = format_master_hotel_record(ne_hotel_record);
  } else {
    return; // don't bother indexing NE Hotels without a MHID
  }

  if (!ne_hotel_record.location.lat || !ne_hotel_record.location.lat) { // don't lookup 
    console.log('- - - - - - - - - - -> Nordics Hotel ha NO lat/lon!', ne_hotel_record._id);
    return; // return early
  }
  console.log('Record has lat/lon:', ne_hotel_record.location.lat, ne_hotel_record.location.lon);
  lambda_geonames(ne_hotel_record, function(err, data) {
    if(err || !data.Payload) {
      console.log(' - - - - - - - -> Geonames LAMBDA ERROR:', err, data);
      return; // return early
    }
    var geo_tags = JSON.parse(data.Payload);
    // console.log(geo_tags);

    var g = geo_tags[geo_tags.length - 1];
    // s3_create('geo/geonames', g, cb);
    if (g && g._id) {
      var geo_tag = format_geo_tag(g); // only the last geotag in the hierarchy
    }
    if (master_hotel_record) {
      if (geo_tag) {
        master_hotel_record.tags.unshift(geo_tag); // only add the final Geo tag to Master
      }
      // lambda_taggable_create_document(master_hotel_record, cb);
      s3_create(master_hotel_record, cb);
      // neo4j_create(master_hotel_record, cb);
      return;
    } // obviously only insert a master_hotel_record if it exists
    // s3_create(ne_hotel_record, function(err, data) {
    // // neo4j_create(ne_hotel_record, function () {
    //   return; // done!
    // });
  });
}

function cb (err, data) {
  console.log(err, data._id); // uncomment this for debugging
} // does nothing.

function format_geo_tag (g) {
  // console.log(g)
  return { // the tag we add to other tags
    node: g._id,
    edge: 'LOCATED_IN',
    displayName: g.displayName,
    source: 'geonames',
    inherited: false,
    active: true
  }
}

var interval = setInterval (function () {
  if(ne_hotel_ids.length > 0) {
    console.log(' - - - - - - - - - - > Remaining Records:', ne_hotel_ids.length);
    next();
  } else {
    clearInterval(interval);
    return console.log(' - - - - - - - - - - > Done!');
  }
}, 100);
