#!/usr/bin/env node

var GeoJSON = require('geojson');
var jsonfile = require('jsonfile');

var name = "A420";

var outfile = './output/filtered-'+name+'-segment-points-combined-oxfordshire-geo.json'

var infile = require("./output/segment-points-combined-oxfordshire-geo.json");

infile.features = infile.features.filter(function(e) {
  return e.properties.place_id[0].road == name;
})

jsonfile.writeFile(outfile, infile, {spaces: 2}, function (err) {
  if (err) console.error(err);
  else console.log('wrote output to ' + outfile);
});

