import os
import re
import pickle
from contextlib import asynccontextmanager
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from keras.models import load_model
from pydantic import BaseModel, Field
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Model and tokenizer paths
model_path = 'Artifactes/BiGRU_model.keras'
tokenizer_path = 'Artifactes/tokenizer.pkl'

# Max sequence length
max_sequence_length = 50

# Emotion labels
emotion_labels = ['sadness', 'joy', 'love', 'anger', 'fear', 'surprise']

# Emotion emojis
emotion_emojis = {
    'sadness': '😢',
    'joy': '😄',
    'love': '❤️',
    'anger': '😡',
    'fear': '😨',
    'surprise': '😲'
}

"""
Preprocess the upcoming text (convert text into simple format matching training data)
"""
def preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"'", "", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

"""
Request and Response Schemas
"""
class TextInput(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The sentence to analyze",
        json_schema_extra={"example": "i feel so happy"}
    )

class PredictionResponse(BaseModel):
    text: str
    predicted_emotion: str
    confidence: float
    all_probabilities: dict[str, float]

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool

"""
Model loading and lifespan management
"""
dl_model = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("loading the model and tokenizer...")
    dl_model["BiGRU"] = load_model(model_path)
    with open(tokenizer_path, 'rb') as file:
        dl_model["tokenizer"] = pickle.load(file)
    print("model and tokenizer loaded successfully")

    yield

    dl_model.clear()

"""
FastAPI application instance with lifespan
"""
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

if os.path.isdir("static"):
    app.mount('/static', StaticFiles(directory="static"), name="static")

"""
API endpoints:
- UI homepage
- Health check endpoint
- Predict emotion endpoint
"""
@app.get('/', include_in_schema=False)
def serve_ui():
    return FileResponse('static/index.html')

@app.get('/health', response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="server is running",
        model_loaded="BiGRU" in dl_model and "tokenizer" in dl_model
    )

@app.post('/predict', response_model=PredictionResponse)
def predict_emotion(text_input: TextInput):
    BiGRU_model = dl_model.get("BiGRU")
    tokenizer_model = dl_model.get("tokenizer")

    if BiGRU_model is None or tokenizer_model is None:
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded yet, please try again later"
        )

    # Clean the input sentence
    cleaned_text = preprocess_text(text_input.text)

    # Tokenize and pad sequence
    tokenized_text = tokenizer_model.texts_to_sequences([cleaned_text])
    padded_sequence = pad_sequences(
        tokenized_text,
        maxlen=max_sequence_length,
        padding='post',
        truncating='post'
    )

    probabilities = BiGRU_model.predict(padded_sequence)[0]
    top_emotion_index = int(np.argmax(probabilities))
    all_probabilities = {
        label: float(prob) for label, prob in zip(emotion_labels, probabilities)
    }

    return PredictionResponse(
        text=text_input.text,
        predicted_emotion=emotion_labels[top_emotion_index],
        confidence=float(probabilities[top_emotion_index]),
        all_probabilities=all_probabilities
    )
