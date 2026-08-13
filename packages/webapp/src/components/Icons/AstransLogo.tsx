interface AstransLogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  /** Use the white mark on dark backgrounds, black mark on light backgrounds. */
  variant?: 'black' | 'white';
  /** Fixed box height in px; width scales to preserve the mark's aspect ratio. */
  height?: number;
}

/**
 * Astrans brand mark. Replaces the old hardcoded "bigcapital" wordmark icon
 * (`Icon icon="bigcapital"` / `BigcapitalAlt`) used across the login page,
 * sidebar, loading screen, etc.
 */
export function AstransLogo({
  variant = 'black',
  height = 37,
  style,
  ...rest
}: AstransLogoProps) {
  const src = variant === 'white' ? '/brand/logo-white.png' : '/brand/logo-black.png';

  return (
    <img
      src={src}
      alt="Astrans"
      style={{
        display: 'block',
        height,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        ...style,
      }}
      {...rest}
    />
  );
}
