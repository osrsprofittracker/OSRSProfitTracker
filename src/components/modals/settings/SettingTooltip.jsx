import { useState } from 'react';

export default function SettingTooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="setting-tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && <div className="tooltip setting-tooltip">{text}</div>}
    </span>
  );
}
