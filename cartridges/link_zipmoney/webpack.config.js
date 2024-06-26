/* globals cat, cd, cp, echo, exec, exit, find, ls, mkdir, rm, target, test */
'use strict';

require('shelljs/make');
var path = require('path');

var ExtractTextPlugin = require('sgmf-scripts')['extract-text-webpack-plugin'];

var cartridgePath = './cartridges/int_zippay_sfra/cartridge/';

module.exports = [{
    mode: 'production',
    name: 'js',
    entry: {
        zippayments: path.join(__dirname, cartridgePath + 'client/default/js/zippayments.js')
    },
    output: {
        path: path.resolve(cartridgePath + 'static/default/js/'),
        filename: '[name].js'
    },
    optimization: {
		// We no not want to minimize our code.
        minimize: false
    }
}, {
    mode: 'production',
    name: 'scss',
    entry: {
        zippayments: path.join(__dirname, cartridgePath + 'client/default/scss/zippayments.scss')
    },
    output: {
        path: path.resolve(cartridgePath + 'static/default/css/'),
        filename: '[name].css'
    },
    module: {
        rules: [{
            test: /\.scss$/,
            use: ExtractTextPlugin.extract({
                use: [{
                    loader: 'css-loader',
                    options: {
                        url: false,
                        minimize: true
                    }
                }, {
                    loader: 'postcss-loader',
                    options: {
                        plugins: [
                            require('autoprefixer')()
                        ]
                    }
                }, {
                    loader: 'sass-loader',
                    options: {
                        includePaths: [
                            path.resolve('node_modules'),
                            path.resolve('node_modules/flag-icon-css/sass')
                        ]
                    }
                }]
            })
        }]
    },
    plugins: [
        new ExtractTextPlugin({ filename: '[name].css' })
    ]
}];
