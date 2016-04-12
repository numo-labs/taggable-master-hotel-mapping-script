// all 42k master hotel records 
var master_hotels_map = require('../data/master_hotel_records_map.json'); // require cached
console.log('Master Hotels:', Object.keys(master_hotels_map).length);
var all_ne_hotels = require('../data/all_ne_hotels.json');

var get_amenities_from_ne_hotel_facts = require('./get_amenities_from_ne_hotel_facts');

function location (mhid) {
  var master = master_hotels_map[mhid];
  return (!master || !master.Latitude || !master.Longitude) ? {} : {
    lat: master.Latitude.toString().replace(',', '.'),
    lon: master.Longitude.toString().replace(',', '.')
  }
}

module.exports = function get_master (ne_hotel_record) {
  var MID = ne_hotel_record.tags[0].tagId.split('.')[1];
  var m = master_hotels_map[MID];
  if (!m) {
    console.log('No Master for', ne_hotel_record._id);
    return false;
  }
  var master = {
    _id: 'hotel:mhid.' + m.MID,
    displayName: m.Name,
    location: location(m.MID),
    tags: [{
      tagId: ne_hotel_record._id, // e.g: hotel:NE.wvHotelPartId.101443
      source: 'ne_hotel_to_master_hotel_mapping',
      inherited: false,
      active: true
    }]
  };
  var wvid = ne_hotel_record._id.split('.')[2];
  var ne_hotel = all_ne_hotels[wvid];
  var amenities = get_amenities_from_ne_hotel_facts(ne_hotel);
  Object.keys(amenities).forEach(function(k) {
    master.tags.push({
      tagId: 'amenity:' + k,
      source: 'ne_hotel',
      inherited: false,
      active: true
    })
  });
  return master;
}