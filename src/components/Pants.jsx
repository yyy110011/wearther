export const Pants = ({ size = 24, ...props }) => (
  <svg
    {...props}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 2l-3 20h4l1-10 1 10h4l-3-20h-4z" />
  </svg>
);
