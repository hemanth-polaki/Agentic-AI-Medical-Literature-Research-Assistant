import uvicorn
import os

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    is_reload = os.getenv("ENVIRONMENT", "development").lower() != "production"
    uvicorn.run("app.main:app", host=host, port=port, reload=is_reload)
