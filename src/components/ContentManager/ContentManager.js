import React, { useRef, useEffect } from 'react';
import { createContentManager } from './createContentManager';

export default function ContentManager({
  contentHost,
  data = [],
  onChange = () => {},
  debounceWait = 650,
  formatExistingInput = true,
  title = 'Data Editor',
}) {
  const container = useRef(null);

  useEffect(() => {
    createContentManager({
      data,
      title,
      contentHost: container.current,
      onChange: next => onChange({ next }),
    });
  }, []);

  return <div className="content-manager" ref={container} />;
}
