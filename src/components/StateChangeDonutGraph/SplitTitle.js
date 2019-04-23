import React from 'react';
import './_SplitTitle.scss';

export default function SplitTitle({
  title,
  firstSelected,
  onSelect = () => {},
}) {
  if (!title) {
    return null;
  }
  const [first, second] = title.split('::');

  if (!second) {
    return <div className="split-title">{title}</div>;
  }

  return (
    <div className="split-title">
      <button
        className={(firstSelected && 'is-selected') || ''}
        onClick={() => onSelect(true)}
      >
        {first}
      </button>
      <button
        className={(!firstSelected && 'is-selected') || ''}
        onClick={() => onSelect(false)}
      >
        {second}
      </button>
    </div>
  );
}
