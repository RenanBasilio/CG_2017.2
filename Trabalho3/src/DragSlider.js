var svg = d3.select("svg"),
margin = {top: 20, bottom:20, right: 20, left: 20},
width = +svg.attr("width") - margin.left - margin.right,
height = +svg.attr("height");

var x = d3.scaleLinear()
.domain([0, 100])
.range([0, 1000])
.clamp(true);

var slider = svg.append("g")
.attr("class", "slider")
.attr("transform", "translate(" + margin.left + "," + height / 2 + ")");

slider.append("viewBox");

var circleState = new Array(100);

for (var i = 0; i <= 100; i++){
    circleState[i] = false;
}

function onCircleClick(){
    d3.event.preventDefault();

    var circle = d3.select("circle#" + d3.event.target.id);

    var id = d3.event.target.id.split("circle").pop();
    console.log(id);

    if (!circleState[id]){
        circleState[id] = true;
        circle.style("fill", "black");
        document.dispatchEvent(new CustomEvent("keyframe", {detail: {set: true, frame: id}}));
    }
    else{
        circleState[id] = false;
        circle.style("fill", "white");
        document.dispatchEvent(new CustomEvent("keyframe", {detail: {set: false, frame: id}}));
    }
}

slider.append("line")
.attr("class", "track")
.attr("x1", x.range()[0])
.attr("x2", x.range()[1])
.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
.attr("class", "track-inset")
.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
.attr("class", "track-overlay")
.call(d3.drag()
    .on("start.interrupt", function() { slider.interrupt(); })
    .on("start drag", function() { hue(x.invert(d3.event.x)); }));

slider.insert("g", ".track-overlay")
.attr("class", "ticks")
.attr("transform", "translate(0," + 18 + ")")
.selectAll("text")
.data(x.ticks(10))
.enter().append("text")
.attr("x", x)
.attr("text-anchor", "middle")
.text(function(d) { return d ; });

var handle = slider.insert("circle", ".track-overlay")
.attr("class", "handle")
.attr("r", 9);

for (var i = 0; i <= 100; i++){
    slider.append("circle")
    .attr("id", 'circle' + i)
    .attr("cx", i * 10)
    .attr("cy", -20)
    .attr("r", 3.5)
    .style("fill", "white")
    .style("stroke", "black")
    .on("click", onCircleClick);
}

var lastValue = 0;

function hue(h) {

    handle.attr("cx", x(h));

    var value = Math.round(x(h)/10);

    if(value != lastValue){
        document.dispatchEvent(new CustomEvent("slider", {detail: {frame: value}}));
        lastValue = value;
    }
}