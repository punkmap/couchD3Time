var avlGeoJSON;
var timeUnitsGeoJSON = {
    'type': 'FeatureCollection'
    , 'features': []
};
var timeUnitsLayer;
var map;
var cars = {};
var speedDiameter = {
    "10": 4.5
    , "25": 4
    , "40": 3.5
    , "55": 3
    , "70": 2.5
, };
var blockgrouplayer = null;
var toggle = false;
var fiftyColors = {
    colors: {
        1: "#3DA833"
        , 2: "#B17B40"
        , 3: "#4D68AE"
        , 4: "#86561B"
        , 5: "#370FB3"
        , 6: "#AE1475"
        , 7: "726FEA"
        , 8: "#F286B3"
        , 9: "#539A9A"
        , 10: "#5D16CD"
        , 11: "#96BBA2"
        , 12: "#025614"
        , 13: "#116971"
        , 14: "#DC567F"
        , 15: "#1DC239"
        , 16: "#0D0B8B"
        , 17: "#E8D4FF"
        , 18: "#800FA8"
        , 19: "#1756EC"
        , 20: "#6F932D"
        , 21: "#3DA833"
        , 22: "#B17B40"
        , 23: "#4D68AE"
        , 24: "#86561B"
        , 25: "#370FB3"
        , 26: "#AE1475"
        , 27: "726FEA"
        , 28: "#F286B3"
        , 29: "#539A9A"
        , 30: "#5D16CD"
        , 31: "#96BBA2"
        , 32: "#025614"
        , 33: "#116971"
        , 34: "#DC567F"
        , 35: "#1DC239"
        , 36: "#0D0B8B"
        , 37: "#E8D4FF"
        , 38: "#800FA8"
        , 39: "#1756EC"
        , 40: "#6F932D"
    }
    , colorIndex: 0
}
$(document).ready(function () {
    mapFunctions.loadMap();
    queryFunctions.setModal();
    timeFunctions.setTimeButtonEvent();
//    chartFunctions.setChartButtonEvent();
//    queryFunctions.setDateDialog();
    queryFunctions.setBlockGroupButton();
})
mapFunctions = {
    loadMap: function () {
        L.Control.Attribution.prototype.options.position = "bottomleft";
        // initialise map
        L.mapbox.accessToken = 'pk.eyJ1IjoiY3RpcHBldHQiLCJhIjoiS3lpTnN4MCJ9.YG_uH8r7IgwgcSWEPYROMA';
        map = L.mapbox.map('map', null, {
            zoomControl: false
            , attributionControl: true
        }).setView([36.02, -78.89], 12);
        // define map layers
        var layers = {
            Streets: L.mapbox.tileLayer('mapbox.streets')
            , Outdoors: L.mapbox.tileLayer('mapbox.outdoors')
            , Satellite: L.mapbox.tileLayer('mapbox.satellite')
        };
        // define map overlays
        layers.Streets.addTo(map);
        var materialOptions = {
                fab: true
                , miniFab: true
                , rippleEffect: true
                , toolTips: false
                , color: 'primary'
            }
            // Material zoom control:
        var materialZoomControl = new L.materialControl.Zoom({
            position: 'topright'
        }).addTo(map);
    }
    , toggleBlockGroups: function () {
        {
            var style = {
                weight: 2
                , opacity: 1
                , color: 'white'
                , dashArray: '3'
                , fillOpacity: 0.7
                , fillColor: "blue" //getColor(feature.properties.density)
            };
            
            //!!!!!Example1
            if (blockgrouplayer == null) {
                $.ajax({
                    url: "http://127.0.0.1:5984/durham/_design/geoclass/_view/durham-blockgroups"
                    , success: function (results) {
                        //console.log("blockgrouplayer results: " + JSON.stringify(results.rows[0].key.geojson.features[0]));
                        var geoJSON = results.rows[0].key.geojson.features;
                        blockgrouplayer = L.geoJson(geoJSON, {
                            style: style
                        }).addTo(map);
                    }
                });
            }
            else {
                if (!toggle) {
                    map.removeLayer(blockgrouplayer);
                }
                else {
                    map.addLayer(blockgrouplayer);
                }
                toggle = !toggle;
            }
        }
    }
}
queryFunctions = {
    setBlockGroupButton: function () {
        var showQueryButton = document.querySelector('#date-blockgroups');
        showQueryButton.addEventListener('click', function () {
            mapFunctions.toggleBlockGroups();
        })
    }
    , setDateDialog: function () {
        var dialog = document.querySelector('dialog');
        var showQueryButton = document.querySelector('#date-dialog');
        showQueryButton.addEventListener('click', function () {
            dialog.showModal();
        })
        dialog.querySelector('.close').addEventListener('click', function () {
            dialog.close();
        })
    }
    , setModal: function () {
        var dialog = document.querySelector('dialog');
        var showQueryButton = document.querySelector('#query-dialog');
        if (!dialog.showModal) {
            dialogPolyfill.registerDialog(dialog);
        }
        showQueryButton.addEventListener('click', function () {
            var startQuery = 1507007573000;
            var endQuery = 1507093973000;
            //milliseconds per day = 86400000
            queryFunctions.getRecordsByTime(startQuery, endQuery)
        });
        dialog.querySelector('.close').addEventListener('click', function () {
            dialog.close();
        });
    }
    , getRecordsByTime: function (startkey, endkey) {
        //Example2
        $.ajax({
            url: "http://127.0.0.1:5984/avl/_design/avlTime/_view/time?startkey=" + startkey + "&endkey=" + endkey
            , success: function (result) {
                queryFunctions.processMapRecords(result);
            }
        });
    }
    , processMapRecords: function (results) {
        avlGeoJSON = {
            "type": "FeatureCollection"
            , "crs": {
                "type": "name"
                , "properties": {
                    "name": "EPSG:4326"
                }
            }
            , "features": {}
        };
        avlGeoJSON.features = _(results.rows).chain().map(function (result) {
            return {
                type: "Feature"
                , properties: result.value.properties
                , geometry: result.value.geometry
            }
        }).compact().value();
        queryFunctions.setUpSlider();
    }
    , setUpSlider: function () {
        var startTime;
        var startQuery = 1507007573000;
        var endQuery = 1507093973000;
        var brushed, formatDate, formatDateTime, height, margin, timeScale, width;
        
        formatDate = d3.time.format('%c');
        formatDateTime = d3.time.format("%a %b %e %H:%M:%S");
        margin = {
            top: 50
            , right: 50
            , bottom: 50
            , left: 50
        };
        width = 1000 - margin.left - margin.right;
        height = 100 - margin.bottom - margin.top;
        var startDate = new Date(startQuery).getTime();
        var endDate = new Date(endQuery).getTime();
        timeScale = d3.time.scale().domain([new Date(startDate), new Date(endDate)]).range([0, width]).clamp(true);
        var endValue, endingValue, startValue, startingValue, svg;
        startValue = timeScale(new Date(startDate));
        startingValue = new Date(startDate);
        endValue = timeScale(new Date(endDate));
        endingValue = new Date(endDate);
        
        var brush = d3.svg.brush().x(timeScale).on("brush", brushed);
        brush.extent([brush.extent()[0], new Date(brush.extent()[0].setSeconds(brush.extent()[0].getSeconds() + 45))]);
        svg = d3.select('#sliderContainer').append('svg').attr('width', "100%").attr('height', height + margin.top + margin.bottom).attr('id', 'slider').append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height / 2 + ')').call(d3.svg.axis().scale(timeScale).orient('bottom').tickFormat(function (d) {
            return formatDate(d);
        }).tickSize(0).tickPadding(25).tickValues([timeScale.domain()[0], timeScale.domain()[1]])).select('.domain').select(function () {
            return this.parentNode.appendChild(this.cloneNode(true));
        }).attr('class', 'halo');
        var _brush, dateRange, outFormat, rects, rects3, resizeE, resizeW, resizes, slider, textE, textW;
        var slider = svg.append("g").attr("class", "slider").call(brush);
        timeScale.brush = slider;
        _brush = d3.select('.brush');
        slider.selectAll(".extent,.resize").remove();
        slider.select(".background").attr("height", height);
        var handle = slider.append("g").attr("class", "handle")
        handle.append("path").attr("transform", "translate(0," + height / 2 + ")").attr("d", "M 0 -8 V 8")
        handle.append('text').text(startingValue).attr("transform", "translate(" + (-18) + " ," + (height / 2 - 25) + ")");
        slider.call(brush.event)

        function brushed() {
            if (d3.event.sourceEvent) { // not a programmatic event
                var brushStartDate = timeScale.invert(d3.mouse(this)[0]);
                var brushEndDate = new Date(brushStartDate);
                brushEndDate.setSeconds(brushStartDate.getSeconds() + 30);
                dateRange = [brushStartDate, brushEndDate];
                handle.attr("transform", "translate(" + timeScale(brushStartDate) + ",0)");
                handle.select('text').text(formatDate(brushStartDate));
                brush.extent([brushStartDate, brushEndDate]);
                updateFeaturesByDate(dateRange);
            }
            
        }
        var updateFeaturesByDate;
        var markerCount = 0;
        updateFeaturesByDate = function (dateRange) {
            var unitCount, unitStart, unitStop, unitFeature, unitTimeFeatures, popupDate, heatMapCoordsTime, heatTimeLayer;
            unitTimeFeatures = [];
            count = 0;
            heatMapCoordsTime = [];
            markerCount = 0;
            var idArray = []
            for (unitCount in avlGeoJSON.features) {
                unitFeature = avlGeoJSON.features[unitCount];
                //!!!!!TODO!!!!! for speed only loop over unitcodes that have not been placed in idArray using the following if statement. 
                //if (idArray.indexOf(unitFeature.properties.unitcode)==-1)
                unitStart = new Date(unitFeature.properties.MS_DATE_TI);
                unitStop = new Date(unitFeature.properties.MS_DATE_TI);
                //!!!!!TODO!!!!!Once features exist start watcher to stop loop once 
                //no more features are returned by the time query. 
                
                if (unitStart >= dateRange[0] && unitStart <= dateRange[1] || unitStop >= dateRange[0] && unitStop <= dateRange[1] || dateRange[0] >= unitStart && dateRange[0] <= unitStop || dateRange[1] >= unitStart && dateRange[1] <= unitStop) {
                    //!!!!!TODO!!!!! for speed push unitcode into idarray
                    //idArray.push(unitFeature.properties.carid)
                    console.log("unitFeature: " + JSON.stringify(unitFeature));
                    var carid = unitFeature.properties.car_id;
                    if (!cars.hasOwnProperty(carid)){
                        cars[carid] = {};
                        cars[carid].color = fiftyColors.colors[fiftyColors.colorIndex]
                        fiftyColors.colorIndex = fiftyColors.colorIndex +1;
                    }
                    //!!!!!BIGTIME TODO START!!!!! clear out cars on new query. 
                    // add features directly to timeUnitsGeoJson based on if the cars.carid is null or if the cars.carid.time is less than unitfeature.properties.time
                    //                    var carid = unitFeature.properties.car_id
                    //                    if (!cars.hasOwnProperty(carid)){
                    //                        
                    //                    }
                    //                    else{
                    //                        if(cars['carid'].time < unitFeature.properties.time)
                    //                    }
                    //!!!!!BIGTIME TODO STOP!!!!!
                    var timestamp = new Date(dateRange[0]);
                    unitTimeFeatures.push(unitFeature);
                }
            }
            timeUnitsGeoJSON.features = unitTimeFeatures;
            if (!map.hasLayer(timeUnitsLayer)) {
                timeUnitsLayer = L.geoJson(timeUnitsGeoJSON, {
                    onEachFeature: (function (_this) {
                        return function (feature, layer) {
                            //console.log('feature: '+ new Date(feature.properties.dateTime_Converted));
                            var fDate = new Date(feature.properties.MS_DATE_TI);
                            fDate.setHours(fDate.getHours());
                            var popupContent = "AVL Time: " + formatDateTime(fDate);
                            if (feature.properties.UnitCode) {
                                popupContent += "<br>Unit ID: " + feature.properties.UnitCode;
                            }
                            if (feature.properties.StatDes) {
                                popupContent += "<br>Status: " + feature.properties.StatDes;
                            }
                            layer.bindPopup(popupContent);
                        };
                    })(this)
                    , pointToLayer: (function (_this) {
                        return function (feature, latlng) {
                           var carRadius = queryFunctions.getPointRadius(JSON.stringify(feature.properties.speed))
                            var carColor = queryFunctions.getColor(feature.properties.car_id);
                            console.log("carcolor: " + JSON.stringify(cars));
                            var unitMarkerOptions = {
                                radius: carRadius
                                , fillColor: carColor
                                , color: '#000'
                                , weight: 0.5
                                , opacity: 1
                                , fillOpacity: 1
                            };
                            var marker = L.circleMarker(latlng, unitMarkerOptions);
                            return marker;
                        };
                    })(this)
                }).addTo(map);
            }
            else {
                timeUnitsLayer.clearLayers();
                timeUnitsLayer.addData(unitTimeFeatures);
            }
        };
        var running = false;
        var timer;
        $("#play").on("click", function () {
            var duration = 300
                , maxstep = 201
                , minstep = 200;
            if (running == true) {
                $("#play").html("<i class='material-icons'>play_arrow</i>");
                running = false;
                clearInterval(timer);
            }
            else if (running == false) {
                $("#play").html("<i class='material-icons'>pause</i>");
                sliderValue = $("#slider").val();
                timer = setInterval(function () {
                    //console.log('sliderValue: '+sliderValue);
                    if (sliderValue < maxstep) {
                        sliderValue++;
                        $("#slider").val(sliderValue);
                        $('#range').html(sliderValue);
                    }
                    $("#slider").val(sliderValue);
                    update();
                }, duration);
                running = true;
            }
        });
        update = function () {
            var playEndTime = brush.extent()[1];
            playEndTime.setSeconds(playEndTime.getSeconds() + 45);
            var playStartTime = brush.extent()[0];
            playStartTime.setSeconds(playStartTime.getSeconds() + 45);
            handle.attr("transform", "translate(" + timeScale(playStartTime) + ",0)");
            handle.select('text').text(formatDate(playStartTime));
            brush.extent([playStartTime, playEndTime]);
            var playDateRange = [playStartTime, playEndTime];
            updateFeaturesByDate(playDateRange);
        };

        function getRecordsByTime(startkey, endkey) {
            console.log("getRecordsByTime");
            $.ajax({
                url: "http://127.0.0.1:5984/avl/_design/avlTime/_view/time?startkey=" + startkey + "&endkey=" + endkey
                , success: function (result) {
                    var endTime = new Date().getTime();;
                    difTime = endTime - startTime;
                    console.log("difTime: " + difTime / 1000);
                    processMapRecords(result);
                }
            });
        }
    }
    , getPointRadius: function (speed) {
        var returnRadius;
        if (speed < 10) {
            returnRadius = speedDiameter["10"]
        }
        else if (speed < 25) {
            returnRadius = speedDiameter["25"]
        }
        else if (speed < 40) {
            returnRadius = speedDiameter["40"]
        }
        else if (speed < 55) {
            returnRadius = speedDiameter["55"]
        }
        else if (speed < 70) {
            returnRadius = speedDiameter["70"]
        }
        else if (speed >= 70) {
            returnRadius = 2
        }
        return returnRadius;
    }
    , getColor: function (carID) {
        var returnColor = cars[carID].color;
        return returnColor;
    }
}
var sliderShown = false;
timeFunctions = {
    setTimeButtonEvent: function () {
        var showTime = document.querySelector('#time-button');
        showTime.addEventListener('click', function () {
            var height_pct = Math.round($('#map').height() / $('#map').parent().height() * 100);
            if (sliderShown == false) {
                sliderShown = true;
                $("#upperGrid, #mapCell, #map").animate({
                    height: "80%"
                }, 1000, function () {
                    // Animation complete.
                });
                $("#timeGrid, #timeCell").animate({
                    height: "20%"
                }, 1000, function () {
                    // Animation complete.
                });
            }
            else {
                sliderShown = false;
                $("#upperGrid, #mapCell, #map").animate({
                    height: "100%"
                }, 1000, function () {
                    // Animation complete.
                });
                $("#timeGrid, #timeCell").animate({
                    height: "0%"
                }, 1000, function () {
                    // Animation complete.
                });
            }
        });
    }
}
var chartShown = false;
chartFunctions = {
    setChartButtonEvent: function () {
        var showTime = document.querySelector('#chart-button');
        showTime.addEventListener('click', function () {
            var width_pct = Math.round($('#map').width() / $('#map').parent().width() * 100);
            console.log("map.center: " + map.getCenter());
            if (chartShown == false) {
                chartShown = true;
                $("#mapGrid, #mapCell, #map, #timeGrid, sliderControls").animate({
                    width: "60%"
                }, 1000, function () {
                    // Animation complete.
                });
                $("#chartGrid").animate({
                    width: "40%"
                }, 1000, function () {
                    // Animation complete.
                });
            }
            else {
                chartShown = false;
                $("#mapGrid, #mapCell, #map, #timeGrid, sliderControls").animate({
                    width: "100%"
                }, 1000, function () {
                    // Animation complete.
                });
                $("#chartGrid").animate({
                    width: "0%"
                }, 1000, function () {
                    // Animation complete.
                });
            }
        });
    }
}