import { BRAND_RED, MARK_PATH, MARK_VIEWBOX } from './mark';

/** O logo da Viceri (anel vermelho vazado). Use `color` para versões em tom sobre tom ou brancas. */
export function ViceriMark({
  size = 48,
  color = BRAND_RED,
  className,
  title,
}: {
  size?: number;
  color?: string;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      width={size}
      height={(size * 200) / 213}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={MARK_PATH} fill={color} fillRule="evenodd" />
    </svg>
  );
}
