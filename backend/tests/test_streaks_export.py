"""
Test cases for Study Streak Tracking and Export Analytics features.
- GET /api/analytics includes streaks object with current_streak, longest_streak, total_active_days, weekly_heatmap
- streaks.weekly_heatmap has 49 entries with date, weekday, count fields
- GET /api/analytics/export returns report string with STUDYFORGE ANALYTICS REPORT header
- GET /api/analytics/export includes OVERVIEW, STUDY STREAKS, QUIZ PERFORMANCE, TOP SUBJECTS sections
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestStreakTracking:
    """Tests for Study Streak Tracking feature in GET /api/analytics"""

    def test_analytics_includes_streaks_object(self):
        """GET /api/analytics should include streaks object"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "streaks" in data, "Response should include 'streaks' key"
        
        streaks = data["streaks"]
        assert isinstance(streaks, dict), "streaks should be a dictionary"
        print(f"SUCCESS: GET /api/analytics includes streaks object")

    def test_streaks_has_current_streak(self):
        """streaks object should have current_streak field"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        streaks = response.json()["streaks"]
        assert "current_streak" in streaks, "streaks should have 'current_streak' field"
        assert isinstance(streaks["current_streak"], int), "current_streak should be an integer"
        assert streaks["current_streak"] >= 0, "current_streak should be non-negative"
        print(f"SUCCESS: current_streak = {streaks['current_streak']}")

    def test_streaks_has_longest_streak(self):
        """streaks object should have longest_streak field"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        streaks = response.json()["streaks"]
        assert "longest_streak" in streaks, "streaks should have 'longest_streak' field"
        assert isinstance(streaks["longest_streak"], int), "longest_streak should be an integer"
        assert streaks["longest_streak"] >= 0, "longest_streak should be non-negative"
        print(f"SUCCESS: longest_streak = {streaks['longest_streak']}")

    def test_streaks_has_total_active_days(self):
        """streaks object should have total_active_days field"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        streaks = response.json()["streaks"]
        assert "total_active_days" in streaks, "streaks should have 'total_active_days' field"
        assert isinstance(streaks["total_active_days"], int), "total_active_days should be an integer"
        assert streaks["total_active_days"] >= 0, "total_active_days should be non-negative"
        print(f"SUCCESS: total_active_days = {streaks['total_active_days']}")

    def test_streaks_has_weekly_heatmap(self):
        """streaks object should have weekly_heatmap field"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        streaks = response.json()["streaks"]
        assert "weekly_heatmap" in streaks, "streaks should have 'weekly_heatmap' field"
        assert isinstance(streaks["weekly_heatmap"], list), "weekly_heatmap should be a list"
        print(f"SUCCESS: weekly_heatmap is present with {len(streaks['weekly_heatmap'])} entries")

    def test_weekly_heatmap_has_49_entries(self):
        """weekly_heatmap should have exactly 49 entries (7 weeks)"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        heatmap = response.json()["streaks"]["weekly_heatmap"]
        assert len(heatmap) == 49, f"weekly_heatmap should have 49 entries, got {len(heatmap)}"
        print(f"SUCCESS: weekly_heatmap has exactly 49 entries")

    def test_weekly_heatmap_entry_structure(self):
        """Each heatmap entry should have date, weekday, count fields"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        heatmap = response.json()["streaks"]["weekly_heatmap"]
        assert len(heatmap) > 0, "Heatmap should not be empty"
        
        # Check first and last entries
        for entry in [heatmap[0], heatmap[-1]]:
            assert "date" in entry, "Entry should have 'date' field"
            assert "weekday" in entry, "Entry should have 'weekday' field"
            assert "count" in entry, "Entry should have 'count' field"
            
            # Validate types
            assert isinstance(entry["date"], str), "date should be a string"
            assert isinstance(entry["weekday"], int), "weekday should be an integer"
            assert isinstance(entry["count"], int), "count should be an integer"
            
            # Validate weekday range (0-6)
            assert 0 <= entry["weekday"] <= 6, f"weekday should be 0-6, got {entry['weekday']}"
            
            # Validate count is non-negative
            assert entry["count"] >= 0, f"count should be non-negative, got {entry['count']}"
        
        print(f"SUCCESS: Heatmap entries have correct structure (date, weekday, count)")

    def test_heatmap_dates_are_valid(self):
        """Heatmap dates should be valid ISO format dates"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        heatmap = response.json()["streaks"]["weekly_heatmap"]
        
        for entry in heatmap:
            try:
                datetime.strptime(entry["date"], "%Y-%m-%d")
            except ValueError:
                pytest.fail(f"Invalid date format: {entry['date']}")
        
        print(f"SUCCESS: All heatmap dates are valid ISO format")

    def test_heatmap_covers_last_49_days(self):
        """Heatmap should cover the last 49 days ending with today"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        heatmap = response.json()["streaks"]["weekly_heatmap"]
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Last entry should be today
        assert heatmap[-1]["date"] == today, f"Last heatmap entry should be today ({today}), got {heatmap[-1]['date']}"
        
        # First entry should be 48 days ago
        expected_first = (datetime.now() - timedelta(days=48)).strftime("%Y-%m-%d")
        assert heatmap[0]["date"] == expected_first, f"First heatmap entry should be {expected_first}, got {heatmap[0]['date']}"
        
        print(f"SUCCESS: Heatmap covers last 49 days from {heatmap[0]['date']} to {heatmap[-1]['date']}")

    def test_current_streak_logic(self):
        """current_streak should be 0 when no activity today/yesterday"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        streaks = response.json()["streaks"]
        heatmap = streaks["weekly_heatmap"]
        
        # Get today and yesterday counts
        today_entry = heatmap[-1]
        yesterday_entry = heatmap[-2]
        
        # If no activity today or yesterday, current_streak should be 0
        if today_entry["count"] == 0 and yesterday_entry["count"] == 0:
            assert streaks["current_streak"] == 0, "current_streak should be 0 when no activity today/yesterday"
            print(f"SUCCESS: current_streak is 0 (no activity today/yesterday)")
        else:
            # If there's activity, current_streak should be positive
            assert streaks["current_streak"] >= 0, "current_streak should be non-negative"
            print(f"SUCCESS: current_streak = {streaks['current_streak']} (activity detected)")


class TestExportAnalytics:
    """Tests for Export Analytics Report feature - GET /api/analytics/export"""

    def test_export_endpoint_returns_200(self):
        """GET /api/analytics/export should return 200"""
        response = requests.get(f"{BASE_URL}/api/analytics/export")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"SUCCESS: GET /api/analytics/export returns 200")

    def test_export_returns_report_string(self):
        """Response should contain 'report' key with string value"""
        response = requests.get(f"{BASE_URL}/api/analytics/export")
        assert response.status_code == 200
        
        data = response.json()
        assert "report" in data, "Response should have 'report' key"
        assert isinstance(data["report"], str), "report should be a string"
        assert len(data["report"]) > 0, "report should not be empty"
        print(f"SUCCESS: Export returns report string ({len(data['report'])} chars)")

    def test_export_has_studyforge_header(self):
        """Report should start with STUDYFORGE ANALYTICS REPORT header"""
        response = requests.get(f"{BASE_URL}/api/analytics/export")
        assert response.status_code == 200
        
        report = response.json()["report"]
        assert "STUDYFORGE ANALYTICS REPORT" in report, "Report should contain 'STUDYFORGE ANALYTICS REPORT' header"
        assert report.startswith("STUDYFORGE ANALYTICS REPORT"), "Report should start with header"
        print(f"SUCCESS: Report has STUDYFORGE ANALYTICS REPORT header")

    def test_export_has_overview_section(self):
        """Report should include OVERVIEW section"""
        response = requests.get(f"{BASE_URL}/api/analytics/export")
        assert response.status_code == 200
        
        report = response.json()["report"]
        assert "OVERVIEW" in report, "Report should contain 'OVERVIEW' section"
        print(f"SUCCESS: Report has OVERVIEW section")

    def test_export_has_study_streaks_section(self):
        """Report should include STUDY STREAKS section"""
        response = requests.get(f"{BASE_URL}/api/analytics/export")
        assert response.status_code == 200
        
        report = response.json()["report"]
        assert "STUDY STREAKS" in report, "Report should contain 'STUDY STREAKS' section"
        print(f"SUCCESS: Report has STUDY STREAKS section")

    def test_export_has_quiz_performance_section(self):
        """Report should include QUIZ PERFORMANCE section (if quiz scores exist)"""
        response = requests.get(f"{BASE_URL}/api/analytics/export")
        assert response.status_code == 200
        
        report = response.json()["report"]
        # QUIZ PERFORMANCE section only appears if there are quiz scores
        # Check if it's present or if there's no quiz data
        if "QUIZ PERFORMANCE" in report:
            print(f"SUCCESS: Report has QUIZ PERFORMANCE section")
        else:
            # Verify there are no quiz scores
            analytics_response = requests.get(f"{BASE_URL}/api/analytics")
            quiz_attempts = analytics_response.json().get("quiz_scores", {}).get("total_attempts", 0)
            if quiz_attempts == 0:
                print(f"SUCCESS: QUIZ PERFORMANCE section not present (no quiz scores)")
            else:
                pytest.fail("QUIZ PERFORMANCE section should be present when quiz scores exist")

    def test_export_has_top_subjects_section(self):
        """Report should include TOP SUBJECTS section (if notes exist)"""
        response = requests.get(f"{BASE_URL}/api/analytics/export")
        assert response.status_code == 200
        
        report = response.json()["report"]
        # TOP SUBJECTS section only appears if there are notes
        if "TOP SUBJECTS" in report:
            print(f"SUCCESS: Report has TOP SUBJECTS section")
        else:
            # Verify there are no notes
            analytics_response = requests.get(f"{BASE_URL}/api/analytics")
            notes_count = analytics_response.json().get("totals", {}).get("notes", 0)
            if notes_count == 0:
                print(f"SUCCESS: TOP SUBJECTS section not present (no notes)")
            else:
                pytest.fail("TOP SUBJECTS section should be present when notes exist")

    def test_export_overview_contains_counts(self):
        """OVERVIEW section should contain notes, plans, quizzes counts"""
        response = requests.get(f"{BASE_URL}/api/analytics/export")
        assert response.status_code == 200
        
        report = response.json()["report"]
        
        # Check for expected fields in OVERVIEW
        assert "Notes Generated:" in report, "OVERVIEW should contain 'Notes Generated:'"
        assert "Study Plans:" in report, "OVERVIEW should contain 'Study Plans:'"
        assert "Practice Quizzes:" in report, "OVERVIEW should contain 'Practice Quizzes:'"
        assert "Total Questions:" in report, "OVERVIEW should contain 'Total Questions:'"
        print(f"SUCCESS: OVERVIEW section contains all expected counts")

    def test_export_streaks_contains_values(self):
        """STUDY STREAKS section should contain streak values"""
        response = requests.get(f"{BASE_URL}/api/analytics/export")
        assert response.status_code == 200
        
        report = response.json()["report"]
        
        # Check for expected fields in STUDY STREAKS
        assert "Current Streak:" in report, "STUDY STREAKS should contain 'Current Streak:'"
        assert "Longest Streak:" in report, "STUDY STREAKS should contain 'Longest Streak:'"
        assert "Total Active Days:" in report, "STUDY STREAKS should contain 'Total Active Days:'"
        print(f"SUCCESS: STUDY STREAKS section contains all expected values")

    def test_export_has_footer(self):
        """Report should end with StudyForge footer"""
        response = requests.get(f"{BASE_URL}/api/analytics/export")
        assert response.status_code == 200
        
        report = response.json()["report"]
        assert "StudyForge" in report, "Report should contain 'StudyForge' in footer"
        print(f"SUCCESS: Report has StudyForge footer")


class TestExistingAnalyticsFeatures:
    """Verify existing analytics features still work after streak/export additions"""

    def test_analytics_still_has_totals(self):
        """GET /api/analytics should still include totals object"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        data = response.json()
        assert "totals" in data, "Response should include 'totals' key"
        
        totals = data["totals"]
        assert "notes" in totals, "totals should have 'notes'"
        assert "plans" in totals, "totals should have 'plans'"
        assert "quizzes" in totals, "totals should have 'quizzes'"
        print(f"SUCCESS: Existing totals feature still works")

    def test_analytics_still_has_subject_breakdown(self):
        """GET /api/analytics should still include subject_breakdown"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        data = response.json()
        assert "subject_breakdown" in data, "Response should include 'subject_breakdown' key"
        assert isinstance(data["subject_breakdown"], list), "subject_breakdown should be a list"
        print(f"SUCCESS: Existing subject_breakdown feature still works")

    def test_analytics_still_has_quiz_scores(self):
        """GET /api/analytics should still include quiz_scores object"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        data = response.json()
        assert "quiz_scores" in data, "Response should include 'quiz_scores' key"
        
        quiz_scores = data["quiz_scores"]
        assert "avg_accuracy" in quiz_scores, "quiz_scores should have 'avg_accuracy'"
        assert "total_attempts" in quiz_scores, "quiz_scores should have 'total_attempts'"
        print(f"SUCCESS: Existing quiz_scores feature still works")

    def test_analytics_still_has_activity_timeline(self):
        """GET /api/analytics should still include activity_timeline"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 200
        
        data = response.json()
        assert "activity_timeline" in data, "Response should include 'activity_timeline' key"
        assert isinstance(data["activity_timeline"], list), "activity_timeline should be a list"
        print(f"SUCCESS: Existing activity_timeline feature still works")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
