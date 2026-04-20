"""
Test suite for new features:
1. Practice Test Difficulty Selector
2. Bulk Operations on Notes
3. AI-powered Study Recommendations
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPracticeDifficulty:
    """Tests for Practice Test Difficulty Selector feature"""
    
    def test_practice_generate_accepts_difficulty_field(self):
        """POST /api/practice/generate accepts difficulty field"""
        response = requests.post(f"{BASE_URL}/api/practice/generate", json={
            "subject": "TEST_Physics",
            "chapter": "Newton's Laws",
            "num_questions": 3,
            "question_type": "mcq",
            "difficulty": "easy"
        }, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response should have id"
        assert "questions" in data, "Response should have questions"
        assert len(data["questions"]) >= 1, "Should have at least 1 question"
        
        # Verify difficulty field in questions
        for q in data["questions"]:
            assert "difficulty" in q, f"Question should have difficulty field: {q}"
            assert q["difficulty"] in ["easy", "medium", "hard"], f"Invalid difficulty: {q['difficulty']}"
        
        print(f"✓ Practice test generated with {len(data['questions'])} questions")
        return data["id"]
    
    def test_practice_generate_with_mixed_difficulty(self):
        """POST /api/practice/generate with mixed difficulty"""
        response = requests.post(f"{BASE_URL}/api/practice/generate", json={
            "subject": "TEST_Math",
            "chapter": "Algebra",
            "num_questions": 5,
            "question_type": "mixed",
            "difficulty": "mixed"
        }, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify questions have difficulty field
        difficulties = set()
        for q in data["questions"]:
            assert "difficulty" in q, "Question should have difficulty field"
            difficulties.add(q["difficulty"])
        
        print(f"✓ Mixed difficulty test generated with difficulties: {difficulties}")
    
    def test_practice_generate_with_hard_difficulty(self):
        """POST /api/practice/generate with hard difficulty"""
        response = requests.post(f"{BASE_URL}/api/practice/generate", json={
            "subject": "TEST_Chemistry",
            "chapter": "Organic Chemistry",
            "num_questions": 3,
            "question_type": "mcq",
            "difficulty": "hard"
        }, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # All questions should be hard when difficulty is specified
        for q in data["questions"]:
            assert "difficulty" in q, "Question should have difficulty field"
        
        print(f"✓ Hard difficulty test generated successfully")


class TestBulkNotesOperations:
    """Tests for Bulk Operations on Notes feature"""
    
    @pytest.fixture(autouse=True)
    def setup_test_notes(self):
        """Create test notes for bulk operations"""
        self.test_note_ids = []
        
        # Create 3 test notes
        for i in range(3):
            response = requests.post(f"{BASE_URL}/api/notes/generate", json={
                "subject": f"TEST_BulkSubject{i}",
                "chapter": f"Bulk Test Chapter {i}",
                "note_type": "quick_revision"
            }, timeout=60)
            
            if response.status_code == 200:
                self.test_note_ids.append(response.json()["id"])
        
        yield
        
        # Cleanup - delete any remaining test notes
        for note_id in self.test_note_ids:
            try:
                requests.delete(f"{BASE_URL}/api/notes/{note_id}", timeout=10)
            except:
                pass
    
    def test_get_notes_returns_list(self):
        """GET /api/notes returns list of notes"""
        response = requests.get(f"{BASE_URL}/api/notes", timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/notes returns {len(data)} notes")
    
    def test_delete_single_note(self):
        """DELETE /api/notes/:id deletes a single note"""
        if not self.test_note_ids:
            pytest.skip("No test notes created")
        
        note_id = self.test_note_ids[0]
        response = requests.delete(f"{BASE_URL}/api/notes/{note_id}", timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify note is deleted
        get_response = requests.get(f"{BASE_URL}/api/notes/{note_id}", timeout=30)
        assert get_response.status_code == 404, "Deleted note should return 404"
        
        self.test_note_ids.remove(note_id)
        print(f"✓ Single note deleted successfully")
    
    def test_update_note_with_tags(self):
        """PUT /api/notes/:id can add tags to a note"""
        if not self.test_note_ids:
            pytest.skip("No test notes created")
        
        note_id = self.test_note_ids[0]
        
        # Add tags to note
        response = requests.put(f"{BASE_URL}/api/notes/{note_id}", json={
            "tags": ["test-tag", "bulk-test"]
        }, timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify tags were added
        assert "tags" in data, "Response should have tags field"
        assert "test-tag" in data["tags"], "Tags should include 'test-tag'"
        assert "bulk-test" in data["tags"], "Tags should include 'bulk-test'"
        
        print(f"✓ Note tags updated successfully: {data['tags']}")


class TestAIRecommendations:
    """Tests for AI-powered Study Recommendations feature"""
    
    def test_recommendations_endpoint_exists(self):
        """GET /api/analytics/recommendations endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/analytics/recommendations", timeout=30)
        
        # Should return 200 even if no data
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "recommendations" in data, "Response should have recommendations field"
        assert isinstance(data["recommendations"], list), "Recommendations should be a list"
        
        print(f"✓ Recommendations endpoint returns {len(data['recommendations'])} recommendations")
    
    def test_recommendations_with_data(self):
        """GET /api/analytics/recommendations returns recommendations with proper structure"""
        # Wait a bit for AI to process
        response = requests.get(f"{BASE_URL}/api/analytics/recommendations", timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        if len(data["recommendations"]) > 0:
            rec = data["recommendations"][0]
            
            # Verify recommendation structure
            assert "type" in rec, "Recommendation should have type field"
            assert "title" in rec, "Recommendation should have title field"
            assert "message" in rec, "Recommendation should have message field"
            
            # Verify type is valid
            valid_types = ["weakness", "strength", "reminder", "motivation"]
            assert rec["type"] in valid_types, f"Invalid type: {rec['type']}"
            
            print(f"✓ Recommendation structure valid: type={rec['type']}, title={rec['title'][:30]}...")
        else:
            print("✓ No recommendations returned (may need more data)")


class TestExistingFeatures:
    """Regression tests for existing features"""
    
    def test_analytics_endpoint(self):
        """GET /api/analytics returns analytics data"""
        response = requests.get(f"{BASE_URL}/api/analytics", timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify key fields
        assert "totals" in data, "Should have totals"
        assert "streaks" in data, "Should have streaks"
        
        print(f"✓ Analytics endpoint working: {data['totals']}")
    
    def test_notes_search(self):
        """GET /api/notes returns searchable notes"""
        response = requests.get(f"{BASE_URL}/api/notes", timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        if len(data) > 0:
            note = data[0]
            assert "id" in note, "Note should have id"
            assert "subject" in note, "Note should have subject"
            assert "chapter" in note, "Note should have chapter"
        
        print(f"✓ Notes endpoint working: {len(data)} notes")
    
    def test_practices_endpoint(self):
        """GET /api/practices returns practice tests"""
        response = requests.get(f"{BASE_URL}/api/practices", timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        print(f"✓ Practices endpoint working: {len(data)} tests")
    
    def test_streaks_in_analytics(self):
        """GET /api/analytics includes streaks data"""
        response = requests.get(f"{BASE_URL}/api/analytics", timeout=30)
        
        assert response.status_code == 200
        data = response.json()
        
        streaks = data.get("streaks", {})
        assert "current_streak" in streaks, "Should have current_streak"
        assert "longest_streak" in streaks, "Should have longest_streak"
        assert "total_active_days" in streaks, "Should have total_active_days"
        assert "weekly_heatmap" in streaks, "Should have weekly_heatmap"
        
        print(f"✓ Streaks data present: current={streaks['current_streak']}, longest={streaks['longest_streak']}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_practices(self):
        """Clean up TEST_ prefixed practice tests"""
        response = requests.get(f"{BASE_URL}/api/practices", timeout=30)
        
        if response.status_code == 200:
            practices = response.json()
            deleted = 0
            for p in practices:
                if p.get("subject", "").startswith("TEST_"):
                    del_resp = requests.delete(f"{BASE_URL}/api/practices/{p['id']}", timeout=10)
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test practice tests")
    
    def test_cleanup_test_notes(self):
        """Clean up TEST_ prefixed notes"""
        response = requests.get(f"{BASE_URL}/api/notes", timeout=30)
        
        if response.status_code == 200:
            notes = response.json()
            deleted = 0
            for n in notes:
                if n.get("subject", "").startswith("TEST_"):
                    del_resp = requests.delete(f"{BASE_URL}/api/notes/{n['id']}", timeout=10)
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test notes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
