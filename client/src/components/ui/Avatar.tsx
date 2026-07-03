import { useObjectUrl } from '@/lib/useObjectUrl';

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

/**
 * Renders an authenticated image (fetched as a blob via the API interceptor and
 * shown through an object URL), falling back to the person's initials. Pass a
 * changing `version` to force a re-fetch after the image is replaced.
 */
export function Avatar({
  src,
  name,
  hasImage,
  size = 40,
  version,
}: {
  src: string;
  name: string;
  hasImage: boolean;
  size?: number;
  version?: string | number;
}) {
  const url = useObjectUrl(src, hasImage, version);
  const dimension = { width: size, height: size };
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={dimension}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={dimension}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
      aria-label={name}
    >
      {initialsOf(name)}
    </div>
  );
}
