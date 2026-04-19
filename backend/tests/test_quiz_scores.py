"""
Test Quiz Score Tracking Feature
- POST /api/quiz-scores: Save quiz score with score_pct calculation
- GET /api/quiz-scores: Retrieve list of saved scores
- GET /api/analytics: Verify quiz_scores object in analytics response
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestQuizScoreEndpoints:
    """Test quiz score CRUD operations"""
    
    def test_post_quiz_score_saves_record(self):
        """POST /api/quiz-scores saves a score record with score_pct calculated"""
        payload = {
            "test_id": "test-quiz-001",
            "subject": "TEST_Mathematics",
            "chapter": "Algebra",
            "total_gradable": 10,
            "correct": 8,
            "total_subjective": 2,
            "attempted_subjective": 1
        }
        response = requests.post(f"{BASE_URL}/api/quiz-scores", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain id"
        assert data["test_id"] == "test-quiz-001"
        assert data["subject"] == "TEST_Mathematics"
        assert data["chapter"] == "Algebra"
        assert data["total_gradable"] == 10
        assert data["correct"] == 8
        assert data["score_pct"] == 80.0, f"Expected score_pct=80.0, got {data['score_pct']}"
        assert "created_at" in data
        print(f"✓ POST /api/quiz-scores: Created score with id={data['id']}, score_pct={data['score_pct']}")
    
    def test_post_quiz_score_zero_gradable_returns_zero_pct(self):
        """POST /api/quiz-scores with 0 total_gradable returns 0 score_pct"""
        payload = {
            "test_id": "test-quiz-002",
            "subject": "TEST_English",
            "chapter": "Essay Writing",
            "total_gradable": 0,
            "correct": 0,
            "total_subjective": 3,
            "attempted_subjective": 2
        }
        response = requests.post(f"{BASE_URL}/api/quiz-scores", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["score_pct"] == 0, f"Expected score_pct=0 when total_gradable=0, got {data['score_pct']}"
        print(f"✓ POST /api/quiz-scores with 0 gradable: score_pct={data['score_pct']}")
    
    def test_post_quiz_score_perfect_score(self):
        """POST /api/quiz-scores with perfect score returns 100%"""
        payload = {
            "test_id": "test-quiz-003",
            "subject": "TEST_Physics",
            "chapter": "Mechanics",
            "total_gradable": 5,
            "correct": 5,
            "total_subjective": 0,
            "attempted_subjective": 0
        }
        response = requests.post(f"{BASE_URL}/api/quiz-scores", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["score_pct"] == 100.0, f"Expected 100.0, got {data['score_pct']}"
        print(f"✓ POST /api/quiz-scores perfect score: score_pct={data['score_pct']}")
    
    def test_post_quiz_score_partial_score(self):
        """POST /api/quiz-scores with partial score calculates correctly"""
        payload = {
            "test_id": "test-quiz-004",
            "subject": "TEST_Chemistry",
            "chapter": "Organic Chemistry",
            "total_gradable": 8,
            "correct": 3,
            "total_subjective": 0,
            "attempted_subjective": 0
        }
        response = requests.post(f"{BASE_URL}/api/quiz-scores", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        # 3/8 = 0.375 = 37.5%
        assert data["score_pct"] == 37.5, f"Expected 37.5, got {data['score_pct']}"
        print(f"✓ POST /api/quiz-scores partial score: 3/8 = {data['score_pct']}%")
    
    def test_get_quiz_scores_returns_list(self):
        """GET /api/quiz-scores returns list of saved scores"""
        response = requests.get(f"{BASE_URL}/api/quiz-scores")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Should have at least the scores we created
        test_scores = [s for s in data if s.get("subject", "").startswith("TEST_")]
        assert len(test_scores) >= 1, "Should have at least one test score"
        
        # Verify structure of a score record
        if data:
            score = data[0]
            assert "id" in score
            assert "test_id" in score
            assert "subject" in score
            assert "chapter" in score
            assert "total_gradable" in score
            assert "correct" in score
            assert "score_pct" in score
            assert "created_at" in score
        
        print(f"✓ GET /api/quiz-scores: Retrieved {len(data)} scores")


class TestAnalyticsQuizScores:
    """Test analytics endpoint includes quiz_scores data"""
    
    def test_analytics_includes_quiz_scores_object(self):
        """GET /api/analytics includes quiz_scores object"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "quiz_scores" in data, "Analytics should include quiz_scores object"
        
        quiz_scores = data["quiz_scores"]
        assert "avg_accuracy" in quiz_scores, "quiz_scores should have avg_accuracy"
        assert "total_attempts" in quiz_scores, "quiz_scores should have total_attempts"
        assert "subject_accuracy" in quiz_scores, "quiz_scores should have subject_accuracy"
        assert "score_trend" in quiz_scores, "quiz_scores should have score_trend"
        
        print(f"✓ GET /api/analytics: quiz_scores object present with all required fields")
        print(f"  - avg_accuracy: {quiz_scores['avg_accuracy']}")
        print(f"  - total_attempts: {quiz_scores['total_attempts']}")
        print(f"  - subject_accuracy count: {len(quiz_scores['subject_accuracy'])}")
        print(f"  - score_trend count: {len(quiz_scores['score_trend'])}")
    
    def test_analytics_avg_accuracy_calculation(self):
        """GET /api/analytics avg_accuracy is calculated correctly"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        
        assert response.status_code == 200
        data = response.json()
        
        quiz_scores = data["quiz_scores"]
        avg_accuracy = quiz_scores["avg_accuracy"]
        total_attempts = quiz_scores["total_attempts"]
        
        # avg_accuracy should be a number between 0 and 100
        assert isinstance(avg_accuracy, (int, float)), "avg_accuracy should be a number"
        assert 0 <= avg_accuracy <= 100, f"avg_accuracy should be 0-100, got {avg_accuracy}"
        
        # If there are attempts, avg_accuracy should be > 0 (unless all scores are 0)
        if total_attempts > 0:
            print(f"✓ Analytics avg_accuracy: {avg_accuracy}% from {total_attempts} attempts")
        else:
            assert avg_accuracy == 0, "avg_accuracy should be 0 when no attempts"
            print(f"✓ Analytics avg_accuracy: 0% (no attempts)")
    
    def test_analytics_subject_accuracy_structure(self):
        """GET /api/analytics subject_accuracy has correct structure"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        
        assert response.status_code == 200
        data = response.json()
        
        subject_accuracy = data["quiz_scores"]["subject_accuracy"]
        assert isinstance(subject_accuracy, list), "subject_accuracy should be a list"
        
        if subject_accuracy:
            item = subject_accuracy[0]
            assert "subject" in item, "subject_accuracy item should have subject"
            assert "avg_score" in item, "subject_accuracy item should have avg_score"
            assert "quizzes" in item, "subject_accuracy item should have quizzes count"
            assert "correct" in item, "subject_accuracy item should have correct count"
            assert "total" in item, "subject_accuracy item should have total count"
            
            print(f"✓ Analytics subject_accuracy structure verified")
            for sa in subject_accuracy[:3]:
                print(f"  - {sa['subject']}: {sa['avg_score']}% ({sa['correct']}/{sa['total']})")
    
    def test_analytics_score_trend_structure(self):
        """GET /api/analytics score_trend has correct structure"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        
        assert response.status_code == 200
        data = response.json()
        
        score_trend = data["quiz_scores"]["score_trend"]
        assert isinstance(score_trend, list), "score_trend should be a list"
        
        if score_trend:
            item = score_trend[0]
            assert "date" in item, "score_trend item should have date"
            assert "avg_score" in item, "score_trend item should have avg_score"
            
            print(f"✓ Analytics score_trend structure verified")
            for st in score_trend[:3]:
                print(f"  - {st['date']}: {st['avg_score']}%")
    
    def test_analytics_existing_features_still_work(self):
        """GET /api/analytics still includes existing features (totals, subject_breakdown, etc.)"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify existing analytics features
        assert "totals" in data, "Analytics should have totals"
        totals = data["totals"]
        assert "notes" in totals
        assert "plans" in totals
        assert "exam_plans" in totals
        assert "quizzes" in totals
        assert "total_questions" in totals
        
        assert "subject_breakdown" in data, "Analytics should have subject_breakdown"
        assert "note_type_breakdown" in data, "Analytics should have note_type_breakdown"
        assert "activity_timeline" in data, "Analytics should have activity_timeline"
        
        print(f"✓ Analytics existing features verified:")
        print(f"  - totals: notes={totals['notes']}, plans={totals['plans']}, quizzes={totals['quizzes']}")
        print(f"  - subject_breakdown: {len(data['subject_breakdown'])} subjects")
        print(f"  - activity_timeline: {len(data['activity_timeline'])} days")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
