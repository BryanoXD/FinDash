"""
Backend tests for Despesas with Data de Vencimento feature
Tests the new data_vencimento field and related functionality
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token - will be set by fixture
TEST_SESSION_TOKEN = None
TEST_USER_ID = None


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session with auth cookie"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def test_user_session(api_client):
    """Create test user and session in MongoDB"""
    import subprocess
    import re
    
    # Create test user via mongosh
    result = subprocess.run([
        'mongosh', '--quiet', '--eval', '''
use('test_database');
var userId = 'test-user-venc-' + Date.now();
var sessionToken = 'test_session_venc_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.venc.' + Date.now() + '@example.com',
  name: 'Test Vencimento User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
db.categories.insertMany([
  { id: 'cat_venc_desp1', user_id: userId, nome: 'Alimentacao', cor: '#ef4444', tipo: 'despesa', created_at: new Date() },
  { id: 'cat_venc_desp2', user_id: userId, nome: 'Transporte', cor: '#3b82f6', tipo: 'despesa', created_at: new Date() },
  { id: 'cat_venc_rec1', user_id: userId, nome: 'Salario', cor: '#22c55e', tipo: 'receita', created_at: new Date() }
]);
print('SESSION_TOKEN=' + sessionToken);
print('USER_ID=' + userId);
'''
    ], capture_output=True, text=True)
    
    output = result.stdout
    session_match = re.search(r'SESSION_TOKEN=(\S+)', output)
    user_match = re.search(r'USER_ID=(\S+)', output)
    
    if not session_match or not user_match:
        pytest.skip("Failed to create test user")
    
    session_token = session_match.group(1)
    user_id = user_match.group(1)
    
    # Set cookie for all requests
    api_client.cookies.set('session_token', session_token)
    
    yield {'session_token': session_token, 'user_id': user_id}
    
    # Cleanup after tests
    subprocess.run([
        'mongosh', '--quiet', '--eval', f'''
use('test_database');
db.users.deleteMany({{user_id: "{user_id}"}});
db.user_sessions.deleteMany({{user_id: "{user_id}"}});
db.categories.deleteMany({{user_id: "{user_id}"}});
db.transactions.deleteMany({{user_id: "{user_id}"}});
'''
    ], capture_output=True)


class TestHealthEndpoint:
    """Health check tests"""
    
    def test_health_returns_healthy(self, api_client):
        """GET /api/health returns healthy status"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        print("✓ Health endpoint returns healthy")


class TestTransactionWithVencimento:
    """Tests for transaction data_vencimento field"""
    
    def test_create_despesa_with_vencimento(self, api_client, test_user_session):
        """POST /api/transactions creates despesa with data_vencimento"""
        payload = {
            "descricao": "TEST_Despesa com Vencimento",
            "categoria_id": "cat_venc_desp1",
            "valor": 250.00,
            "tipo": "despesa",
            "data": "2026-04-14",
            "data_vencimento": "2026-04-25",
            "metodo": "Boleto",
            "tags": [],
            "recorrente": False,
            "pago": False
        }
        
        response = api_client.post(f"{BASE_URL}/api/transactions", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["descricao"] == "TEST_Despesa com Vencimento"
        assert data["data_vencimento"] == "2026-04-25"
        assert data["pago"] == False
        assert data["tipo"] == "despesa"
        print("✓ Created despesa with data_vencimento")
        
        return data["id"]
    
    def test_create_despesa_sem_vencimento(self, api_client, test_user_session):
        """POST /api/transactions creates despesa without data_vencimento (null)"""
        payload = {
            "descricao": "TEST_Despesa sem Vencimento",
            "categoria_id": "cat_venc_desp2",
            "valor": 100.00,
            "tipo": "despesa",
            "data": "2026-04-14",
            "data_vencimento": None,
            "metodo": "Dinheiro",
            "tags": [],
            "recorrente": True,
            "pago": False
        }
        
        response = api_client.post(f"{BASE_URL}/api/transactions", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["descricao"] == "TEST_Despesa sem Vencimento"
        assert data["data_vencimento"] is None
        assert data["recorrente"] == True
        print("✓ Created despesa without data_vencimento (sem vencimento)")
        
        return data["id"]
    
    def test_create_receita_no_vencimento(self, api_client, test_user_session):
        """POST /api/transactions creates receita (should not have data_vencimento)"""
        payload = {
            "descricao": "TEST_Receita Salario",
            "categoria_id": "cat_venc_rec1",
            "valor": 5000.00,
            "tipo": "receita",
            "data": "2026-04-01",
            "metodo": "Transferencia",
            "tags": [],
            "recorrente": False,
            "pago": True
        }
        
        response = api_client.post(f"{BASE_URL}/api/transactions", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["descricao"] == "TEST_Receita Salario"
        assert data["tipo"] == "receita"
        assert data["pago"] == True
        # Receita should have null data_vencimento
        assert data.get("data_vencimento") is None
        print("✓ Created receita without data_vencimento")
    
    def test_get_transactions_returns_vencimento(self, api_client, test_user_session):
        """GET /api/transactions returns transactions with data_vencimento field"""
        response = api_client.get(f"{BASE_URL}/api/transactions")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Find despesa with vencimento
        despesa_com_venc = next((t for t in data if "com Vencimento" in t.get("descricao", "")), None)
        if despesa_com_venc:
            assert "data_vencimento" in despesa_com_venc
            assert despesa_com_venc["data_vencimento"] is not None
            print("✓ GET transactions returns data_vencimento field")
        
        # Find despesa sem vencimento
        despesa_sem_venc = next((t for t in data if "sem Vencimento" in t.get("descricao", "")), None)
        if despesa_sem_venc:
            assert despesa_sem_venc.get("data_vencimento") is None
            print("✓ Despesa sem vencimento has null data_vencimento")
    
    def test_update_transaction_vencimento(self, api_client, test_user_session):
        """PUT /api/transactions/{id} can update data_vencimento"""
        # First create a transaction
        create_payload = {
            "descricao": "TEST_Update Vencimento",
            "categoria_id": "cat_venc_desp1",
            "valor": 300.00,
            "tipo": "despesa",
            "data": "2026-04-14",
            "data_vencimento": "2026-04-20",
            "metodo": "Pix",
            "tags": [],
            "recorrente": False,
            "pago": False
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/transactions", json=create_payload)
        assert create_response.status_code == 200
        tx_id = create_response.json()["id"]
        
        # Update the vencimento date
        update_payload = {
            "data_vencimento": "2026-04-30"
        }
        
        update_response = api_client.put(f"{BASE_URL}/api/transactions/{tx_id}", json=update_payload)
        assert update_response.status_code == 200
        
        updated_data = update_response.json()
        assert updated_data["data_vencimento"] == "2026-04-30"
        print("✓ Updated transaction data_vencimento")
    
    def test_toggle_paid_status(self, api_client, test_user_session):
        """PATCH /api/transactions/{id}/toggle-paid toggles pago status"""
        # Create unpaid despesa
        create_payload = {
            "descricao": "TEST_Toggle Paid",
            "categoria_id": "cat_venc_desp1",
            "valor": 50.00,
            "tipo": "despesa",
            "data": "2026-04-14",
            "data_vencimento": "2026-04-15",
            "metodo": "Pix",
            "tags": [],
            "recorrente": False,
            "pago": False
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/transactions", json=create_payload)
        assert create_response.status_code == 200
        tx_id = create_response.json()["id"]
        
        # Toggle to paid
        toggle_response = api_client.patch(f"{BASE_URL}/api/transactions/{tx_id}/toggle-paid")
        assert toggle_response.status_code == 200
        
        toggle_data = toggle_response.json()
        assert toggle_data["pago"] == True
        print("✓ Toggle paid status works")


class TestRecurringDespesas:
    """Tests for recurring despesas functionality"""
    
    def test_create_recurring_despesa(self, api_client, test_user_session):
        """Create recurring despesa for finalizar testing"""
        payload = {
            "descricao": "TEST_Recurring Despesa",
            "categoria_id": "cat_venc_desp1",
            "valor": 200.00,
            "tipo": "despesa",
            "data": "2026-04-14",
            "data_vencimento": "2026-04-20",
            "metodo": "Boleto",
            "tags": [],
            "recorrente": True,
            "pago": False
        }
        
        response = api_client.post(f"{BASE_URL}/api/transactions", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["recorrente"] == True
        assert data["pago"] == False
        print("✓ Created recurring despesa")
        
        return data["id"]
    
    def test_mark_recurring_as_paid(self, api_client, test_user_session):
        """Update recurring despesa to paid and non-recurring (finalizar)"""
        # Create recurring despesa
        create_payload = {
            "descricao": "TEST_Finalizar Recurring",
            "categoria_id": "cat_venc_desp2",
            "valor": 150.00,
            "tipo": "despesa",
            "data": "2026-04-14",
            "data_vencimento": "2026-04-25",
            "metodo": "Pix",
            "tags": [],
            "recorrente": True,
            "pago": False
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/transactions", json=create_payload)
        assert create_response.status_code == 200
        tx_id = create_response.json()["id"]
        
        # Update to paid and non-recurring (simulating finalizar)
        update_payload = {
            "pago": True,
            "recorrente": False
        }
        
        update_response = api_client.put(f"{BASE_URL}/api/transactions/{tx_id}", json=update_payload)
        assert update_response.status_code == 200
        
        updated_data = update_response.json()
        assert updated_data["pago"] == True
        assert updated_data["recorrente"] == False
        print("✓ Finalized recurring despesa (marked as paid and non-recurring)")


class TestFilterByPagoStatus:
    """Tests for filtering transactions by pago status"""
    
    def test_get_all_despesas(self, api_client, test_user_session):
        """GET /api/transactions?tipo=despesa returns all despesas"""
        response = api_client.get(f"{BASE_URL}/api/transactions?tipo=despesa")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # All should be despesas
        for tx in data:
            assert tx["tipo"] == "despesa"
        
        # Count paid vs unpaid
        paid = [t for t in data if t["pago"]]
        unpaid = [t for t in data if not t["pago"]]
        
        print(f"✓ Got {len(data)} despesas: {len(paid)} paid, {len(unpaid)} unpaid")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
