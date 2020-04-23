function flashRatio(player){
    let totalFlashTime = 0;
    let flashRatio = 0;

    for(var target in player["blinded"]){
        if(parsedList[target].team != player.team){
            for(var event in player["blinded"][target]){
                totalFlashTime += player["blinded"][target][event].blindedTime;
            }
        }
    }

    flashRatio = totalFlashTime/(player["threw"]["flashbang"].length*4.87);
    player.flashRatio = parseFloat(flashRatio.toFixed(2));
    player.totalFlashTime = totalFlashTime;
}

row = table.insertRow();
addCell('Flash ratio', row);
addCell('', row);
addCell(parsedList[id].flashRatio, row);