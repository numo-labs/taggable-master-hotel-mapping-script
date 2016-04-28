// var lambda_taggable_create_document = require('../lib/lambda_taggable_create_document');
var s3_create = require('./s3_create');
var neo4j_create = require('./neo4j_create');

var tags = {}; // store the tags we are going to insert

function create_amenity_tag_from_hotel_facts (ne_hotel) {
	ne_hotel.facts.forEach(function(fact) {
		var tag = { 'displayName': fact.id + ' | ' + fact.name, location: { 'lat':0, 'lon': 0 }};

		var yes = /^Ja|1/; // Ja or 1 are considered true
		var no = /^Nej/; // "Nej" >> false

		fact.value = typeof fact.value !== 'boolean' && fact.value.match(yes) ? true : fact.value;
		fact.value = typeof fact.value !== 'boolean' && fact.value.match(no) ? false : fact.value;
		if(typeof fact.id === 'number') {
			fact.id = fact.name; // e.g: when fact.id is 130 ... :-\
		}
		if(fact.id.match(/carte/)) { // Someone decided 'a la carte restaurant' was a good id ...
			console.log(fact.id);
			fact.id = 'alacarterestaurant';
		}
		if(fact.id.match(/internet/i)) { // wifi is what people want
		
			fact.id = 'wifi';
		}
		var amenity_id = 'amenity:ne.' + fact.id.toString().toLowerCase(); // AllInclusive >> allinclusive
		tag['_id'] = amenity_id
		tag.active = true;
		tags[amenity_id] = tag; // over-write if exists
	});
}

// Load the full list of NE Hoteles which have Package Holidays
var all_ne_hotels = require('../data/all_ne_hotels.json');

Object.keys(all_ne_hotels).forEach(function(id) {
	create_amenity_tag_from_hotel_facts(all_ne_hotels[id]);
})

Object.keys(tags).forEach(function(tag_id) {
	var tag = tags[tag_id];
  // lambda_taggable_create_document(tag, function (err, data) {
  s3_create(tag, function(err, data){
  	console.log(err, data);
  	console.log(' - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -');
	});
  // neo4j_create(tag, function(res){
  //   console.log(res);
  // })
})
