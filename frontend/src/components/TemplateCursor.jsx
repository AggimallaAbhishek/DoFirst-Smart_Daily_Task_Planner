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
    let trailX = 0;
    let trailY = 0;
    let hasInitialPosition = false;
    let animationFrameId;

    const TRAIL_FOLLOW_FACTOR = 0.55;

    const renderFrame = () => {
      if (!hasInitialPosition) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
        return;
      }

      cursor.style.left = `${mouseX}px`;
      cursor.style.top = `${mouseY}px`;

      trailX += (mouseX - trailX) * TRAIL_FOLLOW_FACTOR;
      trailY += (mouseY - trailY) * TRAIL_FOLLOW_FACTOR;

      if (Math.abs(mouseX - trailX) < 0.1) {
        trailX = mouseX;
      }

      if (Math.abs(mouseY - trailY) < 0.1) {
        trailY = mouseY;
      }

      trail.style.left = `${trailX}px`;
      trail.style.top = `${trailY}px`;
      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    const handleMouseMove = (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      if (!hasInitialPosition) {
        trailX = mouseX;
        trailY = mouseY;
        hasInitialPosition = true;
      }
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
    animationFrameId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
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
