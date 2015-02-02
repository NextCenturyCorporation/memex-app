'use strict';

angular.module('digApp').directive('wordleChart', ['$timeout', function ($timeout) {
    return {
        templateUrl: 'components/wordle/wordle-chart.html',
        restrict: 'E',
        scope: {
            aggregationName: '@',
            aggregationSize: '@',
            aggregationKey: '@',
            indexVM: '=indexvm',
            ejs: '=',
            filters: '='
        },
        link: function ($scope, element) {
            $scope.chartEl = $(element).find('.wordle-chart')[0];
            $scope.chart = null;
            $scope.htmlCanvas = null;

            $scope.drawWordle = function(options) {
                var htmlCanvas = $("<div class=\"wordle-html-canvas hide\" />");
                $($scope.chartEl).empty();
                $($scope.chartEl).append(htmlCanvas);
                $scope.htmlCanvas = $($scope.chartEl).find('.wordle-html-canvas')[0];
                $timeout(function() {
                    WordCloud([$scope.chartEl, $scope.htmlCanvas], options);
                    $scope.chart = $($scope.chartEl);
                 });
            };

            var formatData = function(data) {
                var list = [];
                var stopwords = ['i','a','about', 'an','and','are','as','at',
                              'be', 'been','by','com','for', 'from','how','in',
                              'is','it','not', 'of','on','or','that',
                              'the','this','to','was', 'what','when','where', 'which',
                              'who','will','with', 'www','the','<br>','br',
                              'u','me','you','your','my','we', 'have','am', 'can', 'were', 'than','also']
                
                if(data.buckets.length > 0) {
                    
                    data.buckets.forEach(function(item) {
                        var row = [];
                        if($.inArray(item.key, stopwords) == -1) {
                            row.push(item.key);
                            row.push(item.doc_count);
                            list.push(row);
                            //console.log(row[0] + ":" + row[1]);
                            
                        }
                    });
                }
                return list;
            };

            $scope.render = function(data) {
                if(data) {
                    var list = formatData(data);

                    var options={};
                    options.list = list;
                    options.gridSize = 15;

                    var multiplier = 15;
                    if(list.length > 0) {
			var size = list[0][1];
                        multiplier = Math.min(multiplier, 20 / Math.log(size))

			var sqrt = Math.sqrt(size);
			var first = multiplier * sqrt;
			if(first > 80)
			  multiplier = 80/sqrt;
                    }
                    options.weightFactor=function(size) {
			//console.log("mult:" + multiplier + ", sqrt(size):" + Math.sqrt(size) + "=" + multiplier * Math.sqrt(size));
                        return multiplier * Math.sqrt(size);
                    };
                    
                    options.fontFamily = 'Times, serif';
                    options.color = 'random-dark'; //random-light';
                    options.backgroundColor = "None";
                    options.rotateRatio=0.5;
                    //options.wait = 2;
                    options.abortThreshold = 500;
                    options.abort = function() {
                        console.log("Wordle draw aborted..was taking too long");
                    }
                    //options.origin= [90, 0];
                    $scope.drawWordle(options);
                }
            };

            $scope.$watch('indexVM.results.aggregations', function() {
                var data = $scope.$eval('indexVM.results.aggregations.' + $scope.aggregationName +
                    ' || indexVM.results.aggregations.filtered_' + $scope.aggregationName + '.' + $scope.aggregationName);
                $scope.render(data);
                $timeout(function() {
                    // TODO: Consider replacing with something more element.  
                    // Defer a resize on initial render to later in the update cycle to force the chart size to
                    // update after the page has rendered.  This avoids sizing issues on initial render since
                    // most of the page elements have not been built and the area available to fill is of
                    // size 0 on the initial render or in flux. 
                    if ($scope.chart) {
                        $scope.chart.resize({height:100});
                    }
                });
            }, true);

        }
    };
}]);
