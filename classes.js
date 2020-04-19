class ServerEvent{
    constructor(matchDate, eventTime, player, trigger, target, blindedTime, headshot, penetrated, team, flashIndex){
        //this.matchDate = matchDate;
        //this.eventTime = eventTime;
        this.player = player.split("<")[0];
        this.trigger = trigger;
        console.log(`${player} ${trigger} ${target}`);
        this.target = target.split("<")[0];
        this.blindedTime = parseFloat(blindedTime);
        this.headshot = headshot;
        this.penetrated = penetrated;
        this.team = team;
        this.flashIndex = flashIndex;
    }
}