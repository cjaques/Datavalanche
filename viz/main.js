
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
		this.svg = d3.select('#' + svg_element_id);

		// may be useful for calculating scales
		const svg_viewbox = this.svg.node().viewBox.animVal;
		this.svg_width = svg_viewbox.width;
		this.svg_height = svg_viewbox.height;

		console.log("In constructor");

		const population_promise = d3.csv("data/cantons-elevation.csv").then((data) => {

			return data;
		});

		const map_promise = d3.json("data/ch-cantons.json").then((topojson_raw) => {
			const canton_paths = topojson.feature(topojson_raw, topojson_raw.objects.cantons);
			return canton_paths.features;
		});

		const point_promise = d3.csv("data/locations_avalanches.csv").then((data) => {

			// process the Instagram data here (optional)

			return data;
		});

		Promise.all([population_promise, map_promise, point_promise]).then((results) => {
			let cantonId_to_population = results[0];
			let map_data = results[1];
			let point_data = results[2];

			console.log('Data loaded yyy');


			// Draw the cantons

			var projection = d3.geoNaturalEarth1()
					.center([8.22666667, 46.80111111])
					.scale(10000)
					.translate([500, 275]);
    	var path = d3.geoPath().projection(projection);


			var color_scale = d3.scaleLog().domain([516,4634])
				.interpolate(d3.interpolateHcl)
	      .range([d3.rgb('#ffffff'), d3.rgb('#1e4363')]);

			var path_generator = this.svg.selectAll("path")
	      .data(map_data)
	    	.enter();

			path_generator.append("path")
				.attr("d", path)
				.style("fill", function(d,i){return color_scale(cantonId_to_population[i].elevation)})
				.attr("class", "canton");

			// Draw the canton labels
			path_generator.append("text")
 		 		.text(function(d){return d.properties.name;})
 				.attr("class", "canton-label")
 				.attr("transform", function(d){
 					let centroid = path.centroid(d);
 					return "translate("+centroid[0]+","+centroid[1]+")";});

			// Draw the points
			this.svg.selectAll("circle")
	      .data(point_data)
	    	.enter()
				.append("circle")
				.attr("class", "point")
				.attr("r", 3)
				.attr("cx", function(d){return projection([d.lon, d.lat])[0];})
				.attr("cy", function(d){return projection([d.lon, d.lat])[1];});

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
