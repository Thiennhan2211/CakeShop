import React, { useEffect, useState } from 'react';

const SCROLL_THRESHOLD = 240;

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.5 4.5 12l1.41 1.41 5.09-5.08V20h2V8.33l5.09 5.08L19.5 12 12 4.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ScrollTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateVisibility);
    };
  }, []);

  return (
    <button
      type="button"
      className={`scroll-top-button ${isVisible ? 'is-visible' : ''}`.trim()}
      aria-label="L\u00ean \u0111\u1EA7u trang"
      tabIndex={isVisible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUpIcon />
    </button>
  );
}

export default ScrollTopButton;
