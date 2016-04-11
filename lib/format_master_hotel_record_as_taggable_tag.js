// all 42k master hotel records 
var master_hotels_map = require('../data/master_hotel_records_map.json'); // require cached
console.log('Master Hotels:', Object.keys(master_hotels_map).length);

function location (mhid) {
  var master = master_hotels_map[mhid];
  return (!master || !master.Latitude || !master.Longitude) ? {} : {
    lat: master.Latitude.toString().replace(',', '.'),
    lon: master.Longitude.toString().replace(',', '.')
  }
}

module.exports = function get_master (ne_hotel_record) {
  var m = master_hotels_map[ne_hotel_record.tags[0].tagId.split('.')[1]];
  if (!m) {
    console.log('No Master for', ne_hotel_record._id);
    return false;
  }

  return {
    _id: 'hotel:mhid.' + m.MID,
    displayName: m.Name,
    location: location(m.MID),
    tags: [{
      tagId: ne_hotel_record._id, // e.g: hotel:NE.wvHotelPartId.101443
      source: 'ne_hotel_to_master_hotel_mapping',
      inherited: false,
      active: true
    }]
  }
}