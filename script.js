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

let prices = {
"ak47":2700,
"aug":3300,
"famas":2050,
"galilar":1800,
"m4a1":3100,
"m4a1_silencer":2900,
"sg556":3000,
"awp":4750,
"gs3sg1":5000,
"scar20":5000,
"ssg08":1700,
"bizon":1400,
"mac10":1050,
"mp5sd":1500,
"mp7":1500,
"mp9":1250,
"p90":2350,
"ump45":1200,
"m249":5200,
"mag7":1300,
"negev":1700,
"nova":1050,
"sawedoff":1100,
"xm1014":2000,
"cz75a":0500,
"deagle":0700,
"elite":0400,
"fiveseven":0500,
"glock":0000,
"hkp2000":0000,
"p250":0300,
"revolver":0800,
"tec9":0500,
"usp_silencer":0000,
"hegrenade":0300,
"molotov":0400,
"incgrenade":0600,
"flashbang":0200,
"smokegrenade":0300,
"item_kevlar":0600,
"item_assaultsuit":1000,
"item_defuser":0400,
"taser":0400
};

function runFiles(){
    // Parse the whole file and make ServerEvent objects
    // Put them into parsedList[]
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
            if(element[8] == "killed"){
                parsedList.push(new ServerEvent(date, time, player, element[8], element[9], 0, true, true));
            } else {
                parsedList.push(new ServerEvent(date, time, player, element[8], element[10], 0, false, true));
            }
        }
    });

    // Sort the parsedList
    parsedList.sort((a, b) => (a.player < b.player) ? 1 : (a.player === b.player) ? ((a.trigger < b.trigger) ? 1 : (a.trigger === b.trigger) ? ((a.target < b.target) ? 1 : -1) : -1 ) : -1 );

    // Split by players
    parsedList = groupBy(parsedList, 'player');

    // Delete unneeded items
    for(var el in parsedList){
        parsedList[el] = groupBy(parsedList[el], 'trigger');
        for(var el2 in parsedList[el]){
            parsedList[el][el2] = groupBy(parsedList[el][el2], 'target');
            delete parsedList[el][el2].prop_dynamic;
            delete parsedList[el][el2].func_breakable;
            delete parsedList[el][el2].prop_physics_multiplayer;
        }
        if(el == "rcon") delete parsedList[el];
    }
    
    // Calculate Prices
    for(var el in parsedList){
        var totalSpent = 0;
        for(var item in parsedList[el]['purchased']){
            totalSpent += parsedList[el]['purchased'][item].length*prices[item];
        }
        parsedList[el].totalSpent = totalSpent;
    }

    // Make HTML Tables
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
    
    // Show the player screen
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