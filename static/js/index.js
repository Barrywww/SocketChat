let socket;
let username;
let chatInput;
let msgBox;
let grpn = "Broadcast";
let SERVER_ADDR = "http://127.0.0.1:6060";
let currentActive;
let currentChatType = "group";
let currentSelectorType = "group";

const initSocket = function (){
    return new Promise((resolve, reject) => {
        socket = io('http://127.0.0.1:6060');
        socket.on('connect', () =>{
            console.log("connected to socket");
            socket.send(JSON.stringify({"id": socket.id, "usn": username, "type":"connect"}))
            resolve();
        });

        socket.on("message", (msg) => {
                msg = msg.slice(1,-1);
                if (msg.slice(0,2) !== "$i"){
                    displayMessage(msg);
                }
                else{
                    displayMessage(msg.slice(2,-1));
                }
            }
        );
    })
};

window.onload = function () {
    console.log("script loaded");
    document.getElementById("loginButton").addEventListener("click", loginCheck);
}

window.onunload = async function (e){
    await logout();
}


function loginCheck(){
    let username = document.getElementById("indexLoginInput").value;
    let progressParent = document.getElementsByClassName("progress-striped")[0];
    let progress = document.getElementById("loginProgress");
    progressParent.style.removeProperty("visibility");
    progress.style.setProperty("width", "0");
    progress.setAttribute("class", progress.getAttribute("class").replace("danger", "success"))

    console.log("loading");

    const response = function(){
        try{
            return fetch(SERVER_ADDR + "/login/" + username, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' }})}
        catch(e){return new Promise.reject();}
    }

    response().then((r) => r.json(), () => {
        setTimeout(() => {
            onLoginFail("Server failure! Please check server status or restart.");
        }, 500);
    }).then((r) => {
        if (r["ans"] === "Success"){
            onLogin();
        }
        else{
            setTimeout(() => {
                onLoginFail("Username existed! Please try another one.");
            }, 500);


        }
    });

    for(let i=1; i<=20; i++){
        setTimeout(() => {
            console.log(i);
            if (i >= parseFloat(progress.style.width)){
            progress.style.setProperty("width", i + "%")}}, 10*i);
    }
}

function onLogin(){
    username = document.getElementById("indexLoginInput").value;
    chatInput = document.getElementById("msgInputInner");
    msgBox = document.getElementById("msgBoxInner");
    let progress = document.getElementById("loginProgress");
    let loginPanel = document.getElementById("loginWrapper");
    let chatPanel = document.getElementById("chatWrapper");
    let greetings = document.getElementById("loginGreetings");
    let cGrettings = document.getElementById("chatGreeting");

    initSocket().then(() => {
        localStorage.setItem("username", username);
        localStorage.setItem("loggedIn", "true");
        greetings.innerHTML = "<h1>Welcome, " + username + "</h1>";
        cGrettings.innerHTML = "<h1>Welcome, " + username + "</h1>";
        for(let i=21; i<=100; i++){
            setTimeout(() => {
                console.log(i);
                progress.style.setProperty("width", i + "%")}, 1*i);
            if (i === 100){
                setTimeout(() => {
                    loginPanel.style.display = "none";
                    chatPanel.style.display = "flex";
                }, 1000);
            }
        }

        document.getElementById("buttonUser").addEventListener("click", (e) =>{
            currentSelectorType = "user";
            refreshUsers();
            e.target.parentNode.setAttribute("class", "active selector");
            let g = document.getElementById("buttonGroup");
            g.setAttribute("class", "selector");
            e.preventDefault();
            e.stopPropagation();
        })
        document.getElementById("buttonGroup").addEventListener("click", (e) => {
            currentSelectorType = "group";
            refreshGroups();
            e.target.parentNode.setAttribute("class", "active selector");
            let u = document.getElementById("buttonUser");
            u.setAttribute("class", "selector");
            e.preventDefault();
            e.stopPropagation();
        })

        document.getElementById("logoutButton").addEventListener("click", logout);
        document.getElementById("sendButton").addEventListener("click", sendMsg);

        refreshGroups();
        setInterval(() => {
            if (currentSelectorType === "group"){
                refreshGroups();
            }
            else{
                refreshUsers();
            }
        }, 5000);
    })
}

function onLoginFail(msg){
    let progress = document.getElementById("loginProgress");
    progress.setAttribute("class", progress.getAttribute("class").replace("success", "danger"))
    alert(msg);
}

function refreshUsers(){
    const response = function () {return fetch(SERVER_ADDR + "/get_user_list/" + username, {method: "GET"})}
    let userLst = document.getElementById("user-ul");
    let groupLst = document.getElementById("group-ul");
    userLst.innerHTML = '';
    response().then(response => response.text()).then(json => {
        json = JSON.parse(json);
        console.log(json);
        for (let n of json["list"]){
            let user = document.createElement("li");
            if (currentActive !== undefined && n === currentActive.innerText && currentChatType === "private"){
                user.setAttribute("class", "list-group-item chat-user-group active");
                currentActive = user;
            }
            else{
                user.setAttribute("class", "list-group-item chat-user-group");
            }
            user.addEventListener("click", function (){
                if (this !== currentActive){
                    if (currentActive !== undefined){
                        currentActive.setAttribute("class",
                            currentActive.getAttribute("class")
                                .replace(" active", ""))
                    }
                    this.setAttribute("class", "list-group-item chat-user-group active");
                    currentActive = user;
                    msgBox.innerHTML = "";
                    currentChatType = "private";
                    joinPrivateChat(n);
                }
            })
            user.innerText = n;
            userLst.appendChild(user);
        }
        userLst.style.display = "";
        groupLst.style.display = "none";
    })
}

function refreshGroups(){
    const response = function () {return fetch(SERVER_ADDR + "/get_group_list", {method: "GET"})}
    let userLst = document.getElementById("user-ul");
    let groupLst = document.getElementById("group-ul");
    let ch = groupLst.childNodes;
    let more_update = true;
    for(let i = ch.length - 1; i >= 1; i--) {
        groupLst.removeChild(ch[i]);
    }
    document.getElementById("newGrp").addEventListener("click", newGroup);
    response().then(response => response.text()).then(json => {
        json = JSON.parse(json);
        for (let n of json["list"]){
            let group = document.createElement("li");
            if (n === grpn && currentChatType === "group"){
                more_update = false;
                console.log(grpn + "set");
                group.setAttribute("class", "list-group-item chat-user-group active");
                currentActive = group;
                let children = groupLst.children
                for (let c=1; c<children.length;c++){
                    children[c].setAttribute("class", "list-group-item chat-user-group");
                }

            }
            else if (more_update && currentActive !== undefined && n === currentActive.innerText && currentChatType === "group"){
                group.setAttribute("class", "list-group-item chat-user-group active");
                currentActive = group;
            }
            else{
                group.setAttribute("class", "list-group-item chat-user-group");
            }
            group.innerText = n;
            // let badge = document.createElement("span");
            // badge.setAttribute("class", "badge");
            // badge.innerHTML = n.users;
            // group.appendChild(badge);
            group.addEventListener("click", function (){
                if (currentActive !== this){
                    if (currentActive !== undefined){
                        currentActive.setAttribute("class",
                            currentActive.getAttribute("class")
                                .replace(" active", ""))
                    }
                    this.setAttribute("class", "list-group-item chat-user-group active");
                    currentActive = group;
                    currentChatType = "group";
                    msgBox.innerHTML = "";
                    joinGroupChat(n);
                }
            })
            groupLst.appendChild(group);
        }
        groupLst.style.display = "";
        userLst.style.display = "none";
    })
}

function joinPrivateChat(user){
    let msg = {
        "usn": username,
        "tgt": user,
        "type": "join",
        "content": " joined the chat.",
        "joinType": "private"
    }
    socket.send(JSON.stringify(msg));
}

function newGroup(){
    let grpName = document.getElementById("grpName")
    let msg = {
        "usn": username,
        "type": "create",
        "grpnm": grpName.value
    }
    let value = grpName.value;
    grpn = value;
    socket.send(JSON.stringify(msg));
    const doUpdate =  () => {
        refreshGroups();
        joinGroupChat(value);
    }
    doUpdate();
    grpName.value = "";
}

function joinGroupChat(grpName){
    let msg = {
        "usn": username,
        "tgt": grpName,
        "type": "join",
        "content": " joined the chat.",
        "joinType": "group"
    }
    socket.send(JSON.stringify(msg));
}

function sendMsg(){
    let msg = chatInput.value;
    chatInput.value = "";
    let tgt = currentActive.innerText;
    let m = {
        "src": username,
        "tgt": tgt,
        "type": "msg",
        "content": msg,
        "sendType": currentChatType
    }
    socket.send(JSON.stringify(m));
}

function displayMessage(msg){
    console.log(msg);
    msgBox.innerHTML += msg + "<br><br>";
    msgBox.scrollTop = msgBox.scrollHeight;
    if (currentSelectorType === "group"){
        refreshGroups();
    }
    else{
        refreshUsers();
    }
}

async function logout(){
    if (socket !== undefined){
        socket.send(JSON.stringify({
            "usn": username,
            "type": "logout"
        }))
        const result = await socket.close();
        const response = function () {return fetch(SERVER_ADDR + "/logout/" + username, {
            method: "GET",
        })}
        response().then(() => {
            localStorage.removeItem("username");
            localStorage.removeItem("loggedIn");
            location.reload();
        });
    }
}