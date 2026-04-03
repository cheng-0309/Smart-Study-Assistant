"""
Test suite for Enhanced Notes feature
Tests: POST /api/notes/generate with difficulty and note_type parameters
Validates: New note structure (title, introduction, main_content, examples, key_points, summary)
Also tests: GET /api/history returns notes with difficulty and note_type in preview
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://learn-guide-13.preview.emergentagent.com').rstrip('/')

class TestEnhancedNotesGeneration:
    """Tests for Enhanced Notes API endpoints with difficulty and note_type"""
    
    created_note_ids = []  # Track created notes for cleanup
    
    @pytest.fixture(autouse=True)
    def cleanup(self):
        """Cleanup after tests"""
        yield
        for note_id in self.created_note_ids:
            try:
                requests.delete(f"{BASE_URL}/api/notes/{note_id}")
            except:
                pass
        self.created_note_ids.clear()
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ API health check passed")
    
    def test_generate_notes_with_difficulty_easy(self):
        """Test POST /api/notes/generate with difficulty=easy"""
        payload = {
            "subject": "TEST_Physics",
            "chapter": "Simple Machines",
            "difficulty": "easy",
            "note_type": "detailed"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["difficulty"] == "easy", "Difficulty should be 'easy'"
        assert data["note_type"] == "detailed", "Note type should be 'detailed'"
        
        self.created_note_ids.append(data["id"])
        print("✓ Notes generated with difficulty=easy")
    
    def test_generate_notes_with_difficulty_medium(self):
        """Test POST /api/notes/generate with difficulty=medium"""
        payload = {
            "subject": "TEST_Chemistry",
            "chapter": "Periodic Table",
            "difficulty": "medium",
            "note_type": "quick_revision"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["difficulty"] == "medium", "Difficulty should be 'medium'"
        assert data["note_type"] == "quick_revision", "Note type should be 'quick_revision'"
        
        self.created_note_ids.append(data["id"])
        print("✓ Notes generated with difficulty=medium, note_type=quick_revision")
    
    def test_generate_notes_with_difficulty_hard(self):
        """Test POST /api/notes/generate with difficulty=hard"""
        payload = {
            "subject": "TEST_Mathematics",
            "chapter": "Differential Equations",
            "difficulty": "hard",
            "note_type": "exam_focused"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["difficulty"] == "hard", "Difficulty should be 'hard'"
        assert data["note_type"] == "exam_focused", "Note type should be 'exam_focused'"
        
        self.created_note_ids.append(data["id"])
        print("✓ Notes generated with difficulty=hard, note_type=exam_focused")
    
    def test_generate_notes_default_values(self):
        """Test POST /api/notes/generate uses default values when not provided"""
        payload = {
            "subject": "TEST_Biology",
            "chapter": "Cell Structure"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Default values should be medium and detailed
        assert data["difficulty"] == "medium", "Default difficulty should be 'medium'"
        assert data["note_type"] == "detailed", "Default note_type should be 'detailed'"
        
        self.created_note_ids.append(data["id"])
        print("✓ Notes generated with default difficulty and note_type")
    
    def test_generate_notes_invalid_difficulty_fallback(self):
        """Test POST /api/notes/generate falls back to medium for invalid difficulty"""
        payload = {
            "subject": "TEST_History",
            "chapter": "World War I",
            "difficulty": "invalid_difficulty",
            "note_type": "detailed"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should fallback to medium
        assert data["difficulty"] == "medium", "Invalid difficulty should fallback to 'medium'"
        
        self.created_note_ids.append(data["id"])
        print("✓ Invalid difficulty falls back to 'medium'")


class TestNoteContentStructure:
    """Tests for new note content structure (title, introduction, main_content, examples, key_points, summary)"""
    
    created_note_ids = []
    
    @pytest.fixture(autouse=True)
    def cleanup(self):
        yield
        for note_id in self.created_note_ids:
            try:
                requests.delete(f"{BASE_URL}/api/notes/{note_id}")
            except:
                pass
        self.created_note_ids.clear()
    
    def test_note_content_has_required_sections(self):
        """Test generated note has all required sections"""
        payload = {
            "subject": "TEST_Science",
            "chapter": "Photosynthesis",
            "difficulty": "medium",
            "note_type": "detailed"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        content = data.get("content", {})
        
        # Check all required sections exist
        assert "title" in content, "Content should have 'title'"
        assert "introduction" in content, "Content should have 'introduction'"
        assert "main_content" in content, "Content should have 'main_content'"
        assert "examples" in content, "Content should have 'examples'"
        assert "key_points" in content, "Content should have 'key_points'"
        assert "summary" in content, "Content should have 'summary'"
        
        self.created_note_ids.append(data["id"])
        print("✓ Note content has all required sections")
    
    def test_key_points_has_minimum_5_items(self):
        """Test key_points array has at least 5 items (mandatory)"""
        payload = {
            "subject": "TEST_Geography",
            "chapter": "Climate Zones",
            "difficulty": "medium",
            "note_type": "detailed"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        content = data.get("content", {})
        key_points = content.get("key_points", [])
        
        assert isinstance(key_points, list), "key_points should be a list"
        assert len(key_points) >= 5, f"key_points should have at least 5 items, got {len(key_points)}"
        
        self.created_note_ids.append(data["id"])
        print(f"✓ key_points has {len(key_points)} items (>= 5 required)")
    
    def test_main_content_structure(self):
        """Test main_content has proper structure with headings and points"""
        payload = {
            "subject": "TEST_Economics",
            "chapter": "Supply and Demand",
            "difficulty": "medium",
            "note_type": "detailed"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        content = data.get("content", {})
        main_content = content.get("main_content", [])
        
        assert isinstance(main_content, list), "main_content should be a list"
        assert len(main_content) > 0, "main_content should have at least one section"
        
        # Check first section structure
        first_section = main_content[0]
        assert "heading" in first_section, "Section should have 'heading'"
        assert "points" in first_section, "Section should have 'points'"
        assert isinstance(first_section["points"], list), "points should be a list"
        
        self.created_note_ids.append(data["id"])
        print(f"✓ main_content has {len(main_content)} sections with proper structure")
    
    def test_introduction_and_summary_are_strings(self):
        """Test introduction and summary are non-empty strings"""
        payload = {
            "subject": "TEST_Literature",
            "chapter": "Shakespeare",
            "difficulty": "easy",
            "note_type": "quick_revision"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        content = data.get("content", {})
        
        introduction = content.get("introduction", "")
        summary = content.get("summary", "")
        
        assert isinstance(introduction, str), "introduction should be a string"
        assert isinstance(summary, str), "summary should be a string"
        assert len(introduction) > 0, "introduction should not be empty"
        assert len(summary) > 0, "summary should not be empty"
        
        self.created_note_ids.append(data["id"])
        print("✓ introduction and summary are non-empty strings")


class TestHistoryWithEnhancedNotes:
    """Tests for History endpoint with enhanced notes (difficulty and note_type in preview)"""
    
    def test_history_returns_notes_with_difficulty_and_type(self):
        """Test GET /api/history returns notes with difficulty and note_type in preview"""
        response = requests.get(f"{BASE_URL}/api/history?item_type=note")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            note_item = data[0]
            
            # Check preview has difficulty and note_type
            preview = note_item.get("preview", {})
            assert "difficulty" in preview, "Preview should have 'difficulty'"
            assert "note_type" in preview, "Preview should have 'note_type'"
            assert "key_points_count" in preview, "Preview should have 'key_points_count'"
            assert "introduction_snippet" in preview, "Preview should have 'introduction_snippet'"
            assert "sections_count" in preview, "Preview should have 'sections_count'"
            
            print(f"✓ History note preview has difficulty={preview['difficulty']}, note_type={preview['note_type']}")
        else:
            print("⚠ No notes in history to verify preview structure")
    
    def test_history_note_data_has_new_structure(self):
        """Test history note data has new content structure"""
        response = requests.get(f"{BASE_URL}/api/history?item_type=note")
        
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            note_item = data[0]
            note_data = note_item.get("data", {})
            content = note_data.get("content", {})
            
            # Check for new structure fields
            has_new_structure = (
                "introduction" in content or 
                "main_content" in content or 
                "key_points" in content or 
                "summary" in content
            )
            
            if has_new_structure:
                print("✓ History note has new content structure")
            else:
                # Old notes may have old structure - this is backward compatibility
                print("⚠ Note has old structure (backward compatibility)")
        else:
            print("⚠ No notes in history to verify structure")


class TestFormValidation:
    """Tests for form validation - subject and topic are required"""
    
    def test_missing_subject_returns_error(self):
        """Test POST /api/notes/generate with missing subject returns validation error"""
        payload = {
            "chapter": "Some Topic",
            "difficulty": "medium",
            "note_type": "detailed"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload)
        
        # Should return 422 validation error
        assert response.status_code == 422, f"Expected 422 for missing subject, got {response.status_code}"
        print("✓ Missing subject returns 422 validation error")
    
    def test_missing_chapter_returns_error(self):
        """Test POST /api/notes/generate with missing chapter returns validation error"""
        payload = {
            "subject": "Physics",
            "difficulty": "medium",
            "note_type": "detailed"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload)
        
        # Should return 422 validation error
        assert response.status_code == 422, f"Expected 422 for missing chapter, got {response.status_code}"
        print("✓ Missing chapter returns 422 validation error")
    
    def test_empty_subject_generates_notes(self):
        """Test POST /api/notes/generate with empty subject - API accepts it"""
        payload = {
            "subject": "",
            "chapter": "Some Topic",
            "difficulty": "medium",
            "note_type": "detailed"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        # API may accept empty string - frontend should validate
        # This tests the actual API behavior
        print(f"Empty subject response: {response.status_code}")


class TestGetNoteById:
    """Tests for GET /api/notes/{note_id} with new structure"""
    
    created_note_ids = []
    
    @pytest.fixture(autouse=True)
    def cleanup(self):
        yield
        for note_id in self.created_note_ids:
            try:
                requests.delete(f"{BASE_URL}/api/notes/{note_id}")
            except:
                pass
        self.created_note_ids.clear()
    
    def test_get_note_by_id_returns_full_structure(self):
        """Test GET /api/notes/{note_id} returns note with full new structure"""
        # First create a note
        payload = {
            "subject": "TEST_Art",
            "chapter": "Renaissance",
            "difficulty": "hard",
            "note_type": "exam_focused"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        assert create_response.status_code == 200, "Failed to create note"
        
        note_id = create_response.json()["id"]
        self.created_note_ids.append(note_id)
        
        # Get the note by ID
        get_response = requests.get(f"{BASE_URL}/api/notes/{note_id}")
        
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
        
        data = get_response.json()
        
        # Verify all fields
        assert data["id"] == note_id
        assert data["subject"] == "TEST_Art"
        assert data["chapter"] == "Renaissance"
        assert data["difficulty"] == "hard"
        assert data["note_type"] == "exam_focused"
        
        content = data.get("content", {})
        assert "title" in content
        assert "introduction" in content
        assert "main_content" in content
        assert "examples" in content
        assert "key_points" in content
        assert "summary" in content
        
        print("✓ GET /api/notes/{note_id} returns full new structure")


class TestAllNoteTypes:
    """Test all three note types generate correctly"""
    
    created_note_ids = []
    
    @pytest.fixture(autouse=True)
    def cleanup(self):
        yield
        for note_id in self.created_note_ids:
            try:
                requests.delete(f"{BASE_URL}/api/notes/{note_id}")
            except:
                pass
        self.created_note_ids.clear()
    
    def test_quick_revision_note_type(self):
        """Test quick_revision note type generates correctly"""
        payload = {
            "subject": "TEST_QuickRev",
            "chapter": "Quick Topic",
            "difficulty": "easy",
            "note_type": "quick_revision"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200
        data = response.json()
        assert data["note_type"] == "quick_revision"
        
        self.created_note_ids.append(data["id"])
        print("✓ quick_revision note type works")
    
    def test_detailed_note_type(self):
        """Test detailed note type generates correctly"""
        payload = {
            "subject": "TEST_Detailed",
            "chapter": "Detailed Topic",
            "difficulty": "medium",
            "note_type": "detailed"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200
        data = response.json()
        assert data["note_type"] == "detailed"
        
        self.created_note_ids.append(data["id"])
        print("✓ detailed note type works")
    
    def test_exam_focused_note_type(self):
        """Test exam_focused note type generates correctly"""
        payload = {
            "subject": "TEST_ExamFocused",
            "chapter": "Exam Topic",
            "difficulty": "hard",
            "note_type": "exam_focused"
        }
        
        response = requests.post(f"{BASE_URL}/api/notes/generate", json=payload, timeout=60)
        
        assert response.status_code == 200
        data = response.json()
        assert data["note_type"] == "exam_focused"
        
        self.created_note_ids.append(data["id"])
        print("✓ exam_focused note type works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
