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
        endpointName: true
    };

    var hooks = {
        before: hookArrays(),
        after: hookArrays()
    };

    var opts = {};
    for(var p in _opts_) {
        if(validOpts[p]) {
            opts[p] = _opts_[p];
        } else {
            throw new Error(
                'Invalid option for endpoint ' +
                opts.endpointName + ': ' + p
            );
        }
    }
    if(!opts.identifier) opts.identifier = 'id';
    if(!opts.endpointName) opts.endpointName = model.forge().tableName;

    var chainer = {};
    addHookChainers('before', chainer);
    addHookChainers('after', chainer);

    configureEndpoints();

    function configureEndpoints() {

        app.get(options.apiRoot + opts.endpointName, function(req, res) {
            var err = runHooks(hooks.before.getCollection, [req, res], res);
            if(err) return;
            var promise;
            if(req.query.where) {
                var w;
                try {
                    w = parseJSON(req.query.where);
                } catch(err) {
                    console.log(err.stack);
                    res.send('Error parsing JSON. \'' +
                                req.query.where + '\' is not valid JSON');
                    return;
                }
                promise = new model().where(w).fetchAll();
            } else {
                promise = new model().fetchAll();
            }
            promise.then(function(collection) {
                var err = runHooks(
                            hooks.after.getCollection,
                            [collection, req, res],
                            res
                        );
                if(err) return;
                res.send(collection);
            }).catch(function(error) {
                console.log(error.stack);
                res.send('Error getting ' + opts.endpointName);
            });
        });

        app.get(options.apiRoot + opts.endpointName + '/:identifier',
        function(req, res) {
            var err = runHooks(
                        hooks.before.get,
                        [req.params.identifier, req, res],
                        res
                    );
            if(err) return;
            var modelAttrs = {};
            modelAttrs[opts.identifier] = req.params.identifier;
            new model(modelAttrs).fetch().then(function(m) {
                if(!m) {
                    throw new Error(
                        'Error getting ' + opts.endpointName + '. ' +
                        opts.identifier + ' = ' + req.params.identifier +
                        ' not found'
                    );
                }
                var err = runHooks(hooks.after.get, [m, req, res], res);
                if(err) return;
                res.send(m);
            }).catch(function(error) {
                console.log(error.stack);
                res.send('Error getting ' + opts.endpointName);
            });
        });

        app.post(options.apiRoot + opts.endpointName, function(req, res) {
            var err = runHooks(hooks.before.create, [req.body, req, res], res);
            if(err) return;
            new model(req.body).save().then(function(m) {
                var err = runHooks(hooks.after.create, [m, req, res], res);
                if(err) return;
                var resData = {};
                resData[opts.identifier] = m.get(opts.identifier);
                res.send(resData);
            }).catch(function(error) {
                console.log(error.stack);
                res.send(
                    'Error saving ' + opts.endpointName + ' ' +
                    JSON.stringify(req.body)
                );
            });
        });

        app.put(options.apiRoot + opts.endpointName + '/:identifier',
        function(req, res) {
            var err = runHooks(
                        hooks.before.update,
                        [req.params.identifier, req.body, req, res],
                        res
                    );
            if(err) return;
            var modelAttrs = {};
            modelAttrs[opts.identifier] = req.params.identifier;
            new model(modelAttrs).fetch().then(function(m) {
                if(!m) {
                    throw new Error(
                        'Error updating ' + opts.endpointName + '. ' +
                        opts.identifier + ' = ' + req.params.identifier +
                        ' not found'
                    );
                }
                return m.save(req.body, {patch: true});
            })
            .then(function(m) {
                var err = runHooks(hooks.after.update, [m, req, res], res);
                if(err) return;
                res.send(true);
            }).catch(function(error) {
                console.log(error.stack);
                res.send('Error getting ' + opts.endpointName);
            });
        });

        app.delete(options.apiRoot + opts.endpointName + '/:identifier',
        function(req, res) {
            var err = runHooks(
                        hooks.before.del,
                        [req.params.identifier, req, res],
                        res
                    );
            if(err) return;
            var modelAttrs = {};
            modelAttrs[opts.identifier] = req.params.identifier;
            new model(modelAttrs).fetch().then(function(m) {
                if(!m) {
                    throw new Error(
                        'Error deleting ' + opts.endpointName + '. ' +
                        opts.identifier + ' = ' + req.params.identifier +
                        ' not found'
                    );
                }
                return m.destroy();
            })
            .then(function() {
                var err = runHooks(hooks.after.del, [req, res], res);
                if(err) return;
                res.send(true);
            }).catch(function(error) {
                console.log(error.stack);
                res.send('Error deleting ' + opts.endpointName);
            });
        });
    }

    function runHooks(fnArray, params, res) {
        try {
            for(var i in fnArray) {
                fnArray[i].apply(null, params);
            }
        } catch(err) {
            console.log(err.stack);
            res.send('Error getting ' + opts.endpointName);
            return true;
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

    function addHookChainers(prefix, chainerObj) {
        chainerObj[prefix] = hookFn(prefix);
        chainerObj[prefix + 'Get'] = hookFn(prefix, 'get');
        chainerObj[prefix + 'GetCollection'] = hookFn(prefix, 'getCollection');
        chainerObj[prefix + 'Create'] = hookFn(prefix, 'create');
        chainerObj[prefix + 'Update'] = hookFn(prefix, 'update');
        chainerObj[prefix + 'Delete'] = hookFn(prefix, 'del');
    }

    function hookFn(prefix, type) {
        if(type) {
            return function(fn) {
                hooks[prefix][type].push(fn);
                return chainer;
            };
        } else {
            return function(fn) {
                for(var i in hooks[prefix]) {
                    hooks[prefix][i].push(fn);
                }
                return chainer;
            };
        }
    }

    function parseJSON(str) {
        return JSON.parse(fixJSONString(str));
    }

    function fixJSONString(str) {
        return str.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
    }

    return chainer;

};