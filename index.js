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

        app.get(options.apiRoot + opts.endpointName, function(req, res) {
            var m;
            if(req.query.where) {
                var w;
                try {
                    w = parseJSON(req.query.where);
                } catch(err) {
                    var e = new Error('Could not parse JSON: ' + req.query.where);
                    e.inner = err;
                    throw e;
                }
                m = new model().where(w);
            } else {
                m = new model();
            }

            var beforeResult = runHooks(hooks.before.getCollection, req, res, m);
            if(res.headersSent) return;

            var promise = beforeResult.promise || m.fetchAll();
            promise.then(function(collection) {
                var afterResult = runHooks(
                                    hooks.after.getCollection, req, res, collection);
                return afterResult.promise || collection;
            }).then(function(collection) {
                sendResponse(res, collection.toJSON());
            });

            catchError(promise, 'Get ' + opts.collectionName + ' failed');
        });

        app.get(options.apiRoot + opts.endpointName + '/:identifier',
        function(req, res) {
            var modelAttrs = {};
            modelAttrs[opts.identifier] = req.params.identifier;
            var m = new model(modelAttrs);

            var beforeResult = runHooks(hooks.before.get, req, res, m);
            if(res.headersSent) return;

            var promise = beforeResult.promise || m.fetch();
            promise.then(function(m) {
                if(!m) {
                    var e = new Error(
                        'Get ' + opts.modelName + ' failed: ' +
                        opts.identifier + ' = ' + req.params.identifier +
                        ' not found'
                    );
                    e.isInner = true;
                    throw e;
                }
                var afterResult = runHooks(hooks.after.get, req, res, m);
                return afterResult.promise || m;
            }).then(function(m) {
                sendResponse(res, m);
            });

            catchError(promise, 'Get ' + opts.modelName + ' failed');
        });

        app.post(options.apiRoot + opts.endpointName, function(req, res) {
            var m = new model(req.body);

            var beforeResult = runHooks(hooks.before.create, req, res, m);
            if(res.headersSent) return;

            var promise = beforeResult.promise || m.save();
            promise.then(function(m) {
                if(m) {
                    var afterResult = runHooks(hooks.after.create, req, res, m);
                    return afterResult.promise || m;
                }
            }).then(function(m) {
                if(m) {
                    sendResponse(res, m.toJSON());
                }
            });

            catchError(promise, 'Create ' + opts.modelName + ' ' +
                                    JSON.stringify(req.body) + ' failed');
        });

        app.put(options.apiRoot + opts.endpointName + '/:identifier',
        function(req, res) {
            var modelAttrs = {};
            modelAttrs[opts.identifier] = req.params.identifier;
            var promise = new model(modelAttrs).fetch().then(function(m) {

                if(m) m.set(req.body);
                var beforeResult = runHooks(hooks.before.update, req, res, m);
                if(res.headersSent) return;

                if(!m) {
                    var e = new Error(
                        'Update ' + opts.modelName + ' failed: ' +
                        opts.identifier + ' = ' + req.params.identifier +
                        ' not found'
                    );
                    e.isInner = true;
                    throw e;
                }

                return beforeResult.promise || m.save();
            })
            .then(function(m) {
                if(m) {
                    var afterResult = runHooks(hooks.after.update, req, res, m);
                    return afterResult.promise || m;
                }
            }).then(function(m) {
                if(m) {
                    sendResponse(res, m.toJSON());
                }
            });

            catchError(promise, 'Update ' + opts.modelName + ' failed');
        });

        app.delete(options.apiRoot + opts.endpointName + '/:identifier',
        function(req, res) {
            var modelAttrs = {};
            modelAttrs[opts.identifier] = req.params.identifier;
            var promise = new model(modelAttrs).fetch().then(function(m) {

                var beforeResult = runHooks(hooks.before.del, req, res, m);
                if(res.headersSent) return;

                if(!m) {
                    var e = new Error(
                        'Delete ' + opts.modelName + ' failed: ' +
                        opts.identifier + ' = ' + req.params.identifier +
                        ' not found'
                    );
                    e.isInner = true;
                    throw e;
                }

                return beforeResult.promise || m.destroy();
            })
            .then(function(m) {
                if(m) {
                    var afterResult = runHooks(hooks.after.del, req, res, m);
                    return afterResult.promise || m;
                }
            }).then(function() {
                sendResponse(res, true);
            });

            catchError(promise, 'Delete ' + opts.modelName + ' failed');
        });
    }

    function catchError(promise, message) {
        promise.catch(function(err) {
            var e;
            if(err.isInner) {
                e = err;
            } else {
                e = new Error(message);
                e.inner = err;
            }
            throw e;
        });
    }

    function runHooks(fnArray, req, res, model, result) {
        var result;
        for(var i in fnArray) {
            var fn = fnArray[i];
            try {
                result = fn(req, res, model, result);
            } catch(err) {
                var e = err;
                e.inner = new Error(fn.__name + ' failed');
                throw e;
            }
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