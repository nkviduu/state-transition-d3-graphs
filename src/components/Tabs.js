import React, { useState } from 'react';

export function Tab({ isActive, label, onClick }) {
  const className = `tab-list-item ${isActive ? 'tab-list-item-active' : ''}`;

  return (
    <li 
      className={className} 
      onClick={() => onClick(label)}>{label}</li>
  );
}

export function Tabs({ children }) {
  const [activeTab, setActiveTab] = useState(children[0].props.label);

  return (
    <div className="tabs">
      <ol className="tab-list">
        {children.map((child) => {
          const { label } = child.props;
          return (
            <Tab 
              label={label}
              isActive={label === activeTab} 
              onClick={setActiveTab} 
              key={label} 
              />
          )
        })}
      </ol>
      <div className="tab-content">
        {children.map((child) => {
          if (child.props.label === activeTab) return child.props.children
        })}
      </div>
    </div>
  )
}
