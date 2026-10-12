import uvicorn
import os

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    # In production on Render (or when ENVIRONMENT=production), disable reloader
    is_prod = (os.getenv("ENVIRONMENT", "").lower() == "production") or (os.getenv("RENDER") == "true")
    is_reload = not is_prod
    uvicorn.run("app.main:app", host=host, port=port, reload=is_reload)
