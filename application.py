import os

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit

from models import *


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

CHANNEL_LIST = [Group('first'), Group('second'), Group('third')]


def channel_search(name):
    channels = []
    
    for group in CHANNEL_LIST:
        if group.name == name:
            channels = group.channels
    
    return channels


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/create_channel", methods=["POST"])
def create_channel():
    name = request.form.get("new_channel")
    group_name = request.form.get("group")
    channels = channel_search(group_name)
    
    for channel in channels:
        if channel.name == name:
            message = "Such name of channel exists."
            return jsonify({"success": False, "message": message})
    
    for group in CHANNEL_LIST:
        if group.name == group_name:
            new_channel = Channel(name)
            group.add_channel(new_channel)

    return jsonify({"success": True})


@socketio.on("submit post")
def create_post(data):
    channel_name = data["channel"]
    group_name = data["group"]
    text = data["new_post"]
    user = data["user"]
    timestamp = data["timestamp"]
    channels = channel_search(group_name)
    new_post = Post(user, timestamp, text)    

    for channel in channels:
        if channel.name == channel_name:
            channel.add_post(new_post)

    emit("announce post", new_post.post_info(), broadcast=True)


@socketio.on("delete post")
def delete_post(data):
    channel_name = data["channel"]
    group_name = data["group"]
    user = data["user"]
    timestamp = data["timestamp"]
    channels = channel_search(group_name)
    result = ''

    for channel in channels:
        if channel.name == channel_name:
            result = channel.delete_post(user, timestamp)

    data_emit = {'result': result, 'user': user, 'timestamp': timestamp}

    emit("deleted post", data_emit, broadcast=True)


@app.route("/posts", methods=["POST"])
def posts():
    channel_name = request.form.get("channel")
    group_name = request.form.get("group")
    channels = channel_search(group_name)
    posts = []

    for channel in channels:
        if channel.name == channel_name:
            posts = channel.post_list()

    return jsonify(posts)


@app.route("/channels", methods=["POST"])
def channels():
    group_name = request.form.get("group")
    channel_names = []
    channels = channel_search(group_name)
        
    for channel in channels:
        channel_names.append(channel.name)

    return jsonify(channel_names)
