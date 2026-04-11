import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import StorefrontUtil from '../utils/StorefrontUtil';

function PageIntro({
  title = '',
  eyebrow = '',
  breadcrumbs = [],
  showBanner = true
}) {
  const normalizedBreadcrumbs = StorefrontUtil.buildBreadcrumbs(breadcrumbs);

  useEffect(() => {
    const fallbackTitle = normalizedBreadcrumbs[normalizedBreadcrumbs.length - 1]?.label || '';
    StorefrontUtil.setDocumentTitle(title || fallbackTitle);
  }, [normalizedBreadcrumbs, title]);

  return (
    <div className="page-intro">
      {normalizedBreadcrumbs.length > 0 ? (
        <nav className="page-breadcrumbs" aria-label="Breadcrumb">
          {normalizedBreadcrumbs.map((item, index) => {
            const isLast = index === normalizedBreadcrumbs.length - 1;

            return (
              <span key={`${item.label}-${index}`} className="page-breadcrumbs__item">
                {item.to && !isLast ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
                {!isLast ? <i>/</i> : null}
              </span>
            );
          })}
        </nav>
      ) : null}

      {showBanner && title ? (
        <section className="page-banner page-banner--compact">
          {eyebrow ? <span className="section-heading__eyebrow">{eyebrow}</span> : null}
          <h1>{title}</h1>
        </section>
      ) : null}
    </div>
  );
}

export default PageIntro;
