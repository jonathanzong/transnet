#!/usr/bin/env node

require('dotenv').config()
var request = require('request-promise');
var jsonfile = require('jsonfile')
 
var outfile = './placeIdToData.json'

// path: array of [lat, lng]
function snapToRoads(path) {
  path = path.map(function(x) { return x.join(',')} ).join('|');
  var endpoint = "https://roads.googleapis.com/v1/snapToRoads?key=" +
                  process.env.PLACE_API_KEY + "&path=" + path;
  console.log("Requesting /snapToRoads");
  return request(endpoint);
} 

// placeId: string "placeId"
function placeDetails(placeId) {
  var endpoint = "https://maps.googleapis.com/maps/api/place/details/json?key=" + process.env.PLACE_API_KEY + "&placeid=" + placeId;
  console.log("Requesting /place/details for " + placeId);
  return request(endpoint);
}

var placeIdToData = {};
var osm = require("../data/oxford-osm.json");
osm.features.forEach(function(feature, idx) {
  // console.log(feature.properties.name);
  // console.log(feature.properties.maxspeed);
  // console.log(feature.properties.oneway);
  // console.log(feature.properties.highway);
  // console.log(feature.properties.lanes);
  // console.log(feature.properties.length);

  var coords = feature.geometry.coordinates.map(function(x) { return [x[1], x[0]] });
  setTimeout(function() {
    snapToRoads(coords)
      .then(function (body) {
        var json = JSON.parse(body);
        var points = json.snappedPoints;
        points.forEach(function(place, i) {
          if (!placeIdToData[place.placeId]) {
            placeIdToData[place.placeId] = {
              placeId: place.placeId,
              features: {},
              points: [],
            };
            // store place api details
            setTimeout(function() {
              placeDetails(place.placeId)
                .then(function (body) {
                  var json = JSON.parse(body);
                  placeIdToData[place.placeId].details = {
                    name: json.result.name,
                    formatted_address: json.result.formatted_address
                  }
                })
                .catch(function (err) {
                  console.log(err);
                });
            }, 25 * i);
          }
          // store roads api geometry
          placeIdToData[place.placeId].points.push(place.location);
          // store osm properties
          placeIdToData[place.placeId].features[feature.properties.osmid] = feature.properties;
        });
        if (idx == osm.features.length - 1) {
          // write to output
          jsonfile.writeFile(outfile, placeIdToData, function (err) {
            console.error(err)
          });
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  }, 25 * idx);
});



// placeDetails("ChIJf8V4V6nBdkgRp2t5duh8OsA")
//   .then(function (body) {
//     var json = JSON.parse(body);
//     console.log(json.result.name);
//     console.log(json.result.formatted_address);
//     console.log(json.result.geometry.location);
//   })
//   .catch(function (err) {
//     console.log(err);
//   });
