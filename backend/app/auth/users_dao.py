from app.db import BaseDAO
from app.models import User


class UserDAO(BaseDAO):
    def get_by_email(self, email: str):
        return self.session.query(User).filter(User.email == email).one_or_none()

    def get_by_id(self, user_id: int):
        return self.session.query(User).filter(User.id == user_id).one_or_none()

    def create(self, **fields) -> User:
        user = User(**fields)
        self.session.add(user)
        self.session.flush()
        return user

    def get_all(self):
        return self.session.query(User).order_by(User.id).all()

    def update(self, user: User, fields: dict) -> User:
        for key, value in fields.items():
            setattr(user, key, value)
        self.session.flush()
        return user

    def delete(self, user: User):
        self.session.delete(user)
