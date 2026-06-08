module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 40px rgba(56, 189, 248, 0.35)',
      },
      backgroundImage: {
        space: 'radial-gradient(circle at 15% 10%, rgba(56, 189, 248, 0.18), transparent 25%), radial-gradient(circle at 85% 20%, rgba(168, 85, 247, 0.14), transparent 18%), radial-gradient(circle at 50% 85%, rgba(248, 113, 113, 0.12), transparent 20%), linear-gradient(180deg, #020617 0%, #060a1f 100%)',
      },
    },
  },
  plugins: [],
};
