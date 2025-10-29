from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json

app = FastAPI(title="ChatMallu - Character Chat API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama configuration
OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "mistral:7b-instruct-q4_0"
MODEL_MAX_CTX = 32768
MODEL_MAX_TOKENS = 4096

# Models
class Message(BaseModel):
    role: str  # 'user', 'assistant', or 'system'
    content: str

class ChatRequest(BaseModel):
    character_name: str
    character_policy: str  # The system prompt that defines character behavior
    message: str
    conversation_history: Optional[List[Message]] = []
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2000
    context_length: Optional[int] = 32768  # Default 32k context

class ChatResponse(BaseModel):
    response: str
    character_name: str
    model: str

# Endpoints
@app.get("/")
async def root():
    return {
        "message": "Welcome to ChatMallu - Character Chat API",
        "model": MODEL_NAME,
        "endpoints": {
            "/chat": "POST - Chat with character (non-streaming)",
            "/chat/stream": "POST - Chat with character (streaming)",
            "/health": "GET - Check API health",
            "/models": "GET - List available models"
        },
        "frontend": "Run 'npm run dev' in vite-client folder to start the UI"
    }

@app.get("/health")
async def health_check():
    """Check if the API and Ollama are running"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5.0)
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "ollama_status": "connected",
                    "model": MODEL_NAME
                }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama connection failed: {str(e)}"
        )

@app.get("/models")
async def list_models():
    """List all available Ollama models"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10.0)
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch models from Ollama"
                )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to Ollama: {str(e)}"
        )

# Chat Endpoints with Character Support
@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat endpoint with character personality"""
    
    async def generate():
        try:
            # Build the conversation context with character policy as system message
            messages = []
            
            # Add character policy as system message (this overrides safety measures)
            messages.append({
                "role": "system",
                "content": request.character_policy
            })
            
            # Add conversation history
            for msg in request.conversation_history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
            
            # Add current message
            messages.append({
                "role": "user",
                "content": request.message
            })
            
            # Clamp and normalize options
            num_ctx = request.context_length or MODEL_MAX_CTX
            if num_ctx > MODEL_MAX_CTX:
                num_ctx = MODEL_MAX_CTX
            if num_ctx < 1024:
                num_ctx = 1024

            num_predict = request.max_tokens or MODEL_MAX_TOKENS
            if num_predict > MODEL_MAX_TOKENS:
                num_predict = MODEL_MAX_TOKENS
            if num_predict < 32:
                num_predict = 32

            temperature = request.temperature if request.temperature is not None else 0.7
            if temperature < 0:
                temperature = 0
            if temperature > 1.5:
                temperature = 1.5

            async with httpx.AsyncClient(timeout=120.0) as client:
                payload = {
                    "model": MODEL_NAME,
                    "messages": messages,
                    "stream": True,
                    "options": {
                        "temperature": temperature,
                        "num_predict": num_predict,
                        "num_ctx": num_ctx
                    }
                }
                
                async with client.stream(
                    "POST",
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json=payload
                ) as response:
                    if response.status_code != 200:
                        try:
                            body = await response.aread()
                            detail = body.decode(errors="ignore")
                        except Exception:
                            detail = ""
                        yield f"data: {json.dumps({'error': f'Ollama request failed: {detail[:500]}'})}\n\n"
                        return
                    
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                if "message" in data and "content" in data["message"]:
                                    chunk = data["message"]["content"]
                                    if chunk:
                                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                                
                                if data.get("done", False):
                                    yield f"data: {json.dumps({'done': True})}\n\n"
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/chat")
async def chat(request: ChatRequest):
    """Non-streaming chat endpoint with character personality"""
    
    try:
        # Build the conversation context with character policy as system message
        messages = []
        
        # Add character policy as system message (overrides safety measures)
        messages.append({
            "role": "system",
            "content": request.character_policy
        })
        
        # Add conversation history
        for msg in request.conversation_history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": request.message
        })
        
        # Clamp and normalize options
        num_ctx = request.context_length or MODEL_MAX_CTX
        if num_ctx > MODEL_MAX_CTX:
            num_ctx = MODEL_MAX_CTX
        if num_ctx < 1024:
            num_ctx = 1024

        num_predict = request.max_tokens or MODEL_MAX_TOKENS
        if num_predict > MODEL_MAX_TOKENS:
            num_predict = MODEL_MAX_TOKENS
        if num_predict < 32:
            num_predict = 32

        temperature = request.temperature if request.temperature is not None else 0.7
        if temperature < 0:
            temperature = 0
        if temperature > 1.5:
            temperature = 1.5

        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "model": MODEL_NAME,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": num_predict,
                    "num_ctx": num_ctx
                }
            }
            
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                return ChatResponse(
                    response=result["message"]["content"],
                    character_name=request.character_name,
                    model=MODEL_NAME
                )
            else:
                raise HTTPException(status_code=response.status_code, detail=f"Ollama request failed: {response.text}")
                
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Request to Ollama timed out"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
