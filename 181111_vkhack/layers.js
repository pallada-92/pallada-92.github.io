document.body.style.overflow = 'hidden';
document.body.style.margin = '0px';
document.body.style.padding = '0px';

const root = document.getElementById('root');

const width = Math.round(window.innerWidth);
const height = Math.round(window.innerHeight);

function addLayer(elem) {
  elem.style.position = 'absolute';
  elem.style.top = '0px';
  elem.style.left = '0px';
  root.appendChild(elem);
}

function makeSVG() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const sel = d3.select(svg).attr('viewBox', `0 0 ${width} ${height}`);
  return sel;
}

let legend = null;

window.addEventListener('load', () => {
  d3.svg('https://gist.githubusercontent.com/pallada-92/bd8427633c22c032d3755e632597a99b/raw/9255875442eac7a23a6e426836fba510431f10c7/legend_export.svg').then(svg => {
    legend = svg.documentElement;
    loaded();
  });
})

const lowSVG = makeSVG();
const lowSVGG = lowSVG.append('g');
const webglCanvas = document.createElement('canvas');
const upSVG = makeSVG();
const upSVGG = upSVG.append('g');
const upSVGButtons = upSVG.append('g').attr('font-family', 'Arial').attr('font-size', '20px').attr('fill', 'white').attr('font-weight', 'bold').attr('text-anchor', 'middle');
const rightPanel = document.createElement('div');
rightPanel.style.position = 'absolute';
rightPanel.style.top = '0px';
rightPanel.style.bottom = '0px';
rightPanel.style.right = '0px';
rightPanel.style.width = '400px';
rightPanel.style.display = 'none';
rightPanel.style.background = 'rgba(0, 0, 0, 0.5)';
rightPanel.style.color = 'white';
rightPanel.style.padding = '15px';
rightPanel.style.fontFamily = 'Arial';

const lWidth = innerWidth - 430;
const rel = 1 / 4;
const btnPanelW = lWidth * 0.75;
const btnPanelH = 40;
const btnPanelR = 8;
const btnPanelBL = 37;
upSVGButtons.append('rect').attr('width', btnPanelW).attr('x', (lWidth - btnPanelW) / 2).attr('y', 10).attr('height', btnPanelH).attr('fill', 'rgba(0, 0, 0, 0.5)').attr('rx', btnPanelR).attr('ry', btnPanelR);
upSVGButtons.append('rect').attr('id', 'selRect').attr('width', btnPanelW / 3).attr('x', (lWidth - btnPanelW) / 2).attr('y', 10).attr('height', btnPanelH).attr('fill', 'rgba(0, 0, 0, 1)').attr('stroke', 'blue').attr('rx', btnPanelR).attr('ry', btnPanelR);
upSVGButtons.append('text').text('Карта').attr('transform', `translate(${lWidth * rel}, ${btnPanelBL})`).attr('cursor', 'pointer').on('click', () => mapClick());
upSVGButtons.append('text').text('Центры').attr('transform', `translate(${lWidth * 0.5}, ${btnPanelBL})`).attr('cursor', 'pointer').on('click', () => centersClick());
upSVGButtons.append('text').text('Люди').attr('transform', `translate(${lWidth * (1 - rel)}, ${btnPanelBL})`).attr('cursor', 'pointer').on('click', () => peopleClick());

let currentMode = 0;

function mapClick(long) {
  if (currentMode == 2) return;
  lowSVG.selectAll('.regText').attr('visibility', 'hidden');
  layer1.setAttribute('visibility', 'hidden');
  transitionDuration = long ? 5000 : 1000;
  upSVGButtons.select('#selRect').transition().duration(transitionDuration).attr('x', (lWidth - btnPanelW) / 2);
  drawRegions(lowSVGG);
  drawBloodStationsSemaphores(upSVGG);
  toggleSemaphores(upSVGG, 1);
  webglEnabled = false;
  webglCanvas.style.display = 'none';
  currentMode = 0;
}

function centersClick(long) {
  transitionDuration = long ? 5000 : 1000;
  lowSVG.selectAll('.regText').transition().delay(currentMode == 2 ? 100 : transitionDuration).duration(1).attr('visibility', 'visible');
  layer1.setAttribute('visibility', 'hidden');
  upSVGButtons.select('#selRect').transition().duration(currentMode == 2 ? 100 : transitionDuration).attr('x', (lWidth - btnPanelW) / 2 + btnPanelW / 3);
  drawRegionsCircles(lowSVGG);
  toggleSemaphores(upSVGG, 1);
  drawBloodStationsCirclesSemaphores(upSVG);
  webglCanvas.style.display = 'none';
  webglEnabled = false;
  currentMode = 1;
}

function peopleClick(long) {
  if (currentMode == 0) return;
  lowSVG.selectAll('.regText').transition().delay(currentMode == 2 ? 100 : transitionDuration).duration(1).attr('visibility', 'visible');
  layer1.setAttribute('visibility', 'hidden');
  transitionDuration = long ? 5000 : 1000;
  upSVGButtons.select('#selRect').transition().duration(100).attr('x', (lWidth - btnPanelW) / 2 + 2 * btnPanelW / 3);
  toggleSemaphores(upSVGG, 0);
  webglEnabled = true;
  webglNeedsUpdate = true;
  webglCanvas.style.display = 'block';
  currentMode = 2;
}

const semaphoreBlood = [
  ['I', '+'],
  ['II', '+'],
  ['III', '+'],
  ['IV', '+'],
  ['I', '-'],
  ['II', '-'],
  ['III', '-'],
  ['IV', '-'],
];

function updatePanel(stationNo) {
  const station = bloodStationsData[stationNo];
  const { semaphore, r1 } = station;
  // rightPanel.style.display = 'block';
  let html = `<div style="font-size: 25px; margin-top: 0px; margin-bottom: 15px">Пункт сдачи крови №${stationNo}</div>`;
  semaphoreBlood.forEach(([num, resus]) => {
    const numNo = {'I': 0, 'II': 1, 'III': 2, 'IV': 3}[num];
    const resusNo = {'+': 0, '-': 1}[resus];
    const color = bloodColors[numNo][resusNo];
    html += `<div style="text-baseline: middle; line-height: 2; height: 50px;"><div style="text-align: right; padding-right: 15px; display: inline-block; width: 70px; font-size: 25px; color: ${color}">
      ${num}${resus == '+' ? '+' : '−'}
    </div>`;
    html += `<div style="display: inline-block; font-size: 25px; margin-top: 15px">`
    if (semaphore[numNo][resusNo]) {
      html += `<input type="button" value="Нужна кровь. Записаться на сдачу" style="width: 300px; cursor: pointer; background: blue; display: inline-block; padding: 5px; font-weight: bold; color: white; border: none; border-radius: 5px">`;
    } else {
      html += `<input type="button" value="Узнать, когда можно сдавать кровь" style="width: 300px; cursor: pointer; background: gray; display: inline-block; padding: 5px; font-weight: bold; color: white; border: none; border-radius: 5px">`;
    }
    html += `</div></div>`;
  });
  html += '<div style="margin-left: 85px">';
  if (Math.random() > 0.5) {
    html += `<input type="button" value="Не знаете свою группу крови? Вы все равно можете сдать кровь здесь" style="margin-top: 30px; width: 300px; cursor: pointer; white-space: normal; background: green; display: block; padding: 5px; font-weight: bold; color: white; border: none; border-radius: 5px">`;
  }
  html += '</div>';
  html += '<div style="margin-left: 85px">';
  html += `<input type="button" value="Задать вопрос на форуме" style="margin-top: 30px; width: 300px; cursor: pointer; background: green; display: block; padding: 5px; font-weight: bold; color: white; border: none; border-radius: 5px">`;
  html += '<div style="margin: 10px; font-size: 15px; color: lightgreen">';
  html += `Вступайте в сообщество доноров центра сдачи крови №${stationNo}. Нас уже ${Math.round(r1 * r1)}!`;
  html += '</div>';
  html += '</div>';
  html += '<div style="margin-left: 85px">';
  html += `<input type="button" value="Сообщить о неточности" style="margin-top: 60px; width: 300px; cursor: pointer; background: gray; display: inline-block; padding: 5px; font-weight: bold; color: white; border: none; border-radius: 5px">`;
  html += '</div>';
  rightPanel.innerHTML = html;
}

addLayer(lowSVG.node());
addLayer(webglCanvas);
addLayer(upSVG.node());
root.appendChild(rightPanel);

const regl = createREGL(webglCanvas);

let transform = d3.zoomIdentity;

upSVG.call(d3.zoom().on('zoom', () => {
  transform = d3.event.transform;
  webglNeedsUpdate = true;
}));

window.addEventListener('load', () => {
  loaded();
});
