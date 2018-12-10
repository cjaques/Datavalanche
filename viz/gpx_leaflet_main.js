// 
// C.Jaques, christian.jaques@idiap.ch, November 2018
//
// Inspired from DataViz exercise session 8, http://bl.ocks.org/d3noob/9267535, https://github.com/chrissng/d3.gpx
// 
var map;
var feature;
class MapPlot {

    makeColorbar(svg, color_scale, top_left, colorbar_size, scaleClass=d3.scaleLog) {

        const value_to_svg = scaleClass()
            .domain(color_scale.domain())
            .range([colorbar_size[1], 0]);

        const range01_to_color = d3.scaleLinear()
            .domain([0, 1])
            .range(color_scale.range())
            .interpolate(color_scale.interpolate());

        // Axis numbers
        const colorbar_axis = d3.axisLeft(value_to_svg)
            .tickFormat(d3.format(".0f"))

        const colorbar_g = this.svg.append("g")
            .attr("id", "colorbar")
            .attr("transform", "translate(" + top_left[0] + ', ' + top_left[1] + ")")
            .call(colorbar_axis);

        // Create the gradient
        function range01(steps) {
            return Array.from(Array(steps), (elem, index) => index / (steps-1));
        }

        const svg_defs = this.svg.append("defs");

        const gradient = svg_defs.append('linearGradient')
            .attr('id', 'colorbar-gradient')
            .attr('x1', '0%') // bottom
            .attr('y1', '100%')
            .attr('x2', '0%') // to top
            .attr('y2', '0%')
            .attr('spreadMethod', 'pad');

        gradient.selectAll('stop')
            .data(range01(10))
            .enter()
            .append('stop')
            .attr('offset', d => Math.round(100*d) + '%')
            .attr('stop-color', d => range01_to_color(d))
            .attr('stop-opacity', 1);

        // create the colorful rect
        colorbar_g.append('rect')
            .attr('id', 'colorbar-area')
            .attr('width', colorbar_size[0])
            .attr('height', colorbar_size[1])
            .style('fill', 'url(#colorbar-gradient)')
            .style('stroke', 'black')
            .style('stroke-width', '1px')
    }


    constructor(svg_element_id) {
        // this.svg = d3.select('#' + svg_element_id);

        map = L.map('map').setView([46.8, 8.2], 7);
        const mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
            'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; ' + mapLink + ' Contributors',
            maxZoom: 18,
            }).addTo(map);
                
        // Initialize the SVG layer
        map._initPathRoot()    

        // Pick up the SVG from the map object
        this.svg = d3.select("#map").select("svg");
        this.g = this.svg.append("g");


        // const svg_viewbox = this.svg.node().viewBox.animVal;
        // this.svg_width = svg_viewbox.width;
        // this.svg_height = svg_viewbox.height;

        const file_list = ["data/morcles.gpx", "data/mumi.gpx", "data/mu.gpx"];
        var all_promises = [];

            // go through all items in list 
        for(var i=0; i<file_list.length; i++){       
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
            let gpx_data = [];
            for (i=0; i< file_list.length; i++){
                gpx_data.push(results[i]);
            }

            // Draw the GPX points
            // FIXME -- make this work with all GPX traces, not only1
            feature = [];
            for(var i = 0; i<gpx_data.length; i++){
                console.log(gpx_data[i]);
                feature[i] = this.svg.selectAll("circle")
                .data(gpx_data[i])
                .enter()
                .append("circle")
                .attr("cx", function(d){return map.latLngToLayerPoint([d[1], d[0]]).x}) //return d[1];}) 
                .attr("cy", function(d){return map.latLngToLayerPoint([d[1], d[0]]).y})//return d[1];})return d[0];})
                .attr("r", 10)
                .style("fill", "#ff6b06")
                .style("opacity", 0.8);
                console.log(feature);
            }

            map.on("viewreset", this.update);
            this.update();
        });
    }

    update() {
        for(var i =0; i<feature.length; i++){
            console.log('HERE--', i)
            feature[i].attr("transform", 
            function(d) { 
                return "translate("+ 
                    map.latLngToLayerPoint([d[1], d[0]]).x +","+ 
                    map.latLngToLayerPoint([d[1], d[0]]).y +")";
                }
            )
        }
    }

}


function whenDocumentLoaded(action) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", action);
    } else {
        // `DOMContentLoaded` already fired
        action();
    }
}

whenDocumentLoaded(() => {
    plot_object = new MapPlot('map-plot');
    // plot object is global, you can inspect it in the dev-console
});


