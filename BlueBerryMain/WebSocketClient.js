

class WebSocketClient {
    SERVER = '127.0.0.1:8080'
    messageData;
    client;
    constructor(url) {
        this.url = url;
        this.websocket = null;
    }

    connect(client) {
        this.client = client;
        this.websocket = new WebSocket(this.url);

        this.websocket.onmessage = (event) => {
            this.handleMessage(event);
        };
        this.websocket.onopen = () => {
            console.log("Connected to server");
        };
        this.websocket.onerror = (event) => {
            console.log("Error occurred");
        };
        this.websocket.onclose = () => {
            console.log("Disconnected from server");
        };
        return new Promise((resolve)=>{console.log("Created");resolve();})

    }

    sendMessage(message) {
        this.websocket.send(JSON.stringify(message));
        return new Promise((resolve)=>{console.log("sended");resolve();})

    }

    // authentication(event) {
    //     if (event.data == {"authentication": "successfulLogin"}){
    //         window.location.href = "page.html";
    //         }
    //         else {
    //             // window.location.reload();
    //             console.log("Неудача")
    //         }
    //     };

    handleMessage(event) {
        let data = event.data;
        console.log(data);
        this.client.handleMessfromServ(data);
    }
}