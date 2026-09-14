/**
 * Hand-authored inline SVG icon set.
 *
 * Deliberately not an icon library — the design brief rules out Lucide, and
 * owning these outright keeps the stroke weight and geometry consistent with
 * the rest of the system.
 */

import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconUpload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Svg>
)

export const IconMic = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
    <path d="M12 17.5V21" />
  </Svg>
)

export const IconStop = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconPlay = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 5.5 18 12 8 18.5z" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconPause = (p: IconProps) => (
  <Svg {...p}>
    <rect x="7.5" y="5.5" width="3.2" height="13" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.3" y="5.5" width="3.2" height="13" rx="1" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconShieldCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.8 19 5.5v6c0 4.2-2.9 8.1-7 9.7-4.1-1.6-7-5.5-7-9.7v-6z" />
    <path d="m9 11.8 2.1 2.1L15.3 9.7" />
  </Svg>
)

export const IconShieldAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.8 19 5.5v6c0 4.2-2.9 8.1-7 9.7-4.1-1.6-7-5.5-7-9.7v-6z" />
    <path d="M12 8.2v4.2" />
    <path d="M12 15.6h.01" />
  </Svg>
)

export const IconHistory = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <path d="M3.5 4.5V9H8" />
    <path d="M12 7.8V12l3 1.8" />
  </Svg>
)

export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3" />
    <path d="M10 16.5 14.5 12 10 7.5" />
    <path d="M14.5 12h-10" />
  </Svg>
)

export const IconSun = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.6v2.1M12 19.3v2.1M4.4 4.4l1.5 1.5M18.1 18.1l1.5 1.5M2.6 12h2.1M19.3 12h2.1M4.4 19.6l1.5-1.5M18.1 5.9l1.5-1.5" />
  </Svg>
)

export const IconMoon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />
  </Svg>
)

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 6.5h15" />
    <path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
    <path d="M6.5 6.5 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12.5" />
  </Svg>
)

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </Svg>
)

export const IconChip = (p: IconProps) => (
  <Svg {...p}>
    <rect x="7" y="7" width="10" height="10" rx="1.6" />
    <path d="M10 3.5v3M14 3.5v3M10 17.5v3M14 17.5v3M3.5 10h3M3.5 14h3M17.5 10h3M17.5 14h3" />
  </Svg>
)

export const IconWaveform = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 12h2M8 6.5v11M12 3.5v17M16 8v8M20.5 12h-2" />
  </Svg>
)

export const IconSpinner = (p: IconProps) => (
  <Svg {...p} className={`animate-spin ${p.className ?? ""}`}>
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" />
  </Svg>
)

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </Svg>
)

export const IconInbox = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 13.5h4l1.2 2.2h6.6l1.2-2.2h4" />
    <path d="M5.4 5.2h13.2l2 8.3v4a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2v-4z" />
  </Svg>
)

export const IconRoute = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="18" r="2.4" />
    <circle cx="18" cy="6" r="2.4" />
    <path d="M8.4 18h5.1a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8" />
  </Svg>
)

export const IconMessage = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.5 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.4-5.4A7.5 7.5 0 1 1 20.5 11.5z" />
  </Svg>
)

export const IconSend = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 4 3.5 10.6l6.6 2.4 2.4 6.6z" />
    <path d="M20 4l-9.9 9.9" />
  </Svg>
)
