import React from 'react';
import './AppLayout.css';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`app-layout ${className}`}>
      {children}
    </div>
  );
};

export default AppLayout;
