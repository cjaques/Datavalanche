// 
// C.Jaques, christian.jaques@idiap.ch, November 2018
//
// Inspired from DataViz exercise session 8, 
//      http://bl.ocks.org/d3noob/9267535, 
//      https://github.com/chrissng/d3.gpx
// 

// globals
var map;
var feature;


class MapPlot {

    constructor(svg_element_id) {
        map = L.map('map').setView([46.8, 8.2], 8); // center and zoom
        const mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
            'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; ' + mapLink + ' Contributors',
            maxZoom: 16,
            }).addTo(map);
                
        // Initialize the SVG layer
        map._initPathRoot()    

        // Pick up the SVG from the map object
        this.svg = d3.select("#map").select("svg");
        this.g = this.svg.append("g");


        const file_list = ["data/morcles.gpx", "data/mumi.gpx", "data/mu.gpx"];
        let all_promises = [];
        let idx = 0;

        // go through all items in list 
        for(var i=0; i<file_list.length; i++){       
            all_promises.push(new Promise(function(resolve, reject){
                d3.xml(file_list[i], function(data){
                    // interesting way to parse XML --> https://github.com/chrissng/d3.gpx
                    let lineString = [];
                    let nameli = ""; // why not Swiss German ?

                    // first, read name of outing
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
            for (i=0; i< file_list.length; i++){
                gpx_data.push(results[i]);
                console.log(gpx_data[i]);
            }

            // Draw the GPX points
            feature = [];
            // store all points in a single array before adding them to the map, otherwise update function doesn't work
            var gpx_data_flat= gpx_data[0];
             for(var i = 1; i<gpx_data.length; i++){
                 gpx_data_flat = gpx_data_flat.concat(gpx_data[i]);
             }  
            feature = this.svg.selectAll("circle")
            .data(gpx_data_flat)
            .enter()
            .append("circle")
            .attr("r", 5)
            .style("fill", "#ff6b06")
            .style("opacity", 0.8);

            map.on("viewreset", this.update);
            this.update();
        });
    }

    update() {
        feature.attr("transform", 
        function(d) { 
            return "translate("+ 
                map.latLngToLayerPoint([d["lat"], d["lon"]]).x +","+ 
                map.latLngToLayerPoint([d["lat"], d["lon"]]).y +")";
            }
        )
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


