var UIController = (function (){
    //Private variables/functions
    var map = {
        // Homepage
        '': function(){
            console.log('Homepage');
        },

        // Second Page
        '#page2': function(){
            console.log('Page 2');
        }
    }

    //Public variables/functions
    return {
        createEventListeners: function() {
            $(window).on('hashchange', function(){
                var url = decodeURI(window.location.hash);
                if(map[url]){
                    map[url]();
                } else {
                    // Error
                    console.log('Error 404');
                }
            });

            let masterDropArea  = document.getElementById('master-upload');
            let masterUpload    = document.getElementById('master');
            let goButton        = document.getElementById('gobtn');
            let downloadExcel   = document.getElementById('download-excel-btn');
        
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                masterDropArea.addEventListener(eventName, preventDefaults, false);
            });
        
            function preventDefaults(e){
                e.preventDefault()
                e.stopPropagation()
            }
        
            ['dragenter', 'dragover'].forEach(eventName => {
                masterDropArea.addEventListener(eventName, e => {masterDropArea.classList.add('highlight');}, false);
            });
        
            ['dragleave', 'drop'].forEach(eventName => {
                masterDropArea.addEventListener(eventName, e => {masterDropArea.classList.remove('highlight');}, false);
            });
        
            masterUpload.addEventListener('change', e => handleFileSelect(e.target.files, 'master'), false);
            goButton.addEventListener('click', runFiles);
        },

        createPlayerListeners: function(id) {

            let playerArea  = document.getElementById(id);

            ['dragenter', 'dragover'].forEach(eventName => {
                playerArea.addEventListener(eventName, e => {playerArea.classList.add('highlight');}, false);
            });
        
            ['dragleave', 'drop'].forEach(eventName => {
                playerArea.addEventListener(eventName, e => {playerArea.classList.remove('highlight');}, false);
            });

            playerArea.addEventListener('click', e => playerClick(id), false);
        }
    }
})();