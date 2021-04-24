let socket;
let SERVER_ADDR = "ws://127.0.0.1:6060"

window.onload = function () {
    console.log("script loaded");
    document.getElementById("loginButton").addEventListener("click", loginCheck);
}

async function loginCheck(){
    let nickname = document.getElementById("indexLoginInput").value;
    let progressParent = document.getElementsByClassName("progress-striped")[0];
    let progress = document.getElementById("loginProgress");
    progressParent.style.removeProperty("visibility");

    console.log("loading");


    for(let i=1; i<=90; i++){
        setTimeout(() => {
            console.log(i);
            progress.style.setProperty("width", i + "%")}, 3*i);
    }

    socket = initialSocket();
    await socket.run();


    new Promise((resolve, reject) => {


        console.log("213213213");
        console.log(socket.state);
        if (socket.socket.readyState === 3){
            alert("login failed");
        }
        else{
            resolve(s);
        }
    }).then(() => {
            for(let i=91; i<=101; i++){
                setTimeout(() => {
                    console.log(i);
                    progress.style.setProperty("width", i + "%")}, 3*i);
            }
    },
        () => {
            alert("Login Failed!");
        })

}

function initialSocket(){
    console.log("init called");
    s = {
        state: "pending",
        run: async function(){
            this.socket = await new WebSocket(SERVER_ADDR);
            this.socket.onopen = this.onOpen;
            this.socket.onerror = this.onErr;
            this.socket.onmessage = this.handleMessage;
        },

        onOpen: function(){
            console.log("Socket connection success");
            this.state = "success";
        },

        onErr: function(event){
            alert("socket failure");
        },

        handleMessage: function(e){
            let msg = JSON.parse(e.data);
            console.log(msg);
        }
    };
    return s;
}