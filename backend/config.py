from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str
    supabase_url: str
    supabase_service_key: str
    # Opcional: solo para verificar tokens legacy HS256. Los nuevos usan JWKS asimétrico.
    supabase_jwt_secret: str = ""
    openai_api_key: str = ""
    frontend_url: str = "http://localhost:5173"
    environment: str = "development"
    redis_url: str = "redis://localhost:6379/0"
    resend_api_key: str = ""
    resend_from_email: str = "noreply@skateclubhub.com"
    webhook_secret: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
