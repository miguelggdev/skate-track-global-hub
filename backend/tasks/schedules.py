from tasks.celery_app import celery_app


# Sprint 3: se agregan tareas reales aquí
# Ejemplo de cómo se verá cuando estén implementadas:
#
# @celery_app.task(name="tasks.send_payment_reminder")
# def send_payment_reminder(athlete_id: str): ...
#
# @celery_app.task(name="tasks.reindex_documents")
# def reindex_documents(): ...

@celery_app.task(name="tasks.health_check")
def health_check() -> dict:
    return {"status": "ok"}


# Celery beat schedule (Sprint 3)
celery_app.conf.beat_schedule = {
    # "payment-reminders-daily": {
    #     "task": "tasks.send_payment_reminder",
    #     "schedule": crontab(hour=9, minute=0),
    # },
}
