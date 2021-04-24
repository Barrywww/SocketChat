let socket = {
    run: function(){
        console.log("init socket");
        this.socket = new WebSocket(SOCKET_SERVER_ADDR);
        this.socket.onopen = this.onOpen;
        this.socket.onerror = this.onErr;
        this.socket.onmessage = this.handleMessage;
    },

    onOpen: function(){
        console.log("Socket connection success");
    },

    onErr: function(event){
        alert("Socket Failure");

    },

    handleMessage: function(e){
        let msg = JSON.parse(e.data);
        console.log(msg);
    }
};

let SERVER_ADDR = "http://127.0.0.1:5500";
let SOCKET_SERVER_ADDR = "ws://127.0.0.1:6060"
let userList = [{"username": "Leon", "uid": 1}, {"username": "Barry", "uid": "2"}];
let groupList = [{"groupName": "Barry, Leon", "gid": "2", "users": "2"}];
let currentActive;

window.onload = function () {
    console.log("script loaded");
    document.getElementById("loginButton").addEventListener("click", loginCheck);
}

function loginCheck(){
    let username = document.getElementById("indexLoginInput").value;
    let progressParent = document.getElementsByClassName("progress-striped")[0];
    let progress = document.getElementById("loginProgress");
    progressParent.style.removeProperty("visibility");
    progress.style.setProperty("width", "0");
    progress.setAttribute("class", progress.getAttribute("class").replace("danger", "success"))

    console.log("loading");
    // socket.run();

    const response = function(){return fetch(SERVER_ADDR + "/login", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({"username": username}),
    })}

    response().then((r) => {
        if (r.status === 200){
            console.log("s");
            setTimeout(onLogin, 500);
        }
        else{
            alert("Username Existed! Please try again.");
            onLoginFail();
        }
    });

    for(let i=1; i<=90; i++){
        setTimeout(() => {
            console.log(i);
            progress.style.setProperty("width", i + "%")}, 10*i);
    }
}

function onLogin(){
    let username = document.getElementById("indexLoginInput").value;
    localStorage.setItem("username", username);
    localStorage.setItem("loggedIn", "true");

    let progress = document.getElementById("loginProgress");
    for(let i=91; i<=100; i++){
        setTimeout(() => {
            console.log(i);
            progress.style.setProperty("width", i + "%")}, 3*i);
    }

    let loginPanel = document.getElementById("loginWrapper");
    let chatPanel = document.getElementById("chatWrapper");
    let msgBox = document.getElementById("msgBoxInner");
    document.getElementById("buttonUser").addEventListener("click", (e) =>{
        refreshUsers();
        e.target.parentNode.setAttribute("class", "active selector");
        let g = document.getElementById("buttonGroup");
        g.setAttribute("class", "selector");
        e.preventDefault();
        e.stopPropagation();
    })
    document.getElementById("buttonGroup").addEventListener("click", (e) => {
        refreshGroups();
        e.target.parentNode.setAttribute("class", "active selector");
        let u = document.getElementById("buttonUser");
        u.setAttribute("class", "selector");
        e.preventDefault();
        e.stopPropagation();
    }, true)

    document.getElementById("logoutButton").addEventListener("click", logout);
    refreshUsers();


    setTimeout(() => {
        loginPanel.style.display = "none";
        chatPanel.style.display = "flex";
    }, 1000);
}

function onLoginFail(){
    let progress = document.getElementById("loginProgress");
    progress.setAttribute("class", progress.getAttribute("class").replace("success", "danger"))
}

function refreshUsers(){
    const response = function () {return fetch(SERVER_ADDR + "/get_user_list", {method: "GET"})}
    let userLst = document.getElementById("user-group-ul");
    userLst.innerHTML = '';
    response().then(response => response.json()).then(json => {
        for (let n of json["users"]){
            let user = document.createElement("li");
            user.setAttribute("class", "list-group-item chat-user-group");
            user.addEventListener("click", function (){
                if (currentActive !== undefined){
                    currentActive.setAttribute("class",
                        currentActive.getAttribute("class")
                            .replace(" active", ""))
                }
                this.setAttribute("class", "list-group-item chat-user-group active");
                currentActive = user;
            })
            user.innerText = n.username;
            userLst.appendChild(user);
        }
    })
}

function refreshGroups(){
    const response = function () {return fetch(SERVER_ADDR + "/get_group_list", {method: "GET"})}
    let groupLst = document.getElementById("user-group-ul");
    groupLst.innerHTML = "";
    response().then(response => response.json()).then(json => {
        for (let n of json["groups"]){
            let group = document.createElement("li");
            group.setAttribute("class", "list-group-item chat-user-group");
            group.innerText = n.groupName;
            let badge = document.createElement("span");
            badge.setAttribute("class", "badge");
            badge.innerHTML = n.users;
            group.appendChild(badge);
            group.addEventListener("click", function (){
                if (currentActive !== undefined){
                    currentActive.setAttribute("class",
                        currentActive.getAttribute("class")
                            .replace(" active", ""))
                }
                this.setAttribute("class", "list-group-item chat-user-group active");
                currentActive = group;
            })
            groupLst.appendChild(group);
        }
    })
}

async function logout(){
    const result = await socket.socket.close();
    const response = function () {return fetch(SERVER_ADDR + "/logout", {
        method: "POST",
        body: JSON.stringify({
            username: localStorage.getItem("username")
        })
    })}
    response().then(response => response.json()).then(json => {
        if (json["result"] === "success"){
            localStorage.removeItem("username");
            localStorage.removeItem("loggedIn");
            location.reload();
        }
    })
}