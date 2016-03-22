'use strict';

app.mapViewView = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

// START_CUSTOM_CODE_mapViewView
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_mapViewView
(function(parent) {
    var dataProvider = app.data.testMapView,
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('mapViewViewModel'),
                dataSource = model.get('dataSource');

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },
        flattenLocationProperties = function(dataItem) {
            var propName, propValue,
                isLocation = function(value) {
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
        },
        getLocation = function(options) {
            var dfd = new $.Deferred();

            //Default value for options
            if (options === undefined) {
                options = {
                    enableHighAccuracy: true
                };
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
        },
        setupMap = function() {
            if (!parent.map) {
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
                        dataSource = mapViewViewModel.get('dataSource');

                    dataSource.fetch()
                        .then(function() {
                            var data = dataSource.data();

                            for (var i = 0; i < data.length; i++) {
                                var position = data[i].TestGeopoint;

                                var marker = L.marker([position.latitude, position.longitude], {
                                    uid: data[i].uid
                                }).addTo(parent.map);
                                marker.on("click", function() {
                                    console.log(this.options.uid);
                                });
                            }
                        });

                    parent.map.setView(latlng, 13);
                    L.marker(latlng).addTo(parent.map);

                });
        },
        dataSourceOptions = {
            type: 'everlive',
            transport: {
                typeName: 'TestContetntType',
                dataProvider: dataProvider
            },
            change: function(e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                }
            },
            error: function(e) {
                if (e.xhr) {
                    alert(JSON.stringify(e.xhr));
                }
            },
            schema: {
                model: {
                    fields: {
                        'TestTitle': {
                            field: 'TestTitle',
                            defaultValue: ''
                        },
                    }
                }
            },
            serverFiltering: true,
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        mapViewViewModel = kendo.observable({
            dataSource: dataSource,
            itemClick: function(e) {

                app.mobileApp.navigate('#components/mapViewView/details.html?uid=' + e.dataItem.uid);

            },
            addClick: function() {
                app.mobileApp.navigate('#components/mapViewView/add.html');
            },
            editClick: function() {
                var uid = this.currentItem.uid;
                app.mobileApp.navigate('#components/mapViewView/edit.html?uid=' + uid);
            },
            detailsShow: function(e) {
                var item = e.view.params.uid,
                    dataSource = mapViewViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.TestTitle) {
                    itemModel.TestTitle = String.fromCharCode(160);
                }

                mapViewViewModel.set('currentItem', null);
                mapViewViewModel.set('currentItem', itemModel);
            },
            currentItem: null
        });

    parent.set('addItemViewModel', kendo.observable({
        onShow: function(e) {
            // Reset the form data.
            this.set('addFormData', {
                editableListFormField56c644528aff43ef: '',
            });
        },
        onSaveClick: function(e) {
            var addFormData = this.get('addFormData'),
                dataSource = mapViewViewModel.get('dataSource');

            dataSource.add({
                TestTitle: addFormData.editableListFormField56c644528aff43ef,
            });

            dataSource.one('change', function(e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.sync();
        }
    }));

    parent.set('editItemViewModel', kendo.observable({
        onShow: function(e) {
            var itemUid = e.view.params.uid,
                dataSource = mapViewViewModel.get('dataSource'),
                itemData = dataSource.getByUid(itemUid);

            this.set('itemData', itemData);
            this.set('editFormData', {
                editableListFormFielde4f62c07cd6a9600: itemData.TestTitle,
            });
        },
        onSaveClick: function(e) {
            var editFormData = this.get('editFormData'),
                itemData = this.get('itemData'),
                dataSource = mapViewViewModel.get('dataSource');

            // prepare edit
            itemData.set('TestTitle', editFormData.editableListFormFielde4f62c07cd6a9600);

            dataSource.one('sync', function(e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.one('error', function() {
                dataSource.cancelChanges(itemData);
            });

            dataSource.sync();
        }
    }));

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('mapViewViewModel', mapViewViewModel);
        });
    } else {
        parent.set('mapViewViewModel', mapViewViewModel);
    }

    parent.set('onShow', function(e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null;

        fetchFilteredData(param);

        setupMap();
    });
})(app.mapViewView);

// START_CUSTOM_CODE_mapViewViewModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_mapViewViewModel