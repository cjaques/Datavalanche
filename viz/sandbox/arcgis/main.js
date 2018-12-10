
  var map;
  var featureLayer;

  // require([
  //   "esri/map",
  //   "esri/layers/FeatureLayer",
  //   "esri/dijit/PopupTemplate",
  //   "esri/request",
  //   "esri/geometry/Point",
  //   "esri/graphic",
  //   "esri/Color",
  //   "esri/symbols/SimpleMarkerSymbol",
  //   "esri/renderers/SimpleRenderer",
  //   "esri/InfoTemplate",
  //   "dojo/on",
  //   "dojo/_base/array",
  //   "dojo/domReady!",
  //   // "d3",
  // ], function(
  //   Map,
  //   FeatureLayer,
  //   PopupTemplate,
  //   esriRequest,
  //   Point,
  //   Color,
  //   SimpleRenderer,
  //   SimpleMarkerSymbol,
  //   InfoTemplate,
  //   Graphic,
  //   on,
  //   array
  // ) {
  	require([
  	"esri/views/MapView",
      "esri/map",
      "esri/layers/FeatureLayer",
      "esri/geometry/Point",
      // "esri/widgets/Legend",
      "esri/request"
    ], function(MapView, Map, FeatureLayer, Point, Legend, esriRequest) {

      var layer, legend;

    /**************************************************
       * Create the map and view
       **************************************************/

      var map = new Map({
        basemap: "dark-gray"
      });

      // Create MapView
      var view = new MapView({
        container: "viewDiv",
        map: map,
        center: [8.2, 46.8],
        zoom: 7,
        // customize ui padding for legend placement
        ui: {
          padding: {
            bottom: 15,
            right: 0
          }
        }
      });


    //hide the popup if its outside the map's extent
    map.on("mouse-drag", function(evt) {
      if (map.infoWindow.isShowing) {
        var loc = map.infoWindow.getSelectedFeature().geometry;
        if (!map.extent.contains(loc)) {
          map.infoWindow.hide();
        }
      }
    });
;

    map.on("layers-add-result", function(results) {
    	console.log("ADDING RESULTS");
      requestGPX();
    });
    


  function requestGPX() {
  	// read gpx files here with d3
    var features = [];
    const file_list = ["data/morcles.gpx", "data/mumi.gpx", "data/mu.gpx"];
    var gpx_data = [];
    var all_promises = [];

    // go through all items in list 
    for(var i=0; i < file_list.length; i++){       
    	// FIXME too much parenthesis
        all_promises.push(new Promise(function(resolve, reject){
        	d3.xml(file_list[i], function(data){
            // interesting way to parse XML --> https://github.com/chrissng/d3.gpx
            let lineString = [];
	        // GPX files are filled in various ways
	        d3.select(data).selectAll("rte").selectAll("rtept").each(function() {
	            var lat = parseFloat(d3.select(this).attr("lat"));
	            var lon = parseFloat(d3.select(this).attr("lon"));
	            lineString.push([lon, lat]);
	        });
	        d3.select(data).selectAll("trkseg").selectAll("trkpt").each(function() {
	            var lat = parseFloat(d3.select(this).attr("lat"));
	            var lon = parseFloat(d3.select(this).attr("lon"));
	            lineString.push([lon, lat]);
	        });
	        resolve(lineString);
        })}));
    };

    // // Once all data loading promises have been solved
    Promise.all(all_promises).then((results) =>{
    	console.log("ALL PROMISES KEPT");
        let gpx_data = [];
        for (i=0; i< file_list.length; i++){
            gpx_data.push(results[i]);
        }


        var ptsRenderer = {
        type: "simple", // autocasts as new SimpleRenderer()
        symbol: {
          type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
          style: "circle",
          size: 20,
          color: [211, 255, 0, 0],
          outline: {
            width: 1,
            color: "#FF0055",
            style: "solid"
          }
        },
        visualVariables: [
        {
          type: "size",
          field: "mag", // earthquake magnitude
          valueUnit: "unknown",
          minDataValue: 2,
          maxDataValue: 7,
          // Define size of mag 2 quakes based on scale
          minSize: {
            type: "size",
            valueExpression: "$view.scale",
            stops: [
            {
              value: 1128,
              size: 12
            },
            {
              value: 36111,
              size: 12
            },
            {
              value: 9244649,
              size: 6
            },
            {
              value: 73957191,
              size: 4
            },
            {
              value: 591657528,
              size: 2
            }]
          },
          // Define size of mag 7 quakes based on scale
          maxSize: {
            type: "size",
            valueExpression: "$view.scale",
            stops: [
            {
              value: 1128,
              size: 80
            },
            {
              value: 36111,
              size: 60
            },
            {
              value: 9244649,
              size: 50
            },
            {
              value: 73957191,
              size: 50
            },
            {
              value: 591657528,
              size: 25
            }]
          }
        }]
      };

       const fields = {
         name : "ObjectID",
         alias : "ObjectID",
         type : "string"};

	    for(var i=0; i< gpx_data.length; i++){
	    	for(var j=0; j< gpx_data[i].length; j++){
		        var attr = {};
		        attr["description"] = "Pt"
		        // attr["title"] = item.title ? item.title : "Flickr Photo";
		        var geomPt = new Point(gpx_data[i][j][0], gpx_data[i][j][1]); // 46.8
				var symb = {
				  type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
				  style: "square",
				  color: "blue",
				  size: "8px",  // pixels
				  outline: {  // autocasts as new SimpleLineSymbol()
				    color: [ 255, 255, 0 ],
				    width: 3  // points
				  }};
		        var graphic = new Graphic({
		        	geometry: geomPt,
		        	symbol: symb,
		        	attributes: attr
		        });
		        features.push(graphic);	
		    }
	    };


	featureLayer = new FeatureLayer({
		source: features,
		fields: fields,
		objectIdField: 'ObjectID'
	});

    // applyEdits to update points
    // featureLayer.applyEdits(features, null, null);
    //add the feature layer that contains the GPX data
    map.addLayers([featureLayer]);

    });
  }

  function requestFailed(error) {
    console.log('failed');
  }
});
  

