const paths: Record<string, string> = {
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  plus: 'M12 5v14M5 12h14',
  back: 'M15 5l-7 7 7 7',
  share: 'M12 3v12M7 8l5-5 5 5M5 14v6h14v-6',
  whatsapp:
    'M4 20l1.3-4A8 8 0 1 1 8 18.7zM9 8.5c0 3 2.5 6.5 6.5 6.5l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2-1.5 1z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 9.5a1 1 0 1 0 0-.01',
  copy: 'M8 8h11v12H8zM5 16V4h11',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  books: 'M5 4h4v16H5zM10 4h4v16h-4zM15.5 5l3.8-1 3.2 15.5-3.8 1z',
  shuffle: 'M4 7h3c5 0 5 10 10 10h3M4 17h3c2 0 3-1.5 4-3M17 4l3 3-3 3M17 14l3 3-3 3M13 10c1-1.5 2-3 4-3h3',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16 16l4 4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1-4 4-6 8-6s7 2 8 6',
  rotate: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  check: 'M5 12l5 5 9-10',
  type: 'M5 6V4h14v2M12 4v16M9 20h6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  close: 'M6 6l12 12M18 6L6 18',
}

export function Icon({ name, size = 20, filled = false }: { name: keyof typeof paths | string; size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 1.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
