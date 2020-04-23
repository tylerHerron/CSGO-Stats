// CSGO Server Log Parser
// Version 1.o
//
// Author: Tyler Herron
//
// This program parses through the server logs for
// a csgo match and tracks the stats for every player.

let masterList = [];
let parsedList = [];
let parseOriginal = [];
let playerTables = {};
let player = null;
let curPlrTeam2 = null;

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
"taser":0400,
"decoy":0050
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
        var gun = null;    
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

        if(trigger == "killed"){
            gun = element[8];
        }

        if(element[7] == "flashbang"){
            flashIndex = element[9].replace(')', '');
        }

        parsedList.push(new ServerEvent(date, time, player, trigger, target, gun, blindedTime, headshot, penetrated, flashIndex));
    });

    // Sort the parsedList
    parsedList.sort((a, b) => (a.player < b.player) ? 1 : (a.player === b.player) ? ((a.trigger < b.trigger) ? 1 : (a.trigger === b.trigger) ? ((a.target < b.target) ? 1 : -1) : -1 ) : -1 );

    parseOriginal = parsedList;
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

        // Calculate totalSpent
        var totalSpent = 0;
        for(var item in parsedList[el]['purchased']){
            totalSpent += parsedList[el]['purchased'][item].length*prices[item];
        }
        parsedList[el].totalSpent = totalSpent;

        // Determine Teams
        for(var e in masterList){
            parsedList[el].team = 1;
            if(masterList[e][4].includes(el)){
                if(masterList[e][4].includes("<TERRORIST>")) parsedList[el].team = 2;
                break;
            }
        }
    }

    // Calculate utility info
    for(var el in parsedList){
        utilityRatio(parsedList[el]);
        flashRatio(el);
    }

    // Make HTML Tables and buttons
    for(var el in parsedList){
        var tableID = el.replace(/\s+/g, '_');
        var header = [el,'Qty','Total'];
        createReportTable(header, parsedList[el], el);
        var playerLink = $(
            `<div class="col span_2_of_2">
                <div class="run-button">
                    <label class="button" for="${tableID}">${el}</label>
                    <button type="submit" id="${tableID}" class="input"></button>
                </div>
            </div>`);
        playerLink.appendTo(`#team-${parsedList[el].team}`);
        UIController.createPlayerListeners(el);
        x++;
    }
    

    // Show the player screen
    
    $('#to-hide').addClass('anim-out');
    $('#to-hide').removeClass('main-screen');

    setTimeout(function(){
        $('#download-btns').addClass('anim-in');
    },500);
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
    var begin, end = false;

    fileArray.forEach((el) => {
        if(el.includes("say") || el.includes("say_team")){ return; }

        if(el.includes("warmup_end")){
            begin = true;
        }

        if(el.includes("ACCOLADE")){
            end = true;
        }

        
        if(begin && !end){   
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
        }
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
    let clickedTeam = parsedList[id].team;

    let existingTables = document.getElementById(`table-team-${clickedTeam}`);
    
    if (existingTables.childElementCount == 1){
        var player = existingTables.lastChild.id.split("-")[0];
        player = player.replace(/_+/g, " ");
        if(player == id){
            removePlayerTables(clickedTeam, 400);
        } else {
            removePlayerTables(clickedTeam, 400);
            setTimeout(function(){
                showPlayerTable(id);
            }, 400);
        }
    } else {
        showPlayerTable(id);
    }
}

function removePlayerTables(team, dur){
    var p = document.getElementById(`table-team-${team}`);
    for(var element in playerTables){
        var tableID = element.replace(/\s+/g, "_");
        if(parsedList[element].team == team) {
            if(document.getElementById(`${tableID}-table`) != null){
                document.getElementById(`${tableID}-table`).style.opacity = 0; 
            }
        }
    }
    setTimeout(function(){
        p.innerHTML = '';
    }, dur);
}

function showPlayerTable(id){
    var tableID = id.replace(/\s+/g, '_');
    var p = document.getElementById(`table-team-${parsedList[id].team}`);
    p.appendChild(playerTables[id]);
    setTimeout(function(){
        document.getElementById(`${tableID}-table`).style.opacity = 1;
    },25);
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

function flashRatio(player){
    let totalFlashTime = 0;
    let flashRatio = 0;
    let enemyFlashes = 0;
    let teamFlashes = 0;

    for(let target in parsedList[player]["blinded"]){
        for(let event in parsedList[player]["blinded"][target]){
            if(parsedList[player].team != parsedList[target].team){
                totalFlashTime += parsedList[player]["blinded"][target][event].blindedTime;
                enemyFlashes++;
            } else {
                teamFlashes++;
            }
        }
    }

    flashRatio = totalFlashTime/(parsedList[player]["threw"]["flashbang"].length*4.87);
    parsedList[player].flashRatio = parseFloat(flashRatio.toFixed(2));
    parsedList[player].totalFlashTime = totalFlashTime;
    parsedList[player].enemyFlashes = enemyFlashes;
    parsedList[player].teamFlashes = teamFlashes;
}

function downloadPlayerKills(id){
    killedPlayers = parsedList[id]["killed"];
    let csvPlayerContent = "data:text/csv;charset=utf-8,"
    
    for(var target in killedPlayers){
        killedPlayers[target].forEach(element => {
            csvPlayerContent += `${id} killed ${element.target} with ${element.gun}.\n`
        });
    }

    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href",     csvPlayerContent     );
    dlAnchorElem.setAttribute("download", `${id}Stats.csv`);
    dlAnchorElem.click();
}

function downloadAll(){
    let csvContent = "data:text/csv;charset=utf-8,Player,Trigger,Event,blindedTime,headshot,penetrated,flashid,gun\n";
    parseOriginal.forEach(element => {
        for(var event in element){
            csvContent += `${element[event]},`;
        }
        csvContent += "\n"
    });

    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href",     csvContent     );
    dlAnchorElem.setAttribute("download", "allEvents.csv");
    dlAnchorElem.click();
}

UIController.createEventListeners();