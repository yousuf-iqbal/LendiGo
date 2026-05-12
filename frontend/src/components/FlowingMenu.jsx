import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import './FlowingMenu.css';

function distanceSquared(x, y, x2, y2) {
  const xDiff = x - x2;
  const yDiff = y - y2;
  return xDiff * xDiff + yDiff * yDiff;
}

function closestVerticalEdge(mouseX, mouseY, width, height) {
  const topEdge = distanceSquared(mouseX, mouseY, width / 2, 0);
  const bottomEdge = distanceSquared(mouseX, mouseY, width / 2, height);
  return topEdge < bottomEdge ? 'top' : 'bottom';
}

function MenuItem({
  link,
  text,
  image,
  eyebrow,
  action,
  speed,
  textColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
  onNavigate,
}) {
  const itemRef = useRef(null);
  const marqueeRef = useRef(null);
  const marqueeInnerRef = useRef(null);
  const animationRef = useRef(null);
  const [repetitions, setRepetitions] = useState(4);

  useEffect(() => {
    const calculateRepetitions = () => {
      if (!marqueeInnerRef.current) return;
      const firstPart = marqueeInnerRef.current.querySelector('.fm-marquee__part');
      if (!firstPart) return;
      const contentWidth = firstPart.offsetWidth || 1;
      setRepetitions(Math.max(4, Math.ceil(window.innerWidth / contentWidth) + 2));
    };

    calculateRepetitions();
    window.addEventListener('resize', calculateRepetitions);
    return () => window.removeEventListener('resize', calculateRepetitions);
  }, [image, text]);

  useEffect(() => {
    const setupMarquee = () => {
      if (!marqueeInnerRef.current) return;
      const firstPart = marqueeInnerRef.current.querySelector('.fm-marquee__part');
      if (!firstPart) return;

      animationRef.current?.kill();
      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -(firstPart.offsetWidth || 1),
        duration: speed,
        ease: 'none',
        repeat: -1,
      });
    };

    const timer = window.setTimeout(setupMarquee, 50);
    return () => {
      window.clearTimeout(timer);
      animationRef.current?.kill();
    };
  }, [image, repetitions, speed, text]);

  const showMarquee = (event) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = closestVerticalEdge(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);

    gsap
      .timeline({ defaults: { duration: 0.58, ease: 'expo.out' } })
      .set(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .set(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' }, 0);
  };

  const hideMarquee = (event) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = closestVerticalEdge(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);

    gsap
      .timeline({ defaults: { duration: 0.54, ease: 'expo.out' } })
      .to(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .to(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0);
  };

  const content = (
    <>
      <span>{text}</span>
      {eyebrow && <small>{eyebrow}</small>}
    </>
  );

  return (
    <div className="fm-menu__item" ref={itemRef} style={{ borderColor }}>
      {action ? (
        <button
          className="fm-menu__link"
          onMouseEnter={showMarquee}
          onMouseLeave={hideMarquee}
          onClick={() => {
            action();
            onNavigate?.();
          }}
          style={{ color: textColor }}
          type="button"
        >
          {content}
        </button>
      ) : (
        <Link
          className="fm-menu__link"
          to={link}
          onMouseEnter={showMarquee}
          onMouseLeave={hideMarquee}
          onClick={onNavigate}
          style={{ color: textColor }}
        >
          {content}
        </Link>
      )}
      <div className="fm-marquee" ref={marqueeRef} style={{ backgroundColor: marqueeBgColor }}>
        <div className="fm-marquee__inner-wrap">
          <div className="fm-marquee__inner" ref={marqueeInnerRef} aria-hidden="true">
            {Array.from({ length: repetitions }).map((_, index) => (
              <div className="fm-marquee__part" key={index} style={{ color: marqueeTextColor }}>
                <span>{text}</span>
                <div className="fm-marquee__img" style={{ backgroundImage: `url(${image})` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlowingMenu({
  items = [],
  speed = 15,
  textColor = '#FDF6EC',
  bgColor = '#5C0018',
  marqueeBgColor = '#F4A020',
  marqueeTextColor = '#5C0018',
  borderColor = 'rgba(253, 246, 236, 0.18)',
  onNavigate,
}) {
  return (
    <div className="fm-menu-wrap" style={{ backgroundColor: bgColor }}>
      <nav className="fm-menu" aria-label="Expanded menu links">
        {items.map((item) => (
          <MenuItem
            key={item.link + item.text}
            {...item}
            speed={speed}
            textColor={textColor}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            borderColor={borderColor}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}
