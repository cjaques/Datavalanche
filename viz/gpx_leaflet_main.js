// 
// Copyright T. Kulak, E. Pignat, C.Jaques, name DOT surname AT idiap DOT ch, December 2018
//
// Inspired from DataViz exercise session 8, 
//      http://bl.ocks.org/d3noob/9267535, 
//      https://github.com/chrissng/d3.gpx
//      https://github.com/Leaflet/Leaflet.heat
// 

// globals
var map;
var feature;


class MapPlot {

    constructor(svg_element_id) {
        map = L.map('map').setView([46.8, 8.2], 8); // center and zoom
        const mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        this.mainLayer = L.tileLayer(
            'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; ' + mapLink + ' Contributors',
            maxZoom: 16,
            }).addTo(map);
                
        // Initialize the SVG layer
        map._initPathRoot()    

        // // TODO : DEBUG BELOW -- trying to add a sliderControl
        // // slider control
        // var sliderControl = L.control.sliderControl({position: "topright", layer: this.mainLayer});
        // //Make sure to add the slider to the map ;-)
        // map.addControl(sliderControl);
        // //And initialize the slider
        // sliderControl.startSlider();

        // Pick up the SVG from the map object
        this.svg = d3.select("#map").select("svg");
        this.g = this.svg.append("g");


        const file_list =  read_text_file("data/files_2.txt"); // read data/files.txt  ["data/morcles.gpx", "data/mumi.gpx", "data/mu.gpx"];
        var array_list = file_list.split("\n"); //  JSON.parse("[" + file_list.split("\n") + "]");


        let all_promises = [];
        let idx = 0;

        // go through all items in list 
        for(var i=0; i<array_list.length -1; i++){       
            all_promises.push(new Promise(function(resolve, reject){
                d3.xml("data/" + array_list[i], function(data){
                    // interesting way to parse XML --> https://github.com/chrissng/d3.gpx
                    let lineString = [];
                    let nameli = ""; // why not Swiss German ?

                    // read name of outing
                    d3.select(data).selectAll("rte").selectAll("name").each(function(){
                        nameli = this.innerHTML;
                    })
                    d3.select(data).selectAll("trk").selectAll("name").each(function(){
                        nameli = this.innerHTML;
                    })

                    // similarly, try to get the outing's date (not all GPX have the date included)
                    d3.select(data).selectAll("rte").selectAll("name").each(function(){
                        nameli = this.innerHTML;
                    })
                    d3.select(data).selectAll("trk").selectAll("name").each(function(){
                        nameli = this.innerHTML;
                    })

                    // GPX files are filled in various ways
                    d3.select(data).selectAll("rte").selectAll("rtept").each(function() {
                        var lat = parseFloat(d3.select(this).attr("lat"));
                        var lon = parseFloat(d3.select(this).attr("lon"));
                        lineString.push({"lon": lon, "lat" : lat, "name":nameli, "id":idx});
                    });
                    d3.select(data).selectAll("trkseg").selectAll("trkpt").each(function() {
                        var lat = parseFloat(d3.select(this).attr("lat"));
                        var lon = parseFloat(d3.select(this).attr("lon"));
                        lineString.push({"lon": lon, "lat" : lat, "name":nameli, "id":idx});
                    });
                    resolve(lineString);
                    idx += 1; // update idx
                })
            }));
        };

        // // Once all data loading promises have been solved
        Promise.all(all_promises).then((results) =>{
            let gpx_data = [];
            for (i=0; i< array_list.length-1; i++){
                gpx_data.push(results[i]);
            }

            // Draw the GPX points
            feature = [];
            // store all points in a single array before adding them to the map, otherwise update function doesn't work
            var gpx_data_flat= gpx_data[0];
             for(var i = 1; i<gpx_data.length; i++){
                 gpx_data_flat = gpx_data_flat.concat(gpx_data[i]);
             }  

            var points_array = [];
            for(var i =0; i<gpx_data_flat.length; i++){
                points_array.push([gpx_data_flat[i]['lat'], gpx_data_flat[i]['lon'], 0.1])
            }
            var heat = L.heatLayer(points_array, {radius:15, max:0.5, gradient: {0.2: 'blue', 0.6: 'lime', 1: 'yellow'}});
            // heat.setOpacity(0.2)
            heat.addTo(map);
            
        });
    }
}


// Boiler code to wait for page to completely load DOM
function whenDocumentLoaded(action) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", action);
    } else {
        // `DOMContentLoaded` already fired
        action();
    }
}

whenDocumentLoaded(() => {
    plot_object = new MapPlot('Datavalanche');
});



// ------------------------------------------------------------------------ HELPER FUNCTIONS

function read_text_file(filename){
    var return_text;
    var rawfile = new XMLHttpRequest();
    rawfile.open("GET", filename, false);
    rawfile.onreadystatechange = function (){
        if(rawfile.readyState === 4){
            if(rawfile.status === 200){
                return_text = rawfile.responseText;
            }
        }
    }
    rawfile.send(null);

    return return_text;
}
