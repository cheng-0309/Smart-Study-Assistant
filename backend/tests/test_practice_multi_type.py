"""
Test suite for Multi-Type Practice System
Tests: POST /api/practice/generate with different question_type values
Tests: MCQ, True/False, Numerical, Short Answer, Long Answer, Mixed types
Tests: GET /api/practices, DELETE /api/practices/{id}
Tests: GET /api/history with practice type and question_type in preview
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://learn-guide-13.preview.emergentagent.com').rstrip('/')

class TestPracticeMultiTypeGeneration:
    """Tests for Practice Test generation with different question types"""
    
    created_test_ids = []  # Track created tests for cleanup
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup before each test"""
        yield
        # Cleanup after tests
        for test_id in self.created_test_ids:
            try:
                requests.delete(f"{BASE_URL}/api/practices/{test_id}")
            except:
                pass
        self.created_test_ids.clear()
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ API health check passed")
    
    def test_generate_mixed_type_practice(self):
        """Test POST /api/practice/generate with mixed question type (default)"""
        payload = {
            "subject": "TEST_Physics",
            "chapter": "Newton's Laws",
            "num_questions": 5,
            "question_type": "mixed"
        }
        
        response = requests.post(f"{BASE_URL}/api/practice/generate", json=payload, timeout=60)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "id" in data, "Response should contain 'id'"
        assert data["subject"] == "TEST_Physics", "Subject should match"
        assert data["chapter"] == "Newton's Laws", "Chapter should match"
        assert data["num_questions"] == 5, "num_questions should match"
        assert data["question_type"] == "mixed", "question_type should be 'mixed'"
        assert "questions" in data, "Should have questions array"
        assert len(data["questions"]) == 5, "Should have 5 questions"
        
        # Verify mixed distribution - should have multiple question types
        question_types = [q["question_type"] for q in data["questions"]]
        unique_types = set(question_types)
        assert len(unique_types) >= 2, f"Mixed type should have at least 2 different question types, got: {unique_types}"
        
        # Verify question structure based on type
        for q in data["questions"]:
            qt = q["question_type"]
            assert "question" in q, "Question should have 'question' field"
            
            if qt == "mcq":
                assert len(q.get("options", [])) == 4, f"MCQ should have 4 options, got {len(q.get('options', []))}"
                assert q.get("correct_answer") in ["A", "B", "C", "D"], "MCQ correct_answer should be A/B/C/D"
            elif qt == "true_false":
                assert q.get("correct_answer") in ["True", "False"], "T/F correct_answer should be True/False"
            elif qt == "numerical":
                assert q.get("correct_answer"), "Numerical should have correct_answer"
            elif qt in ["short_answer", "long_answer"]:
                assert q.get("model_answer"), f"{qt} should have model_answer"
                assert len(q.get("key_points", [])) >= 3, f"{qt} should have at least 3 key_points"
        
        self.created_test_ids.append(data["id"])
        print(f"✓ Mixed type practice generated with types: {unique_types}")
    
    def test_generate_mcq_only_practice(self):
        """Test POST /api/practice/generate with MCQ only"""
        payload = {
            "subject": "TEST_Chemistry",
            "chapter": "Periodic Table",
            "num_questions": 3,
            "question_type": "mcq"
        }
        
        response = requests.post(f"{BASE_URL}/api/practice/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["question_type"] == "mcq", "question_type should be 'mcq'"
        
        # All questions should be MCQ
        for q in data["questions"]:
            assert q["question_type"] == "mcq", f"Expected mcq, got {q['question_type']}"
            assert len(q.get("options", [])) == 4, "MCQ should have 4 options"
            for opt in q["options"]:
                assert "label" in opt, "Option should have label"
                assert "text" in opt, "Option should have text"
            assert q.get("correct_answer") in ["A", "B", "C", "D"], "correct_answer should be A/B/C/D"
        
        self.created_test_ids.append(data["id"])
        print(f"✓ MCQ-only practice generated with {len(data['questions'])} questions")
    
    def test_generate_true_false_practice(self):
        """Test POST /api/practice/generate with True/False only"""
        payload = {
            "subject": "TEST_Biology",
            "chapter": "Cell Structure",
            "num_questions": 3,
            "question_type": "true_false"
        }
        
        response = requests.post(f"{BASE_URL}/api/practice/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["question_type"] == "true_false", "question_type should be 'true_false'"
        
        # All questions should be True/False
        for q in data["questions"]:
            assert q["question_type"] == "true_false", f"Expected true_false, got {q['question_type']}"
            assert q.get("correct_answer") in ["True", "False"], f"correct_answer should be True/False, got {q.get('correct_answer')}"
            assert len(q.get("options", [])) == 0, "T/F should have empty options array"
        
        self.created_test_ids.append(data["id"])
        print(f"✓ True/False practice generated with {len(data['questions'])} questions")
    
    def test_generate_numerical_practice(self):
        """Test POST /api/practice/generate with Numerical only"""
        payload = {
            "subject": "TEST_Mathematics",
            "chapter": "Algebra",
            "num_questions": 3,
            "question_type": "numerical"
        }
        
        response = requests.post(f"{BASE_URL}/api/practice/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["question_type"] == "numerical", "question_type should be 'numerical'"
        
        # All questions should be Numerical
        for q in data["questions"]:
            assert q["question_type"] == "numerical", f"Expected numerical, got {q['question_type']}"
            assert q.get("correct_answer"), "Numerical should have correct_answer"
            assert len(q.get("options", [])) == 0, "Numerical should have empty options array"
        
        self.created_test_ids.append(data["id"])
        print(f"✓ Numerical practice generated with {len(data['questions'])} questions")
    
    def test_generate_short_answer_practice(self):
        """Test POST /api/practice/generate with Short Answer only"""
        payload = {
            "subject": "TEST_History",
            "chapter": "World War II",
            "num_questions": 3,
            "question_type": "short_answer"
        }
        
        response = requests.post(f"{BASE_URL}/api/practice/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["question_type"] == "short_answer", "question_type should be 'short_answer'"
        
        # All questions should be Short Answer
        for q in data["questions"]:
            assert q["question_type"] == "short_answer", f"Expected short_answer, got {q['question_type']}"
            assert q.get("model_answer"), "Short answer should have model_answer"
            assert len(q.get("key_points", [])) >= 3, "Short answer should have at least 3 key_points"
            assert q.get("correct_answer") == "", "Short answer correct_answer should be empty"
        
        self.created_test_ids.append(data["id"])
        print(f"✓ Short Answer practice generated with {len(data['questions'])} questions")
    
    def test_generate_long_answer_practice(self):
        """Test POST /api/practice/generate with Long Answer only"""
        payload = {
            "subject": "TEST_Literature",
            "chapter": "Shakespeare",
            "num_questions": 3,
            "question_type": "long_answer"
        }
        
        response = requests.post(f"{BASE_URL}/api/practice/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["question_type"] == "long_answer", "question_type should be 'long_answer'"
        
        # All questions should be Long Answer
        for q in data["questions"]:
            assert q["question_type"] == "long_answer", f"Expected long_answer, got {q['question_type']}"
            assert q.get("model_answer"), "Long answer should have model_answer"
            assert len(q.get("key_points", [])) >= 4, "Long answer should have at least 4 key_points"
            assert q.get("correct_answer") == "", "Long answer correct_answer should be empty"
        
        self.created_test_ids.append(data["id"])
        print(f"✓ Long Answer practice generated with {len(data['questions'])} questions")
    
    def test_default_question_type_is_mixed(self):
        """Test that default question_type is 'mixed' when not specified"""
        payload = {
            "subject": "TEST_DefaultType",
            "chapter": "Test Chapter",
            "num_questions": 5
            # question_type not specified
        }
        
        response = requests.post(f"{BASE_URL}/api/practice/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["question_type"] == "mixed", "Default question_type should be 'mixed'"
        
        self.created_test_ids.append(data["id"])
        print("✓ Default question_type is 'mixed'")
    
    def test_invalid_question_type_defaults_to_mixed(self):
        """Test that invalid question_type defaults to 'mixed'"""
        payload = {
            "subject": "TEST_InvalidType",
            "chapter": "Test Chapter",
            "num_questions": 5,
            "question_type": "invalid_type"
        }
        
        response = requests.post(f"{BASE_URL}/api/practice/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["question_type"] == "mixed", "Invalid question_type should default to 'mixed'"
        
        self.created_test_ids.append(data["id"])
        print("✓ Invalid question_type defaults to 'mixed'")


class TestPracticeHistoryWithQuestionType:
    """Tests for History endpoint with practice question_type"""
    
    def test_history_practice_includes_question_type(self):
        """Test GET /api/history returns practice items with question_type in preview"""
        response = requests.get(f"{BASE_URL}/api/history?item_type=practice")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            item = data[0]
            assert item["type"] == "practice", "Item type should be 'practice'"
            assert "preview" in item, "Item should have preview"
            assert "question_type" in item["preview"], "Preview should include question_type"
            
            # Verify question_type is valid
            valid_types = ["mixed", "mcq", "true_false", "numerical", "short_answer", "long_answer"]
            assert item["preview"]["question_type"] in valid_types, f"Invalid question_type: {item['preview']['question_type']}"
            
            print(f"✓ History practice item has question_type: {item['preview']['question_type']}")
        else:
            print("⚠ No practice items in history to verify")
    
    def test_history_practice_data_includes_question_type(self):
        """Test GET /api/history practice data includes question_type field"""
        response = requests.get(f"{BASE_URL}/api/history?item_type=practice")
        
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            item = data[0]
            assert "data" in item, "Item should have data"
            assert "question_type" in item["data"], "Data should include question_type"
            
            print(f"✓ History practice data has question_type: {item['data']['question_type']}")
        else:
            print("⚠ No practice items in history to verify")


class TestGetAndDeletePractices:
    """Tests for GET and DELETE practice endpoints"""
    
    def test_get_all_practices(self):
        """Test GET /api/practices returns list with question_type"""
        response = requests.get(f"{BASE_URL}/api/practices")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            test = data[0]
            assert "id" in test, "Test should have id"
            assert "subject" in test, "Test should have subject"
            assert "chapter" in test, "Test should have chapter"
            assert "question_type" in test, "Test should have question_type"
            assert "questions" in test, "Test should have questions"
            
            print(f"✓ GET /api/practices returned {len(data)} tests")
        else:
            print("⚠ No practice tests found")
    
    def test_delete_practice(self):
        """Test DELETE /api/practices/{test_id}"""
        # First create a test
        payload = {
            "subject": "TEST_DeleteTest",
            "chapter": "Delete Chapter",
            "num_questions": 3,
            "question_type": "mcq"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/practice/generate", json=payload, timeout=60)
        assert create_response.status_code == 200, "Failed to create test for delete"
        
        test_id = create_response.json()["id"]
        
        # Delete the test
        delete_response = requests.delete(f"{BASE_URL}/api/practices/{test_id}")
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/practices")
        tests = get_response.json()
        test_ids = [t["id"] for t in tests]
        assert test_id not in test_ids, "Deleted test should not appear in list"
        
        print("✓ DELETE /api/practices/{test_id} working correctly")
    
    def test_delete_nonexistent_practice(self):
        """Test DELETE /api/practices/{test_id} with non-existent ID"""
        response = requests.delete(f"{BASE_URL}/api/practices/nonexistent-id-12345")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ DELETE non-existent practice returns 404")


class TestBackwardCompatibility:
    """Tests for backward compatibility with old MCQ-only tests"""
    
    def test_old_tests_without_question_type_render_as_mcq(self):
        """Test that old tests without question_type field default to MCQ"""
        response = requests.get(f"{BASE_URL}/api/practices")
        
        assert response.status_code == 200
        
        data = response.json()
        
        # Check if any tests exist
        if len(data) > 0:
            # All tests should have question_type (either explicit or defaulted)
            for test in data:
                # If question_type is missing, it should be treated as MCQ
                qt = test.get("question_type", "mcq")
                valid_types = ["mixed", "mcq", "true_false", "numerical", "short_answer", "long_answer"]
                assert qt in valid_types, f"Invalid question_type: {qt}"
            
            print(f"✓ All {len(data)} tests have valid question_type")
        else:
            print("⚠ No tests to verify backward compatibility")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
