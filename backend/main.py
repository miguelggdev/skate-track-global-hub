from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import agents, health, rag
from config import settings

app = FastAPI(
    title="Skate Club API",
    description="Backend de agentes IA para la plataforma de gestión del club de patinaje",
    version="1.0.0",
)

_allowed_origins = [settings.frontend_url]
if settings.environment == "development":
    _allowed_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(health.router)
app.include_router(agents.router, prefix="/api")
app.include_router(rag.router, prefix="/api")
