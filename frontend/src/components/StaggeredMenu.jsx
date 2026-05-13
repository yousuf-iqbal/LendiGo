import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import FlowingMenu from './FlowingMenu';
import './StaggeredMenu.css';

export default function StaggeredMenu({
  items = [],
  position = 'right',
  colors = ['#F4A020', '#800020', '#5C0018'],
  accentColor = '#F4A020',
  menuButtonColor = '#6B4C3B',
  openMenuButtonColor = '#FDF6EC',
  onMenuOpen,
  onMenuClose,
}) {
  const [open, setOpen] = useState(false);
  const [textLines, setTextLines] = useState(['Menu', 'Close']);
  const openRef = useRef(false);
  const panelRef = useRef(null);
  const preLayersRef = useRef(null);
  const preLayerElsRef = useRef([]);
  const plusHRef = useRef(null);
  const plusVRef = useRef(null);
  const iconRef = useRef(null);
  const textInnerRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const openTlRef = useRef(null);
  const closeTweenRef = useRef(null);
  const spinTweenRef = useRef(null);
  const textTweenRef = useRef(null);
  const colorTweenRef = useRef(null);
  const busyRef = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      const preLayers = preContainer
        ? Array.from(preContainer.querySelectorAll('.sm-prelayer'))
        : [];
      preLayerElsRef.current = preLayers;

      gsap.set([panel, ...preLayers], { xPercent: position === 'left' ? -100 : 100, opacity: 1 });
      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(textInner, { yPercent: 0 });
      gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });

    return () => ctx.revert();
  }, [menuButtonColor, position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.fm-menu__item'));
    const offscreen = position === 'left' ? -100 : 100;
    const tl = gsap.timeline({ paused: true });

    gsap.set([panel, ...layers], { visibility: 'visible' });

    layers.forEach((layer, index) => {
      tl.fromTo(
        layer,
        { xPercent: offscreen },
        { xPercent: 0, duration: 0.42, ease: 'power4.out' },
        index * 0.055
      );
    });

    const panelStart = (layers.length ? (layers.length - 1) * 0.055 : 0) + 0.06;
    tl.fromTo(
      panel,
      { xPercent: offscreen },
      { xPercent: 0, duration: 0.52, ease: 'power4.out' },
      panelStart
    );

    if (itemEls.length) {
      gsap.set(itemEls, { x: 18, opacity: 0, filter: 'blur(8px)' });
      tl.to(
        itemEls,
        { x: 0, opacity: 1, filter: 'blur(0)', duration: 0.52, ease: 'power3.out', stagger: 0.035 },
        panelStart + 0.12
      );
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const timeline = buildOpenTimeline();
    if (!timeline) {
      busyRef.current = false;
      return;
    }
    timeline.eventCallback('onComplete', () => {
      busyRef.current = false;
    });
    timeline.play(0);
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const offscreen = position === 'left' ? -100 : 100;
    const all = [...layers, panel];
    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.36,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        gsap.set(all, { visibility: 'hidden' });
        busyRef.current = false;
      },
    });
  }, [position]);

  const animateIcon = useCallback((opening) => {
    spinTweenRef.current?.kill();
    spinTweenRef.current = gsap.to(iconRef.current, {
      rotate: opening ? 225 : 0,
      duration: opening ? 0.75 : 0.35,
      ease: opening ? 'power4.out' : 'power3.inOut',
      overwrite: 'auto',
    });
  }, []);

  const animateColor = useCallback(
    (opening) => {
      colorTweenRef.current?.kill();
      colorTweenRef.current = gsap.to(toggleBtnRef.current, {
        color: opening ? openMenuButtonColor : menuButtonColor,
        delay: opening ? 0.14 : 0,
        duration: 0.25,
        ease: 'power2.out',
      });
    },
    [menuButtonColor, openMenuButtonColor]
  );

  const animateText = useCallback((opening) => {
    const current = opening ? 'Menu' : 'Close';
    const target = opening ? 'Close' : 'Menu';
    const sequence = [current, target, current, target, target];
    setTextLines(sequence);

    textTweenRef.current?.kill();
    gsap.set(textInnerRef.current, { yPercent: 0 });
    textTweenRef.current = gsap.to(textInnerRef.current, {
      yPercent: -80,
      duration: 0.62,
      ease: 'power4.out',
    });
  }, []);

  const closeMenu = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    onMenuClose?.();
    playClose();
    animateIcon(false);
    animateColor(false);
    animateText(false);
  }, [animateColor, animateIcon, animateText, onMenuClose, playClose]);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);

    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }

    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [animateColor, animateIcon, animateText, onMenuClose, onMenuOpen, playClose, playOpen]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeydown = (event) => {
      if (event.key === 'Escape') closeMenu();
    };

    document.addEventListener('keydown', handleKeydown);
    document.body.classList.add('sm-menu-open');
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.classList.remove('sm-menu-open');
    };
  }, [closeMenu, open]);

  /* Portal content -- rendered directly under document.body so that
     position:fixed children are never inside an ancestor with
     transform / backdrop-filter (which would break fixed positioning). */
  const portalContent = (
    <div className="sm-portal" data-open={open || undefined}>
      <div className="sm-screen" aria-hidden={!open} onClick={closeMenu} />

      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {colors.slice(0, 4).map((color) => (
          <div key={color} className="sm-prelayer" style={{ background: color }} />
        ))}
      </div>

      <aside
        id="staggered-menu-panel"
        ref={panelRef}
        className="staggered-menu-panel"
        aria-hidden={!open}
        data-position={position}
      >
        <div className="sm-panel-inner">
          <FlowingMenu
            items={items}
            speed={13}
            textColor="#FDF6EC"
            bgColor="#5C0018"
            marqueeBgColor="#F4A020"
            marqueeTextColor="#5C0018"
            borderColor="rgba(253, 246, 236, 0.18)"
            onNavigate={closeMenu}
          />
        </div>
      </aside>
    </div>
  );

  return (
    <div
      className="staggered-menu-wrapper"
      data-position={position}
      style={{ '--sm-accent': accentColor }}
    >
      <button
        ref={toggleBtnRef}
        className="sm-toggle"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="staggered-menu-panel"
        onClick={toggleMenu}
        type="button"
      >
        <span className="sm-toggle-textWrap" aria-hidden="true">
          <span ref={textInnerRef} className="sm-toggle-textInner">
            {textLines.map((line, index) => (
              <span className="sm-toggle-line" key={`${line}-${index}`}>
                {line}
              </span>
            ))}
          </span>
        </span>
        <span ref={iconRef} className="sm-icon" aria-hidden="true">
          <span ref={plusHRef} className="sm-icon-line" />
          <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
        </span>
      </button>

      {createPortal(portalContent, document.body)}
    </div>
  );
}