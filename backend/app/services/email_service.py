"""
Email notification service for sending alerts via SMTP
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications"""
    
    def __init__(self):
        self.smtp_config = None
        self.from_config = None
    
    def configure(self, smtp_config: Dict, from_config: Dict):
        """Configure SMTP settings"""
        self.smtp_config = smtp_config
        self.from_config = from_config
    
    def send_alert_email(
        self,
        to_emails: List[str],
        alert_data: Dict,
        service_name: str = "Unknown Service"
    ) -> bool:
        """
        Send alert notification email
        
        Args:
            to_emails: List of recipient email addresses
            alert_data: Alert information (severity, message, metrics, etc.)
            service_name: Name of the service triggering the alert
            
        Returns:
            bool: True if email sent successfully
        """
        if not self.smtp_config or not self.smtp_config.get('enabled'):
            logger.warning("SMTP not configured, skipping email")
            return False
        
        try:
            severity = alert_data.get('severity', 'info').upper()
            title = alert_data.get('title', 'Alert Triggered')
            message = alert_data.get('message', '')
            metric_value = alert_data.get('metric_value', 'N/A')
            threshold = alert_data.get('threshold', 'N/A')
            
            # Create email
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"[{severity}] {service_name} - {title}"
            msg['From'] = formataddr((
                self.from_config.get('name', 'Dallal Dashboard'),
                self.from_config.get('email', self.smtp_config['auth']['user'])
            ))
            msg['To'] = ', '.join(to_emails)
            
            # Create HTML body
            html_body = self._create_alert_email_html(
                severity=severity,
                service_name=service_name,
                title=title,
                message=message,
                metric_value=metric_value,
                threshold=threshold,
                alert_data=alert_data
            )
            
            # Attach HTML
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            self._send_email(msg, to_emails)
            
            logger.info(f"Alert email sent to {len(to_emails)} recipients")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send alert email: {e}")
            return False
    
    def send_test_email(self, to_email: str) -> bool:
        """
        Send test email to verify SMTP configuration
        
        Args:
            to_email: Recipient email address
            
        Returns:
            bool: True if email sent successfully
        """
        if not self.smtp_config:
            raise ValueError("SMTP not configured")
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "Test Email from Dallal Dashboard"
            msg['From'] = formataddr((
                self.from_config.get('name', 'Dallal Dashboard'),
                self.from_config.get('email', self.smtp_config['auth']['user'])
            ))
            msg['To'] = to_email
            
            html_body = """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px; }
                    .content { padding: 20px; background: #f9fafb; margin-top: 20px; border-radius: 8px; }
                    .success { color: #22c55e; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Email Configuration Test</h1>
                    </div>
                    <div class="content">
                        <p class="success">Success! Your email configuration is working correctly.</p>
                        <p>This is a test email from Dallal Dashboard to verify that your SMTP settings are configured properly.</p>
                        <p><strong>What this means:</strong></p>
                        <ul>
                            <li>SMTP server connection successful</li>
                            <li>Authentication verified</li>
                            <li>Email delivery working</li>
                        </ul>
                        <p>You can now receive alert notifications via email.</p>
                        <hr>
                        <p style="color: #6b7280; font-size: 0.9em;">
                            Sent by Dallal Dashboard<br>
                            If you did not request this test, please check your notification settings.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, 'html'))
            
            self._send_email(msg, [to_email])
            
            logger.info(f"Test email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send test email: {e}")
            raise
    
    def _send_email(self, msg: MIMEMultipart, to_emails: List[str]):
        """Send email via SMTP"""
        host = self.smtp_config['host']
        port = self.smtp_config['port']
        user = self.smtp_config['auth']['user']
        password = self.smtp_config['auth']['pass']
        use_tls = not self.smtp_config.get('secure', False)
        
        if use_tls:
            # Use STARTTLS (port 587)
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(user, password)
                server.send_message(msg)
        else:
            # Use SSL (port 465)
            with smtplib.SMTP_SSL(host, port, timeout=10) as server:
                server.login(user, password)
                server.send_message(msg)
    
    def _create_alert_email_html(
        self,
        severity: str,
        service_name: str,
        title: str,
        message: str,
        metric_value: str,
        threshold: str,
        alert_data: Dict
    ) -> str:
        """Create HTML email template for alerts"""
        
        # Severity colors
        severity_colors = {
            'CRITICAL': '#ef4444',
            'WARNING': '#f59e0b',
            'INFO': '#3b82f6'
        }
        
        severity_color = severity_colors.get(severity, '#6b7280')
        severity_emoji = {
            'CRITICAL': '🔴',
            'WARNING': '🟡',
            'INFO': '🔵'
        }.get(severity, '⚪')
        
        timestamp = alert_data.get('timestamp', 'N/A')
        condition = alert_data.get('condition', '')
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .header {{ background: {severity_color}; color: white; padding: 30px 20px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 24px; }}
                .content {{ padding: 30px 20px; background: #ffffff; }}
                .metric-box {{ background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid {severity_color}; }}
                .metric-box strong {{ color: {severity_color}; }}
                .button {{ display: inline-block; background: {severity_color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                .footer {{ background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 0.9em; }}
                .footer a {{ color: #3b82f6; text-decoration: none; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{severity_emoji} {severity} ALERT</h1>
                </div>
                <div class="content">
                    <h2 style="margin-top: 0; color: #1f2937;">{service_name} - {title}</h2>
                    <p style="color: #4b5563;"><strong>Triggered:</strong> {timestamp}</p>
                    {f'<p style="color: #4b5563;"><strong>Condition:</strong> {condition}</p>' if condition else ''}
                    
                    {f'<p style="color: #374151; font-size: 1.1em;">{message}</p>' if message else ''}
                    
                    <div class="metric-box">
                        <strong>Current Value:</strong> {metric_value}<br>
                        <strong>Threshold:</strong> {threshold}<br>
                        <strong>Service:</strong> {service_name}
                    </div>
                    
                    <a href="http://localhost:5173/monitoring/alerts" class="button">
                        View in Dashboard →
                    </a>
                </div>
                <div class="footer">
                    <p><strong>Dallal Dashboard</strong> - Service Monitoring & Alerts</p>
                    <p>
                        <a href="http://localhost:5173/settings">Manage Notification Settings</a>
                    </p>
                    <p style="font-size: 0.8em; color: #9ca3af;">
                        This is an automated alert from your monitoring system.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html


# Global email service instance
email_service = EmailService()
