// 
// Copyright T. Kulak, E. Pignat, C.Jaques, name DOT surname AT idiap DOT ch, December 2018
//
//      DATAVALANCHE PROJECT DECEMBER 2018
//
//      Project for K.Benzi's EPFL course "Data Visualisation"
// 

// ------------------------------------------------------------------------ GLOBALS
var map;
var feature;
var avalanches_points;
var avalanche_points_features;


// ------------------------------------------------------------------------ MAPPLOT CLASS
class MapPlot {

    constructor(svg_element_id) {
        map = L.map('map').setView([46.8, 8.2], 8); // center and zoom for Switzerland
        const mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        this.mainLayer = L.tileLayer(
            'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; ' + mapLink + ' Contributors',
            maxZoom: 16,
            }).addTo(map);
                
        // Initialize the SVG layer
        map._initPathRoot()    

        // DEBUG BELOW -- trying to add a sliderControl
        // slider control
        // let sliderControl = L.control.sliderControl({position: "topright", layer: this.mainLayer});
        // //Make sure to add the slider to the map ;-)
        // map.addControl(sliderControl);
        // //And initialize the slider
        // sliderControl.startSlider();

        // Pick up the SVG from the map object
        this.svg = d3.select("#map").select("svg");
        // this.g = this.svg.append("g");

        const file_list =  read_text_file("data/files_2.txt"); // files.txt and files_2.txt contain a list of all GPX files
        let array_list = file_list.split("\n");
        let all_promises = [];

        // read avalanches locations, including orientation
        all_promises.push(new Promise(function(resolve, reject){
            d3.csv("data/locations_avalanches_orientation.csv", function(data){
                resolve(data);
            });
        }));

        // go through all GPX files in list 
        let idx = 0;
        for(let i=0; i<array_list.length - 1; i++){ // -1 because sometimes the last item of the list is empty
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

                    // GPX traces
                    d3.select(data).selectAll("rte").selectAll("rtept").each(function() {
                        let lat = parseFloat(d3.select(this).attr("lat"));
                        let lon = parseFloat(d3.select(this).attr("lon"));
                        lineString.push({"lon": lon, "lat" : lat, "name":nameli, "id":idx});
                    });
                    d3.select(data).selectAll("trkseg").selectAll("trkpt").each(function() {
                        let lat = parseFloat(d3.select(this).attr("lat"));
                        let lon = parseFloat(d3.select(this).attr("lon"));
                        lineString.push({"lon": lon, "lat" : lat, "name":nameli, "id":idx});
                    });
                    resolve(lineString);
                    idx += 1; // update idx to be able to differentiate gpx traces
                })
            }));
        };

        // // Once all data loading promises have been solved
        Promise.all(all_promises).then((results) =>{
            avalanches_points = results[0];
            let gpx_data = [];
            for (let i=1; i< array_list.length-1; i++){
                gpx_data.push(results[i]);
            }

            // Draw a heatmap from all GPX points
            // TODO : update heatlayer sequentially, adding gpx points
            let points_array = [];
            // everything within a double loop to be a bit faster
            for(let i=0; i<gpx_data.length; i++){
                for(let j=0; j<gpx_data[i].length; j++){
                    points_array.push([gpx_data[i][j]['lat'], gpx_data[i][j]['lon'], 0.1])
                }
            }
            let heat = L.heatLayer(points_array, {radius:15, gradient: {0.2: 'blue', 0.6: 'lime', 1: 'yellow'}});
            heat.addTo(map)


            // Draw avalanches
            avalanche_points_features = this.svg.selectAll("circle")
                .data(avalanches_points)
                .enter()
                .append("circle")
                .attr("class", "point")
                .attr("r", 5);

            map.on("viewreset", update_map);
            update_map();
        });
    }

}
// ------------------------------------------------------------------------ END OF MAPPLOT


// ------------------------------------------------------------------------ HELPER FUNCTIONS
function update_map(){
    let count = 0;
    avalanche_points_features
        .attr("cx", function(d){let rad = 2 * map.getZoom() - 4; 
                                return map.latLngToLayerPoint([d["lat"], d["lon"]]).x + rad * Math.cos(d['orientation']);})
        .attr("cy", function(d){let rad = 2* map.getZoom() - 4;
                                return map.latLngToLayerPoint([d["lat"], d["lon"]]).y + rad * Math.sin(d['orientation']);})
        .style("fill", "#ff6b06")
        .style("r", function(){return map.getZoom() - 3;}) // adapt avalanche point size to zoom level
        .style("opacity", 0.7)
        .transition()
            .duration(500)
            .ease("exp-in-out") // .ease(d3.easeLinear)
            .attr("cx", function(d){let rad = 2 * map.getZoom() - 4; 
                                    return map.latLngToLayerPoint([d["lat"], d["lon"]]).x - rad * Math.cos(d['orientation']);})
            .attr("cy", function(d){let rad = 2* map.getZoom() - 4; 
                                    return map.latLngToLayerPoint([d["lat"], d["lon"]]).y - rad * Math.sin(d['orientation']);})
            .each("end", function(){
                    count = count+1;
                    if(count==avalanches_points.length){
                        update_map();
                    }
            });
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


function read_text_file(filename){
    let return_text;
    let rawfile = new XMLHttpRequest();
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
