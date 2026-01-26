/**
 * PostCSS configuration object for processing CSS files.
 * 
 * This configuration sets up PostCSS to use Tailwind CSS v4's PostCSS plugin,
 * which handles the compilation and processing of Tailwind CSS utility classes
 * and directives in the project's stylesheets.
 * 
 * @type {Object}
 * @property {Object} plugins - Collection of PostCSS plugins to be applied
 * @property {Object} plugins ["@tailwindcss/postcss"] - Tailwind CSS PostCSS plugin configuration
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
