var fs = require('fs');
var filename = './IS-Hotels-DA-v1.csv';
var rows = fs.readFileSync(filename).toString().split('\r\n');
var fields = rows[0].split(','); // first row of the file are field names
// console.log('Rows:', rows.length-1); // expect 2313
// console.log('Field Names:', fields);

var blanks = [];
var data = [];

for(var i = 1; i < rows.length; i++) {
  var row = rows[i].split(',');
  if(row[1].length === 0) {
    blanks.push(row);
  } else {
    var record = {};
    row.forEach(function (value, index) {
      record[fields[index]] = value.trim();
    });
    data.push(record);
  }
}
// console.log(blanks);
// console.log('Blanks:', blanks.length);
// console.log(data[0]);
console.log('TOTAL: (blanks + data)', blanks.length +' + ' + data.length + ' =',  blanks.length + data.length )

var output_filename = './ne-wvidemid-to-mhid-mapping.json';
fs.writeFileSync(output_filename, JSON.stringify(data, null, 2));
