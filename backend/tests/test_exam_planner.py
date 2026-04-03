"""
Test suite for Exam Preparation Planner feature
Tests: POST /api/planner/exam/generate, GET /api/exam-planners, DELETE /api/exam-planners/{plan_id}
Also tests: GET /api/history with exam_plan type, DELETE /api/history/exam_plan/{id}
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://learn-guide-13.preview.emergentagent.com').rstrip('/')

class TestExamPlannerEndpoints:
    """Tests for Exam Planner API endpoints"""
    
    created_plan_ids = []  # Track created plans for cleanup
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup before each test"""
        yield
        # Cleanup after tests
        for plan_id in self.created_plan_ids:
            try:
                requests.delete(f"{BASE_URL}/api/exam-planners/{plan_id}")
            except:
                pass
        self.created_plan_ids.clear()
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ API health check passed")
    
    def test_generate_exam_plan_success(self):
        """Test POST /api/planner/exam/generate with valid data"""
        # Use a future date (30 days from now)
        future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        payload = {
            "subject": "TEST_Mathematics",
            "topics": ["Algebra", "Calculus", "Trigonometry"],
            "exam_date": future_date,
            "hours_per_day": 3.0
        }
        
        response = requests.post(f"{BASE_URL}/api/planner/exam/generate", json=payload, timeout=60)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "id" in data, "Response should contain 'id'"
        assert data["subject"] == "TEST_Mathematics", "Subject should match"
        assert data["topics"] == ["Algebra", "Calculus", "Trigonometry"], "Topics should match"
        assert data["exam_date"] == future_date, "Exam date should match"
        assert data["hours_per_day"] == 3.0, "Hours per day should match"
        assert "days_until_exam" in data, "Should have days_until_exam"
        assert data["days_until_exam"] >= 29, "Days until exam should be ~30"
        assert "days" in data, "Should have days array"
        assert len(data["days"]) > 0, "Should have at least one day in plan"
        assert "created_at" in data, "Should have created_at timestamp"
        
        # Verify day structure
        first_day = data["days"][0]
        assert "day" in first_day, "Day should have 'day' number"
        assert "tasks" in first_day, "Day should have 'tasks'"
        assert "duration_hours" in first_day, "Day should have 'duration_hours'"
        assert "priority" in first_day, "Day should have 'priority'"
        assert first_day["priority"] in ["high", "medium", "low"], "Priority should be valid"
        
        self.created_plan_ids.append(data["id"])
        print(f"✓ Exam plan generated successfully with {len(data['days'])} days")
    
    def test_generate_exam_plan_past_date_error(self):
        """Test POST /api/planner/exam/generate returns error for past dates"""
        # Use a past date
        past_date = (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
        
        payload = {
            "subject": "TEST_Physics",
            "topics": ["Mechanics"],
            "exam_date": past_date,
            "hours_per_day": 2.0
        }
        
        response = requests.post(f"{BASE_URL}/api/planner/exam/generate", json=payload)
        
        # Should return 400 error
        assert response.status_code == 400, f"Expected 400 for past date, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Error response should have 'detail'"
        assert "future" in data["detail"].lower(), "Error should mention 'future'"
        print("✓ Past date validation working correctly")
    
    def test_generate_exam_plan_empty_topics_error(self):
        """Test POST /api/planner/exam/generate returns error for empty topics"""
        future_date = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
        
        payload = {
            "subject": "TEST_Chemistry",
            "topics": [],  # Empty topics
            "exam_date": future_date,
            "hours_per_day": 2.0
        }
        
        response = requests.post(f"{BASE_URL}/api/planner/exam/generate", json=payload)
        
        # Should return 400 error
        assert response.status_code == 400, f"Expected 400 for empty topics, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Error response should have 'detail'"
        assert "topic" in data["detail"].lower(), "Error should mention 'topic'"
        print("✓ Empty topics validation working correctly")
    
    def test_generate_exam_plan_invalid_date_format(self):
        """Test POST /api/planner/exam/generate with invalid date format"""
        payload = {
            "subject": "TEST_Biology",
            "topics": ["Genetics"],
            "exam_date": "invalid-date",
            "hours_per_day": 2.0
        }
        
        response = requests.post(f"{BASE_URL}/api/planner/exam/generate", json=payload)
        
        # Should return 400 error
        assert response.status_code == 400, f"Expected 400 for invalid date, got {response.status_code}"
        print("✓ Invalid date format validation working correctly")
    
    def test_get_all_exam_planners(self):
        """Test GET /api/exam-planners returns list of exam plans"""
        response = requests.get(f"{BASE_URL}/api/exam-planners")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/exam-planners returned {len(data)} plans")
    
    def test_delete_exam_planner(self):
        """Test DELETE /api/exam-planners/{plan_id}"""
        # First create a plan
        future_date = (datetime.now() + timedelta(days=20)).strftime("%Y-%m-%d")
        
        payload = {
            "subject": "TEST_DeleteTest",
            "topics": ["Topic1"],
            "exam_date": future_date,
            "hours_per_day": 1.0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/planner/exam/generate", json=payload, timeout=60)
        assert create_response.status_code == 200, "Failed to create plan for delete test"
        
        plan_id = create_response.json()["id"]
        
        # Now delete it
        delete_response = requests.delete(f"{BASE_URL}/api/exam-planners/{plan_id}")
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        # Verify it's deleted by trying to get all plans and checking it's not there
        get_response = requests.get(f"{BASE_URL}/api/exam-planners")
        plans = get_response.json()
        plan_ids = [p["id"] for p in plans]
        assert plan_id not in plan_ids, "Deleted plan should not appear in list"
        
        print("✓ DELETE /api/exam-planners/{plan_id} working correctly")
    
    def test_delete_nonexistent_exam_planner(self):
        """Test DELETE /api/exam-planners/{plan_id} with non-existent ID"""
        response = requests.delete(f"{BASE_URL}/api/exam-planners/nonexistent-id-12345")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ DELETE non-existent plan returns 404")


class TestHistoryWithExamPlan:
    """Tests for History endpoint with exam_plan type"""
    
    def test_history_returns_exam_plans(self):
        """Test GET /api/history returns exam_plan type items"""
        response = requests.get(f"{BASE_URL}/api/history")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check if any exam_plan items exist
        exam_plans = [item for item in data if item.get("type") == "exam_plan"]
        print(f"✓ GET /api/history returned {len(exam_plans)} exam_plan items out of {len(data)} total")
    
    def test_history_filter_exam_plan(self):
        """Test GET /api/history?item_type=exam_plan filters correctly"""
        response = requests.get(f"{BASE_URL}/api/history?item_type=exam_plan")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # All items should be exam_plan type
        for item in data:
            assert item.get("type") == "exam_plan", f"Expected exam_plan type, got {item.get('type')}"
        
        print(f"✓ GET /api/history?item_type=exam_plan returned {len(data)} items, all exam_plan type")
    
    def test_history_exam_plan_structure(self):
        """Test exam_plan items in history have correct structure"""
        response = requests.get(f"{BASE_URL}/api/history?item_type=exam_plan")
        
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            item = data[0]
            
            # Check required fields
            assert "type" in item and item["type"] == "exam_plan"
            assert "id" in item
            assert "title" in item  # Should be subject
            assert "subtitle" in item  # Should contain exam date info
            assert "created_at" in item
            assert "preview" in item
            assert "data" in item
            
            # Check preview structure
            preview = item["preview"]
            assert "days_until_exam" in preview
            assert "hours_per_day" in preview
            assert "topics_count" in preview
            assert "topics_summary" in preview
            
            print("✓ Exam plan history item has correct structure")
        else:
            print("⚠ No exam plans in history to verify structure")
    
    def test_delete_history_exam_plan(self):
        """Test DELETE /api/history/exam_plan/{id}"""
        # First create an exam plan
        future_date = (datetime.now() + timedelta(days=25)).strftime("%Y-%m-%d")
        
        payload = {
            "subject": "TEST_HistoryDelete",
            "topics": ["Topic1"],
            "exam_date": future_date,
            "hours_per_day": 1.0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/planner/exam/generate", json=payload, timeout=60)
        assert create_response.status_code == 200, "Failed to create plan for history delete test"
        
        plan_id = create_response.json()["id"]
        
        # Delete via history endpoint
        delete_response = requests.delete(f"{BASE_URL}/api/history/exam_plan/{plan_id}")
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        # Verify it's deleted
        get_response = requests.get(f"{BASE_URL}/api/history?item_type=exam_plan")
        items = get_response.json()
        item_ids = [i["id"] for i in items]
        assert plan_id not in item_ids, "Deleted plan should not appear in history"
        
        print("✓ DELETE /api/history/exam_plan/{id} working correctly")


class TestRegularPlannerStillWorks:
    """Verify regular planner endpoints still work after exam planner addition"""
    
    def test_regular_planner_generate(self):
        """Test POST /api/planner/generate still works"""
        payload = {
            "topic": "TEST_RegularPlan",
            "hours_per_day": 2.0,
            "num_days": 3
        }
        
        response = requests.post(f"{BASE_URL}/api/planner/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "id" in data
        assert data["topic"] == "TEST_RegularPlan"
        assert "days" in data
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/planners/{data['id']}")
        
        print("✓ Regular planner still works correctly")
    
    def test_get_regular_planners(self):
        """Test GET /api/planners still works"""
        response = requests.get(f"{BASE_URL}/api/planners")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert isinstance(response.json(), list)
        
        print("✓ GET /api/planners still works correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
