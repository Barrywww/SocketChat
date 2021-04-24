from flask import Flask, render_template, request, redirect, url_for,session, flash
from flask_socketio import SocketIO, send
from flask_cors import CORS
import json
import datetime

app = Flask(__name__)
app.config["SERECT_KEY"] = "secret!"
app.secret_key = "DrewBarrymore"
socket = SocketIO(app)

users = []
groups = {"Broadcast":[]}
usn2id = {}
us2grp = {}
us2us = {}

@app.route('/', methods=['GET', 'POST'])
def home():
    return render_template("index.html")

@socket.on('message')
def handle_message(msg):
    msg = json.loads(msg)
    print("Received message")
    print(msg)
    if msg["type"] == "connect":
        user_id = msg["id"]
        username = msg["usn"]
        usn2id[username] = user_id

        msg["time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        msg["content"] = "Hello, everyone. I am in."
        msg["src"] = username
        for member in groups["Broadcast"]:
            if (member != username) and (usn2id.get(member) != None):
                send(json.dumps(msg), to=usn2id[member])

        if username not in groups['Broadcast']:
            groups["Broadcast"].append(username)
            us2grp[username] = "Broadcast"
        print("Connected to '%s'" % username)

    elif msg["type"] == "msg":
        content = msg["content"]
        source = msg["src"]
        target = msg["tgt"]
        msg["time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if msg["sendType"] == "public":
            for member in groups[target]:
                if (member != source) and (usn2id.get(member) != None):
                    send(json.dumps(msg), to=usn2id[member])
        elif msg["sendType"] == "private":
            if usn2id.get(target, False):
                send(json.dumps(msg), to=usn2id[target])

        print("'%s' sent a message '%s' to '%s'." % (source, content, target))

    elif msg["type"] == "join":
        username = msg["usn"]
        target = msg["tgt"]

        if us2us[username]:
            print("'%s' stopped the chat with '%s'." % (username, target))
            nmsg = {"type": "msg", "content": username + "has left the chat.", "src": username, "tgt": us2us[username],"sendType": "private", "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
            send(json.dumps(nmsg), to=usn2id[us2us[username]])
            us2us[username] = ''
        elif us2grp[username]:
            print("'%s' left '%s'." % (username, target))
            nmsg = {"type": "msg", "content": username + "has left the group.", "src": username, "tgt": us2grp[username],"sendType": "private", "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
            for member in groups[us2grp[username]]:
                if (member != username) and (usn2id.get(member) != None):
                    send(json.dumps(nmsg), to=usn2id[member])
            groups[us2grp[username]].remove(username)
            us2grp[username] = ''

        if msg["joinType"] == "private":
            us2us[username] = target
        elif msg["joinType"] == "group":
            us2grp[username] = target

        print("'%s' joined the chat with '%s'." % (username, target))



if __name__ == "__main__":
    socket.run(app, debug=True, host="127.0.0.1", port=6060)