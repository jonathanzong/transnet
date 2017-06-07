#!/usr/bin/env node

var GeoJSON = require('geojson');
var jsonfile = require('jsonfile');
var proj4 = require('proj4');

var outfile = './output/supercombine-neighbors-combined-fixed-geo.json'

var infile = require("./output/supercombine-neighbors-combined-fixed.json");

proj4.defs("EPSG:27700","+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs");

for (var i = 0; i < infile.length; i++) {
  infile[i].pts = infile[i].pts.map(function(e) {
    return proj4("EPSG:27700", "WGS84", [e.x, e.y]);
  });
}

GeoJSON.parse(infile, {'LineString': 'pts'}, function(geojson) {
  jsonfile.writeFile(outfile, geojson, {spaces: 2}, function (err) {
    if (err) console.error(err);
    else console.log('wrote output to ' + outfile);
  });
});

// jsonfile.writeFile(outfile, combined, {spaces: 2}, function (err) {
//   if (err) console.error(err);
//   else console.log('wrote output to ' + outfile);
// });

