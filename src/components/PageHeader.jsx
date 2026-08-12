import React from 'react';

const PageHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="page-header">
    <div className="page-header-text">
      <h1>
        {Icon && <Icon size={26} className="text-primary" />}
        {title}
      </h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {action && <div className="page-header-action">{action}</div>}
  </div>
);

export default PageHeader;
