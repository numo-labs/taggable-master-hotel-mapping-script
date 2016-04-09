var fs = require('fs');
var input_filename = './data/IS-Hotels-DA-v2.csv';
var output_filename = './data/ne_hotels_wvitemid_map.json';

var rows = fs.readFileSync(input_filename).toString().split('\r\n');
var fields = rows[0].split(','); // first row of the file are field names
var blanks = []; // in case you need the rows that don't have MHID
var data = [];

for(var i = 1; i < rows.length; i++) {
  var row = rows[i].split(',');
  if(row[1].length === 0) {
    blanks.push(row);
  } else {
    var record = {};
    row.forEach(function (value, index) {
      record[fields[index]] = value.trim(); // remove excess whitespace
    });
    data.push(record);
  }
}
// console.log('Rows:', rows.length-1); // expect 2313
// console.log('Field Names:', fields);
// console.log(blanks);
// console.log('Blanks:', blanks.length);
// console.log(data[0]);
// console.log('TOTAL: (blanks + data)', blanks.length +' + ' + data.length + ' =',  blanks.length + data.length )
console.log('done. (' + data.length + ' entries)' )

var ne_map = {}; // map of ne_hotels by their NE Hotel ID
data.forEach(function (h) {
  ne_map[h.WVitemID] = h;
});

// this allows us to lookup an NE Hotel by its NE Hotel ID
fs.writeFileSync(output_filename, JSON.stringify(ne_map, null, 2));