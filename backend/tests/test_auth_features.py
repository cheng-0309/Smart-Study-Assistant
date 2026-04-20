"""
Backend tests for JWT Authentication, Goals, Pomodoro, Bookmarks/Confidence, and Bulk Delete features.
Tests all new endpoints added in the auth system implementation.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from /app/memory/test_credentials.md
ADMIN_EMAIL = "admin@studyforge.com"
ADMIN_PASSWORD = "admin123"


class TestAuthEndpoints:
    """Authentication endpoint tests - login, register, logout, me, refresh"""
    
    def test_login_success_admin(self):
        """POST /api/auth/login with admin credentials returns user and sets cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert "name" in data
        # Check cookies are set
        assert "access_token" in session.cookies or "access_token" in response.cookies
        print(f"PASS: Admin login successful, user_id={data['id']}")
    
    def test_login_wrong_password(self):
        """POST /api/auth/login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Wrong password returns 401")
    
    def test_login_nonexistent_user(self):
        """POST /api/auth/login with non-existent email returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        })
        assert response.status_code == 401
        print("PASS: Non-existent user returns 401")
    
    def test_get_me_with_auth(self):
        """GET /api/auth/me with valid cookies returns user data"""
        session = requests.Session()
        # Login first
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        
        # Get me
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200, f"Get me failed: {me_resp.text}"
        data = me_resp.json()
        assert data["email"] == ADMIN_EMAIL
        assert "id" in data
        assert "role" in data
        print(f"PASS: GET /api/auth/me returns user data: {data['email']}")
    
    def test_get_me_without_auth(self):
        """GET /api/auth/me without cookies returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/auth/me without auth returns 401")
    
    def test_logout(self):
        """POST /api/auth/logout clears cookies"""
        session = requests.Session()
        # Login first
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        # Logout
        logout_resp = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_resp.status_code == 200
        data = logout_resp.json()
        assert data.get("message") == "Logged out"
        
        # Verify can't access protected route
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 401, "Should be logged out"
        print("PASS: Logout clears cookies and invalidates session")
    
    def test_register_new_user(self):
        """POST /api/auth/register creates new user and returns user object with cookies"""
        session = requests.Session()
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 200, f"Register failed: {response.text}"
        data = response.json()
        assert data["email"] == unique_email.lower()
        assert data["name"] == "Test User"
        assert data["role"] == "user"
        assert "id" in data
        
        # Verify cookies set and can access protected route
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200
        print(f"PASS: Register creates user and sets cookies: {unique_email}")
    
    def test_register_duplicate_email(self):
        """POST /api/auth/register with existing email returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "anypassword",
            "name": "Duplicate"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Duplicate email registration returns 400")
    
    def test_register_short_password(self):
        """POST /api/auth/register with short password returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"short_{uuid.uuid4().hex[:8]}@example.com",
            "password": "12345",  # Less than 6 chars
            "name": "Short Pass"
        })
        assert response.status_code == 400
        print("PASS: Short password registration returns 400")
    
    def test_refresh_token(self):
        """POST /api/auth/refresh refreshes access token"""
        session = requests.Session()
        # Login first
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        # Refresh
        refresh_resp = session.post(f"{BASE_URL}/api/auth/refresh")
        assert refresh_resp.status_code == 200
        data = refresh_resp.json()
        assert data.get("message") == "Token refreshed"
        
        # Verify still authenticated
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200
        print("PASS: Token refresh works")


class TestGoalsEndpoints:
    """Goals CRUD endpoint tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        return session
    
    def test_get_goals_requires_auth(self):
        """GET /api/goals without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/goals")
        assert response.status_code == 401
        print("PASS: GET /api/goals requires auth")
    
    def test_get_goals_authenticated(self, auth_session):
        """GET /api/goals returns goals list"""
        response = auth_session.get(f"{BASE_URL}/api/goals")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/goals returns list with {len(data)} goals")
    
    def test_create_goal(self, auth_session):
        """POST /api/goals creates a goal with title/target/type"""
        goal_data = {
            "title": f"TEST_Read 50 pages {uuid.uuid4().hex[:6]}",
            "target": 50,
            "type": "pages"
        }
        response = auth_session.post(f"{BASE_URL}/api/goals", json=goal_data)
        assert response.status_code == 200, f"Create goal failed: {response.text}"
        data = response.json()
        assert data["title"] == goal_data["title"]
        assert data["target"] == 50
        assert data["type"] == "pages"
        assert data["current"] == 0
        assert "id" in data
        print(f"PASS: Created goal: {data['id']}")
        return data["id"]
    
    def test_update_goal_progress(self, auth_session):
        """PUT /api/goals/:id updates goal progress"""
        # Create a goal first
        create_resp = auth_session.post(f"{BASE_URL}/api/goals", json={
            "title": f"TEST_Update goal {uuid.uuid4().hex[:6]}",
            "target": 100,
            "type": "pages"
        })
        assert create_resp.status_code == 200
        goal_id = create_resp.json()["id"]
        
        # Update progress
        update_resp = auth_session.put(f"{BASE_URL}/api/goals/{goal_id}", json={
            "current": 25
        })
        assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"
        data = update_resp.json()
        assert data["current"] == 25
        print(f"PASS: Updated goal progress to 25")
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/goals/{goal_id}")
    
    def test_delete_goal(self, auth_session):
        """DELETE /api/goals/:id deletes goal"""
        # Create a goal first
        create_resp = auth_session.post(f"{BASE_URL}/api/goals", json={
            "title": f"TEST_Delete goal {uuid.uuid4().hex[:6]}",
            "target": 10,
            "type": "topics"
        })
        assert create_resp.status_code == 200
        goal_id = create_resp.json()["id"]
        
        # Delete
        delete_resp = auth_session.delete(f"{BASE_URL}/api/goals/{goal_id}")
        assert delete_resp.status_code == 200
        data = delete_resp.json()
        assert data.get("message") == "Goal deleted"
        
        # Verify deleted - should get 404
        get_resp = auth_session.get(f"{BASE_URL}/api/goals")
        goals = get_resp.json()
        assert not any(g["id"] == goal_id for g in goals)
        print(f"PASS: Deleted goal {goal_id}")


class TestPomodoroEndpoints:
    """Pomodoro session endpoint tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200
        return session
    
    def test_get_pomodoro_requires_auth(self):
        """GET /api/pomodoro without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/pomodoro")
        assert response.status_code == 401
        print("PASS: GET /api/pomodoro requires auth")
    
    def test_get_pomodoro_sessions(self, auth_session):
        """GET /api/pomodoro returns session list"""
        response = auth_session.get(f"{BASE_URL}/api/pomodoro")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/pomodoro returns list with {len(data)} sessions")
    
    def test_log_pomodoro_session(self, auth_session):
        """POST /api/pomodoro logs a session with subject/topic/duration"""
        session_data = {
            "subject": "TEST_Mathematics",
            "topic": "Calculus",
            "duration_minutes": 25
        }
        response = auth_session.post(f"{BASE_URL}/api/pomodoro", json=session_data)
        assert response.status_code == 200, f"Log session failed: {response.text}"
        data = response.json()
        assert data["subject"] == "TEST_Mathematics"
        assert data["topic"] == "Calculus"
        assert data["duration_minutes"] == 25
        assert "id" in data
        assert "created_at" in data
        print(f"PASS: Logged pomodoro session: {data['id']}")


class TestBookmarksConfidenceEndpoints:
    """Bookmarks and Confidence rating endpoint tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200
        return session
    
    def test_toggle_bookmark_requires_auth(self):
        """POST /api/bookmarks/:id without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/bookmarks/some-id")
        assert response.status_code == 401
        print("PASS: POST /api/bookmarks requires auth")
    
    def test_toggle_bookmark_nonexistent(self, auth_session):
        """POST /api/bookmarks/:id with non-existent ID returns 404"""
        response = auth_session.post(f"{BASE_URL}/api/bookmarks/nonexistent-id-12345")
        assert response.status_code == 404
        print("PASS: Bookmark non-existent item returns 404")
    
    def test_set_confidence_requires_auth(self):
        """POST /api/confidence/:id without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/confidence/some-id", json={"level": "high"})
        assert response.status_code == 401
        print("PASS: POST /api/confidence requires auth")
    
    def test_set_confidence_invalid_level(self, auth_session):
        """POST /api/confidence/:id with invalid level returns 400"""
        # First need a valid note ID - get from notes list
        notes_resp = auth_session.get(f"{BASE_URL}/api/notes")
        if notes_resp.status_code == 200 and notes_resp.json():
            note_id = notes_resp.json()[0]["id"]
            response = auth_session.post(f"{BASE_URL}/api/confidence/{note_id}", json={"level": "invalid"})
            assert response.status_code == 400
            print("PASS: Invalid confidence level returns 400")
        else:
            print("SKIP: No notes available to test confidence")
    
    def test_get_bookmarked_items(self, auth_session):
        """GET /api/bookmarks returns bookmarked items list"""
        response = auth_session.get(f"{BASE_URL}/api/bookmarks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/bookmarks returns list with {len(data)} items")


class TestBulkDeleteEndpoint:
    """Bulk delete notes endpoint tests"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200
        return session
    
    def test_bulk_delete_requires_auth(self):
        """POST /api/notes/bulk-delete without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/notes/bulk-delete", json={"ids": ["id1"]})
        assert response.status_code == 401
        print("PASS: POST /api/notes/bulk-delete requires auth")
    
    def test_bulk_delete_empty_ids(self, auth_session):
        """POST /api/notes/bulk-delete with empty ids returns 400"""
        response = auth_session.post(f"{BASE_URL}/api/notes/bulk-delete", json={"ids": []})
        assert response.status_code == 400
        print("PASS: Bulk delete with empty ids returns 400")
    
    def test_bulk_delete_nonexistent_ids(self, auth_session):
        """POST /api/notes/bulk-delete with non-existent ids returns success with 0 deleted"""
        response = auth_session.post(f"{BASE_URL}/api/notes/bulk-delete", json={
            "ids": ["nonexistent-1", "nonexistent-2"]
        })
        assert response.status_code == 200
        data = response.json()
        assert data["deleted"] == 0
        print("PASS: Bulk delete non-existent ids returns deleted=0")


class TestProtectedRoutes:
    """Test that protected routes require authentication"""
    
    def test_notes_public_access(self):
        """GET /api/notes is publicly accessible (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/notes")
        # Notes endpoint is public for viewing
        assert response.status_code == 200
        print("PASS: GET /api/notes is publicly accessible")
    
    def test_analytics_public_access(self):
        """GET /api/analytics is publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        # Analytics is also public
        assert response.status_code == 200
        print("PASS: GET /api/analytics is publicly accessible")


class TestDataMigration:
    """Test that existing data is accessible after login (migrated to admin user)"""
    
    def test_existing_notes_accessible(self):
        """Existing notes are accessible after login"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        response = session.get(f"{BASE_URL}/api/notes")
        assert response.status_code == 200
        notes = response.json()
        print(f"PASS: {len(notes)} notes accessible after login")
    
    def test_existing_planners_accessible(self):
        """Existing study planners are accessible after login"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        response = session.get(f"{BASE_URL}/api/planners")
        assert response.status_code == 200
        plans = response.json()
        print(f"PASS: {len(plans)} planners accessible after login")
    
    def test_existing_practices_accessible(self):
        """Existing practice tests are accessible after login"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        response = session.get(f"{BASE_URL}/api/practices")
        assert response.status_code == 200
        tests = response.json()
        print(f"PASS: {len(tests)} practice tests accessible after login")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
