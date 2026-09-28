FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && gunicorn -w 4 -b 0.0.0.0:${PORT} 'app.flask_server:create_app()'"]
