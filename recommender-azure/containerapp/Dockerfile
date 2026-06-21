FROM python:3.11-slim

WORKDIR /app

# System deps kept minimal; scikit-learn wheels are prebuilt.
COPY containerapp/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bake the trained model into the image (run `python train.py` first).
COPY model/ ./model/
COPY containerapp/app.py .

# Listen on $PORT if the host sets one (Render/Railway/etc.), else 8000 (Azure/local).
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
