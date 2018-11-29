// 
// C.Jaques, christian.jaques@idiap.ch, November 2018
//
// Largely inspired from DataViz exercise session 8
// 
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

    redraw(transform) {
        context.clearRect(0, 0, this.width, this.height);
        context.save();
        if (transform) {
          context.translate(transform.x, transform.y);
          context.scale(transform.k, transform.k);    
        }
    }

    constructor(svg_element_id) {
        this.svg = d3.select('#' + svg_element_id);

        // may be useful for calculating scales
        const svg_viewbox = this.svg.node().viewBox.animVal;
        this.svg_width = svg_viewbox.width;
        this.svg_height = svg_viewbox.height;

        const file_list = ["data/morcles.gpx", "data/mumi.gpx", "data/mu.gpx"];
        var all_promises = [];

        all_promises.push(d3.json("data/ch-cantons.json").then((topojson_raw) => {
            const canton_paths = topojson.feature(topojson_raw, topojson_raw.objects.cantons);
            return canton_paths.features;
        }));

        // go through all items in list 
        for(var i=0; i < file_list.length; i++){
            all_promises.push(d3.xml(file_list[i]).then((data) =>{
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
                return lineString;
            }));
        };

        // Once all data loading promises have been solved
        Promise.all(all_promises).then((results) =>{
            let map_data = results[0];
            let gpx_data = [];
            for (i=0; i< file_list.length; i++){
                gpx_data.push(results[i+1]);
            }

            // Declare projection
            var projection = d3.geoMercator() // d3.geoEqualEarth()
                .center([8.2, 46.8])  // set center of map to 46°48′4″N 8°13′36″E :
                .scale(10000)
                .translate([500, 275]);
            var path = d3.geoPath().projection(projection);

            // catch cannvas and add zoom function
            // on("zoom", function () {redraw(d3.event.transform);});

            // get max value from cantonId_to_population <-- IMPROVE THIS
            // var max = 0;
            // var min = 100000;
            // for(var i=0; i<cantonId_to_population.length; i++){
            //     let v = +cantonId_to_population[i].density;
            //     if(v > max){
            //         max = v;
            //     }
            //     if(v < min){
            //         min = v;
            //     }
            // }

            var max = 6000;
            var min = 3;

            // color scale
            //var color_scale = d3.interpolateViridis; //.domain([0, max]);

            var color_scale = d3.scaleLog()
                .domain([min, max])
                .range([d3.rgb('#453ef0'), d3.rgb('#0be8f0')])
                .interpolate(d3.interpolateHcl);
            // Draw the cantons
            this.svg.selectAll("path")
                .data(map_data)
                .enter().append("path")
                .attr("d", path)
                .attr('class','canton');
                // .style("fill", function(d, i){return color_scale(cantonId_to_population[i].density)});

            // // Draw the canton labels
            // this.svg.selectAll("text")
            //     .data(map_data)
            //     .enter()
            //     .append("text")
            //     .text(function(d){return d.id}) // return d.properties["name"]})  <-- prints full canton name
            //     .attr("x", function(d){return path.centroid(d)[0]})
            //     .attr("y", function(d){return path.centroid(d)[1]})
            //     .attr("class", "canton-label");


            // Draw the GPX points
            for(var i = 0; i<file_list.length; i++){
                console.log("Mimu i ", i, " data ", gpx_data[i]);
                this.svg.selectAll("circle")
                .data(gpx_data[i])
                .enter()
                .append("circle")
                .attr("cx", function(d){console.log(" : ", d); return projection(d)[0];}) // [+d.lon, +d.lat])[0];})
                .attr("cy", function(d){return projection(d)[1];}) //function(d){return projection([+d.lon, +d.lat])[1];})
                .attr("r", 1)
                .style("fill", "#ff6b06")
                .style("opacity", 0.5);
            }
    

            // add colorbar to drawing
            this.makeColorbar(this.svg, color_scale, [50, 30], [20, this.svg_height - 2*30]);
        });
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



