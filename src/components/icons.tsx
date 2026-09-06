/* The project's real icon set, provided by Don. 24-grid, 1.3 stroke, round
   caps and joins; stroke follows currentColor so context sets the tint. */

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

function Icon({
  paths,
  size = 16,
  strokeWidth,
  className,
}: IconProps & { paths: string[] }) {
  /* A constant grid stroke scales the glyph perfectly proportionally at any
     size. 2.25 is anchored to the approved 12px weight. */
  const stroke = strokeWidth ?? 2.25;
  return (
    <svg
      /* rem so icons ride the root type scale alongside their labels */
      width={`${size / 16}rem`}
      height={`${size / 16}rem`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export function ChevronDown(props: IconProps) {
  return <Icon paths={["M6 9L12 15L18 9"]} {...props} />;
}

export function ChevronUp(props: IconProps) {
  return <Icon paths={["M6 15L12 9L18 15"]} {...props} />;
}

export function ChevronRight(props: IconProps) {
  return <Icon paths={["M9 6L15 12L9 18"]} {...props} />;
}

export function ChevronLeft(props: IconProps) {
  return <Icon paths={["M15 6L9 12L15 18"]} {...props} />;
}

export function ArrowRight(props: IconProps) {
  return <Icon paths={["M3 12L21 12M21 12L12.5 3.5M21 12L12.5 20.5"]} {...props} />;
}

export function ArrowLeft(props: IconProps) {
  return <Icon paths={["M21 12L3 12M3 12L11.5 3.5M3 12L11.5 20.5"]} {...props} />;
}

export function ArrowUp(props: IconProps) {
  return <Icon paths={["M12 21L12 3M12 3L20.5 11.5M12 3L3.5 11.5"]} {...props} />;
}

export function ArrowDown(props: IconProps) {
  return <Icon paths={["M12 3L12 21M12 21L20.5 12.5M12 21L3.5 12.5"]} {...props} />;
}

export function ArrowUpLeft(props: IconProps) {
  return <Icon paths={["M19 19L6 6M6 6L6 18.48M6 6L18.48 6"]} {...props} />;
}

export function ArrowDownRight(props: IconProps) {
  return (
    <Icon paths={["M6.00005 6.00004L19 19M19 19V6.52004M19 19H6.52005"]} {...props} />
  );
}

export function ArrowDownLeft(props: IconProps) {
  return <Icon paths={["M19 6L6 19M6 19L6 6.52M6 19H18.48"]} {...props} />;
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Icon paths={["M6.00005 19L19 5.99996M19 5.99996V18.48M19 5.99996H6.52005"]} {...props} />
  );
}

export function Download(props: IconProps) {
  return (
    <Icon
      paths={["M6 20L18 20", "M12 4V16M12 16L15.5 12.5M12 16L8.5 12.5"]}
      {...props}
    />
  );
}

export function Close(props: IconProps) {
  return (
    <Icon
      paths={[
        "M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426",
      ]}
      {...props}
    />
  );
}
