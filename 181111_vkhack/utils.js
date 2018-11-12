function loaded() {
  loadCount--;
  console.log(loadCount);
  if (loadCount == 0) {
    allLoaded();
  } else if (loadCount < 0) {
    console.log('loadCount < 0!!!');
  }
}

function circlePath(cx, cy, r, phi, n) {
  let res = [];
  for (let i=0; i<n; i++) {
    const a = phi + Math.PI * 2 * i / n;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    res.push(`${x},${y}`);
  }
  return 'M' + res.join('L') + 'Z';
}

function phyllotaxis(radius) {
  var theta = Math.PI * (3 - Math.sqrt(5));
  return function(i) {
    var r = radius * Math.sqrt(i), a = theta * i;
    return [
      width / 2 + r * Math.cos(a),
      height / 2 + r * Math.sin(a)
    ];
  };
}

const bloodOffColor = '#494949';
const bloodColors = [
  ['#2eb3c1', '#9fe1e9'], 
  ['#fe5252', '#d7776c'], 
  ['#ffdc47', '#f9fb81'], 
  ['#54ca36', '#abe59d'],
];

{
  const stats = [
    [40, 7], // I
    [34, 6], // II
    [8, 1], // III
    [3, 1], // IV
  ];
  const byNum = stats.map(R.sum);
  // console.log(R.sum(byNum));
  const relNum = byNum.map(R.multiply(1 / R.sum(byNum)));
  const angles = [];
  let a = 0;
  relNum.forEach(v => {
    const av = v * Math.PI * 2;
    angles.push([a, a + av]);
    a += av;
  });
  relResus = [1, 2, 3, 4].map(group => {
    const [pol, neg] = stats[group - 1];
    return neg / (pol + neg);
  });
  const radCoeff = 3.0;
  const innerRad = 30 * radCoeff;
  const outerRad = 100 * radCoeff;
  const gap = 10;
  /*
  const rads = [1, 2, 3, 4].map(group => {
    const r = relResus[group - 1];
    const thresh = innerRad + (outerRad - innerRad) * r;
    return [[innerRad, thresh - gap / 2], [thresh + gap / 2, outerRad]];
  });
  */
  const thresh = innerRad + (outerRad - innerRad) * 1 / 5;
  const rads = [[innerRad, thresh - gap / 2], [thresh + gap / 2, outerRad]];
  const inverseMargin = 0.0;

  function inverseGroup([x, y, r]) {
    r += inverseMargin;
    const dist = Math.sqrt(x * x + y * y);
    let resus = null;
    rads.forEach(([inner, outer], curResus) => {
      if (inner < dist - r && dist + r < outer) {
        resus = curResus;
      }
    });
    if (resus === null) {
      return null;
    }
    const angle = mod(Math.atan2(y, x) + Math.PI / 2, Math.PI * 2);
    const circleLen = 2 * Math.PI * dist;
    const angleRad = r / circleLen * 2 * Math.PI;
    let num = null;
    angles.forEach(([start, end], curNum) => {
      if (start < angle - angleRad && angle + angleRad < end) {
        num = curNum;
      }
    });
    if (num === null) {
      return null;
    }
    return [num, resus];
  }

  function semaphores(sel, data) {
    const s = sel.selectAll('.semaphore').data(data);
    const enter = s.enter().append('g').attr('class', 'semaphore');
    const arc = d3.arc()
      .cornerRadius(3)
      .padAngle(0.03);
    const transFun = ({cx, cy, r}) => `translate(${cx} ${cy}) scale(${r})`;
    [0, 1].forEach(resus => [1, 2, 3, 4].forEach(group => {
      const [startAngle, endAngle] = angles[group - 1];
      const [innerRadius, outerRadius] = rads[resus];
      const d = arc({
        innerRadius: innerRadius,
        outerRadius: outerRadius,
        startAngle,
        endAngle,
      });
      let color = bloodColors[group - 1][1 - resus];
      enter.append('path')
        .attr('fill', ({semaphore}) => semaphore[group - 1][resus] ? color : bloodOffColor)
        .attr('stroke', ({semaphore}) => semaphore[group - 1][resus] ? color : bloodOffColor)
        .attr('stroke-width', 5)
        .attr('d', d);
    }));
    enter.attr('transform', transFun);
    enter.on('mouseover', ({no}) => {
      updatePanel(no);
      showLegend(no);
    });
    s.transition().duration(transitionDuration).attr('transform', transFun);
  }
}

function random() {
  return (Math.random() - 0.5) * 2;
}