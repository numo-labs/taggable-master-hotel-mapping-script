process.env.GEONAMES_USERNAMES = 'numo,numo0,numo1,numo2,numo3,numo4,numo5,numo6,numo7,numo8,numo9,numo10,numo11,numo12,numo13,numo14,numo15';
var geonames = require('tag-e-geo');
var format_ne_hotel_as_taggable_tag = require('./lib/format_ne_hotel_as_taggable_tag');
// var lambda_taggable_create_document = require('./lib/lambda_taggable_create_document');
// var s3_create = require('./lib/s3_create');
var neo4j_create = require('./lib/neo4j_create');
var format_master_hotel_record = require('./lib/format_master_hotel_record_as_taggable_tag.js')

// Load the full list of NE Hoteles which have Package Holidays
var all_ne_hotels = require('./data/all_ne_hotels.json');
// the keys in all_ne_hotels are the WVItemId (NE Hotel ID)
console.log('All NE Hotels with Packages:', Object.keys(all_ne_hotels).length);

var ne_hotel_ids = Object.keys(all_ne_hotels); // Array of Ids so we can itterate
// ne_hotel_ids = ne_hotel_ids.splice(ne_hotel_ids.length - 20, ne_hotel_ids.length);
var all_tags = {}; // store all tags by id
var ids = []; // array of tag ids in the order they need to be inserted
/**
 * next gets the next NE Hotel record from the list andc processes it.
 * gets called recursively until there are no more records left to process.
 */
function next () {
  if(ne_hotel_ids.length > 0) {
    console.log(' - - - - - > Remaining Records:', ne_hotel_ids.length);
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
      console.log('- - - - - - - - - - -> Nordics Hotel ha NO lat/lon!', ne_hotel_record._id);
      return setTimeout(function() { next(); }, 3000);
    }
    console.log('Record has lat/lon:', lat, lon);
    geonames.find(lat, lon, function (err, data) {
      if(err || !data || !data.geonames || data.geonames.length === 0){
        console.log(' - - - - - - - -> Geonames Find ERROR:', err, data);
        return setTimeout(function() { next(); }, 3000);
      }

      geonames.hierarchy(data.geonames[0].geonameId, function (err, hierarchy) {
        if (err || !hierarchy || !hierarchy.geonames) {
          console.log(' - - - - - - - -> Geonames Hierarchy ERROR:', err, hierarchy);
          return next();
        }

        geonames.get_all_geonames_records(hierarchy, function (err, map) {
          if(err || !map || Object.keys(map) < 1) {
            console.log(' - - - - - - - -> Geonames getJSON ERROR:', err, hierarchy);
            return next();
          }

          var geo_tags = geonames.format_hierarchy_as_tags(hierarchy, map); // https://git.io/vwm8Y
          var geo_tag; // used below
          geo_tags.forEach(function (g) {
            add_tag(g);
            geo_tag = format_geo_tag(g); // over-write 
          });
          if (master_hotel_record) {
            master_hotel_record.tags.unshift(geo_tag); // only add the final Geo tag to Master
            add_tag(master_hotel_record);
          } // only insert a master_hotel_record if it exists

          add_tag(ne_hotel_record);
          return next();
        });
      });
    });
  }
  else {
    console.log(' - - - - - - - - - - > Done!', ids.length);
    insert_tags();
    return;
  }
}

function cb (err, data) {
  // records_inserted.push(data.key);
  // console.log(err, data); // uncomment this for debugging
  // console.log(data.Location);
} // does nothing.


function add_tag (tag) {
  if(ids.indexOf(tag._id) === -1) {
    ids.push(tag._id);
    all_tags[tag._id] = tag;
  }
}

function insert_tags () {
  var interval = setInterval(function(){
    if(ids.length > 0){
      var id = ids.pop();
      var tag = all_tags[id];
      neo4j_create(tag, function(res){
        console.log(res);
      })
    } else {
      clearInterval(interval);
      console.log('done');
    }
  }, 50);
}

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
