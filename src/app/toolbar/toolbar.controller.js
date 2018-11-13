(function ()
{
    'use strict';

    angular
        .module('app.toolbar')
        .controller('ToolbarController', ToolbarController);

    /** @ngInject */
    function ToolbarController($rootScope, $state, $mdSidenav, $translate, $mdToast, $localStorage, $location, $http, $mdDialog, UserResource, msNavigationService, CdAclService)
    {
        var vm = this;

        var alert = $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .ok('Ok');

        /**
         * Attributes
         */
        vm.currentUser = $localStorage.currentUser;
        vm.labels = {
            admin: false,
            client: false,
            candidate: false,
            pyshcologist: false
        };

        vm.profiles = {
            admins: [],
            clients: [],
            candidates: [],
            psychologists: []
        };

        vm.languages = [
            {
                'title'      : 'Portuguese',
                'translation': 'TOOLBAR.PORTUGUESE',
                'code'       : 'pt_BR',
                'flag'       : 'br'
            },
            {
                'title'      : 'English',
                'translation': 'TOOLBAR.ENGLISH',
                'code'       : 'en',
                'flag'       : 'gb'
            }
        ];
        vm.selectedLanguage = vm.languages[0];
        
        /**
         * Methods
         */
        vm.generateToolbar = generateToolbar;
        vm.changeProfile = changeProfile;
        vm.logout = logout;
        vm.toggleSidenav = toggleSidenav;
        vm.changeLanguage = changeLanguage;
        vm.toggleHorizontalMobileMenu = toggleHorizontalMobileMenu;

        generateToolbar();

        /**
         * Gera a barra superior
         */
        function generateToolbar() {
            var profiles = CryptoJS.AES.decrypt($localStorage.profiles, CdAclService.key);
            profiles = JSON.parse(profiles.toString(CryptoJS.enc.Utf8));

            angular.forEach(profiles, function(profile) {
                if($localStorage.currentUser.profile == profile.id)
                    profile.active = true;

                switch(profile.role) {
                    case 1: //Administrador
                        vm.profiles.admins.push(profile),
                        vm.labels.admin = true;
                        break;

                    case 2: //Candidato
                        vm.profiles.candidates.push(profile),
                        vm.labels.candidate = true;
                        break;

                    case 3: //Cliente
                        vm.profiles.clients.push(profile),
                        vm.labels.client = true;
                        break;

                    case 4: //Psicólogo
                        vm.profiles.psychologists.push(profile),
                        vm.labels.psychologist = true;
                        break;
                }
            });
        }
        
        /**
         * Logout 
         */
        function logout() {
            delete $localStorage.currentUser;
            delete $localStorage.menu;
            delete $localStorage.profiles;
            delete $localStorage.acl;

            $http.defaults.headers.common.Authorization = '';

            $location.path('/login');
        }

        
        /**
         * Change Language
         */
        function changeLanguage(lang)
        {
            vm.selectedLanguage = lang;

            // Show temporary message if user selects a language other than English
            if ( lang.code !== 'en' && lang.code !== 'pt_BR')
            {
                var message = 'scaffolder supports translations through angular-translate module, but currently we do not have any translations other than English language. If you want to help us, send us a message through ThemeForest profile page.';

                $mdToast.show({
                    template : '<md-toast id="language-message" layout="column" layout-align="center start"><div class="md-toast-content">' + message + '</div></md-toast>',
                    hideDelay: 7000,
                    position : 'top right',
                    parent   : '#content'
                });

                return;
            }

            //Change the language
            $translate.use(lang.code);
        }

        /**
         * Toggle sidenav
         *
         * @param sidenavId
         */
        function toggleSidenav(sidenavId)
        {
            $mdSidenav(sidenavId).toggle();
        }

        function changeProfile(profile) {
            UserResource.authorizations(profile.id).$promise.then(function(data) {
                var profilesRet = data.data.profiles;
                var actionsRet = data.data.actions;
                var acl = [];
                var profiles = [];
                var actions = [];

                angular.forEach(profilesRet, function(profile, index) {
                    var p = {
                        id: profile.id,
                        name: profile.name,
                        role: profile.role_id
                    };
                    
                    profiles.push(p);
                });
                profiles = CryptoJS.AES.encrypt(JSON.stringify(profiles), CdAclService.key).toString();
                $localStorage.profiles = profiles;

                msNavigationService.deleteItem();

                angular.forEach(actionsRet, function(action) {
                    if(action.kind == 'Menu') {
                        var a = {
                            title: action.title,
                            order: action.order,
                            state: action.state,
                            action_parent_id: action.action_parent_id,
                            class: action.class
                        };
                        actions.push(a);

                        var item = {
                            title: action.title,
                            icon: action.icon,
                            weight: action.order
                        };
        
                        if(action.state != null || action.state != undefined) 
                            item.state = action.state;
        
                        msNavigationService.saveItem(action.class, item);
                    }
                    else {
                        var act = action.state.split('.');
                        if(act.length > 0 && act[0] == 'acl')
                            acl.push(action.state);
                    }
                });

                actions = CryptoJS.AES.encrypt(JSON.stringify(actions), CdAclService.key).toString();
                $localStorage.menu = actions;
               
                CdAclService.setPermissions(acl);
                $localStorage.currentUser.profile = profile.id;
                $localStorage.currentUser.role = profile.role; 

                var route = 'app.dashboards_general';
                if($localStorage.currentUser.role == 2) 
                    route = 'app.dashboards_candidate';

                $state.go(route, {}, {reload: true}).then(function() {
                    alert.title("Sucesso");
                    alert.textContent("Seu perfil ativo foi trocado com sucesso.");
                    $mdDialog.show(alert);
                });
              
            });
        }

        /**
         * Toggle horizontal mobile menu
         */
        function toggleHorizontalMobileMenu()
        {
            vm.bodyEl.toggleClass('ms-navigation-horizontal-mobile-menu-active');
        }
    }

})();