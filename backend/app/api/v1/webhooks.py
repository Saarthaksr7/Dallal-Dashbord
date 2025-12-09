from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.core.database import get_session
from app.models.webhook import Webhook
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Webhook])
def list_webhooks(
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    return session.exec(select(Webhook)).all()

@router.post("/", response_model=Webhook)
def create_webhook(
    webhook: Webhook,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    session.add(webhook)
    session.commit()
    session.refresh(webhook)
    return webhook

@router.delete("/{webhook_id}")
def delete_webhook(
    webhook_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    webhook = session.get(Webhook, webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    session.delete(webhook)
    session.commit()
    return {"ok": True}
