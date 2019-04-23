import React, { useEffect, useRef } from 'react';
import createGraph from './state-change-donut-graph';
import SplitTitle from './SplitTitle';

export default function StateChageDonutGraph({
  displayIn,
  title,
  data,
  width,
  height,
  colors,
  transitionDuration,
  className,
  onSelect,
  firstSelected,
}) {
  const graphContainer = useRef(null);
  const updateFn = useRef();

  useEffect(() => {
    const displayIn = graphContainer.current;
    if (updateFn.current) {
      updateFn.current({ data });
      return;
    }
    updateFn.current = createGraph({
      data,
      displayIn,
      width: '100%',
      height: '100%',
      colors,
      transitionDuration,
    });
  });

  return (
    <div>
      <SplitTitle
        title={title}
        onSelect={onSelect}
        firstSelected={firstSelected}
      />
      <div
        ref={graphContainer}
        className={'state-change-donut-graph ' + (className || '')}
        style={{ width, height: height || width }}
      />
    </div>
  );
}
