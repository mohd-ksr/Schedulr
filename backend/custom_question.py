from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class QuestionType(str, enum.Enum):
    TEXT      = "text"
    TEXTAREA  = "textarea"
    SELECT    = "select"
    CHECKBOX  = "checkbox"
    PHONE     = "phone"


class CustomQuestion(Base):
    """
    Bonus: Custom questions added to the booking form for a specific event type.
    e.g. 'What would you like to discuss?' (textarea, required)
    """
    __tablename__ = "custom_questions"

    id = Column(Integer, primary_key=True, index=True)
    event_type_id = Column(Integer, ForeignKey("event_types.id", ondelete="CASCADE"), nullable=False, index=True)

    label = Column(String(300), nullable=False)
    placeholder = Column(String(300), nullable=True)
    question_type = Column(
        SAEnum(QuestionType, name="question_type_enum"),
        nullable=False,
        default=QuestionType.TEXT,
    )
    is_required = Column(Boolean, default=False)
    options = Column(String(1000), nullable=True)  # JSON array for select type
    order_index = Column(Integer, default=0)        # display order

    event_type = relationship("EventType", back_populates="custom_questions")
