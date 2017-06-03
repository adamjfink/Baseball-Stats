var margin = {top: 20, right: 10, bottom:25, left:100};

var width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;



function drawBarPlot(data){
  var bAT = {fill: "#85C1E9",
                stroke: "#3498DB"};

  var hbAT = {fill: "#E9AD85",
                      stroke: "#DB7734"};

  var chart = d3.select("#hand-barplot>.plot-container").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height+margin.top+margin.bottom)
        .attr("class", "barplot")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var countHand = d3.nest()
        .key(function(d){
          return d.handedness;
        })
        .rollup(function(leaves) {return {"count": leaves.length,
                                          "percentage": leaves.length/data.length*100};})
        .entries(data);

  var x = d3.scale.ordinal()
          .domain(["L", "B", "R"])
          .rangeBands([0, width], 0.1);


  var y = d3.scale.linear()
            .domain([0, d3.max(countHand, function(d) {return d.values.count;})])
            .range([height, 0]);

  var yPercent = d3.scale.linear()
                .domain([0, 100])
                .range([height, 0]);


  var handAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(function(value){
      newLabels = {"R": "Right",
                    "L": "Left",
                    "B": "Both"};
      return newLabels[value];
    });

  var verticalAxis = d3.svg.axis()
    .scale(yPercent)
    .orient("left");

  chart.append("g")
    .attr("class", "hand axis")
    .attr("transform", "translate(0,"+ height+")")
    .call(handAxis);

  chart.append("g")
      .attr("class", "vertical axis")
      .call(verticalAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("class", "vertical label")
      .style("text-anchor", "end")
      .text("Percentage of Players (%)");

  var bar = chart.selectAll(".bar")
        .data(countHand)
      .enter().append("rect")

        .attr("class", "bar")
        .attr("x", function(d){return x(d.key);})
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return yPercent(d.values.percentage); })
        .attr("height", function(d) { return height - yPercent(d.values.percentage); })
        .attr(bAT);

  var bPCT = d3.select("#hand-barplot>.plot-container")
                .append("div")
                .attr("class", "buttons")
                .append("button")
                .attr("type", "button")
                .text("Show Count")
                .style("display", "block");

  function changBar(showWhat){
    var transition_time=1500;
    var newScale;
    var newText;
    var newLabel;
    switch(showWhat){
      case "percentage":
        newScale = yPercent;
        newText = "Count";
        newLabel =  "Percentage";
        break;
      case "count":
        newScale = y;
        newText = "Percentage";
        newLabel = "Number";
        break;
    }
    chart.selectAll(".bar")
      .transition(transition_time)
      .attr("y", function(d) { return newScale(d.values[showWhat]); })
      .attr("height", function(d) { return height - newScale(d.values[showWhat]); });
    d3.select(".vertical.axis")
      .transition(transition_time)
      .call(verticalAxis.scale(newScale));
    d3.select("text.vertical.label")
      .text(newLabel);
    bPCT
      .text("Show "+newText);

  }

  var tooltip = d3.select("#hand-barplot").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("display", "none");

  function mouseAc(d){
    d3.select(this)
      .transition(500)
      .attr(hbAT);
    tooltip
      .html("<b>Count:</b> "+d.values.count+
            " players.<br><b>Percentage:</b> "+
            d.values.percentage.toFixed(1)+" %")
      .style("display", "inline");
    }

  function mouseOUT(d){
    d3.select(this)
      .transition(500)
      .attr(bAT);
    tooltip
      .style("display", "none");
  }

  function mouseMOVE(d){
    tooltip
      .style("left", (d3.event.pageX + 20) + "px")
      .style("top", (d3.event.pageY - 40) + "px");
  }
  chart.selectAll(".bar")
    .on("mouseAc", mouseAc)
    .on("mouseOUT", mouseOUT)
    .on("mouseMOVE", mouseMOVE);

bPCT.on("click", function(){
  if(bPCT.text() == "Show Percentage"){
    changBar("percentage");
  }else {
    changBar("count");
  }});
}
