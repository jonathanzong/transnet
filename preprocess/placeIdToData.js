#!/usr/bin/env node

require('dotenv').config()
var request = require('request-promise');
var jsonfile = require('jsonfile');
 
var outfile = './output/placeIdToData.json'

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
var osm = require("../data/oxfordshire-osm.json");
osm.features.forEach(function(feature, idx) {
  var coords = feature.geometry.coordinates.map(function(x) { return [x[1], x[0]] });
  // query roads api for placeId using OSM geometry
  setTimeout(function() {
    snapToRoads(coords)
      .then(function (body) {
        var json = JSON.parse(body);
        var points = json.snappedPoints;
        points.forEach(function(place, i) {
          // construct a map from placeId to data
          if (!placeIdToData[place.placeId]) {
            placeIdToData[place.placeId] = {
              placeId: place.placeId,
              features: {}
            };
            // store place api details
            setTimeout(function() {
              placeDetails(place.placeId)
                .then(function (body) {
                  var json = JSON.parse(body);
                  if (json.status == "NOT_FOUND") {
                    placeIdToData[place.placeId].details = {
                      status: "NOT_FOUND"
                    }
                  }
                  else {
                    placeIdToData[place.placeId].details = {
                      name: json.result.name,
                      formatted_address: json.result.formatted_address
                    }
                  }
                })
                .catch(function (err) {
                  console.log(err);
                });
            }, 60 * i);
          }
          if (!placeIdToData[place.placeId].features[feature.properties.osmid]) {
            placeIdToData[place.placeId].features[feature.properties.osmid] = {
              points: [],
              properties: {}
            };
          }
          // store previous point if necessary (in order to draw a line)
          if (i > 0 && place.placeId !== points[i - 1].placeId) {
            placeIdToData[place.placeId].features[feature.properties.osmid].points.push(points[i - 1].location);
          }
          // store roads api geometry
          placeIdToData[place.placeId].features[feature.properties.osmid].points.push(place.location);
          // store osm properties
          placeIdToData[place.placeId].features[feature.properties.osmid].properties = feature.properties;
        });
        if (idx == osm.features.length - 1) {
          // write to output
          setTimeout(function() {
            jsonfile.writeFile(outfile, placeIdToData, {spaces: 2}, function (err) {
              if (err) console.error(err);
              else console.log('wrote output to ' + outfile);
            });
          }, 1000);
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  }, 50 * idx);
});
