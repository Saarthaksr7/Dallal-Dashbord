"""
Comprehensive test suite for EmailService with coverage focus
Expands original test_standalone.py to achieve >70% coverage
"""
import sys
import os
from datetime import datetime, time

# Set environment before imports
os.environ['ENVIRONMENT'] = 'development'
os.environ['SECRET_KEY'] = 'test_secret_key_for_coverage'
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'

sys.path.insert(0, os.path.dirname(__file__))

from app.services.email_service import EmailService

# ============= CONFIGURATION TESTS =============

def test_config_initialization():
    """Test EmailService initialization state"""
    service = EmailService()
    assert service.smtp_config is None
    assert service.from_config is None
    assert service.preferences == {}
    assert service.digest_buffer == []
    print("✅ test_config_initialization PASSED")

def test_config_updates():
    """Test configuration persistence"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'user', 'pass': 'pass'}}
    from_conf = {'name': 'Test', 'email': 'test@example.com'}
    prefs = {'quietHours': False, 'sendDigest': False, 'emailFormat': 'html'}
    service.configure(config, from_conf, prefs)
    
    assert service.smtp_config['host'] == 'mock'
    assert service.from_config['name'] == 'Test'
    assert service.preferences['emailFormat'] == 'html'
    print("✅ test_config_updates PASSED")

def test_config_with_defaults():
    """Test configuration with None preferences"""
    service = EmailService()
    config = {'enabled': True, 'host': 'test', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, None)
    
    assert service.preferences == {}
    print("✅ test_config_with_defaults PASSED")

# ============= QUIET HOURS TESTS =============

def test_quiet_hours_disabled():
    """Test quiet hours when disabled"""
    service = EmailService()
    service.configure({'enabled': True}, {}, {'quietHours': False})
    
    assert service._is_quiet_hours() == False
    print("✅ test_quiet_hours_disabled PASSED")

def test_quiet_hours_error_handling():
    """Test quiet hours with invalid time format"""
    service = EmailService()
    service.configure({'enabled': True}, {}, {
        'quietHours': True,
        'quietStart': 'invalid',
        'quietEnd': '07:00'
    })
    
    # Should return False on error
    assert service._is_quiet_hours() == False
    print("✅ test_quiet_hours_error_handling PASSED")

def test_quiet_hours_skips_non_critical():
    """Test that quiet hours skips non-critical alerts"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'quietHours': True})
    service._send_email = lambda msg, to: None
    service._is_quiet_hours = lambda: True
    
    # INFO alert should be skipped
    result = service.send_alert_email(['a@b.com'], {'severity': 'INFO'})
    assert result == False
    
    # WARNING should be skipped
    result = service.send_alert_email(['a@b.com'], {'severity': 'WARNING'})
    assert result == False
    
    print("✅ test_quiet_hours_skips_non_critical PASSED")

def test_quiet_hours_allows_critical():
    """Test that critical alerts bypass quiet hours"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'quietHours': True, 'sendDigest': False})
    service._send_email = lambda msg, to: None
    service._is_quiet_hours = lambda: True
    
    # CRITICAL should pass through
    result = service.send_alert_email(['a@b.com'], {'severity': 'CRITICAL', 'title': 'T', 'message': 'M'})
    assert result == True
    print("✅ test_quiet_hours_allows_critical PASSED")

# ============= PRIORITY FILTERING TESTS =============

def test_priority_filter_critical_only():
    """Test minimum priority filter: critical only"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {
        'minPriority': 'critical',
        'sendDigest': False
    })
    service._send_email = lambda msg, to: None
    
    # WARNING should be skipped
    result = service.send_alert_email(['a@b.com'], {'severity': 'WARNING', 'title': 'T', 'message': 'M'})
    assert result == False
    
    # INFO should be skipped
    result = service.send_alert_email(['a@b.com'], {'severity': 'INFO', 'title': 'T', 'message': 'M'})
    assert result == False
    
    print("✅ test_priority_filter_critical_only PASSED")

def test_priority_filter_warning_plus():
    """Test minimum priority filter: warning and above"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {
        'minPriority': 'warning',
        'sendDigest': False
    })
    service._send_email = lambda msg, to: None
    
    # INFO should be skipped
    result = service.send_alert_email(['a@b.com'], {'severity': 'INFO', 'title': 'T', 'message': 'M'})
    assert result == False
    
    # WARNING should pass
    result = service.send_alert_email(['a@b.com'], {'severity': 'WARNING', 'title': 'T', 'message': 'M'})
    assert result == True
    
    print("✅ test_priority_filter_warning_plus PASSED")

# ============= IMMEDIATE SEND TESTS =============

def test_alert_send_immediate():
    """Test immediate alert sending (digest OFF)"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'sendDigest': False, 'emailFormat': 'html'})
    service._send_email = lambda msg, to: None
    
    alert = {'severity': 'INFO', 'title': 'Test', 'message': 'Msg'}
    result = service.send_alert_email(['recip@test.com'], alert)
    
    assert result == True
    assert len(service.digest_buffer) == 0
    print("✅ test_alert_send_immediate PASSED")

def test_alert_send_smtp_disabled():
    """Test alert sending when SMTP is disabled"""
    service = EmailService()
    config = {'enabled': False, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {})
    
    result = service.send_alert_email(['a@b.com'], {'severity': 'INFO'})
    assert result == False
    print("✅ test_alert_send_smtp_disabled PASSED")

def test_alert_send_no_config():
    """Test alert sending without configuration"""
    service = EmailService()
    
    result = service.send_alert_email(['a@b.com'], {'severity': 'INFO'})
    assert result == False
    print("✅ test_alert_send_no_config PASSED")

# ============= EMAIL FORMAT TESTS =============

def test_email_format_plain_text():
    """Test plain text email format"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {
        'sendDigest': False,
        'emailFormat': 'plain'
    })
    
    sent = []
    service._send_email = lambda msg, to: sent.append(msg)
    
    alert = {'severity': 'INFO', 'title': 'Test', 'message': 'Message', 'timestamp': 'now'}
    service.send_alert_email(['a@b.com'], alert, 'TestService')
    
    assert len(sent) == 1
    print("✅ test_email_format_plain_text PASSED")

def test_email_format_both():
    """Test dual format (HTML + Plain Text)"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {
        'sendDigest': False,
        'emailFormat': 'both'
    })
    
    sent = []
    service._send_email = lambda msg, to: sent.append(msg)
    
    alert = {'severity': 'INFO', 'title': 'Test', 'message': 'M', 'timestamp': 'now'}
    service.send_alert_email(['a@b.com'], alert, 'Svc')
    
    assert len(sent) == 1
    print("✅ test_email_format_both PASSED")

# ============= DIGEST TESTS =============

def test_digest_buffering():
    """Test alert buffering when digest enabled"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'sendDigest': True})
    service._send_email = lambda msg, to: None
    service.digest_buffer = []
    
    alert = {'severity': 'WARNING', 'title': 'BufferMe', 'message': 'Msg'}
    result = service.send_alert_email(['recip@test.com'], alert, 'Service1')
    
    assert result == True
    assert len(service.digest_buffer) == 1
    assert service.digest_buffer[0]['title'] == 'BufferMe'
    assert service.digest_buffer[0]['service_name'] == 'Service1'
    assert 'buffered_at' in service.digest_buffer[0]
    assert 'to_emails' in service.digest_buffer[0]
    print("✅ test_digest_buffering PASSED")

def test_digest_multiple_alerts():
    """Test buffering multiple alerts"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'sendDigest': True})
    service._send_email = lambda msg, to: None
    service.digest_buffer = []
    
    for i in range(5):
        alert = {'severity': 'INFO', 'title': f'Alert{i}', 'message': f'Msg{i}'}
        service.send_alert_email(['a@b.com'], alert)
    
    assert len(service.digest_buffer) == 5
    print("✅ test_digest_multiple_alerts PASSED")

def test_digest_processing_empty_buffer():
    """Test digest processing with empty buffer"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'digestFrequency': 'hourly'})
    service.digest_buffer = []
    
    sent = []
    service._send_email = lambda msg, to: sent.append(msg)
    
    service.process_digest('hourly')
    
    assert len(sent) == 0
    print("✅ test_digest_processing_empty_buffer PASSED")

def test_digest_processing_wrong_frequency():
    """Test digest not sending on frequency mismatch"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'digestFrequency': 'daily'})
    service.digest_buffer = [{'severity': 'INFO', 'title': 'A', 'to_emails': ['a@b.com']}]
    
    sent = []
    service._send_email = lambda msg, to: sent.append(msg)
    
    service.process_digest('hourly')
    
    assert len(sent) == 0
    assert len(service.digest_buffer) == 1
    print("✅ test_digest_processing_wrong_frequency PASSED")

def test_digest_processing_correct_frequency():
    """Test successful digest send on frequency match"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'Test', 'email': 't@e.com'}, {'digestFrequency': 'hourly'})
    service.digest_buffer = [
        {'severity': 'INFO', 'title': 'A', 'message': 'M1', 'to_emails': ['a@b.com'], 'timestamp': 'now'},
        {'severity': 'CRITICAL', 'title': 'B', 'message': 'M2', 'to_emails': ['a@b.com'], 'timestamp': 'now'}
    ]
    
    sent = []
    service._send_email = lambda msg, to: sent.append(msg)
    
    service.process_digest('hourly')
    
    assert len(sent) == 1
    assert len(service.digest_buffer) == 0
    assert "Hourly Digest" in sent[0]['Subject']
    print("✅ test_digest_processing_correct_frequency PASSED")

def test_digest_no_recipients():
    """Test digest processing with no recipients"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'digestFrequency': 'hourly'})
    service.digest_buffer = [{'severity': 'INFO', 'title': 'A', 'to_emails': []}]
    
    sent = []
    service._send_email = lambda msg, to: sent.append(msg)
    
    service.process_digest('hourly')
    
    # Should clear buffer even with no recipients
    assert len(service.digest_buffer) == 0
    assert len(sent) == 0
    print("✅ test_digest_no_recipients PASSED")

# ============= HTML GENERATION TESTS =============

def test_html_generation_basic():
    """Test HTML email generation"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {})
    
    html = service._create_alert_email_html(
        'CRITICAL',
        'TestService',
        'Alert Title',
        'Alert Message',
        '95%',
        '90%',
        {'timestamp': '2024-12-12', 'condition': 'threshold exceeded'}
    )
    
    assert 'CRITICAL' in html
    assert 'TestService' in html
    assert 'Alert Title' in html
    assert '95%' in html
    print("✅ test_html_generation_basic PASSED")

def test_digest_html_generation():
    """Test digest HTML generation"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {})
    
    alerts = [
        {'severity': 'CRITICAL', 'title': 'Alert1', 'message': 'M1', 'service_name': 'Svc1', 'timestamp': 'now'},
        {'severity': 'WARNING', 'title': 'Alert2', 'message': 'M2', 'service_name': 'Svc2', 'timestamp': 'now'},
        {'severity': 'INFO', 'title': 'Alert3', 'message': 'M3', 'service_name': 'Svc3', 'timestamp': 'now'}
    ]
    
    html = service._create_digest_email_html(alerts, 'hourly')
    
    assert 'Hourly Digest' in html
    assert 'Alert1' in html
    assert 'Alert2' in html
    assert 'Alert3' in html
    assert 'CRITICAL' in html
    print("✅ test_digest_html_generation PASSED")

# ============= ERROR HANDLING TESTS =============

def test_send_alert_exception_handling():
    """Test error handling in send_alert_email"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'sendDigest': False})
    
    # Force exception
    def failing_send(msg, to):
        raise Exception("Network error")
    
    service._send_email = failing_send
    
    result = service.send_alert_email(['a@b.com'], {'severity': 'INFO', 'title': 'T', 'message': 'M'})
    assert result == False
    print("✅ test_send_alert_exception_handling PASSED")

def test_digest_exception_handling():
    """Test error handling in process_digest"""
    service = EmailService()
    config = {'enabled': True, 'host': 'mock', 'port': 25, 'auth': {'user': 'u', 'pass': 'p'}}
    service.configure(config, {'name': 'T', 'email': 't@e.com'}, {'digestFrequency': 'hourly'})
    service.digest_buffer = [{'severity': 'INFO', 'to_emails': ['a@b.com']}]
    
    def failing_send(msg, to):
        raise Exception("SMTP error")
    
    service._send_email = failing_send
    
    result = service.process_digest('hourly')
    assert result == False
    print("✅ test_digest_exception_handling PASSED")

# ============= TEST RUNNER =============

if __name__ == '__main__':
    print("\n" + "="*70)
    print("  COMPREHENSIVE EMAIL SERVICE TEST SUITE - COVERAGE OPTIMIZED")
    print("="*70 + "\n")
    
    tests = [
        # Configuration
        test_config_initialization,
        test_config_updates,
        test_config_with_defaults,
        # Quiet Hours
        test_quiet_hours_disabled,
        test_quiet_hours_error_handling,
        test_quiet_hours_skips_non_critical,
        test_quiet_hours_allows_critical,
        # Priority Filtering
        test_priority_filter_critical_only,
        test_priority_filter_warning_plus,
        # Immediate Sending
        test_alert_send_immediate,
        test_alert_send_smtp_disabled,
        test_alert_send_no_config,
        # Email Formats
        test_email_format_plain_text,
        test_email_format_both,
        # Digest Buffering
        test_digest_buffering,
        test_digest_multiple_alerts,
        # Digest Processing
        test_digest_processing_empty_buffer,
        test_digest_processing_wrong_frequency,
        test_digest_processing_correct_frequency,
        test_digest_no_recipients,
        # HTML Generation
        test_html_generation_basic,
        test_digest_html_generation,
        # Error Handling
        test_send_alert_exception_handling,
        test_digest_exception_handling
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
    
    print(f"\n{'='*70}")
    print(f"  RESULTS: {passed}/{len(tests)} passed ({int(passed/len(tests)*100)}% success rate)")
    print(f"{'='*70}\n")
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED! Email Service has comprehensive coverage.")
    
    sys.exit(0 if failed == 0 else 1)
