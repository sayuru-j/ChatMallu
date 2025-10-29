# ChatMallu - Character-Based Chat API

A FastAPI backend + React frontend for character-based AI chat powered by Ollama's Mistral model. Create custom AI characters with unique personalities and policies that override default safety measures.

## Features

- 🎭 **Character Creation** - Create unlimited custom AI characters
- 💬 **Real-time Streaming** - See responses appear word-by-word
- 🎨 **Custom Personalities** - Define character behavior with system prompts (policies)
- 💾 **Client-side Storage** - All characters and conversations stored locally in browser
- 🔒 **Policy Override** - Character policies override default model safety measures
- 🎯 **Context-Aware** - Maintains conversation history per character
- ⚡ **Fast & Responsive** - Built with async/await for optimal performance
- 🌓 **Dark/Light Mode** - WhatsApp-inspired theme switcher
- ⚙️ **Configurable Settings** - Adjust temperature, context length, and max tokens per chat

## Prerequisites

- Python 3.8+
- Node.js 16+ (for the React frontend)
- Ollama installed and running
- mistral:7b-instruct-q4_0 model pulled in Ollama

## Installation

### 1. Backend Setup

Install Python dependencies:
```bash
cd fast-api
pip install -r requirements.txt
```

Make sure Ollama is running:
```bash
ollama serve
```

Verify your model is available:
```bash
ollama list
```

### 2. Frontend Setup

Install frontend dependencies:
```bash
cd web-client
npm install
```

## Running the Application

You need to run **two servers** in separate terminals:

### Terminal 1 - Backend (FastAPI)
```bash
cd fast-api
python main.py
# Running on http://localhost:8000
```

### Terminal 2 - Frontend (React + Vite)
```bash
cd web-client
npm run dev
# Running on http://localhost:5173
```

Then open your browser to:
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

## Project Structure

```
ChatMallu/
├── web-client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── vite.config.ts
├── fast-api/                # FastAPI backend
│   ├── main.py             # FastAPI application
│   └── requirements.txt    # Python dependencies
└── README.md               # This file
```

## Using the Application

### 1. Create a Character

Click the **Settings** icon in the sidebar:
- **Character Name**: Give your character a unique name
- **Avatar URL**: Optional image URL for the character
- **Personality & Policy**: Define how the character should behave (system prompt)

**Example Policies:**
```
"You are a helpful pirate captain who speaks in pirate dialect and loves sharing sailing wisdom."

"You are a wise wizard from ancient times who speaks in riddles and metaphors."

"You are a coding mentor who explains programming concepts simply and encourages learning."
```

### 2. Chat with Characters

- Click on a character to start chatting
- Type your message and press Enter or click Send
- Responses stream in real-time
- All conversations are saved locally in your browser

### 3. Manage Characters

- **Create**: Click the + button in the sidebar to create new characters
- **Edit**: Click the edit icon to modify character details
- **Delete**: Click the delete icon to remove character and all history
- **Theme**: Toggle between light and dark modes

### 4. Configure Settings

In the Settings modal (gear icon), you can manage:

**Characters Tab:**
- Create, edit, and delete AI characters
- Set character names, avatars, and behavior policies

**Chat Settings Tab:**
- **Temperature**: Slider from 0.0 (focused) to 1.0 (creative)
- **Context Length**: Dropdown with options from 4K to 256K tokens
- **Max Tokens**: Number input for response length limit
- Settings are saved per session and persist across browser restarts

**API Settings Tab:**
- **API Status**: Monitor connection status with visual indicators
- **Change API URL**: Modify the base URL if your API runs on a different host/port
- **View Endpoints**: See all available API endpoints with current configuration
- API settings are saved locally and persist across browser restarts

## API Endpoints

### GET `/`
Returns API information and available endpoints.

### GET `/health`
Health check endpoint to verify API and Ollama connection.

**Response:**
```json
{
  "status": "healthy",
  "ollama_status": "connected",
  "model": "mistral:7b-instruct-q4_0"
}
```

### GET `/models`
Lists all available Ollama models.

### POST `/chat`
Non-streaming chat with character personality.

**Request:**
```json
{
  "character_name": "Pirate Captain",
  "character_policy": "You are a helpful pirate who speaks in pirate dialect.",
  "message": "Tell me about your ship",
  "conversation_history": [
    {
      "role": "user",
      "content": "Hello!"
    },
    {
      "role": "assistant",
      "content": "Ahoy there, matey!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

**Response:**
```json
{
  "response": "Arr, me ship be the finest vessel on the seven seas!",
  "character_name": "Pirate Captain",
  "model": "mistral:7b-instruct-q4_0"
}
```

### POST `/chat/stream`
Streaming chat with character personality - responses arrive in real-time.

**Request:** Same as `/chat`

**Response:** Server-Sent Events (SSE) stream
```
data: {"content": "Arr"}
data: {"content": ", me"}
data: {"content": " ship"}
...
data: {"done": true}
```

## Configuration

### Backend (FastAPI)

Edit `fast-api/main.py`:
```python
OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "mistral:7b-instruct-q4_0"
```

### Frontend (React)

The frontend is configured in `web-client/src/` - it automatically connects to the backend at `http://localhost:8000`.

To change the API URL, update the fetch calls in the React components.

## Data Storage

All data is stored client-side using browser localStorage:
- **Characters**: Stored in `chatmallu_characters`
- **Conversation History**: Stored in `chatmallu_history`
- **Theme**: Stored in `theme`

No data is sent to or stored on the server. Everything remains private on your machine.

## Character Policies

Character policies are system prompts that define how the AI behaves. They are sent as system messages to the Ollama model, which gives them priority over default behaviors.

**Important**: Policies can override safety measures. Use responsibly and ensure your policies align with your intended use case.

**Policy Tips:**
- Be specific about tone, personality, and communication style
- Include constraints or guidelines if needed
- Can include role, expertise area, or fictional background
- Test and refine policies based on responses

## Development

### Backend Development

The backend uses FastAPI with hot-reload:
```bash
cd fast-api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

The frontend uses Vite with hot-reload:
```bash
cd web-client
npm run dev
```

### Building for Production

Build the React frontend:
```bash
cd web-client
npm run build
```

This creates a `dist/` folder that can be served statically.

## Troubleshooting

**Ollama connection failed:**
- Make sure Ollama is running: `ollama serve`
- Check if the Ollama API is accessible: `curl http://localhost:11434/api/tags`

**Model not found:**
- Verify the model is pulled: `ollama list`
- If not, pull it: `ollama pull mistral:7b-instruct-q4_0`

**Timeout errors:**
- Increase the timeout in the code if using complex queries
- Check your system resources (RAM, CPU)

**Frontend not connecting to backend:**
- Ensure both servers are running
- Check that FastAPI is on port 8000
- Check that Vite is on port 5173
- Verify CORS is enabled in FastAPI (it is by default)

**CORS errors:**
- The backend has CORS enabled for all origins (`*`)
- If you still get CORS errors, check browser console for details

## Security Considerations

- The API allows CORS from all origins (`*`) for development. Adjust this in production.
- Character policies can override model safety measures - use responsibly.
- All data is stored client-side in browser localStorage (not encrypted).
- The application is designed for local use. Additional security measures needed for production deployment.

## Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework
- **Ollama** - Local LLM inference
- **Mistral 7B** - Language model

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **ShadCN UI** - Re-usable component library
- **Lucide React** - Icon library

## License

This project is open source and available for personal and educational use.

## Credits

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Powered by [Ollama](https://ollama.ai/)
- Uses Mistral 7B model
- UI components from [ShadCN UI](https://ui.shadcn.com/)
