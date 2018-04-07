
var colorList = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"];
var barChart = dc.barChart("#bar-chart");
var pieChart = dc.pieChart("#pie-chart");
var bubbleChart = dc.bubbleChart("#bubble-chart");

function show(id) {
  var e = document.getElementById(id);
  e.style.display = 'block';
}

function hide(id) {
  var e = document.getElementById(id);
  e.style.display = 'none';
}

function resetAll(){
  var charts = dc.chartRegistry.list();
  for(var i=0; i<charts.length; i++){
    charts[i].filterAll();
  }
  dc.redrawAll();
}

function update_title(fig, title){
  var h = document.createElement('h5');
  var t = document.createTextNode(title);
  h.appendChild(t);
  var myNode = document.getElementById("title-"+fig);
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }
  myNode.appendChild(h); 
}

function remove_title(fig){
  var myNode = document.getElementById("title-"+fig);
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }
}

function update_barChart(bar_axis, barChart, facts, data){

  barChart.filterAll();

  /******************************************************
  * Create the Dimensions                               *
  * A dimension is something to group or filter by.     *
  * Crossfilter can filter by exact value, or by range. *
  ******************************************************/
  var barValue = facts.dimension(function (d) {
    if(bar_axis=="Post Weekday"){
        var dict = {'Mon': '1', 'Tue': '2', 'Wed': '3','Thu':'4', 'Fri': '5', 'Sat': '6', 'Sun': '7'};
        return dict[d[bar_axis]]+'.'+d[bar_axis];
    }
    return d[bar_axis];       // group or filter by magnitude
  });

  var barCount = barValue.group()
    .reduceCount(function(d) { return d[bar_axis]; });

  // Bar Graph
  barChart.width(400)
    .height(200)
    .margins({top: 10, right: 10, bottom: 50, left: 50})
    .dimension(barValue)                // the values across the x axis
    .group(barCount)              // the values on the y axis
    .transitionDuration(500)
    .xUnits(dc.units.ordinal)
    .x(d3.scale.ordinal())
    .elasticY(true)
    .xAxisLabel(bar_axis)
    .yAxisLabel("Count")
    .ordering(function(d) { return +d.key; })
    .renderTitle(true)
    .title(function(d) {
      if(bar_axis=="Post Weekday")
        title = bar_axis+": " + d.key.split(".")[1]+"\n";
      else
        title = bar_axis+": " + d.key+"\n";
      title += "Count: "+ d.value;
      return title;
    });

  barChart.xAxis().tickFormat(function(d){
    if(bar_axis=="Post Weekday")
      tick = d.split(".")[1];
    else
      tick = d;
    return tick;
  });
}

function update_pieChart(color_axis, pieChart, facts, data){

  pieChart.filterAll();

  /******************************************************
  * Create the Dimensions                               *
  * A dimension is something to group or filter by.     *
  * Crossfilter can filter by exact value, or by range. *
  ******************************************************/

  var pieValue = facts.dimension(function (d) {
    return d[color_axis];       // group or filter by magnitude
  });

  totalcount = d3.sum(data, function(d){return 1;});

  var pieCount = pieValue.group().reduceCount(function(d){return d[color_axis];});


  var color_map = data.map(function(d){return d[color_axis];});

  pieChart 
    .width(400)
    .height(200)
    .radius(80)
    .innerRadius(30)
    .dimension(pieValue)
    .group(pieCount)
    .transitionDuration(500)
    .colors(d3.scale.category10().domain(color_map))
    .legend(dc.legend().x(10).y(10).itemHeight(13).gap(5))
    .renderTitle(true)
    .title(function(d){
      return color_axis+": "+d.key+"\n"
      +"Count : "+d.value+"\n"
      +"Percentage :" + Math.round(d.value/d3.sum(pieCount.all(),function(d){return d.value; })*100)+'%';});
}

function update_bubble(xColumn, yColumn, color_axis, bubbleChart, facts, data){

  bubbleChart.filterAll();
  /******************************************************
  * Create the Dimensions                               *
  * A dimension is something to group or filter by.     *
  * Crossfilter can filter by exact value, or by range. *
  ******************************************************/

  var bubbleValue = facts.dimension(function (d){
    return  [d[xColumn], d[yColumn], d[color_axis]];
  });

  var bubbleGroup = bubbleValue.group().reduce(
      function (p, d){
        p.count ++;
        p.xSum += d[xColumn];
        p.ySum += d[yColumn];
        p.xColumn = p.xSum / parseFloat(p.count);
        p.yColumn = p.ySum / parseFloat(p.count);
        p.color = d[color_axis];
        return p;
      },
      function (p, d){
        p.count --;
        p.xSum -= d[xColumn];
        p.ySum -= d[yColumn];
        p.xColumn = p.count==0? 0: p.xSum / parseFloat(p.count);
        p.yColumn = p.count==0? 0: p.ySum / parseFloat(p.count);
        if(p.count==0){
          p.color = "";
          p.xColumn = -20000;
          p.yColumn = -20000;
        }
        return p;
      },
      function (p, d){
        return {count:0, xSum:0, ySum:0, xColumn:0, yColumn:0, color:""};
      }
     );

  var color_map = data.map(function(d){return d[color_axis];});

    // bubble chart
  bubbleChart.width(600)
  	.height(400)
  	.margins({top: 10, right: 15, bottom: 50, left: 60})
  	.dimension(bubbleValue)
  	.group(bubbleGroup)
  	.transitionDuration(500)
  	.colors(d3.scale.category10().domain(color_map))
  	.colorAccessor(function (p) {
  		return p.value.color;
  	    })
  	.keyAccessor(function (p) {
  		return p.value.xColumn;
  	    })
  	.valueAccessor(function (p) {
  		return p.value.yColumn;
  	    })
  	.radiusValueAccessor(function (p) {
  		return 1.0;
  	    })
  	.minRadius(1)
  	.maxBubbleRelativeSize(0.010)
  	.x(d3.scale.linear().domain([0, d3.max(data, function(d){return d[xColumn];})]))
  	.y(d3.scale.linear().domain([0, d3.max(data, function(d){return d[yColumn];})]))
  	.r(d3.scale.linear().domain([0.5,1]))
  	.yAxisLabel(yColumn)
  	.xAxisLabel(xColumn)
  	.renderHorizontalGridLines(true)
  	.renderVerticalGridLines(true)
  	.renderTitle(true)
  	.title(function(d){
  	  return color_axis+": "+d.value.color+"\n"
  	  +xColumn+": "+Math.round(d.value.xColumn*100)/100+"\n"
  	  +yColumn+": "+Math.round(d.value.yColumn*100)/100;});
}

function plot(dataset){

  $(".nav a").on("click", function(){
    $(".nav").find(".active").removeClass("active");
    $(this).parent().addClass("active");
  });

  d3.json("./clean_data/metadata_"+dataset+".json", function(error, data) {
      n_scatter = data["number of numerical data"];
      n_bar = data["number of category data"];
      scatter_axis = data["numerical"];
      bar_axis = data["category"];
      color_axis = data["category"];

      var selectX = document.getElementById("selectX");
      selectX.options.length=0;
      var optionsX = scatter_axis;
      for(var i = 0; i < optionsX.length; i++) {
          var opt = optionsX[i];
          var el = document.createElement("option");
          el.textContent = opt;
          el.value = opt;
          if(i==1)
            el.selected = true;
          selectX.appendChild(el);
      }

      var selectY = document.getElementById("selectY");
      selectY.options.length=0;
      var optionsY = scatter_axis;
      for(var i = 0; i < optionsY.length; i++) {
          var opt = optionsY[i];
          var el = document.createElement("option");
          el.textContent = opt;
          el.value = opt;
          if(i==2)
            el.selected = true;
          selectY.appendChild(el);
      }

      var selectColor = document.getElementById("selectColor");
      selectColor.options.length=0;
      var optionsColor = color_axis;
      for(var i = 0; i < optionsColor.length; i++) {
          var opt = optionsColor[i];
          var el = document.createElement("option");
          el.textContent = opt;
          el.value = opt;
          if(i==0)
            el.selected = true;
          selectColor.appendChild(el);
      }

      var selectBar = document.getElementById("selectBar");
      selectBar.options.length=0;
      var optionsBar = bar_axis;
      for(var i = 0; i < optionsBar.length; i++) {
          var opt = optionsBar[i];
          var el = document.createElement("option");
          el.textContent = opt;
          el.value = opt;
          if(i==1)
            el.selected = true;
          selectBar.appendChild(el);
      }

      // load data from a csv file
      d3.csv("./clean_data/data_"+dataset+".csv", function (data) {

        data.forEach(function(d){
          for(var i = 0; i<n_scatter; i++){
            d[scatter_axis[i]] = +d[scatter_axis[i]];
          }
          return d;
        });

	/****************************************
	*   Run the data through crossfilter    *
	****************************************/
        var facts = crossfilter(data);  // Gets our 'facts' into crossfilter

        // for bar plot
        update_title("bar", "By "+bar_axis[1]);
        update_barChart(bar_axis[1], barChart, facts, data);
        update_barChart(bar_axis[1], barChart, facts, data);

        // for pie plot
        update_title("pie", "By "+color_axis[0]);
        update_pieChart(color_axis[0], pieChart, facts, data);
        
        //bubble chart
        update_title("bubble", scatter_axis[2]+ " By "+scatter_axis[1]);
        update_bubble(scatter_axis[1], scatter_axis[2], color_axis[0], bubbleChart, facts, data);
        update_bubble(scatter_axis[1], scatter_axis[2], color_axis[0], bubbleChart, facts, data);

      	dc.renderAll();

        d3.select('#selectX')
         .on('change', function(){ 
          var e = d3.select("#selectY").node(); 
          var optionY = e.value;
          var optionColor = d3.select("#selectColor").node().value;
          update_title("bubble", optionY+ " By "+this.value);
          update_bubble(this.value, optionY, optionColor, bubbleChart, facts, data);
      	  dc.redrawAll();
    	  });

        d3.select('#selectY')
         .on('change', function(){ 
          var e = d3.select("#selectX").node(); 
          var optionX = e.value;
          var optionColor = d3.select("#selectColor").node().value;
          update_title("bubble", this.value+ " By "+optionX);
          update_bubble(optionX, this.value, optionColor, bubbleChart, facts, data);
      	  dc.redrawAll();
    	  });

        d3.select('#selectColor')
         .on('change', function(){ 
          resetAll();
          var optionX = d3.select("#selectX").node().value;
          var optionY = d3.select("#selectY").node().value;
          update_title("pie", "By "+this.value);
          update_pieChart(this.value, pieChart, facts, data);
          update_bubble(optionX, optionY, this.value, bubbleChart, facts, data);
      	  dc.redrawAll(); 
    	  });

        d3.select('#selectBar')
         .on('change', function(){ 
      	  resetAll();
          update_title("bar", "By "+this.value);
          update_barChart(this.value, barChart, facts, data);
      	  dc.redrawAll(); 
    	  });
      });
  });
}

plot("wine");
 
