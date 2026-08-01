from celery import Celery
from config import settings

celery_app = Celery(
    "skate_tasks",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["tasks.schedules"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Bogota",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
