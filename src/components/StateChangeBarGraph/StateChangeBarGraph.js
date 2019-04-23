import React, { useEffect, useRef } from 'react';
import {
  createChangeGraph,
  processData,
} from './state-change-bar-graph';
import SplitTitle from './SplitTitle';

export default function StateChageGraph({
  title,
  width = 600,
  height = 400,
  margin,
  data,
  type,
  firstSelected,
  onSelect,
  className = '',
}) {
  const svg = useRef(null);
  const updateFn = useRef();

  function checkData(data) {
    if (data.current) {
      return processData(data);
    }
    return data;
  }

  useEffect(() => {
    if (!updateFn.current) {
      updateFn.current = createChangeGraph(svg.current, {
        data: checkData(data),
        initialType: type,
        margin,
        width,
        height,
      });
    } else {
      updateFn.current.update({ data: checkData(data), type });
    }
  }, [data, type]);

  const viewBox = `0 0 ${width} ${height}`;

  return (
    <div>
      <SplitTitle
        title={title}
        firstSelected={firstSelected}
        onSelect={onSelect}
      />
      <svg 
        viewBox={viewBox} 
        style={{ width: '100%', height: '100%' }} 
        width={width} 
        height={height} 
        ref={svg} />
    </div>
  );
}
