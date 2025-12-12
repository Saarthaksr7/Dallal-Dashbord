import pytest
from app.services.email_service import EmailService

@pytest.fixture
def email_service():
    service = EmailService()
    # Basic Config
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'user', 'pass': 'pass'}}
    from_conf = {'name': 'Test', 'email': 'test@example.com'}
    prefs = {
        'quietHours': False,
        'sendDigest': False,
        'emailFormat': 'html',
        'digestFrequency': 'hourly'
    }
    service.configure(config, from_conf, prefs)
    
    # Mock Networking
    service._send_email = lambda msg, to: None
    return service

def test_config_updates(email_service):
    assert email_service.smtp_config['host'] == 'mock'
    assert email_service.preferences['emailFormat'] == 'html'

def test_alert_send_immediate(email_service):
    # Digest OFF
    email_service.preferences['sendDigest'] = False
    alert = {'severity': 'INFO', 'title': 'Test', 'message': 'Msg'}
    
    # Should call _send_single_alert -> _send_email (mocked)
    result = email_service.send_alert_email(['recip@test.com'], alert)
    assert result is True
    assert len(email_service.digest_buffer) == 0

def test_digest_buffering(email_service):
    # Digest ON
    email_service.preferences['sendDigest'] = True
    email_service.digest_buffer = []
    
    alert = {'severity': 'WARNING', 'title': 'BufferMe', 'message': 'Msg'}
    result = email_service.send_alert_email(['recip@test.com'], alert)
    
    assert result is True
    assert len(email_service.digest_buffer) == 1
    assert email_service.digest_buffer[0]['title'] == 'BufferMe'

def test_digest_processing_wrong_frequency(email_service):
    # Setup
    email_service.preferences['sendDigest'] = True
    email_service.preferences['digestFrequency'] = 'daily'
    email_service.digest_buffer = [{'severity': 'INFO', 'title': 'A', 'to_emails': ['a@b.com']}]
    
    # Trigger Hourly (mismatch)
    email_service.process_digest('hourly')
    
    # Should NOT send or clear buffer
    assert len(email_service.digest_buffer) == 1

def test_digest_processing_correct_frequency(email_service):
    # Setup
    email_service.preferences['sendDigest'] = True
    email_service.preferences['digestFrequency'] = 'hourly'
    email_service.digest_buffer = [{'severity': 'INFO', 'title': 'A', 'to_emails': ['a@b.com']}]
    
    # Track mock calls
    sent_msgs = []
    email_service._send_email = lambda msg, to: sent_msgs.append(msg)
    
    # Trigger Hourly (match)
    email_service.process_digest('hourly')
    
    # Should send and clear buffer
    assert len(sent_msgs) == 1
    assert len(email_service.digest_buffer) == 0
    assert "Hourly Digest" in sent_msgs[0]['Subject']

def test_quiet_hours_skipped(email_service):
    # We can't verify time easily without mocking datetime, 
    # but we can verify that if _is_quiet_hours returns True, it skips.
    
    # Monkey patch _is_quiet_hours
    email_service._is_quiet_hours = lambda: True
    email_service.preferences['quietHours'] = True
    
    alert = {'severity': 'INFO'} # Not Critical
    
    result = email_service.send_alert_email(['a@b.com'], alert)
    assert result is False # Should skip
