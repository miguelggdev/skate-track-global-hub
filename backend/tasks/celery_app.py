from celery import Celery
from config import settings

celery_app = Celery(
    "skate_tasks",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "tasks.schedules",
        "tasks.calendar_tasks",
        "tasks.finance_tasks",
        "tasks.athlete_tasks",
        "tasks.admin_tasks",
        "tasks.marketing_tasks",
        "tasks.reporting_tasks",
        "tasks.security_tasks",
        "tasks.whatsapp_tasks",
    ],
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
    task_max_retries=3,
    task_default_retry_delay=60,
    result_expires=3600,
    task_ignore_result=False,
)

celery_app.conf.task_default_max_retries = 3
celery_app.conf.task_retry_backoff = True
celery_app.conf.task_retry_backoff_max = 300
