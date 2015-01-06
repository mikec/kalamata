describe('POST request to create a relation', function() {

    beforeEach(function() {
        var $this = this;

        this.mockApp = new MockApp();
        this.k = requireKalamata()(this.mockApp);

        this.mockCollection = {
            create: function() {}
        };
        this.mockModel = MockModel.get('items', {
            related: function() {
                return $this.mockCollection
            }
        });
        this.mockRelModel = MockModel.get('things');
        this.mockResponse = new MockResponse();

        this.mockRequestOptions = {
            body: { id: 1 },
            params: { relation: 'things' }
        }
    });

    describe('to an existing model', function() {

        beforeEach(function() {
            this.k.expose(this.mockModel);
            this.k.expose(this.mockRelModel);
            spyOn(this.mockCollection, 'create');
            spyOn(this.mockResponse, 'send');
            var fn = this.mockApp.postHandlers['/items/:identifier/:relation'];
            fn(new MockRequest(this.mockRequestOptions), this.mockResponse);
        });

        it('should call create on the related collection ', function() {
            expect(this.mockCollection.create).toHaveBeenCalled();
        });

        it('should pass the existing related model to the create call',
        function() {
            expect(this.mockCollection.create.calls.argsFor(0)[0])
                    .toBe(this.mockRelModel.modelInstances[0]);
        });

        it('should send a response', function() {
            expect(this.mockResponse.send).toHaveBeenCalled();
        });

    });

    describe('to an new model', function() {

        beforeEach(function() {
            var $this = this;
            this.mockFetchPromise = new MockPromise([{
                related: function() {}
            }]);
            this.mockModel = MockModel.get('items', {
                fetch: function() {
                    return $this.mockFetchPromise;
                }
            });
            this.k.expose(this.mockModel);
            this.k.expose(this.mockRelModel);
            this.mockBody = {};
            spyOn(this.mockCollection, 'create');
            spyOn(this.mockResponse, 'send');
            var fn = this.mockApp.postHandlers['/items/:identifier/:relation'];
            this.mockRequestOptions.body = this.mockBody;
            fn(new MockRequest(this.mockRequestOptions), this.mockResponse);
        });

        it('should not call create on the related collection ', function() {
            expect(this.mockCollection.create).not.toHaveBeenCalled();
        });

        it('should not send a response', function() {
            expect(this.mockResponse.send).not.toHaveBeenCalled();
        });

        it('should throw an error', function() {
            expect(this.mockFetchPromise.thrownError.message)
                            .toBe('Create relationship failed: ' +
                                    'id property not provided');
        });

    });

    describe('to an existing model that is not found', function() {

        beforeEach(function() {
            var $this = this;
            this.mockFetchPromise = new MockPromise([null]);
            this.mockRelModel = MockModel.get('things', {
                fetch: function() {
                    return $this.mockFetchPromise;
                }
            });
            this.k.expose(this.mockModel);
            this.k.expose(this.mockRelModel);
            spyOn(this.mockCollection, 'create');
            spyOn(this.mockResponse, 'send');
            var fn = this.mockApp.postHandlers['/items/:identifier/:relation'];
            fn(new MockRequest(this.mockRequestOptions), this.mockResponse);
        });

        it('should not call create on the related collection', function() {
            expect(this.mockCollection.create).not.toHaveBeenCalled();
        });

        it('should throw an error', function() {
            expect(this.mockFetchPromise.thrownError.message)
                            .toBe('Create relationship failed: ' +
                                    'Could not find things model {"id":1}');
        });

        it('should not send a response', function() {
            expect(this.mockResponse.send).not.toHaveBeenCalled();
        });

    });


    describe('with a before hook', function() {

        describe('that returns nothing', function() {

            beforeEach(function() {
                var $this = this;
                this.k.expose(this.mockModel);
                this.k.expose(this.mockRelModel);
                this.relHookCalled;
                this.k.beforeRelateThing(function() {
                    $this.relHookCalled = true;
                });
                spyOn(this.mockResponse, 'send');
                var fn = this.mockApp.postHandlers['/items/:identifier/:relation'];
                fn(new MockRequest(this.mockRequestOptions), this.mockResponse);
            });

            it('should call the hook function', function() {
                expect(this.relHookCalled).toBeTruthy();
            });

            it('should send a response', function() {
                expect(this.mockResponse.send).toHaveBeenCalled();
            });

        });

        describe('that throws an error', function() {

            beforeEach(function() {
                var $this = this;
                this.k.expose(this.mockModel);
                this.k.expose(this.mockRelModel);
                this.mockErr;
                this.k.beforeRelateThing(function() {
                    throw new Error('mock error');
                });
                spyOn(this.mockResponse, 'send');
                var fn = this.mockApp.postHandlers['/items/:identifier/:relation'];
                try {
                    fn(new MockRequest(this.mockRequestOptions), this.mockResponse);
                } catch(err) {
                    this.mockErr = err;
                }
            });

            it('should call the hook function', function() {
                expect(this.mockErr.message).toBe('mock error');
            });

            it('should not send a response', function() {
                expect(this.mockResponse.send).not.toHaveBeenCalled();
            });

        });

    });

    describe('with a before hook on the base model', function() {

        describe('that returns nothing', function() {

            beforeEach(function() {
                var $this = this;
                this.k.expose(this.mockModel);
                this.k.expose(this.mockRelModel);
                this.relHookCalled;
                this.k.beforeRelateItem(function() {
                    $this.relHookCalled = true;
                });
                spyOn(this.mockResponse, 'send');
                var fn = this.mockApp.postHandlers['/items/:identifier/:relation'];
                fn(new MockRequest(this.mockRequestOptions), this.mockResponse);
            });

            it('should call the hook function', function() {
                expect(this.relHookCalled).toBeTruthy();
            });

            it('should send a response', function() {
                expect(this.mockResponse.send).toHaveBeenCalled();
            });

        });

    });

    describe('with an after hook', function() {

        describe('that returns nothing', function() {

            beforeEach(function() {
                var $this = this;
                this.k.expose(this.mockModel);
                this.k.expose(this.mockRelModel);
                this.relHookCalled;
                this.k.afterRelateThing(function() {
                    $this.relHookCalled = true;
                });
                spyOn(this.mockResponse, 'send');
                var fn = this.mockApp.postHandlers['/items/:identifier/:relation'];
                fn(new MockRequest(this.mockRequestOptions), this.mockResponse);
            });

            it('should call the hook function', function() {
                expect(this.relHookCalled).toBeTruthy();
            });

            it('should send a response', function() {
                expect(this.mockResponse.send).toHaveBeenCalled();
            });

        });

    });

    describe('with an after hook on the base model', function() {

        describe('that returns nothing', function() {

            beforeEach(function() {
                var $this = this;
                this.k.expose(this.mockModel);
                this.k.expose(this.mockRelModel);
                this.relHookCalled;
                this.k.afterRelateItem(function() {
                    $this.relHookCalled = true;
                });
                spyOn(this.mockResponse, 'send');
                var fn = this.mockApp.postHandlers['/items/:identifier/:relation'];
                fn(new MockRequest(this.mockRequestOptions), this.mockResponse);
            });

            it('should call the hook function', function() {
                expect(this.relHookCalled).toBeTruthy();
            });

            it('should send a response', function() {
                expect(this.mockResponse.send).toHaveBeenCalled();
            });

        });

    });

});