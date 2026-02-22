import { useState, useEffect } from 'react';
import './SLATimer.css';

export default function SLATimer({ deadline, status }) {
  const [remaining, setRemaining] = useState(null);
  const [breached, setBreached] = useState(false);

  useEffect(() => {
    if (!deadline || status === 'Resolved' || status === 'SLA Breached') {
      setRemaining(null);
      setBreached(status === 'SLA Breached');
      return;
    }

    const update = () => {
      const now = new Date();
      const end = new Date(deadline);
      const diff = end - now;

      if (diff <= 0) {
        setRemaining('Breached');
        setBreached(true);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
      setBreached(false);
    };

    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [deadline, status]);

  if (!remaining && !breached) return null;

  return (
    <span className={`sla-timer ${breached ? 'breached' : remaining === 'Breached' ? 'breached' : ''}`}>
      {breached || remaining === 'Breached' ? 'SLA Breached' : remaining}
    </span>
  );
}
