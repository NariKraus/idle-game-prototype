const mix = require('laravel-mix');

// mix.js('script.js', 'dist')
//    .sass('style.scss', 'dist')
//    .setPublicPath('dist');
mix.sass('assets/scss/style.scss', 'assets/css');
