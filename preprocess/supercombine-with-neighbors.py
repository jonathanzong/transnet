import json
import math
from collections import defaultdict

def distance(p0, p1):
  return math.sqrt((p0['x'] - p1['x'])**2 + (p0['y'] - p1['y'])**2)

cutoff_dist_km = 5
cutoff_dist = cutoff_dist_km * 10 # british national grid

with open('./output/supercombine-neighbors-combined.json') as data_file:    
  segments = json.load(data_file)

  for segment in segments:
    segment["first"] = segment['pts'][0]
    segment["last"] = segment['pts'][-1]
  
  for segment in segments:
    for segment1 in segments:
      if segment['road_id'] == segment1['road_id']:
        continue
      dist = min([distance(segment['last'], segment1['first']),
        distance(segment1['last'], segment['first']),
        distance(segment1['first'], segment['first']),
        distance(segment1['last'], segment['last'])])
      if dist > cutoff_dist:
        continue
      key =  'neighbors_same' if segment1['road'] == segment['road'] else 'neighbors_diff'
      if not key in segment:
        segment[key] = []
      if not key in segment1:
        segment1[key] = []
      if not segment1['road_id'] in segment[key]:
        segment[key].append(segment1['road_id'])
      if not segment['road_id'] in segment1[key]:
        segment1[key].append(segment['road_id'])

  for segment in segments:
    del segment["first"]
    del segment["last"]

  with open('./output/supercombine-neighbors-combined-fixed.json', 'w') as outfile:
    json.dump(segments, outfile, indent = 2)