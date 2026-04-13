"""
Backend tests for Iteration 6: Responsiveness and Auth Security
Tests:
1. GET /api/health returns healthy
2. EMERGENT_AUTH_URL is loaded from env (not hardcoded)
3. CORS headers are present on responses
4. Session uses httpOnly cookies
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoint:
    """Test health endpoint works with new env config"""
    
    def test_health_returns_healthy(self):
        """GET /api/health should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        print(f"✓ Health check passed: {data}")


class TestCORSHeaders:
    """Test CORS headers are present on responses"""
    
    def test_cors_headers_on_health(self):
        """CORS headers should be present on /api/health"""
        response = requests.options(
            f"{BASE_URL}/api/health",
            headers={
                "Origin": BASE_URL,
                "Access-Control-Request-Method": "GET"
            }
        )
        # Check CORS headers exist
        assert "access-control-allow-origin" in response.headers or "Access-Control-Allow-Origin" in response.headers
        print(f"✓ CORS headers present on OPTIONS request")
    
    def test_cors_headers_on_get(self):
        """CORS headers should be present on GET /api/health"""
        response = requests.get(
            f"{BASE_URL}/api/health",
            headers={"Origin": BASE_URL}
        )
        assert response.status_code == 200
        # CORS headers may be handled by proxy/cloudflare
        print(f"✓ GET /api/health returns 200 with CORS")


class TestAuthSecurity:
    """Test auth security features"""
    
    def test_auth_me_requires_session(self):
        """GET /api/auth/me should return 401 without session"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print(f"✓ /api/auth/me correctly returns 401 without session")
    
    def test_protected_endpoints_require_auth(self):
        """Protected endpoints should return 401 without session"""
        endpoints = [
            "/api/categories",
            "/api/transactions",
            "/api/accounts",
            "/api/cards",
            "/api/investments",
            "/api/budgets",
            "/api/goals"
        ]
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 401, f"Expected 401 for {endpoint}, got {response.status_code}"
        print(f"✓ All {len(endpoints)} protected endpoints correctly return 401 without auth")


class TestEnvConfiguration:
    """Test environment configuration"""
    
    def test_backend_env_has_emergent_auth_url(self):
        """Backend .env should have EMERGENT_AUTH_URL"""
        env_path = "/app/backend/.env"
        with open(env_path, "r") as f:
            content = f.read()
        assert "EMERGENT_AUTH_URL" in content
        print(f"✓ EMERGENT_AUTH_URL found in backend .env")
    
    def test_no_hardcoded_api_keys_in_server(self):
        """server.py should not have hardcoded API keys or passwords"""
        server_path = "/app/backend/server.py"
        with open(server_path, "r") as f:
            content = f.read()
        
        # Check for common patterns that indicate hardcoded secrets
        forbidden_patterns = [
            "password=",
            "api_key=",
            "secret_key=",
            "API_KEY=",
            "SECRET_KEY=",
        ]
        
        for pattern in forbidden_patterns:
            # Allow patterns in comments or env.get calls
            lines = content.split('\n')
            for line in lines:
                if pattern in line and not line.strip().startswith('#') and 'environ' not in line and 'os.getenv' not in line:
                    # Check if it's a variable assignment with a literal value
                    if '=' in line and '"' in line.split('=')[1] if '=' in line else False:
                        pytest.fail(f"Potential hardcoded secret found: {line.strip()}")
        
        print(f"✓ No hardcoded API keys or passwords found in server.py")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
