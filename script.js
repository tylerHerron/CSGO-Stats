// CSGO Server Log Parser
// Version 1.0
//
// Author: Tyler Herron
//
// This program parses through the server logs for
// a csgo match and tracks the stats for every player.

let fileReader;
let masterList = [];
let parsedList = [];
let parseOriginal = [];
let playerTables = {};
let player = null;
let curPlrTeam2 = null;
var round = 0;
var weaponTypes = ["rifle","smg","heavy","pistol","utility","item", "melee"];
var items = {
    "ak47":{
        price: 2700,
        type: "rifle"
    },
    "aug":{
        price: 3300,
        type: "rifle"
    },
    "famas":{
        price: 2050,
        type: "rifle"
    },
    "galilar":{
        price: 1800,
        type: "rifle"
    },
    "m4a1":{
        price: 3100,
        type: "rifle"
    },
    "m4a1_silencer":{
        price: 2900,
        type: "rifle"
    },
    "m4a1_silencer_off":{
        price: 2900,
        type: "rifle"
    },
    "sg556":{
        price: 3000,
        type: "rifle"
    },
    "awp":{
        price: 4750,
        type: "rifle"
    },
    "g3sg1":{
        price: 5000,
        type: "rifle"
    },
    "scar20":{
        price: 5000,
        type: "rifle"
    },
    "ssg08":{
        price: 1700,
        type: "rifle"
    },

    "bizon":{
        price: 1400,
        type: "smg"
    },
    "mac10":{
        price: 1050,
        type: "smg"
    },
    "mp5sd":{
        price: 1500,
        type: "smg"
    },
    "mp7":{
        price: 1500,
        type: "smg"
    },
    "mp9":{
        price: 1250,
        type: "smg"
    },
    "p90":{
        price: 2350,
        type: "smg"
    },
    "ump45":{
        price: 1200,
        type: "smg"
    },
    "m249":{
        price: 5200,
        type: "heavy"
    },
    "mag7":{
        price: 1300,
        type: "heavy"
    },
    "negev":{
        price: 1700,
        type: "heavy"
    },
    "nova":{
        price: 1050,
        type: "heavy"
    },
    "sawedoff":{
        price: 1100,
        type: "heavy"
    },
    "xm1014":{
        price: 2000,
        type: "heavy"
    },
    "cz75a":{
        price: 0500,
        type: "pistol"
    },
    "deagle":{
        price: 0700,
        type: "pistol"
    },
    "elite":{
        price: 0400,
        type: "pistol"
    },
    "fiveseven":{
        price: 0500,
        type: "pistol"
    },
    "glock":{
        price: 0000,
        type: "pistol"
    },
    "hkp2000":{
        price: 0000,
        type: "pistol"
    },
    "p250":{
        price: 0300,
        type: "pistol"
    },
    "revolver":{
        price: 0800,
        type: "pistol"
    },
    "tec9":{
        price: 0500,
        type: "pistol"
    },
    "usp_silencer":{
        price: 0000,
        type: "pistol"
    },
    "hegrenade":{
        price: 0300,
        type: "utility"
    },
    "molotov":{
        price: 0400,
        type: "utility"
    },
    "incgrenade":{
        price: 0600,
        type: "utility"
    },
    "flashbang":{
        price: 0200,
        type: "utility"
    },
    "smokegrenade":{
        price: 0300,
        type: "utility"
    },
    "taser":{
        price: 0400,
        type: "utility"
    },
    "decoy":{
        price: 0050,
        type: "utility"
    },
    "item_kevlar":{
        price: 0600,
        type: "item"
    },
    "item_assaultsuit":{
        price: 1000,
        type: "item"
    },
    "item_defuser":{
        price: 0400,
        type: "item"
    },
    "inferno":{
        type: "utility"
    },
    "knife":{
        type: "melee"
    },
    "knife_t":{
        type: "melee"
    }
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

        if(target == "Round_Start"){
            round++;
        }

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

        if(player != "World"){
            parsedList.push(new ServerEvent(date, time, player, trigger, target, gun, blindedTime, headshot, penetrated, flashIndex, round));
        }
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
            totalSpent += parsedList[el]['purchased'][item].length*items[item].price;
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
        utilityRatio(el);
        flashRatio(el);
    }

    // Make HTML Tables and buttons
    for(var el in parsedList){
        var tableID = el.replace(/\s+/g, '_');
        var header = [el,'Qty'];
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
            //reader.readAsDataURL(file);
            reader.onload = function() {
                fileReader = reader.result;
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
    var begin = true;
    var end = false;

    fileArray.forEach((el) => {
        if(el.includes("say") || el.includes("say_team")){ return; }

        if(el.includes("exec qc_game")){
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
            if(myArray[4].includes("<CT>") || myArray[4].includes("<TERRORIST>") || myArray[4].includes("World")) masterList.push(myArray);
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

function utilityRatio(id){
    player = parsedList[id];
    var purchased = 0;
    var threw = 0;

    if(typeof player["purchased" !== "undefined"]){
        if(typeof player["purchased"]["hegrenade"] !== "undefined") purchased +=    player["purchased"]["hegrenade"].length;
        if(typeof player["purchased"]["molotov"] !== "undefined") purchased +=      player["purchased"]["molotov"].length;
        if(typeof player["purchased"]["incgrenade"] !== "undefined") purchased +=   player["purchased"]["incgrenade"].length;
        if(typeof player["purchased"]["flashbang"] !== "undefined") purchased +=    player["purchased"]["flashbang"].length;
        if(typeof player["purchased"]["smokegrenade"] !== "undefined") purchased += player["purchased"]["smokegrenade"].length;
    }

    if(typeof player["threw"] !== "undefined"){
        if(typeof player["threw"]["hegrenade"] !== "undefined") threw +=    player["threw"]["hegrenade"].length;
        if(typeof player["threw"]["molotov"] !== "undefined") threw +=      player["threw"]["molotov"].length;
        if(typeof player["threw"]["incgrenade"] !== "undefined") threw +=   player["threw"]["incgrenade"].length;
        if(typeof player["threw"]["flashbang"] !== "undefined") threw +=    player["threw"]["flashbang"].length;
        if(typeof player["threw"]["smokegrenade"] !== "undefined") threw += player["threw"]["smokegrenade"].length;
    }
    
    player.utilityPurchased = purchased;
    player.utilityThrew     = threw;
    player.utilityRatio     = parseFloat((threw/purchased).toFixed(2));
}

function flashRatio(player){
    let totalFlashTime = 0;
    let flashRatio = 0;
    let enemyFlashes = 0;
    let teamFlashes = 0;
    let flashesThrown = 0;

    if(typeof parsedList[player]["blinded"] !== "undefined"){
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
    }

    if(typeof parsedList[player]["threw"] !== "undefined"){
        if(typeof parsedList[player]["threw"]["flashbang"] !== "undefined"){
            flashesThrown = parsedList[player]["threw"]["flashbang"].length;
        }
    }

    flashRatio = totalFlashTime/(flashesThrown*4.87);
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