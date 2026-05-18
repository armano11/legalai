from services.auth_service import init_auth_db

if __name__ == "__main__":
    print("Initializing Supabase Auth DB (Seeding Enrichment)...")
    init_auth_db()
    print("Done.")
