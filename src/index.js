var bodyParser = require('body-parser');
var app, options;
var hooks = {};
var modelMap = {};

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

    var opts = {};
    if(!opts.identifier) opts.identifier = 'id';
    if(!opts.endpointName) opts.endpointName = model.forge().tableName;

    modelMap[opts.endpointName] = model;

    hooks[opts.endpointName] = {
        before: hookArrays(),
        after: hookArrays()
    };

    var beforeHooks = hooks[opts.endpointName].before;
    var afterHooks = hooks[opts.endpointName].after;

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

            var beforeResult = runHooks(beforeHooks.getCollection, [req, res, mod]);
            if(res.headersSent) return;

            var promise = beforeResult.promise || mod.fetchAll(getFetchParams(req, res));
            promise.then(function(collection) {
                var afterResult = runHooks(afterHooks.getCollection, [req, res, collection]);
                return afterResult.promise || collection;
            }).then(function(collection) {
                sendResponse(res, collection.toJSON());
            }).catch(next);
        });

        app.get(options.apiRoot + opts.endpointName + '/:identifier',
        function(req, res, next) {
            var mod = new model(getModelAttrs(req));

            var beforeResult = runHooks(beforeHooks.get, [req, res, mod]);
            if(res.headersSent) return;

            var promise = beforeResult.promise || mod.fetch(getFetchParams(req, res));
            promise.then(function(m) {
                return checkModelFetchSuccess(req, m);
            }).then(function(m) {
                var afterResult = runHooks(afterHooks.get, [req, res, m]);
                return afterResult.promise || m;
            }).then(function(m) {
                sendResponse(res, m);
            }).catch(next);
        });

        app.get(options.apiRoot + opts.endpointName + '/:identifier/:relation',
        function(req, res, next) {
            var mod = new model(getModelAttrs(req));
            mod.fetch({
                withRelated: getWithRelatedArray([req.params.relation], req, res)
            }).then(function(m) {
                return checkModelFetchSuccess(req, m);
            }).then(function(m) {
                return m.related(req.params.relation);
            }).then(function(related) {
                var afterResult = {};
                var relHooks = hooks[req.params.relation];
                if(relHooks) {
                    afterResult = runHooks(
                                    hooks[req.params.relation].after.getRelated,
                                    [req, res, related, mod]);
                }
                return afterResult.promise || related;
            }).then(function(related) {
                sendResponse(res, related);
            }).catch(next);
        });

        app.post(options.apiRoot + opts.endpointName, function(req, res, next) {
            var mod = new model(req.body);

            var beforeResult = runHooks(beforeHooks.create, [req, res, mod]);
            if(res.headersSent) return;

            var promise = beforeResult.promise || mod.save();
            promise.then(function(m) {
                if(m) {
                    var afterResult = runHooks(afterHooks.create, [req, res, m]);
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
                var beforeResult = runHooks(beforeHooks.update, [req, res, m]);
                if(!res.headersSent) {
                    if(m) {
                        return beforeResult.promise || m.save();
                    } else {
                        return checkModelFetchSuccess(req, m);
                    }
                }
            }).then(function(m) {
                if(m) {
                    var afterResult = runHooks(afterHooks.update, [req, res, m]);
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
                var beforeResult = runHooks(beforeHooks.del, [req, res, m]);
                if(!res.headersSent) {
                    if(m) {
                        return beforeResult.promise || m.destroy();
                    } else {
                        return checkModelFetchSuccess(req, m);
                    }
                }
            }).then(function(m) {
                if(m) {
                    var afterResult = runHooks(afterHooks.del, [req, res, m]);
                    return afterResult.promise || m;
                }
            }).then(function() {
                sendResponse(res, true);
            }).catch(next);
        });
    }

    function runHooks(fnArray, args) {
        var result;
        for(var i in fnArray) {
            result = fnArray[i].apply(null, args);
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
            getRelated: [],
            create: [],
            update: [],
            del: []
        };
    }

    function createHookFunctions() {
        createHookFunction('beforeGet' + opts.collectionName,
                                'before', 'getCollection');
        createHookFunction('beforeGetRelated' + opts.collectionName,
                                'before', 'getRelated');
        createHookFunction('beforeGet' + opts.modelName, 'before', 'get');
        createHookFunction('beforeCreate' + opts.modelName, 'before', 'create');
        createHookFunction('beforeUpdate' + opts.modelName, 'before', 'update');
        createHookFunction('beforeDelete' + opts.modelName, 'before', 'del');
        createHookFunction('afterGet' + opts.collectionName,
                                'after', 'getCollection');
        createHookFunction('afterGetRelated' + opts.collectionName,
                                'after', 'getRelated');
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
                hooks[opts.endpointName][prefix][type].push(fn);
            };
        } else {
            return function(fn) {
                fn.__name = fnName;
                for(var i in hooks[prefix]) {
                    hooks[opts.endpointName][prefix][i].push(fn);
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

    function getWithRelatedArray(related, req, res) {
        var relArray = [];
        for(var i in related) {
            var r = related[i];
            var relHooks = hooks[r];
            if(relHooks) {
                var relObj = {};
                relObj[r] = function(qb) {
                    runHooks(relHooks.before.getRelated, [req, res, qb]);
                };
                relArray.push(relObj);
            } else {
                relArray.push(r);
            }
        }
        return relArray;
    }

    function getFetchParams(req, res) {
        return req.query.load ? {
                    withRelated: getWithRelatedArray(req.query.load.split(','), req, res)
                } : null;
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