var fs = require('fs');
var input_filename = './date-20160323-time-105609-42042-hotels.csv';
var output_filename = './mhid-data.json';
var data = fs.readFileSync(input_filename).toString();
var rows = CSVToArray(data, ';');
console.log(rows[rows.length-1]);
console.log(rows[0]);
console.log(rows.length-1);

var fields = rows[0]; // first row of the file are field names
var data = [];

for(var i = 1; i < rows.length; i++) { // last row is empty
  var row = rows[i];
  var record = {};
  row.forEach(function (value, index) {
    record[fields[index]] = (value === 'null') ? null : value.trim();
  });
  data.push(record);
}
fs.writeFileSync(output_filename, JSON.stringify(data, null, 2));
// console.log(data[0]);
// console.log('TOTAL: (blanks + data)', blanks.length +' + ' + data.length + ' =',  blanks.length + data.length )
console.log('done. (' + data.length + ' entries)' )



/**
 * CSVToArray parses any String of Data including '\r' '\n' characters,
 * and returns an array with the rows of data.
 * @param {String} CSV_string - the CSV string you need to parse
 * @param {String} delimiter - the delimeter used to separate fields of data
 * @returns {Array} rows - rows of CSV where first row are column headers
 * adapted from: http://goo.gl/V6g5Jy
 */
function CSVToArray (CSV_string, delimiter) {
   delimiter = (delimiter || ","); // user-supplied delimeter or default comma

   var pattern = new RegExp( // regular expression to parse the CSV values.
     ( // Delimiters:
       "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
       // Quoted fields.
       "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
       // Standard fields.
       "([^\"\\" + delimiter + "\\r\\n]*))"
     ), "gi"
   );

   var rows = [[]];  // array to hold our data. First row is column headers.
   // array to hold our individual pattern matching groups:
   var matches = false; // false if we don't find any matches
   // Loop until we no longer find a regular expression match
   while (matches = pattern.exec( CSV_string )) {
       var matched_delimiter = matches[1]; // Get the matched delimiter
       // Check if the delimiter has a length (and is not the start of string)
       // and if it matches field delimiter. If not, it is a row delimiter.
       if (matched_delimiter.length && matched_delimiter !== delimiter) {
         // Since this is a new row of data, add an empty row to the array.
         rows.push( [] );
       }
       var matched_value;
       // Once we have eliminated the delimiter, check to see
       // what kind of value was captured (quoted or unquoted):
       if (matches[2]) { // found quoted value. unescape any double quotes.
        matched_value = matches[2].replace(
          new RegExp( "\"\"", "g" ), "\""
        );
       } else { // found a non-quoted value
         matched_value = matches[3];
       }
       // Now that we have our value string, let's add
       // it to the data array.
       rows[rows.length - 1].push(matched_value);
   }
   return rows; // Return the parsed data Array
}
