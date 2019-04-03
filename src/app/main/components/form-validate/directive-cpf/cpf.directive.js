(function ()
{
    'use strict';

    angular
        .module('app.components.validation') 
        .directive('cdCpf', cpf);
  
        function cpf($compile) {
            return {
                restrict: 'A',
                require: 'ngModel', 
                scope: {
					name: '@',
				},   
                link: function(scope, element, attrs, ngModel) {

                    var errorsTemplate = '<div ng-messages="existError" ng-show="touched" role="alert"> <div ng-show="errorRequired"> <span style="font-size: 12px"> {{ "ERROR_MESSAGE.REQUIRED" | translate }} </span> </div> <div ng-show="!valid && !errorRequired"> <span style="font-size: 12px"> {{ "ERROR_MESSAGE.CPF_INVALID" | translate }} </span> </div> </div>';

					angular.element(element).after($compile(errorsTemplate)(scope));

                    scope.$watch(function(){

                        scope.existError = ngModel.$error;
						scope.touched = ngModel.$touched;
						scope.valid = ngModel.$valid;
                        scope.errorRequired = ngModel.$error.required; 
                        
                        var cpf = element[0].value;

                        cpf = cpf.replace(/\D/g,"");    
                        if(isValidCPF(cpf)) {
                            ngModel.$setValidity(attrs.ngModel, true);
                        }   
                        else {
                            if(cpf.length > 0)
                                ngModel.$setValidity(attrs.ngModel, false);
                            else
                                ngModel.$setValidity(attrs.ngModel, true);
                        }          
                        cpf = cpf.replace(/(\d{3})(\d)/,"$1.$2");       
                        cpf = cpf.replace(/(\d{3})(\d)/,"$1.$2");      
                                                                 
                        cpf = cpf.replace(/(\d{3})(\d{1,2})$/,"$1-$2"); 
                        
                        element[0].value = cpf;
                    });
                }
            }
        }

        function isValidCPF (cpf) {
            var c = cpf;
            if((c = c.replace(/[^\d]/g,"").split("")).length != 11) return false;
            if(new RegExp("^" + c[0] + "{11}$").test(c.join(""))) return false;
            for(var s = 10, n = 0, i = 0; s >= 2; n += c[i++] * s--);
            if(c[9] != (((n %= 11) < 2) ? 0 : 11 - n)) return false;
            for(var s = 11, n = 0, i = 0; s >= 2; n += c[i++] * s--);
            if(c[10] != (((n %= 11) < 2) ? 0 : 11 - n)) return false;
            return true;
        };
    
})();