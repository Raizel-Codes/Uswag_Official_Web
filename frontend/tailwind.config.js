/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // USWAG design tokens — see docs/USWAG_Website_Plan.docx §2.1
        // and claude.md "Design tokens" section. Do not add ad-hoc colors here;
        // extend tokens.css and this file together.
        forest: '#142718',   // Deep Forest — headers, footer, nav, dark surfaces
        primary: {
          DEFAULT: '#2E5B41', // Primary Green — buttons, links, active states
          light: '#3D7455',
        },
        sage: '#98CBB0',     // Sage Accent — hover states, badges, QR frame (never body text on white)
        mist: '#E7EFE4',     // Mist Background — page background, cards, inputs

        // Semantic status colors — see docs/USWAG_Website_Plan.docx §2.1 and
        // prototype/*.html (--grey/--danger/--warn, .badge.green/.amber/.red).
        // Use for status chips/badges/alerts instead of Tailwind's default
        // red/amber/green or inline hex.
        grey: '#6B7A70',
        success: '#2F9E5C',
        successBg: '#E5F6EC',
        warn: '#C98A2E',
        warnBg: '#FDF1E0',
        danger: '#B3453F',
        dangerBg: '#FBE9E8',
      },
      fontFamily: {
        // Public marketing site headings — see prototype/landingDesktop.html
        display: ['Lora', 'serif'],
        // Member/Officer/Super Admin portal headings — see prototype/{member,officer-admin,super-admin}.html
        // Not yet applied to components; portal pages still use `font-display` pending migration.
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.5s ease-out infinite',
      },
    },
  },
  plugins: [],
};
