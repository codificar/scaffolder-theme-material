(function ()
{
    'use strict';

    angular
        .module('scaffolder')
        .controller('MainController', MainController);

    /** @ngInject */
    function MainController($scope, $rootScope, $state)
    {
        // Data

        //////////

        // console.log($state.current.name);

        // Remove the splash screen
        $scope.$on('$viewContentAnimationEnded', function (event)
        {
            if ( event.targetScope.$id === $scope.$id && $state.current.name != 'app.test')
            {
                $rootScope.$broadcast('msSplashScreen::remove');
            }
        });
    }
})();