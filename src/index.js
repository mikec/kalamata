var bodyParser = require('body-parser');
var app, options;

var kalamata = module.exports = function(_app_, _options_) {
    app = _app_;
    options = _options_;

    app.use(bodyParser.json());

    if(!options) options = {};
    if(!options.apiRoot) options.apiRoot = '/';
    else options.apiRoot = '/' + options.apiRoot.replace(/^\/|\/$/g, '') + '/';

    return kalamata;
};

kalamata.expose = function(model, _opts_) {

    var validOpts = {
        identifier: true,
        endpointName: true,
        modelName: true,
        collectionName: true
    };

    var hooks = {
        before: hookArrays(),
        after: hookArrays()
    };

    var opts = {};
    if(!opts.identifier) opts.identifier = 'id';
    if(!opts.endpointName) opts.endpointName = model.forge().tableName;

    for(var p in _opts_) {
        if(validOpts[p]) {
            opts[p] = _opts_[p];
        } else {
            throw new Error('Invalid option: ' + p);
        }
    }

    opts.collectionName = opts.collectionName ?
                                capitalize(opts.collectionName) :
                                collectionName(opts.endpointName);
    opts.modelName = opts.modelName ?
                                capitalize(opts.modelName) :
                                modelName(opts.endpointName);

    createHookFunctions();
    configureEndpoints();

    function configureEndpoints() {

        app.get(options.apiRoot + opts.endpointName, function(req, res, next) {
            var mod;
            if(req.query.where) {
                var w;
                try {
                    w = parseJSON(req.query.where);
                } catch(err) {
                    throw new Error('Could not parse JSON: ' + req.query.where);
                }
                mod = new model().where(w);
            } else {
                mod = new model();
            }

            var beforeResult = runHooks(hooks.before.getCollection, req, res, mod);
            if(res.headersSent) return;

            var promise = beforeResult.promise || mod.fetchAll(getFetchParams(req));
            promise.then(function(collection) {
                var afterResult = runHooks(
                                    hooks.after.getCollection, req, res, collection);
                return afterResult.promise || collection;
            }).then(function(collection) {
                sendResponse(res, collection.toJSON());
            }).catch(next);
        });

        app.get(options.apiRoot + opts.endpointName + '/:identifier',
        function(req, res, next) {
            var mod = new model(getModelAttrs(req));

            var beforeResult = runHooks(hooks.before.get, req, res, mod);
            if(res.headersSent) return;

            var promise = beforeResult.promise || mod.fetch(getFetchParams(req));
            promise.then(function(m) {
                return checkModelFetchSuccess(req, m);
            }).then(function(m) {
                var afterResult = runHooks(hooks.after.get, req, res, m);
                return afterResult.promise || m;
            }).then(function(m) {
                sendResponse(res, m);
            }).catch(next);
        });

        app.get(options.apiRoot + opts.endpointName + '/:identifier/:relation',
        function(req, res, next) {
            var mod = new model(getModelAttrs(req));
            mod.fetch({ withRelated: req.params.relation }).then(function(m) {
                return checkModelFetchSuccess(req, m);
            }).then(function(m) {
                return m.related(req.params.relation);
            }).then(function(related) {
                sendResponse(res, related);
            }).catch(next);
        });

        app.post(options.apiRoot + opts.endpointName, function(req, res, next) {
            var mod = new model(req.body);

            var beforeResult = runHooks(hooks.before.create, req, res, mod);
            if(res.headersSent) return;

            var promise = beforeResult.promise || mod.save();
            promise.then(function(m) {
                if(m) {
                    var afterResult = runHooks(hooks.after.create, req, res, m);
                    return afterResult.promise || m;
                }
            }).then(function(m) {
                if(m) {
                    sendResponse(res, m.toJSON());
                }
            }).catch(next);
        });

        app.put(options.apiRoot + opts.endpointName + '/:identifier',
        function(req, res, next) {
            new model(getModelAttrs(req)).fetch().then(function(m) {
                if(m) m.set(req.body);
                var beforeResult = runHooks(hooks.before.update, req, res, m);
                if(!res.headersSent) {
                    if(m) {
                        return beforeResult.promise || m.save();
                    } else {
                        return checkModelFetchSuccess(req, m);
                    }
                }
            }).then(function(m) {
                if(m) {
                    var afterResult = runHooks(hooks.after.update, req, res, m);
                    return afterResult.promise || m;
                }
            }).then(function(m) {
                if(m) {
                    sendResponse(res, m.toJSON());
                }
            }).catch(next);
        });

        app.delete(options.apiRoot + opts.endpointName + '/:identifier',
        function(req, res, next) {
            new model(getModelAttrs(req)).fetch().then(function(m) {
                var beforeResult = runHooks(hooks.before.del, req, res, m);
                if(!res.headersSent) {
                    if(m) {
                        return beforeResult.promise || m.destroy();
                    } else {
                        return checkModelFetchSuccess(req, m);
                    }
                }
            }).then(function(m) {
                if(m) {
                    var afterResult = runHooks(hooks.after.del, req, res, m);
                    return afterResult.promise || m;
                }
            }).then(function() {
                sendResponse(res, true);
            }).catch(next);
        });
    }

    function runHooks(fnArray, req, res, model, result) {
        var result;
        for(var i in fnArray) {
            result = fnArray[i](req, res, model, result);
        }
        if(result && result.then) {
            return {
                promise: result
            };
        } else {
            return {};
        }
    }

    function hookArrays() {
        return {
            get: [],
            getCollection: [],
            create: [],
            update: [],
            del: []
        };
    }

    function createHookFunctions() {
        createHookFunction('beforeGet' + opts.collectionName,
                                'before', 'getCollection');
        createHookFunction('beforeGet' + opts.modelName, 'before', 'get');
        createHookFunction('beforeCreate' + opts.modelName, 'before', 'create');
        createHookFunction('beforeUpdate' + opts.modelName, 'before', 'update');
        createHookFunction('beforeDelete' + opts.modelName, 'before', 'del');
        createHookFunction('afterGet' + opts.collectionName,
                                'after', 'getCollection');
        createHookFunction('afterGet' + opts.modelName, 'after', 'get');
        createHookFunction('afterCreate' + opts.modelName, 'after', 'create');
        createHookFunction('afterUpdate' + opts.modelName, 'after', 'update');
        createHookFunction('afterDelete' + opts.modelName, 'after', 'del');
    }

    function createHookFunction(fnName, prefix, type) {
        kalamata[fnName] = hookFn(prefix, type, fnName);
    }

    function hookFn(prefix, type, fnName) {
        if(type) {
            return function(fn) {
                fn.__name = fnName;
                hooks[prefix][type].push(fn);
            };
        } else {
            return function(fn) {
                fn.__name = fnName;
                for(var i in hooks[prefix]) {
                    hooks[prefix][i].push(fn);
                }
            };
        }
    }

    function checkModelFetchSuccess(req, m) {
        if(!m) {
            throw new Error(
                req.method + ' ' + req.url + ' failed: ' +
                opts.identifier + ' = ' + req.params.identifier +
                ' not found'
            );
        }
        return m;
    }

    function getModelAttrs(req) {
        var attrs;
        if(req.params.identifier) {
            attrs = {};
            attrs[opts.identifier] = req.params.identifier;
        }
        return attrs;
    }

    function getFetchParams(req) {
        return req.query.load ?
                    { withRelated: req.query.load.split(',') } : null;
    }

    function sendResponse(response, sendData) {
        if(!response.headersSent) response.send(sendData);
    }

    function collectionName(endpointName) {
        endpointName = capitalize(endpointName);
        endpointName += (endpointName.slice(-1) == 's' ? '' : 'Collection');
        return endpointName;
    }

    function modelName(endpointName) {
        endpointName = (endpointName.slice(-1) == 's' ?
                    endpointName.substr(0,endpointName.length - 1) :
                    endpointName);
        return capitalize(endpointName);
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function parseJSON(str) {
        return JSON.parse(fixJSONString(str));
    }

    function fixJSONString(str) {
        return str.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
    }

    return kalamata;

};