function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#00';
    for (var i = 0; i < 4; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function jsonData(icao) {
    var result;
    $.ajax({
        type: 'GET',
        url: 'data/2015/icao=' + icao + '.json',
        dataType: 'json',
        async: false,
        success: function (data) {
            result = data;
        }
    });
    return result;
}


function addGeoJSONLayer(map, data, showLine) {
    const maxAltitude = 45000
    const standardImageSize = 30
    for (let i = 0; i < data.length; i++) {
        let dataArray = [];
        for (let key in data[i]) {
            if (data[i].hasOwnProperty(key)) {
                dataArray.push(data[i][key]);
            }
        }
        let myStyle = null;
        if (showLine) {
            myStyle = {
                "opacity": 1,
                "color": getRandomColor()
            }
        } else {
            myStyle = {
                "opacity": 0,
                "color": getRandomColor()
            }
        }


        var geoJSONLayer = L.geoJSON(dataArray, {

            pointToLayer: function (feature, latLng) {
                let bearing = latLng.alt.toString().split(".")[0]
                let alt = latLng.alt.toString().split(".")[1]
                let imageIndex = parseInt(((Math.round(alt) / 1000) + 1).toString())
                if (imageIndex > 45) { // In case plane flies higher than 45000 ft.
                    imageIndex = 45
                }
                let imageLocation = "img/planeIcon/plane_" + imageIndex + '.png';
                if (feature.properties.hasOwnProperty('last')) {
                    return new L.Marker([latLng.lat, latLng.lng], {
                        icon: L.icon({
                            iconUrl: imageLocation,
                            iconSize: [22, 22],
                            iconAnchor: [11, 11]
                        }),

                    }).bindPopup("ICAO: " + feature.properties.name + "<br>" +
                        "Heading: " + parseInt(bearing) + "&#176;<br>" +
                        "Altitude: " + parseInt(alt) + " ft.<br>").setRotationAngle(bearing)
                        .on('mouseover', function (e) {
                            this.openPopup();
                        })
                        .on('mouseout', function (e) {
                            this.closePopup();
                        });
                }
                return L.circleMarker(latLng);
            },
            style: myStyle
        })
        geoJSONLayer.addTo(map);

        var geoJSONTDLayer = L.timeDimension.layer.geoJson(geoJSONLayer, {
            updateTimeDimension: true,
            duration: 'PT2M',
            updateTimeDimensionMode: 'union',
            addlastPoint: true
        });

        geoJSONTDLayer.addTo(map);
    }
}

//custom max min header filter
var minMaxFilterEditor = function (cell, onRendered, success, cancel, editorParams) {

    var end;

    var container = document.createElement("span");

    //create and style inputs
    var start = document.createElement("input");
    start.setAttribute("type", "number");
    start.setAttribute("placeholder", "Min");
    start.setAttribute("min", 0);
    start.setAttribute("max", 100);
    start.style.padding = "4px";
    start.style.width = "50%";
    start.style.boxSizing = "border-box";

    start.value = cell.getValue();

    function buildValues() {
        success({
            start: start.value,
            end: end.value,
        });
    }

    function keypress(e) {
        if (e.keyCode === 13) {
            buildValues();
        }

        if (e.keyCode === 27) {
            cancel();
        }
    }

    end = start.cloneNode();
    end.setAttribute("placeholder", "Max");

    start.addEventListener("change", buildValues);
    start.addEventListener("blur", buildValues);
    start.addEventListener("keydown", keypress);

    end.addEventListener("change", buildValues);
    end.addEventListener("blur", buildValues);
    end.addEventListener("keydown", keypress);


    container.appendChild(start);
    container.appendChild(end);

    return container;
}

//custom max min filter function
function minMaxFilterFunction(headerValue, rowValue, rowData, filterParams) {
    //headerValue - the value of the header filter element
    //rowValue - the value of the column in this row
    //rowData - the data for the row being filtered
    //filterParams - params object passed to the headerFilterFuncParams property

    if (rowValue) {
        if (headerValue.start !== "") {
            if (headerValue.end !== "") {
                return rowValue >= headerValue.start && rowValue <= headerValue.end;
            } else {
                return rowValue >= headerValue.start;
            }
        } else {
            if (headerValue.end !== "") {
                return rowValue <= headerValue.end;
            }
        }
    }

    return true; //must return a boolean, true if it passes the filter.
}


function loadTable() {
    return new Tabulator("#icao-table", {
        selectable: true,
        responsiveLayout: "hide",
        pagination: "local", //enable remote pagination
        height: 221, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        layout: "fitColumns", //fit columns to width of table (optional)
        columns: [ //Define Table Columns
            {title: "ICAO", field: "icao", align: "left", headerFilter: "input"},
            {title: "Owner", field: "owner", align: "left", headerFilter: "input"},
            {title: "Country", field: "owner_country", align: "left", headerFilter: "input"},
            {title: "Industry", field: "onwer_type", align: "left", headerFilter: "input"},
            {title: "Aircraft", field: "manufacturername", headerFilter: "input"},
            {
                title: "Number of flights",
                field: "nof",
                headerFilter: "number",
                headerFilterPlaceholder: "at least...",
                headerFilterFunc: ">="
            }
        ]
    });
}

function loadMap() {
    return L.map('map', {
        zoom: 4,
        fullscreenControl: true,
        timeDimensionControl: true,
        timeDimensionControlOptions: {
            timeSliderDragUpdate: true,
            loopButton: true,
            autoPlay: true,
            maxSpeed: 100,
            minSpeed: 1,
            playerOptions: {
                transitionTime: 100,
                loop: true
            }
        },
        timeDimension: true,
        center: [47.5162, 14.550]
    });
}

function addOsmLayer() {
    return L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZHRlbndvbGRlIiwiYSI6ImNrZnkzaWNsejAzbTgycG1sMDI5cWFtOXoifQ.X5OtudUzQTAMVvEflIyH-Q', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        minZoom: 3,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'your.mapbox.access.token'
    })
}


function addLegendLayer() {
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function () {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000].reverse(),
            colours = ['#1c0000', '#380000', '#550000', '#710000',
                '#8d0000', '#aa0000', '#c60000', '#e20000', '#ff0000'].reverse();

        div.innerHTML += '<strong>Altitude</strong><br>'
        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + colours[i] + '"></i> ' +
                grades[i] + (grades[i - 1] ? '&ndash;' + grades[i - 1] + '<br>' : '+ <br>');
        }
        return div;
    };

    return legend
}

$(document).ready(function () {
    function redrawMap() {
        map.remove();
        map = loadMap()
        addOsmLayer().addTo(map)
        addLegendLayer().addTo(map)
    }

    $('#dtBasicExample').DataTable();
    $('.dataTables_length').addClass('bs-select');

    let table = loadTable()

    $.getJSON('data/unique_icao_with_owner_details.json', {}).done(function (data) {
        table.setData(data);
    })

    let map = loadMap()
    addOsmLayer().addTo(map)

    addLegendLayer().addTo(map)
    let currentAircrafts = []

    function getICAOData(IcaoList) {
        let result = []
        IcaoList.forEach(function (icao) {
            if (!currentAircrafts.includes(icao)) {

                    result.push(jsonData(icao))
                currentAircrafts.push(icao);
            }
        })
        return result
    }

    function getAllAircraftIcaoData() {
        let result = []
        currentAircrafts.forEach(function (icao) {

                result.push(jsonData(icao))

        })

        return result
    }

    $("#showData").click(function () {
        let selectedIcaoArray = []
        let selectedData = table.getSelectedData()
        if (selectedData.length === 0) {
            alert("No aircrafts have been selected")
            return
        } else if (selectedData.length > 50) {
            if (window.confirm("Are you sure you want to display " + selectedData.length + " aircrafts?")) {
                for (let i = 0; i < selectedData.length; i++) {
                    selectedIcaoArray.push(selectedData[i]["icao"]);
                }
            }
        } else {
            for (let i = 0; i < selectedData.length; i++) {
                selectedIcaoArray.push(selectedData[i]["icao"]);
            }
        }


        addGeoJSONLayer(map, getICAOData(selectedIcaoArray), document.getElementById('isLineShown').checked)
    });

    $("#isLineShown").click(function () {
        redrawMap()
        addGeoJSONLayer(map, getAllAircraftIcaoData(), document.getElementById('isLineShown').checked)
    })

    $("#clearData").click(function () {
        redrawMap()
        currentAircrafts = []
    })

    $("#selectAll").click(function () {
        table.selectRow(true);
    })

    $("#deselectAll").click(function () {
        table.deselectRow();
    })
});











