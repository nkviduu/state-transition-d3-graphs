// import { useState, useCallback, Component } from 'react';
import { select } from 'd3-selection';
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleBand, scaleOrdinal, scaleLinear } from 'd3-scale';
import { stack, stackOffsetDiverging } from 'd3-shape';
import { format as d3format } from 'd3-format';
import 'd3-transition';
import 'd3-selection-multi';

/**
 * convert current and next datasets containing
 * name(string) value(string) pairs into
 * single dataset of objects with properties:
 * name: string
 * current: number
 * next: number
 * diff: number
 * buy: number
 * sel: number
 */
export function processData(data) {
  const current = [...data.current];
  const next = [...data.next];
  const nextHash = next.reduce(
    (acc, [name, value]) => ({ ...acc, [name]: name }),
    {},
  );

  let tbl = current.reduce((acc, [name, value]) => {
    if (nextHash[name] === undefined) {
      next.push([name, 0]);
    }
    return { ...acc, [name]: [toNumber(value), 0] };
  }, {});

  tbl = next.reduce((acc, [name, value]) => {
    const [curr = 0] = acc[name] || [];
    const next = toNumber(value);
    const diff = next - curr;
    const sell = diff < 0 ? diff : 0;
    const buy = diff > 0 ? diff : 0;
    const unchanged = diff < 0 ? curr + diff : curr;

    return { ...acc, [name]: { curr, next, diff, sell, unchanged, buy } };
  }, tbl);

  tbl = Object.keys(tbl).map(name => ({ name, ...tbl[name] }));
  return tbl;

  function toNumber(value) {
    return typeof value === 'number'
      ? value
      : +('' + value).replace(/[^0-9]/g, '');
  }
}

const baseMargin = { top: 20, right: 20, bottom: 80, left: 70 };
export function createChangeGraph(
  containerOrPath,
  {
    data,
    colorList = ['#57a3bf9e', '#a97130', '#27556b', '#a5d6f5'],
    transitionDuration = 800,
    returnTransitionDuration = 350,
    initialType = 'curr',
    margin: propsMargin = {},
  },
) {
  const svg = select(containerOrPath);
  let xScale, yScale;

  const width = +svg.attr('width') || 600;
  const height = +svg.attr('height') || 600;
  const mFormat = d3format('.2s');
  const margin = { ...baseMargin, ...propsMargin };

  const { graph, w, h } = getGraphArea(svg, width, height, margin);

  const createStack = stack()
    .keys(['sell', 'unchanged', 'buy'])
    .offset(stackOffsetDiverging);

  const colors = scaleOrdinal(colorList).domain([
    'curr',
    'sell',
    'unchanged',
    'buy',
  ]);

  xScale = scaleBand()
    .paddingInner(0.2)
    .paddingOuter(0.2);

  yScale = scaleLinear();

  const xAxis = svg
    .append('g')
    .attr('class', 'xAxis')
    .attr('transform', `translate(${margin.left}, ${margin.top + h + 10})`);

  const yAxis = svg
    .append('g')
    .attr('class', 'yAxis')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  updateScale(data);

  function updateScale(data) {
    xScale.domain(data.map(el => el.name)).range([0, w]);
    yScale = yScale.domain(getDomain(data)).range([h, 0]);

    function getDomain(data) {
      const arr = data.reduce(
        (acc, { curr, next, sell }) => [...acc, curr, next, sell],
        [],
      );
      return [Math.min.apply(null, arr), Math.max.apply(null, arr)];
    }
  }

  formatXAxis(xAxis, xScale, data);
  formatYAxis(yAxis, yScale, data);

  graph.append('g').attr('class', 'curr');

  let grSeries = graph.append('g').attr('class', 'series');

  let prevData = data;

  if (data) {
    setBars({ data, type: initialType });
    updateStacks({ type: initialType });
  }

  return {
    update(options) {
      if (options.data && options.data !== prevData) {
        updateScale(options.data);
        prevData = options.prevData;
      }
      formatYAxis(yAxis, yScale);
      formatXAxis(xAxis, xScale, data, options.type === 'curr');
      updateStacks(options);
      setBars(options);
    },
  };

  function updateStacks({ data = prevData, type = '' } = {}) {
    prevData = data;
    const updates = {
      x: d => xScale(d.data.name),
      y: d => yScale(d[1]),
      height: d => yScale(d[0]) - yScale(d[1]),
      width: xScale.bandwidth(),
    };

    const series = grSeries
      .selectAll('g')
      .data(
        type === 'curr'
          ? createStack(selectOnly('curr', data))
          : createStack(data),
      );

    series
      .enter()
      .append('g')
      .attr('class', d => 'cls_' + d.key)
      .style('fill', d => colors(d.key))
      .merge(series)
      .selectAll('rect')
      .data(d => d)
      .join(
        enter => enter.append('rect').attrs(updates),
        update =>
          update
            .transition()
            .duration(() => {
              return type === 'curr'
                ? returnTransitionDuration
                : transitionDuration;
            })
            .delay(function(d, i) {
              if (type === 'curr') {
                return 0;
              }
              const delay = this.parentNode.classList.contains('cls_buy')
                ? transitionDuration * 0.8
                : 0;
              return delay;
            })
            .attrs(updates),
      );
  }

  function formatXAxis(xAxis, xScale, data, onlyCurrent) {
    xAxis.call(
      axisBottom(xScale)
        .tickSizeOuter(0)
        .tickSizeInner(0)
        .tickFormat((el, i) => {
          return `${el}\n${formatXTickLabel(data, i)}`;
        }),
    );

    xAxis.selectAll('.tick text').call(wrapPre, colors);
    xAxis.select('.domain').style('opacity', 0);

    function formatXTickLabel(data, i) {
      const { curr, sell, buy, next } = data[i];
      const fCurrent = mFormat(curr);
      if (onlyCurrent) {
        return mFormat(curr);
      }
      const fDiff = mFormat(buy - sell);
      const fNext = mFormat(next);
      const action = sell < 0 ? 'sell' : buy > 0 ? 'buy' : '';

      return action
        ? `current: ${fCurrent}\n→ ${action}: ${fDiff}\nnew: ${fNext}`
        : `no changes: ${fCurrent}`;
    }
  }

  function formatYAxis(yAxis, yScale) {
    yAxis
      .transition()
      .duration(transitionDuration)
      .call(selection => {
        axisLeft(yScale)
          .ticks(6, 's')
          .tickSizeOuter(0)(selection);
        selection.select('.domain').style('opacity', 0.01);
        selection
          .selectAll('.tick line')
          .attr('stroke-opacity', d => (d === 0 ? 0.4 : 0.05))
          .attr('x2', d => w);
      });
  }

  function setBars(
    {
      data = prevData,
      styles = {
        'stroke-width': '1px',
        stroke: '#ccc',
        'stroke-dasharray': 4,
        fill: '#eee',
      },
    },
    type = 'curr',
  ) {
    graph
      .select('g.' + type)
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attrs({
        ...styles,
        x: d => xScale(d.name),
        y: d => yScale(d[type]),
        width: xScale.bandwidth(),
        height: d => yScale(0) - yScale(d[type]),
      });
  }

  function selectOnly(type = 'curr', data) {
    return data.map(el => ({
      name: el.name,
      sell: 0,
      unchanged: el[type],
      buy: 0,
    }));
  }
}

function getGraphArea(container, width, height, { left, right, top, bottom }) {
  const w = width - left - right;
  const h = height - top - bottom;

  const graph = container
    .append('g')
    .attr('transform', 'translate(' + left + ',' + top + ')');

  return { graph, w, h };
}

function wrapPre(text, colors) {
  text.each(function() {
    var text = select(this),
      lines = text.text().split(/\n/),
      lineHeight = 1.1, // ems
      y = text.attr('y'),
      dy = parseFloat(text.attr('dy')),
      tspan = text.text(null);
    lines.forEach((line, index) => {
      tspan
        .append('tspan')
        .attr('x', 0)
        .attr('y', y)
        .attr('dy', index * lineHeight + dy + (index > 0 ? 0.2 : 0) + 'em')
        .text(line)
        .style('color', index ? getColor(line) : '')
        .style('font-weight', !index ? 'bold' : '');
    });
  });

  function getColor(txt) {
    // if (/sell/.test(txt)) {
    //   return colors('sell');
    // }
    if (/buy|sell/.test(txt)) {
      return 'black';
    }
    return '#777';
  }
}
