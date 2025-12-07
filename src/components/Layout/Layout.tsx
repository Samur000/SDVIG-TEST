import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  headerRight?: ReactNode;
}

export function Layout({ 
  children, 
  title, 
  subtitle,
  showHeader = true,
  headerRight
}: LayoutProps) {
  return (
    <div className="layout">
      {showHeader && (
        <header className="header">
          <div className="header-content">
            {title ? (
              <div className="header-title-section">
                <h1 className="header-title">{title}</h1>
                {subtitle && <p className="header-subtitle">{subtitle}</p>}
              </div>
            ) : (
              <span className="header-logo">СДВиГ</span>
            )}
            {headerRight && <div className="header-right">{headerRight}</div>}
          </div>
        </header>
      )}
      <main className="main">
        {children}
      </main>
      <Navigation />
    </div>
  );
}

