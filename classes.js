class ServerEvent {
    constructor(matchDate, eventTime, player, trigger, target, gun, blindedTime, headshot, penetrated, flashIndex, round) {
        //this.matchDate = matchDate;
        //this.eventTime = eventTime;
        //new comment
        this.player = player.split("<")[0];
        this.trigger = trigger;
        this.target = target.split("<")[0];
        this.blindedTime = parseFloat(blindedTime);
        this.headshot = headshot;
        this.penetrated = penetrated;
        this.flashIndex = flashIndex;
        this.gun = gun;
        this.round = round;
    }
}