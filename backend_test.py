import requests
import sys
import json
from datetime import datetime

class StudyNotesAPITester:
    def __init__(self, base_url="https://learn-guide-13.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/api{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            self.test_results.append({
                "name": name,
                "success": success,
                "status_code": response.status_code,
                "expected_status": expected_status
            })

            return success, response.json() if success and response.text else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out after {timeout} seconds")
            self.test_results.append({
                "name": name,
                "success": False,
                "error": "Timeout"
            })
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "success": False,
                "error": str(e)
            })
            return False, {}

    def test_welcome_message(self):
        """Test GET /api/ returns welcome message"""
        success, response = self.run_test(
            "Welcome Message",
            "GET",
            "/",
            200
        )
        return success

    def test_generate_notes(self):
        """Test POST /api/notes/generate - AI note generation"""
        success, response = self.run_test(
            "Generate Notes (AI)",
            "POST",
            "/notes/generate",
            200,
            data={"subject": "Physics", "chapter": "Newton's Laws of Motion"},
            timeout=60  # AI generation can take longer
        )
        if success and 'id' in response:
            return response['id']
        return None

    def test_get_all_notes(self):
        """Test GET /api/notes returns list of notes"""
        success, response = self.run_test(
            "Get All Notes",
            "GET",
            "/notes",
            200
        )
        return success, response

    def test_get_single_note(self, note_id):
        """Test GET /api/notes/{id} returns single note"""
        success, response = self.run_test(
            "Get Single Note",
            "GET",
            f"/notes/{note_id}",
            200
        )
        return success

    def test_delete_note(self, note_id):
        """Test DELETE /api/notes/{id} deletes note"""
        success, response = self.run_test(
            "Delete Note",
            "DELETE",
            f"/notes/{note_id}",
            200
        )
        return success

    def test_get_nonexistent_note(self):
        """Test GET /api/notes/{invalid_id} returns 404"""
        success, response = self.run_test(
            "Get Nonexistent Note (404 test)",
            "GET",
            "/notes/invalid-id-12345",
            404
        )
        return success

    def test_delete_nonexistent_note(self):
        """Test DELETE /api/notes/{invalid_id} returns 404"""
        success, response = self.run_test(
            "Delete Nonexistent Note (404 test)",
            "DELETE",
            "/notes/invalid-id-12345",
            404
        )
        return success

def main():
    print("🚀 Starting Study Notes API Tests")
    print("=" * 50)
    
    tester = StudyNotesAPITester()
    
    # Test 1: Welcome message
    if not tester.test_welcome_message():
        print("❌ Welcome endpoint failed, but continuing tests...")

    # Test 2: Generate notes (AI integration)
    print("\n🤖 Testing AI Note Generation (may take 10-60 seconds)...")
    note_id = tester.test_generate_notes()
    if not note_id:
        print("❌ Note generation failed, stopping dependent tests")
        print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        return 1

    # Test 3: Get all notes
    success, notes_response = tester.test_get_all_notes()
    if not success:
        print("❌ Get all notes failed")

    # Test 4: Get single note
    if not tester.test_get_single_note(note_id):
        print("❌ Get single note failed")

    # Test 5: Error handling tests
    tester.test_get_nonexistent_note()
    tester.test_delete_nonexistent_note()

    # Test 6: Delete note (cleanup)
    if not tester.test_delete_note(note_id):
        print("❌ Delete note failed")

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check logs above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())