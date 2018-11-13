(function ()
{
    'use strict';

    angular
        .module('scaffolder')
        .config(config);

    /** @ngInject */
    function config($translateProvider)
    {
        // Put your custom configurations here
        $translateProvider.preferredLanguage('pt_BR');
    }

})();