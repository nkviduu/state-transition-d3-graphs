import { select, event as d3event } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { arc, pie } from 'd3-shape';
import { interpolate, quantize } from 'd3-interpolate';
import { format as d3format } from 'd3-format';
import 'd3-transition';
import 'd3-selection-multi';

/**
 *
 * @param {Object} options
 * @param { [string, (string | number)][] } options.data - array of name, value pairs
 * @param { string | HTMLElement } options.displayIn - container for svg
 * @param { number } [width=300]
 * @param { number } [height=300]
 * @param { [string, string] } [colors=['#17b3f7', '#fbfeff']] - start and end colors to be interpolated for data
 * @param { number } transitionDuration - update duration for transition
 *
 * @returns { function } createPieGraph~update
 */
export default function createDonutStateChangeGraph({
  data,
  displayIn,
  width = 300,
  height = 300,
  colors: [start = '#17b3f7', end = '#fbfeff'] = [],
  transitionDuration = 1500,
}) {
  let prev_data, dataset;

  let svg, donut, legend, tooltip; // graphics containers
  let colorScale;

  const donutArc = arc();
  const labelArc = arc();
  const donutPie = pie()
    .value(d => (d.enabled ? d.count : 0))
    .sort(null);

  const size = 300;
  let radius = size / 2.6;

  initContainers();
  update({ data, width, height });

  return update;

  function update({ data, width, height }) {
    if (width || height) {
      svg.styles({ width, height });
    }
    if (!data || data === prev_data) {
      return;
    }
    dataset = prepDataset(data);
    upateColorScale(start, end, dataset);
    updateSlices();
    updateLegend();
    prev_data = data;
  }

  function initContainers() {
    svg = select(displayIn);

    const node = svg.node();
    if (!node || node.nodeName !== 'svg') {
      svg = svg.append('svg');
    }
    svg.attr('viewBox', `0 0 300 300`); //.attrs({ width, height });

    const style = document.createElement('style');
    const defs = document.createElement('defs');
    svg.node().appendChild(defs);
    defs.appendChild(style);

    const css = `
      .state-change-donut-graph svg {
        shape-rendering: geometricprecision;
      }
      .state-change-donut-graph text {
        font-size: 12px;
        font-family: Arial;
      }
      
      .state-change-donut-graph rect {
        stroke-width: 2;
        cursor: pointer;
      }
      
      .state-change-donut-graph .tooltip {
        font-family: Arial;
        background: #eee;
        box-shadow: 0 0 5px #999999;
        color: #333;
        display: none;
        font-size: 12px;
        left: 130px;
        padding: 10px;
        position: absolute;
        text-align: center;
        top: 95px;
        width: 80px;
        z-index: 10;
      }
    `;
    style.appendChild(document.createTextNode(css));

    donut = svg
      .append('g')
      .attr('class', 'donut-container')
      .attr('transform', `translate(${size / 2}, ${size / 2})`);
    legend = svg.append('g').attr('class', 'legend');

    tooltip = createTooltip();
  }

  function upateColorScale(start, end, dataset) {
    const colorList = getColorList(start, end, dataset.length + 1);
    colorScale = scaleOrdinal()
      .domain(dataset.map(d => d.label))
      .range(colorList);
  }

  function updateSlices() {
    donutArc.innerRadius(radius * 0.7).outerRadius(radius - 10);
    labelArc.outerRadius(radius * 1.2).innerRadius(radius);

    dataset.forEach(item => {
      if (typeof item.enabled === 'undefined') {
        item.enabled = true;
      }
    });

    const total = dataset
      .map(d => (d.enabled ? d.count : 0))
      .reduce((acc, val) => acc + val, 0);

    let g = donut.selectAll('.arc').data(donutPie(dataset));

    const newG = g
      .enter()
      .append('g')
      .attr('class', 'arc');

    const newPath = newG
      .append('path')
      .on('mouseover', tooltip.show)
      .on('mouseout', tooltip.hide)
      .on('mousemove', tooltip.pos)
      .each(function() {
        this._current = { startAngle: 0, endAngle: 0 };
      });

    newG
      .append('text')
      .attrs({
        class: 'lbl',
        dy: '.5em',
        'text-anchor': 'middle',
      })
      .style('opacity', 0);

    g.exit().remove();

    g.select('path')
      .merge(newPath)
      .attr('fill', (d, i) => colorScale(d.data.label))
      .transition()
      .duration(transitionDuration)
      .attrTween('d', function(d) {
        const interpolateArc = interpolate(this._current, d);
        this._current = d;
        return function(t) {
          return donutArc(interpolateArc(t));
        };
      })
      .on('end', updateLegend);

    g.merge(newG)
      .select('.lbl')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .text(d => `${toPercent(d.data.count / total)}`)
      .style('opacity', 0)
      .transition()
      .duration(transitionDuration * 2)
      .style('opacity', 1);
  }

  function updateLegend({
    itemSize = 18,
    spacing = 10,
    maxLabelLength = 16,
  } = {}) {
    const itemHeight = itemSize + spacing;

    const offset = (size - itemHeight * dataset.length) / 2;
    const horz = 0; // -3 * size;
    const legendItems = legend.selectAll('.legend-items').data(dataset);

    const newItems = legendItems
      .enter()
      .append('g')
      .attr('class', 'legend-items')
      .on('click', highlightItem)
      .style('opacity', 0);

    newItems.append('rect').attrs({
      width: itemSize,
      height: itemSize,
      fill: d => colorScale(d.label),
      stroke: 'white',
    });

    newItems.append('text');

    newItems
      .merge(legendItems)
      .select('text')
      .attrs({ x: itemHeight, y: itemSize * 0.7 })
      .text(d => truncateWithEllipses(d.label, maxLabelLength));

    const legendWidth = legend.node().getBBox().width;

    legend.attr(
      'transform',
      `translate(${(size - legendWidth) / 2}, ${offset})`,
    );
    newItems
      .merge(legendItems)
      .transition()
      .duration(700)
      .delay((d, i) => i * 50)
      .style('opacity', 1)
      .attr('transform', (d, i) => `translate(${horz}, ${i * itemHeight})`);

    legend.exit().remove();

    function highlightItem(labelObj) {}
  }

  function createTooltip() {
    const tooltip = select(displayIn)
      .append('div')
      .attr('class', 'tooltip');
    const labelDiv = tooltip.append('div').attr('class', 'label');
    const countDiv = tooltip.append('div').attr('class', 'count');
    const percentDiv = tooltip.append('div').attr('class', 'percent');

    return {
      show({ data: { label, count } }) {
        const total = dataset.reduce(
          (acc, { enabled, count }) => acc + (enabled ? count : 0),
          0,
        );
        const percent = Math.round((1000 * count) / total) / 10;
        labelDiv.html(label);
        countDiv.html(d3format('.2s')(count));
        percentDiv.html(`${percent}%`);
        tooltip.style('display', 'block');
      },
      hide() {
        tooltip.style('display', 'none');
      },
      pos() {
        const { layerX, layerY } = d3event;
        tooltip
          .style('top', `${layerY + 10}px`)
          .style('left', `${layerX + 10}px`);
      },
    };
  }

  function getColorList(start, end, len) {
    return quantize(interpolate(start, end), len);
  }
}
/**
 *
 * @param { [string, (string | number)][]} dataset - an array of label and value pairs
 *
 * @returns { {string, (string | number), number }[]} { label, val, count }[]
 */
function prepDataset(dataset) {
  return dataset
    .map(([label, val]) => ({ label, val, count: toNumber(val) }))
    .filter(({ label, count }) => label && count);

  function toNumber(v) {
    if (typeof v === 'number') {
      return v;
    }
    return +v.replace(/[^0-9]/g, '');
  }
}

function toPercent(v, fraction = 1) {
  const multiplyer = fraction * 10 || 1;
  const n = Math.round(100 * multiplyer * v) / multiplyer;
  return `${n}%`;
}

function truncateWithEllipses(text, max) {
  return text.substr(0, max - 1) + (text.length > max ? '...' : '');
}
