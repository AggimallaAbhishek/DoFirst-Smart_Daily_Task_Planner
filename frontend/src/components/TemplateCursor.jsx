import { useEffect } from 'react';

function supportsCustomCursor() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export default function TemplateCursor() {
  useEffect(() => {
    if (!supportsCustomCursor()) {
      return undefined;
    }

    const cursor = document.getElementById('cursor');
    const trail = document.getElementById('cursor-trail');

    if (!cursor || !trail) {
      return undefined;
    }

    let mouseX = 0;
    let mouseY = 0;
    let trailTimeoutId;

    const handleMouseMove = (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursor.style.left = `${mouseX}px`;
      cursor.style.top = `${mouseY}px`;

      clearTimeout(trailTimeoutId);
      trailTimeoutId = setTimeout(() => {
        trail.style.left = `${mouseX}px`;
        trail.style.top = `${mouseY}px`;
      }, 70);
    };

    const handleMouseOver = (event) => {
      if (!event.target.closest('a,button,.interactive')) {
        return;
      }

      cursor.style.width = '20px';
      cursor.style.height = '20px';
      trail.style.width = '60px';
      trail.style.height = '60px';
    };

    const handleMouseOut = (event) => {
      if (!event.target.closest('a,button,.interactive')) {
        return;
      }

      cursor.style.width = '10px';
      cursor.style.height = '10px';
      trail.style.width = '36px';
      trail.style.height = '36px';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      clearTimeout(trailTimeoutId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <>
      <div id="cursor" />
      <div id="cursor-trail" />
    </>
  );
}
