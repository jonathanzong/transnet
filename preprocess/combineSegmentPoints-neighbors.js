#!/usr/bin/env node

var GeoJSON = require('geojson');
var jsonfile = require('jsonfile');

var outfile = './output/supercombine-neighbors-combined.json'

// return string to compare points for equality
function coordKey(latlng) {
  return latlng.x.toFixed(7) + "," + latlng.y.toFixed(7);
}

var segmentPoints = require("./output/supercombine-neighbors.json");

var combined = [];

var length = segmentPoints.length;
var prevLength = 0;

for (var i = 0; i < segmentPoints.length; i++) {
  // road ids are arrays now, sorry
  segmentPoints[i].road_id = [ segmentPoints[i].road_id ];
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
        if (segment1.road == segment2.road) {
          // merge roads
          segmentPoints[i]["place_id"] = segment1.place_id.concat(segment2.place_id);
          segmentPoints[i]["pts"] = segment1.pts.slice(0, segment1.pts.length - 1).concat(segment2.pts);
          if (!segment1.road_id) {
            console.log(JSON.stringify(segment1));
          }
          segmentPoints[i]["road_id"] = segment1.road_id.concat(segment2.road_id);
          if (segment1.neighbors_same || segment2.neighbors_same) {
            if (!segment1.neighbors_same) segment1.neighbors_same = [];
            if (!segment2.neighbors_same) segment2.neighbors_same = [];
            var same = segment1.neighbors_same.concat(segment2.neighbors_same).filter(function(e) {
              return segment1.road_id.indexOf(e) < 0 && segment2.road_id.indexOf(e) < 0;
            });
            if (same.length) segmentPoints[i]["neighbors_same"]  = same;
          }
          if (segment1.neighbors_diff || segment2.neighbors_diff) {
            if (!segment1.neighbors_diff) segment1.neighbors_diff = [];
            if (!segment2.neighbors_diff) segment2.neighbors_diff = [];
            segmentPoints[i]["neighbors_diff"] = segment1.neighbors_diff.concat(segment2.neighbors_diff);
          }
          // delete segment2
          segmentPoints.splice(j, 1);
        }
        else {
          // connect roads
          if (!segment1.neighbors_diff) segment1.neighbors_diff = [];
          if (!segment2.neighbors_diff) segment2.neighbors_diff = [];
          if (segment1.neighbors_diff.indexOf(segment2.road_id) < 0)
            segment1.neighbors_diff = segment1.neighbors_diff.concat(segment2.road_id);
          if (segment2.neighbors_diff.indexOf(segment1.road_id) < 0)
            segment2.neighbors_diff = segment2.neighbors_diff.concat(segment1.road_id);
        }

        break;
      }
      else if (coordKey(segment2.pts[segment2.pts.length - 1]) ==
          coordKey(segment1.pts[0])) {
        if (segment1.road == segment2.road) {
          // merge roads
          segmentPoints[i]["place_id"] = segment2.place_id.concat(segment1.place_id);
          segmentPoints[i]["pts"] = segment2.pts.slice(0, segment2.pts.length - 1).concat(segment1.pts)
          segmentPoints[i]["road_id"] = segment1.road_id.concat(segment2.road_id);
          if (segment1.neighbors_same || segment2.neighbors_same) {
            if (!segment1.neighbors_same) segment1.neighbors_same = [];
            if (!segment2.neighbors_same) segment2.neighbors_same = [];
            var same = segment1.neighbors_same.concat(segment2.neighbors_same).filter(function(e) {
              return segment1.road_id.indexOf(e) < 0 && segment2.road_id.indexOf(e) < 0;
            });
            if (same.length) segmentPoints[i]["neighbors_same"]  = same;
          }
          if (segment1.neighbors_diff || segment2.neighbors_diff) {
            if (!segment1.neighbors_diff) segment1.neighbors_diff = [];
            if (!segment2.neighbors_diff) segment2.neighbors_diff = [];
            segmentPoints[i]["neighbors_diff"] = segment1.neighbors_diff.concat(segment2.neighbors_diff);
          }
          // delete segment2
          segmentPoints.splice(j, 1);
        }
        else {
          // connect roads
          if (!segment1.neighbors_diff) segment1.neighbors_diff = [];
          if (!segment2.neighbors_diff) segment2.neighbors_diff = [];
          if (segment1.neighbors_diff.indexOf(segment2.road_id) < 0)
            segment1.neighbors_diff = segment1.neighbors_diff.concat(segment2.road_id);
          if (segment2.neighbors_diff.indexOf(segment1.road_id) < 0)
            segment2.neighbors_diff = segment2.neighbors_diff.concat(segment1.road_id);
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

var road_id_counter = 6000;

for (var i = 0; i < segmentPoints.length; i++) {
  // remove duplicate points
  var keys = segmentPoints[i].pts.map(function(e) {
    return coordKey(e);
  });
  segmentPoints[i].pts = segmentPoints[i].pts.filter(function(item, pos, ary) {
    return keys.indexOf(coordKey(item)) == pos;
  });
  // fix combined road ids
  if (segmentPoints[i].road_id.length == 1) {
    segmentPoints[i].road_id = segmentPoints[i].road_id[0];
  }
  else {
    var list = segmentPoints[i].road_id;
    segmentPoints[i].road_id = road_id_counter++;

    for (var j = 0; j < segmentPoints.length; j++) {
      for (var x = 0; x < list.length; x++) {
        if (segmentPoints[j].neighbors_diff && segmentPoints[j].neighbors_diff.indexOf(list[x]) >= 0) {
          segmentPoints[j].neighbors_diff = segmentPoints[j].neighbors_diff.filter(function(e) {
            return list.indexOf(e) < 0;
          });
          if (segmentPoints[j].neighbors_diff.indexOf(segmentPoints[i].road_id) < 0)
            segmentPoints[j].neighbors_diff.push(segmentPoints[i].road_id);
          break;
        }
        if (segmentPoints[j].neighbors_same && segmentPoints[j].neighbors_same.indexOf(list[x]) >= 0) {
          segmentPoints[j].neighbors_same = segmentPoints[j].neighbors_same.filter(function(e) {
            return list.indexOf(e) < 0;
          });
          if (segmentPoints[j].neighbors_same.indexOf(segmentPoints[i].road_id) < 0)
            segmentPoints[j].neighbors_same.push(segmentPoints[i].road_id);
          if (i == j && segmentPoints[j].neighbors_same.length == 1) {
            delete segmentPoints[j].neighbors_same;
          }
          break;
        }
      }
    }
  }
  // remove duplicate ids from neighbors
  if (segmentPoints[i].neighbors_diff) {
    segmentPoints[i].neighbors_diff = segmentPoints[i].neighbors_diff.filter(function(item, pos, ary) {
      return ary.indexOf(item) == pos;
    });
  }

  if (segmentPoints[i].neighbors_same) {
    segmentPoints[i].neighbors_same = segmentPoints[i].neighbors_same.filter(function(item, pos, ary) {
      return ary.indexOf(item) == pos;
    });
  }
}

jsonfile.writeFile(outfile, segmentPoints, {spaces: 2}, function (err) {
  if (err) console.error(err);
  else console.log('wrote output to ' + outfile);
});
