import os
import logging
import string
import random
import re
import json
from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt, JWTError
from database.db import supabase
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRY_HOURS

logger = logging.getLogger(__name__)

DEFAULT_ADMIN_EMAIL = "darwin@gmail.com"
DEFAULT_ADMIN_PASSWORD = "12345678"
DEFAULT_ADMIN_FIRM_ID = "JA-DARWIN"
DEFAULT_ADMIN_FIRM_NAME = "Darwin Legal"
DEMO_LAWYER_PASSWORD = "demo12345"
DEMO_TEAM_TARGET = 24
DEMO_CASE_TARGET = 36

DEMO_LAWYERS = [
    {"name": "Asha Kapoor", "role": "Senior Litigation Counsel", "profile_picture": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop", "bio": "Trial strategist focused on regulatory disputes, white-collar investigations, and appellate readiness for high-visibility matters."},
    {"name": "Nikhil Sharma", "role": "Corporate Partner", "profile_picture": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop", "bio": "Leads cross-border transactions, board governance reviews, and urgent deal-room negotiations for growth-stage and public companies."},
    {"name": "Priya Singh", "role": "Head of Regulatory", "profile_picture": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop", "bio": "Advises on financial regulation, licensing, and enforcement response with a focus on fast-moving operational risk."},
    {"name": "Arjun Mehta", "role": "Senior Defense Counsel", "profile_picture": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&auto=format&fit=crop", "bio": "Known for structured courtroom preparation, crisis response, and managing fact-heavy criminal and civil defense dockets."},
    {"name": "Meera Patel", "role": "Family Law Specialist", "profile_picture": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop", "bio": "Handles sensitive family, succession, and guardianship matters with a calm client-first approach and strong mediation outcomes."},
    {"name": "Vikram Rao", "role": "M&A Counsel", "profile_picture": "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=1200&auto=format&fit=crop", "bio": "Structures acquisitions, due diligence programs, and post-close integration governance for complex strategic transactions."},
    {"name": "Ananya Bose", "role": "Data Privacy Lead", "profile_picture": "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1200&auto=format&fit=crop", "bio": "Builds privacy response programs across AI, SaaS, and consumer products, including breach reviews and regulator engagement."},
    {"name": "Kabir Malik", "role": "International Trade Counsel", "profile_picture": "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop", "bio": "Supports sanctions, customs, and cross-border shipping disputes with a strong command of operational trade controls."},
    {"name": "Rekha Iyer", "role": "Compliance Partner", "profile_picture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop", "bio": "Designs internal investigations and compliance frameworks across healthcare, fintech, and regulated infrastructure sectors."},
    {"name": "Aditya Joshi", "role": "Financial Crimes Counsel", "profile_picture": "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=1200&auto=format&fit=crop", "bio": "Counsels institutions through AML reviews, fraud response, and regulator-facing remediation plans."},
    {"name": "Sarita Nair", "role": "Real Estate Partner", "profile_picture": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1200&auto=format&fit=crop", "bio": "Leads real estate acquisitions, leasing programs, and title-risk strategy for commercial and industrial portfolios."},
    {"name": "Dev Shah", "role": "Contracts Specialist", "profile_picture": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1200&auto=format&fit=crop", "bio": "Optimizes vendor, procurement, and enterprise sales contracting with sharp turnaround and clean issue-spotting."},
    {"name": "Isha Desai", "role": "Immigration Counsel", "profile_picture": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1200&auto=format&fit=crop", "bio": "Coordinates mobility strategies, work authorization, and executive relocation matters for global employer teams."},
    {"name": "Neel Gupta", "role": "Tech Transactions Counsel", "profile_picture": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop", "bio": "Negotiates licensing, cloud, data processing, and platform agreements with an emphasis on scalable risk allocation."},
    {"name": "Naina Kapoor", "role": "Antitrust Specialist", "profile_picture": "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1200&auto=format&fit=crop", "bio": "Advises on merger clearance, competition audits, and market conduct reviews across digital and industrial sectors."},
    {"name": "Karan Singh", "role": "Energy Law Counsel", "profile_picture": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1200&auto=format&fit=crop", "bio": "Works on energy transition projects, grid access disputes, and regulatory approvals for infrastructure developers."},
    {"name": "Anika Rao", "role": "Tax Litigation Lead", "profile_picture": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1200&auto=format&fit=crop", "bio": "Represents clients in revenue appeals, audit escalations, and structured settlement planning in contentious tax matters."},
    {"name": "Rhea Mehta", "role": "Environmental Counsel", "profile_picture": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1200&auto=format&fit=crop", "bio": "Focuses on ESG reporting, site investigations, and environmental liability strategy for manufacturing and energy clients."},
    {"name": "Sahil Patel", "role": "Healthcare Policy Counsel", "profile_picture": "https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=1200&auto=format&fit=crop", "bio": "Covers healthcare operations, policy submissions, and payer-provider disputes with strong regulatory drafting skills."},
    {"name": "Priyanka Roy", "role": "Brand Protection Counsel", "profile_picture": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=1200&auto=format&fit=crop", "bio": "Protects brands across enforcement, takedowns, marketplace abuse, and global portfolio monitoring."},
    {"name": "Aman Joshi", "role": "Cybersecurity Counsel", "profile_picture": "https://images.unsplash.com/photo-1542327897-d73f4005b533?q=80&w=1200&auto=format&fit=crop", "bio": "Supports breach response, incident readiness, and security contracting for cloud-first and critical-systems teams."},
    {"name": "Lucia Fernandez", "role": "Media & Entertainment Counsel", "profile_picture": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop", "bio": "Negotiates talent, content, and platform distribution agreements with a practical eye for rights management."},
    {"name": "Thomas Adeyemi", "role": "Infrastructure Partner", "profile_picture": "https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=1200&auto=format&fit=crop", "bio": "Handles project structuring, concession terms, and dispute escalation for transport and utility assets."},
    {"name": "Ayesha Rahman", "role": "Constitutional Law Associate", "profile_picture": "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop", "bio": "Supports public law, policy challenge, and rights-based litigation with strong research and written advocacy."},
]

CASE_TEMPLATES = [
    {"title": "Apex Fintech Data Breach Response", "description": "Coordinating regulator communications, privilege strategy, and breach response timelines after a cross-border exposure event.", "case_type": "Corporate", "court": "Mumbai Commercial Court", "priority": "critical", "stage": "Investigation"},
    {"title": "Helios Renewable Grid Access Petition", "description": "Advising on grid access approvals, regulatory hearings, and contractual remedies for delayed energy dispatch.", "case_type": "Civil", "court": "Delhi High Court", "priority": "high", "stage": "Hearing"},
    {"title": "Vertex AI Training Data Audit", "description": "Reviewing copyright risk, vendor chain provenance, and model release controls for a generative AI product launch.", "case_type": "IP", "court": "Bengaluru City Civil Court", "priority": "high", "stage": "Filed"},
    {"title": "North Harbor Logistics Competition Inquiry", "description": "Responding to antitrust information requests tied to pricing conduct and regional transport network exclusivity.", "case_type": "Corporate", "court": "Competition Commission", "priority": "medium", "stage": "Arguments"},
    {"title": "Sovereign Health Licensing Review", "description": "Preparing filings, policy representations, and operational remediation for a healthcare licensing audit.", "case_type": "Labour", "court": "State Regulatory Board", "priority": "medium", "stage": "Investigation"},
    {"title": "Nova Consumer Privacy Class Action", "description": "Building defense strategy around consent flows, notice architecture, and incident response documentation.", "case_type": "Civil", "court": "Bombay High Court", "priority": "critical", "stage": "Hearing"},
    {"title": "Atlas Realty Land Title Dispute", "description": "Resolving title chain inconsistencies, zoning objections, and interim relief for a multi-party development project.", "case_type": "Civil", "court": "Pune District Court", "priority": "medium", "stage": "Filed"},
    {"title": "Rivermark Acquisition Closing Counsel", "description": "Managing diligence, definitive agreements, and post-signing conditions for a strategic manufacturing acquisition.", "case_type": "Corporate", "court": "Private Transaction Desk", "priority": "high", "stage": "Judgment"},
]


def _generate_firm_id():
    """Generate a unique 8-char firm ID like JA-X7K2M9."""
    chars = string.ascii_uppercase + string.digits
    code = ''.join(random.choices(chars, k=6))
    return f"JA-{code}"


def _firm_domain(firm_id: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (firm_id or "legalai").lower()).strip("-")
    return f"{slug}.legalai.team"


def _email_from_name(name: str, firm_id: str) -> str:
    parts = [part for part in re.findall(r"[a-z0-9]+", name.lower()) if part]
    local = ".".join(parts[:2]) if parts else "lawyer"
    return f"{local}@{_firm_domain(firm_id)}"


def _build_seeded_case(template: dict, lawyer: dict, admin_id: str, firm_id: str, index: int, now_iso: str) -> dict:
    rng = random.Random(f"{firm_id}:{lawyer['email']}:{index}")
    deadline_dt = datetime.now(timezone.utc) + timedelta(days=rng.randint(4, 45))
    updated_dt = datetime.now(timezone.utc) - timedelta(days=rng.randint(0, 5))
    hearing_date = (datetime.now(timezone.utc) + timedelta(days=rng.randint(1, 14))).date().isoformat()
    client_id = f"C-{rng.randint(10000, 99999)}"
    activity_log = [
        {"id": 1, "action": "case_created", "actor": "Admin", "details": f"Case '{template['title']}' created and assigned to {lawyer['name']}", "timestamp": now_iso},
        {"id": 2, "action": "daily_update", "actor": lawyer["name"], "details": "Initial strategy memo and intake notes logged for the matter.", "timestamp": updated_dt.isoformat()},
    ]
    daily_updates = [
        {
            "id": 1,
            "date": updated_dt.isoformat(),
            "author": lawyer["name"],
            "author_email": lawyer["email"],
            "summary": "Reviewed incoming documents, aligned next hearing preparation, and updated matter risk notes.",
            "research_notes": "Prepared early issue list and evidence dependencies for internal review.",
            "hours_logged": round(rng.uniform(2.0, 6.0), 1),
        }
    ]
    hearings = []
    if template["stage"] in {"Hearing", "Arguments", "Investigation"}:
        hearings.append({
            "id": 1,
            "date": hearing_date,
            "time": f"{rng.randint(9, 11):02d}:{rng.choice(['00', '30'])}",
            "court": template["court"],
            "notes": "Client prep and evidence bundle to be reviewed 24 hours before appearance.",
            "hearing_type": rng.choice(["Status Review", "Arguments", "Evidence", "Mediation"]),
            "status": "upcoming",
            "created_by": "Admin",
            "created_at": now_iso,
        })
    notes_log = [
        {
            "id": 1,
            "content": "Client onboarding complete and matter checklist opened for active tracking.",
            "note_type": "internal",
            "author": lawyer["name"],
            "author_email": lawyer["email"],
            "created_at": now_iso,
        }
    ]
    return {
        "assigned_by_id": str(admin_id),
        "lawyer_email": lawyer["email"],
        "title": f"{template['title']} #{index + 101}",
        "description": template["description"],
        "case_no": f"{template['case_type'][:3].upper()}-2026-{index + 101:03d}",
        "deadline": deadline_dt.isoformat(),
        "priority": template["priority"],
        "status": template["stage"],
        "stage": template["stage"],
        "daily_updates": json.dumps(daily_updates),
        "hearings": json.dumps(hearings),
        "notes_log": json.dumps(notes_log),
        "activity_log": json.dumps(activity_log),
        "client_name": f"{rng.choice(['Aarav', 'Mira', 'Rohan', 'Diya', 'Kabir', 'Ira'])} {rng.choice(['Ventures', 'Healthcare', 'Mobility', 'Infra', 'Dynamics', 'Labs'])}",
        "client_email": f"client{index + 1}@{_firm_domain(firm_id)}",
        "client_number": client_id,
        "case_type": template["case_type"],
        "court": template["court"],
        "assigned_at": now_iso,
        "updated_at": updated_dt.isoformat(),
        "firm_id": firm_id,
    }


def init_auth_db():
    """Verify Supabase connection and seed the default admin, richer firm roster, and sample matters."""
    logger.info("Connecting to Supabase PostgreSQL...")

    try:
        now = datetime.now(timezone.utc).isoformat()
        res_admin = supabase.table("users").select("id, firm_id, firm_name").eq("email", DEFAULT_ADMIN_EMAIL).execute()
        admin = res_admin.data[0] if res_admin.data else None

        if not admin:
            admin_res = supabase.table("users").insert({
                "name": "Admin",
                "email": DEFAULT_ADMIN_EMAIL,
                "password_hash": hash_password(DEFAULT_ADMIN_PASSWORD),
                "role": "admin",
                "plan": "enterprise",
                "firm_id": DEFAULT_ADMIN_FIRM_ID,
                "firm_name": DEFAULT_ADMIN_FIRM_NAME,
                "profile_picture": "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=1200&auto=format&fit=crop",
                "bio": "Founding administrator for the LegalAI workspace.",
                "registered_at": now,
                "created_at": now
            }).execute()
            admin = admin_res.data[0] if admin_res.data else None
            logger.info(f"Seeded default admin: {DEFAULT_ADMIN_EMAIL} / {DEFAULT_ADMIN_PASSWORD} | Firm ID: {DEFAULT_ADMIN_FIRM_ID}")

        res_firms = supabase.table("users").select("id, firm_id, firm_name").eq("role", "admin").execute()

        for firm_admin in (res_firms.data or []):
            firm_id = firm_admin.get("firm_id")
            firm_name = firm_admin.get("firm_name") or DEFAULT_ADMIN_FIRM_NAME
            if not firm_id:
                continue

            users_res = supabase.table("users").select("id, email, name, role").eq("firm_id", firm_id).execute()
            existing_users = users_res.data or []
            existing_emails = {row.get("email", "").lower() for row in existing_users}
            non_admin_users = [row for row in existing_users if row.get("role") != "admin"]

            new_lawyers = []
            lawyer_password_hash = hash_password(DEMO_LAWYER_PASSWORD)
            for lawyer in DEMO_LAWYERS:
                email = _email_from_name(lawyer["name"], firm_id).lower()
                if email in existing_emails:
                    continue
                new_lawyers.append({
                    "name": lawyer["name"],
                    "email": email,
                    "password_hash": lawyer_password_hash,
                    "role": lawyer["role"],
                    "plan": "enterprise",
                    "firm_id": firm_id,
                    "firm_name": firm_name,
                    "profile_picture": lawyer["profile_picture"],
                    "bio": lawyer["bio"],
                    "registered_at": now,
                    "created_at": now
                })

            inserted_lawyers = []
            if new_lawyers and len(non_admin_users) < DEMO_TEAM_TARGET:
                lawyer_res = supabase.table("users").insert(new_lawyers).execute()
                inserted_lawyers = lawyer_res.data or []
                logger.info(f"Seeded {len(inserted_lawyers)} demo lawyers for {firm_name} ({firm_id})")

            lawyer_pool = [*non_admin_users, *inserted_lawyers]
            if not lawyer_pool:
                continue

            case_count_res = supabase.table("lawyer_cases").select("id", count="exact").eq("firm_id", firm_id).execute()
            existing_case_count = case_count_res.count if case_count_res.count is not None else 0
            if existing_case_count >= DEMO_CASE_TARGET:
                continue

            cases_to_create = DEMO_CASE_TARGET - existing_case_count
            seeded_cases = []
            for index in range(cases_to_create):
                template = CASE_TEMPLATES[index % len(CASE_TEMPLATES)]
                lawyer = lawyer_pool[index % len(lawyer_pool)]
                lawyer_email = lawyer.get("email")
                if not lawyer_email:
                    continue
                seeded_cases.append(
                    _build_seeded_case(
                        template,
                        {"name": lawyer.get("name") or lawyer_email, "email": lawyer_email},
                        firm_admin.get("id") or (admin or {}).get("id") or "0",
                        firm_id,
                        existing_case_count + index,
                        now,
                    )
                )

            if seeded_cases:
                supabase.table("lawyer_cases").insert(seeded_cases).execute()
                logger.info(f"Seeded {len(seeded_cases)} demo cases for {firm_name} ({firm_id})")

        logger.info("Supabase PostgreSQL Initialized Data Successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase db: {e}")



def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


def create_token(user_id: str, name: str, role: str = "user", plan: str = "trial", firm_id: str = None, firm_name: str = None) -> str:
    payload = {
        "sub": str(user_id),
        "name": name,
        "role": role,
        "plan": plan,
        "firm_id": firm_id or "",
        "firm_name": firm_name or "",
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def _calc_trial_days_left(registered_at_str: str) -> int:
    registered_at = datetime.fromisoformat(registered_at_str)
    trial_end = registered_at + timedelta(days=15)
    remaining = (trial_end - datetime.now(timezone.utc)).days
    return max(0, remaining)


def _log_activity(conn, user_id: int, action: str, details: str = ""):
    """Log user activity."""
    try:
        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            "INSERT INTO activity_log (user_id, action, details, created_at) VALUES (?,?,?,?)",
            (user_id, action, details, now)
        )
        conn.commit()
    except Exception as e:
        logger.warning(f"Activity log failed: {e}")


async def register_user(db_unused, name: str, email: str, password: str, plan: str = "trial", firm_name: str = "", firm_id: str = "", role: str = "user") -> dict:
    """Register user in Supabase. Admins get a generated firm_id. Users can join a firm via firm_id."""
    import asyncio
    
    def _run_register():
        try:
            res = supabase.table("users").select("id").eq("email", email).execute()
            if res.data:
                return {"error": "Email already registered"}

            now = datetime.now(timezone.utc).isoformat()
            
            # Determine role and firm
            if role == "admin":
                normalized_email = (email or "").strip().lower()
                if normalized_email != DEFAULT_ADMIN_EMAIL.lower() or password != DEFAULT_ADMIN_PASSWORD:
                    return {"error": "Direct administrator registration is disabled. Use the seeded Darwin administrator account."}
                user_firm_id = DEFAULT_ADMIN_FIRM_ID
                user_firm_name = DEFAULT_ADMIN_FIRM_NAME
                user_role = "admin"
                user_plan = "enterprise"
            elif role == "user":
                if not firm_id:
                    return {"error": "Firm ID is required to join a workspace."}
                
                res_firm = supabase.table("users").select("firm_id, firm_name").eq("firm_id", firm_id).eq("role", "admin").execute()
                if not res_firm.data:
                    return {"error": f"Invalid Firm ID '{firm_id}'. This workspace does not exist."}
                
                firm_admin = res_firm.data[0]
                user_firm_id = firm_id
                user_firm_name = firm_admin["firm_name"]
                user_role = "user"
                user_plan = plan or "professional"
            else:
                return {"error": "Invalid role specified."}

            insert_res = supabase.table("users").insert({
                "name": name, 
                "email": email, 
                "password_hash": hash_password(password), 
                "role": user_role, 
                "plan": user_plan, 
                "firm_id": user_firm_id, 
                "firm_name": user_firm_name, 
                "profile_picture": f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}",
                "bio": "Legal Counsel",
                "registered_at": now, 
                "created_at": now
            }).execute()
            
            user_data = insert_res.data[0] if insert_res.data else None
            
            if user_data:
                try:
                    supabase.table("events").insert({
                        "user_id": user_data["id"],
                        "event_type": "register",
                        "metadata": f"Registered as {user_role}",
                        "timestamp": now
                    }).execute()
                except Exception as e:
                    logger.warning(f"Failed to log register event: {e}")
            
            trial_days = 15 if user_plan == "trial" else -1
            return {
                "success": True,
                "message": "Registration successful. Please login.",
                "user_name": name,
                "plan": user_plan, 
                "trial_days_left": trial_days, 
                "role": user_role,
                "firm_id": user_firm_id or "",
                "firm_name": user_firm_name or ""
            }
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return {"error": "Registration failed"}

    return await asyncio.to_thread(_run_register)


async def login_user(db_unused, email: str, password: str) -> dict:
    """Login user from Supabase. Offloaded to thread to avoid blocking loop with BCrypt."""
    import asyncio

    def _run_login():
        try:
            res = supabase.table("users").select("*").eq("email", email).execute()
            if not res.data:
                return {"error": "Invalid email or password"}
                
            user = res.data[0]
            if not verify_password(password, user["password_hash"]):
                return {"error": "Invalid email or password"}

            plan = user["plan"]
            role = user.get("role", "user")
            firm_id = user.get("firm_id", "")
            firm_name = user.get("firm_name", "")
            trial_days = _calc_trial_days_left(user["registered_at"]) if plan == "trial" else -1

            if plan == "trial" and trial_days <= 0:
                return {"error": "Trial expired. Please upgrade your plan."}

            token = create_token(str(user["id"]), user["name"], role, plan, firm_id, firm_name)
            
            try:
                now = datetime.now(timezone.utc).isoformat()
                supabase.table("events").insert({
                    "user_id": user["id"],
                    "event_type": "login",
                    "metadata": f"Logged in as {role}",
                    "timestamp": now
                }).execute()
            except Exception as e:
                logger.warning(f"Failed to log login event: {e}")
            
            return {
                "access_token": token, "token_type": "bearer", "user_name": user["name"],
                "plan": plan, "trial_days_left": trial_days, "role": role,
                "firm_id": firm_id or "", "firm_name": firm_name or ""
            }
        except Exception as e:
            logger.error(f"Login error: {e}")
            return {"error": "Login failed"}

    return await asyncio.to_thread(_run_login)


async def get_user_info(user_id: str) -> dict:
    """Get user info by ID from Supabase. Thread-safe for async loop."""
    import asyncio
    
    def _run_get_info():
        try:
            res = supabase.table("users").select("*").eq("id", int(user_id)).execute()
            if not res.data:
                return None
            user = res.data[0]
            plan = user["plan"]
            role = user.get("role", "user")
            firm_id = user.get("firm_id", "")
            firm_name = user.get("firm_name", "")
            trial_days = _calc_trial_days_left(user["registered_at"]) if plan == "trial" else -1
            return {
                "user_name": user["name"],
                "email": user["email"],
                "plan": plan,
                "role": role,
                "firm_id": firm_id or "",
                "firm_name": firm_name or "",
                "trial_days_left": trial_days,
                "profile_picture": user.get("profile_picture", ""),
                "bio": user.get("bio", ""),
                "registered_at": user["registered_at"]
            }
        except Exception as e:
            logger.error(f"Get User Info Error: {e}")
            return None
            
    return await asyncio.to_thread(_run_get_info)


# --- Admin Functions ---

async def list_all_users() -> list:
    """List all users (admin only) via Supabase."""
    try:
        res = supabase.table("users").select("id, name, email, role, plan, firm_id, firm_name, registered_at, created_at").order("id", desc=True).execute()
        users = []
        for row in res.data:
            plan = row["plan"]
            trial_days = _calc_trial_days_left(row["registered_at"]) if plan == "trial" else -1
            users.append({
                "id": row["id"],
                "name": row["name"],
                "email": row["email"],
                "role": row.get("role", "user"),
                "plan": plan,
                "firm_id": row.get("firm_id", ""),
                "firm_name": row.get("firm_name", ""),
                "trial_days_left": trial_days,
                "registered_at": row["registered_at"],
                "created_at": row["created_at"]
            })
        return users
    except Exception as e:
        logger.error(f"List users error: {e}")
        return []


async def get_firm_users(firm_id: str) -> list:
    """Get all users belonging to a specific firm via Supabase."""
    try:
        res = supabase.table("users").select("id, name, email, role, plan, firm_id, firm_name, registered_at, created_at").eq("firm_id", firm_id).order("id", desc=True).execute()
        users = []
        for row in res.data:
            plan = row["plan"]
            trial_days = _calc_trial_days_left(row["registered_at"]) if plan == "trial" else -1
            users.append({
                "id": row["id"],
                "name": row["name"],
                "email": row["email"],
                "role": row.get("role", "user"),
                "plan": plan,
                "trial_days_left": trial_days,
                "registered_at": row["registered_at"],
                "created_at": row["created_at"]
            })
        return users
    except Exception as e:
        logger.error(f"Get firm users error: {e}")
        return []


async def get_user_activity(user_id: int = None, firm_id: str = None, limit: int = 50) -> list:
    """Get activity log for a user or all users in a firm via Supabase."""
    try:
        # Note: Supabase Python SDK handles foreign tables using embedded syntax
        select_query = "*, users:user_id(name, email)"
        query = supabase.table("events").select(select_query)
        
        if user_id:
            query = query.eq("user_id", user_id)
        elif firm_id:
            # First fetch users in the firm to get their IDs
            users_res = supabase.table("users").select("id").eq("firm_id", firm_id).execute()
            user_ids = [u["id"] for u in users_res.data]
            if not user_ids:
                return []
            query = query.in_("user_id", user_ids)
            
        res = query.order("timestamp", desc=True).limit(limit).execute()
        
        activities = []
        for row in res.data:
            u_data = row.get("users", {}) or {}
            activities.append({
                "id": row["id"],
                "user_id": row["user_id"],
                "action": row["event_type"],
                "details": row.get("metadata", ""),
                "created_at": row["timestamp"],
                "user_name": u_data.get("name", ""),
                "email": u_data.get("email", "")
            })
        return activities
    except Exception as e:
        logger.warning(f"Activity query failed: {e}")
        return []


async def update_user(user_id: int, plan: str = None, role: str = None) -> dict:
    """Update user plan or role via Supabase."""
    try:
        updates = {}
        if plan: updates["plan"] = plan
        if role: updates["role"] = role
        
        if not updates:
            return {"success": True, "message": "No updates provided"}
            
        res = supabase.table("users").update(updates).eq("id", user_id).execute()
        if not res.data:
            return {"error": "User not found or update failed"}
            
        return {"success": True, "message": f"User {user_id} updated"}
    except Exception as e:
        logger.error(f"Update user error: {e}")
        return {"error": str(e)}


async def delete_user(user_id: int) -> dict:
    """Delete user via Supabase."""
    try:
        res = supabase.table("users").delete().eq("id", user_id).execute()
        if not res.data:
            return {"error": "User not found"}
        return {"success": True, "message": f"User {user_id} deleted"}
    except Exception as e:
        logger.error(f"Delete user error: {e}")
        return {"error": str(e)}


async def get_platform_stats(firm_id: str = None) -> dict:
    """Get platform-wide or firm-specific statistics for admin dashboard."""
    try:
        if firm_id:
            u_res = supabase.table("users").select("id", count="exact").eq("firm_id", firm_id).execute()
        else:
            u_res = supabase.table("users").select("id", count="exact").execute()
        user_count = u_res.count if u_res.count is not None else 0
        
        search_count = 0
        try:
            if firm_id:
                users_res = supabase.table("users").select("id").eq("firm_id", firm_id).execute()
                u_ids = [u["id"] for u in users_res.data]
                if u_ids:
                    s_res = supabase.table("search_history").select("id", count="exact").in_("user_id", u_ids).execute()
                    search_count = s_res.count if s_res.count is not None else 0
            else:
                s_res = supabase.table("search_history").select("id", count="exact").execute()
                search_count = s_res.count if s_res.count is not None else 0
        except: pass

        draft_count = 0
        try:
            if firm_id:
                users_res = supabase.table("users").select("id").eq("firm_id", firm_id).execute()
                u_ids = [u["id"] for u in users_res.data]
                if u_ids:
                    d_res = supabase.table("draft_history").select("id", count="exact").in_("user_id", u_ids).execute()
                    draft_count = d_res.count if d_res.count is not None else 0
            else:
                d_res = supabase.table("draft_history").select("id", count="exact").execute()
                draft_count = d_res.count if d_res.count is not None else 0
        except: pass

        activity_count = 0
        try:
            a_res = supabase.table("events").select("id", count="exact").execute()
            activity_count = a_res.count if a_res.count is not None else 0
        except: pass

        # Get daily search data (last 7 days)
        daily_data = []
        try:
            # Simplistic daily fetch due to PostgREST limitations with grouping
            # (In production, would use an RPC or raw PG query payload)
            # For accurate rendering we map days locally
            for i in range(6, -1, -1):
                day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
                day_label = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%a")
                c_res = supabase.table("search_history").select("id", count="exact").ilike("timestamp", f"{day}%").execute()
                count = c_res.count if c_res.count is not None else 0
                daily_data.append({"day": day_label, "queries": count})
        except Exception:
            daily_data = [{"day": d, "queries": 0} for d in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]]

        return {
            "total_users": user_count,
            "total_searches": search_count,
            "total_drafts": draft_count,
            "total_activities": activity_count,
            "daily_data": daily_data
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return {
            "total_users": 0, "total_searches": 0, "total_drafts": 0, "total_activities": 0,
            "daily_data": [{"day": d, "queries": 0} for d in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]]
        }
