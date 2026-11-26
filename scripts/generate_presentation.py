"""
ESTATECORE FINAL PROJECT: PRESENTATION SLIDE GENERATOR (.pptx)

Course: ITEC 116 - Systems Integration and Architecture 2
Instructor: John Vincent A. Dallego, MIT
Student: Cabico, Cristina O. | BSIT 4-C
Target Output: documentation/deliverables/EstateCore_Final_Project_Presentation.pptx
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    NAVY = RGBColor(15, 23, 42)      # #0f172a
    BLUE = RGBColor(37, 99, 235)     # #2563eb
    DARK_BLUE = RGBColor(30, 58, 138)# #1e3a8a
    WHITE = RGBColor(255, 255, 255)
    LIGHT_GRAY = RGBColor(248, 250, 252)
    SLATE = RGBColor(71, 85, 105)    # #475569
    CARD_BG = RGBColor(241, 245, 249) # #f1f5f9
    BORDER = RGBColor(203, 213, 225)

    blank_layout = prs.slide_layouts[6]

    def add_header(slide, title_text, category_text="ITEC 116 FINAL PROJECT PRESENTATION"):
        # Header banner shape
        banner = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.9))
        banner.fill.solid()
        banner.fill.fore_color.rgb = WHITE
        banner.line.color.rgb = BORDER
        banner.line.width = Pt(1)

        tf = banner.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_top = Inches(0.1)

        p1 = tf.paragraphs[0]
        p1.text = category_text.upper()
        p1.font.size = Pt(9)
        p1.font.bold = True
        p1.font.color.rgb = BLUE

        p2 = tf.add_paragraph()
        p2.text = title_text
        p2.font.size = Pt(20)
        p2.font.bold = True
        p2.font.color.rgb = NAVY

    def add_card(slide, left, top, width, height, title, bullets):
        box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = BORDER
        box.line.width = Pt(1)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.2)

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = DARK_BLUE
        p.space_after = Pt(8)

        for b in bullets:
            bp = tf.add_paragraph()
            bp.text = f"• {b}"
            bp.font.size = Pt(10.5)
            bp.font.color.rgb = NAVY
            bp.space_after = Pt(4)

    # -------------------------------------------------------------
    # SLIDE 1: TITLE SLIDE
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = NAVY
    bg1.line.fill.background()

    # Title box
    tb = s1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.333), Inches(4.5))
    tf1 = tb.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "ESTATECORE REAL ESTATE MANAGEMENT SYSTEM"
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.space_after = Pt(10)

    p = tf1.add_paragraph()
    p.text = "Comprehensive Backend Integration, Relational Database Architecture & RESTful API Verification"
    p.font.size = Pt(16)
    p.font.color.rgb = RGBColor(147, 197, 253)
    p.space_after = Pt(36)

    p = tf1.add_paragraph()
    p.text = "Course: ITEC 116 — Systems Integration and Architecture 2"
    p.font.size = Pt(13)
    p.font.color.rgb = WHITE

    p = tf1.add_paragraph()
    p.text = "Instructor: John Vincent A. Dallego, MIT"
    p.font.size = Pt(13)
    p.font.color.rgb = WHITE

    p = tf1.add_paragraph()
    p.text = "Student Presenter: Cabico, Cristina O. | BSIT 4-C"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = RGBColor(253, 224, 71)

    # -------------------------------------------------------------
    # SLIDE 2: PROJECT OVERVIEW & PROBLEM STATEMENT
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Project Overview & Problem Statement")
    add_card(s2, 0.8, 1.6, 5.7, 5.2, "Industry Challenges in Real Estate Systems", [
        "Broken Object-Level Authorization (BOLA): Unauthorized users altering listings or reading buyer inquiries.",
        "Race Conditions & Double-Selling: Concurrent transactions causing inconsistent listing inventory.",
        "Insecure File Upload Vulnerabilities: Path traversal and arbitrary script execution through unvalidated photo attachments.",
        "Monolithic Coupling: Fragile architectures lacking clear separation between API, database, and client layers."
    ])
    add_card(s2, 6.8, 1.6, 5.7, 5.2, "EstateCore Enterprise Solution", [
        "Modern Multi-Tier Architecture: NestJS (Application), MySQL 8.4 (Persistence), React 18 (Presentation).",
        "39 Verified REST Endpoints: Exceeds the final project minimum requirement of 20 endpoints.",
        "6 Functional CRUD Modules: Properties, Inquiries, Appointments, Users, Transactions, and Agents.",
        "Pessimistic Concurrency Locking: Atomic row-level locks preventing duplicate sales settlements.",
        "Stateless JWT with Server Blacklist: Strict 1-hour expiration with immediate logout revocation."
    ])

    # -------------------------------------------------------------
    # SLIDE 3: SYSTEMS INTEGRATION ARCHITECTURE
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Systems Integration Architecture & Layering")
    add_card(s3, 0.8, 1.6, 3.7, 5.2, "Presentation Tier", [
        "React 18 Single Page App (Vite)",
        "Tailwind CSS Responsive Design",
        "Axios HTTP Client Interceptors",
        "JWT Session Storage in Browser",
        "Role-Aware Navigation & UI Panels",
        "Dynamic Inquiries & Booking Forms"
    ])
    add_card(s3, 4.8, 1.6, 3.7, 5.2, "Application Tier (NestJS)", [
        "Modular Domain Architecture (7 Modules)",
        "Global ValidationPipe (class-validator)",
        "Global RFC 7807 ExceptionFilter",
        "JwtAuthGuard & RolesGuard (RBAC)",
        "Contextual Ownership Verification",
        "Canonical Routing Prefix: /api/v1"
    ])
    add_card(s3, 8.8, 1.6, 3.7, 5.2, "Data Tier (MySQL 8.4)", [
        "Containerized MySQL 8.4 Engine",
        "TypeORM 0.3 Repository Pattern",
        "InnoDB Storage Engine (ACID)",
        "Zero-Touch Live DB (Port 3307)",
        "Strict Foreign Key Cascades & Restricts",
        "Versioned TypeORM Migrations"
    ])

    # -------------------------------------------------------------
    # SLIDE 4: DATABASE ARCHITECTURE & ER MODELING
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Database Architecture & Relational Schema (3NF)")
    add_card(s4, 0.8, 1.6, 5.7, 5.2, "Core Relational Tables", [
        "users: id, email, password (bcrypt), fullName, role, contactNumber, isActive.",
        "agents: id, userId (1:1 FK), licenseNumber, agencyName, verificationStatus.",
        "properties: id, title, propertyType, listingType, status, price, agentId, ownerId.",
        "property_photos: id, propertyId (FK), filePath, isPrimary, caption.",
        "inquiries: id, propertyId (FK), clientId (FK), message, status, offerAmount.",
        "appointments: id, propertyId (FK), clientId (FK), agentId (FK), date, time, status.",
        "property_transactions: id, propertyId (FK), buyerId (FK), amount, status."
    ])
    add_card(s4, 6.8, 1.6, 5.7, 5.2, "Referential Actions & Data Integrity", [
        "1:1 User-to-Agent Linkage: Enforces single professional profile per agent account.",
        "ON DELETE CASCADE on Photos: Removing a listing automatically cleans up child photos.",
        "ON DELETE RESTRICT on Inquiries: Protects historical communication logs from accidental deletion.",
        "Pessimistic Write Locking: Prevents simultaneous writes during financial settlement.",
        "Audited Timestamps: Every entity tracks createdAt and updatedAt in UTC+8."
    ])

    # -------------------------------------------------------------
    # SLIDE 5: RESTFUL API ENDPOINT SPECIFICATION
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "RESTful API Architecture & Endpoint Specification")
    add_card(s5, 0.8, 1.6, 3.7, 5.2, "Auth & Users (10 Endpoints)", [
        "POST /auth/register",
        "POST /auth/login",
        "POST /auth/logout",
        "GET /auth/me",
        "GET /users (Admin filter)",
        "POST /users (Create user)",
        "GET /users/:id",
        "PATCH /users/:id",
        "PUT /users/:id",
        "DELETE /users/:id (Soft delete)"
    ])
    add_card(s5, 4.8, 1.6, 3.7, 5.2, "Properties & Agents (16 Endpoints)", [
        "GET /agents & GET /agents/:id",
        "POST, PUT, PATCH /agents/:id",
        "GET /properties (Multi-filter)",
        "GET /properties/:id",
        "POST, PUT, PATCH, DELETE /properties",
        "GET & POST /properties/:id/photos",
        "POST /properties/:id/inquiries",
        "GET & PATCH /properties/:id/inquiries"
    ])
    add_card(s5, 8.8, 1.6, 3.7, 5.2, "Workflows & Settlements (13 Endpoints)", [
        "POST /inquiries & GET /inquiries",
        "GET, PATCH, DELETE /inquiries/:id",
        "POST /appointments (Book viewing)",
        "GET, PATCH, DELETE /appointments",
        "POST /transactions (Atomic sale)",
        "GET /transactions & GET /transactions/:id",
        "Total: 39 Working Endpoints (Exceeds >= 20 requirement)"
    ])

    # -------------------------------------------------------------
    # SLIDE 6: AUTHENTICATION & SECURITY ARCHITECTURE
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "Authentication, Security & RBAC Implementation")
    add_card(s6, 0.8, 1.6, 5.7, 5.2, "Cryptographic & Session Governance", [
        "Stateless JWT Authentication: Signed with HMAC-SHA256.",
        "Strict 1-Hour Lifespan: Expiration enforced at 3600 seconds.",
        "Server-Side Token Revocation: Blacklists token signature upon logout.",
        "Rich Claims Payload: Agent token includes sub, email, role, and agentId.",
        "Anti-Brute Force Protection: In-memory rate limiting issues HTTP 429 after 5 failed login attempts."
    ])
    add_card(s6, 6.8, 1.6, 5.7, 5.2, "Role-Based Access Control (RBAC)", [
        "ADMIN: System-wide authority, user governance, full audit access.",
        "AGENT: Listing creation, photo uploads, inquiry response, sales execution.",
        "CLIENT: Catalog search, personal listing submission, booking viewings.",
        "BOLA Defense: Ownership verification prevents cross-agent tampering.",
        "Email-Only Mandate: Zero SMS libraries, cellular gateways, or templates."
    ])

    # -------------------------------------------------------------
    # SLIDE 7: ATOMIC TRANSACTION CONCURRENCY
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Transaction Concurrency & Double-Sale Prevention")
    add_card(s7, 0.8, 1.6, 5.7, 5.2, "Pessimistic Concurrency Architecture", [
        "TypeORM dataSource.transaction: Enforces all-or-nothing atomicity.",
        "setLock('pessimistic_write'): Executes SELECT ... FOR UPDATE in MySQL.",
        "Row-Level Exclusivity: Prevents other connections from reading or modifying the property during checkout.",
        "Immediate Availability Check: Verifies status is AVAILABLE before proceeding.",
        "Automatic Transition: Changes status to SOLD upon transaction completion."
    ])
    add_card(s7, 6.8, 1.6, 5.7, 5.2, "Conflict Detection & Resolution", [
        "Duplicate Purchase Prevention: Subsequent acquisition attempts receive HTTP 409 Conflict.",
        "Audit Trail Integrity: Financial record stores buyer, agent, amount, method, and timestamp.",
        "Zero Inconsistent State: Eliminates phantom reads and race conditions.",
        "Relational Safety: Foreign keys guarantee valid buyer, agent, and property references."
    ])

    # -------------------------------------------------------------
    # SLIDE 8: TESTING & EMPIRICAL VALIDATION
    # -------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Testing Methodology & Verification Results")
    add_card(s8, 0.8, 1.6, 5.7, 5.2, "Test Harness Execution", [
        "Final 36+ Endpoint Suite: 46/46 Passed (100.0% Pass Rate).",
        "Phase 5.1 Stabilization Suite: 20/20 Passed (Atomicity, Rate Limiting, Uploads).",
        "Phase 3 Security Suite: 60/60 Passed (RBAC, BOLA, Token Revocation).",
        "SQL Import Validation: 7/7 Tables Verified (Clean import into fresh DB).",
        "Live DB Audit: 100% Zero-Touch isolation on estatecore_db confirmed."
    ])
    add_card(s8, 6.8, 1.6, 5.7, 5.2, "Deliverables Summary", [
        "Postman Collection: 46 requests across 8 categorized feature folders.",
        "Postman Environment: Pre-configured template for local defense testing.",
        "SQL Database Export: EstateCore_Final_Project.sql (DDL + clean seed data).",
        "Technical Documentation: 626.9 KB PDF covering 12 comprehensive chapters.",
        "Demo Materials: 5–10 min spoken script and 15-question defense Q&A guide."
    ])

    # -------------------------------------------------------------
    # SLIDE 9: CONCLUSION & DEFENSE READINESS
    # -------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Academic Compliance & Final Conclusion")
    add_card(s9, 0.8, 1.6, 5.7, 5.2, "Final Project Requirements Fulfillment", [
        "Minimum 20 Endpoints: Exceeded (39 endpoints implemented & tested).",
        "At Least Two CRUD Modules: Exceeded (6 functional CRUD modules).",
        "JWT Authentication & RBAC: 100% Implemented & Verified.",
        "MySQL with TypeORM: 100% Compliant with InnoDB constraints.",
        "Postman Collection & Environment: Exported & Verified.",
        "SQL Database Export: Exported & Clean Import Tested.",
        "Technical Documentation: 12 Chapters, PDF generated."
    ])
    add_card(s9, 6.8, 1.6, 5.7, 5.2, "Final Certification", [
        "Production-Grade Stability: Zero build or runtime errors.",
        "Complete Defense Readiness: Demonstrable live backend prototype.",
        "Candidate: Cabico, Cristina O. | BSIT 4-C",
        "Course: ITEC 116 — IT Elective 4 (Systems Integration and Architecture 2)",
        "Instructor: John Vincent A. Dallego, MIT"
    ])

    import io
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../documentation/deliverables'))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'EstateCore_Final_Project_Presentation.pptx')
    
    stream = io.BytesIO()
    prs.save(stream)
    with open(out_path, 'wb') as f:
        f.write(stream.getvalue())
    print(f"=== SUCCESS: Presentation saved to: {out_path} ({len(stream.getvalue()) / 1024:.1f} KB) ===")

if __name__ == '__main__':
    create_deck()
