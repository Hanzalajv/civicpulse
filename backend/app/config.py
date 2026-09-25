from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    triage_provider: str = "simulated"
    groq_api_key: str = ""
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()