# transnet
transport network resilience

## Documentation

### OSM Data

The output of the following steps is already included in `/data`.

1. Acquire OSM street network for Oxfordshire as shapefile using [OSMnx](https://github.com/gboeing/osmnx)  

   In project root, run:

    ```python
    import osmnx as ox
    place = 'Oxfordshire, UK'
    G = ox.graph_from_place(place, network_type='drive', truncate_by_edge=True)
    ox.save_graph_shapefile(G, filename='oxfordshire-osm-shapefile')
    ```

2. Package the contents of `/data/oxfordshire-osm-shapefile/edges` into a .zip file (oxfordshire-osm-shapefile.zip)  

    ```
    zip ./data/oxfordshire-osm-shapefile.zip ./data/oxfordshire-osm-shapefile/edges/*
    rm -rf ./data/oxfordshire-osm-shapefile/
    ```

3. Go to [mapshaper.org](http://www.mapshaper.org/) and import the .zip file. Export the file as GeoJSON (oxfordshire-osm.json)


### Matching OSM geometry Google placeIDs

The output of the following steps is already included in `/preprocess/output`.

0. cd to `/preprocess`. Install packages for the preprocess scripts. Requires `node` and `npm`

1. Run `placeIdToData` which reads the OSM GeoJSON, assigns a Google placeID to each segment, and outputs a json dictionary keyed by placeID to `/preprocess/output/placeIdToData.json`. (Note that at this point there could be many OSM segments per placeID and/or many placeIDs per OSM segment.)  

    ```
    node placeIdToData.js
    ```

2. Run `dataToGeometry` which reads the output of the previous script and consolidates the data so that each placeID is associated with one segment, writing the output as GeoJSON to `/preprocess/output/dataToGeometry.json`

