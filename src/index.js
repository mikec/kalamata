const bodyParser = require('body-parser');
const Promise = require('bluebird');
const Qs = require('qs');

let app; let
	options;
const hooks = {};
const modelMap = {};
const identifierMap = {};
const modelNameMap = {};
const collectionNameMap = {};

const kalamata = module.exports = function (_app_, _options_) {
	app = _app_;
	options = _options_;

	app.use(bodyParser.json());

	if (!options) options = {};
	if (!options.apiRoot) options.apiRoot = '/';
	else options.apiRoot = '/' + options.apiRoot.replace(/^\/|\/$/g, '') + '/';

	return kalamata;
};

kalamata.expose = function (model, _opts_) {
	const validOpts = {
		identifier: true,
		endpointName: true,
		modelName: true,
		collectionName: true,
	};

	const opts = {};

	for (const p in _opts_) {
		if (validOpts[p]) {
			opts[p] = _opts_[p];
		} else {
			throw new Error('Invalid option: ' + p);
		}
	}

	if (!opts.identifier) opts.identifier = 'id';
	if (!opts.endpointName) opts.endpointName = model.forge().tableName;
	if (!opts.modelName) opts.modelName = capitalize(modelName(model.forge().tableName));
	if (!opts.collectionName) opts.collectionName = collectionName(model.forge().tableName);
	opts.modelName = capitalize(opts.modelName);
	opts.collectionName = capitalize(opts.collectionName);

	modelMap[opts.endpointName] = model;
	identifierMap[opts.endpointName] = opts.identifier;

	hooks[opts.endpointName] = {
		before: hookArrays(),
		after: hookArrays(),
	};

	const beforeHooks = hooks[opts.endpointName].before;
	const afterHooks = hooks[opts.endpointName].after;

	const modelNameLower = decapitalize(opts.modelName);
	const collectionNameLower = decapitalize(opts.collectionName);

	modelMap[modelNameLower] = modelMap[collectionNameLower] = model;
	identifierMap[modelNameLower] = identifierMap[collectionNameLower] = opts.identifier;
	modelNameMap[collectionNameLower] = modelNameLower;
	collectionNameMap[modelNameLower] = collectionNameLower;

	createHookFunctions();
	configureEndpoints();

	function configureEndpoints() {
		app.get(options.apiRoot + opts.endpointName, (req, res, next) => {
			// initialize our DB request.
			let mod = new model();

			if (req.query.where) {
				let where;

				// the query string must be formatted as json.
				try {
					where = parseJSON(req.query.where);
				} catch (err) {
					throw new Error('Could not parse JSON: ' + req.query.where);
				}

				// if the "where" was successfully parsed, we can chain it on to the request.
				if (where) {
					mod = mod.where(where);
				}
			}

			return Promise.resolve().then(() => {
				// If we send page or page_size in the query, we want to limit the query
				if (req.query.page || req.query.page_size) {
					// By default, we return the first page with 100 items
					const { page = 1, page_size = 100 } = req.query;
					const page_number = parseInt(page, 10);
					const page_size_number = parseInt(page_size, 10);

					// Get the number of pages and the number of items
					return mod.clone().count('id').then(total_items => ({
						total_items,
						total_pages: Math.ceil(total_items / page_size_number),
					})).then(({ total_items, total_pages }) => {
						// If the page number is greater than the number of pages, we return an empty array
						// Limit and offset are creating a loop: we will have the first page if we request total_pages + 1
						// We want to avoid this loop to happen
						if (page_number > total_pages) {
							sendResponse(res, []);
							return;
							// If it is the last page, we return only the last elements of the request
							// If we don't do this, we will have some of the first elements in the last page
						} if (page_number === total_pages) {
							const remaining_items = total_items - (page_number - 1) * page_size_number;

							mod = mod.orderBy('id', 'DESC').query(qb => qb.limit(remaining_items).offset((page_number - 1) * page_size_number));
							// otherwise, return the elements of the page requested
						} else {
							mod = mod.orderBy('id', 'DESC').query(qb => qb.limit(page_size_number).offset((page_number - 1) * page_size_number));
						}

						// Add headers in res with links to previous and next pages
						// Add also the number of pages and the number of items per page
						if (!(page_number === 0)) {
							const prev_query = Object.assign({}, req.query);
							// decrement page number.
							prev_query.page_number = page_number - 1;
							// set page size explicitly just to be safe.
							prev_query.page_size_number = page_size_number;

							res.header(
								'x-prev',
								`${req.route.path}?${Qs.stringify(prev_query)}`,
							);
						}
						if (!(page_number === total_pages)) {
							const next_query = Object.assign({}, req.query);
							// increment page number.
							next_query.page_number = page_number + 1;
							// set page size explicitly just to be safe.
							next_query.page_size_number = page_size_number;

							res.header(
								'x-next',
								`${req.route.path}?${Qs.stringify(next_query)}`,
							);
						}
						res.header('x-total-pages', total_pages);
						res.header('x-total-items', total_items);
					});
				}
			}).then(() => {
				if (res.headersSent) return;

				// before hook
				const beforeResult = runHooks(beforeHooks.getCollection, [req, res, mod]);

				return beforeResult.promise || mod.fetchAll(getFetchParams(req, res));
			}).then((collection) => {
				if (res.headersSent) return;

				// after hook
				const afterResult = runHooks(afterHooks.getCollection, [req, res, collection]);

				return afterResult.promise || collection;
			})
				.then((collection) => {
					if (res.headersSent) return;

					// send final response
					sendResponse(res, collection.toJSON());
				})
				.catch(next);
		});

		app.get(options.apiRoot + opts.endpointName + '/:identifier',
			(req, res, next) => {
				const mod = new model(getModelAttrs(req));

				const beforeResult = runHooks(beforeHooks.get, [req, res, mod]);
				if (res.headersSent) return;

				const promise = beforeResult.promise || mod.fetch(getFetchParams(req, res));
				promise.then(m => checkModelFetchSuccess(req, m)).then((m) => {
					const afterResult = runHooks(afterHooks.get, [req, res, m]);
					return afterResult.promise || m;
				}).then((m) => {
					sendResponse(res, m);
				}).catch(next);
			});

		app.get(options.apiRoot + opts.endpointName + '/:identifier/:relation',
			(req, res, next) => {
				const mod = new model(getModelAttrs(req));
				mod.fetch({
					withRelated: getWithRelatedArray([req.params.relation], req, res),
				}).then(m => checkModelFetchSuccess(req, m)).then(m => m.related(req.params.relation)).then((related) => {
					let afterResult = {};
					const relHooks = hooks[req.params.relation];
					if (relHooks) {
						afterResult = runHooks(
							hooks[req.params.relation].after.getRelated,
							[req, res, related, mod],
						);
					}
					return afterResult.promise || related;
				})
					.then((related) => {
						sendResponse(res, related);
					})
					.catch(next);
			});

		app.post(options.apiRoot + opts.endpointName, (req, res, next) => {
			const mod = new model(req.body);

			const beforeResult = runHooks(beforeHooks.create, [req, res, mod]);
			if (res.headersSent) return;

			const promise = beforeResult.promise || mod.save();
			promise.then((m) => {
				if (m) {
					const afterResult = runHooks(afterHooks.create, [req, res, m]);
					return afterResult.promise || m;
				}
			}).then((m) => {
				if (m) {
					sendResponse(res, m.toJSON());
				}
			}).catch(next);
		});

		app.post(options.apiRoot + opts.endpointName + '/:identifier/:relation',
			(req, res, next) => {
				const rel = req.params.relation;
				const rModel = modelMap[rel];
				const rId = identifierMap[rel];
				const mod = new model(getModelAttrs(req));
				let relMod;

				const beforeResult = runMultiHooks(
					[hooks[req.params.relation].before.relate,
						[req, res, mod]],
					[beforeHooks.relate,
						[req, res, mod]],
				);
				if (res.headersSent) return;

				let promise;
				if (beforeResult.promise) {
					promise = beforeResult.promise;
				} else {
					promise = mod.fetch();
				}

				promise.then((m) => {
					if (req.body[rId]) {
						// fetch and add an existing model
						return (new rModel(req.body)).fetch().then((rMod) => {
							if (rMod) {
								relMod = rMod;
								const relCollection = m.related(rel);
								if (relCollection.create) {
									// for hasMany relations
									return relCollection.create(rMod);
								}
								// for belongsTo relations, reverse it
								return rMod.related(opts.endpointName).create(m);
							}
							throw new Error('Create relationship failed: '
                                                + 'Could not find ' + rel
                                                + ' model ' + JSON.stringify(req.body));
						});
					}
					throw new Error('Create relationship failed: '
                                        + rId + ' property not provided');
				}).then(() => {
					const afterResult = runMultiHooks(
						[hooks[req.params.relation].after.relate,
							[req, res, mod, relMod]],
						[afterHooks.relate,
							[req, res, mod, relMod]],
					);
					return afterResult.promise || null;
					return null;
				}).then(() => {
					sendResponse(res, null);
				}).catch(next);
			});

		app.put(options.apiRoot + opts.endpointName + '/:identifier',
			(req, res, next) => {
				new model(getModelAttrs(req)).fetch().then((m) => {
					if (m) m.set(req.body);
					const beforeResult = runHooks(beforeHooks.update, [req, res, m]);
					if (!res.headersSent) {
						if (m) {
							return beforeResult.promise || m.save();
						}
						return checkModelFetchSuccess(req, m);
					}
				}).then((m) => {
					if (m) {
						const afterResult = runHooks(afterHooks.update, [req, res, m]);
						return afterResult.promise || m;
					}
				})
					.then((m) => {
						if (m) {
							sendResponse(res, m.toJSON());
						}
					})
					.catch(next);
			});

		app.delete(options.apiRoot + opts.endpointName + '/:identifier',
			(req, res, next) => {
				new model(getModelAttrs(req)).fetch().then((m) => {
					const beforeResult = runHooks(beforeHooks.del, [req, res, m]);
					if (!res.headersSent) {
						if (m) {
							return beforeResult.promise || m.destroy();
						}
						return checkModelFetchSuccess(req, m);
					}
				}).then((m) => {
					if (m) {
						const afterResult = runHooks(afterHooks.del, [req, res, m]);
						return afterResult.promise || m;
					}
				})
					.then(() => {
						sendResponse(res, true);
					})
					.catch(next);
			});

		app.delete(options.apiRoot + opts.endpointName + '/:identifier/:relation',
			(req, res, next) => {
				const rel = req.params.relation;
				const mod = new model(getModelAttrs(req));
				mod.fetch().then((m) => {
					const fKey = m[rel]().relatedData.foreignKey;
					return m.set(fKey, null).save();
				}).then(() => {
					sendResponse(res, true);
				}).catch(next);
			});

		app.delete(options.apiRoot + opts.endpointName + '/:identifier/:relation/:rIdentifier',
			(req, res, next) => {
				const rel = req.params.relation;
				const rModel = modelMap[rel];
				const rId = identifierMap[rel];
				const mod = new model(getModelAttrs(req));
				let relMod;

				mod.fetch().then((m) => {
					const rModAttrs = {};
					rModAttrs[rId] = req.params.rIdentifier;
					return (new rModel(rModAttrs)).fetch().then((rMod) => {
						if (rMod) {
							const modelName = modelNameMap[opts.endpointName];
							const fKey = rMod[modelName]().relatedData.foreignKey;
							return rMod.set(fKey, null).save();
						}
						throw new Error('Delete relationship failed: '
                                                + 'Could not find ' + rel
                                                + ' model ' + JSON.stringify(rModAttrs));
					});
				}).then(() => {
					sendResponse(res, true);
				}).catch(next);
			});
	}

	function runMultiHooks() {
		const promiseResults = [];
		for (const i in arguments) {
			const res = runHooks.apply(null, arguments[i]);
			if (res.promise) {
				promiseResults.push(res.promise);
			}
		}
		if (promiseResults.length > 0) {
			const ret = Promise.all(promiseResults).then(function () {
				const args = arguments[0];
				return new Promise(((resolve) => {
					resolve.apply(null, args);
				}));
			});
			return { promise: ret };
		}
		return {};
	}

	function runHooks(fnArray, args) {
		let result;
		for (const i in fnArray) {
			result = fnArray[i].apply(null, args);
		}
		if (result && result.then) {
			return {
				promise: result,
			};
		}
		return {};
	}

	function hookArrays() {
		return {
			get: [],
			getCollection: [],
			getRelated: [],
			create: [],
			update: [],
			del: [],
			relate: [],
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
		if (type) {
			return function (fn) {
				fn.__name = fnName;
				hooks[opts.endpointName][prefix][type].push(fn);
			};
		}
		return function (fn) {
			fn.__name = fnName;
			for (const i in hooks[prefix]) {
				hooks[opts.endpointName][prefix][i].push(fn);
			}
		};
	}

	function checkModelFetchSuccess(req, m) {
		if (!m) {
			throw new Error(
				req.method + ' ' + req.url + ' failed: '
                + opts.identifier + ' = ' + req.params.identifier
                + ' not found',
			);
		}
		return m;
	}

	function getModelAttrs(req) {
		let attrs;
		if (req.params.identifier) {
			attrs = {};
			attrs[opts.identifier] = req.params.identifier;
		}
		return attrs;
	}

	function getWithRelatedArray(related, req, res) {
		const relArray = [];
		for (const i in related) {
			const r = related[i];
			var relHooks = hooks[r];
			if (relHooks) {
				const relObj = {};
				relObj[r] = function (qb) {
					if (relHooks) {
						runHooks(relHooks.before.getRelated, [req, res, qb]);
					}
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
			withRelated: getWithRelatedArray(req.query.load.split(','), req, res),
		} : null;
	}

	function sendResponse(response, sendData) {
		if (!response.headersSent) response.send(sendData);
	}

	function collectionName(endpointName) {
		endpointName = capitalize(endpointName);
		endpointName += (endpointName.slice(-1) == 's' ? '' : 'Collection');
		return endpointName;
	}

	function modelName(endpointName) {
		endpointName = (endpointName.slice(-1) == 's'
			? endpointName.substr(0, endpointName.length - 1)
			: endpointName);
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
