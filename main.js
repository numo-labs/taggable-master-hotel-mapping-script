process.env.GEONAMES_USERNAMES = 'numo,numo1,numo2,numo3,numo4,numo5'; // a few usernames!
var fs = require('fs');
var geonames = require('lambda-taggable-geonames-indexer');
var format_ne_hotel_as_taggable_tag = require('./lib/format_ne_hotel_as_taggable_tag');

// Load the full list of NE Hoteles which have Package Holidays
var all_ne_hotels = require('./data/all_ne_hotels.json');
// the keys in all_ne_hotels are the WVItemId (NE Hotel ID)
console.log('All NE Hotels with Packages:', Object.keys(all_ne_hotels).length);

var ne_hotel_ids = Object.keys(all_ne_hotels); // Array of Ids so we can itterate


var record = format_ne_hotel_as_taggable_tag (all_ne_hotels['4473']);
console.log(JSON.stringify(record, null, 2));

