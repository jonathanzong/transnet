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
          if (!segment1.next) segment1.next = [];
          if (!segment2.prev) segment2.prev = [];
          if (segment1.next.indexOf(segment2.place_id[0].place_id) < 0)
            segment1.next.push(segment2.place_id[0].place_id);
          if (segment2.prev.indexOf(segment1.place_id[0].place_id) < 0)
            segment2.prev.push(segment1.place_id[0].place_id);
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
          if (!segment2.next) segment2.next = [];
          if (!segment1.prev) segment1.prev = [];
          if (segment2.next.indexOf(segment1.place_id[0].place_id) < 0)
            segment2.next.push(segment1.place_id[0].place_id);
          if (segment1.prev.indexOf(segment2.place_id[0].place_id) < 0)
            segment1.prev.push(segment2.place_id[0].place_id);
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
}

jsonfile.writeFile(outfile, segmentPoints, {spaces: 2}, function (err) {
  if (err) console.error(err);
  else console.log('wrote output to ' + outfile);
});
