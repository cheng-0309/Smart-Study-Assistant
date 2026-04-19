"""
Test suite for new features (iteration 9):
- PUT /api/notes/:id - Edit notes (subject, chapter, tags)
- POST /api/notes/:id/share - Share via link
- GET /api/shared/:shareId - Get shared note
- POST /api/notes/:id/flashcards - Generate flashcards
- GET /api/tags - Get all unique tags
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestNoteUpdate:
    """PUT /api/notes/:id - Edit existing notes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get first note for testing"""
        response = requests.get(f"{BASE_URL}/api/notes")
        assert response.status_code == 200
        notes = response.json()
        assert len(notes) > 0, "Need at least one note for testing"
        self.note = notes[0]
        self.note_id = self.note['id']
    
    def test_update_subject_field(self):
        """PUT /api/notes/:id updates subject field and returns updated note"""
        new_subject = "TEST_updated_subject"
        response = requests.put(
            f"{BASE_URL}/api/notes/{self.note_id}",
            json={"subject": new_subject}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["subject"] == new_subject, f"Subject not updated: {data.get('subject')}"
        assert data["id"] == self.note_id, "Note ID should remain same"
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/notes/{self.note_id}")
        assert get_response.status_code == 200
        assert get_response.json()["subject"] == new_subject
        
        # Restore original subject
        requests.put(f"{BASE_URL}/api/notes/{self.note_id}", json={"subject": self.note["subject"]})
    
    def test_update_chapter_field(self):
        """PUT /api/notes/:id updates chapter field"""
        new_chapter = "TEST_updated_chapter"
        response = requests.put(
            f"{BASE_URL}/api/notes/{self.note_id}",
            json={"chapter": new_chapter}
        )
        assert response.status_code == 200
        assert response.json()["chapter"] == new_chapter
        
        # Restore original
        requests.put(f"{BASE_URL}/api/notes/{self.note_id}", json={"chapter": self.note["chapter"]})
    
    def test_update_tags_array(self):
        """PUT /api/notes/:id updates tags array"""
        new_tags = ["test-tag-1", "test-tag-2", "test-tag-3"]
        response = requests.put(
            f"{BASE_URL}/api/notes/{self.note_id}",
            json={"tags": new_tags}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["tags"] == new_tags, f"Tags not updated: {data.get('tags')}"
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/notes/{self.note_id}")
        assert get_response.json()["tags"] == new_tags
        
        # Restore original tags
        original_tags = self.note.get("tags", [])
        requests.put(f"{BASE_URL}/api/notes/{self.note_id}", json={"tags": original_tags})
    
    def test_update_empty_body_returns_400(self):
        """PUT /api/notes/:id with empty body returns 400"""
        response = requests.put(
            f"{BASE_URL}/api/notes/{self.note_id}",
            json={}
        )
        assert response.status_code == 400, f"Expected 400 for empty body, got {response.status_code}"
    
    def test_update_nonexistent_note_returns_404(self):
        """PUT /api/notes/:id with invalid ID returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/notes/nonexistent-id-12345",
            json={"subject": "test"}
        )
        assert response.status_code == 404


class TestShareNote:
    """POST /api/notes/:id/share - Share via link"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get first note for testing"""
        response = requests.get(f"{BASE_URL}/api/notes")
        assert response.status_code == 200
        notes = response.json()
        assert len(notes) > 0
        self.note = notes[0]
        self.note_id = self.note['id']
    
    def test_share_returns_share_id(self):
        """POST /api/notes/:id/share returns share_id string"""
        response = requests.post(f"{BASE_URL}/api/notes/{self.note_id}/share")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "share_id" in data, f"Response missing share_id: {data}"
        assert isinstance(data["share_id"], str), "share_id should be string"
        assert len(data["share_id"]) == 8, f"share_id should be 8 chars, got {len(data['share_id'])}"
    
    def test_share_is_idempotent(self):
        """POST /api/notes/:id/share returns same share_id on second call"""
        # First call
        response1 = requests.post(f"{BASE_URL}/api/notes/{self.note_id}/share")
        assert response1.status_code == 200
        share_id_1 = response1.json()["share_id"]
        
        # Second call
        response2 = requests.post(f"{BASE_URL}/api/notes/{self.note_id}/share")
        assert response2.status_code == 200
        share_id_2 = response2.json()["share_id"]
        
        assert share_id_1 == share_id_2, f"Share IDs should be same: {share_id_1} vs {share_id_2}"
    
    def test_share_nonexistent_note_returns_404(self):
        """POST /api/notes/:id/share with invalid ID returns 404"""
        response = requests.post(f"{BASE_URL}/api/notes/nonexistent-id-12345/share")
        assert response.status_code == 404


class TestGetSharedNote:
    """GET /api/shared/:shareId - Get shared note"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get first note and ensure it has a share_id"""
        response = requests.get(f"{BASE_URL}/api/notes")
        assert response.status_code == 200
        notes = response.json()
        assert len(notes) > 0
        self.note = notes[0]
        self.note_id = self.note['id']
        
        # Ensure note has share_id
        share_response = requests.post(f"{BASE_URL}/api/notes/{self.note_id}/share")
        assert share_response.status_code == 200
        self.share_id = share_response.json()["share_id"]
    
    def test_get_shared_note_returns_note(self):
        """GET /api/shared/:shareId returns the shared note"""
        response = requests.get(f"{BASE_URL}/api/shared/{self.share_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["id"] == self.note_id, "Should return correct note"
        assert data["share_id"] == self.share_id, "share_id should match"
        assert "subject" in data, "Note should have subject"
        assert "chapter" in data, "Note should have chapter"
        assert "content" in data, "Note should have content"
    
    def test_get_shared_invalid_id_returns_404(self):
        """GET /api/shared/invalid-id returns 404"""
        response = requests.get(f"{BASE_URL}/api/shared/invalid-id")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestFlashcards:
    """POST /api/notes/:id/flashcards - Generate flashcards"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get first note for testing"""
        response = requests.get(f"{BASE_URL}/api/notes")
        assert response.status_code == 200
        notes = response.json()
        assert len(notes) > 0
        self.note = notes[0]
        self.note_id = self.note['id']
    
    def test_flashcards_returns_cards_array(self):
        """POST /api/notes/:id/flashcards returns cards array with front/back fields"""
        response = requests.post(f"{BASE_URL}/api/notes/{self.note_id}/flashcards")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "cards" in data, f"Response missing cards: {data}"
        assert isinstance(data["cards"], list), "cards should be array"
        assert len(data["cards"]) > 0, "Should have at least one flashcard"
        
        # Check first card structure
        card = data["cards"][0]
        assert "front" in card, f"Card missing front: {card}"
        assert "back" in card, f"Card missing back: {card}"
        assert isinstance(card["front"], str), "front should be string"
        assert isinstance(card["back"], str), "back should be string"
    
    def test_flashcards_includes_note_metadata(self):
        """POST /api/notes/:id/flashcards includes note_id, subject, chapter"""
        response = requests.post(f"{BASE_URL}/api/notes/{self.note_id}/flashcards")
        assert response.status_code == 200
        
        data = response.json()
        assert data["note_id"] == self.note_id
        assert "subject" in data
        assert "chapter" in data
    
    def test_flashcards_nonexistent_note_returns_404(self):
        """POST /api/notes/:id/flashcards with invalid ID returns 404"""
        response = requests.post(f"{BASE_URL}/api/notes/nonexistent-id-12345/flashcards")
        assert response.status_code == 404


class TestGetTags:
    """GET /api/tags - Get all unique tags"""
    
    def test_get_tags_returns_array(self):
        """GET /api/tags returns array of unique tags"""
        response = requests.get(f"{BASE_URL}/api/tags")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), f"Response should be array: {data}"
    
    def test_get_tags_returns_sorted_unique_tags(self):
        """GET /api/tags returns sorted unique tags from notes"""
        # First ensure a note has tags
        notes_response = requests.get(f"{BASE_URL}/api/notes")
        notes = notes_response.json()
        
        # Find note with tags or add tags to first note
        note_with_tags = None
        for note in notes:
            if note.get("tags") and len(note["tags"]) > 0:
                note_with_tags = note
                break
        
        if not note_with_tags and len(notes) > 0:
            # Add tags to first note
            requests.put(f"{BASE_URL}/api/notes/{notes[0]['id']}", json={"tags": ["test-tag", "science"]})
        
        # Now get tags
        response = requests.get(f"{BASE_URL}/api/tags")
        assert response.status_code == 200
        
        tags = response.json()
        # Tags should be sorted
        assert tags == sorted(tags), "Tags should be sorted alphabetically"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
