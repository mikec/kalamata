describe('initializing', function() {

    beforeEach(function() {
        this.mockApp = new MockApp();
        spyOn(this.mockApp, 'get');
        spyOn(this.mockApp, 'post');
        spyOn(this.mockApp, 'put');
        spyOn(this.mockApp, 'delete');
    })

    describe('with no options', function() {

        beforeEach(function() {
            this.k = requireKalamata()(this.mockApp);
            this.k.expose(MockModel.get('items'));
        });

        runEndpointConfigTests('/items');

    });

    describe('with an apiRoot option', function() {

        beforeEach(function() {
            this.k = requireKalamata()(this.mockApp, { apiRoot: 'api' });
            this.k.expose(MockModel.get('items'));
        });

        runEndpointConfigTests('/api/items');

    });

    describe('with an apiRoot option that has more than one path segment',
    function() {

        beforeEach(function() {
            this.k = requireKalamata()(this.mockApp, { apiRoot: 'api/v1' });
            this.k.expose(MockModel.get('items'));
        });

        runEndpointConfigTests('/api/v1/items');

    });

    describe('with invalid options', function() {

        beforeEach(function() {
            this.k = requireKalamata()(this.mockApp);
            try {
                this.k.expose(MockModel.get('items'), { mocked: 'invalid' });
            } catch(err) {
                this.error = err;
            }
        });

        it('should throw an error', function() {
            expect(this.error.message).toEqual('Invalid option: mocked');
        });

    });

    describe('with a plural table name', function() {

        beforeEach(function() {
            this.k = requireKalamata()(this.mockApp);
            this.k.expose(MockModel.get('items'));
        });

        it('should set hook functions based on table name', function() {
            expect(this.k.beforeGetItems).toBeDefined();
            expect(this.k.beforeGetRelatedItems).toBeDefined();
            expect(this.k.beforeGetItem).toBeDefined();
            expect(this.k.beforeCreateItem).toBeDefined();
            expect(this.k.beforeUpdateItem).toBeDefined();
            expect(this.k.beforeDeleteItem).toBeDefined();
            expect(this.k.afterGetItems).toBeDefined();
            expect(this.k.afterGetRelatedItems).toBeDefined();
            expect(this.k.afterGetItem).toBeDefined();
            expect(this.k.afterCreateItem).toBeDefined();
            expect(this.k.afterUpdateItem).toBeDefined();
            expect(this.k.afterDeleteItem).toBeDefined();
        });

    });

    describe('with a non-plural table name', function() {

        beforeEach(function() {
            this.k = requireKalamata()(this.mockApp);
            this.k.expose(MockModel.get('people'));
        });

        it('should set hook functions based on table name', function() {
            expect(this.k.beforeGetPeopleCollection).toBeDefined();
            expect(this.k.beforeGetRelatedPeopleCollection).toBeDefined();
            expect(this.k.beforeGetPeople).toBeDefined();
            expect(this.k.beforeCreatePeople).toBeDefined();
            expect(this.k.beforeUpdatePeople).toBeDefined();
            expect(this.k.beforeDeletePeople).toBeDefined();
            expect(this.k.afterGetPeopleCollection).toBeDefined();
            expect(this.k.afterGetRelatedPeopleCollection).toBeDefined();
            expect(this.k.afterGetPeople).toBeDefined();
            expect(this.k.afterCreatePeople).toBeDefined();
            expect(this.k.afterUpdatePeople).toBeDefined();
            expect(this.k.afterDeletePeople).toBeDefined();
        });

    });

    describe('with custom model and collection names', function() {

        beforeEach(function() {
            this.k = requireKalamata()(this.mockApp);
            this.k.expose(MockModel.get('people'), {
                modelName: 'person',
                collectionName: 'people'
            });
        });

        it('should set hook functions based on table name', function() {
            expect(this.k.beforeGetPeople).toBeDefined();
            expect(this.k.beforeGetRelatedPeople).toBeDefined();
            expect(this.k.beforeGetPerson).toBeDefined();
            expect(this.k.beforeCreatePerson).toBeDefined();
            expect(this.k.beforeUpdatePerson).toBeDefined();
            expect(this.k.beforeDeletePerson).toBeDefined();
            expect(this.k.afterGetPeople).toBeDefined();
            expect(this.k.afterGetRelatedPeople).toBeDefined();
            expect(this.k.afterGetPerson).toBeDefined();
            expect(this.k.afterCreatePerson).toBeDefined();
            expect(this.k.afterUpdatePerson).toBeDefined();
            expect(this.k.afterDeletePerson).toBeDefined();
        });

    });

    describe('with an apiRoot option that has a leading and trailing slash',
    function() {

        beforeEach(function() {
            this.k = requireKalamata()(this.mockApp, { apiRoot: '/api/' });
            this.k.expose(MockModel.get('items'));
        });

        runEndpointConfigTests('/api/items');

    });

    function runEndpointConfigTests(endpointPath) {

        it('should configure get endpoint for collection', function() {
            expect(this.mockApp.get.calls.argsFor(0)[0]).toEqual(endpointPath);
        });

        it('should configure get endpoint for single item', function() {
            expect(this.mockApp.get.calls.argsFor(1)[0])
                .toEqual(endpointPath + '/:identifier');
        });

        it('should configure post endpoint for collection', function() {
            expect(this.mockApp.post.calls.argsFor(0)[0]).toEqual(endpointPath);
        });

        it('should configure put endpoint for single item', function() {
            expect(this.mockApp.put.calls.argsFor(0)[0])
                .toEqual(endpointPath + '/:identifier');
        });

        it('should configure delete endpoint for single item', function() {
            expect(this.mockApp.delete.calls.argsFor(0)[0])
                .toEqual(endpointPath + '/:identifier');
        });

    }

});