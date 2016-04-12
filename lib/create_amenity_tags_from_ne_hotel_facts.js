var extract_amenities_from_hotel_facts = require('../lib/get_amenities_from_ne_hotel_record');
// Load the full list of NE Hoteles which have Package Holidays
var all_ne_hotels = require('../data/all_ne_hotels.json');
// the keys in all_ne_hotels are the WVItemId (NE Hotel ID)
console.log('All NE Hotels with Packages:', Object.keys(all_ne_hotels).length);

var ne_hotel_ids = Object.keys(all_ne_hotels); // Array of Ids so we can itterate

// var am = extract_amenities_from_hotel_facts(all_ne_hotels[ne_hotel_ids[3]]);
// console.log(am);
var AMENITIES = {}; // add Amenity to this array once inserted into CloudSearch (avoid dupes)

ne_hotel_ids.forEach(function(id){
	var am = extract_amenities_from_hotel_facts(all_ne_hotels[id]);
	Object.keys(am).forEach(function(k) {
		// console.log(k + ':' + am[k] + ' | ' + AMENITIES[k]);
		AMENITIES[k] = AMENITIES[k] || 1; // initialise if not set
		AMENITIES[k] = (am[k] !== false) ? AMENITIES[k] + 1 : AMENITIES[k]; // increment if not false
	});
})

// console.log(ne_hotel_ids.length)
console.log(AMENITIES)