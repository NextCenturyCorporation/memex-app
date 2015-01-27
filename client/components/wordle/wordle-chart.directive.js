'use strict';

angular.module('digApp').directive('wordleChart', ['$timeout', function ($timeout) {
    return {
        templateUrl: 'components/wordle/wordle-chart.html',
        restrict: 'E',
        scope: {
            chartData: '@',
            indexVM: '=indexvm',
            ejs: '=',
            filters: '='
        },
        link: function ($scope, element) {
            //var margin = {top: 0, right: 0, bottom: 0, left: 0};
            // var x = d3.scale.
            $scope.chartEl = $(element).find('.wordle-chart')[0];
            $scope.chart = null;
            $scope.htmlCanvas = null;

            $scope.drawWordle = function(options) {
                var htmlCanvas = $("<div class=\"wordle-html-canvas hide\" />");
                $($scope.chartEl).empty();
                $($scope.chartEl).append(htmlCanvas);
                $scope.htmlCanvas = $($scope.chartEl).find('.wordle-html-canvas')[0];
                WordCloud([$scope.chartEl, $scope.htmlCanvas], options);
                $scope.chart = $($scope.chartEl);
            };

            $scope.render = function(data) {
                if(data) {
                    var bodytext='';
                    data.forEach(function (r){
                        if(r._source) {
                            if(r._source.hasAbstractPart) {
                                bodytext += r._source.hasAbstractPart.text;
                            }
                        }
                    });
                    console.log("Got bodyText:" + bodytext);
                    var wordFrequency = {
                      workerUrl: 'components/wordle/scripts/wordfreq.worker.js' 
                    };
                    wordFrequency.languages=["english"];
                    wordFrequency.stopWordSets =["english1"];
                    wordFrequency.maxiumPhraseLength = 15;
                    wordFrequency.minimumCount=1;
                    // Initialize and run process() function
                    var wordfreq = WordFreq(wordFrequency).process(bodytext, function (list) {
                      // console.log the list returned in this callback.
                      //console.log(list);
                          var options={};
                          options.list = list;
                          options.gridSize = 20;
                          options.weightFactor=8;
                          options.fontFamily = 'Times, serif';
                          //options.color = function (word, weight) {
                           //       return (weight === 12) ? "#f0222" : "#c09292"; 
                           //   }
                          options.color = 'random-dark'; //random-light';
                          options.backgroundColor = "None";
                          options.rotateRatio=0.5;
                          //options.origin= [90, 0];
                          //console.log("options2:" +options2);
                          
                          $scope.drawWordle(options);
                    });
                }
            };

            $scope.$watch('indexVM.results.hits', function() {
                var data = $scope.$eval('indexVM.results.hits.' + $scope.chartData);
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