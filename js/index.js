let socket = {
    run: function(){
        console.log("init socket");
        this.socket = new WebSocket(SERVER_ADDR);
        this.socket.onopen = this.onOpen;
        this.socket.onerror = this.onErr;
        this.socket.onmessage = this.handleMessage;
    },

    onOpen: function(){
        console.log("Socket connection success");
        onLogin();
    },

    onErr: function(event){
        alert("Socket Failure");
        // if (document.getElementById("loginWrapper").style.display !== "none"){
        //     onLoginFail();
        // }
        onLogin();
    },

    handleMessage: function(e){
        let msg = JSON.parse(e.data);
        console.log(msg);
    }
};

let SERVER_ADDR = "ws://127.0.0.1:6060"

window.onload = function () {
    console.log("script loaded");
    document.getElementById("loginButton").addEventListener("click", loginCheck);
}

function loginCheck(){
    let nickname = document.getElementById("indexLoginInput").value;
    let progressParent = document.getElementsByClassName("progress-striped")[0];
    let progress = document.getElementById("loginProgress");
    progressParent.style.removeProperty("visibility");
    progress.style.setProperty("width", "0");
    progress.setAttribute("class", progress.getAttribute("class").replace("danger", "success"))


    console.log("loading");
    socket.run();
    for(let i=1; i<=90; i++){
        setTimeout(() => {
            console.log(i);
            progress.style.setProperty("width", i + "%")}, 10*i);
    }
}

function onLogin(){
    let progress = document.getElementById("loginProgress");
    for(let i=91; i<=100; i++){
        setTimeout(() => {
            console.log(i);
            progress.style.setProperty("width", i + "%")}, 3*i);
    }

    let loginPanel = document.getElementById("loginWrapper");
    setTimeout(() => {
        loginPanel.style.display = "none";
    }, 1000);


    // for (let i=100; i>10; i--){
    //     setTimeout(() => {
    //         loginPanel.style.opacity -= 0.0001;
    //     }, 5*i);
    // }
}

function onLoginFail(){
    let progress = document.getElementById("loginProgress");
    progress.setAttribute("class", progress.getAttribute("class").replace("success", "danger"))
}