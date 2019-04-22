import React, { useRef, useEffect } from 'react';
import { createContentManager } from '../dom-components/createContentManager';

export default function ContentManager({
  contentHost,
  data = [],
  onChange = () => {},
  debounceWait = 350,
  formatExistingInput = true,
  title = 'Data Editor',
}) {
  const container = useRef(null);

  useEffect(() => {
    console.log('setting up content manager', { title, data });

    createContentManager({
      data,
      title,
      contentHost: container.current,
      onChange: next => onChange({ next }),
    });
  }, []);

  return <div className="content-manager" ref={container} />;
}
