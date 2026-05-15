import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function BlobCursor() {
  const blob = useRef(null);

  useEffect(() => {
    // Hide normal cursor
    document.body.style.cursor = 'none';

    const moveBlob = (e) => {
      gsap.to(blob.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.15,
        ease: 'power2.out'
      });
    };

    window.addEventListener('mousemove', moveBlob);
    
    return () => {
      window.removeEventListener('mousemove', moveBlob);
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <div
      ref={blob}
      style={{
        position: 'fixed',
        width: 40,
        height: 35,
        borderRadius: '90%',
        backgroundColor: '#ea9808',
        opacity: 0.7,
        boxShadow: '5px 5px 15px rgba(0,0,0,0.4)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 99999,
        top: 0,
        left: 0,
      }}
    />
  );
}