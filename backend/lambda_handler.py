import os
import json
from mangum import Mangum
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Example route
@app.get("/")
async def root():
    return {"message": "Welcome to Gaming Parlor API"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Initialize Mangum handler
handler = Mangum(app, lifespan="off")

def lambda_handler(event, context):
    # Handle API Gateway V2 (HTTP API) events
    if 'version' in event and event['version'] == '2.0':
        return handler(event, context)
    
    # Handle API Gateway V1 (REST API) events
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        'body': json.dumps({
            'message': 'Welcome to Gaming Parlor API',
            'event': event
        })
    }
