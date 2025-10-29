# Quick Start Guide

Get ChatMallu running in 3 easy steps!

## Prerequisites Check

Before starting, make sure you have:
- ✅ Python 3.8+ installed
- ✅ Node.js 16+ installed
- ✅ Ollama installed and running

## Step 1: Start Ollama

Open a terminal and run:
```bash
ollama serve
```

Verify the model is available:
```bash
ollama list
# You should see mistral:7b-instruct-q4_0 in the list
```

If not, pull it:
```bash
ollama pull mistral:7b-instruct-q4_0
```

## Step 2: Start the Backend (FastAPI)

Open a **new terminal** in the project folder:

```bash
# Install Python dependencies (first time only)
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Keep this terminal running! ✅

## Step 3: Start the Frontend (React + Vite)

Open **another new terminal** in the project folder:

```bash
# Navigate to the frontend
cd vite-client

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

Keep this terminal running too! ✅

## Step 4: Open the App

Open your browser and go to:
**http://localhost:5173**

## Using the App

1. **Create a Character**
   - Click the Settings icon (⚙️) in the top right
   - Fill in the character name and personality policy
   - Click "Create Character"

2. **Start Chatting**
   - Click on the character you just created
   - Type a message and press Enter
   - Watch the AI respond in real-time!

3. **Toggle Theme**
   - Click the moon/sun icon to switch between dark and light modes

## Example Character Policy

Try this for your first character:

**Name**: Friendly Pirate

**Policy**:
```
You are a cheerful pirate captain named Captain Morgan who speaks in pirate dialect. 
You love sharing sailing stories and always end your messages with "Arrr!" 
You're knowledgeable about the sea, ships, and pirate history.
```

## Troubleshooting

### "Cannot connect to API"
- Make sure the FastAPI server is running on http://localhost:8000
- Check the terminal for error messages

### "Ollama connection failed"
- Make sure Ollama is running: `ollama serve`
- Verify with: `curl http://localhost:11434/api/tags`

### Frontend won't start
- Make sure you ran `npm install` in the vite-client folder
- Try deleting `node_modules` and running `npm install` again

### Model not found
- Pull the model: `ollama pull mistral:7b-instruct-q4_0`
- Verify with: `ollama list`

## What's Running?

You should have **3 processes** running:

1. **Ollama** (port 11434) - The AI model server
2. **FastAPI** (port 8000) - The backend API
3. **Vite** (port 5173) - The frontend development server

## Stopping the App

Press `Ctrl+C` in each terminal to stop the servers.

## Next Steps

- Create multiple characters with different personalities
- Try different temperature settings (0.1 = focused, 1.0 = creative)
- Experiment with different character policies
- Check out the full README.md for more details

Happy chatting! 🎉

