PykCharts.multiD.barChart = function(options){
    var that = this;
    var theme = new PykCharts.Configuration.Theme({});

    this.execute = function () {
        that = new PykCharts.multiD.processInputs(that, options, "column");
        var multiDimensionalCharts = theme.multiDimensionalCharts;

        if(that.stop) 
            return;
        
        that.grid_y_enable =  options.chart_grid_y_enable ? options.chart_grid_y_enable : theme.stylesheet.chart_grid_y_enable;
        that.grid_color = options.chart_grid_color ? options.chart_grid_color : theme.stylesheet.chart_grid_color;
        that.axis_x_data_format = "";
        that.data_sort_enable = options.data_sort_enable ? options.data_sort_enable : multiDimensionalCharts.data_sort_enable;
        that.data_sort_type = PykCharts.boolean(that.data_sort_enable) && options.data_sort_type ? options.data_sort_type : multiDimensionalCharts.data_sort_type;
        that.data_sort_order = PykCharts.boolean(that.data_sort_enable) && options.data_sort_order ? options.data_sort_order : multiDimensionalCharts.data_sort_order;

        if(that.mode === "default") {
           that.k.loading();
        }
        that.multiD = new PykCharts.multiD.configuration(that);
        d3.json(options.data, function(e, data){
            // console.log("data",data);
            that.data = data.groupBy("bar");
            that.compare_data = data.groupBy("bar");
            //console.log(data);
            $(that.selector+" #chart-loader").remove();
            that.render();
        });
    };

    this.refresh = function () {
        d3.json(options.data, function (e, data) {
            that.data = data.groupBy("bar");
            that.refresh_data = data.groupBy("bar");
            var compare = that.k.checkChangeInData(that.refresh_data,that.compare_data);
            that.compare_data = compare[0];
            var data_changed = compare[1];
            if(data_changed) {
                that.k.lastUpdatedAt("liveData");
            }
            that.data = that.dataTransformation();
            that.data = that.emptygroups(that.data);
            var fD = that.flattenData();
            that.the_bars = fD[0];
            that.the_keys = fD[1];
            that.the_layers = that.buildLayers(that.the_bars);
            if(that.no_of_groups === 1) {
                that.legends_enable = "no";
            }
            that.map_group_data = that.multiD.mapGroup(that.data);
            that.optionalFeatures()
                    .createChart()
                    .legends()
                    .ticks();
            that.k.xAxis(that.svgContainer,that.xGroup,that.xScale,undefined,undefined,that.legendsGroup_height);
        });
    };

    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
    this.render = function(){
        var that = this;
        that.map_group_data = that.multiD.mapGroup(that.data);
        that.data = that.dataTransformation();
        //console.log(that.data);
        that.data = that.emptygroups(that.data);
        //console.log(that.data);
        var fD = that.flattenData();
        // console.log(fD);
        that.the_bars = fD[0];
        that.the_keys = fD[1];
        that.the_layers = that.buildLayers(that.the_bars);
        // console.log(that.the_bars);
        that.transitions = new PykCharts.Configuration.transition(that);
        that.mouseEvent1 = new PykCharts.multiD.mouseEvent(that);
        that.fillColor = new PykCharts.Configuration.fillChart(that,null,options);
        that.border = new PykCharts.Configuration.border(that);
        if(that.no_of_groups === 1) {
            that.legends_enable = "no";
        }
        if(that.mode === "default") {

            that.k.title()
                .backgroundColor(that)
                .export(that,"#svgcontainer","barChart")
                .emptyDiv()
                .subtitle()
                .makeMainDiv(that.selector,1);
            that.optionalFeatures()
                .svgContainer(1)
                .legendsContainer(1);

            that.k.liveData(that)
                .tooltip()
                .createFooter()
                .lastUpdatedAt()
                .credits()
                .dataSource();

            that.mouseEvent = new PykCharts.Configuration.mouseEvent(that);

            that.optionalFeatures()
                .legends()
                .createGroups()
                .createChart()
                .axisContainer()
                .ticks()
                .highlightRect();
                          
        } else if(that.mode === "infographics") {
            that.k.backgroundColor(that)
                .export(that,"#svgcontainer","barChart")
                .emptyDiv()
                .makeMainDiv(that.selector,1);

            that.optionalFeatures().svgContainer(1)
                .legendsContainer(1)
                .createGroups()
                .createChart()
                .axisContainer();

            that.k.tooltip();
            that.mouseEvent = new PykCharts.Configuration.mouseEvent(that);
            
        }
        that.k.xAxis(that.svgContainer,that.xGroup,that.xScale,undefined,undefined,that.legendsGroup_height)
                .xAxisTitle(that.xGroup);

        if(PykCharts.boolean(that.legends_enable)) {
            $(window).on("load", function () { return that.k.resize(that.svgContainer,"",that.legendsContainer); })
                .on("resize", function () { return that.k.resize(that.svgContainer,"",that.legendsContainer); });
        } else {
            $(window).on("load", function () { return that.k.resize(that.svgContainer,""); })
                .on("resize", function () { return that.k.resize(that.svgContainer,""); });
        }
    };

    this.optionalFeatures = function() {
        var that = this;
        var optional = {
            svgContainer: function (i) {
                $(that.selector).attr("class","PykCharts-twoD");
                that.svgContainer = d3.select(options.selector + " #tooltip-svg-container-" + i)
                    .append("svg:svg")
                    .attr("width",that.width )
                    .attr("height",that.height)
                    .attr("id","svgcontainer")
                    .attr("class","svgcontainer")
                    // .style("background-color",that.background_color)
                    .attr("preserveAspectRatio", "xMinYMin")
                    .attr("viewBox", "0 0 " + that.width + " " + that.height);

                // $(options.selector).colourBrightness();

                return this;
            },
            createGroups: function () {
                that.group = that.svgContainer.append("g")
                    .attr("id","svggroup")
                    .attr("class","svggroup")
                    .attr("transform","translate(" + that.margin_left + "," + (that.margin_top + that.legendsGroup_height) +")");

                return this;                   
            },
            legendsContainer: function (i) {
                if(PykCharts.boolean(that.legends_enable)&&that.mode === "default") {
                    that.legendsGroup = that.svgContainer.append("g")
                        .attr("id","legends")
                        .attr("class","legends")
                        .attr("transform","translate(0,10)");

                } else {
                    that.legendsGroup_height = 0;
                }

                return this;
            },
            axisContainer : function () {
                if(PykCharts.boolean(that.axis_y_enable)) {

                    var axis_line = that.group.selectAll(".axis-line")
                        .data(["line"]);

                    axis_line.enter()
                            .append("line");

                    axis_line.attr("class","axis-line")
                            .attr("x1",0)
                            .attr("y1",0)
                            .attr("x2",0)
                            .attr("y2",that.height-that.margin_top-that.margin_bottom - that.legendsGroup_height)
                            .attr("stroke",that.axis_x_line_color)
                            .attr("stroke-width","1px");

                    axis_line.exit().remove();
                    
                    if(that.axis_y_position === "left") {
                        that.yGroup = that.group.append("g")
                            .attr("id","yaxis")
                            .attr("class", "y axis")
                            .append("text")
                            .attr("transform", "rotate(-90)")
                            .attr("x",-(that.height-that.margin_top-that.margin_bottom - that.legendsGroup_height)/2)
                            .attr("y", -60)
                            .attr("dy", ".71em")
                            .style("text-anchor", "end")
                            .style("fill",that.axis_x_label_color)
                            .text(that.axis_y_title);

                    } else if(that.axis_y_position === "right") {
                        axis_line.attr("x1",(that.width-that.margin_left-that.margin_right))
                            .attr("x2",(that.width-that.margin_left-that.margin_right));

                        that.yGroup = that.group.append("g")
                            .attr("id","yaxis")
                            .attr("class", "y axis")
                            .append("text")
                            .attr("transform", "rotate(-90)")
                            .attr("x",-(that.height-that.margin_top-that.margin_bottom-that.legendsGroup_height)/2)
                            .attr("y", (that.width-that.margin_left-that.margin_right)+12)
                            .attr("dy", ".71em")
                            .style("text-anchor", "end")
                            .style("fill",that.axis_x_label_color)
                            .text(that.axis_y_title);
                        // that.xGroup.attr("transform","translate(0,"+(that.width-that.margin.left-that.margin.right)+")");
                    }
                        // .style("stroke","none");
                }
                // console.log(PykCharts.boolean(that.axis_x_enable),"is boolean");
                if(PykCharts.boolean(that.axis_x_enable)) {
                    that.xGroup = that.group.append("g")
                        .attr("id","xaxis")
                        .attr("class","x axis");
                }
                return this;
            },
            createChart: function() {
                var w = that.width - that.margin_left - that.margin_right,
                    j = that.no_of_groups + 1,
                    h = that.height - that.margin_top - that.margin_bottom - that.legendsGroup_height;

                var the_bars = that.the_bars;
                var keys = that.the_keys;
                that.layers = that.the_layers;
                var groups= that.getGroups();

                that.stack_layout = d3.layout.stack() // Create default stack
                    .values(function(d){ // The values are present deep in the array, need to tell d3 where to find it
                        return d.values;
                    })(that.layers);
                // console.log(stack);
                that.layers = that.layers.map(function (group) {
                    return {
                        name : group.name,
                        values : group.values.map(function (d) {
                            // Invert the x and y values, and y0 becomes x0
                            return {
                                x: d.y,
                                y: d.x,
                                x0: d.y0,
                                tooltip : d.tooltip ? d.tooltip : d.y,
                                color: d.color,
                                group: d.group,
                                name:d.name
                                // highlight:d.highlight
                            };
                        })
                    };
                })
                // console.log(layers);
                var x_data = [];
                that.layers.map(function(e, i){ // Get all values to create scale
                    for(i in e.values){
                        var d = e.values[i];
                        x_data.push(d.x + d.x0); // Adding up y0 and y to get total height
                    }
                });

                that.yScale = d3.scale.ordinal()
                    .domain(the_bars.map(function(e, i){
                        return e.id || i; // Keep the ID for bars and numbers for integers
                    }))
                    .rangeBands([0,h]);

                var x_domain = [0,d3.max(x_data)];
                that.xScale = d3.scale.linear().domain(that.k._domainBandwidth(x_domain,1)).range([0, w]);

                // that.yScaleInvert = d3.scale.linear().domain([d3.max(yValues), 0]).range([0, h]).nice(); // For the yAxis
                // var zScale = d3.scale.category10();

                // if(that.axis_x_data_format === "number") {
                //     max = d3.max(that.new_data, function(d) { return d3.max(d.data, function(k) { return k.x; }); });
                //     min = d3.min(that.new_data, function(d) { return d3.min(d.data, function(k) { return k.x; }); });
                //     x_domain = [min,max];
                //     x_data = that.k._domainBandwidth(x_domain,2);
                //     x_range = [0 ,that.reducedWidth];
                //     that.xScale = that.k.scaleIdentification("linear",x_data,x_range);
                //     that.extra_left_margin = 0;

                // } else if(that.axis_x_data_format === "string") {
                //     that.new_data[0].data.forEach(function(d) { x_data.push(d.x); });
                //     x_range = [0 ,that.reducedWidth];
                //     that.xScale = that.k.scaleIdentification("ordinal",x_data,x_range,0);
                //     that.extra_left_margin = (that.xScale.rangeBand() / 2);

                // } else if (that.axis_x_data_format === "time") {
                //     max = d3.max(that.new_data, function(d) { return d3.max(d.data, function(k) { return new Date(k.x); }); });
                //     min = d3.min(that.new_data, function(d) { return d3.min(d.data, function(k) { return new Date(k.x); }); });
                //     x_data = [min,max];
                //     x_range = [0 ,that.reducedWidth];
                //     that.xScale = that.k.scaleIdentification("time",x_data,x_range);
                //     that.new_data[0].data.forEach(function (d) {
                //         d.x = new Date(d.x);
                //     });
                //     that.extra_left_margin = 0;
                // }

                var group_arr = [];

                for(var i in groups){
                    var g = groups[i];
                    var y = that.yScale(g[0]);
                    var totalHeight = that.yScale.rangeBand() * g.length;
                    y = y + (totalHeight/2);
                    group_arr.push({y: y, name: i});
                }
                that.domain = group_arr.map(function (d) {
                    return d.name;
                });
                that.y0 = d3.scale.ordinal()
                    .domain(group_arr.map(function (d,i) { return d.name; }))
                    .rangeRoundBands([0, h], 0.1);

                that.y1 = d3.scale.ordinal()
                    .domain(that.barName.map(function(d) { return d; }))
                    .rangeRoundBands([0, that.y0.rangeBand()]) ;

                that.y_factor = 0;
                that.height_factor = 0;
                if(that.no_of_groups === 1) {
                    that.y_factor = that.yScale.rangeBand()/4;
                    that.height_factor = (that.yScale.rangeBand()/(2*that.no_of_groups));
                };
                that.highlight_y_positions = [];
                that.highlight_x_positions = [];

                that.bars = that.group.selectAll(".bars")
                    .data(that.layers);

                that.bars.enter()
                        .append("g")
                        .attr("class", "bars");

                var rect = that.bars.selectAll("rect")
                    .data(function(d,i){
                        return d.values;
                    });

                rect.enter()
                    .append("svg:rect")
                    .attr("class","rect")

                rect.attr("width", 0).attr("x", 0)
                    .attr("fill", function(d,i){
                        if(that.no_of_groups === 1) {
                            return that.fillColor.colorPieMS(d);
                        } else {
                            return that.fillColor.colorGroup(d);
                        }
                    })
                    .attr("fill-opacity", function (d,i) {
                        if (that.color_mode === "saturation"){
                        // if(PykCharts.boolean(that.saturationEnable)){
                            // if(that.highlight === d.name) {
                            //     j--;
                            //     return 1;
                            // }
                            if(j>1){
                                j--;
                                return j/that.no_of_groups;
                            } else {
                                j = that.no_of_groups+1;
                                j--;
                                return j/that.no_of_groups;
                            }
                        }
                    })
                    .attr("stroke",that.border.color())
                    .attr("stroke-width",that.border.width())
                    .attr("stroke-dasharray", that.border.style())
                    .attr("stroke-opacity",1)
                    .on('mouseover',function (d) {
                        if(that.mode === "default") {
                            that.mouseEvent.tooltipPosition(d);
                            that.mouseEvent.tooltipTextShow(d.tooltip ? d.tooltip : d.y);
                            that.mouseEvent.axisHighlightShow(d.name,options.selector + " .axis-text",that.domain,"bar");
                        }
                    })
                    .on('mouseout',function (d) {
                        if(that.mode === "default") {
                            that.mouseEvent.tooltipHide(d);
                            that.mouseEvent.axisHighlightHide(options.selector + " .axis-text","bar");
                        }
                    })
                    .on('mousemove', function (d) {
                        if(that.mode === "default") {
                            that.mouseEvent.tooltipPosition(d);
                        }
                    });

                rect
                    // .transition()
                    // .duration(that.transitions.duration())
                    .attr("x", function(d){
                        return that.xScale(d.x0);
                    })
                    .attr("width", function(d){
                        if(that.highlight.toLowerCase() === d.name.toLowerCase()) {
                            that.highlight_x_positions.push(that.xScale(d.x));
                        }
                        return that.xScale(d.x);
                    })
                    .attr("height", function(d){
                        return that.yScale.rangeBand()+that.height_factor;
                    })
                    .attr("y", function(d){
                        if(that.highlight.toLowerCase() === d.name.toLowerCase()) {
                            that.highlight_y_positions.push(that.yScale(d.y)-that.y_factor);
                        }
                        return that.yScale(d.y)-that.y_factor;
                    });

                that.bars.exit()
                    .remove();
                var yAxis_label = that.group.selectAll("text.axis-text")
                    .data(group_arr);

                yAxis_label.enter()
                        .append("text")

                yAxis_label.attr("class", "axis-text")
                        .attr("y", function(d){
                            return d.y;
                        })
                        .attr("x", function(d){
                            return -10;
                        })
                        .attr("fill",that.axis_y_labelColor)
                        .text(function(d){
                            return d.name;
                        })
                        .text(function (d) {
                            if(this.getBBox().width > (0.8*that.margin_left)) {
                                return d.name.substr(0,2) + "..";
                            } else {
                                return d.name;
                            }
                        })
                        .on('mouseover',function (d) {
                            that.mouseEvent.tooltipPosition(d);
                            that.mouseEvent.tooltipTextShow(d.name);
                        })
                        .on('mouseout',function (d) {
                            that.mouseEvent.tooltipHide(d);
                        })
                        .on('mousemove', function (d) {
                            that.mouseEvent.tooltipPosition(d);
                        });
                if(that.axis_y_position === "right") {
                    yAxis_label.attr("x", function () {
                        return (that.width-that.margin_left-that.margin_right) + 10;
                    });
                }
                if(that.axis_y_position === "left" && that.axis_y_pointer_position === "right") {
                    yAxis_label.attr("x", function (d) {
                        return 10;
                    });
                }
                if(that.axis_y_position === "right" && that.axis_y_pointer_position === "left") {
                    yAxis_label.attr("x", function (d) {
                        return (that.width-that.margin_left-that.margin_right) - 10;
                    });
                }
                if(that.axis_y_pointer_position === "right") {
                    yAxis_label.attr("text-anchor","start");
                } else if(that.axis_y_pointer_position === "left") {
                    yAxis_label.attr("text-anchor","end");
                }
                yAxis_label.exit().remove();
                return this;
            },
            ticks: function () {
                if(that.pointer_size) {
                    that.txt_width;
                    that.txt_height;
                    that.ticksElement = that.bars.selectAll("g")
                                .data(that.layers);

                    var tick_label = that.bars.selectAll(".ticksText")
                                .data(function(d) {
                                        // console.log(d.values);
                                        return d.values;
                                });
                    tick_label.enter()
                        .append("text")
                        .attr("class","ticksText");

                    tick_label.attr("class","ticksText")
                        .text(function(d) {
                            if(d.x) {
                                // console.log(d.x);
                                return d.x;
                            }
                        })
                        .style("font-weight", that.pointer_weight)
                        .style("font-size", that.pointer_size)
                        .attr("fill", that.pointer_color)
                        .style("font-family", that.pointer_family)
                        .text(function(d) {
                            if(d.x) {
                                that.txt_width = this.getBBox().width;
                                that.txt_height = this.getBBox().height;
                                if(d.x && (that.txt_width< that.xScale(d.x)) && (that.txt_height < (that.yScale.rangeBand()+that.height_factor ))) {
                                    return d.x;
                                }
                            }
                        })
                        .attr("x", function(d){
                            var bar_width  = that.xScale(d.x);
                            return that.xScale(d.x0) + that.xScale(d.x)+ 5;
                        })
                        .attr("y",function(d){
                            return that.yScale(d.y)-that.y_factor+(that.yScale.rangeBand()/2);
                        })
                        .attr("dy",function(d){
                            if(that.no_of_groups ===1) {
                                return that.yScale.rangeBand()/2;
                            } else {
                                return that.yScale.rangeBand()/4;
                            }
                        })
                        .style("font-size",function(d) {
                            // console.log(that.label.size);
                            return that.pointer_size;
                        });

                    tick_label.exit().remove();
                }
                return this;
            },
            highlightRect : function () {
                if(that.no_of_groups > 1) {
                    function ascending( a, b ) {
                        return a - b;
                    }

                    that.highlight_x_positions.sort(ascending)
                    that.highlight_y_positions.sort(ascending);
                    var x_len = that.highlight_x_positions.length,
                        y_len = that.highlight_y_positions.length,
                        x = -5,
                        y = (that.highlight_y_positions[0] - 5),
                        width = (that.highlight_x_positions[x_len - 1] + 15 + that.txt_width),
                        height;
                    if(PykCharts.boolean(that.highlight_x_positions[0])){
                        height = (that.highlight_y_positions[y_len - 1] - that.highlight_y_positions[0] + 10 + that.yScale.rangeBand()+that.height_factor);
                    } else {
                        height = (that.highlight_y_positions[y_len - 1] - that.highlight_y_positions[0] + 10);
                    }
                    that.group.append("rect")
                        .attr("class","highlight-rect")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("width", width)
                        .attr("height", height)
                        .attr("fill","none")
                        .attr("stroke", that.highlight_color)
                        .attr("stroke-width", "1.5")
                        .attr("stroke-dasharray", "5,5")
                        .attr("stroke-opacity",1);
                }
                return this;
            },
            legends: function () {
                if(PykCharts.boolean(that.legends_enable)) {
                    var params = that.getParameters(),color;
                    color = params.map(function (d) {
                        return d.color;
                    });
                    params = params.map(function (d) {
                        return d.name;
                    });

                    params = _.uniq(params);
                    // color = _.uniq(color);
                    var j = 0,k = 0;
                    j = params.length;
                    k = params.length;

                    if(that.legends_display === "vertical" ) {
                        // that.legendsContainer.attr("height", (params.length * 30)+20);
                        that.legendsGroup_height = (params.length * 30)+20;
                        text_parameter1 = "x";
                        text_parameter2 = "y";
                        rect_parameter1 = "width";
                        rect_parameter2 = "height";
                        rect_parameter3 = "x";
                        rect_parameter4 = "y";
                        rect_parameter1value = 13;
                        rect_parameter2value = 13;
                        text_parameter1value = function (d,i) { return that.width - that.width/4 + 16; };
                        rect_parameter3value = function (d,i) { return that.width - that.width/4; };
                        var rect_parameter4value = function (d,i) { return i * 24 + 12;};
                        var text_parameter2value = function (d,i) { return i * 24 + 23;};
                    }
                    else if(that.legends_display === "horizontal") {
                        that.legendsGroup_height = 50;
                        text_parameter1 = "x";
                        text_parameter2 = "y";
                        rect_parameter1 = "width";
                        rect_parameter2 = "height";
                        rect_parameter3 = "x";
                        rect_parameter4 = "y";
                        var text_parameter1value = function (d,i) { j--;return that.width - (j*100 + 75); };
                        text_parameter2value = 30;
                        rect_parameter1value = 13;
                        rect_parameter2value = 13;
                        var rect_parameter3value = function (d,i) { k--;return that.width - (k*100 + 100); };
                        rect_parameter4value = 18;
                    }

                    var legend = that.legendsGroup.selectAll("rect")
                                    .data(params);

                    legend.enter()
                            .append("rect");

                    legend.attr(rect_parameter1, rect_parameter1value)
                        .attr(rect_parameter2, rect_parameter2value)
                        .attr(rect_parameter3, rect_parameter3value)
                        .attr(rect_parameter4, rect_parameter4value)
                        .attr("fill", function (d,i) {
                            if(that.color_mode === "color")
                                return color[i];
                            else return color[0];
                        })
                        .attr("fill-opacity", function (d,i) {
                            // if(PykCharts.boolean(that.saturationEnable)){
                                if(that.color_mode === "saturation"){
                                return (that.no_of_groups-i)/that.no_of_groups;
                            }
                        });

                    legend.exit().remove();

                    that.legends_text = that.legendsGroup.selectAll(".legends_text")
                        .data(params);

                    that.legends_text
                        .enter()
                        .append('text')
                        .attr("class","legends_text")
                        .attr("fill","#1D1D1D")
                        .attr("pointer-events","none")
                        .style("font-family", "'Helvetica Neue',Helvetica,Arial,sans-serif")
                        .attr("font-size",12);

                    that.legends_text.attr("class","legends_text")
                    .attr("fill","black")
                    .attr(text_parameter1, text_parameter1value)
                    .attr(text_parameter2, text_parameter2value)
                    .text(function (d) { return d; });

                    that.legends_text.exit()
                                    .remove();
                }
                return this;
            }
        }
        return optional;
    };

    //----------------------------------------------------------------------------------------
    // 6. Rendering groups:
    //----------------------------------------------------------------------------------------

    this.getGroups = function(){
        var groups = {};
        for(var i in that.the_bars){
            var bar = that.the_bars[i];
            if(!bar.id) continue;
            if(groups[bar.group]){
                groups[bar.group].push(bar.id);
            }else{
                groups[bar.group] = [bar.id];
            }
        }
        return groups;
    };

    //----------------------------------------------------------------------------------------
    // 10.Data Manuplation:
    //----------------------------------------------------------------------------------------

    // Data Helpers
    // Takes the flattened data and returns layers
    // Each layer is a separate category
    // The structure of the layer is made so that is plays well with d3.stack.layout()
    // Docs - https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-values

    this.buildLayers = function(the_bars){
        var layers = [];

        function findLayer(l){
            for(var i in layers){
                var layer = layers[i];
                if (layer.name == l) return layer;
            }
            return addLayer(l);
        }

        function addLayer(l){
            var new_layer = {
                "name": l,
                "values": []
            };
            layers.push(new_layer);
            return new_layer;
        }

        for(var i in the_bars){
            var bar = the_bars[i];
            if(!bar.id) continue;
            var id = bar.id;
            for(var k in bar){
                // console.log(bar,"bar");
                if(k === "id") continue;
                var icings = bar[k];
                for(var j in icings){
                    var icing = icings[j];
                    if(!icing.name) continue;
                    var layer = findLayer(icing.name);
                    var index_group = that.unique_group.indexOf(that.keys[id])
                    layer.values.push({
                        "x": id,
                        "y": icing.val,
                        "group": that.keys[id],
                        "color": icing.color,
                        "tooltip": icing.tooltip,
                        "name": bar.group
                    });
                }
            }
        }
        // console.log(layers,"layers");
        return layers;
    };

    // Traverses the JSON and returns an array of the 'bars' that are to be rendered
    this.flattenData = function(){
        var the_bars = [-1];
        that.keys = {};
        for(var i in that.data){
            var d = that.data[i];
            for(var cat_name in d){
                for(var j in d[cat_name]){
                    var id = "i" + i + "j" + j;
                    if(typeof d[cat_name][j] !== "object"){
                        continue;
                    }
                    var key = Object.keys(d[cat_name][j])[0];
                    that.keys[id] = key;
                    d[cat_name][j].id = id;
                    d[cat_name][j].group = cat_name;

                    the_bars.push(d[cat_name][j]);
                }
                the_bars.push(i); // Extra seperator element for gaps in segments
            }
        }
        return [the_bars, that.keys];
    };

    this.getParameters = function () {
        var p = [];
        for(var i in  that.the_layers){
            if(!that.the_layers[i].name) continue;
            var name = that.the_layers[i].name, color;
            for(var j in that.the_layers[i].values) {
                if(!PykCharts.boolean(that.the_layers[i].values[j].y)) continue;
                var name = that.the_layers[i].values[j].group, color;
                if(that.color_mode === "saturation") {
                    color = that.saturation_color;
                } else if(that.color_mode === "color" && that.the_layers[0].values[j].color){
                    color = that.the_layers[0].values[j].color;
                }
                p.push({
                    "name": name,
                    "color": color
                });
            }
        }
        return p;
    };
    this.emptygroups = function (data) {

        that.no_of_groups = d3.max(data,function (d){
            var value = _.values(d);
            return value[0].length;
        });

        var new_data = _.map(data,function (d,i){
            //console.log(that.data);
            var value = _.values(d);
            while(value[0].length < that.no_of_groups) {
                var key = _.keys(d);
                var stack = { "name": "stack", "tooltip": "null", "color": "white", "val": 0, /*highlight: false*/ };
                var group = {"group3":[stack]};
                // console.log(data[1],"dataaaaaaaa");
                data[i][key[0]].push(group);
                value = _.values(d);
            }
        });
        // console.log(data,"new_data");
        return data;
    };

    this.dataTransformation = function () {

        var data_tranform = [];
        that.barName = [];
        var data_length = that.data.length;
        that.unique_group = that.data.map(function (d) {
            return d.group;
        });
        that.unique_group = _.uniq(that.unique_group);

        if (PykCharts.boolean(that.data_sort_enable)) {
            that.data.sort(function (a,b) {
                switch (that.data_sort_type) {
                    case "numerically": return ((that.data_sort_order === "descending") ? (b.x - a.x) : (a.x - b.x));
                                        break;
                    case "alphabetically":  if (a.y < b.y)
                                                return (that.data_sort_order === "descending") ? 1 : -1;
                                            if (a.y > b.y)
                                                return (that.data_sort_order === "descending") ? -1 : 1;
                                            return 0;
                                            break;
                    case "date": return ((that.data_sort_order === "descending") ? (new Date(b.y) - new Date(a.y)) : (new Date(a.y) - new Date(b.y)));
                                 break;
                }
            });
        }        
        
        for(var i=0; i < data_length; i++) {
            var group = {},
                bar = {},
                stack;

            if(!that.data[i].group) {
                that.data[i].group = "group" + i;
            }

            if(!that.data[i].stack) {
                that.data[i].stack = "stack";
            }

            that.barName[i] = that.data[i].group;
            group[that.data[i].y] = [];
            bar[that.data[i].group] = [];
            stack = { "name": that.data[i].stack, "tooltip": that.data[i].tooltip, "color": that.data[i].color, "val": that.data[i].x/*, highlight: that.data[i].highlight */};
            if(i === 0) {
                data_tranform.push(group);
                data_tranform[i][that.data[i].y].push(bar);
                data_tranform[i][that.data[i].y][i][that.data[i].group].push(stack);

            } else {
                var data_tranform_lenght = data_tranform.length;
                var j=0;
                for(j=0;j < data_tranform_lenght; j++) {
                    if ((_.has(data_tranform[j], that.data[i].y))) {
                        var barr = data_tranform[j][that.data[i].y];
                        var barLength = barr.length;
                        var k = 0;
                        for(k =0; k<barLength;k++) {
                            if(_.has(data_tranform[j][that.data[i].y][k],that.data[i].group)) {
                                break;
                            }
                        }
                        if(k < barLength) {
                            data_tranform[j][that.data[i].y][k][that.data[i].group].push(stack);
                        } else {
                            data_tranform[j][that.data[i].y].push(bar);
                            data_tranform[j][that.data[i].y][k][that.data[i].group].push(stack);
                        }
                        break;
                    }
                }
                if(j === data_tranform_lenght) {
                    data_tranform.push(group);
                    data_tranform[j][that.data[i].y].push(bar);
                    data_tranform[j][that.data[i].y][0][that.data[i].group].push(stack);
                }
            }
        }
        that.barName = _.unique(that.barName);

        return data_tranform;
    };
    return this;
};
