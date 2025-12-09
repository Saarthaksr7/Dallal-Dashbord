import httpx
import asyncio
from sqlmodel import Session, select
from loguru import logger
from app.core.database import engine
from app.models.webhook import Webhook

class NotificationService:
    async def send_notification(self, event_type: str, payload: dict):
        """
        Send notification to all active webhooks subscribed to this event.
        This runs asynchronously.
        """
        # We need to create a new session because we might be in a different thread or context
        # But we are async here.
        try:
            with Session(engine) as session:
                statement = select(Webhook).where(Webhook.active == True)
                webhooks = session.exec(statement).all()
                
                targets = []
                for wh in webhooks:
                    if event_type in wh.events or "all" in wh.events:
                        targets.append(wh)
                
                if not targets:
                    return

                # Dispatch async
                for wh in targets:
                    asyncio.create_task(self._post_webhook(wh.url, wh.secret, payload))
        except Exception as e:
            logger.error(f"Failed to fetch webhooks: {e}")

    async def _post_webhook(self, url: str, secret: str, payload: dict):
        try:
            headers = {"Content-Type": "application/json"}
            if secret:
                headers["X-Webhook-Secret"] = secret
            
            async with httpx.AsyncClient() as client:
                await client.post(url, json=payload, headers=headers, timeout=10.0)
        except Exception as e:
            logger.error(f"Webhook delivery failed to {url}: {e}")

notification_service = NotificationService()
