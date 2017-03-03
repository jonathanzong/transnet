#!/usr/bin/env node

var GeoJSON = require('geojson');
var jsonfile = require('jsonfile');

var outfile = './output/dataToGeometry.json'

function values(obj) {
  return Object.keys(obj).map(function(k) { return obj[k] });
}

// return string to compare points for equality
function coordKey(latlng) {
  return latlng.latitude.toFixed(7) + "," + latlng.longitude.toFixed(7);
}

// returns true if cp lies between p1 and p2 (all lat/lng objects)
function isPointBetween(cp, p1, p2) {
  var v1 = {
    latitude: p2.latitude - p1.latitude,
    longitude: p2.longitude - p1.longitude
  };
  var v2 = {
    latitude: cp.latitude - p1.latitude,
    longitude: cp.longitude - p1.longitude
  };
  var v3 = {
    latitude: cp.latitude - p2.latitude,
    longitude: cp.longitude - p2.longitude
  };
  var dotv2v1 = v2.latitude * v1.latitude + v2.longitude * v1.longitude;
  var dotv3v1 = v3.latitude * v1.latitude + v3.longitude * v1.longitude;
  return (dotv2v1 > 0 && dotv3v1 < 0);
}

var placeIdToData = require("./output/placeIdToData.json");
var geometry = values(placeIdToData).map(function(place) {
  place.points = values(place.features).map(function(feature) {
    return feature.points;
  });
  place.properties = values(place.features).map(function(feature) {
    return feature.properties;
  });
  delete place.features;

  // merge points
  var pts = place.points[0];
  for (var i = 1; i < place.points.length; i++) {
    var points = place.points[i];
    if (points.length == 1) {
      var point = points[0];
      var coord = coordKey(point);
      if (coord == coordKey(pts[0])) continue;
      if (coord == coordKey(pts[pts.length - 1])) continue;
      // point is before pts
      if (pts.length > 1 && isPointBetween(pts[0], point, pts[1])) {
        pts.unshift(point);
      }
      // point is after pts
      else if (pts.length > 1 && isPointBetween(pts[pts.length - 1], pts[pts.length - 2], point)) {
        pts.push(point);
      }
      else {
        for (var j = 0; j < pts.length - 1; j++) {
          // insert into points if between
          if (isPointBetween(point, pts[j], pts[j + 1])) {
            pts.splice(j + 1, 0, point);
            break;
          }
        }
      }
    }
    else { // points.length > 1
      // points is immediately after pts
      if (coordKey(points[0]) == coordKey(pts[pts.length - 1])) {
        points.shift();
        pts = pts.concat(points);
      }
      // points is immediately before pts
      else if (coordKey(points[points.length - 1]) == coordKey(pts[0])) {
        points.pop();
        pts = points.concat(pts);
      }
      else {
        // points is before pts
        if (pts.length > 1 && isPointBetween(points[points.length - 1], points[points.length - 2], pts[0])) {
          pts = points.concat(pts);
        }
        // points is after pts
        else if (pts.length > 1 && isPointBetween(points[0], pts[pts.length - 1], points[1])) {
          pts = pts.concat(points);
        }
        else {
          for (var j = 0; j < pts.length - 1; j++) {
            // insert into points if between
            if (isPointBetween(points[0], pts[j], pts[j + 1]) &&
                isPointBetween(points[points.length - 1], pts[j], pts[j + 1])) {
              var args = [j + 1, 0].concat(points);
              Array.prototype.splice.apply(pts, args);
              break;
            }
          }
        }
      }
    }
  }
  place.points = pts.map(function(latlng) {
    return [latlng.latitude, latlng.longitude];
  });
  console.log(place);
  return place;
});



GeoJSON.parse(geometry, {'LineString': 'points'}, function(geojson) {
  jsonfile.writeFile(outfile, geojson, {spaces: 2}, function (err) {
    console.error(err);
  });
})