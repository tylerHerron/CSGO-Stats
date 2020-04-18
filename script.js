// CSGO Server Log Parser
// Version 1.o
//
// Author: Tyler Herron
//
// This program parses through the server logs for
// a csgo match and tracks the stats for every player.

let masterList = [];
let parsedList = [];
let playerTables = {};
let currentPlayer = null;

function runFiles(){
    masterList.forEach(element => {
        var date = element[1];
        var time = element[3];
        var player = element[4];

        if(element.length == 7){ // purchases
            if(player != "Starting" && player != "World" && player != "Molotov" && player != "Log" && player != "server_cvar:"){
                parsedList.push(new ServerEvent(date, time, player, element[5], element[6], 0, false, false));
            }
        } else if (element.length == 8){
            parsedList.push(new ServerEvent(date, time, player, element[5], element[7], 0, false, false));
        } else if (element.length == 10 || element.length == 13){
            if(element[12] == "bomb."){
                parsedList.push(new ServerEvent(date, time, player, 'killed by', 'bomb.', 0, false, false));    
            } else {
                parsedList.push(new ServerEvent(date, time, player, element[5], element[6], 0, false, false)); 
            }
        }else if (element.length == 14){
            if(element[5] == "blinded"){
                parsedList.push(new ServerEvent(date, time, element[9], element[5], element[4], element[7], false, false));
            }
        } else if (element.length == 15){
            if(player != "Molotov"){
                if(element[15] == "bomb."){
                    console.log(element);
                    //parsedList.push(new ServerEvent(date, time, player, element[8], element[9], 0, false, false));
                } else {
                    parsedList.push(new ServerEvent(date, time, player, element[8], element[9], 0, false, false));
                }
            }
        } else if (element.length == 16){
            if(element[15] == "(headshot)"){
                parsedList.push(new ServerEvent(date, time, player, element[8], element[9], 0, false, false));
            } else if(element[15] == "(penetrated)"){
                parsedList.push(new ServerEvent(date, time, player, element[8], element[9], 0, false, true));
            } else {
                parsedList.push(new ServerEvent(date, time, player, element[8], element[10], 0, false, false));
            }
        } else if (element.length == 17){
            parsedList.push(new ServerEvent(date, time, player, element[8], element[10], 0, false, true));
        }
    });

    parsedList.sort((a, b) => (a.player < b.player) ? 1 : (a.player === b.player) ? ((a.trigger < b.trigger) ? 1 : (a.trigger === b.trigger) ? ((a.target < b.target) ? 1 : -1) : -1 ) : -1 );

    parsedList = groupBy(parsedList, 'player');
    for(var el in parsedList){
        parsedList[el] = groupBy(parsedList[el], 'trigger');
        for(var el2 in parsedList[el]){
            parsedList[el][el2] = groupBy(parsedList[el][el2], 'target');
            delete parsedList[el][el2].prop_dynamic;
            delete parsedList[el][el2].func_breakable;
            delete parsedList[el][el2].prop_physics_multiplayer;
        }
    }

    
    for(var el in parsedList){
        var header = [el,'Qty','Total'];
        createReportTable(header, parsedList[el], el);
        var playerLink = $(
            `<div class="col span_1_of_2">
                <div class="run-button">
                    <label class="button run-btn" for="${el}">${el}</label><br>
                    <button type="submit" id="${el}"></button>
                </div>
            </div>`);
        playerLink.appendTo('#players');
        $(`#${el}`).addClass('input');
        UIController.createPlayerListeners(el);
    }   
    

    $('#to-hide').removeClass('main-screen');
    $('#to-hide').addClass('anim-out');
    $('#download-btns').addClass('anim-in');
}


function handleFileSelect(files, id) {
    for(x = 0; x < files.length; x++){
        let file = files[x];
        console.log(file);    
        if(x < files.length+1){
            var reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function() {
                readFileToMaster(reader.result);
                $('#master-text').text('Server file read into system.');
            }
        }
    } 
}

// Creates masterList array from file upload.
function readFileToMaster(file){
    masterList = [];
    let fileArray = file.split('\n'); // Create an array for every line in file

    fileArray.forEach((el) => {
        var myRegexp = /[^\s"]+|"([^"]*)"/gi;
        var myArray = [];

        do {
            //Each call to exec returns the next regex match as an array
            var match = myRegexp.exec(el);
            if (match != null)
            {
                //Index 1 in the array is the captured group if it exists
                //Index 0 is the matched text, which we use if no captured group exists
                myArray.push(match[1] ? match[1] : match[0]);
            }
        } while (match != null);

        masterList.push(myArray);
    });

    console.log('Master read to Master array');
}

// Recieves filename and a text array.
function download(filename, text) {
    var element = document.createElement('a');
    let outputString = '';

    text.forEach((el, cur) => {
        // console.log(el);
        if(cur === text.length-1){
            outputString += (el);
        } else {
            outputString += (el + '\n');            
        }
    });

    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(outputString));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}

// Download table as an .xls file
function downloadExcelReport() {
    downloadTableAsExcel(currentPlayer);
}

function groupBy(arr, property) {
    return arr.reduce(function(memo, x) {
      if (!memo[x[property]]) { memo[x[property]] = []; }
      memo[x[property]].push(x);
      return memo;
    }, {});
  }

function playerClick(id){
    currentPlayer = id;
    var p = document.getElementById('tables');
    for(var element in playerTables){
        if(p.contains(playerTables[element])) p.removeChild(playerTables[element]);
    }
    p.appendChild(playerTables[id]);
}

UIController.createEventListeners();