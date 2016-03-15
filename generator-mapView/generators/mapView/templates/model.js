(function (parent){
    var dataProvider = app.data.<%= dataProvider %>,
        fetchFilteredData = function (paramFilter, searchFilter) {
            var model = parent.get('<%= name %>'),
                dataSource = model.get('dataSource');

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if(paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },<% if ((typeof imageField !== 'undefined' && imageField) || (typeof detailImageField !== 'undefined' && detailImageField)) { %>
        processImage = function(img) {
            if (!img) {
                var empty1x1png= 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII=';
                img = 'data:image/png;base64,' + empty1x1png;
            }<% if (source === 'everlive') { %> else if (img.slice(0, 4) !== 'http' &&
                    img.slice(0, 2) !== '//' && img.slice(0, 5) !== 'data:') {
                var setup = dataProvider.setup || {};
                img = setup.scheme + ':' + setup.url + setup.<%= _isApp ? 'appId' : 'apiKey' %> + '/Files/' + img + '/Download';
            }<% } %>

            return img;
        }, <% } %> <% if (source === 'everlive') { %>
        flattenLocationProperties = function (dataItem) {
            var propName, propValue,
                isLocation = function (value) {
                    return propValue && typeof propValue === 'object' &&
                        propValue.longitude && propValue.latitude;
                };

            for (propName in dataItem) {
                if (dataItem.hasOwnProperty(propName)) {
                    propValue = dataItem[propName];
                    if (isLocation(propValue)) {
                        dataItem[propName] =
                            kendo.format('Latitude: {0}, Longitude: {1}',
                                propValue.latitude, propValue.longitude);
                    }
                }
            }
        },<% } %><% if (source === 'jsdo') { %>
        jsdoOptions = {
            name: '<%= collection %>',
            autoFill : false
        },<% } %>
        dataSourceOptions = {
        type: '<%= source %>',
        transport: {<% if (source === 'everlive') { %>
            typeName: '<%= collection %>',
            dataProvider: dataProvider<% } else if (source === 'sitefinity') { %>
                urlName: '<%= collection %>',<% if (typeof collectionProvider !== 'undefined' && collectionProvider) { %>
                providerName: '<%= collectionProvider %>',<% } %>
                dataProvider: dataProvider,<% } else if (source !== 'jsdo') { %>
            read: {
                url: dataProvider.url
            }<% } %>
        },<% if ((typeof group !== 'undefined' && group) && !endlessScroll) { %>
        group: { field: '<%= group %>' },<% } %><% if ((typeof imageField !== 'undefined' && imageField) || source === 'everlive') { %>
        change: function(e){
            var data = this.data();
            for (var i = 0; i < data.length; i++) {
                var dataItem = data[i];
                <% if (typeof imageField !== 'undefined' && imageField) { %>
                dataItem['<%= imageField %>Url'] =
                    processImage(dataItem['<%= imageField %>']);
                <% } %>
            }
        },<% } %>
        error: function (e) {
            if (e.xhr) {
                alert(JSON.stringify(e.xhr));
            }
        },
        schema: {<% if (source === 'json') { %>
            data: '<%= collection %>',<% } %>
            model: {
                fields: {<% var usedFields = {};
                    for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (f && !usedFields[f]) { %>
                    '<%= f %>': {
                        field: '<%= f %>',
                        defaultValue: ''
                    }, <% }
                    usedFields[f] = true;
                    } %>
                }<% if (typeof iconField !== 'undefined' && iconField) { %>
                    ,icon: function() {
                      var i = 'globe';
                      return kendo.format('km-icon km-{0}', i);
                    }<% } %>
            }
        },
        serverFiltering: true,<% if (typeof endlessScroll !== 'undefined' && endlessScroll) { %>
        serverSorting: true,
        serverPaging: true,
        pageSize: 50<% } %>
        },
        dataSource = new kendo.data.DataSource(<% if (source !== 'jsdo') { %>dataSourceOptions<% } else { %>{ pageSize: 50 }<% } %>),
        <%= name %> = kendo.observable({
            dataSource: dataSource<% if (source === 'jsdo') { %>,
            _dataSourceOptions: dataSourceOptions,
            _jsdoOptions: jsdoOptions<% } %>,<% if (typeof filterField !== 'undefined' && filterField) { %>
            searchChange: function (e) {
                var searchVal = e.target.value,
                    searchFilter;

                if(searchVal) {
                searchFilter = {field: '<%= filterField %>', operator: 'contains', value: searchVal};
            }
                fetchFilteredData(<%= name%>.get('paramFilter'), searchFilter);
            },<% } %>
            itemClick: function (e) {
                <% if (typeof itemActionView !== 'undefined' && itemActionView && typeof itemActionPrimaryKey !== 'undefined' && itemActionPrimaryKey && typeof itemActionSecondaryKey !== 'undefined' && itemActionSecondaryKey) { %>
                    app.mobileApp.navigate('components/<%= itemActionView %>/view.html?filter=' + encodeURIComponent(JSON.stringify({field: '<%= itemActionSecondaryKey %>', value : e.dataItem.<%= itemActionPrimaryKey %>, operator: 'eq'})));
                <% } else { %>
                    app.mobileApp.navigate('#components/<%= parent %>/details.html?uid=' + e.dataItem.uid);
                <% } %>
            },<% if (addItemForm) { %>
            addClick: function () {
                app.mobileApp.navigate('#components/<%= parent %>/add.html');
            },<% } %><% if (editItemForm) { %>
            editClick: function () {
                var uid = this.currentItem.uid;
                app.mobileApp.navigate('#components/<%= parent %>/edit.html?uid=' + uid);
            },<% } %><% if (deleteItemButton) { %>
            deleteClick: function () {
                var dataSource = <%= name %>.get('dataSource'),
                    that = this;

                navigator.notification.confirm(
                    "Are you sure you want to delete this item?",
                    function( index ) {
                        //'OK' is index 1
                        //'Cancel' - index 2
                        if(index === 1) {
                            dataSource.remove(that.currentItem);

                            dataSource.one('sync', function() {
                                app.mobileApp.navigate('#:back');
                            });

                            dataSource.one('error', function() {
                                dataSource.cancelChanges();
                            });

                            dataSource.sync();
                        }
                    },
                    '',
                    [ "OK", "Cancel" ]
                );
            },<% } %>
            detailsShow: function(e) {
                var item = e.view.params.uid,
                    dataSource = <%= name %>.get('dataSource'),
                    itemModel = dataSource.getByUid(item);<% if (typeof detailImageField !== 'undefined' && detailImageField) { %>
                itemModel.<%= detailImageField %>Url = processImage(itemModel.<%= detailImageField %>);<% } %>

                if (!itemModel.<%= (typeof detailHeaderField !== 'undefined' && detailHeaderField) || headerField || '_no_header_specified_' %>) {
                    itemModel.<%= (typeof detailHeaderField !== 'undefined' && detailHeaderField) || headerField || '_no_header_specified_' %> = String.fromCharCode(160);
                }

                <%= name %>.set('currentItem', null);
                <%= name %>.set('currentItem', itemModel);
            },
            currentItem: null
        });

    <% if (addItemForm) { %>parent.set('addItemViewModel', kendo.observable({
        onShow: function (e) {
            // Reset the form data.
            this.set('addFormData', {
            });
        },
        onSaveClick: function (e) {
            var addFormData = this.get('addFormData'),
                dataSource = <%= name %>.get('dataSource');

            dataSource.add({
            });

            dataSource.one('change', function (e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.sync();
        }
    }));<% } %>

    <% if (editItemForm) { %>parent.set('editItemViewModel', kendo.observable( {
        onShow: function (e) {
            var itemUid = e.view.params.uid,
                dataSource = <%= name %>.get('dataSource'),
                itemData = dataSource.getByUid(itemUid);

            this.set('itemData', itemData);
            this.set('editFormData', {
            });
        },
        onSaveClick: function (e) {
            var editFormData = this.get('editFormData'),
                itemData = this.get('itemData'),
                dataSource = <%= name %>.get('dataSource');

            // prepare edit

            dataSource.one('sync', function (e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.one('error', function () {
                dataSource.cancelChanges(itemData);
            });

            dataSource.sync();
        }
    }));<% } %>

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('<%= name %>', <%= name %>);
        });
    } else {
        parent.set('<%= name %>', <%= name %>);
    }
						  
	var getLocation = function(options) {
		var dfd = new $.Deferred();

		//Default value for options
		if (options === undefined) {
			options = {enableHighAccuracy: true};
		}

		navigator.geolocation.getCurrentPosition(
			function(position) { 
				dfd.resolve(position);
			}, 
			function(error) {
				dfd.reject(error);
			}, 
			options);

		return dfd.promise();
	}

    parent.set('onShow', function (e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null;

        <% if (source === 'jsdo') { %>dataProvider.loadCatalogs().then(function _catalogsLoaded() {
            var jsdoOptions = <%= name %>.get('_jsdoOptions'),
            jsdo = new progress.data.JSDO(jsdoOptions),
            dataSourceOptions = <%= name %>.get('_dataSourceOptions'),
            dataSource;

            dataSourceOptions.transport.jsdo = jsdo;
            dataSource = new kendo.data.DataSource(dataSourceOptions);
            <%= name %>.set('dataSource', dataSource);
            fetchFilteredData(param);
        });<% } else { %> fetchFilteredData(param); <% } %>
			
		if(!parent.map){
			 parent.map = L.map('map');

            L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}', {
                type: 'map',
                ext: 'jpg',
                attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                subdomains: '1234'
            }).addTo(parent.map);
		}

        getLocation()
			.then(function(position) {
            	var latlng = L.latLng(position.coords.latitude, position.coords.longitude),
					dataSource = <%= name %>.get('dataSource');
						
				dataSource.fetch()
					.then(function(){
						var data = dataSource.data();
					
						for(var i=0; i < data.length; i++){
							var position = data[i].<%= positionField %>
						}
					});
				
			
				parent.map.setView(latlng, 13);
            	L.marker(latlng).addTo( parent.map);
			
				
        	});
    });
})(app.<%= parent %>);

// START_CUSTOM_CODE_<%= name %>
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

<% if (source === 'jsdo') { %>    // you can handle the beforeFill / afterFill events here. For example:
    /*
    app.<%= parent %>.<%= name %>.get('_jsdoOptions').events = {
        'beforeFill' : [ {
            scope : app.<%= parent %>.<%= name %>,
            fn : function (jsdo, success, request) {
                // beforeFill event handler statements ...
            }
        } ]
    };
    */
<% } %>// END_CUSTOM_CODE_<%= name %>
