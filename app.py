from flask import Flask, render_template, redirect, url_for, request
from flask_socketio import SocketIO, send, join_room, leave_room  # Import the necessary functions
import random
import string

app = Flask(__name__)
socketio = SocketIO(app)

# In-memory store for rooms
chat_rooms = {}

# Dashboard - Create a new chat room
@app.route('/')
def index():
    return render_template('index.html', rooms=chat_rooms)

@app.route('/create_room', methods=['POST'])
def create_room():
    room_name = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    chat_rooms[room_name] = []
    return redirect(url_for('chat_room', room_name=room_name))

# Chat Room - Render chat page
@app.route('/chat/<room_name>')
def chat_room(room_name):
    if room_name not in chat_rooms:
        return redirect(url_for('index'))
    return render_template('chat.html', room_name=room_name)

# Real-time chat using SocketIO
@socketio.on('message')
def handle_message(msg, room):
    send(msg, room=room)

@socketio.on('join')
def on_join(room):
    chat_rooms[room].append(request.sid)
    join_room(room)  # Correct usage of join_room

@socketio.on('leave')
def on_leave(room):
    chat_rooms[room].remove(request.sid)
    leave_room(room)  # Correct usage of leave_room

if __name__ == '__main__':
    socketio.run(app, debug=True)
