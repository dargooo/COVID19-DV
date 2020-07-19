(async function() {
	const idMap = d3.map();
	const stateMap = d3.map();
	/* id - shortname, state */
	await d3.csv("https://gist.githubusercontent.com/dantonnoriega/bf1acd2290e15b91e6710b6fd3be0a53/raw/11d15233327c8080c9646c7e1f23052659db251d/us-state-ansi-fips.csv", function(d) {
		stateMap.set(d.stname, [d[" stusps"]]);
		idMap.set(+d[" st"], d.stname);
	});
	/* state - confirmed, deaths */
	await d3.csv("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports_us/07-17-2020.csv", function(d) {
	    if (stateMap.has(d.Province_State)) {
			stateMap.get(d.Province_State).push(d.Confirmed);
			stateMap.get(d.Province_State).push(d.Deaths);
	    } else {
	  	  console.log("No " + d.Province_State + " in the map.");
	    }
	});
	/* US total case growth */
	tg_data = await d3.csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us.csv");
	var x = d3.scaleLinear().domain([0,180]).range([0,400]);
	var y = d3.scaleLinear().domain([0,3800000]).range([600,0]);
	// axis
	d3.select("#lines").append("g").attr("transform", "translate(10,600)").call(d3.axisBottom(x));
	d3.select("#lines").append("g").attr("transform", "translate(410,0)").call(d3.axisRight(y));
	//lines
	var lineCase = d3.line().x(function(d, i) { return x(i); }).y(function(d) { return y(d.cases); }).curve(d3.curveMonotoneX);
	var lineDeath = d3.line().x(function(d, i) { return x(i); }).y(function(d) { return y(d.deaths); }).curve(d3.curveMonotoneX);
	d3.select("#lines").append("path")
		.attr("transform", "translate(10,0)")
	    .datum(tg_data)
		.style("fill", "none")
		.style("stroke", "#E6BE6C")
		.style("stroke-width", 3)
	    .attr("d", lineCase);
	d3.select("#lines").append("path")
		.attr("transform", "translate(10,0)")
    	.datum(tg_data)
		.style("fill", "none")
		.style("stroke", "#DB7D6F")
		.style("stroke-width", 3)
    	.attr("d", lineDeath);

//	d3.select("#lines").append("g").attr("transform", "translate(10,0)")
//		.selectAll("dot").data(tg_data).enter().append("circle")
//		.attr("cx", function (d,i) { return x(i); } )
//    	.attr("cy", function (d) { return y(d.cases); } )
//    	.attr("r", 1.5)
//    	.style("fill", "#794993");
//
//	d3.select("#lines").append("g").attr("transform", "translate(10,0)")
//		.selectAll("dot").data(tg_data).enter().append("circle")
//		.attr("cx", function (d,i) { return x(i); } )
//    	.attr("cy", function (d) { return y(d.deaths); } )
//    	.attr("r", 1.5)
//    	.style("fill", "#D16454");


	
    renderMap();

    function renderMap() {
		var color = d3.scaleLinear()
			.domain([1000,420000])
			.range(["#E7DBF3", "#1A0035"]);

		var svg_main = d3.select("#main");
		var svg_bar =  d3.select("#bar");

		barGroups = svg_bar.selectAll("g").data(stateMap.values().sort(function(a,b) {
			return b[1] - a[1];
		})).enter().append("g")
			.attr("height", 15)
			.attr("x",0)
			.attr("y", function (d,i) { return i * 15; });
		barGroups
			.append("rect")
			.attr("id", function(d,i) { return d[0].substring(1); })
			.attr("x",0).attr("height", 15).attr("width",30).style("stroke-width","1px").style("stroke","white")
			.attr("y", function (d,i) { return i * 15; })
        	.style("fill", function(d) { return color(d[1]); });
		barGroups
			.append("text")
			.text(function(d,i) { return d[0]; })
			.attr("x", 40)
			.attr("y", function (d,i) { return (i+1) * 15 - 3; })
			.style("font-size", "13px");


		var path = d3.geoPath();
		var curSelect;
		d3.json("https://d3js.org/us-10m.v1.json").then(function(us) {
			var still = false;
		  	svg_main.append("g")
		  	  	.attr("transform", "translate(150,0)")
		  	  	.attr("class", "states-choropleth")
		  	  	.selectAll("path")
		  	  	.data(topojson.feature(us, us.objects.states).features)
		  	  	.enter().append("path")
				.text(function(d){return "hello";})
		  	    .attr("fill", function(d, i) {
		  	        var id = +d.id;
		  	        var state = idMap.get(id);
					if (stateMap.get(state)) {
						 d.num = stateMap.get(state)[1];
					} else {
						d.num = 0;
					}
					console.log("i = " + i + ", id = " + id + ": " + state + ": " + d.num);
		  	        return color(d.num);
		  	    })
		  	    .attr("d", path)
		  		.on('mousemove', function(d){
					 if (!still) {
						var id = +d.id;
						var state = idMap.get(id);
		  	        	$(this).attr("fill-opacity", "0.6");
		  	        	$(this).attr("stroke", "#D3F381");
						$(this).attr("stroke-width", "4px");
						d3.select("#tip-state").text(state);
						d3.select("#tip-case").text("Confirmed: " + stateMap.get(state)[1]);
						d3.select("#tip-death").text("Deaths: " + stateMap.get(state)[2]);
						d3.select("#btn-county").text(">> Detail of " + state + " Counties");
						d3.select("#btn-growth").text(">> Growths of " + state + " Cases");

						var rect = d3.select("#" + stateMap.get(state)[0].substring(1));
						d3.select("#arrow").style("top", (55 + parseInt(rect.attr("y"))) + "px");
		  	        	$("#arrow").show();
		  	        	$("#tooltip").show();
		
		  	        	var tooltip_width = $("#tooltip").width();
		  	        	d3.select("#tooltip")
		  	        	  .style("top", d3.event.layerY + "px")
		  	        	  .style("left", (d3.event.layerX + 20) + "px");
					}
		  	    })
		  	    .on('mouseout', function() {
					if (!still) {
		  	      		$(this).attr("fill-opacity", "1");
						$(this).attr("stroke", "white");
                        $(this).attr("stroke-width", "0.8px");
		  	      		$("#tooltip").hide();
						$("#arrow").hide();
					}
		  	    })
    			.on('click', function(d) {
					 d3.event.stopPropagation();
					 if (!still) {
						 
						 $("#btn-county").show();
		  	        	 $("#btn-growth").show();
						 d3.select("#tooltip").style("background-color", "#D3F381").style("opacity", 1);
						 still = true;
					 } else {
						 if (curSelect != null &&  curSelect !=  $(this)) {
						 	curSelect.attr("fill-opacity", "1");
                		 	curSelect.attr("stroke", "white");
                		 	curSelect.attr("stroke-width", "0.8px");
						 }
						 $("#tooltip").hide();
						  $("#arrow").hide();
						 $("#btn-county").hide();
                         $("#btn-growth").hide();
						 d3.select("#tooltip").style("background-color", "#E9FFD8").style("opacity", 0.75);
						 still = false;
					 }
					curSelect = $(this);
		  	    });

			  	svg_main.append("path").attr("transform", "translate(150,0)")
					.attr("d", path(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; })))
      				.attr("class", "state-border");

			document.getElementsByTagName('body')[0].onclick = function() {
				curSelect.attr("fill-opacity", "1");
                curSelect.attr("stroke", "white");
                curSelect.attr("stroke-width", "0.8px");
				$("#tooltip").hide();
				 $("#arrow").hide();
                $("#btn-county").hide();
                $("#btn-growth").hide();
				d3.select("#tooltip").style("background-color", "#E9FFD8").style("opacity", 0.75);
                still = false;
			};
		
		});
    }


})();
