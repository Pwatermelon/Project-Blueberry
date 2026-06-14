class BBmodel{
    SERVER = '127.0.0.1:8080'
    data;
    user;
    constructor(){
        this.user = new User();
    }

    loadUserData(mess){
        this.user.name = JSON.parse(mess)["data"]["login"];
        this.user.surname = JSON.parse(mess)["data"]["login"];
        this.user.login = JSON.parse(mess)["data"]["login"];
        this.user.calendar = JSON.parse(mess)["data"]["calendar"];
        this.user.group = JSON.parse(mess)["data"]["group"];
        ///загрузить в класс User всю дату
        return new Promise((resolve)=>{console.log("loaddata");resolve();})

    }
    get dataday(){
        const day = this.calculateDays();
        Object.defineProperty(this,"dataday",{value:day,writable:false,enumerable:false,configurable:false});
        return day;
    }
    calculateDays(){
        var s = this.user.calendar.split("+");
        var days =  [];
        for(var i=0; i<s.length;i++){
            days.push({"date":s[i].split("=")[0]+" "+s[i].split("=")[1],"paras":s[i].split("=").slice(2)});
        }
        return days

    }
    checkLoginThuth(login,password){
        const client = new WebSocketClient("ws://" + this.SERVER);
        client.connect();
        setTimeout(function(){client.sendMessage({"settings": "authentication", "login": login, "pass": password})}, 1000);
        this.data = JSON.parse(client.messageData);
    }
    loadMessenges(){

    }

}