const webpack = require("webpack");
const DotenvWebpack = require("dotenv-webpack");
const path = require("path");
const dotenv = require("dotenv")

var config = {
    context: path.resolve(__dirname, ""),
    resolve: {
        extensions: [".ts", ".js", ".json"]
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                loader: "ts-loader"
            }
        ]
    }
};

// extra properties per environment
var envExtras = { };

// Return Array of Configurations
module.exports = (env) => {
    var mode = env.mode ?? "production";
    envExtras.devtool = "source-map";
    console.log(`Webpack mode: ${mode}`);
    if (mode == "development") {
        envExtras.devtool = "eval-cheap-module-source-map";
        envExtras.plugins = [
            new webpack.HotModuleReplacementPlugin(),
        ];
    }

    // load .env file
    dotenv.config( {
        path: `./.env.${mode}`
    });

    var entries = {};
    if (process.env.AcsEndpoint) {
        console.log("Adding ACS Embed Config")
        Object.assign(entries, {
            acs: { 
                import: './wwwroot/src/EmbedAcs.ts',
                filename: '[name]/embeddedchat.min.js'
            },
        });
    }

    if (process.env.GnbEndpoint) {
        console.log("Adding Graph Embed Config")
        Object.assign(entries, {
            graph: { 
                import: './wwwroot/src/EmbedGraph.ts',
                filename: '[name]/embeddedchat.min.js'
            },
        });
    }

    // default config
    console.log("Adding Auth Embed Config")
    Object.assign(entries, {
        auth: { 
            import: './wwwroot/src/Auth.ts',
            filename: 'auth.min.js' 
        }
    });

    return [
        Object.assign({}, config, envExtras, {
        mode: mode,
        entry: entries,
        plugins: [
            new DotenvWebpack({
                path: `./.env.${mode}`
            })
        ],
        output: {
            path: path.resolve(__dirname, "./wwwroot/dist"),
            libraryTarget: "umd",
            umdNamedDefine: true,
            clean: true,
        },
    })]
};