let loadCount = 4;

let gephiNoverlap = [];

d3.json('https://raw.githubusercontent.com/gotovk/gotovk.github.io/master/assets/graph.json').then((data) => {
  gephiNoverlap = data;
  loaded();
})

function mod(x, m) {
  return ((x % m) + m) % m;
}

let layer1 = null;
// 'translate(0 -191.17)';

function showLegend(stationNo) {
  let x, y, r;
  if (currentMode === 0) {
    x = bloodStationsData[stationNo].x;
    y = bloodStationsData[stationNo].y;
    r = 1.7;
  } else {
    x = bloodStationsData[stationNo].x1;
    y = bloodStationsData[stationNo].y1;
    r = bloodStationsData[stationNo].r1 * 0.6;
  }
  layer1.setAttribute('visibility', 'visible');
  layer1.style.pointerEvents = 'none';
  layer1.setAttribute('transform', `translate(${x}, ${y}) scale(${r / 15}) translate(-52 -245)`); // translate(${x1}, ${y1}) translate(50 50)`);
  // layer1.setAttribute('transform', `translate(0 -191.17)  scale(${r1 / 10}) translate(${x1}, ${y1}) translate(50 50)`);
}

function initialize() {
  lowSVGG.selectAll(".tp").data(regionsCirclesData).enter().append('path')
      .attr("id", ({title}) => 'tp_' + title)
      .attr("d", ({cx, cy, r}) => {
        return `M${cx-r-4},${cy + 0.1}A${r + 4},${r + 4},0,1,0,${cx-r-4},${cy - 0.1}`
      }).attr('stroke', 'none').attr('fill', 'none');
  lowSVGG.selectAll('.regText').data(regionsCirclesData).enter().append('text').attr('class', 'regText')
    .attr("visibility", "hidden")
    .attr("font-size", "4px")
      .attr("font-family", "Arial")
      .attr('fill', 'white')
      .append("textPath")
        .attr("xlink:href", ({title}) => "#tp_" + title)
        .text(({title}) => title);
  // lowSVGG.call(semaphore);
  lowSVGG.call(drawRegions);
  // upSVGG.call(drawRegionsCircles);
  //  upSVGG.call(drawBloodStations);
  // upSVGG.call(drawBloodStationsCircles);
  upSVGG.call(drawBloodStationsSemaphores);
  // legend.setAttribute('id', 'legend');
  // upSVG.select('#legend').style('visibility', 'hidden');
  // legend.setAttribute('id', 'legend');
  // legend.style.visibility = 'hidden';
  // d3.select(legend).select('g').attr('transform', 'translate(1, 1)');
  layer1 = legend.getElementById('layer1');
  upSVGG.node().appendChild(layer1);
  layer1.setAttribute('visibility', 'hidden');
  // upSVGG.call(drawBloodStationsCirclesSemaphores);
  // avatarsTextures = [];
  /*
  const ph = phyllotaxis(10);
  avatarsCoords = d3.range(20000).map(i => {
    const [x, y] = ph(i);
    avatarsTextures.push(avatarsTexturesBank[Math.floor(Math.random() * 36)]);
    return [x, y, 10 * (0.5 + Math.random())];
  });
  */
  // avatarsCoords = [];
  /*
  gephiNoverlap.forEach(({id, radius, x, y}, i) => {
    avatarsTextures.push(avatarsTexturesBank[Math.floor(Math.random() * 36)]);
    const coords = [x, y, radius * 2.3];
    const invGroup = inverseGroup(coords);
    if (invGroup === null) {
      return;
    }
    avatarsCoords.push(coords);
  });
  */
}

function update() {
  lowSVGG.attr('transform', transform);
  upSVGG.attr('transform', transform);
}

window.addEventListener('load', () => {
  loadMap();
})

window.onkeydown = function(e) {
  const key = e.key;
  console.log('key', key);
  if (key == '1') {
    mapClick(1);
  } else if (key == '2') {
    centersClick(1);
  } else if (key == '3') {
    peopleClick(1);
  } else if (key == '4') {
    rightPanel.style.display = rightPanel.style.display === 'none' ? 'block' : 'none';
  }
}

function allLoaded() {
  mapInitialize();
  generateUsers();
  initialize();
  cycleInit();
}
