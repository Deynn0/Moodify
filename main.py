from fastapi import HTTPException
from fastapi.responses import FileResponse
from pydantic import DirectoryPath
from fastapi.concurrency import asynccontextmanager
from PIL import GimpGradientFile
from PIL import GimpGradientFile
from fastapi import FastAPI,HTTPException
import re
from pydantic import BaseModel,Field
from keras.models import load_model 
import pickle 
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
from fastapi.staticfiles import StaticFiles

app=FastAPI()

#model path
model_path='Artifactes/BiGRU_model.keras'

#tokenizer path
tokenizer_path="Artifactes/tokenizer.pkl"

#max seq length
max_sequence_length=50

#emotion labels
emotion_labels=['sadness','joy','love','anger','fear','surprise']

#emotion_emojis
emotion_emojis = {
    'sadness': '😢',
    'joy': '😄',
    'love': '❤️',
    'anger': '😡',
    'fear': '😨',
    'surprise': '😲'
}

"""
preprocess the upcomig text (do convert text into simple formate like a training data set so it will easy for the model)
"""

def preprocess_text(text:str)->str:
  text.lower()
  text=re.sub(r"'","",text)
  text=re.sub(r"[^a-z0-9\s]"," ",text)
  text=re.sub(r"\s+"," ",text)

  return text

"""
req,res schema

text input
prediction response
health response
"""

class TextInput(BaseModel):
  text:str=Field(
    ...,
    min_len=1,
    max_len=2000,
    description="The sentance to analyze",
    json_schema_extra={"example":"i feel so happy"}
  )


class PredictionResponse(BaseModel):
  text:str
  predicted_emotion:str
  confidence:float
  all_probabilities:dict[str,float]

class HealthResponse(BaseModel):
  status:str
  model_loaded:bool



"""
model loading and life span
"""

dl_model={}

@asynccontextmanager
async def lifespan(app:FastAPI):
  print("loading the model and tokenizer...")
  dl_model["BiGRU"]=load_model(model_path)

  with open(tokenizer_path,'rb') as file:
    dl_model["tokenizer"]=pickle.load(file)
  print("model are loaded seccessfully")

  yield #pause ,model is loaded and server and at this point model wait krega  for request 

  dl_model.clear()#ek baar server band ho gya uske baad model ko memory se hta do


"""
mount the static files to the FastApi app
"""


app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"]
)


app.mount('/static',StaticFiles(directory="static"),name="static")



"""
api endpoint
ui homepage
health check endpoint 
predict emotion endpoint
"""
@app.get('/',include_in_schema=False)
def serve_ui():
  return FileResponse('static/index.html')

@app.get('/health',response_model=HealthResponse)
def health_check():
  return HealthResponse(status="server is running",model_loaded=bool(dl_model))


@app.post('/predict',response_model=PredictionResponse)
def predict_emotion(text_input:TextInput):
 

  BiGRU_model=dl_model.get({'BiGRU'})
  tokenizer_model=dl_model.get({'Tokenizer'})

  if BiGRU_model is None or tokenizer_model is None:
    raise HTTPException(status_code=503,detail="Model is not loaded yet ,please try again later")


  #clean the input sen
  cleaned_text=preprocess_text(text_input.text)

  #tokenize and padding
  tokenizer=Tokenizer(num_words=tokenizer_model.num_words)
  tokenized_text=tokenizer.texts_to_sequences(cleaned_text)
  padded_sequence=pad_sequences(
    tokenized_text,
    maxlen=max_sequence_length,
    padding='post',
    truncating="post"
  )


  probabilities=BiGRU_model.predict(padded_sequence)[0]
  top_emotion_index=int(np.argmax(probabilities))
  all_probabilities={
    label:float(prob) for prob ,label in zip(emotion_labels,probabilities)

  }

  return PredictionResponse(
    text=text_input.text,
    predicted_emotion=emotion_labels[top_emotion_index],
    confidence=float(probabilities[top_emotion_index]),
    all_probabilities=all_probabilities

  )


