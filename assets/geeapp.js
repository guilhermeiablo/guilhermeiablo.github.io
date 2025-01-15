var palettes = require('users/gena/packages:palettes');



//////////////// MAIN PANEL SET UP /////////////////////////////////////////////////////////////

var mainPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical',true),
  style: {width: '30%', padding:'20px'}
});


ui.root.add(mainPanel);

var titleLabel = ui.Label({
  value: 'FABLE Zonal Statistics Extractor',
  style: {fontWeight: 'bold', fontSize: '30px', color: 'black'}
});
mainPanel.add(titleLabel);


var countryLabel = ui.Label({
  value: 'Pick a country'
});
mainPanel.add(countryLabel);

var countries = ["Afghanistan","Albania","Algeria","American Samoa","Angola","Anguilla","Antigua & Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia & Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory","British Virgin Islands","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Côte d'Ivoire","Cambodia","Cameroon","Campbell Islands","Canada","Cape Verde","Cayman Islands","Central African Republic","Chad","Chile","China","Cocos Islands","Colombia","Comoros","Congo","Cook Islands","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Democratic People's Republic of Korea","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Greenland","Grenada","Guadeloupe","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard Island and McDonald Islands","Honduras","Hungary","Iceland","India","Indonesia","Iran (Islamic Republic of)","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Jammu-Kashmir","Japan","Jarvis Island","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Lao People's Democratic Republic","Latvia","Lebanon","Lesotho","Liberia","Libyan Arab Jamahiriya","Lithuania","Madagascar","Madeira Islands","Malawi","Malaysia","Mali","Malta","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Midway Islands","Moldova, Republic of","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","Netherlands Antilles","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Niue","Norfolk Island","Northern Mariana Islands","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Pitcairn","Poland","Puerto Rico","Qatar","Republic of Korea","Reunion","Russian Federation (European portion)","Russian Federation (Far Eastern FD)","Russian Federation (Siberian FD)","Russian Federation (Urals FD)","Rwanda","Saint Lucia","Saint Vincent and the Grenadines","Samoa","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syrian Arab Republic","Tajikistan","Tanzania","Thailand","The former Yugoslav Republic of Macedonia","Timor-Leste","Togo","Tokelau","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Turks and Caicos Islands","U.K. of Great Britain and Northern Ireland","Uganda","Ukraine","United Arab Emirates","United Republic of Tanzania","United States of America","Uruguay","US Virgin Islands","Uzbekistan","Vanuatu","Venezuela","Vietnam","West Bank","Western Sashara","Yemen","Zambia","Zimbabwe"];

var countrySelect = ui.Select({
  value: 'Afghanistan',
  items: countries,
  style: {width: '100%'}
});
mainPanel.add(countrySelect);


var layerLabel = ui.Label({
  value: 'Pick a layer'
});
mainPanel.add(layerLabel);

var layers = ['HILDA+ LandCover 2015','HILDA LandCover Change 2015-2019','Gaez+ Crop Distribution (2015)','GLW4 World Gridded Livestock (2020)','Travel time to major cities','Forest Management','Population 2020','Protected Areas', 'Altitude (Copernicus)', 'Slope (Copernicus)','COPERNICUS LandCover 2019'];

var layerSelect = ui.Select({
  value: 'HILDA+ LandCover 2015',
  items: layers,
  style: {width: '100%'}
});
mainPanel.add(layerSelect);

var legendPanel = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '5px;'
  }
});

// Creates a color bar thumbnail image for use in legend from the given color palette
function makeColorBarParams(palette) {
  return {
    bbox: [0, 0, 1, 0.1],
    dimensions: '100x10',
    format: 'png',
    min: 0,
    max: 1,
    palette: palette,
  };
}





////////////////// DECLARING SOURCE DATA /////////////////////////////////////////////////////////

//Get road density pixels
var grid50 = ee.FeatureCollection('projects/ee-guilhermeiablo/assets/boundaries/grid50_updated');

//Copernicus landcover
var landcover = ee.Image('COPERNICUS/Landcover/100m/Proba-V-C3/Global/2019').select('discrete_classification');
var copernicus_palette = ['282828','ffbb22','ffff4c','f096ff','fa0000','b4b4b4','f0f0f0','0032c8','0096a0','fae6a0','58481f','009900','70663e','00cc00','4e751f','007800','666000','8db400','8d7400','a0dc00','929900','648c00','000080'];
var copernicus_classes = ["0", "20", "30", "40", "50", "60", "70", "80", "90", "100", "111", "112", "113", "114", "115", "116", "121", "122", "123", "124", "125", "126", "200"];


//Access to major cities
var majorcities = ee.Image('projects/ee-guilhermeiablo/assets/access_city_50k');
var majorcities_palette = ['green','yellow','red'];
var traveltime_palette = palettes.colorbrewer.RdYlGn[9].reverse();
var traveltime_vis = {min: 0, max: 2500, palette: traveltime_palette};

//Forest management
var forestmanagement = ee.Image('projects/ee-guilhermeiablo/assets/Forest_Management');
forestmanagement = forestmanagement.updateMask(forestmanagement.neq(128));
var forestmanagement_ogclasses = [11, 20, 31, 32, 40, 53];
var forestmanagement_classes =   [ 1,  2,  3,  4,  5,  6];
forestmanagement = forestmanagement.remap({
  from: forestmanagement_ogclasses,
  to: forestmanagement_classes,
  defaultValue: 0,
  bandName: 'b1'
});
var forestmanagement_palette = ["green", "D1E6D9", "DEE6D1", "orange", "red",  "purple"];

// WorldPop

var worldpop_raw = ee.ImageCollection("WorldPop/GP/100m/pop").filterDate('2020');
var worldpop = worldpop_raw.select('population').mosaic();
worldpop = worldpop.setDefaultProjection(worldpop_raw.first().projection());

var worldpop_palette = palettes.colorbrewer.YlOrRd[9];
var worldpop_vis = {min: 0, max: 150, palette: worldpop_palette};


// IUCN Protected Areas

var protectedareas = ee.FeatureCollection('WCMC/WDPA/current/polygons');
//Ia (strict nature reserve), Ib (wilderness area), II (national park), III (natural monument or feature), IV (habitat/species management area), V (protected landscape/seascape), VI (PA with sustainable use of natural resources), not applicable, not assigned, or not reported.
protectedareas = protectedareas.remap(['Ia', 'Ib','II','III', 'IV','V','VI','Not Applicable', 'Not Assigned', 'Not Reported'], [1,2,3,4,5,6,7,0,0,0], 'IUCN_CAT');
protectedareas = protectedareas.filter(ee.Filter.gt('IUCN_CAT', 0));

protectedareas = protectedareas.reduceToImage({
  properties: ['IUCN_CAT'],
  reducer: ee.Reducer.min()
});
protectedareas = protectedareas.reproject('EPSG:4326', null, 1000);
protectedareas = protectedareas.toInt();
var protectedareas_palette = ['green','yellow','orange','red','blue','pink','brown'];
var protectedareas_classes = [1,2,3,4,5,6,7];

// HILDA LandCover Change

var hilda15 = ee.Image('projects/ee-guilhermeiablo/assets/hilda/hilda_plus_2015_states_GLOB-v1-0_base-map_wgs84-nn');
var hilda19 = ee.Image('projects/ee-guilhermeiablo/assets/hilda/hilda_plus_2019_states_GLOB-v1-0_wgs84-nn');
var hilda_palette = ['Blue','Red', 'Orange', 'Yellow', 'Green','LightCoral','Pink','Blue'];
var hilda_change_palette = ['LightGray','Red', 'Orange', 'Yellow', 'Green','LightCoral','Pink','Blue','Cyan','Black'];

var hildaLUC_classes = [
        1111, 2211, 3311, 4411, 5511, 6611, 7711, 8811, 9911,
        1122, 2222, 3322, 4422, 5522, 6622, 7722, 8822, 9922,
        1133, 2233, 3333, 4433, 5533, 6633, 7733, 8833, 9933,
        1144, 2244, 3344, 4444, 5544, 6644, 7744, 8844, 9944,
        1155, 2255, 3355, 4455, 5555, 6655, 7755, 8855, 9955,
        1166, 2266, 3366, 4466, 5566, 6666, 7766, 8866, 9966,
        1177, 2277, 3377, 4477, 5577, 6677, 7777, 8877, 9977,
        1188, 2288, 3388, 4488, 5588, 6688, 7788, 8888, 9988,
        1199, 2299, 3399, 4499, 5599, 6699, 7799, 8899, 9999
    ];
    
var hilda_classes = [11,22,33,44,55,66,77,88,99];


////ALTITUDE AND SLOPE (MAP SLOPE FUNCTION OVER COLLECTION)
//Access the raw DEM from Copernicus
var dem = ee.ImageCollection('COPERNICUS/DEM/GLO30');
//Nominal scale is 30.922080775909325
var projectionAt200 = dem.first().projection().atScale(247.3766462072746);
//Set up a function to calculate the slope in every image of the collection
function makeslope(image) {
  var elevation = image.select('DEM');
  var slopes = ee.Terrain.slope(elevation);
  return slopes;
}

var slope_palette = palettes.colorbrewer.RdYlGn[9];
var slope_vis = {min: 0, max: 8, palette: slope_palette};

var altitude_palette = palettes.crameri.batlow[10];
var altitude_vis = {min: 0, max: 5500, palette: altitude_palette};


/////GAEZ+ CROP DISTRIBUTION

//Mask zeros in each image
var removezeros = function(img){
  var masked = img.gt(0).selfMask().multiply(img);
  return masked.copyProperties(img, ['cropclass']);
};

//Gaez+ Collection (Total Harvested Area)
var gaezassetList = ee.data.listAssets("projects/ee-guilhermeiablo/assets/gaezplus_masks").assets
                    .map(function(d) { return d.name });
var gaezCollection = ee.ImageCollection(gaezassetList);
gaezCollection = gaezCollection.map(removezeros);

var gaezadditionalassetList = ee.data.listAssets("projects/ee-guilhermeiablo/assets/gaezplus_additionalmasks").assets
                    .map(function(d) { return d.name });
var spam_additional = ee.ImageCollection(gaezadditionalassetList);
spam_additional = spam_additional.map(removezeros);

var spam = spam_additional.merge(gaezCollection);

// CREATE ONE SINGLE IMAGE FROM THE COLLECTION
var mergeBands = function(image, previous) {
  return ee.Image(previous).addBands(image.rename([ee.String('d').cat(ee.Number(image.get('cropclass')).toInt().format('%s'))]));
};

var gaezmerged = spam.iterate(mergeBands, ee.Image([]));


//Gaez+ Collection (Mean Yield)
var gaezyieldassetList = ee.data.listAssets("projects/ee-guilhermeiablo/assets/gaezplus_yield").assets
                    .map(function(d) { return d.name });
var gaezyield = ee.ImageCollection(gaezyieldassetList);
gaezyield = gaezyield.map(removezeros);

var gaezyieldadditionalassetList = ee.data.listAssets("projects/ee-guilhermeiablo/assets/gaezplus_additionalmasks").assets
                    .map(function(d) { return d.name });
var yield_additional = ee.ImageCollection(gaezyieldadditionalassetList);
yield_additional = yield_additional.map(removezeros);

var gaezyield = yield_additional.merge(gaezyield);



// CREATE ONE SINGLE IMAGE FROM THE COLLECTION
var gaezyieldmerged = gaezyield.iterate(mergeBands, ee.Image([]));

// GET THE SUM OF ALL AREAS AND YIELDS
var summedAreaBand = spam.sum().rename('total');
gaezmerged = ee.Image(gaezmerged).addBands(summedAreaBand.select('total'));

var summedYieldBand = gaezyield.sum().rename('total');
gaezyieldmerged = ee.Image(gaezyieldmerged).addBands(summedYieldBand.select('total'));


//Rename the bands accordingly

// Example dictionary to map original band names to new ones
var bandNameMapping = {
  'd1': 'maize',
  'd2': 'rice',
  'd3': 'soybean',
  'd4': 'wheat',
  'd6': 'banana',
  'd7': 'barley',
  'd8': 'cassava',
  'd9': 'cotton',
  'd10': 'cropNES',
  'd11': 'foddercrops',
  'd12': 'groundnut',
  'd13': 'millet',
  'd14': 'oilpalmfruit',
  'd15': 'olives',
  'd16': 'othercereals',
  'd17': 'potatoandsweetpotato',
  'd18': 'pulses',
  'd19': 'rapeseed',
  'd20': 'sorghum',
  'd21': 'stimulants',
  'd22': 'sugarbeat',
  'd23': 'sugarcane',
  'd24': 'sunflower',
  'd25': 'tobacco',
  'd26': 'vegetables',
  'd27': 'yamsandotherroots',
  'total': 'total'
};

// Function to rename bands in an image based on the mapping
var renameBands = function(image, mapping) {
  // Extract the keys (original names) and values (new names) from the mapping
  var originalNames = Object.keys(mapping);
  var newNames = originalNames.map(function(origName) {
    return mapping[origName];
  });

  // Rename bands in the image
  return image.select(originalNames).rename(newNames);
};

// Rename bands for both images
gaezmerged = renameBands(gaezmerged, bandNameMapping);
gaezyieldmerged = renameBands(gaezyieldmerged, bandNameMapping);


// FUNCTION GET THE AREA NORMALIZED YIELD
var calculateTotalGaezYield = function(){
  
  // Get the list of bands from the first image
  var bandNames = gaezmerged.bandNames();
  
  // Loop through the bands and perform the calculation
  var gaezcalc = ee.ImageCollection(bandNames.map(function(bandName) {
    var band1 = gaezmerged.select(ee.String(bandName));
    var band2 = gaezyieldmerged.select(ee.String(bandName));
    var calculatedBand = band1.multiply(band2);//.divide(band1);
    return calculatedBand.rename([ee.String(bandName)]); // Rename to maintain the original band name
  })).toBands();
  
  // Rename the bands in the resulting image to match the original band names
  gaezcalc = gaezcalc.rename(bandNames);
  
  //print("Multiplication band names: ",gaezcalc.bandNames());
  return gaezcalc;
  
};

var gaez_palette = palettes.matplotlib.viridis[7].reverse();
var gaez_vis = {min: 0, max: 350, palette: gaez_palette};


/////GLW Gridded Livestock 2020

//Mask zeros in each image
var removeglwzeros = function(img){
  var masked = img.gt(0).selfMask().multiply(img);
  return masked.copyProperties(img, ['livestock']);
};

// GLW+ Collection
var glwassetList = ee.data.listAssets("projects/ee-guilhermeiablo/assets/glw4").assets
                    .map(function(d) { return d.name });
var glwCollection = ee.ImageCollection(glwassetList);

// Apply processing to remove zeros (assuming removeglwzeros is defined)
glwCollection = glwCollection.map(removeglwzeros);

// Function to merge the bands of the collection into a single image
var mergeglwBands = function(image, previous) {
  previous = ee.Image(previous); // Cast the previous object as an image

  // Safeguard against missing or null livestock property
  var livestockValue = ee.Algorithms.If(
    image.get('livestock'),
    ee.Number(image.get('livestock')).toInt(), // Use the actual value if it exists
    -1 // Default value if 'livestock' is missing or null
  );

  var renamedImage = image.rename([ee.String('d').cat(ee.Number(livestockValue).format('%s'))]);
  return previous.addBands(renamedImage);
};

// Use iterate to merge bands and cast the result as an ee.Image
var glwmerged = ee.Image(glwCollection.iterate(mergeglwBands, ee.Image([])));


//Rename the bands accordingly

// Example dictionary to map original band names to new ones
var glwbandNameMapping = {
  'd7': 'alllivestock',
  'd1': 'buffalo',
  'd2': 'chicken',
  'd3': 'cattle',
  'd4': 'goats',
  'd5': 'pigs',
  'd6': 'sheep'
};


// Rename bands for both images
glwmerged = renameBands(glwmerged, glwbandNameMapping);

var glw_palette = palettes.matplotlib.inferno[7].reverse();
var glw_vis = {min: 0, max: 150, palette: glw_palette};



 
////////////////// GROUPED STATS FUNCTION (FOR LANDCOVER CLASSIFIED DATASETS) //////////////////////////////////////

 
/////// COPERNICUS LAND COVER
var calculateClassArea = function(feature) {
  
    var areas = ee.Image.pixelArea().addBands(landcover)
    .reduceRegion({
      reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class',
    }),
    geometry: feature.geometry(),
    scale: 100,
    maxPixels: 1e10
    });
 
    var classAreas = ee.List(areas.get('groups'));
    
    
    // Convert the grouped areas to a dictionary with string keys
    var classAreaDict = ee.Dictionary(
      classAreas.map(function(item) {
        var areaDict = ee.Dictionary(item);
        var classValue = ee.Number(areaDict.get('class')).format(); // Convert class number to string
        var area = ee.Number(areaDict.get('sum'));
        return [classValue, area]; // Return key-value pair as [string, number]
      }).flatten()
    );
  
    // Create a dictionary for all predefined classes
    var completeClassAreaDict = ee.Dictionary.fromLists(
      copernicus_classes, // Predefined classes
      copernicus_classes.map(function(classValue) {
        // Check if the class exists in the computed dictionary
        return ee.Number(classAreaDict.get(classValue, 0)).divide(1e6); // Convert m² to km²
      })
    );
  
    // Add the class areas as properties to the feature
    var fid = feature.get('id_c'); // Assuming the feature has an 'id_c' property
    return ee.Feature(feature.geometry(), completeClassAreaDict.set('id_c', fid));
  };
    


/////// FOREST MANAGEMENT
var calculateClassArea_forest = function(feature) {
    var areas = ee.Image.pixelArea().addBands(forestmanagement)
    .reduceRegion({
      reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class',
    }),
    geometry: feature.geometry(),
    scale: 100,
    maxPixels: 1e10
    });
 
    var classAreas = ee.List(areas.get('groups'));
    
    
    // Convert the grouped areas to a dictionary with string keys
    var classAreaDict = ee.Dictionary(
      classAreas.map(function(item) {
        var areaDict = ee.Dictionary(item);
        var classValue = ee.Number(areaDict.get('class')).format(); // Convert class number to string
        var area = ee.Number(areaDict.get('sum'));
        return [classValue, area]; // Return key-value pair as [string, number]
      }).flatten()
    );
  
    // Convert the classes to strings
    forestmanagement_classes = forestmanagement_classes.map(function(item){
      return item.toString();
    });
  
    // Create a dictionary for all predefined classes
    var completeClassAreaDict = ee.Dictionary.fromLists(
      forestmanagement_classes, // Predefined classes
      forestmanagement_classes.map(function(classValue) {
        // Check if the class exists in the computed dictionary
        return ee.Number(classAreaDict.get(classValue, 0)).divide(1e6); // Convert m² to km²
      })
    );
  
    // Add the class areas as properties to the feature
    var fid = feature.get('id_c'); // Assuming the feature has an 'id_c' property
    return ee.Feature(feature.geometry(), completeClassAreaDict.set('id_c', fid));
  };
    
    

/////// PROTECTED AREAS
var calculateClassArea_protected = function(feature) {
    var areas = ee.Image.pixelArea().addBands(protectedareas)
    .reduceRegion({
      reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class',
    }),
    geometry: feature.geometry(),
    scale: 1000,
    maxPixels: 1e10
    });
 
    var classAreas = ee.List(areas.get('groups'));
    
    // Convert the grouped areas to a dictionary with string keys
    var classAreaDict = ee.Dictionary(
      classAreas.map(function(item) {
        var areaDict = ee.Dictionary(item);
        var classValue = ee.Number(areaDict.get('class')).format(); // Convert class number to string
        var area = ee.Number(areaDict.get('sum'));
        return [classValue, area]; // Return key-value pair as [string, number]
      }).flatten()
    );
  
    // Convert the classes to strings
    protectedareas_classes = protectedareas_classes.map(function(item){
      return item.toString();
    });
  
    // Create a dictionary for all predefined classes
    var completeClassAreaDict = ee.Dictionary.fromLists(
      protectedareas_classes, // Predefined classes
      protectedareas_classes.map(function(classValue) {
        // Check if the class exists in the computed dictionary
        return ee.Number(classAreaDict.get(classValue, 0)).divide(1e6); // Convert m² to km²
      })
    );
  
    // Add the class areas as properties to the feature
    var fid = feature.get('id_c'); // Assuming the feature has an 'id_c' property
    return ee.Feature(feature.geometry(), completeClassAreaDict.set('id_c', fid));
  };
    
    


/////// HILDA LAND COVER AREA

var getLUC = function(img1, img2) {
  var lu15 = img1.remap([0,11,22,33,44,55,66,77],[88,11,22,33,44,55,66,77]);
  var lu19 = img2.remap([0,11,22,33,44,55,66,77,99],[88,11,22,33,44,55,66,77,99]);
  var luc = lu15.multiply(100).add(lu19);
  return luc;
};


var calculateClassArea_hildaLUC = function(feature) {
    var areas = ee.Image.pixelArea().addBands(getLUC(hilda15, hilda19))
    .reduceRegion({
      reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class',
    }),
    geometry: feature.geometry(),
    scale: 1000,
    maxPixels: 1e10
    });
 
    var classAreas = ee.List(areas.get('groups'));
    
    
    // Convert the grouped areas to a dictionary with string keys
    var classAreaDict = ee.Dictionary(
      classAreas.map(function(item) {
        var areaDict = ee.Dictionary(item);
        var classValue = ee.Number(areaDict.get('class')).format(); // Convert class number to string
        var area = ee.Number(areaDict.get('sum'));
        return [classValue, area]; // Return key-value pair as [string, number]
      }).flatten()
    );
  
    // Convert the classes to strings
    hildaLUC_classes = hildaLUC_classes.map(function(item){
      return item.toString();
    });
  
    // Create a dictionary for all predefined classes
    var completeClassAreaDict = ee.Dictionary.fromLists(
      hildaLUC_classes, // Predefined classes
      hildaLUC_classes.map(function(classValue) {
        // Check if the class exists in the computed dictionary
        return ee.Number(classAreaDict.get(classValue, 0)).divide(1e6); // Convert m² to km²
      })
    );
  
    // Add the class areas as properties to the feature
    var fid = feature.get('id_c'); // Assuming the feature has an 'id_c' property
    return ee.Feature(feature.geometry(), completeClassAreaDict.set('id_c', fid));
  };
    


var calculateClassArea_hilda = function(feature) {
    var areas = ee.Image.pixelArea().addBands(hilda15)
    .reduceRegion({
      reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class',
    }),
    geometry: feature.geometry(),
    scale: 1000,
    maxPixels: 1e10
    });
 
    var classAreas = ee.List(areas.get('groups'));
    // Convert the grouped areas to a dictionary with string keys
    var classAreaDict = ee.Dictionary(
      classAreas.map(function(item) {
        var areaDict = ee.Dictionary(item);
        var classValue = ee.Number(areaDict.get('class')).format(); // Convert class number to string
        var area = ee.Number(areaDict.get('sum'));
        return [classValue, area]; // Return key-value pair as [string, number]
      }).flatten()
    );
  
    // Convert the classes to strings
    hilda_classes = hilda_classes.map(function(item){
      return item.toString();
    });
  
    // Create a dictionary for all predefined classes
    var completeClassAreaDict = ee.Dictionary.fromLists(
      hilda_classes, // Predefined classes
      hilda_classes.map(function(classValue) {
        // Check if the class exists in the computed dictionary
        return ee.Number(classAreaDict.get(classValue, 0)).divide(1e6); // Convert m² to km²
      })
    );
  
    // Add the class areas as properties to the feature
    var fid = feature.get('id_c'); // Assuming the feature has an 'id_c' property
    return ee.Feature(feature.geometry(), completeClassAreaDict.set('id_c', fid));
  };

////////////////// SUM STATS FUNCION (FOR WORLDPOP) //////////////////////////////////////

var calculateTotalPop = function(feature){
  
  var population = worldpop.reduceRegions({
    collection: feature,
    reducer: ee.Reducer.sum().setOutputs(["TotalPop"]),
    scale: 92.76624203150153
  });
  return population;
};


////////////////// SUM STATS FUNCION (FOR GAEZ+) //////////////////////////////////////


var getGaezStats = function(featureCollection, image1, image2) {
  
  // Ensure both images have the same bands
  var commonBands = image1.bandNames();
  image2 = image2.select(commonBands);

  // Perform reduceRegions to get the sum of values for each feature for image1 * image2
  var stats1 = image1.reduceRegions({
    collection: featureCollection,
    reducer: ee.Reducer.sum(),
    scale: 9276.624232772796
  });

  // Perform reduceRegions to get the sum of values for each feature for image2
  var stats2 = image2.reduceRegions({
    collection: featureCollection,
    reducer: ee.Reducer.sum(),
    scale: 9276.624232772796
  });

  // Combine the summed statistics for all bands
  var combined = stats1.map(function(feature) {
    // Match the corresponding feature from stats2 based on system:index
    var matchingFeature = stats2.filter(ee.Filter.eq('id_c', feature.get('id_c'))).first();
    
    // Check if matchingFeature exists
    var combinedProperties = ee.Dictionary(commonBands.iterate(function(band, dict) {
      band = ee.String(band);

      // Retrieve values from stats1 and stats2 for the current band
      var sum1 = feature.get(band);
      var sum2 = matchingFeature.get(band);
      var id = ee.String(feature.get('id_c'));

      // Calculate the ratio only if sum2 is not null or zero
      var ratio = ee.Algorithms.If(
        ee.Algorithms.IsEqual(sum2, null),
        0,
        ee.Algorithms.If(ee.Number(sum2).neq(0), ee.Number(sum1).divide(sum2), 0)
      );

      // Add the ratio to the dictionary
      return ee.Dictionary(dict).set('id_c',id).set(band, ratio);
    }, ee.Dictionary()));

    // Return a new feature with the calculated ratios
    return ee.Feature(feature.geometry(), combinedProperties);
    
  });

  return combined;
};


////////////////// SUM STATS FUNCION (FOR GLW4) //////////////////////////////////////


var getGLWStats = function(featureCollection) {
  var pixelarea = ee.Image.pixelArea().divide(1e6);
  var livestock = glwmerged.multiply(pixelarea).reduceRegions({
    collection: featureCollection,
    reducer: ee.Reducer.sum(),
    scale: 9276.624232772794
  });
  return livestock;
  
};



////////////////// MEAN STATS FUNCION (FOR TRAVEL TIME DATASET) //////////////////////////////////////

var calculateMeanTime = function(feature){
  var MeanTime = majorcities.reduceRegions({
  collection: feature,
  reducer: ee.Reducer.mean().setOutputs(["MeanTravelTime"]),
  scale: 500
  });
  return MeanTime;
  
};


////////////////// MEAN STDVAR STATS FUNCION (FOR ALTITUDE AND SOLPE) //////////////////////////////////////

var calculateMeanAltitude = function(feature, bounddem){
  
  var reducers = ee.Reducer.mean().combine({
  reducer2: ee.Reducer.stdDev(),
  sharedInputs: true
  });
  
  var MeanAltitude = bounddem.reduceRegions({
  collection: feature,
  reducer: reducers.setOutputs(["MeanAltitude","StdErrAltitude"]),
  scale: 494.7532924145492
  });
  return MeanAltitude;
  
};

var calculateMeanSlope = function(feature, boundslope){
  
  var reducers = ee.Reducer.mean().combine({
  reducer2: ee.Reducer.stdDev(),
  sharedInputs: true
  });
  
  var MeanSlope = boundslope.reduceRegions({
  collection: feature,
  reducer: reducers.setOutputs(["MeanSlope","StdErrSlope"]),
  scale: 494.7532924145492
  });
  return MeanSlope;
  
};





////////////////// APPLYING THE FUNCTIONS ///////////////////////////////////////////////////////

function calculate(){
  Map.layers().reset();
  resultsPanel.clear();
  
  var country_grid50 = grid50.filter(ee.Filter.eq('name', countrySelect.getValue()));
  Map.centerObject(country_grid50);
  Map.addLayer(country_grid50, {color: 'gray'}, '50km Grid');
  
  if(layerSelect.getValue() == 'COPERNICUS LandCover 2019'){
    var roadcover = landcover.clip(country_grid50);
    
    var classValues = [0, 20, 30, 40, 50, 60, 70, 80, 90, 100, 111, 112, 113, 114, 115, 116, 121, 122, 123, 124, 125, 126, 200];
    var classNames = [
      'Unknown',
      'Shrubs',
      'Herbaceous_vegetation',
      'Cultivated_and_managed_vegetation_agriculture',
      'Urban_built_up',
      'Bare_sparse_vegetation',
      'Snow_and_ice',
      'Permanent_water_bodies',
      'Herbaceous_wetland',
      'Moss_and_lichen',
      'Closed_forest_evergreen_needle_leaf',
      'Closed_forest_evergreen_broad_leaf',
      'Closed_forest_deciduous_needle_leaf',
      'Closed_forest_deciduous_broad_leaf',
      'Closed_forest_mixed',
      'Closed_forest_not_matching_other_definitions',
      'Open_forest_evergreen_needle_leaf',
      'Open_forest_evergreen_broad_leaf',
      'Open_forest_deciduous_needle_leaf',
      'Open_forest_deciduous_broad_leaf',
      'Open_forest_mixed',
      'Open_forest_not_matching_other_definitions',
      'Oceans_seas'
    ];
    
    // Recode the class values into sequential values
    var newClassValues = ee.List.sequence(1, ee.List(classValues).length());
    var renameClasses = function(image) {
      var reclassified = image.remap(classValues, newClassValues).rename('classification');
      return reclassified;
    };
    roadcover = renameClasses(roadcover);
    
    Map.addLayer(roadcover,
       {min:1, max:23, palette: copernicus_palette},
     'COPERNICUS Land Cover 2019');
     
    legendPanel.clear();
    Map.remove(legendPanel);
    
     
    legendPanel = ui.Panel({
      style: {
        position: 'bottom-left',
        padding: '5px;'
      }
    });
    
    var title = ui.Label({
      value: 'Classification',
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '0px;'
      }
    });
    
    legendPanel.add(title);
    
    //var color = ['309e48','ffad16','fff80c','1426ff']
    //var lc_class = ['Forest', 'Vegetation Non Forest', 'Non Vegetated', 'Water']
    
    var list_legend = function(copernicus_palette, classNames) {
      
      var c = ui.Label({
        style: {
          backgroundColor: copernicus_palette,
          padding: '10px',
          margin: '4px'
        }
      });
      
      var ds = ui.Label({
        value: classNames,
        style: {
          margin: '5px'
        }
      });
      
      return ui.Panel({
        widgets: [c, ds],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
    };
    
    for(var a = 0; a < 23; a++){
      legendPanel.add(list_legend(copernicus_palette[a], classNames[a]));
    }
    
    Map.add(legendPanel); 
    
    
    
    
    
    
    var gridAreas = country_grid50.map(calculateClassArea);
    
    var chart = ui.Chart.feature.byFeature(gridAreas,'id_c').setChartType('Table').setOptions({
          title: 'Parcel Characteristics)',
        });
    
    
    var downloadLabel_cover=ui.Label("");
    resultsPanel.add(downloadLabel_cover);
    
    var legendLabel_cover=ui.Label("");
    resultsPanel.add(legendLabel_cover);
    
    
    function updateDownloadLabel_cover(url){
      downloadLabel_cover.setValue("Click to download stats for "+countrySelect.getValue());
      downloadLabel_cover.setUrl(url);
      legendLabel_cover.setValue("Values are provided in absolute square kilometers. See the list of land cover class codes and access the source material here.");
      legendLabel_cover.setUrl("https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_Landcover_100m_Proba-V-C3_Global");
    }
    
    gridAreas.getDownloadURL({
      format:"CSV",
      filename: "mytable",
      callback: updateDownloadLabel_cover
    });
    
    resultsPanel.add(chart);
  }
  
  if(layerSelect.getValue() == 'Forest Management'){
    
    var forestcover = forestmanagement.clip(country_grid50);
    Map.addLayer(forestcover,
       {min:1, max:6, palette: forestmanagement_palette},
     'Forest Management');
     
    
    var classValues = [
        1,2,3,4,5,6
    ];
      
    var classNames = [
      'Naturally regenerating forest without any signs of human activities, e.g., primary forests.', 
      'Naturally regenerating forest with signs of human activities, e.g., logging, clear cuts etc.',
      'Planted forest.',
      'Short rotation plantations for timber.',
      'Oil palm plantations',
      'Agroforestry'
    ];
    
     
    legendPanel.clear();
    Map.remove(legendPanel);
    
     
    legendPanel = ui.Panel({
      style: {
        position: 'bottom-left',
        padding: '5px;'
      }
    });
    
    var title = ui.Label({
      value: 'Classification',
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '0px;'
      }
    });
    
    legendPanel.add(title);
  
    
    var list_legend = function(forestmanagement_palette, classNames) {
      
      var c = ui.Label({
        style: {
          backgroundColor: forestmanagement_palette,
          padding: '10px',
          margin: '4px'
        }
      });
      
      var ds = ui.Label({
        value: classNames,
        style: {
          margin: '5px'
        }
      });
      
      return ui.Panel({
        widgets: [c, ds],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
    };
    
    for(var a = 0; a < 6; a++){
      legendPanel.add(list_legend(forestmanagement_palette[a], classNames[a]));
    }
    
    Map.add(legendPanel); 
    
    
    var forestgridAreas = country_grid50.map(calculateClassArea_forest);
    
    var forestchart = ui.Chart.feature.byFeature(forestgridAreas,'id_c').setChartType('Table').setOptions({
          title: 'Parcel Characteristics)',
        });
    
    
    
    var downloadLabel_forest=ui.Label("");
    var legendLabel_forest=ui.Label("");
    var sourceLabel_forest=ui.Label("");
    resultsPanel.add(downloadLabel_forest);
    resultsPanel.add(legendLabel_forest);
    

    
    function updateDownloadLabel_forest(url){
      downloadLabel_forest.setValue("Click to download stats for "+countrySelect.getValue());
      downloadLabel_forest.setUrl(url);
      legendLabel_forest.setValue("Land use class codes: 1 - Naturally regenerating forest without any signs of human activities, e.g., primary forests. 2 - Naturally regenerating forest with signs of human activities, e.g., logging, clear cuts etc. 3 - Planted forest. 4 - Short rotation plantations for timber. 5 - Oil palm plantations. 6 - Agroforestry");
      sourceLabel_forest.setValue("Access the source data.");
      sourceLabel_forest.setUrl("https://zenodo.org/record/5879022");
    }
    
    forestgridAreas.getDownloadURL({
      format:"CSV",
      filename: "mytable",
      callback: updateDownloadLabel_forest
    });
    
    resultsPanel.add(forestchart);
    resultsPanel.add(sourceLabel_forest);
  }
  
  if(layerSelect.getValue() == 'Travel time to major cities'){
    var cityaccess = majorcities.clip(country_grid50);
    Map.addLayer(cityaccess,
       {min:0, max:2500, palette: majorcities_palette},
     'Travel time to major cities');
    
    legendPanel.clear();
    Map.remove(legendPanel);
    
    var legendTitle = ui.Label({
      value: 'Travel time to major cities',
      style: {fontWeight: 'bold'}
    });

    
    // Create the colour bar for the legend
    var colorBar = ui.Thumbnail({
      image: ee.Image.pixelLonLat().select(0),
      params: makeColorBarParams(traveltime_vis.palette),
      style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
    });
    
    // Create a panel with three numbers for the legend
    var legendLabels = ui.Panel({
      widgets: [
        ui.Label(traveltime_vis.min, {margin: '4px 8px'}),
        ui.Label(
            ((traveltime_vis.max - traveltime_vis.min) / 2 + traveltime_vis.min),
            {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}
        ),
        ui.Label(traveltime_vis.max, {margin: '4px 8px'})
      ],
      layout: ui.Panel.Layout.flow('horizontal')
    });
    
    // Create a container panel for the legend to control its position
    legendPanel = ui.Panel({
      widgets: [legendTitle, colorBar, legendLabels],
      style: {
        position: 'bottom-left',  // Position the legend in the bottom-left corner
        padding: '8px'  // Add some padding for spacing
      }
    });
    
    // Add the legend panel to the map
    Map.add(legendPanel);
     
     
     
    var gridAccess = calculateMeanTime(country_grid50);
    
    var Accesschart = ui.Chart.feature.byFeature(gridAccess,'id_c').setChartType('Table').setOptions({
          title: 'Parcel Characteristics)',
        });
    
    var downloadLabel_access=ui.Label("");
    resultsPanel.add(downloadLabel_access);
    
    var legendLabel_access=ui.Label("");
    resultsPanel.add(legendLabel_access);
    
    var sourceLabel_access=ui.Label("");
    
    
    
    function updateDownloadLabel_access(url){
      downloadLabel_access.setValue("Click to download stats for "+countrySelect.getValue());
      downloadLabel_access.setUrl(url);
      legendLabel_access.setValue("Values are given in minutes on column MeanTravelTime");
      sourceLabel_access.setValue("Access the source data.");
      sourceLabel_access.setUrl("https://forobs.jrc.ec.europa.eu/products/gam/download.php");
    }
    
    gridAccess.getDownloadURL({
      format:"CSV",
      filename: "mytable",
      callback: updateDownloadLabel_access
    });
    
    resultsPanel.add(Accesschart);
    resultsPanel.add(sourceLabel_access);
    
  }
  
  if(layerSelect.getValue() == 'Population 2020'){
    var pop = worldpop.clip(country_grid50);
    Map.addLayer(pop.updateMask(worldpop.gte(1)),
       {min:0, max:150, palette: worldpop_palette},
     'Population 2020');
    
    legendPanel.clear();
    Map.remove(legendPanel);
    
    var legendTitle = ui.Label({
      value: 'Population (2020)',
      style: {fontWeight: 'bold'}
    });

    
    // Create the colour bar for the legend
    var colorBar = ui.Thumbnail({
      image: ee.Image.pixelLonLat().select(0),
      params: makeColorBarParams(worldpop_vis.palette),
      style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
    });
    
    // Create a panel with three numbers for the legend
    var legendLabels = ui.Panel({
      widgets: [
        ui.Label(worldpop_vis.min, {margin: '4px 8px'}),
        ui.Label(
            ((worldpop_vis.max - worldpop_vis.min) / 2 + worldpop_vis.min),
            {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}
        ),
        ui.Label(worldpop_vis.max, {margin: '4px 8px'})
      ],
      layout: ui.Panel.Layout.flow('horizontal')
    });
    
    // Create a container panel for the legend to control its position
    legendPanel = ui.Panel({
      widgets: [legendTitle, colorBar, legendLabels],
      style: {
        position: 'bottom-left',  // Position the legend in the bottom-left corner
        padding: '8px'  // Add some padding for spacing
      }
    });
    
    // Add the legend panel to the map
    Map.add(legendPanel);
    
     
     
     
    var gridPop = calculateTotalPop(country_grid50);
    
    var Popchart = ui.Chart.feature.byFeature(gridPop,'id_c').setChartType('Table').setOptions({
          title: 'Parcel Characteristics)',
        });
    
    var downloadLabel_pop=ui.Label("");
    resultsPanel.add(downloadLabel_pop);
    
    var legendLabel_pop=ui.Label("");
    resultsPanel.add(legendLabel_pop);
    
    var sourceLabel_pop=ui.Label("");
    
    
    
    function updateDownloadLabel_pop(url){
      downloadLabel_pop.setValue("Click to download stats for "+countrySelect.getValue());
      downloadLabel_pop.setUrl(url);
      legendLabel_pop.setValue("Values are given in absolute population count on column TotalPop");
      sourceLabel_pop.setValue("Access the source data.");
      sourceLabel_pop.setUrl("https://developers.google.com/earth-engine/datasets/catalog/WorldPop_GP_100m_pop");
    }
    
    gridPop.getDownloadURL({
      format:"CSV",
      filename: "mytable",
      callback: updateDownloadLabel_pop
    });
    
    resultsPanel.add(Popchart);
    resultsPanel.add(sourceLabel_pop);
  }
  
  if(layerSelect.getValue() == 'Protected Areas'){
    
    var protectedcover = protectedareas.clip(country_grid50);
    Map.addLayer(protectedcover,
       {min:1, max:7, palette: protectedareas_palette},
     'Protected Areas');
     
    var classValues = [
        1,2,3,4,5,6,7
    ];
      
    var classNames = [
      '1 (strict nature reserve)',
      '2 (wilderness area)',
      '3 (national park)',
      '4 (natural monument or feature)',
      '5 (habitat/species management area)',
      '6 (protected landscape/seascape)',
      '7 (PA with sustainable use of natural resources)'
    ];
    
     
    legendPanel.clear();
    Map.remove(legendPanel);
    
     
    legendPanel = ui.Panel({
      style: {
        position: 'bottom-left',
        padding: '5px;'
      }
    });
    
    var title = ui.Label({
      value: 'Classification',
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '0px;'
      }
    });
    
    legendPanel.add(title);
  
    
    var list_legend = function(protectedareas_palette, classNames) {
      
      var c = ui.Label({
        style: {
          backgroundColor: protectedareas_palette,
          padding: '10px',
          margin: '4px'
        }
      });
      
      var ds = ui.Label({
        value: classNames,
        style: {
          margin: '5px'
        }
      });
      
      return ui.Panel({
        widgets: [c, ds],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
    };
    
    for(var a = 0; a < 7; a++){
      legendPanel.add(list_legend(protectedareas_palette[a], classNames[a]));
    }
    
    Map.add(legendPanel); 
     
     
     
     
     
    var protectedgridAreas = country_grid50.map(calculateClassArea_protected);
    
    var protectedchart = ui.Chart.feature.byFeature(protectedgridAreas,'id_c').setChartType('Table').setOptions({
          title: 'Parcel Characteristics)',
        });
    
    var downloadLabel_protected=ui.Label("");
    resultsPanel.add(downloadLabel_protected);
    var legendLabel_protected=ui.Label("");
    resultsPanel.add(legendLabel_protected);
    var sourceLabel_protected=ui.Label("");
    
    
    
    function updateDownloadLabel_protected(url){
      downloadLabel_protected.setValue("Click to download stats for "+countrySelect.getValue());
      downloadLabel_protected.setUrl(url);
      legendLabel_protected.setValue("Values are provided in absolute square kilometers. Protected areas are classified following IUCN management category: 1 (strict nature reserve), 2 (wilderness area), 3 (national park), 4 (natural monument or feature), 5 (habitat/species management area), 6 (protected landscape/seascape), 7 (PA with sustainable use of natural resources)");
      sourceLabel_protected.setValue("Access the source data here.");
      sourceLabel_protected.setUrl("https://developers.google.com/earth-engine/datasets/catalog/WCMC_WDPA_current_polygons?hl=en");

    }
    
    protectedgridAreas.getDownloadURL({
      format:"CSV",
      filename: "mytable",
      callback: updateDownloadLabel_protected
    });
    
    resultsPanel.add(protectedchart);
    resultsPanel.add(sourceLabel_protected);
  }
  
  if(layerSelect.getValue() == 'HILDA LandCover Change 2015-2019'){
    
    var hildaLUC = getLUC(hilda15, hilda19);
    var changecover = hildaLUC.clip(country_grid50);
    
    var classValues = [
        1111, 2211, 3311, 4411, 5511, 6611, 7711, 8811, 9911,
        1122, 2222, 3322, 4422, 5522, 6622, 7722, 8822, 9922,
        1133, 2233, 3333, 4433, 5533, 6633, 7733, 8833, 9933,
        1144, 2244, 3344, 4444, 5544, 6644, 7744, 8844, 9944,
        1155, 2255, 3355, 4455, 5555, 6655, 7755, 8855, 9955,
        1166, 2266, 3366, 4466, 5566, 6666, 7766, 8866, 9966,
        1177, 2277, 3377, 4477, 5577, 6677, 7777, 8877, 9977,
        1188, 2288, 3388, 4488, 5588, 6688, 7788, 8888, 9988,
        1199, 2299, 3399, 4499, 5599, 6699, 7799, 8899, 9999
    ];
    var newClassValues = [
      0,1,1,1,1,1,1,1,1,
      2,0,2,2,2,2,2,2,2,
      3,3,0,3,3,3,3,3,3,
      4,4,4,0,4,4,4,4,4,
      5,5,5,5,0,5,5,5,5,
      6,6,6,6,6,0,6,6,6,
      7,7,7,7,7,7,0,7,7,
      8,8,8,8,8,8,8,0,8,
      9,9,9,9,9,9,9,9,0]
      
    var classNames = [
      'No change',
      'LU to Urban',
      'LU to Cropland',
      'LU to Pasture',
      'LU to Forest',
      'LU to Shrubland',
      'LU to Sparse vegetation',
      'LU to Water',
      'LU to Water',
      'LU to No data'
    ];
    
    // Recode the class values into sequential values
    var renameClasses = function(image) {
      var reclassified = image.remap(classValues, newClassValues).rename('classification');
      return reclassified;
    };
    changecover = renameClasses(changecover);
    
     
    legendPanel.clear();
    Map.remove(legendPanel);
    
     
    legendPanel = ui.Panel({
      style: {
        position: 'bottom-left',
        padding: '5px;'
      }
    });
    
    var title = ui.Label({
      value: 'Classification',
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '0px;'
      }
    });
    
    legendPanel.add(title);
  
    
    var list_legend = function(hilda_change_palette, classNames) {
      
      var c = ui.Label({
        style: {
          backgroundColor: hilda_change_palette,
          padding: '10px',
          margin: '4px'
        }
      });
      
      var ds = ui.Label({
        value: classNames,
        style: {
          margin: '5px'
        }
      });
      
      return ui.Panel({
        widgets: [c, ds],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
    };
    
    for(var a = 0; a < 10; a++){
      legendPanel.add(list_legend(hilda_change_palette[a], classNames[a]));
    }
    
    Map.add(legendPanel); 
    
    
    Map.addLayer(changecover,
       {min:0, max:9, palette: hilda_change_palette},
     'Land Cover Change 2015-2019');
     
    var changegridAreas = country_grid50.map(calculateClassArea_hildaLUC);
    
    var changechart = ui.Chart.feature.byFeature(changegridAreas,'id_c').setChartType('Table').setOptions({
          title: 'Parcel Characteristics)',
        });
    
    
    
    var downloadLabel_change=ui.Label("");
    var legendLabel_change=ui.Label("");
    var sourceLabel_change=ui.Label("");
    resultsPanel.add(downloadLabel_change);
    resultsPanel.add(legendLabel_change);
    

    
    function updateDownloadLabel_change(url){
      downloadLabel_change.setValue("Click to download stats for "+countrySelect.getValue());
      downloadLabel_change.setUrl(url);
      legendLabel_change.setValue("Values are provided in absolute square kilometers. Land cover change classes code are available here (0-99). Class 0(water) was remapped into class 88.");
      legendLabel_change.setUrl("https://download.pangaea.de/dataset/921846/files/HILDAplus_GLOBv-1.0_geotiff_documentation.pdf");
      sourceLabel_change.setValue("Access the source data.");
      sourceLabel_change.setUrl("https://doi.pangaea.de/10.1594/PANGAEA.921846?format=html#mcol0_ds14261986");
    }
    
    changegridAreas.getDownloadURL({
      format:"CSV",
      filename: "mytable",
      callback: updateDownloadLabel_change
    });
    
    resultsPanel.add(changechart);
    resultsPanel.add(sourceLabel_change);
  }
  
  if(layerSelect.getValue() == 'HILDA+ LandCover 2015'){
    
    var changecover15 = hilda15.clip(country_grid50);
     
    var classValues = [0, 11, 22, 33, 44, 55, 66, 77];
    var classNames = [
      'Water',
      'Urban',
      'Cropland',
      'Pasture',
      'Forest',
      'Shrubland',
      'Sparse vegetation',
      'Water'
    ];
    
    // Recode the class values into sequential values
    var newClassValues = ee.List.sequence(1, ee.List(classValues).length());
    var renameClasses = function(image) {
      var reclassified = image.remap(classValues, newClassValues).rename('classification');
      return reclassified;
    };
    changecover15 = renameClasses(changecover15);
    
    Map.addLayer(changecover15,
       {min:1, max:8, palette: hilda_palette},
     'HILDA Land Cover (2015)');
     
    legendPanel.clear();
    Map.remove(legendPanel);
    
     
    legendPanel = ui.Panel({
      style: {
        position: 'bottom-left',
        padding: '5px;'
      }
    });
    
    var title = ui.Label({
      value: 'Classification',
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '0px;'
      }
    });
    
    legendPanel.add(title);
  
    
    var list_legend = function(hilda_palette, classNames) {
      
      var c = ui.Label({
        style: {
          backgroundColor: hilda_palette,
          padding: '10px',
          margin: '4px'
        }
      });
      
      var ds = ui.Label({
        value: classNames,
        style: {
          margin: '5px'
        }
      });
      
      return ui.Panel({
        widgets: [c, ds],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
    };
    
    for(var a = 0; a < 7; a++){
      legendPanel.add(list_legend(hilda_palette[a], classNames[a]));
    }
    
    Map.add(legendPanel); 
     
     
     
     
     
     
     
    var hildagridAreas = country_grid50.map(calculateClassArea_hilda);
    
    var hildachart = ui.Chart.feature.byFeature(hildagridAreas,'id_c').setChartType('Table').setOptions({
          title: 'Parcel Characteristics)',
        });
    
    
    
    var downloadLabel_hilda=ui.Label("");
    var legendLabel_hilda=ui.Label("");
    var sourceLabel_hilda=ui.Label("");
    resultsPanel.add(downloadLabel_hilda);
    resultsPanel.add(legendLabel_hilda);
    

    
    function updateDownloadLabel_hilda(url){
      downloadLabel_hilda.setValue("Click to download stats for "+countrySelect.getValue());
      downloadLabel_hilda.setUrl(url);
      legendLabel_hilda.setValue("Values are provided in absolute square kilometers. Land cover change classes code are available here (0-99).");
      legendLabel_hilda.setUrl("https://download.pangaea.de/dataset/921846/files/HILDAplus_GLOBv-1.0_geotiff_documentation.pdf");
      sourceLabel_hilda.setValue("Access the source data.");
      sourceLabel_hilda.setUrl("https://doi.pangaea.de/10.1594/PANGAEA.921846?format=html#mcol0_ds14261986");
    }
    
    hildagridAreas.getDownloadURL({
      format:"CSV",
      filename: "mytable",
      callback: updateDownloadLabel_hilda
    });
    
    resultsPanel.add(hildachart);
    resultsPanel.add(sourceLabel_hilda);
  }
  
  if(layerSelect.getValue() == 'Slope (Copernicus)'){
    var slope = dem.filterBounds(country_grid50).select('DEM');
    var slopemap = slope.map(makeslope).median().clip(country_grid50);
    Map.addLayer(slopemap,
       {min:0, max:8, palette: slope_palette},
     'Slope (Copernicus DEM)');
     
    legendPanel.clear();
    Map.remove(legendPanel);
    
    var legendTitle = ui.Label({
      value: 'Slope (%)',
      style: {fontWeight: 'bold'}
    });

    
    // Create the colour bar for the legend
    var colorBar = ui.Thumbnail({
      image: ee.Image.pixelLonLat().select(0),
      params: makeColorBarParams(slope_vis.palette),
      style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
    });
    
    // Create a panel with three numbers for the legend
    var legendLabels = ui.Panel({
      widgets: [
        ui.Label(slope_vis.min, {margin: '4px 8px'}),
        ui.Label(
            ((slope_vis.max - slope_vis.min) / 2 + slope_vis.min),
            {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}
        ),
        ui.Label(slope_vis.max, {margin: '4px 8px'})
      ],
      layout: ui.Panel.Layout.flow('horizontal')
    });
    
    // Create a container panel for the legend to control its position
    legendPanel = ui.Panel({
      widgets: [legendTitle, colorBar, legendLabels],
      style: {
        position: 'bottom-left',  // Position the legend in the bottom-left corner
        padding: '8px'  // Add some padding for spacing
      }
    });
    
    // Add the legend panel to the map
    Map.add(legendPanel);
     
    var demAt200m = dem.filterBounds(country_grid50).select('DEM');
    demAt200m = demAt200m.map(function(image){
      image.reduceResolution({
      reducer: ee.Reducer.mean(),
      maxPixels: 1024
    }).reproject({
      crs:projectionAt200
    });
      return image;
    });
    
    var slopeAt200m = demAt200m.map(makeslope).median();
     

    var gridSlope = calculateMeanSlope(country_grid50, slopeAt200m);
    
    var Slopechart = ui.Chart.feature.byFeature(gridSlope,'id_c').setChartType('Table').setOptions({
          title: 'Parcel Characteristics)',
        });
    
    var downloadLabel_slope=ui.Label("");
    resultsPanel.add(downloadLabel_slope);
    
    var legendLabel_slope=ui.Label("");
    resultsPanel.add(legendLabel_slope);
    
    var sourceLabel_slope=ui.Label("");
    
    
    
    function updateDownloadLabel_slope(url){
      downloadLabel_slope.setValue("Click to download stats for "+countrySelect.getValue());
      downloadLabel_slope.setUrl(url);
      legendLabel_slope.setValue("Values are calculated from the Copernicus DEM and given in degrees");
      sourceLabel_slope.setValue("Access the source DEM data.");
      sourceLabel_slope.setUrl("https://spacedata.copernicus.eu/documents/20123/121239/GEO1988-CopernicusDEM-SPE-002_ProductHandbook_I4.0.pdf");
    }
    
    gridSlope.getDownloadURL({
      format:"CSV",
      filename: "mytable",
      callback: updateDownloadLabel_slope
    });
    
    resultsPanel.add(Slopechart);
    resultsPanel.add(sourceLabel_slope);
    
  }
  
  if(layerSelect.getValue() == 'Altitude (Copernicus)'){
    var altitude = dem.filterBounds(country_grid50).median().clip(country_grid50);
    Map.addLayer(altitude.select('DEM'),
       {min:0, max:5500, palette: altitude_palette},
     'Altitude (Copernicus DEM)');
     
    legendPanel.clear();
    Map.remove(legendPanel);
    
    var legendTitle = ui.Label({
      value: 'Altitude (m)',
      style: {fontWeight: 'bold'}
    });

    
    // Create the colour bar for the legend
    var colorBar = ui.Thumbnail({
      image: ee.Image.pixelLonLat().select(0),
      params: makeColorBarParams(altitude_vis.palette),
      style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
    });
    
    // Create a panel with three numbers for the legend
    var legendLabels = ui.Panel({
      widgets: [
        ui.Label(altitude_vis.min, {margin: '4px 8px'}),
        ui.Label(
            ((altitude_vis.max - altitude_vis.min) / 2 + altitude_vis.min),
            {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}
        ),
        ui.Label(altitude_vis.max, {margin: '4px 8px'})
      ],
      layout: ui.Panel.Layout.flow('horizontal')
    });
    
    // Create a container panel for the legend to control its position
    legendPanel = ui.Panel({
      widgets: [legendTitle, colorBar, legendLabels],
      style: {
        position: 'bottom-left',  // Position the legend in the bottom-left corner
        padding: '8px'  // Add some padding for spacing
      }
    });
    
    // Add the legend panel to the map
    Map.add(legendPanel);
     
    
    
    var demAt200mforA = dem.filterBounds(country_grid50).select('DEM');
    demAt200mforA = demAt200mforA.map(function(image){
      image.reduceResolution({
      reducer: ee.Reducer.mean(),
      maxPixels: 1024
    }).reproject({
      crs:projectionAt200
    });
      return image;
    });
    
    demAt200mforA = demAt200mforA.median();
    
    
    var gridAltitude = calculateMeanAltitude(country_grid50, demAt200mforA);
    
    var Altitudechart = ui.Chart.feature.byFeature(gridAltitude,'id_c').setChartType('Table').setOptions({
          title: 'Parcel Characteristics)',
        });
    
    var downloadLabel_altitude=ui.Label("");
    resultsPanel.add(downloadLabel_altitude);
    
    var legendLabel_altitude=ui.Label("");
    resultsPanel.add(legendLabel_altitude);
    
    var sourceLabel_altitude=ui.Label("");
    
    
    
    function updateDownloadLabel_altitude(url){
      downloadLabel_altitude.setValue("Click to download stats for "+countrySelect.getValue());
      downloadLabel_altitude.setUrl(url);
      legendLabel_altitude.setValue("Values are given in meters on columns MeanAltitude and StdErrAltitude");
      sourceLabel_altitude.setValue("Access the source data.");
      sourceLabel_altitude.setUrl("https://spacedata.copernicus.eu/documents/20123/121239/GEO1988-CopernicusDEM-SPE-002_ProductHandbook_I4.0.pdf");
    }
    
    gridAltitude.getDownloadURL({
      format:"CSV",
      filename: "mytable",
      callback: updateDownloadLabel_altitude
    });
    
    resultsPanel.add(Altitudechart);
    resultsPanel.add(sourceLabel_altitude);
    
  }
  
  if(layerSelect.getValue() == 'Gaez+ Crop Distribution (2015)'){
    var gaez = calculateTotalGaezYield().clip(country_grid50);
    Map.addLayer(gaez.select(26).updateMask(gaez.select(26).gte(1)),
       {min:gaez_vis.min, max:gaez_vis.max, palette: gaez_palette},
     'Total crop yield for all crops (kilograms)');
    
    legendPanel.clear();
    Map.remove(legendPanel);
    
    var legendTitle = ui.Label({
      value: 'Total crop yield for all crops (kilograms)',
      style: {fontWeight: 'bold'}
    });
    
    // Create the colour bar for the legend
    var colorBar = ui.Thumbnail({
      image: ee.Image.pixelLonLat().select(0),
      params: makeColorBarParams(gaez_vis.palette),
      style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
    });
    
    // Create a panel with three numbers for the legend
    var legendLabels = ui.Panel({
      widgets: [
        ui.Label(gaez_vis.min, {margin: '4px 8px'}),
        ui.Label(
            ((gaez_vis.max - gaez_vis.min) / 2 + gaez_vis.min),
            {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}
        ),
        ui.Label(gaez_vis.max, {margin: '4px 8px'})
      ],
      layout: ui.Panel.Layout.flow('horizontal')
    });
    
    // Create a container panel for the legend to control its position
    legendPanel = ui.Panel({
      widgets: [legendTitle, colorBar, legendLabels],
      style: {
        position: 'bottom-left',  // Position the legend in the bottom-left corner
        padding: '8px'  // Add some padding for spacing
      }
    });
    
    // Add the legend panel to the map
    Map.add(legendPanel);
    
     
     
    var gridGaez = getGaezStats(country_grid50, gaez, gaezmerged);

    var Gaezchart = ui.Chart.feature.byFeature(gridGaez,'id_c').setChartType('Table').setOptions({
          title: 'Parcel Characteristics)',
        });
    
    var downloadLabel_gaez=ui.Label("");
    resultsPanel.add(downloadLabel_gaez);
    
    var legendLabel_gaez=ui.Label("");
    resultsPanel.add(legendLabel_gaez);
    
    var sourceLabel_gaez=ui.Label("");
    
    
    
    function updateDownloadLabel_gaez(url){
      downloadLabel_gaez.setValue("Click to download stats for "+countrySelect.getValue());
      downloadLabel_gaez.setUrl(url);
      legendLabel_gaez.setValue("Values are given in kilograms per hectare. These are obtained by (1) multiplying the yield (kg/ha) by the harvested area (ha) for each crop; (2) computing the sum of that multiplication into the grid cells; and (3) dividing the resulting value by the sum of harvested areas for each crop in each cell.");
      sourceLabel_gaez.setValue("Access the source data.");
      sourceLabel_gaez.setUrl("https://dataverse.harvard.edu/dataverse/GAEZ_plus_2015");
    }
    
    gridGaez.getDownloadURL({
      format:"CSV",
      filename: "mytable",
      callback: updateDownloadLabel_gaez
    });
    
    resultsPanel.add(Gaezchart);
    resultsPanel.add(sourceLabel_gaez);
  }
  
  if(layerSelect.getValue() == 'GLW4 World Gridded Livestock (2020)'){
    var gridGLW = getGLWStats(country_grid50);
    Map.addLayer(glwmerged.clip(country_grid50).select(0).updateMask(glwmerged.select(0).gte(1)),
       {min:0, max:150, palette: glw_palette},
     'Total livestock density (heads/km²)');
    
    legendPanel.clear();
    Map.remove(legendPanel);
    
    var legendTitle = ui.Label({
      value: 'Total livestock density (heads/km²)',
      style: {fontWeight: 'bold'}
    });
    
    // Create the colour bar for the legend
    var colorBar = ui.Thumbnail({
      image: ee.Image.pixelLonLat().select(0),
      params: makeColorBarParams(glw_vis.palette),
      style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
    });
    
    // Create a panel with three numbers for the legend
    var legendLabels = ui.Panel({
      widgets: [
        ui.Label(glw_vis.min, {margin: '4px 8px'}),
        ui.Label(
            ((glw_vis.max - glw_vis.min) / 2 + glw_vis.min),
            {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}
        ),
        ui.Label(glw_vis.max, {margin: '4px 8px'})
      ],
      layout: ui.Panel.Layout.flow('horizontal')
    });
    
    // Create a container panel for the legend to control its position
    legendPanel = ui.Panel({
      widgets: [legendTitle, colorBar, legendLabels],
      style: {
        position: 'bottom-left',  // Position the legend in the bottom-left corner
        padding: '8px'  // Add some padding for spacing
      }
    });
    
    // Add the legend panel to the map
    Map.add(legendPanel);
    
     
     
    //var gridGLW = getGLWStats(country_grid50);

    var GLWchart = ui.Chart.feature.byFeature(gridGLW,'id_c').setChartType('Table').setOptions({
          title: 'Parcel Characteristics)',
        });
    
    var downloadLabel_glw=ui.Label("");
    resultsPanel.add(downloadLabel_glw);
    
    var legendLabel_glw=ui.Label("");
    resultsPanel.add(legendLabel_glw);
    
    var sourceLabel_glw=ui.Label("");
    
    
    
    function updateDownloadLabel_glw(url){
      downloadLabel_glw.setValue("Click to download stats for "+countrySelect.getValue());
      downloadLabel_glw.setUrl(url);
      legendLabel_glw.setValue("Values are given in total number of heads or birds.");
      sourceLabel_glw.setValue("Access the source data.");
      sourceLabel_glw.setUrl("https://data.apps.fao.org/catalog/iso/9d1e149b-d63f-4213-978b-317a8eb42d02");
    }
    
    gridGLW.getDownloadURL({
      format:"CSV",
      filename: "mytable",
      callback: updateDownloadLabel_glw
    });
    
    resultsPanel.add(GLWchart);
    resultsPanel.add(sourceLabel_glw);
  }
    
  
}


 
var calculateButton = ui.Button({
  label: 'Calculate statistics',
  //add the corresponding function to onClick
  onClick: calculate,
  style:{width:'100%'}
});

mainPanel.add(calculateButton);

var resultsPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical', true)
});
mainPanel.add(resultsPanel);




/*

//////////////////////////////////////////////////////////
//EXPORT ENTIRE WORLD STATS

function exportAllZonalStatistics() {
  // List of layers and corresponding processing functions
  var layers = [
    { name: 'COPERNICUS LandCover 2019', process: calculateClassArea, image: landcover, scale: 100 },
    { name: 'Forest Management', process: calculateClassArea_forest, image: forestmanagement, scale: 100 },
    { name: 'Population 2020', process: calculateTotalPop, image: worldpop, scale: 92.766, input: 'image'},
    { name: 'Travel time to major cities', process: calculateMeanTime, image: majorcities, scale: 500, input: 'image' },
    { name: 'Protected Areas', process: calculateClassArea_protected, image: protectedareas, scale: 1000 },
    { name: 'HILDA LandCover Change 2015-2019', process: calculateClassArea_hildaLUC, image: getLUC(hilda15, hilda19), scale: 1000 },
    { name: 'HILDA+ LandCover 2015', process: calculateClassArea_hilda, image: hilda15, scale: 1000 },
    { name: 'Slope (Copernicus)', process: calculateMeanSlope, image: dem.map(makeslope).median(), scale: 494.753 },
    { name: 'Altitude (Copernicus)', process: calculateMeanAltitude, image: dem.median(), scale: 494.753 },
    { name: 'Gaez+ Crop Distribution (2015)', process: getGaezStats, image1: calculateTotalGaezYield(), image2: gaezmerged, scale: 9276.624 },
    {name: 'GLW4 World Gridded Livestock (2020)', process: getGLWStats, image: glwmerged, scale:9276.624232772794, input:'image'}
  ];
  

  // Iterate through each layer
  layers.forEach(function(layer) {
    var featureCollection;
    
    // Handle GAEZ layer separately due to dual image inputs
    if (layer.name === 'Gaez+ Crop Distribution (2015)') {
      featureCollection = layer.process(grid50, layer.image1, layer.image2);
    } else {
      if (layer.name === 'Slope (Copernicus)') {
        featureCollection = 1;
        var demAt200m = dem.filterBounds(grid50).select('DEM');
        demAt200m = demAt200m.map(function(image){
          image.reduceResolution({
          reducer: ee.Reducer.mean(),
          maxPixels: 1024
        }).reproject({
          crs:projectionAt200
        });
          return image;
        });
        var slopeAt200m = demAt200m.map(makeslope).median();
        featureCollection = layer.process(grid50, slopeAt200m);
      } else {
        if (layer.name === 'Altitude (Copernicus)'){
          var demAt200mforA = dem.filterBounds(grid50).select('DEM');
          demAt200mforA = demAt200mforA.map(function(image){
            image.reduceResolution({
            reducer: ee.Reducer.mean(),
            maxPixels: 1024
          }).reproject({
            crs:projectionAt200
          });
            return image;
          });
          
          demAt200mforA = demAt200mforA.median();
          
          featureCollection = layer.process(grid50, demAt200mforA);
          
        } else {
        if (layer.input === 'image') {
          featureCollection = layer.process(grid50);
        } else {
          featureCollection = grid50.map(layer.process);
        }
      }
    }
    }
    
    // Export the feature collection as a CSV to Google Drive
    Export.table.toDrive({
      collection: featureCollection,
      description: layer.name + '_Zonal_Statistics',
      folder: 'EarthEngineExports', // Your Google Drive folder name
      fileNamePrefix: layer.name.replace(/\s+/g, '_') + '_Zonal_Statistics',
      fileFormat: 'CSV'
    });
  });
}

var exportButton = ui.Button({
  label: 'Export All Zonal Statistics',
  onClick: exportAllZonalStatistics,
  style: {width: '100%'}
});

mainPanel.add(exportButton);


*/

