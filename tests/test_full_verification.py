#!/usr/bin/env python3
"""
Complete Verification Test Suite for JurisAI
Tests: NVIDIA API, Research Pipeline, Case Backend, and Twilio Integration
"""

import os
import sys
import json
import asyncio
import requests
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)-25s | %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("VerificationSuite")

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from config import (
    NVIDIA_API_KEY,
    NVIDIA_BASE_URL,
    NVIDIA_DOCUMENT_MODEL,
    SUPABASE_URL,
    SUPABASE_KEY,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
    TWILIO_SMS_NUMBER,
    JWT_SECRET,
    OLLAMA_URL,
    OLLAMA_MODEL,
)


# ============================================================================
# 1. NVIDIA API VERIFICATION
# ============================================================================

class NvidiaAPITester:
    """Test NVIDIA API connectivity and paper analysis capabilities."""

    def __init__(self):
        self.base_url = NVIDIA_BASE_URL
        self.api_key = NVIDIA_API_KEY
        self.model = NVIDIA_DOCUMENT_MODEL

    async def test_connectivity(self) -> Dict[str, Any]:
        """Test basic NVIDIA API connectivity."""
        logger.info("=" * 80)
        logger.info("TEST 1: NVIDIA API Connectivity")
        logger.info("=" * 80)

        if not self.api_key:
            logger.error("❌ NVIDIA_API_KEY not configured")
            return {"success": False, "error": "API Key missing"}

        if not self.base_url:
            logger.error("❌ NVIDIA_BASE_URL not configured")
            return {"success": False, "error": "Base URL missing"}

        logger.info(f"✓ API Key: {self.api_key[:20]}...")
        logger.info(f"✓ Base URL: {self.base_url}")
        logger.info(f"✓ Model: {self.model}")

        try:
            response = await asyncio.to_thread(
                requests.post,
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {
                            "role": "user",
                            "content": "Say 'NVIDIA API is working' in exactly these words.",
                        }
                    ],
                    "max_tokens": 50,
                    "temperature": 0.0,
                },
                timeout=30,
            )

            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                logger.info(f"✓ NVIDIA API Response: {content}")
                return {"success": True, "response": content}
            else:
                logger.error(f"❌ NVIDIA API returned {response.status_code}")
                logger.error(f"Response: {response.text}")
                return {"success": False, "error": f"Status {response.status_code}"}

        except Exception as e:
            logger.error(f"❌ NVIDIA API Error: {e}")
            return {"success": False, "error": str(e)}

    async def test_paper_analysis(self) -> Dict[str, Any]:
        """Test NVIDIA API for legal paper analysis."""
        logger.info("\nTEST 2: NVIDIA Paper Analysis (Neural Audit)")
        logger.info("-" * 80)

        sample_contract = """
        AGREEMENT FOR SALE OF IMMOVABLE PROPERTY
        
        This Agreement made this _____ day of ____________, 20_____.
        
        BETWEEN:
        SELLER: Rajesh Kumar, Age 45, Resident of 123 MG Road, Mumbai
        (Hereinafter called the "SELLER" which expression shall include his heirs, executors, administrators, legal representatives, successors and assigns)
        
        AND
        
        BUYER: Priya Sharma, Age 38, Resident of 456 Park Street, Mumbai
        (Hereinafter called the "BUYER" which expression shall include her heirs, executors, administrators, legal representatives, successors and assigns)
        
        WHEREAS the Seller is the owner of the property described below and the Buyer wishes to purchase the same:
        
        WHEREAS the parties wish to enter into an agreement for the sale and purchase of the said property:
        
        NOW THEREFORE in consideration of the mutual covenants and agreements herein contained and for other valuable considerations, the receipt and sufficiency of which are hereby acknowledged, the parties hereto agree as follows:
        
        1. PROPERTY DETAILS: Plot No. 789, Sector 5, Thane, Maharashtra, measuring 2000 sq.ft., admeasuring within the following boundaries: North: Municipal Road, South: Property of Mr. Deshmukh, East: Common Park, West: Property of Mr. Menon.
        
        2. PRICE: The total consideration for the sale is Rs. 50,00,000/- (Fifty Lakhs) only, payable as follows:
        - Rs. 10,00,000/- on signing of this Agreement
        - Rs. 40,00,000/- on execution of Sale Deed
        
        3. POSSESSION: The Seller shall hand over possession of the property on completion of payment and execution of Sale Deed.
        """

        prompt = f"""You are a Senior Legal Auditor. Analyze this legal document and provide:
1. Document Type & Purpose
2. Key Obligations (Seller/Buyer)
3. Financial Terms
4. Risk Assessment
5. Missing Clauses

DOCUMENT:
{sample_contract}

Respond as JSON with keys: document_type, obligations, financial_terms, risks, missing_elements"""

        try:
            response = await asyncio.to_thread(
                requests.post,
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1500,
                    "temperature": 0.3,
                },
                timeout=45,
            )

            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                logger.info("✓ Paper Analysis Response (first 300 chars):")
                logger.info(content[:300] + "...")
                return {"success": True, "analysis": content}
            else:
                logger.error(f"❌ Paper Analysis failed: {response.status_code}")
                return {"success": False, "error": f"Status {response.status_code}"}

        except Exception as e:
            logger.error(f"❌ Paper Analysis Error: {e}")
            return {"success": False, "error": str(e)}


# ============================================================================
# 2. RESEARCH PIPELINE VERIFICATION
# ============================================================================

class ResearchPipelineTester:
    """Test research pipeline with AI API integration."""

    async def test_research_pipeline(self) -> Dict[str, Any]:
        """Test the research pipeline endpoint."""
        logger.info("\n" + "=" * 80)
        logger.info("TEST 3: Research Pipeline with AI API")
        logger.info("=" * 80)

        query = "What are the key provisions of Section 302 IPC related to murder?"

        try:
            response = await asyncio.to_thread(
                requests.post,
                "http://localhost:8000/api/legal-search",
                json={"query": query},
                headers={"Authorization": "Bearer test-token"},
                timeout=60,
            )

            if response.status_code == 200:
                result = response.json()
                logger.info(f"✓ Research Query: {query}")
                logger.info(f"✓ Response Mode: {result.get('mode', 'unknown')}")
                logger.info(f"✓ Results Count: {result.get('total', 0)}")
                logger.info(
                    f"✓ AI Answer (first 200 chars): {result.get('answer', '')[:200]}..."
                )
                return {"success": True, "result": result}
            else:
                logger.error(f"❌ Research Pipeline failed: {response.status_code}")
                logger.error(f"Response: {response.text[:500]}")
                return {"success": False, "error": f"Status {response.status_code}"}

        except requests.exceptions.ConnectionError:
            logger.error("❌ Cannot connect to backend (http://localhost:8000)")
            logger.info("   Make sure the backend is running: python -m uvicorn main:app --reload")
            return {"success": False, "error": "Backend not running"}
        except Exception as e:
            logger.error(f"❌ Research Pipeline Error: {e}")
            return {"success": False, "error": str(e)}


# ============================================================================
# 3. CASE PAGE BACKEND VERIFICATION
# ============================================================================

class CaseBackendTester:
    """Test case page backend connection."""

    async def test_case_creation_endpoint(self, token: str) -> Dict[str, Any]:
        """Test case creation endpoint."""
        logger.info("\nTEST 4: Case Creation Endpoint")
        logger.info("-" * 80)

        case_data = {
            "title": "Test Case - Section 302 IPC",
            "description": "Test case for verification",
            "lawyer_email": "admin@jurisai.local",
            "lawyer_name": "Test Lawyer",
            "client_name": "Test Client",
            "client_email": "client@test.com",
            "case_type": "Criminal",
            "court": "High Court of Mumbai",
            "case_no": "HC/2024/TEST-001",
            "deadline": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "priority": "high",
            "client_number": "9886448710",  # Your test number
        }

        try:
            response = await asyncio.to_thread(
                requests.post,
                "http://localhost:8000/api/lawyers/cases",
                json=case_data,
                headers={"Authorization": f"Bearer {token}"},
                timeout=30,
            )

            if response.status_code == 200:
                result = response.json()
                logger.info(f"✓ Case Created Successfully")
                logger.info(f"  Case ID: {result.get('id')}")
                logger.info(f"  Case No: {result.get('case_no')}")
                logger.info(f"  Client Phone: {result.get('client_number')}")
                return {"success": True, "case_id": result.get("id"), "case": result}
            else:
                logger.error(f"❌ Case creation failed: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return {
                    "success": False,
                    "error": f"Status {response.status_code}: {response.text}",
                }

        except requests.exceptions.ConnectionError:
            logger.error("❌ Cannot connect to backend")
            return {"success": False, "error": "Backend not running"}
        except Exception as e:
            logger.error(f"❌ Case Creation Error: {e}")
            return {"success": False, "error": str(e)}

    async def test_case_stats_endpoint(self, token: str) -> Dict[str, Any]:
        """Test case stats endpoint."""
        logger.info("\nTEST 5: Case Stats Endpoint")
        logger.info("-" * 80)

        try:
            response = await asyncio.to_thread(
                requests.get,
                "http://localhost:8000/api/cases/stats",
                headers={"Authorization": f"Bearer {token}"},
                timeout=30,
            )

            if response.status_code == 200:
                result = response.json()
                logger.info(f"✓ Case Stats Retrieved")
                logger.info(f"  Active Cases: {result.get('active')}")
                logger.info(f"  Overdue Cases: {result.get('overdue')}")
                logger.info(f"  Upcoming Hearings: {result.get('upcomingHearings')}")
                logger.info(f"  Total Cases: {result.get('total')}")
                return {"success": True, "stats": result}
            else:
                logger.error(f"❌ Case stats failed: {response.status_code}")
                return {"success": False, "error": f"Status {response.status_code}"}

        except Exception as e:
            logger.error(f"❌ Case Stats Error: {e}")
            return {"success": False, "error": str(e)}


# ============================================================================
# 4. TWILIO INTEGRATION VERIFICATION
# ============================================================================

class TwilioTester:
    """Test Twilio SMS and voice call integration."""

    def test_configuration(self) -> Dict[str, Any]:
        """Verify Twilio configuration."""
        logger.info("\nTEST 6: Twilio Configuration Check")
        logger.info("-" * 80)

        checks = {}
        if TWILIO_ACCOUNT_SID:
            logger.info(f"✓ Account SID: {TWILIO_ACCOUNT_SID[:10]}...")
            checks["account_sid"] = True
        else:
            logger.error("❌ TWILIO_ACCOUNT_SID not configured")
            checks["account_sid"] = False

        if TWILIO_AUTH_TOKEN:
            logger.info(f"✓ Auth Token: {TWILIO_AUTH_TOKEN[:10]}...")
            checks["auth_token"] = True
        else:
            logger.error("❌ TWILIO_AUTH_TOKEN not configured")
            checks["auth_token"] = False

        if TWILIO_PHONE_NUMBER:
            logger.info(f"✓ Phone Number: {TWILIO_PHONE_NUMBER}")
            checks["phone_number"] = True
        else:
            logger.error("❌ TWILIO_PHONE_NUMBER not configured")
            checks["phone_number"] = False

        if TWILIO_SMS_NUMBER:
            logger.info(f"✓ SMS Number: {TWILIO_SMS_NUMBER}")
            checks["sms_number"] = True
        else:
            logger.error("❌ TWILIO_SMS_NUMBER not configured")
            checks["sms_number"] = False

        return {
            "success": all(checks.values()),
            "checks": checks,
        }

    async def test_send_sms(self, phone_number: str = "9886448710") -> Dict[str, Any]:
        """Test sending SMS via Twilio."""
        logger.info("\nTEST 7: Twilio SMS Send Test")
        logger.info("-" * 80)

        try:
            from services.twilio_service import send_twilio_reminder

            event = {
                "title": "Test Case - Hearing Reminder",
                "court": "Mumbai High Court",
                "date": (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d"),
                "time": "10:00 AM",
                "client_name": "Test Client",
            }

            result = await asyncio.to_thread(
                send_twilio_reminder, event, phone_number, "sms"
            )

            if result.get("success"):
                logger.info(f"✓ SMS Sent Successfully")
                logger.info(f"  Phone: {phone_number}")
                logger.info(f"  SID: {result.get('sid')}")
                logger.info(f"  Message: {result.get('message')}")
                return result
            else:
                logger.error(f"❌ SMS Send Failed: {result.get('message')}")
                return result

        except ImportError:
            logger.error("❌ twilio package not installed")
            return {"success": False, "error": "twilio not installed"}
        except Exception as e:
            logger.error(f"❌ SMS Test Error: {e}")
            return {"success": False, "error": str(e)}

    async def test_send_call(self, phone_number: str = "9886448710") -> Dict[str, Any]:
        """Test sending voice call via Twilio."""
        logger.info("\nTEST 8: Twilio Voice Call Test")
        logger.info("-" * 80)

        try:
            from services.twilio_service import send_twilio_reminder

            event = {
                "title": "Test Case - Hearing Reminder",
                "court": "Mumbai High Court",
                "date": (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d"),
                "time": "10:00 AM",
                "client_name": "Test Client",
            }

            result = await asyncio.to_thread(
                send_twilio_reminder, event, phone_number, "call"
            )

            if result.get("success"):
                logger.info(f"✓ Voice Call Placed Successfully")
                logger.info(f"  Phone: {phone_number}")
                logger.info(f"  SID: {result.get('sid')}")
                logger.info(f"  Message: {result.get('message')}")
                return result
            else:
                logger.error(f"❌ Voice Call Failed: {result.get('message')}")
                return result

        except ImportError:
            logger.error("❌ twilio package not installed")
            return {"success": False, "error": "twilio not installed"}
        except Exception as e:
            logger.error(f"❌ Voice Call Error: {e}")
            return {"success": False, "error": str(e)}


# ============================================================================
# SUPABASE VERIFICATION
# ============================================================================

class SupabaseTester:
    """Test Supabase backend connection."""

    async def test_connection(self) -> Dict[str, Any]:
        """Test Supabase connection."""
        logger.info("\n" + "=" * 80)
        logger.info("TEST 9: Supabase Connection")
        logger.info("=" * 80)

        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.error("❌ Supabase credentials not configured")
            return {"success": False, "error": "Credentials missing"}

        logger.info(f"✓ Supabase URL: {SUPABASE_URL}")
        logger.info(f"✓ Supabase Key: {SUPABASE_KEY[:20]}...")

        try:
            from database.db import supabase

            # Try to fetch from a simple table
            result = supabase.table("lawyer_cases").select("count", count="exact").limit(1).execute()

            if result.data is not None:
                logger.info(f"✓ Supabase Connection Successful")
                return {"success": True, "message": "Connected to Supabase"}
            else:
                logger.error("❌ Supabase query returned no data")
                return {"success": False, "error": "No data returned"}

        except Exception as e:
            logger.error(f"❌ Supabase Connection Error: {e}")
            return {"success": False, "error": str(e)}


# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

async def run_all_tests():
    """Run all verification tests."""
    logger.info("\n" + "=" * 80)
    logger.info("JURISAI FULL PROJECT VERIFICATION")
    logger.info("=" * 80)
    logger.info(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    results = {}

    # Test 1: NVIDIA API
    nvidia_tester = NvidiaAPITester()
    results["nvidia_connectivity"] = await nvidia_tester.test_connectivity()
    results["nvidia_paper_analysis"] = await nvidia_tester.test_paper_analysis()

    # Test 2: Research Pipeline
    research_tester = ResearchPipelineTester()
    results["research_pipeline"] = await research_tester.test_research_pipeline()

    # Test 3-5: Case Backend
    case_tester = CaseBackendTester()
    token = "test-token"  # In production, get real token
    results["case_creation"] = await case_tester.test_case_creation_endpoint(token)
    results["case_stats"] = await case_tester.test_case_stats_endpoint(token)

    # Test 6-8: Twilio
    twilio_tester = TwilioTester()
    results["twilio_config"] = twilio_tester.test_configuration()
    results["twilio_sms"] = await twilio_tester.test_send_sms("9886448710")
    results["twilio_call"] = await twilio_tester.test_send_call("9886448710")

    # Test 9: Supabase
    supabase_tester = SupabaseTester()
    results["supabase"] = await supabase_tester.test_connection()

    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)

    passed = 0
    failed = 0

    for test_name, test_result in results.items():
        if test_result.get("success"):
            logger.info(f"✓ {test_name}: PASSED")
            passed += 1
        else:
            logger.info(f"✗ {test_name}: FAILED")
            logger.info(f"  Error: {test_result.get('error', 'Unknown error')}")
            failed += 1

    logger.info(f"\nTotal: {passed} Passed, {failed} Failed")
    logger.info(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Save results to file
    with open("verification_results.json", "w") as f:
        json.dump(results, f, indent=2)
    logger.info("\n✓ Detailed results saved to verification_results.json")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
