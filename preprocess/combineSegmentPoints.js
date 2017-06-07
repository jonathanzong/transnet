#!/usr/bin/env node

var GeoJSON = require('geojson');
var jsonfile = require('jsonfile');

var outfile = './output/segment-points-combined-oxfordshire.json'

// return string to compare points for equality
function coordKey(latlng) {
  return latlng.x.toFixed(7) + "," + latlng.y.toFixed(7);
}

var segmentPoints = require("../data/segment-points-oxfordshire.json");

var combined = [];

var roadIdCounter = 1;

var length = segmentPoints.length;
var prevLength = 0;

function allNamesMatch(segment1, segment2) {
  var namesMatch1 = segment1.place_id.every(function(elem) {
    return elem.road === segment1.place_id[0].road;
  });
  var namesMatch2 = segment2.place_id.every(function(elem) {
    return elem.road === segment2.place_id[0].road;
  });
  return namesMatch1 && namesMatch2 &&
         segment1.place_id[0].road == segment2.place_id[0].road;
}

// make multiple passes until no change
while (length != prevLength) {
  console.log(length + " segments");
  for (var i = 0; i < segmentPoints.length; i++) {
    var segment1 = segmentPoints[i];
    for (var j = i + 1; j < segmentPoints.length; j++) {
      var segment2 = segmentPoints[j];

      if (coordKey(segment1.pts[segment1.pts.length - 1]) ==
          coordKey(segment2.pts[0])) {
        if (allNamesMatch(segment1, segment2)) {
          // merge roads
          segmentPoints[i] = {
            "place_id": segment1.place_id.concat(segment2.place_id),
            "pts": segment1.pts.slice(0, segment1.pts.length - 1).concat(segment2.pts)
          };
          // delete segment2
          segmentPoints.splice(j, 1);
        }
        else {
          // connect roads
          if (!segment1.road_id) segment1.road_id = roadIdCounter++;
          if (!segment2.road_id) segment2.road_id = roadIdCounter++;
          if (!segment1.neighbors) segment1.neighbors = [];
          if (!segment2.neighbors) segment2.neighbors = [];
          if (segment1.neighbors.indexOf(segment2.road_id) < 0)
            segment1.neighbors.push(segment2.road_id);
          if (segment2.neighbors.indexOf(segment1.road_id) < 0)
            segment2.neighbors.push(segment1.road_id);
        }

        break;
      }
      else if (coordKey(segment2.pts[segment2.pts.length - 1]) ==
          coordKey(segment1.pts[0])) {
        if (allNamesMatch(segment1, segment2)) {
          // merge roads
          segmentPoints[i] = {
            "place_id": segment2.place_id.concat(segment1.place_id),
            "pts": segment2.pts.slice(0, segment2.pts.length - 1).concat(segment1.pts)
          };
          // delete segment2
          segmentPoints.splice(j, 1);
        }
        else {
          // connect roads
          if (!segment1.road_id) segment1.road_id = roadIdCounter++;
          if (!segment2.road_id) segment2.road_id = roadIdCounter++;
          if (!segment1.neighbors) segment1.neighbors = [];
          if (!segment2.neighbors) segment2.neighbors = [];
          if (segment1.neighbors.indexOf(segment2.road_id) < 0)
            segment1.neighbors.push(segment2.road_id);
          if (segment2.neighbors.indexOf(segment1.road_id) < 0)
            segment2.neighbors.push(segment1.road_id);
        }

        break;
      }

    }
    combined.push(segmentPoints[i]);
  }
  // iterate
  prevLength = length;
  length = combined.length;
  segmentPoints = combined;
  combined = [];
}

for (var i = 0; i < segmentPoints.length; i++) {
  // remove duplicate points
  var keys = segmentPoints[i].pts.map(function(e) {
    return coordKey(e);
  });
  segmentPoints[i].pts = segmentPoints[i].pts.filter(function(item, pos, ary) {
    return keys.indexOf(coordKey(item)) == pos;
  });  
  // move road names
  var road = segmentPoints[i].place_id[0].road;
  segmentPoints[i].place_id = segmentPoints[i].place_id.map(function(e) {
    return e.place_id;
  });
  segmentPoints[i].road = road;
  // add road ids if not already
  if (!segmentPoints[i].road_id) segmentPoints[i].road_id = roadIdCounter++;
}

jsonfile.writeFile(outfile, segmentPoints, {spaces: 2}, function (err) {
  if (err) console.error(err);
  else console.log('wrote output to ' + outfile);
});
