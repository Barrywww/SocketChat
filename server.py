from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_socketio import SocketIO, send
import json

app = Flask(__name__)
app.config["SERECT_KEY"] = "DrewBarrymore"
app.secret_key = "DrewBarrymore"
socket = SocketIO(app, cors_allowed_origins='*')

users = []
groups = {"Broadcast": []}
usn2id = {}
us2grp = {}
us2us = {}


@app.route('/')
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

        msg2c = username + " has joined in the chat!"
        for member in groups["Broadcast"]:
            if (member != username) and (us2grp[member] == "Broadcast"):
                send(json.dumps(msg2c), rec=usn2id[member])
        if username not in groups['Broadcast']:
            groups["Broadcast"].append(username)
        us2grp[username] = "Broadcast"
        us2us[username] = ''
        print("Connected to '%s'" % username)

    elif msg["type"] == "msg":
        content = msg["content"]
        source = msg["src"]
        target = msg["tgt"]

        msg2c = source + ": " + content
        if msg["sendType"] == "public":
            for member in groups[target]:
                if (member != source) and (us2grp[member] == target):
                    send(json.dumps(msg2c), rec=usn2id[member])
        elif msg["sendType"] == "private":
            if us2us[target] == source:
                send(json.dumps(msg2c), rec=usn2id[target])
            elif target in users:
                msg2c = target + "  is now in another chat. Please try again later."
                send(json.dumps(msg2c), rec=usn2id[source])
            else:
                msg2c = target + "  is now offline."
                send(json.dumps(msg2c), rec=usn2id[source])

        print("'%s' sent a message '%s' to '%s'." % (source, content, target))

    elif msg["type"] == "join":
        username = msg["usn"]
        target = msg["tgt"]

        if us2us[username]:
            print("'%s' stopped receiving message from '%s'." % (username, target))
            msg2c = username + "has left the chat."
            if us2us[us2us[username]] == username:
                send(json.dumps(msg2c), rec=usn2id[us2us[username]])
            us2us[username] = ''
        elif us2grp[username]:
            print("'%s' stopped receiving message from '%s'." % (username, target))
            msg2c = username + "has left the group."
            for member in groups[us2grp[username]]:
                if (member != username) and (us2grp[member] == us2grp[username]):
                    send(json.dumps(msg2c), rec=usn2id[member])
            us2grp[username] = ''

        if msg["joinType"] == "private":
            us2us[username] = target
            msg2c = username + "has entered the chat."
            if us2us[target] == username:
                send(json.dumps(msg2c), rec=usn2id[target])
        elif msg["joinType"] == "group":
            us2grp[username] = target
            msg2c = username + "has entered the group."
            for member in groups[us2grp[username]]:
                if (member != username) and (us2grp[member] == target):
                    send(json.dumps(msg2c), rec=usn2id[member])

        print("'%s' joined the chat with '%s'." % (username, target))

    elif msg["type"] == "create":
        username = msg["usn"]
        groupname = msg["grpnm"]
        groups[groupname] = [username]

        print("'%s' created group '%s'." % (username, groupname))

    elif msg["type"] == "logout":
        username = msg["usn"]
        if username not in users:
            return redirect('/')
        print("User '%s' logs out." % username)
        users.remove(username)
        usn2id.pop(username, None)
        us2us.pop(username, None)
        us2grp.pop(username, None)


if __name__ == "__main__":
    socket.run(app, debug=True, host="127.0.0.1", port=6060)
