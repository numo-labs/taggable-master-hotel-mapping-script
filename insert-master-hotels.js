






// var ne_hotels = require('./ne-wvidemid-to-mhid-mapping.json');
// console.log('Nordics Hotels:', ne_hotels.length);
// var master_hotels = require('./mhid-data.json');
// console.log('Master Hotels:', master_hotels.length);
// var mhid_map = {};
// master_hotels.forEach(function(h) {
//   mhid_map[h.MID] = h;
// });
//
// function location (mhid) {
//   var master = mhid_map[mhid];
//   return !master ? {} : {
//     lat: master.Latitude.toString().replace(',', '.'),
//     lon: master.Longitude.toString().replace(',', '.')
//   }
// }
//
// var ne_mapped = [];
// ne_hotels.forEach(function (ne_hotel) {
//   if(mhid_map[ne_hotel.MHID]) { // only map the NE hotels that have valid MHID
//     // var master = mhid_map[ne_hotel.MHID];
//     ne_mapped.push({
//       _id: 'hotel:NE.wvHotelPartId.' + ne_hotel.WVitemID,
//       displayName: ne_hotel.HotelName,
//       location: location(ne_hotel.MHID),
//       tags: [
//         {
//           tagId: 'hotel:mhid.' + ne_hotel.MHID,
//           source: 'master_hotel_mapping',
//           inherited: false,
//           active: true
//         }
//       ],
//       metadata: [
//         {
//           key: 'tripadvisor',
//           values: [ ne_hotel.TripadvisorLocationID ]
//         }
//       ]
//     });
//   }
// });
// var nordics_hotels_tags_file = './ne-hotles-tags.json';
// console.log('NE Mapped', ne_mapped.length);
// console.log('Sample:', JSON.stringify(ne_mapped[0], null, 2));
//
// var AWS = require('aws-sdk');
// AWS.config.region = 'eu-west-1';
// var lambda = new AWS.Lambda();
// var limit = ne_mapped.length;
// function callme () {
//   if(ne_mapped.length > 0) {
//     var record = ne_mapped.pop();
//     var params = {
//       FunctionName: 'lambda-taggable-createdocument-v1', // the lambda function we are going to invoke
//       InvocationType: 'RequestResponse',
//       LogType: 'Tail',
//       Payload: JSON.stringify(record)
//     };
//
//     lambda.invoke(params, function(err, data) {
//       if (err) {
//         console.log(' - - - - - - - - - - - - - - - ERROR:')
//         console.log(err);
//       } else {
//         console.log(data);
//       }
//       return callme();
//     });
//   }
//   else {
//     return true;
//   }
// }
// callme();
