import {generateConfig, get, stripMetadata, EasyWebpackConfig} from '@easy-webpack/core'
import path from 'path';

import envProd from '@easy-webpack/config-env-production'
import envDev from '@easy-webpack/config-env-development'
import aurelia from '@easy-webpack/config-aurelia'
import babel from '@easy-webpack/config-babel'
import html from '@easy-webpack/config-html'
import css from '@easy-webpack/config-css'
import fontAndImages from '@easy-webpack/config-fonts-and-images'
import globalBluebird from '@easy-webpack/config-global-bluebird'
import globalJquery from '@easy-webpack/config-global-jquery'
import globalRegenerator from '@easy-webpack/config-global-regenerator'
import generateIndexHtml from '@easy-webpack/config-generate-index-html'
import commonChunksOptimize from '@easy-webpack/config-common-chunks-simple'
import copyFiles from '@easy-webpack/config-copy-files'
import uglify from '@easy-webpack/config-uglify'
import generateCoverage from '@easy-webpack/config-test-coverage-istanbul'
import less from '@easy-webpack/config-less'
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import MinifyCss from 'optimize-css-assets-webpack-plugin';
import SemverWebpackPlugin from 'semver-extended-webpack-plugin';
import WebpackShellPlugin from 'webpack-shell-plugin';


process.env.BABEL_ENV = 'webpack';
const ENV = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() || (process.env.NODE_ENV = 'development');

// basic configuration:
const title = 'Spotifynd';
const baseUrl = ENV === "production" ? '/' : '/';
const rootDir = path.resolve();
const srcDir = path.resolve('src');
const outDir = path.resolve('dist');

console.log('ENVIRONMENT', ENV);

const coreBundles = {
    bootstrap: [
        'aurelia-bootstrapper-webpack',
        'aurelia-polyfills',
        'aurelia-pal',
        'aurelia-pal-browser',
        'regenerator-runtime',
        'bluebird'
    ],
    // these will be included in the 'aurelia' bundle (except for the above bootstrap packages)
    aurelia: [
        'aurelia-bootstrapper-webpack',
        'aurelia-binding',
        'aurelia-dependency-injection',
        'aurelia-framework',
        'aurelia-history',
        'aurelia-history-browser',
        'aurelia-loader',
        'aurelia-loader-webpack',
        'aurelia-logging',
        'aurelia-logging-console',
        'aurelia-metadata',
        'aurelia-pal',
        'aurelia-pal-browser',
        'aurelia-path',
        'aurelia-polyfills',
        'aurelia-route-recognizer',
        'aurelia-router',
        'aurelia-task-queue',
        'aurelia-templating',
        'aurelia-templating-binding',
        'aurelia-templating-router',
        'aurelia-templating-resources'
    ]
};

/**
 * Main Webpack Configuration
 */
let config = generateConfig(
    {
        entry: {
            'app': ['./src/main' /* this is filled by the aurelia-webpack-plugin */],
            'aurelia-bootstrap': coreBundles.bootstrap,
            'aurelia': coreBundles.aurelia.filter(pkg => coreBundles.bootstrap.indexOf(pkg) === -1)
        },
        output: {
            path: outDir
        },
        plugins: [
            new ExtractTextPlugin("styles.css"),
            new MinifyCss({
                cssProcessor: require('cssnano'),
                cssProcessorOptions: {
                    safe: true,
                    discardComments: {removeAll: true},
                    discardDuplicates: true,
                    discardEmpty: true
                },
                canPrint: true
            }),
            new SemverWebpackPlugin({
                files: [path.resolve(__dirname, 'package.json')],
                incArgs: ['prerelease', 'build'],
                console: true,
                buildDate: true
                //version: '1.0.0-build.0'  // optional if you want to set the desired version
            }),
            new WebpackShellPlugin({
                onBuildStart: ['./version_up.sh'],
                onBuildEnd: ['echo "Webpack End"']
            })
        ]
    },

    /**
     * Don't be afraid, you can put bits of standard Webpack configuration here
     * (or at the end, after the last parameter, so it won't get overwritten by the presets)
     * Because that's all easy-webpack configs are - snippets of premade, maintained configuration parts!
     *
     * For Webpack docs, see: https://webpack.js.org/configuration/
     */

    ENV === 'test' || ENV === 'development' ?
        envDev(ENV !== 'test' ? {} : {devtool: 'inline-source-map'}) :
        envProd({/* devtool: '...' */}),

    aurelia({root: rootDir, src: srcDir, title: title, baseUrl: baseUrl}),

    babel({presets: {/* uses settings from .babelrc */}, exclude: /(node_modules|environment)/}),
    html(),
    less({filename: 'styles.css', allChunks: true, sourceMap: false}),
    css({filename: 'styles.css', allChunks: true, sourceMap: false}),
    fontAndImages(),
    globalBluebird(),
    globalJquery(),
    globalRegenerator(),
    generateIndexHtml({minify: ENV === 'production'}),
    ...(ENV === 'production' || ENV === 'development' ? [
        commonChunksOptimize({appChunkName: 'app', firstChunk: 'aurelia-bootstrap'}),
        copyFiles({
            patterns: [{from: 'static/', to: 'static/', force: true}
            ]
        })
    ] : [
        /* ENV === 'test' */
        generateCoverage({options: {'force-sourcemap': true, esModules: true}})
    ]),

    ENV === 'production' ?
        uglify({debug: false, mangle: false, keep_fnames: true}) : {}
);

module.exports = stripMetadata(config);
