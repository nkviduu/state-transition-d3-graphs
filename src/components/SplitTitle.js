import React from 'react';

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
        onClick={() => (console.log('select'), onSelect(true))}
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
