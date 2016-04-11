process.env.GEONAMES_USERNAMES = 'numo,numo1,numo2,numo3,numo4,numo5'; // a few usernames!
var fs = require('fs');
var geonames = require('lambda-taggable-geonames-indexer');
var format_ne_hotel_as_taggable_tag = require('./lib/format_ne_hotel_as_taggable_tag');
var lambda_taggable_create_document = require('./lib/lambda_taggable_create_document');
var format_master_hotel_record = require('lib/format_master_hotel_record_as_taggable_tag.js')

// Load the full list of NE Hoteles which have Package Holidays
var all_ne_hotels = require('./data/all_ne_hotels.json');
// the keys in all_ne_hotels are the WVItemId (NE Hotel ID)
console.log('All NE Hotels with Packages:', Object.keys(all_ne_hotels).length);

var ne_hotel_ids = Object.keys(all_ne_hotels); // Array of Ids so we can itterate

var ne_hotel_record = format_ne_hotel_as_taggable_tag (all_ne_hotels['4473']);
console.log(JSON.stringify(ne_hotel_record, null, 2));

// only lookup & format Master Hotel Record if a mapping exists
if(ne_hotel_record.tags.length > 0 && ne_hotel_record.tags[0].tagId.indeOf('NO_MHID') === -1) {
  var master_hotel_record = format_master_hotel_record(ne_hotel_record);
}

// lambda_taggable_create_document(record, function (err, data) {
//   console.log(err, data)
// });