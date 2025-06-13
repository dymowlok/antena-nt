// vite.config.js
import { defineConfig } from 'vite';
import htmlConfig from 'vite-plugin-html-config';
import { minify } from 'html-minifier-terser';

export default defineConfig({
    base: './',
    plugins: [
        htmlConfig({
            htmlMinify: true,
            minifyFunction: async (html) => {
                return await minify(html, {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeRedundantAttributes: true,
                    removeEmptyAttributes: true,
                    minifyCSS: true,
                    minifyJS: true
                });
            }
        })
    ]
});
