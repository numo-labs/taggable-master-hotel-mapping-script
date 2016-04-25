var get_amenities_from_ne_hotel_facts = require('./get_amenities_from_ne_hotel_facts');
// mapping between NE Hotel (WVItem) and NE Hotel Record WITH MHID
var ne_hotels_map = require('../data/ne_hotels_wvitemid_map.json');
console.log('Nordics Hotels (Mapped):', Object.keys(ne_hotels_map).length);

// all 42k master hotel records 
var master_hotels_map = require('../data/master_hotel_records_map.json');
console.log('Master Hotels:', Object.keys(master_hotels_map).length);

// Load the full list of NE Hoteles which have Package Holidays
var all_ne_hotels = require('../data/all_ne_hotels.json');
// the keys in all_ne_hotels are the WVItemId (NE Hotel ID)
console.log('All NE Hotels with Packages:', Object.keys(all_ne_hotels).length);

var ne_hotel_ids = Object.keys(all_ne_hotels); // Array of Ids so we can itterate

/** 
 * many NE Hotels have Lat/Long on the 'location',
 * for those that don't, we lookup on the Master Hotel
 * otherwise return an empty object for the location
 * @param {Object} ne_hotel - the NE hotel object as returned by the NE API
 */
function location (ne_hotel) {
	// if the ne_hotle has a location property with latitude & longitude us it!
	if(ne_hotel.location && ne_hotel.location.latitude && ne_hotel.location.longitude) {
		// console.log('ne_hotel.location:', ne_hotel.location.latitude);
		return {
	    lat: ne_hotel.location.latitude,
	    lon: ne_hotel.location.longitude
  	}
	} 

	// check if the ne_hotel has been mapped to a master hotel id
	var ne_hotel_with_master_id = ne_hotels_map[ne_hotel.wvId];
	if(!ne_hotel_with_master_id) {
		return {};
	}

	// lookup the master hotel record in mhid_map 
	var master = master_hotels_map[ne_hotel_with_master_id.MID];
	// return the master's Lat/Lon if available else, No Location!
  return (!master || !master.Latitude || !master.Longitude) ? {} : {
    lat: master.Latitude.toString().replace(',', '.'),
    lon: master.Longitude.toString().replace(',', '.')
  }
}


function extract_hotel_facts (ne_hotel) {
	return ne_hotel.facts.map(function(fact) {
		var yes = /^Ja$/; // only exact match, no partial
		var no = /^Nej$/; // "Nej" >> "false"
 		// makes facet searching boolean in CloudSearch/ES
		fact.value = fact.value.toString().replace(yes, true).replace(no, false);
		fact.value = fact.value === 'false' ? false : fact.value;
		fact.value = fact.value === 'true' ? true : fact.value;
		return fact;
	});
}

/**
 * takes a hotel json and re-formats to a taggable tag
 */
function format_ne_hotel_as_taggable_tag (ne_hotel) {
	var ne_hotel_with_master_id = ne_hotels_map[ne_hotel.wvId] || {};
	// console.log(ne_hotel);
	// console.log(' - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ');
  // console.log(ne_hotel_with_master_id);
  // console.log(' - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ');
  var MHID = ne_hotel_with_master_id.MHID ? ne_hotel_with_master_id.MHID : 'NO_MHID';
  var record = {
		_id: 'hotel:ne.wvid.' + ne_hotel.wvId, // yes
		displayName: ne_hotel.name,
		location: location(ne_hotel),
		tags: [
			{  // only 2/3 of NE Hotels are Mapped to MHID see readme!
				tagId: 'hotel:mhid.' + MHID,
				source: 'master_hotel_mapping',
				inherited: false,
				active: ne_hotel_with_master_id.MHID ? true : false
			}
		],
		metadata: []
	};
	// add resort name so its indexed and thus searchable!
	record.displayName += (ne_hotel.geographical.resortName) ? (', ' + ne_hotel.geographical.resortName) : ''

	record.metadata[record.metadata.length + 1] = ne_hotel_with_master_id.TripadvisorLocationID ? {
		key: 'tripadvisor',
		values: [ ne_hotel_with_master_id.TripadvisorLocationID ]
	} : false;

	record.metadata[record.metadata.length + 1] = ne_hotel.geographical.countryName ? {
		key: 'country',
		values: [ ne_hotel.geographical.countryName ]
	} : false;

	record.metadata[record.metadata.length + 1] = ne_hotel.description ? {
		key: 'description',
		values: [ ne_hotel.description ]
	} : false;

	// record.metadata[record.metadata.length + 1] = ne_hotel.facts ? {
	// 	key: 'facts',
	// 	values: extract_hotel_facts(ne_hotel) 
	// } : false;

	record.metadata = record.metadata.filter(Boolean); // filter out any empty/null/undefined

	// add amenity tags to the ne hotel record
	var amenities = get_amenities_from_ne_hotel_facts(ne_hotel);
  Object.keys(amenities).forEach(function(k) {
    record.tags.push({
      tagId: 'amenity:ne.' + k,
      source: 'ne_hotel',
      inherited: false,
      active: true
    })
  });

	return record;
}

module.exports = format_ne_hotel_as_taggable_tag;