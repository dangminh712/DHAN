import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Keep the dialog outside the app root so background routes cannot receive
// pointer or keyboard focus while a document is being edited.
export default function FormModalShell({ children }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const root = document.getElementById('root');
    const wasInert = root?.inert;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    hostRef.current?.querySelector('button')?.focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const controls = [...hostRef.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select, [contenteditable="true"], iframe')]
        .filter(element => element.getClientRects().length);
      if (!controls.length) return;
      if (event.shiftKey && event.target === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && event.target === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    };
    const host = hostRef.current;
    host.addEventListener('keydown', trap);
    return () => {
      host.removeEventListener('keydown', trap);
      if (root) root.inert = wasInert;
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(<div ref={hostRef} className="bm-modal-host">{children}</div>, document.body);
}
