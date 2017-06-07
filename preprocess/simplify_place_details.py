import json

with open('./output/placeIdToData.json') as data_file:    
  data = json.load(data_file)
  stuff = {}
  for seg in list(data.values()):
    try:
      stuff[seg['placeId']] = {'name' : seg['details']['name'], 'location': seg['features'].values()[0]['points'][0]}
    except KeyError:
      print seg['details']
  with open('./output/place_details.json', 'w') as outfile:
    json.dump(stuff, outfile)