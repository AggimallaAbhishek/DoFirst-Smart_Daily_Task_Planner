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
    let hasPointer = false;
    let animationFrameId = null;

    const TRAIL_FOLLOW_FACTOR = 0.38;

    const requestRender = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    const renderFrame = () => {
      animationFrameId = null;

      if (!hasPointer) {
        return;
      }

      trailX += (mouseX - trailX) * TRAIL_FOLLOW_FACTOR;
      trailY += (mouseY - trailY) * TRAIL_FOLLOW_FACTOR;

      if (Math.abs(mouseX - trailX) < 0.2) {
        trailX = mouseX;
      }

      if (Math.abs(mouseY - trailY) < 0.2) {
        trailY = mouseY;
      }

      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      trail.style.transform = `translate3d(${trailX}px, ${trailY}px, 0) translate(-50%, -50%)`;

      if (Math.abs(mouseX - trailX) > 0.2 || Math.abs(mouseY - trailY) > 0.2) {
        requestRender();
      }
    };

    const handlePointerMove = (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      if (!hasPointer) {
        trailX = mouseX;
        trailY = mouseY;
        hasPointer = true;
        cursor.style.opacity = '1';
        trail.style.opacity = '1';
      }

      requestRender();
    };

    const handlePointerLeave = () => {
      hasPointer = false;
      cursor.style.opacity = '0';
      trail.style.opacity = '0';
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

    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
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
