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
            return jsonify({"success": False, "message": "Such name of channel exists."})
    
    for group in CHANNEL_LIST:
        if group.name == group_name:
            new_channel = Channel(name)
            group.add_channel(new_channel)

    return jsonify({"success": True})


@app.route("/create_post", methods=["POST"])
def create_post():
    channel_name = request.form.get("channel")
    group_name = request.form.get("group")
    text = request.form.get("new_post")
    user = request.form.get("user")
    timestamp = request.form.get("timestamp")
    channels = channel_search(group_name)
    
    for channel in channels:
        if channel.name == channel_name:
            new_post = Post(user, timestamp, text)
            channel.add_post(new_post)

    return jsonify({"success": True})


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
