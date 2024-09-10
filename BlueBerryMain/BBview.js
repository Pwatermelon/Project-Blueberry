class BBview{
    constructor(){
        
    }
    loadLoadingPage(){
        window.location.href = "views/loading.html"
    }
    loadRegistrationPage(){
        window.location.href = "registerpage.html"
    }
    loadAuthPage(){
        window.location.href = "autorize.html"
    }
    errorAuthPage(){
        this.loadAuthPage();
        alert("Вы ввели неправильный логин или пароль");
    }
    renderMainPage(log){
        window.location.href = "page.html?user=" + log;
    }
    showChats(chatList){
        var ele = document.getElementsByClassName('content');
        for (var i = 0; i < ele.length; i++ ) {
            ele[i].style.display = "none";
        }
        document.getElementById("chatCont").style.display = "block";
    }
    openChat(chat){

    }
    showProfile(user){
        var ele = document.getElementsByClassName('content');
        for (var i = 0; i < ele.length; i++ ) {
            ele[i].style.display = "none";
        }
        document.getElementById("profileCont").style.display = "block";
    }
    showNews(){
        var ele = document.getElementsByClassName('content');
        for (var i = 0; i < ele.length; i++ ) {
            ele[i].style.display = "none";
        }
        document.getElementById("newsCont").style.display = "block";
    }
    showMap(){
        var ele = document.getElementsByClassName('content');
        for (var i = 0; i < ele.length; i++ ) {
            ele[i].style.display = "none";
        }
        document.getElementById("mapCont").style.display = "block";
    }
    showCalendar(model){
        var ele = document.getElementsByClassName('content');
        for (var i = 0; i < ele.length; i++ ) {
            ele[i].style.display = "none";
        }
        document.getElementById("calendarCont").style.display = "block";
        let calendarDay = new Date();

        var s = model.dataday
        for (var i = 0 ;i < s.length ; i++ ) {
            var b = document.createElement("h1");
            b.innerHTML+= s[i]["date"]+"\n"+s[i]["paras"].join("\n")
            document.getElementById("calendarCont").appendChild(b);
        }


    }
    showChoseCalendarDay(calendarDay){

    }
}