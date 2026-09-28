from flask import Flask
from flask_cors import CORS

from app.auth.auth_api import auth_api, users_api
from app.config import CORS_ORIGINS, SUCCESS_MESSAGE, respond
from app.courses.courses_api import courses_api
from app.db import engine
from app.deliveries.deliveries_api import deliveries_api
from app.instructors.instructors_api import instructors_api
from app.lessons.lessons_api import lessons_api


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, origins=CORS_ORIGINS, supports_credentials=False)

    app.register_blueprint(auth_api)
    app.register_blueprint(users_api)
    app.register_blueprint(courses_api)
    app.register_blueprint(lessons_api)
    app.register_blueprint(instructors_api)
    app.register_blueprint(deliveries_api)

    @app.route("/health")
    def health():
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return respond(SUCCESS_MESSAGE, "OK", None)

    return app


app = create_app()
