#!/usr/bin/env node

require('dotenv').config()
var request = require('request-promise');
var jsonfile = require('jsonfile');

var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('../data/unique_place_Ids.csv')
});

var placeIdToData_part = Object.keys(require('./output/place_details-part1.json'));
placeIdToData_part = placeIdToData_part.concat(Object.keys(require('./output/place_details-part2.json')));
placeIdToData_part = placeIdToData_part.concat(Object.keys(require('./output/place_details-part3.json')));
placeIdToData_part = placeIdToData_part.concat(Object.keys(require('./output/place_details-part4.json')));
placeIdToData_part = placeIdToData_part.concat(Object.keys(require('./output/place_details-part5.json')));
placeIdToData_part = placeIdToData_part.concat(Object.keys(require('./output/place_details-part6.json')));
placeIdToData_part = placeIdToData_part.concat(Object.keys(require('./output/place_details-part7.json')));
placeIdToData_part = placeIdToData_part.concat(Object.keys(require('./output/place_details-part8.json')));
var placeIdToData = {};
var i = 0;
var failed_part = require('./output/failed-part.json');
// var failed_part2 = require('./output/failed-part1.json');
// for (var key in failed_part2) {
//   if (failed_part[key])
//     failed_part[key] = failed_part[key].concat(failed_part2[key]);
//   else failed_part[key] = failed_part2[key];
// }
// for (var key in failed_part) {
//   failed_part[key] = uniq(failed_part[key])
// }
var failed = {};

// jsonfile.writeFile('./output/failed'+(Math.round(Math.random()*100000))+'.json', failed_part, {spaces: 2}, function (err) {
//   if (err) console.error(err);
// });

lineReader.on('line', function (line) {
  if (placeIdToData_part.indexOf(line) >= 0) {
    console.log('already have '+line);
    return;
  }
  if (failed_part["NOT_FOUND"].indexOf(line) >= 0) {
    console.log('already didnt find '+line);
    return;
  }
  if (failed_part["400"].indexOf(line) >= 0 || failed_part["undefined"].indexOf(line) >= 0) {
    console.log('already errored '+line);
    return;
  }
  setTimeout(function() {
    placeDetails(line).then(function (body) {
      var json = JSON.parse(body);
      if (json.status == "NOT_FOUND") {
        console.log(line + " NOT_FOUND");
        if (!failed["NOT_FOUND"]) failed["NOT_FOUND"] = [];
        failed["NOT_FOUND"].push(line);
        jsonfile.writeFile('./output/failed'+(Math.round(Math.random()*100000))+'.json', failed, {spaces: 2}, function (err) {
          if (err) console.error(err);
        });
      }
      else {
        placeIdToData[line] = json.result;
        console.log('wrote details for ' + line);
        jsonfile.writeFile('./output/place_details'+(Math.round(Math.random()*100000))+'.json', placeIdToData, {spaces: 2}, function (err) {
          if (err) console.error(err);
        });
      }
    })
    .catch(function (err) {
      console.log(line+ " error " +err.statusCode);
      if (!failed[""+err.statusCode]) failed[""+err.statusCode] = [];
      failed[""+err.statusCode].push(line);
      jsonfile.writeFile('./output/failed'+(Math.round(Math.random()*100000))+'.json', failed, {spaces: 2}, function (err) {
        if (err) console.error(err);
      });
    });
  }, (100 * i++));
});

// placeId: string "placeId"
function placeDetails(placeId) {
  var endpoint = "https://maps.googleapis.com/maps/api/place/details/json?key=" + process.env.PLACE_API_KEY + "&placeid=" + placeId;
  // console.log("Requesting /place/details for " + placeId);
  return request(endpoint);
}

function uniq(a) {
    var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];

    return a.filter(function(item) {
        var type = typeof item;
        if(type in prims)
            return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
        else
            return objs.indexOf(item) >= 0 ? false : objs.push(item);
    });
}