var neo4j = require('neo4j');
var url = 'http://neo4j:GraphForIsearch@54.247.126.26/db/data/';
var db = new neo4j.GraphDatabase(url);

function query(query, params, column, cb) {
    function callback(err, results) {
        if (err || !results) throw err;
        if (!column) cb(results)
        else results.forEach(function(row) { cb(row[column]) });
    };
    db.cypher({ query: query, params: params}, callback);
}

//Deleta all nodes
// query('MATCH (n) DETACH DELETE n', null, null, function (result) {
//   console.log(result);
// })

module.exports = function create(doc, callback) {
  console.log(doc._id)
  var nodeType = doc._id.split(':')[0];
  var nodeSubType = doc._id.split(':')[1].split('.')[0];

  var properties = '{' +
    'id:"' + doc._id + '",' + // see: lambda-neo4j-indexer/issues/2
    'name:"' +  doc.displayName.replace(/"/g, '\\"') + '",' +
    'active:"' +  doc.active + '",' +
    'nodeType:"' + nodeType + '",' +
    'nodeSubType:"' + nodeSubType + '"' +
  '}';

  // Insert the node
  var q = "create (n:" + nodeType + ':' + nodeSubType + ' ' + properties + ")";
  // console.log(q);
  // console.log(' - - - - - - - - - - - - - - - - - - - - - - ');
  query(q, null, null, function (result) {
    // console.log(result);
    // // Insert the relationships
    var count = 0;
    if(doc.tags && doc.tags.length > 0) {
      doc.tags.forEach(function(tag) {
        console.log(doc._id,':',tag.tagId);
        var fromId = doc._id;
        var fromNodeType = fromId.split(':')[0];
        var toId = tag.tagId;
        var toNodeType = toId.split(':')[0];
        var active = tag.active || false;
        var relType = 'out';

        switch(toNodeType) {
          case 'geo':
            relType = 'locatedIn';
            break;
          case 'hotel':
            if (toId.split(':')[1].split('.')[0]!= 'mhid') {
              relType = 'hotelMapping'
            }
            else {
              relType = 'hotel'
            }
            break;
          case 'tile':
            relType = 'tile';
            break;
          case 'marketing':
            relType = 'marketing';
            break;
          case 'amenity':
            relType = 'amenity';
            break;
        };

        var q = "MATCH (a:" + fromNodeType + "),(b:" + toNodeType + ")" +
                "WHERE a.id = '" + fromId + "' AND b.id = '" + toId + "'" +
                "CREATE (a)-[r:" + relType + " {active: '" + active + "', targetType: '" + toNodeType + "'}]->(b) RETURN r";

        return query(q, null, null, function(res) {
          // console.log(count, res);
          if(count++ === doc.tags.length -1) { // final tag
            callback(res);
          }
        });
      });
    } else {
      callback(result);
    }
  }); // END query
}
