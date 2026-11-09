import { avatarColor, initials } from '../domain/people';

export function Avatar({ name, email, size = 48 }: { name: string; email: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-black text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: avatarColor(email),
        boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.18)',
      }}
    >
      {initials(name)}
    </span>
  );
}
