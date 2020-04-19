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
    var x = 0;
    masterList.forEach(element => {
        var date = element[1];
        var time = element[3];
        var player = element[4];
        var trigger = element[5];
        var target = element[6];    
        var blindedTime = 0;
        var headshot = element.includes("(headshot)");
        var penetrated = element.includes("(penetrated)");
        var flashIndex = null;

        if(trigger == "blinded_for"){
            blindedTime = element[6];
            target = element[4];
            player = element[8];
            flashIndex = element[12];
            trigger = "blinded";
        }

        if(trigger == "blew_up"){
            target = " ";
        }

        if(element[7] == "flashbang"){
            flashIndex = element[9].replace(')', '');
        }

        parsedList.push(new ServerEvent(date, time, player, trigger, target, blindedTime, headshot, penetrated, flashIndex));
    });

    // Sort the parsedList
    parsedList.sort((a, b) => (a.player < b.player) ? 1 : (a.player === b.player) ? ((a.trigger < b.trigger) ? 1 : (a.trigger === b.trigger) ? ((a.target < b.target) ? 1 : -1) : -1 ) : -1 );

    // Split by players
    parsedList = groupBy(parsedList, 'player');

    for(var el in parsedList){
        // Delete unneeded items
        parsedList[el] = groupBy(parsedList[el], 'trigger');
        for(var el2 in parsedList[el]){
            parsedList[el][el2] = groupBy(parsedList[el][el2], 'target');
            delete parsedList[el][el2].prop_dynamic;
            delete parsedList[el][el2].func_breakable;
            delete parsedList[el][el2].prop_physics_multiplayer;
        }
        if(el == "rcon") delete parsedList[el];

        //Calculate totalSpent
        var totalSpent = 0;
        for(var item in parsedList[el]['purchased']){
            totalSpent += parsedList[el]['purchased'][item].length*prices[item];
        }
        parsedList[el].totalSpent = totalSpent;

        //Calculate utility info
        utilityRatio(parsedList[el]);
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
        x++;
    }   
    
    // Show the player screen
    $('#to-hide').removeClass('main-screen');
    $('#to-hide').addClass('anim-out');
    $('#download-btns').addClass('anim-in');
}

function handleFileSelect(files, id) {
    for(x = 0; x < files.length; x++){
        let file = files[x];  
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
        //Take out first instance of coords
        var fixedEl = el.replace(
            el.slice(el.indexOf('['), el.indexOf(']')+2)
            ,'');

        //Take out second instance of coords
        fixedEl = fixedEl.replace(
            fixedEl.slice(fixedEl.indexOf('['), fixedEl.indexOf(']')+2)
            ,'');

        //Fix some formatting things.
        fixedEl = fixedEl.replace("other ",'');
        fixedEl = fixedEl.replace("blinded for", "blinded_for");
        fixedEl = fixedEl.replace("assisted killing", "assisted_killing");
        fixedEl = fixedEl.replace("was killed by the bomb.", "blew_up");

        var myRegexp = /[^\s"]+|"([^"]*)"/gi;
        var myArray = [];

        do {
            //Each call to exec returns the next regex match as an array
            var match = myRegexp.exec(fixedEl);
            if (match != null)
            {
                //Index 1 in the array is the captured group if it exists
                //Index 0 is the matched text, which we use if no captured group exists
                myArray.push(match[1] ? match[1] : match[0]);
            }
        } while (match != null);
        if(myArray[4].includes("<CT>") || myArray[4].includes("<TERRORIST>")) masterList.push(myArray);
    });
}

// Recieves filename and a text array.
function download(filename, text) {
    var element = document.createElement('a');
    let outputString = '';

    text.forEach((el, cur) => {
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

function utilityRatio(player){
    var purchased = 0;
    var threw = 0;
    if(player["purchased"]["hegrenade"] !== undefined) purchased +=    player["purchased"]["hegrenade"].length;
    if(player["purchased"]["molotov"] !== undefined) purchased +=      player["purchased"]["molotov"].length;
    if(player["purchased"]["incgrenade"] !== undefined) purchased +=   player["purchased"]["incgrenade"].length;
    if(player["purchased"]["flashbang"] !== undefined) purchased +=    player["purchased"]["flashbang"].length;
    if(player["purchased"]["smokegrenade"] !== undefined) purchased += player["purchased"]["smokegrenade"].length;

    if(player["threw"]["hegrenade"] !== undefined) threw +=    player["threw"]["hegrenade"].length;
    if(player["threw"]["molotov"] !== undefined) threw +=      player["threw"]["molotov"].length;
    if(player["threw"]["incgrenade"] !== undefined) threw +=   player["threw"]["incgrenade"].length;
    if(player["threw"]["flashbang"] !== undefined) threw +=    player["threw"]["flashbang"].length;
    if(player["threw"]["smokegrenade"] !== undefined) threw += player["threw"]["smokegrenade"].length;
    
    player.utilityPurchased = purchased;
    player.utilityThrew     = threw;
    player.utilityRatio     = parseFloat((threw/purchased).toFixed(2));
}

UIController.createEventListeners();