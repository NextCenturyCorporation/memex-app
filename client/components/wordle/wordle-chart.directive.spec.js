'use strict';

describe('Directive: wordleChart', function () {

  // load the directive's module and view
  beforeEach(module('digApp'));
  beforeEach(module('components/wordle/wordle-chart.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<wordle-chart></wordle-chart>');
    element = $compile(element)(scope);
    scope.$apply();
    expect(element.text()).toBe('this is the wordleChart directive');
  }));
});