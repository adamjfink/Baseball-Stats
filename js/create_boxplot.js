var margin = {
	top: 20,
	right: 10,
	bottom: 25,
	left: 100
};

var width = 960 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;

function drawBoxPlot(data, Vname) {
	data = data.sort(function (a, b) {
			return a[Vname] - b[Vname];
		});

	var chart = d3.select("#" + Vname + "-boxplot>.plot-container").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.attr("class", "boxplot " + Vname)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var byHand = d3.nest()
		.key(function (d) {
			return d.handedness;
		})
		.entries(data);

	function topW(q1, q3, vArray) {
		var whisk = q3 + 1.5 * (q3 - q1);
		var notOut = vArray.filter(function (d) {
				return d <= whisk;
			});
		return Math.min(whisk, d3.max(notOut));
	}

	function bottonW(q1, q3, vArray) {
		var whisk = q1 - 1.5 * (q3 - q1);
		var notOut = vArray.filter(function (d) {
				return d >= whisk;
			});
		return Math.max(whisk, d3.min(notOut));
	}

	var summarys = d3.nest()
		.key(function (d) {
			return d.handedness;
		})
		.rollup(function (leaves) {
			var vArray = leaves.map(function (d) {
					return d[Vname];
				});
			var summary = {
				"min": d3.min(vArray),
				"q1": d3.quantile(vArray, 0.25),
				"median": d3.median(vArray),
				"q3": d3.quantile(vArray, 0.75),
				"max": d3.max(vArray)
			};
			summary.topW = topW(summary.q1, summary.q3, vArray);
			summary.bottonW = bottonW(summary.q1, summary.q3, vArray);
			return summary;
		})
		.entries(data);

	var x = d3.scale.ordinal()
		.domain(["L", "B", "R"])
		.rangeBands([0, width], 0.3);

	var y = d3.scale.linear()
		.domain([d3.min(summarys, function (d) {
					return d.values.bottonW;
				}),
				d3.max(summarys, function (d) {
					return d.values.topW;
				})])
		.range([height, 0]);

	var handLabels = {
		"R": "Right",
		"L": "Left",
		"B": "Both"
	};
	var handAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.tickFormat(function (value) {
			return handLabels[value];
		});

	var vertAxis = d3.svg.axis()
		.scale(y)
		.orient("left");

	chart.append("g")
	.attr("class", "hand axis")
	.attr("transform", "translate(0," + height + ")")
	.call(handAxis);

	var vertLabels = {
		"avg": "Batting Average",
		"HR": "Home runs"
	};
	chart.append("g")
	.attr("class", "vertical axis")
	.call(vertAxis)
	.append("text")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", "0.71em")
	.attr("class", "vertical label")
	.style("text-anchor", "end")
	.text(vertLabels[Vname]);

	var box = chart.selectAll(".box")
		.data(summarys)
		.enter().append("rect")
		.attr("class", "box")
		.attr("x", function (d) {
			return x(d.key);
		})
		.attr("width", x.rangeBand())
		.attr("y", function (d) {
			return y(d.values.q3);
		})
		.attr("height", function (d) {
			return Math.abs(y(d.values.q3) - y(d.values.q1));
		});

	function updateBox(newScale) {
		chart.selectAll(".box")
		.transition()
		.attr("y", function (d) {
			return newScale(d.values.q3);
		})
		.attr("height", function (d) {
			return newScale(d.values.q1) - newScale(d.values.q3);
		});
	}

	var mTip = d3.tip()
		.attr("class", "d3-tip")
		.html(function (d) {
			return "<b>" + handLabels[d.key] + " median:</b> " + d.values.median;
		})
		.direction("n");

	chart.call(mTip);

	var mLine = chart.selectAll(".median")
		.data(summarys)
		.enter().append("line")
		.attr("class", "median")
		.attr("x1", function (d) {
			return x(d.key);
		})
		.attr("x2", function (d) {
			return x(d.key) + x.rangeBand();
		})
		.attr("y1", function (d) {
			return y(d.values.median);
		})
		.attr("y2", function (d) {
			return y(d.values.median);
		})
		.on("mouseover", mTip.show)
		.on("mouseout", mTip.hide);

	chart.selectAll("rect.box")
	.on("mouseover", mTip.show)
	.on("mouseout", mTip.hide);

	function updateMedian(newScale) {
		chart.selectAll(".median")
		.transition()
		.attr("y1", function (d) {
			return newScale(d.values.median);
		})
		.attr("y2", function (d) {
			return newScale(d.values.median);
		});
	}

	function whiskLines(q, side, vScale) {
		return chart.selectAll("." + side + ".whisk")
		.data(summarys)
		.enter().append("line")
		.attr("class", side + " whisk")
		.attr({
			x1: function (d) {
				return x(d.key) + x.rangeBand() / 2;
			},
			x2: function (d) {
				return x(d.key) + x.rangeBand() / 2;
			},
			y1: function (d) {
				return vScale(d.values[q]);
			},
			y2: function (d) {
				return vScale(d.values[side + "whisk"]);
			}
		});
	}

	var topWs = whiskLines("q1", "bottom", y);
	var bottonWs = whiskLines("q3", "top", y);

	function updateW(newScale) {
		var mapper = {
			"bottom": "q1",
			"top": "q3"
		};
		chart.selectAll(".whisk")
		.transition()
		.attr({
			y1: function (d) {
				return newScale(d.values[mapper[this.classList[0]]]);
			},
			y2: function (d) {
				return newScale(d.values[this.classList[0] + "whisk"]);
			}
		});

	}

	var ming = {};
	summarys.forEach(function (hand, index) {
		ming[hand.key] = index;
	});

	var outliers = data.filter(function (player) {
			return player[Vname] > summarys[ming[player.handedness]].values.topW ||
			player[Vname] < summarys[ming[player.handedness]].values.bottonW;
		});

	function fData(d) {
		htmlText = "<b>Name: </b> #name</br>" +
			"<b>Batting Average: </b> #avg</br>" +
			"<b>Home runs: </b> #HR</br>";

		htmlText = htmlText.replace(/#(\w+)/g, function (match, p1) {
				return d[p1];
			});
		return htmlText;
	}

	var circles_tip = d3.tip()
		.attr("class", "d3-tip")
		.html(fData)
		.direction("ne");
	chart.call(circles_tip);
	update_outliers(outliers, y);

	function update_outliers(outliers, newScale) {

		var circles = chart.selectAll("circle.outlier")
			.data(outliers
				.filter(function (d) {
					return d[Vname] >= newScale.domain()[0] &&
					d[Vname] <= newScale.domain()[1];
				}), function (d) {
				return d.name;
			});

		circles
		.enter()
		.append("circle")
		.attr("class", "outlier")
		.attr({
			cx: function (d) {
				return x(d.handedness) + x.rangeBand() / 2;
			},
			r: 5
		})
		.on("mouseover", circles_tip.show)
		.on("mouseout", circles_tip.hide);

		circles.transition().attr("cy", function (d) {
			return newScale(d[Vname]);
		});

		circles.exit().remove();
	}

	var ztButtons = d3.select("#" + Vname + "-boxplot>.plot-container").append("div")
		.attr("class", "buttons " + Vname);

	var bZoomIn = d3.select(".buttons." + Vname).append("button")
		.attr("name", "in")
		.attr("type", "button")
		.property("disabled", true)
		.text("Zoom In");

	var bZoomOut = d3.select(".buttons." + Vname).append("button")
		.attr("name", "out")
		.attr("class", "out")
		.attr("type", "button")
		.text("Zoom Out");

	var yZ = d3.scale.linear()
		.domain([0, d3.max(summarys, function (d) {
					return d.values.max;
				})])
		.range([height, 0]);

	function updateAx(newScale) {
		chart.select(".vertical.axis").
		transition()
		.call(vertAxis.scale(newScale));
	}

	function updateScle() {
		var newScale;
		if (this.name === "in") {
			newScale = y;
			bZoomIn.property("disabled", true);
			bZoomOut.property("disabled", false);
		} else {
			newScale = yZ;
			bZoomOut.property("disabled", true);
			bZoomIn.property("disabled", false);
		}
		updateBox(newScale);
		updateMedian(newScale);
		updateW(newScale);
		updateAx(newScale);
		update_outliers(outliers, newScale);

	}
	bZoomIn.on("click", updateScle);
	bZoomOut.on("click", updateScle);

}