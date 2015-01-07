var bodyParser = require('body-parser');
var Promise = require("bluebird");
var app, options;
var hooks = {};
var modelMap = {};
var identifierMap = {};
var modelNameMap = {};
var collectionNameMap = {};

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

    for(var p in _opts_) {
        if(validOpts[p]) {
            opts[p] = _opts_[p];
        } else {
            throw new Error('Invalid option: ' + p);
        }
    }

    modelMap[opts.endpointName] = model;
    identifierMap[opts.endpointName] = opts.identifier;

    hooks[opts.endpointName] = {
        before: hookArrays(),
        after: hookArrays()
    };

    var beforeHooks = hooks[opts.endpointName].before;
    var afterHooks = hooks[opts.endpointName].after;

    opts.collectionName = opts.collectionName ?
                                capitalize(opts.collectionName) :
                                collectionName(opts.endpointName);
    opts.modelName = opts.modelName ?
                                capitalize(opts.modelName) :
                                modelName(opts.endpointName);

    var modelNameLower = decapitalize(opts.modelName);
    var collectionNameLower = decapitalize(opts.collectionName);

    modelMap[modelNameLower] =
        modelMap[collectionNameLower] = model;
    identifierMap[modelNameLower] =
        identifierMap[collectionNameLower] = opts.identifier;
    modelNameMap[collectionNameLower] = modelNameLower;
    collectionNameMap[modelNameLower] = collectionNameLower;

    hooks[modelNameLower] = hooks[collectionNameLower] = {
        before: hookArrays(),
        after: hookArrays()
    };

    var beforeHooks = hooks[modelNameLower].before;
    var afterHooks = hooks[modelNameLower].after;

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

        app.post(options.apiRoot + opts.endpointName + '/:identifier/:relation',
        function(req, res, next) {
            var rel = req.params.relation;
            var rModel = modelMap[rel];
            var rId = identifierMap[rel];
            var mod = new model(getModelAttrs(req));
            var relMod;

            var beforeResult = runMultiHooks(
                                    [hooks[req.params.relation].before.relate,
                                        [req, res, mod]],
                                    [beforeHooks.relate,
                                        [req, res, mod]]);
            if(res.headersSent) return;

            var promise;
            if(beforeResult.promise) {
                promise = beforeResult.promise;
            } else {
                promise = mod.fetch();
            }

            promise.then(function(m) {
                if(req.body[rId]) {
                    // fetch and add an existing model
                    return (new rModel(req.body)).fetch().then(function(rMod) {
                        if(rMod) {
                            relMod = rMod;
                            var relCollection = m.related(rel);
                            if(relCollection.create) {
                                // for hasMany relations
                                return relCollection.create(rMod);
                            } else {
                                // for belongsTo relations, reverse it
                                return rMod.related(opts.endpointName).create(m);
                            }
                        } else {
                            throw new Error('Create relationship failed: ' +
                                                'Could not find ' + rel +
                                                ' model ' + JSON.stringify(req.body));
                        }
                    });
                } else {
                    throw new Error('Create relationship failed: ' +
                                        rId + ' property not provided');
                }
            }).then(function() {
                var afterResult = runMultiHooks(
                                    [hooks[req.params.relation].after.relate,
                                        [req, res, mod, relMod]],
                                    [afterHooks.relate,
                                        [req, res, mod, relMod]]);
                return afterResult.promise || null;
                return null;
            }).then(function() {
                sendResponse(res, null);
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

        app.delete(options.apiRoot + opts.endpointName + '/:identifier/:relation',
        function(req, res, next) {
            var rel = req.params.relation;
            var mod = new model(getModelAttrs(req));
            mod.fetch().then(function(m) {
                var fKey = m[rel]().relatedData.foreignKey;
                return m.set(fKey, null).save();
            }).then(function() {
                sendResponse(res, true);
            }).catch(next);
        });

        app.delete(options.apiRoot + opts.endpointName + '/:identifier/:relation/:rIdentifier',
        function(req, res, next) {
            var rel = req.params.relation;
            var rModel = modelMap[rel];
            var rId = identifierMap[rel];
            var mod = new model(getModelAttrs(req));
            var relMod;

            mod.fetch().then(function(m) {
                var rModAttrs = {};
                rModAttrs[rId] = req.params.rIdentifier;
                return (new rModel(rModAttrs)).fetch().then(function(rMod) {
                    if(rMod) {
                        var modelName = modelNameMap[opts.endpointName];
                        var fKey = rMod[modelName]().relatedData.foreignKey;
                        return rMod.set(fKey, null).save();
                    } else {
                        throw new Error('Delete relationship failed: ' +
                                                'Could not find ' + rel +
                                                ' model ' + JSON.stringify(rModAttrs));
                    }
                });
            }).then(function() {
                sendResponse(res, true);
            }).catch(next);

        });
    }

    function runMultiHooks() {
        var promiseResults = [];
        for(var i in arguments) {
            var res = runHooks.apply(null, arguments[i]);
            if(res.promise) {
                promiseResults.push(res.promise);
            }
        }
        if(promiseResults.length > 0) {
            var ret = Promise.all(promiseResults).then(function() {
                var args = arguments[0];
                return new Promise(function(resolve) {
                    resolve.apply(null, args);
                });
            });
            return { promise: ret };
        } else {
            return {};
        }
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
            del: [],
            relate: []
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
        createHookFunction('beforeRelate' + opts.modelName, 'before', 'relate');
        createHookFunction('afterGet' + opts.collectionName,
                                'after', 'getCollection');
        createHookFunction('afterGetRelated' + opts.collectionName,
                                'after', 'getRelated');
        createHookFunction('afterGet' + opts.modelName, 'after', 'get');
        createHookFunction('afterCreate' + opts.modelName, 'after', 'create');
        createHookFunction('afterUpdate' + opts.modelName, 'after', 'update');
        createHookFunction('afterDelete' + opts.modelName, 'after', 'del');
        createHookFunction('afterRelate' + opts.modelName, 'after', 'relate');
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

    function decapitalize(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
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