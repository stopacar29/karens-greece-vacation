import { useEffect, useRef, useState } from 'react';

/**
 * A delete button that never removes data on a single (possibly accidental) tap.
 * First tap arms it ("Tap again to delete"); it disarms by itself after a few
 * seconds. Supports the design goal that data entered is kept until it is
 * intentionally deleted.
 */
export default function ConfirmDeleteButton({
  onConfirm,
  label = 'Delete',
  small = false,
}: {
  onConfirm: () => void;
  label?: string;
  small?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onClick = () => {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setArmed(false);
    onConfirm();
  };

  return (
    <button
      type="button"
      className="secondary"
      onClick={onClick}
      aria-label={armed ? `Confirm: ${label}` : label}
      style={{
        color: armed ? '#fff' : '#a00',
        background: armed ? '#b71c1c' : undefined,
        border: armed ? '1px solid #b71c1c' : undefined,
        borderRadius: 8,
        padding: small ? '4px 8px' : '8px 12px',
        fontSize: small ? 13 : 14,
        minHeight: small ? undefined : 40,
      }}
    >
      {armed ? 'Tap again to delete' : label}
    </button>
  );
}
