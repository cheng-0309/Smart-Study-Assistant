"""
Test Analytics and Notes Search API endpoints
- GET /api/analytics - returns totals, subject_breakdown, note_type_breakdown, quiz_type_breakdown, activity_timeline
- GET /api/notes/search - returns filtered notes by subject/chapter/note_type
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAnalyticsEndpoint:
    """Tests for GET /api/analytics endpoint"""

    def test_analytics_returns_200(self):
        """Analytics endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Analytics endpoint returns 200")

    def test_analytics_has_totals(self):
        """Analytics should return totals object with required fields"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        data = response.json()
        
        assert "totals" in data, "Response missing 'totals' field"
        totals = data["totals"]
        
        required_fields = ["notes", "plans", "exam_plans", "quizzes", "total_questions"]
        for field in required_fields:
            assert field in totals, f"Totals missing '{field}' field"
            assert isinstance(totals[field], int), f"'{field}' should be an integer"
        
        print(f"✓ Totals: notes={totals['notes']}, plans={totals['plans']}, exam_plans={totals['exam_plans']}, quizzes={totals['quizzes']}, total_questions={totals['total_questions']}")

    def test_analytics_has_subject_breakdown(self):
        """Analytics should return subject_breakdown array"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        data = response.json()
        
        assert "subject_breakdown" in data, "Response missing 'subject_breakdown' field"
        assert isinstance(data["subject_breakdown"], list), "subject_breakdown should be a list"
        
        if len(data["subject_breakdown"]) > 0:
            item = data["subject_breakdown"][0]
            assert "subject" in item, "subject_breakdown item missing 'subject'"
            assert "count" in item, "subject_breakdown item missing 'count'"
        
        print(f"✓ Subject breakdown has {len(data['subject_breakdown'])} subjects")

    def test_analytics_has_note_type_breakdown(self):
        """Analytics should return note_type_breakdown array"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        data = response.json()
        
        assert "note_type_breakdown" in data, "Response missing 'note_type_breakdown' field"
        assert isinstance(data["note_type_breakdown"], list), "note_type_breakdown should be a list"
        
        if len(data["note_type_breakdown"]) > 0:
            item = data["note_type_breakdown"][0]
            assert "type" in item, "note_type_breakdown item missing 'type'"
            assert "count" in item, "note_type_breakdown item missing 'count'"
        
        print(f"✓ Note type breakdown has {len(data['note_type_breakdown'])} types")

    def test_analytics_has_quiz_type_breakdown(self):
        """Analytics should return quiz_type_breakdown array"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        data = response.json()
        
        assert "quiz_type_breakdown" in data, "Response missing 'quiz_type_breakdown' field"
        assert isinstance(data["quiz_type_breakdown"], list), "quiz_type_breakdown should be a list"
        
        print(f"✓ Quiz type breakdown has {len(data['quiz_type_breakdown'])} types")

    def test_analytics_has_activity_timeline(self):
        """Analytics should return activity_timeline array"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        data = response.json()
        
        assert "activity_timeline" in data, "Response missing 'activity_timeline' field"
        assert isinstance(data["activity_timeline"], list), "activity_timeline should be a list"
        
        if len(data["activity_timeline"]) > 0:
            item = data["activity_timeline"][0]
            assert "date" in item, "activity_timeline item missing 'date'"
            assert "notes" in item, "activity_timeline item missing 'notes'"
            assert "plans" in item, "activity_timeline item missing 'plans'"
            assert "quizzes" in item, "activity_timeline item missing 'quizzes'"
        
        print(f"✓ Activity timeline has {len(data['activity_timeline'])} days")


class TestNotesSearchEndpoint:
    """Tests for GET /api/notes/search endpoint"""

    def test_search_no_query_returns_all(self):
        """Search with no query should return all notes"""
        response = requests.get(f"{BASE_URL}/api/notes/search")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Search with no query returns {len(data)} notes")

    def test_search_empty_query_returns_all(self):
        """Search with empty query should return all notes"""
        response = requests.get(f"{BASE_URL}/api/notes/search?q=")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Search with empty query returns {len(data)} notes")

    def test_search_by_subject(self):
        """Search should filter by subject"""
        # First get all notes to find a subject to search for
        all_notes = requests.get(f"{BASE_URL}/api/notes").json()
        
        if len(all_notes) == 0:
            pytest.skip("No notes available to test search")
        
        # Get a subject from existing notes
        test_subject = all_notes[0]["subject"]
        search_term = test_subject[:4].lower()  # Use first 4 chars
        
        response = requests.get(f"{BASE_URL}/api/notes/search?q={search_term}")
        assert response.status_code == 200
        data = response.json()
        
        # All results should contain the search term in subject, chapter, or note_type
        for note in data:
            matches = (
                search_term.lower() in note.get("subject", "").lower() or
                search_term.lower() in note.get("chapter", "").lower() or
                search_term.lower() in note.get("note_type", "").lower()
            )
            assert matches, f"Note {note['id']} doesn't match search term '{search_term}'"
        
        print(f"✓ Search for '{search_term}' returns {len(data)} matching notes")

    def test_search_no_results(self):
        """Search with non-matching query should return empty list"""
        response = requests.get(f"{BASE_URL}/api/notes/search?q=xyznonexistent123")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 0, "Non-matching search should return empty list"
        print("✓ Search with non-matching query returns empty list")

    def test_search_case_insensitive(self):
        """Search should be case insensitive"""
        all_notes = requests.get(f"{BASE_URL}/api/notes").json()
        
        if len(all_notes) == 0:
            pytest.skip("No notes available to test search")
        
        test_subject = all_notes[0]["subject"]
        
        # Search with uppercase
        upper_response = requests.get(f"{BASE_URL}/api/notes/search?q={test_subject.upper()}")
        # Search with lowercase
        lower_response = requests.get(f"{BASE_URL}/api/notes/search?q={test_subject.lower()}")
        
        assert upper_response.status_code == 200
        assert lower_response.status_code == 200
        
        upper_data = upper_response.json()
        lower_data = lower_response.json()
        
        # Both should return same number of results
        assert len(upper_data) == len(lower_data), "Case insensitive search should return same results"
        print(f"✓ Case insensitive search works: {len(upper_data)} results for both cases")


class TestExistingEndpoints:
    """Verify existing endpoints still work"""

    def test_notes_endpoint(self):
        """GET /api/notes should still work"""
        response = requests.get(f"{BASE_URL}/api/notes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/notes returns {len(data)} notes")

    def test_planners_endpoint(self):
        """GET /api/planners should still work"""
        response = requests.get(f"{BASE_URL}/api/planners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/planners returns {len(data)} plans")

    def test_practices_endpoint(self):
        """GET /api/practices should still work"""
        response = requests.get(f"{BASE_URL}/api/practices")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/practices returns {len(data)} quizzes")

    def test_exam_planners_endpoint(self):
        """GET /api/exam-planners should still work"""
        response = requests.get(f"{BASE_URL}/api/exam-planners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/exam-planners returns {len(data)} exam plans")

    def test_history_endpoint(self):
        """GET /api/history should still work"""
        response = requests.get(f"{BASE_URL}/api/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/history returns {len(data)} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
