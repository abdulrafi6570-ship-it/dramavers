import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import './BubbleMenu.css';

export default function BubbleMenu({
  logo,
  hideLogo = false,
  onMenuClick,
  className,
  style,
  menuAriaLabel = 'Toggle menu',
  menuBg = 'rgba(0,0,0,0.85)',
  menuContentColor = '#fff',
  useFixedPosition = false,
  items = [],
  animationEase = 'back.out(1.5)',
  animationDuration = 0.4,
  staggerDelay = 0.1
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayRef = useRef(null);
  const bubblesRef = useRef([]);
  const labelRefs = useRef([]);

  const containerClassName = [
    'bm-nav',
    useFixedPosition ? 'bm-fixed' : 'bm-absolute',
    hideLogo ? 'bm-logo-hidden' : '',
    className
  ].filter(Boolean).join(' ');

  const handleToggle = () => {
    const nextState = !isMenuOpen;
    if (nextState) setShowOverlay(true);
    setIsMenuOpen(nextState);
    onMenuClick?.(nextState);
  };

  const handleItemClick = (item, e) => {
    e.preventDefault();
    setIsMenuOpen(false);
    item.onClick?.();
  };

  useEffect(() => {
    const overlay = overlayRef.current;
    const bubbles = bubblesRef.current.filter(Boolean);
    const labels = labelRefs.current.filter(Boolean);
    if (!overlay || !bubbles.length) return;

    if (isMenuOpen) {
      gsap.set(overlay, { display: 'flex' });
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.set(bubbles, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(labels, { y: 24, autoAlpha: 0 });
      bubbles.forEach((bubble, i) => {
        const delay = i * staggerDelay + gsap.utils.random(-0.04, 0.04);
        const tl = gsap.timeline({ delay });
        tl.to(bubble, { scale: 1, duration: animationDuration, ease: animationEase });
        if (labels[i]) {
          tl.to(labels[i], { y: 0, autoAlpha: 1, duration: animationDuration, ease: 'power3.out' }, `-=${animationDuration * 0.9}`);
        }
      });
    } else if (showOverlay) {
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.to(labels, { y: 24, autoAlpha: 0, duration: 0.15, ease: 'power3.in' });
      gsap.to(bubbles, {
        scale: 0, duration: 0.15, ease: 'power3.in',
        onComplete: () => { gsap.set(overlay, { display: 'none' }); setShowOverlay(false); }
      });
    }
  }, [isMenuOpen, showOverlay, animationEase, animationDuration, staggerDelay]);

  return (
    <>
      <nav className={containerClassName} style={style} aria-label="Navigation">
        {!hideLogo && (
          <div className="bm-bubble bm-logo" style={{ background: menuBg }}>
            <span className="bm-logo-content">
              {typeof logo === 'string' ? <img src={logo} alt="Logo" className="bm-logo-img" /> : logo}
            </span>
          </div>
        )}
        <button
          type="button"
          className={`bm-bubble bm-toggle ${isMenuOpen ? 'open' : ''}`}
          onClick={handleToggle}
          aria-label={menuAriaLabel}
          aria-pressed={isMenuOpen}
          style={{ background: menuBg }}
        >
          <span className="bm-line" style={{ background: menuContentColor }} />
          <span className="bm-line bm-line-short" style={{ background: menuContentColor }} />
        </button>
      </nav>
      {showOverlay && (
        <div
          ref={overlayRef}
          className={`bm-overlay ${useFixedPosition ? 'bm-fixed' : 'bm-absolute'}`}
          aria-hidden={!isMenuOpen}
          onClick={(e) => { if (e.target === e.currentTarget) setIsMenuOpen(false); }}
        >
          <ul className="bm-pill-list" role="menu">
            {items.map((item, idx) => (
              <li key={idx} role="none" className="bm-pill-col">
                <a
                  role="menuitem"
                  href={item.href || '#'}
                  aria-label={item.ariaLabel || item.label}
                  className="bm-pill-link"
                  style={{
                    '--item-rot': `${item.rotation ?? 0}deg`,
                    '--pill-bg': menuBg,
                    '--pill-color': menuContentColor,
                    '--hover-bg': item.hoverStyles?.bgColor || 'rgba(255,255,255,0.12)',
                    '--hover-color': item.hoverStyles?.textColor || '#fff'
                  }}
                  onClick={(e) => handleItemClick(item, e)}
                  ref={el => { if (el) bubblesRef.current[idx] = el; }}
                >
                  {item.icon && <span className="bm-pill-icon">{item.icon}</span>}
                  <span className="bm-pill-label" ref={el => { if (el) labelRefs.current[idx] = el; }}>
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
