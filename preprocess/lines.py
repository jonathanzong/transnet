import json
import math
from collections import defaultdict

def distance(p0, p1):
  return math.sqrt((p0['x'] - p1['x'])**2 + (p0['y'] - p1['y'])**2)

with open('./output/segment-points-combined-oxfordshire.json') as data_file:    
  data = json.load(data_file)
  segs_by_road = defaultdict(list)
  for segment in data:
    road = segment['place_id'][0]['road']
    segs_by_road[road].append({
      "place_id": [x['place_id'] for x in segment['place_id']],
      "pts": segment['pts'],
      "first": segment['pts'][0],
      "last": segment['pts'][-1]
    })
  cutoff_dist_km = 5
  cutoff_dist = cutoff_dist_km * 10 # british national grid
  for road in segs_by_road:
    prev_segment_count = 0
    segment_count = len(segs_by_road[road])
    while prev_segment_count != segment_count:
      min_distance = float('inf')
      min_elem = None
      mode = ""
      for seg in segs_by_road[road]:
        for seg1 in segs_by_road[road]:
          if seg == seg1:
            continue
          dist = distance(seg['last'], seg1['first'])
          if dist < min_distance:
            min_distance = dist
            min_elem = seg1
            mode = "0l1f"
          dist = distance(seg1['last'], seg['first'])
          if dist < min_distance:
            min_distance = dist
            min_elem = seg1
            mode = "1l0f"
          dist = distance(seg['last'], seg1['last'])
          if dist < min_distance:
            min_distance = dist
            min_elem = seg1
            mode = "0l1l"
          dist = distance(seg['first'], seg1['first'])
          if dist < min_distance:
            min_distance = dist
            min_elem = seg1
            mode = "0f1f"
        #
        if min_distance > cutoff_dist or min_elem == None:
          continue
        if mode == "0l1f":
          seg['pts'].extend(min_elem['pts'])
          seg['last'] = min_elem['last']
          del segs_by_road[road][segs_by_road[road].index(min_elem)]
          break
        elif mode == "1l0f":
          min_elem['pts'].extend(seg['pts'])
          min_elem['last'] = seg['last']
          del segs_by_road[road][segs_by_road[road].index(seg)]
          break
        elif mode == "0l1l":
          min_elem['pts'].extend(reversed(seg['pts']))
          min_elem['last'] = seg['first']
          del segs_by_road[road][segs_by_road[road].index(seg)]
          break
        elif mode == "0f1f":
          min_elem['pts'].reverse()
          min_elem['pts'].extend(seg['pts'])
          min_elem['first'] = min_elem['last']
          min_elem['last'] = seg['last']
          del segs_by_road[road][segs_by_road[road].index(seg)]
          break
      #
      prev_segment_count = segment_count
      segment_count = len(segs_by_road[road])
    for seg in segs_by_road[road]:
      del seg['first']
      del seg['last']
  list_of_segs = []
  for road in segs_by_road:
    for seg in segs_by_road[road]:
      seg['road'] = road
      list_of_segs.append(seg)
  with open('./output/supercombine.json', 'w') as outfile:
    json.dump(list_of_segs, outfile, indent = 2)