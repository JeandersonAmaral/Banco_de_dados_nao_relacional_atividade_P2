from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
import uvicorn
import redis
import json
from typing import List
from datetime import datetime

app = FastAPI()

r = redis.Redis(host='localhost', port=6379, db=0)

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

    async def save_message(self, message: dict):
        message_json = json.dumps(message)
        r.lpush("chat_messages", message_json)

    async def get_messages(self):
        messages = r.lrange("chat_messages", 0, -1)
        decoded_messages = [json.loads(msg.decode('utf-8')) for msg in messages]
        return decoded_messages

    async def clear_messages(self):
        r.delete("chat_messages")
        return {"detail": "Todas as mensagens foram deletadas"}

manager = ConnectionManager()

@app.get("/")
async def get(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            message["timestamp"] = datetime.utcnow().isoformat()
            
            await manager.save_message(message)
            
            await manager.broadcast(json.dumps(message))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/messages")
async def get_messages():
    messages = await manager.get_messages()
    return {"messages": messages}

@app.delete("/messages")
async def clear_messages():
    await manager.clear_messages()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
