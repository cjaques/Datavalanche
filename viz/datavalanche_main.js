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
var avalancheGroup;

// ------------------------------------------------------------------------ MAPPLOT CLASS
class MapPlot {

    constructor(svg_element_id) {
        avalancheGroup = L.layerGroup();
        var avalanche_icons = [];

        for (var i=0; i< 6; i++){
            avalanche_icons.push( L.icon({
                iconUrl: 'icons/avalanche_icon_' + i + '-01.png',
                shadowUrl: 'icons/avalanche_icon_shadow-01.png',
                iconSize:     [50, 50], // size of the icon
                shadowSize:   [50, 50], // size of the shadow
                iconAnchor:   [25, 37], // point of the icon which will correspond to marker's location
                shadowAnchor: [25, 37  ],  // the same for the shadow
                popupAnchor:  [0, 0]// point from which the popup should open relative to the iconAnchor
            }));
        }

        var avalance_points = d3.csv("data/locations_avalanches_fullfeatures.csv", function(data){
            data.forEach(function(d) {

                var marker = L.marker([d['lat'], d['lon']], {
                    achieve: 0.3, riseOnHover: true,
                    icon: avalanche_icons[parseInt(d['forecasted']) || 0],
                    opacity: 0.5, expo: d['orientation'], dead: d['dead'], inclination: parseInt(d['inclination']) || 0})
                    .on("mouseover", onMouseOver)
                    .on("mouseout", onMouseOut)
                    .addTo(avalancheGroup);
            });
        });

        this.mainLayer = L.tileLayer(
            'https://tile.osm.ch/switzerland/{z}/{x}/{y}.png', {
            attribution:  '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 16,
            });

        map = L.map('map', {layers: [this.mainLayer, avalancheGroup]}).setView([46.6, 8.2], 9); // center and zoom for Switzerland


        $.getJSON("data/gps_12.geojson",function(data){
            var heat = L.heatLayer(data.features[0].coordinates, {radius:15, gradient: {0.2: 'blue', 0.6: 'lime', 1: 'yellow'}});
            map.addLayer(heat);
        });


        // Pick up the SVG from the map object
        this.svg = d3.select("#map").select("svg");
    }

}
// ------------------------------------------------------------------------ END OF MAPPLOT


// ------------------------------------------------------------------------ HELPER FUNCTIONS

function onMouseOver(e){
    e.target.setOpacity(1.);
    var size = 40;
    var point = map.latLngToContainerPoint(e.latlng);
    var tooltip = d3.select(map.getContainer())
        .append("div")
        .attr("class", "tooltip")
        .style({ left: point.x - 19 + "px", top: point.y - 20  - 60 + "px" })
        .node();
    displayExpo(tooltip, e.target.options, size);

    var tooltip2 = d3.select(map.getContainer())
        .append("div")
        .attr("class", "tooltip")
        .style({ left: point.x - 19 - 40+ "px", top: point.y - 30  + "px" })
        .node();

    displayDead(tooltip2, e.target.options, size);

    var tooltip3 = d3.select(map.getContainer())
        .append("div")
        .attr("class", "tooltip")
        .style({ left: point.x - 19 + 40+ "px", top: point.y - 30  + "px" })
        .node();

    displayInclination(tooltip3, e.target.options, size);
}
function onMouseOut(e){
    e.target.setOpacity(.5);

    d3.select(map.getContainer()).selectAll(".tooltip").remove();
}

function displayInclination(node, value, size){
    if(value.inclination != 0)
    {
    var expo_pane = d3.select(node)
        .append("svg")
        .attr("width", size)
        .attr("height", size);
    //


    expo_pane.append("circle")
        .attr("cx", size/2)
        .attr("cy", size/2)
        .attr("r", size/2)
        .attr({'fill': 'black', 'opacity': 0.0})
        .transition()
        .attr({'fill': 'black', 'opacity': 0.8})
    ;

    expo_pane.append("g")
        .attr("transform", "translate(" + [size / 2, size / 2] + ")")
        .append("text")
        .attr('opacity', 0.)
        .attr('class', 'bubble slope')
        .text(value.inclination + String.fromCharCode(176))
        .transition()
        .attr('opacity', 0.8);

    }
}

function displayDead(node, value, size){
    var expo_pane = d3.select(node)
        .append("svg")
        .attr("width", size)
        .attr("height", size);
    //
    var lineFunction = d3.svg.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .interpolate('linear')

    var width = 11;
    var lineData = [
        { "x": size/2 - width/2,   "y": -width},
        { "x": size/2 - width/2,  "y": 0},
        { "x": size/2 + width/2,  "y": 0},
        { "x": size/2 + width/2,  "y": width},
        { "x": size/2 + 3 * width/2,  "y": width},
        { "x": size/2 + 3 * width/2,  "y": 2 * width},
        { "x": size/2 + width/2,  "y": 2 * width},
        { "x": size/2 + width/2,  "y": size},
        { "x": size/2 - width/2,  "y": size},
        { "x": size/2 - width/2,  "y": 2 * width},
        { "x": size/2 - 3 * width/2,  "y": 2 * width},
        { "x": size/2 - 3 * width/2,  "y": width},
        { "x": size/2 - width/2,  "y": width},
    ];

    expo_pane.append("path")
        .attr("d", lineFunction(lineData))
        .attr("fill", 'black')
        .attr("opacity", 0.0)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .transition()
        .attr({'fill': 'black', 'opacity': 0.8});


    expo_pane.append("g")
        .attr("transform", "translate(" + [size / 2, size / 2] + ")")
        .attr('class', "bubble dead")
        .append("text")
        .attr('opacity', 0.)
        .text(value.dead)
        .transition()
        .attr('opacity', 0.8)
    ;
}
function displayExpo(node, value, size){
    var size = 40;
    var expo_pane = d3.select(node)
        .append("svg")
        .attr("width", size)
        .attr("height", size);
    //
    expo_pane.append("circle")
        .attr("cx", size/2)
        .attr("cy", size/2)
        .attr("r", size/2)
        .attr({'fill': 'white', 'opacity': 0.0})
        .transition()
        .attr({'fill': 'white', 'opacity': 0.8})
    ;

    expo_pane.append("g")
        .attr("transform", "translate(" + [size / 2, size / 2] + ")")
        .append("text")
        .attr('class', 'bubble expo')
        .attr('opacity', 0.)
        .text(value.expo)
        .transition()
        .attr('opacity', 0.8)
    ;
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
