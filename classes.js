class ServerEvent{
    constructor(matchDate, eventTime, player, trigger, target, blindedTime, headshot, penetrated, flashIndex){
        //this.matchDate = matchDate;
        //this.eventTime = eventTime;
        this.player = player.split("<")[0];
        this.trigger = trigger;
        this.target = target.split("<")[0];
        this.blindedTime = parseFloat(blindedTime);
        this.headshot = headshot;
        this.penetrated = penetrated;
        this.flashIndex = flashIndex;
    }
}