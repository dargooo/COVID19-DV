(async function() {
	const idMap = d3.map();
	const stateMap = d3.map();
	/* id - shortname, state */
	await d3.csv("https://gist.githubusercontent.com/dantonnoriega/bf1acd2290e15b91e6710b6fd3be0a53/raw/11d15233327c8080c9646c7e1f23052659db251d/us-state-ansi-fips.csv", function(d) {
		stateMap.set(d.stname, [d[" stusps"]]);
		idMap.set(+d[" st"], d.stname);
	});
	/* state - cases, deaths */
	var maxCase = 0;
	await d3.csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/live/us-states.csv",  function(d) {
	    if (stateMap.has(d.state)) {
			maxCase = Math.max(maxCase, d.cases);
			stateMap.get(d.state).push(d.cases);
			stateMap.get(d.state).push(d.deaths);
	    } else {
	  	  console.log("No " + d.state + " in the map.");
	    }
	});

	d3.select("#btn-home").on('click', function() {
		d3.select("#main").selectAll("*").remove();
		$("#line-state").show();
		$("#bar-state").hide();
        $("#focus-text").show();
        $("#lines").show();
        $("#bar").show();
		renderMap();
	});

	/*     LINE    */
	const states_data = await d3.csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv");
	var svg_line = d3.select("#lines");
	var parseTime = d3.timeParse("%Y-%m-%d");
	
	function renderLines(state) {
		var cur_data = states_data.filter(function(d) { return d.state == state; })
		svg_line.selectAll("path").remove();
		svg_line.selectAll("g").remove();
		svg_line.selectAll("rect").remove();

		var max = d3.max(states_data, function(d) { return parseInt(d.cases); });
		var x = d3.scaleTime().rangeRound([0, 800]).domain(d3.extent(states_data, function(d){ return parseTime(d.date); }));
		var y = d3.scaleLinear().domain([0, max]).range([250,0]);
		var lineCase = d3.line().x(function(d, i) { return x(parseTime(d.date)); }).y(function(d) { return y(parseInt(d.cases)); });
		var lineDeath = d3.line().x(function(d, i) { return x(parseTime(d.date)); }).y(function(d) { return y(parseInt(d.deaths)); });

		d3.select("#line-state").html(state);

		var bisect = d3.bisector(function(d) { return d.date; }).left;
		svg_line.append('rect')
    		.style("fill", "none")
    		.style("pointer-events", "all")
    		.attr('width', "900px")
    		.attr('height', "275px")
    		.on('mouseover', mouseover)
    		.on('mousemove', mousemove)
    		.on('mouseout', mouseout);
		// lines
		svg_line.append("path").datum(cur_data)
        	.attr("transform", "translate(10,0)")
        	.style("fill", "none")
        	.style("stroke", "#ECC26C")
        	.style("stroke-width", 5)
        	.attr("d", lineCase)
		svg_line.append("path").datum(cur_data)
			.attr("transform", "translate(10,0)")
			.style("fill", "none")
			.style("stroke", "#D18479")
			.style("stroke-width", 5)
    		.attr("d", lineDeath);

		var focus = svg_line
		   .append('g')
		   .append('circle')
		   .style("fill", "#F4981C")
		   .attr('r', 8)
		   .style("opacity", 0)
		var focusText = d3.select("#focus-text");

		function mouseover() {
 		   focus.style("opacity", 1)
 		   focusText.style("opacity",1)
 		 }
		function mousemove() {
    		var x0 = x.invert(d3.mouse(this)[0]).toISOString().substring(0,10);
    		var i = bisect(cur_data, x0, 1);
    		dd = cur_data[i];
    		focus.attr("cx", x(parseTime(dd.date)) + 10)
    			 .attr("cy", y(parseInt(dd.cases)));
    		focusText.html(dd.date + " : " + dd.cases);
    	}
 		 function mouseout() {
 		   focus.style("opacity", 0)
 		   focusText.style("opacity", 0)
 		 }

		// axis
		svg_line.append("g").attr("transform", "translate(10,250)")
			.call(d3.axisBottom(x))
			.style("stroke-width",2).style("font-size","15px");
		svg_line.append("g").attr("transform", "translate(810,0)").call(d3.axisRight(y)).style("stroke-width",2).style("font-size","12px");

		// growth
		var n = cur_data.length, days = 40, i = parseInt(n/2), k = n - days;
		console.log("i=" + i + ", k=" + k);
		var r1 = 0, r2 = 0;
		for (var j = 0; j < days; j++) {
			var c1 = cur_data[i+j].cases, c2 = cur_data[i+j-1].cases;
			r1 += (c1 - c2) / c2;
			var c3 = cur_data[k+j].cases, c4 = cur_data[k+j-1].cases;
			r2 += (c3 - c4) / c4;
		}
		r1 = (r1 / days).toFixed(3);
		r2 = (r2 / days).toFixed(3);

		var x1 = x(parseTime(cur_data[i].date));
		var y1 = y(cur_data[i].cases);
		var x2 = x(parseTime(cur_data[k + days - 10].date));
		var y2 = y(cur_data[k + days - 10].cases);
			console.log("x1=" + x1 + ", x2=" + x2 + ", y1=" + y1 + ", y2=" + y2);
		var svg_grow = svg_line.append('g');
		svg_grow.append('line').attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
				.style("stroke", "#0000004f")
    			.style("stroke-width", 1.5)
			console.log("c1=" + c1 + ", c2=" + c2 + ", c3=" + c3 + ", c4=" + c4);

		svg_grow.append('circle').attr("cx", x1).attr("cy", y1).attr("r", 3)
		svg_grow.append('circle').attr("cx", x2).attr("cy", y2).attr("r", 3)
		svg_grow.append('text').attr("x", x1 - 5).attr("y", y1 - 5).text("avg.rate:" + r1).attr('text-anchor', 'middle').style("font-size", "13px");
		svg_grow.append('text').attr("x", x2 + 5).attr("y", y2 - 5).text("avg.rate:" + r2).attr('text-anchor', 'middle').style("font-size", "13px");
		var ar = "\u2191";
		if (r1 == r2) ar = "-";
		else if (r1 > r2) ar = "\u2193";
		svg_grow.append('text').attr("x", (x1+x2)/2).attr("y", (y1+y2)/2 - 10)
				.text("Growth rate " + ar)
				.style("background-color", "red")
				.attr('text-anchor', 'middle');

	}



	/*     MAP     */
    renderMap();
    function renderMap() {
		$("#anno-1").show();
		$("#anno-2").hide();
		$("#btn-home").hide();

		var n1 = 1000, n2 = 10000, n3 = 50000, n4 = 150000, n5 = maxCase;
		var p1 = "#E7DBF3", p2 = "#C7B2DE", p3 = "#9779B7", p4 = "#4B2D69",  p5 = "#16002C";
		var color1 = d3.scaleLinear().domain([n1, n2]).range([p1, p2]);
		var color2 = d3.scaleLinear().domain([n2+1, n3]).range([p2, p3]);
		var color3 = d3.scaleLinear().domain([n3+1, n4]).range([p3, p4]);
		var color4 = d3.scaleLinear().domain([n4+1, n5]).range([p4, p5]);

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
        	.style("fill", function(d) { 
				if (d[1] <= n2) return color1(d[1]); 
				if (d[1] <= n3) return color2(d[1]); 
				if (d[1] <= n4) return color3(d[1]); 
				if (d[1] <= n5) return color4(d[1]); 
				return "black";
			});
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
		  	  	.attr("transform", "translate(20,0)")
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
					if (d.num <= n2) return color1(d.num); 
					if (d.num <= n3) return color2(d.num); 
					if (d.num <= n4) return color3(d.num); 
					if (d.num <= n5) return color4(d.num); 
					return "black";
		  	    })
		  	    .attr("d", path)
		  		.on('mouseover', function(d){
					 if (!still) {
						var id = +d.id;
						var state = idMap.get(id);
		  	        	$(this).attr("fill-opacity", "0.6");
		  	        	$(this).attr("stroke", "#D3F381");
						$(this).attr("stroke-width", "4px");
						d3.select("#tip-state").text(state);
						d3.select("#tip-case").text("Confirmed: " + stateMap.get(state)[1]);
						d3.select("#tip-death").text("Deaths: " + stateMap.get(state)[2]);
						d3.select("#btn-county").on('click', function() {renderBar(state);}).text(state + " Counties >>");

						var rect = d3.select("#" + stateMap.get(state)[0].substring(1));
						d3.select("#arrow").style("top", (78 + parseInt(rect.attr("y"))) + "px");
		  	        	$("#arrow").show();
		  	        	$("#tooltip").show();
		
		  	        	var tooltip_width = $("#tooltip").width();
		  	        	d3.select("#tooltip")
		  	        	  .style("top", d3.event.layerY + "px")
		  	        	  .style("left", (d3.event.layerX + 20) + "px");
						 renderLines(state);
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
						 d3.select("#tooltip").style("background-color", "#E9FFD8").style("opacity", 0.75);
						 still = false;
					 }
					curSelect = $(this);
		  	    });

			  	svg_main.append("path").attr("transform", "translate(20,0)")
					.attr("d", path(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; })))
      				.attr("class", "state-border");

			document.getElementsByTagName('body')[0].onclick = function() {
				curSelect.attr("fill-opacity", "1");
                curSelect.attr("stroke", "white");
                curSelect.attr("stroke-width", "0.8px");
				$("#tooltip").hide();
				$("#arrow").hide();
                $("#btn-county").hide();
				d3.select("#tooltip").style("background-color", "#E9FFD8").style("opacity", 0.75);
                still = false;
			};
		
		});
    }


	/*      BAR      */
	const counties_data = await d3.csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/live/us-counties.csv");
	function renderBar(state) {
		var svg_main = d3.select("#main"); 
		svg_main.selectAll("*").remove();
		$("#line-state").hide();
		$("#bar-state").show();
		$("#anno-1").hide();
		$("#anno-2").show();
		$("#btn-home").show();
		$("#focus-text").hide();
		$("#lines").hide();
		$("#bar").hide();
		d3.select("#bar-state").html(state);
		var cur_data = counties_data.filter(function(d) { return d.state == state; })

		var left = 100, up = 50, height = 600;
		var xx = d3.scaleBand().domain(cur_data.map(function(d,i) { return d.county; })).range([0, 1300]);
		var yy = d3.scaleLinear().domain([0, d3.max(cur_data, function(d) { return parseInt(d.cases); })]).range([height, 0]);
		var color = d3.scaleOrdinal(d3.schemePaired).domain(cur_data.map(function(d,i) { return d.county; }));

		// transcript
		svg_main.append("g")
		    .attr("transform", "translate(" + left + "," + up + ")")
		    .selectAll("rect").data(cur_data)
		    .enter().append("rect")
		    .attr("x", function(d) { return xx(d.county); })
		    .attr("width", xx.bandwidth())
			.attr("y", 0)
		    .attr("height", "600px")
			.attr("fill", "white")
			.on('mouseover', mouseover)
            .on('mousemove', function(d,i) { mousemove(d.cases, xx(d.county), yy(d.cases), xx.bandwidth(), i); })
            .on('mouseout', function(d,i) { mouseout(i);});
	
		// real
		svg_main.append("g")
		    .attr("transform", "translate(" + left + "," + up + ")")
		    .selectAll("rect").data(cur_data)
		    .enter().append("rect")
		    .attr("x", function(d) { return xx(d.county); })
		    .attr("width", xx.bandwidth())
		    .attr("y", function(d) { return yy(d.cases); })
		    .attr("height", function(d) { return height - yy(d.cases); })
			.attr("fill", function(d) { return color(d.county); })
			.attr("fill-opacity", 0.6)
			.on('mouseover', mouseover)
            .on('mousemove', function(d,i) { 
				mousemove(d.cases, xx(d.county), yy(d.cases), xx.bandwidth(), i); 
				$(this).attr("fill-opacity", 1); 
			})
            .on('mouseout',  function(d,i) { 
				mouseout(i);
				$(this).attr("fill-opacity", 0.6);
			});
	
		// axis
		svg_main.append("g").attr("transform", "translate(" + left + "," + (up + height) + ")").call(d3.axisBottom(xx))
			.attr("id", "btAxis")
			.style("stroke-width" ,2)
			.style("font-size", function() {
					var size = 1 + 1000 / xx.domain().length;
                    if (size > 16)  size = 16;
					return size + "px";
                 })
			.selectAll("text")
			.classed("axis", true)
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", "-.55em")
			.attr("transform", "rotate(-45)");

		svg_main.append("g").attr("transform", "translate(" + left + "," + up + ")").call(d3.axisLeft(yy))
			.style("stroke-width",2).style("font-size","12px");

		// mouse
		var focusNum = svg_main.append('g').append('text')
      		.style("opacity", 0)
      		.attr("text-anchor", "middle")
      		.attr("alignment-baseline", "middle");

		function mouseover() {
 		   focusNum.style("opacity",1)
 		 }
		function mousemove(cases, x, y, w, i) {
    		focusNum.html(cases)
				.attr("x", x + left + w / 2)
				.attr("y", y + up - 10)
				.style("font-size", function() {
					if (w > 18)  return "18px";
					else if (w < 14) return "14px";
					else return w + "px";
				});
			d3.select("#btAxis").select("g:nth-child(" + (i+2) + ")").select("text").classed("axis", false).classed("hover-axis", true);
    	}
 		function mouseout(i) {
 		 	focusNum.style("opacity", 0)
		 	d3.select("#btAxis").select("g:nth-child(" + (i+2) + ")").select("text").classed("hover-axis", false).classed("axis", true);
 		}

	}

})();


