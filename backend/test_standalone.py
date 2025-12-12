"""
Standalone test runner for EmailService
Bypasses conftest to avoid database dependencies
"""
import sys
import os

# Set environment before any imports
os.environ['ENVIRONMENT'] = 'development'
os.environ['SECRET_KEY'] = 'test_secret_key'
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.services.email_service import EmailService

def test_config_updates():
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'user', 'pass': 'pass'}}
    from_conf = {'name': 'Test', 'email': 'test@example.com'}
    prefs = {'quietHours': False, 'sendDigest': False, 'emailFormat': 'html', 'digestFrequency': 'hourly'}
    service.configure(config, from_conf, prefs)
    service._send_email = lambda msg, to: None
    
    assert service.smtp_config['host'] == 'mock'
    assert service.preferences['emailFormat'] == 'html'
    print("✅ test_config_updates PASSED")

def test_alert_send_immediate():
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'sendDigest': False, 'emailFormat': 'html'})
    service._send_email = lambda msg, to: None
    
    alert = {'severity': 'INFO', 'title': 'Test', 'message': 'Msg'}
    result = service.send_alert_email(['recip@test.com'], alert)
    
    assert result is True
    assert len(service.digest_buffer) == 0
    print("✅ test_alert_send_immediate PASSED")

def test_digest_buffering():
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'sendDigest': True, 'emailFormat': 'html'})
    service._send_email = lambda msg, to: None
    service.digest_buffer = []
    
    alert = {'severity': 'WARNING', 'title': 'BufferMe', 'message': 'Msg'}
    result = service.send_alert_email(['recip@test.com'], alert)
    
    assert result is True
    assert len(service.digest_buffer) == 1
    assert service.digest_buffer[0]['title'] == 'BufferMe'
    print("✅ test_digest_buffering PASSED")

def test_digest_processing_correct_frequency():
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'sendDigest': True, 'digestFrequency': 'hourly'})
    service.digest_buffer = [{'severity': 'INFO', 'title': 'A', 'to_emails': ['a@b.com']}]
    
    sent_msgs = []
    service._send_email = lambda msg, to: sent_msgs.append(msg)
    
    service.process_digest('hourly')
    
    assert len(sent_msgs) == 1
    assert len(service.digest_buffer) == 0
    assert "Hourly Digest" in sent_msgs[0]['Subject']
    print("✅ test_digest_processing_correct_frequency PASSED")

def test_quiet_hours_skipped():
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'quietHours': True})
    service._send_email = lambda msg, to: None
    service._is_quiet_hours = lambda: True
    
    alert = {'severity': 'INFO'}
    result = service.send_alert_email(['a@b.com'], alert)
    
    assert result is False
    print("✅ test_quiet_hours_skipped PASSED")

if __name__ == '__main__':
    print("\n" + "="*60)
    print("  EMAIL SERVICE TEST SUITE")
    print("="*60 + "\n")
    
    tests = [
        test_config_updates,
        test_alert_send_immediate,
        test_digest_buffering,
        test_digest_processing_correct_frequency,
        test_quiet_hours_skipped
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"❌ {test.__name__} FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"❌ {test.__name__} ERROR: {e}")
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"  RESULTS: {passed} passed, {failed} failed")
    print(f"{'='*60}\n")
    
    sys.exit(0 if failed == 0 else 1)
