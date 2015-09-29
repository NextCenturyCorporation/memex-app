'use strict';

// TODO: clean this controller.  loading was being used
// by two $watch handlers.

angular.module('digApp')
.constant('MainConstants', {
  'FILTER_TAB': '#filter',
  'FOLDERS_TAB': '#folders'
})
.controller('MainCtrl', ['$scope', '$state', '$modal', '$location', 'imageSearchService', 'euiSearchIndex', 'euiConfigs', 'MainConstants', '$http',
    function($scope, $state, $modal, $location, imageSearchService, euiSearchIndex, euiConfigs, MainConstants, $http) {

    $scope.FILTER_TAB = MainConstants.FILTER_TAB;
    $scope.FOLDERS_TAB = MainConstants.FOLDERS_TAB;
    $scope.searchConfig = {};
    $scope.searchConfig.filterByImage = false;
    $scope.searchConfig.euiSearchIndex = '';
    $scope.imageSearchResults = {};
    $scope.loading = false;
    $scope.imagesimLoading = false;
    $scope.euiConfigs = euiConfigs;
    $scope.facets = euiConfigs.facets;
    $scope.notificationHasRun = true;
    $scope.displayImageBreadcrumb = false;
    

    // All the folders created with child folders within their parents.
    // Each folder only has the name, id, parentId, and an array of children
    $scope.nestedFolders = [];

    // All the folders created in a flat list.
    // Each folder only has the name, id, and parentId
    $scope.folders = [];

    $scope.selectedFolder = {};

    // Each key is the id of a folder that was selected (or $scope.FILTER_TAB to represent the search results)
    // Each value contains an array of ids of items that are selected in the folder (or search results)
    $scope.selectedItems = {};

    // Each key is the id of a folder that was selected
    // Each value contains an array of ids of sub-folders that are selected in the folder
    $scope.selectedChildFolders = {};

    $scope.selectedItemsKey = $scope.FILTER_TAB;

    // Valid folders that items can be moved to (contains objects of names and ids)
    $scope.validMoveFolders = [];

    $scope.activeTab = '';
    $scope.tabChange = false;

    $scope.tabs = [
    {
        'title': 'Filter',
        'link': $scope.FILTER_TAB
    }, {
        'title': 'Folders',
        'link': $scope.FOLDERS_TAB
    }];


    $scope.init = function() {
        $scope.showresults = false;
        $scope.queryString = {
            live: '', submitted: ''
        };
        $scope.filterStates = {
            aggFilters: {},
            textFilters: {},
            dateFilters: {}
        };
        $scope.includeMissing = {
            aggregations: {},
            allIncludeMissing: false
        };

        $scope.selectedSort = {};
        $scope.selectedFolderSort = {};
        $scope.selectedFolderSortOptions = angular.copy($scope.euiConfigs);
        _.remove($scope.selectedFolderSortOptions.sort.options, {order: 'rank', title: 'Best Match'});

        $scope.selectedItems[$scope.selectedItemsKey] = [];
        $scope.selectedChildFolders[$scope.selectedItemsKey] = [];

        $scope.getFolders();
        $scope.isActive();

        if($state.params && $state.params.query) {


            if($state.params.query.digState.searchTerms) {
                $scope.queryString.live = $state.params.query.digState.searchTerms;
            }

            if($state.params.query.digState.filters) {
                if($state.params.query.digState.filters.aggFilters) {
                    $scope.filterStates.aggFilters = _.cloneDeep($state.params.query.digState.filters.aggFilters);
                }

                if($state.params.query.digState.filters.textFilters) {
                    $scope.filterStates.textFilters = _.cloneDeep($state.params.query.digState.filters.textFilters);
                }

                if($state.params.query.digState.filters.dateFilters) {
                    $scope.filterStates.dateFilters = _.cloneDeep($state.params.query.digState.filters.dateFilters);
                }

                if($state.params.query.digState.filters.withImagesOnly) {
                    $scope.filterStates.withImagesOnly = $state.params.query.digState.filters.withImagesOnly;
                }
            }

            if($state.params.query.digState.includeMissing) {
                if($state.params.query.digState.includeMissing.allIncludeMissing) {
                    $scope.includeMissing.allIncludeMissing = $state.params.query.digState.includeMissing.allIncludeMissing;
                }
                
                if($state.params.query.digState.includeMissing.aggregations) {
                    $scope.includeMissing.aggregations = _.cloneDeep($state.params.query.digState.includeMissing.aggregations);
                }
            }
            
            if($state.params.query.notificationHasRun === false) {
                $scope.notificationHasRun = $state.params.query.notificationHasRun;
                $scope.notificationLastRun = new Date($state.params.query.lastRunDate);  
                $http.put('api/queries/' + $state.params.query.id, {lastRunDate: new Date(), notificationHasRun: true});
            } else if($state.params.query.digState.selectedSort) {
                $scope.selectedSort = _.cloneDeep($state.params.query.digState.selectedSort);
            }

            $scope.$on('$locationChangeSuccess', function() {
                if($state.current.name === 'main.search.results.list' && $scope.showresults === false) {
                    $scope.submit();
                }
            });

            if($state.params.callSubmit && $state.current.name === 'main.search.results.list' && $scope.showresults === false) {
                $scope.submit();
            }
        }
    };

    $scope.clearNotification = function() {
        if($state.params.query && $scope.notificationHasRun === false && $scope.notificationLastRun) {
            $scope.notificationLastRun = null;
            $scope.notificationHasRun = true;
        }
    };

    $scope.submit = function() {
        if($state.params.query && $scope.queryString.live !== $state.params.query.digState.searchTerms) {
            $scope.clearNotification();
        }
        $scope.selectedItems[$scope.selectedItemsKey] = [];
        $scope.selectedChildFolders[$scope.selectedItemsKey] = [];
        $scope.queryString.submitted = $scope.queryString.live;
        if(!$scope.searchConfig.euiSearchIndex) {
            $scope.searchConfig.euiSearchIndex = euiSearchIndex;
        }
        $scope.viewList();
    };

    $scope.setAllIncludeMissing = function() {
        $scope.includeMissing.allIncludeMissing = !$scope.includeMissing.allIncludeMissing;
        for(var aggregation in $scope.includeMissing.aggregations) {
            $scope.includeMissing.aggregations[aggregation].active = $scope.includeMissing.allIncludeMissing;
        }
    };

    $scope.viewList = function() {
        $scope.activeTab = $scope.FILTER_TAB;
        $state.go('main.search.results.list');
    };

    $scope.getActiveImageSearch = function() {
        return imageSearchService.getActiveImageSearch();
    };

    $scope.toggleImageSearchEnabled = function(searchUrl) {
        imageSearchService.setImageSearchEnabled(searchUrl, !imageSearchService.isImageSearchEnabled(searchUrl));
        $scope.displayImageBreadcrumb = !$scope.displayImageBreadcrumb;
    };

    $scope.clearActiveImageSearch = function() {
        $scope.searchConfig.filterByImage = false;
        imageSearchService.clearActiveImageSearch();
    };

    $scope.imageSearch = function(imgUrl) {
        $scope.displayImageBreadcrumb = true;
        imageSearchService.imageSearch(imgUrl);
    };

    // Updates which tab is active
    $scope.isActive = function() {
        var path = $location.path();

        if(path === '/search') {
            $scope.activeTab = $scope.FILTER_TAB;
            return true;
        } else if(path === '/folder') {
            $scope.activeTab = $scope.FOLDERS_TAB;
            return true;
        }

        return false;
    };

    $scope.changeTab = function(link) {
        $scope.selectedFolder = {};
        $scope.validMoveFolders = [];
        $scope.tabChange = true;

        if(link === $scope.FILTER_TAB) {
            $scope.selectedItemsKey = $scope.FILTER_TAB;
            $scope.selectedFolderSort = {};
            $scope.viewList();
        } else {
            $scope.activeTab = $scope.FOLDERS_TAB;
        }
    };

    // Returns array of valid folders the selected folder (if any) can move to.
    // A folder can move to to anything but itself and any children (recursively)
    $scope.retrieveValidMoveFolders = function() {
        if($scope.selectedFolder.id) {
            var validFolders = [];

            // Push ROOT on first since a folder can always move to it
            validFolders.push({name: $scope.rootFolder.name, id: $scope.rootFolder.id});

            // Take out itself and all children from the list of valid folders
            validFolders = _filterOutChildren($scope.nestedFolders, $scope.selectedFolder.id, validFolders);

            return validFolders;
        }

        return [];
    };

    // Moves selected folder to given folder
    $scope.moveFolder = function(parentFolder) {
        $http.put('api/users/reqHeader/folders/' + $scope.selectedFolder.id,
        {name: $scope.selectedFolder.name, parentId: parentFolder.id}).success(function() {
            $scope.getFolders();
        });
    };

    // Selects/Deselects folder and changes to folder view
    $scope.select = function(folder, event) {
        // Change active tab so folder view shows
        $scope.activeTab = $scope.FOLDERS_TAB;
        $state.go('main.folder.results.list');
        $scope.selectedFolderSort = _.cloneDeep($scope.euiConfigs.sort.folderOption);

        // Select/Deselect folder and update folders able to move to
        if(!$scope.selectedFolder.id) {
            $scope.selectedFolder = angular.copy(folder);
            $scope.selectedItemsKey = $scope.selectedFolder.id;
            $scope.selectedItems[$scope.selectedItemsKey] = [];
            $scope.selectedChildFolders[$scope.selectedItemsKey] = [];
            $scope.validMoveFolders = $scope.retrieveValidMoveFolders();
        } else if($scope.selectedFolder.id !== folder.id) {
            $scope.selectedFolder = angular.copy(folder);
            $scope.selectedItemsKey = $scope.selectedFolder.id;
            $scope.selectedItems[$scope.selectedItemsKey] = [];
            $scope.selectedChildFolders[$scope.selectedItemsKey] = [];
            $scope.validMoveFolders = $scope.retrieveValidMoveFolders();
        }

        if(event) {
            $scope.isFolderSelectEvent = true;
        }
    };

      $scope.deselect = function() {
        if(!$scope.isFolderSelectEvent) {
          delete $scope.selectedItems[$scope.selectedItemsKey];
          delete $scope.selectedChildFolders[$scope.selectedItemsKey];
          $scope.selectedFolder = {};
          $scope.validMoveFolders = [];
        } else {
          $scope.isFolderSelectEvent = false;
        }
      };

      // Updates folders
      $scope.getFolders = function(cb) {
        $http.get('api/users/reqHeader/folders')
        .then(function(response) {

          // Folders (not including ROOT) with name, id, and parentId for use in results "Move To" dropdown
          $scope.folders = _.map(response.data, function(folder) {
            if(folder.name !== 'ROOT') {
              return folder;
            }
          });
          // Take out 'undefined' that was placed for ROOT
          $scope.folders = _.filter($scope.folders, function(folder){ return folder;});

          $scope.nestedFolders = [];
          $scope.rootFolder = _.find(response.data, {name: 'ROOT'});

          var rootId = $scope.rootFolder.id;

          var rootFolders = _.filter(response.data, {parentId: rootId});

          // Put children into root folders (recursively) instead of having a flat list with all folders
          angular.forEach(rootFolders, function(folder) {
            $scope.nestedFolders.push({
              name: folder.name,
              id: folder.id,
              parentId: folder.parentId,
              children: _getSubfolders(folder.id, response.data)
            });
          });

          // Update the selectedFolder details (if any)
          if($scope.selectedFolder.id) {
            $scope.selectedFolder = $scope.getUpdatedSelected($scope.selectedFolder.id, $scope.nestedFolders, {});
            $scope.validMoveFolders = $scope.retrieveValidMoveFolders();
            if(!$scope.selectedFolder) {
              $scope.selectedFolder = {};
            }
          }

          if(cb) {
            cb();
          }
        });
      };

      // Opens edit modal
      $scope.editFolder = function() {
          var modalInstance = $modal.open({
              templateUrl: 'components/folder/edit-modal.html',
              controller: 'EditModalCtrl',
              resolve: {
                  folder: function() {
                      return $scope.selectedFolder;
                  }
              },
              size: 'sm'
          });

          modalInstance.result.then(function () {
            $scope.getFolders();
          });
      };

      // Opens delete folders modal for deleting folder in folder tab
      $scope.deleteFolder = function() {
          var modalInstance = $modal.open({
              templateUrl: 'components/folder/delete-folder-modal.html',
              controller: 'EditModalCtrl',
              resolve: {
                  folder: function() {
                      return $scope.selectedFolder;
                  }
              },
              size: 'sm'
          });

          modalInstance.result.then(function () {
            delete $scope.selectedItems[$scope.selectedFolder.id];
            $scope.getFolders();
          });
      };

      // Opens create folder modal. Moves selected items in new folder as well, if moveSelectedItems is true
      $scope.createFolder = function(moveSelectedItems, cb) {
          var modalInstance = $modal.open({
              templateUrl: 'components/folder/create-modal.html',
              controller: 'CreateModalCtrl',
              resolve: {
                  folders: function() {
                    var validFolders = [];
                    if(moveSelectedItems && $scope.selectedItemsKey !== $scope.FILTER_TAB) {
                      if($scope.selectedChildFolders[$scope.selectedItemsKey].length) {
                        // Get valid folders to move folder to
                        
                        validFolders.push({name: $scope.rootFolder.name, id: $scope.rootFolder.id});
                        validFolders = _filterOutChildren($scope.nestedFolders, $scope.selectedFolder.id, validFolders);
                        validFolders.push({id: $scope.selectedFolder.id, name: $scope.selectedFolder.name, parentId: $scope.selectedFolder.parentId});
                        return validFolders;
                      } else {
                        return $scope.folders;
                      }
                    }

                    // Get valid folders to move folder to
                    validFolders.push({name: $scope.rootFolder.name, id: $scope.rootFolder.id});
                    validFolders = _filterOutChildren($scope.nestedFolders, $scope.selectedFolder.id, validFolders);
                    return validFolders;
                  },
                  currentFolder: function() {
                    if(moveSelectedItems) {
                      return {};
                    }
                    return $scope.selectedFolder;
                  },
                  items: function() {
                    if(moveSelectedItems) {
                      return $scope.selectedItems[$scope.selectedItemsKey];
                    }
                    return [];
                  },
                  childIds: function() {
                    if($scope.selectedChildFolders[$scope.selectedItemsKey]) {
                      return $scope.selectedChildFolders[$scope.selectedItemsKey];
                    }
                    return [];
                  }
              },
              size: 'sm'
          });

          modalInstance.result.then(function () {
              $scope.getFolders();
          });
      };

      // Opens create folder modal to create a new folder with nothing in it
      $scope.createEmptyFolder = function() {
          var modalInstance = $modal.open({
              templateUrl: 'components/folder/create-modal.html',
              controller: 'CreateModalCtrl',
              resolve: {
                  folders: function() {
                    // Get valid folders to move folder to
                    var validFolders = [];
                    validFolders.push({name: $scope.rootFolder.name, id: $scope.rootFolder.id});
                    validFolders = _filterOutChildren($scope.nestedFolders, null, validFolders);
                    return validFolders;
                  },
                  currentFolder: function() {
                    return {};
                  },
                  items: function() {
                    return [];
                  },
                  childIds: function() {
                    return [];
                  }
              },
              size: 'sm'
          });

          modalInstance.result.then(function () {
            $scope.getFolders();
          });
      };

      // Opens delete items modal for deleting items and subfolders in folders view
      $scope.removeItems = function(cb) {
        var modalInstance = $modal.open({
            templateUrl: 'components/folder/delete-items-modal.html',
            controller: 'DeleteItemsModalCtrl',
            resolve: {
                items: function() {
                    return $scope.selectedItems[$scope.selectedItemsKey];
                },
                childIds: function() {
                    return $scope.selectedChildFolders[$scope.selectedItemsKey];
                },
                id: function() {
                  return $scope.selectedFolder.id;
                }
            },
            size: 'sm'
        });

        modalInstance.result.then(function () {
          $scope.getFolders(cb);
        });
      };

      // Find selectedFolder in given folders array
      $scope.getUpdatedSelected = function(id, folders, selected) {
        angular.forEach(folders, function(folder) {
          if(folder.id === id) {
            selected = folder;
          }

          selected = $scope.getUpdatedSelected(id, folder.children, selected);
        });

        return selected;
      };

      // Returns array of folders with children nested (recursively)
      function _getSubfolders(id, folders) {
        var children = [];
        var childFolders = _.filter(folders, {parentId: id});
        
        angular.forEach(childFolders, function(folder) {
          children.push({
            name: folder.name,
            id: folder.id,
            parentId: folder.parentId,
            children: _getSubfolders(folder.id, folders)
          });
        });

        return children;
      }

      // Add folders without id (and children of id) to names array
      function _filterOutChildren(folders, id, names) {
        _.forEach(folders, function(child) {
          // Return if found id because we don't want it or any of its children
          if(child.id === id) {
            return;
          }
          names.push({name: child.name, id: child.id, parentId: child.parentId});
          names = _filterOutChildren(child.children, id, names);
        });

        return names;
      }

    $scope.$watch(function() {
            return imageSearchService.getActiveImageSearch();
        }, function(newVal) {
            if(newVal) {
                if(newVal.status === 'searching') {
                    $scope.imagesimLoading = true;
                } else if(newVal.status === 'success' && newVal.enabled) {
                    // If our latest img search was successful, re-issue our query and
                    // enable our image filter.
                    $scope.imagesimLoading = false;
                    $scope.searchConfig.filterByImage = true;
                } else {
                    $scope.imagesimLoading = false;
                    $scope.searchConfig.filterByImage = false;
                }
            } else {
                $scope.displayImageBreadcrumb = false;
                $scope.imagesimLoading = false;
                $scope.searchConfig.filterByImage = false;
            }
        },true);

    $scope.$watch('indexVM.loading',
        function(newValue, oldValue) {
            if(newValue !== oldValue) {
                $scope.loading = newValue;

                if($scope.loading === false && $scope.showresults === false && !$scope.indexVM.error) {
                    $scope.showresults = true;
                }

                if($scope.showresults && $scope.indexVM.sort && $scope.indexVM.sort.field() !== '_timestamp') {
                    $scope.clearNotification();
                }

                // First ensure filters are initialized, then check to see if user made updates
                if($scope.showresults && $scope.loading === false && $state.params.query && $state.params.query.elasticUIState.filterState) {
                    var currentFilters = $scope.indexVM.filters.getAsFilter() ? $scope.indexVM.filters.getAsFilter().toJSON() : {};
                    var originalFilters = $state.params.query.elasticUIState.filterState;

                    if(angular.equals(currentFilters, originalFilters)) {
                        $scope.filtersInitialized = true;
                    } else {
                        if($scope.filtersInitialized) {
                            $scope.filtersInitalized = null;
                            $scope.clearNotification();
                        }
                    }
                }
            }
        }
    );

    $scope.$watch('indexVM.error', function() {
        if($scope.indexVM.error) {
            $scope.loading = false;
            $scope.showresults = false;
            if($scope.activeTab === $scope.FILTER_TAB) {
                $state.go('main.search.error');
            } else {
                $state.go('main.folder.error');
            }
        }
    }, true);

    if($state.current.name === 'main') {
        $scope.viewList();
    }

    $scope.init();
}]);