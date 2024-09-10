class BBcontroller{
    SERVER = '127.0.0.1:8080'
    constructor(View,Model){
        this.view = View;
        this.model = Model;
    }

    onLoaded(){
        this.view.loadLoadingPage();

    }
    onConnection(model){
        const client = new WebSocketClient("ws://" + this.SERVER);
        client.connect(this)
        setTimeout(function (){ client.sendMessage({"type": "hello"})},1000);
        return new Promise((resolve)=>{console.log("checked");resolve();})
    }
    Login(mess){
        let log = document.getElementById("login").value;
        let pass = document.getElementById("password").value;
        const client = new WebSocketClient("ws://" + this.SERVER);
        client.connect(this);
        setTimeout(function(){client.sendMessage({"settings": "authentication", "login": log, "pass": pass})}, 1000);
        return new Promise((resolve)=>{console.log("checked");resolve();})
    }
    JoinMainPage(){
        const client = new WebSocketClient("ws://" + this.SERVER);
        client.connect(this);
        setTimeout(function(){client.sendMessage({"settings": "getUserDatafirst","login": location.search.substring(1)})}, 1000);
        return new Promise((resolve)=>{console.log("checked");resolve();})
    }
    async handleMessfromServ(mess){
        if (JSON.parse(mess)["message"]==="hello!"){
            await this.view.loadAuthPage();
        }
        if (JSON.parse(mess)["message"]==="authentication"){
            if (JSON.parse(mess)["auth"]==="successfulLogin"){
                await this.view.renderMainPage(document.getElementById("login").value);
            }
            if (JSON.parse(mess)["auth"]==="unsuccessfulLogin"){
                await this.view.errorAuthPage();
            }
        }
        if (JSON.parse(mess)["message"]==="userDatafirst"){
            await this.model.loadUserData(mess);
            this.handleCalendars();
        }
        return new Promise((resolve)=>{console.log("msgcomplete");resolve();})
    }


    Register(){

    }
    handleChats(){
        this.view.showChats();
    }
    handleNews(){
        this.view.showNews();
    }
    handleCalendars(){
        this.view.showCalendar(this.model);
    }
    handleProfile(){
        this.view.showProfile();
    }
    handleMap(){
        this.view.showMap();
    }
    handleLogout(){

    }
    handleMessage(messageText){

    }


}