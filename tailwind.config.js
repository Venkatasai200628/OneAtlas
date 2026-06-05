export default {
  darkMode: 'class',
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter','ui-sans-serif','system-ui','-apple-system','BlinkMacSystemFont','Segoe UI','sans-serif'],
      },
      colors: {
        accent:  { DEFAULT:'#FF6600', hover:'#E65C00', light:'#FFF3EB', border:'#FFD0A6' },
        canvas:  { DEFAULT:'#F5F5EE', card:'#FFFFFF' },
        ink:     { DEFAULT:'#111111', secondary:'#6B7280', muted:'#9CA3AF' },
        border:  { DEFAULT:'#E5E7EB', subtle:'#ECECEC' },
      },
      borderRadius: { sm:'12px', md:'18px', lg:'24px', xl:'32px' },
      boxShadow: {
        card:  '0 1px 2px rgba(0,0,0,0.02), 0 4px 24px rgba(0,0,0,0.04)',
        hover: '0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.07)',
        accent:'0 4px 24px rgba(255,102,0,0.18)',
      },
    },
  },
  plugins: [],
}
