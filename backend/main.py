from fastapi import (
    FastAPI,
    File,
    UploadFile,
    Form,
    Depends,
    HTTPException,
    Body,
    BackgroundTasks,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    import tensorflow as tf
except Exception:
    tf = None

from PIL import Image
import numpy as np

import os
import shutil
import hashlib
import smtplib
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

from passlib.context import CryptContext
from jose import jwt

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
)
from sqlalchemy.orm import (
    sessionmaker,
    declarative_base,
)


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

EMAIL_SENDER = os.environ.get("EMAIL_SENDER", "")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "")

SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "road_damage_secret_key_change_this",
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

GOOGLE_CLIENT_ID = os.environ.get(
    "GOOGLE_CLIENT_ID",
    "",
)


# ============================================================
# DATABASE
# ============================================================

# IMPORTANT:
# Render:
#   DATABASE_URL = PostgreSQL connection string
#
# Local development:
#   If DATABASE_URL is not present, SQLite is used.

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./reports.db",
)


# Some PostgreSQL services may provide:
# postgres://...
#
# SQLAlchemy expects:
# postgresql://...

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql://",
        1,
    )


# SQLAlchemy + newer PostgreSQL drivers
# Use psycopg2 when the URL does not specify a driver.

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg2://",
        1,
    )


if DATABASE_URL.startswith("postgresql"):
    DATABASE_TYPE = "PostgreSQL"
else:
    DATABASE_TYPE = "SQLite"


print(f"Database type: {DATABASE_TYPE}")


# SQLite requires check_same_thread=False.
connect_args = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {
        "check_same_thread": False,
    }


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


Base = declarative_base()


# ============================================================
# REPORT TABLE
# ============================================================

class Report(Base):

    __tablename__ = "reports"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    image_path = Column(
        String,
    )

    username = Column(
        String,
    )

    damage_type = Column(
        String,
    )

    confidence = Column(
        Float,
    )

    points = Column(
        Integer,
    )

    latitude = Column(
        Float,
        nullable=True,
    )

    longitude = Column(
        Float,
        nullable=True,
    )

    timestamp = Column(
        String,
    )

    image_hash = Column(
        String,
        index=True,
    )


# ============================================================
# USER TABLE
# ============================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    username = Column(
        String,
        unique=True,
        index=True,
    )

    email = Column(
        String,
        unique=True,
        index=True,
    )

    password = Column(
        String,
    )

    total_points = Column(
        Integer,
        default=0,
    )


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

Base.metadata.create_all(
    bind=engine,
)

print(
    "Database tables verified successfully."
)


# ============================================================
# WELCOME EMAIL
# ============================================================

def send_welcome_email(
    to_email: str,
    username: str,
):

    if not EMAIL_SENDER or not EMAIL_PASSWORD:

        print(
            f"Skipping welcome email for {to_email}: "
            "EMAIL_SENDER or EMAIL_PASSWORD not set"
        )

        return

    try:

        msg = MIMEMultipart()

        msg["From"] = EMAIL_SENDER
        msg["To"] = to_email
        msg["Subject"] = (
            "Welcome to Road Damage Scanner!"
        )

        body = (
            f"Hi {username},\n\n"
            "Welcome to Road Damage Scanner! "
            "We're excited to have you on board.\n\n"
            "Start uploading images of road damage "
            "to help keep the streets safe, and earn "
            "points while you do it!\n\n"
            "Best,\n"
            "The Road Damage Scanner Team"
        )

        msg.attach(
            MIMEText(
                body,
                "plain",
            )
        )

        server = smtplib.SMTP(
            "smtp.gmail.com",
            587,
        )

        server.starttls()

        server.login(
            EMAIL_SENDER,
            EMAIL_PASSWORD,
        )

        server.send_message(msg)

        server.quit()

        print(
            f"Welcome email sent successfully to "
            f"{to_email}"
        )

    except Exception as e:

        print(
            f"Failed to send email to {to_email}: {e}"
        )


# ============================================================
# PASSWORD / JWT
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str):

    # bcrypt supports a maximum of 72 bytes.
    password = password[:72]

    return pwd_context.hash(
        password,
    )


def verify_password(
    password: str,
    hashed_password: str,
):

    password = password[:72]

    return pwd_context.verify(
        password,
        hashed_password,
    )


def create_token(data: dict):

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES,
        )
    )

    token_data = data.copy()

    token_data["exp"] = expire

    return jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Road Damage Reporting and Monitoring System",
    version="2.0",
)


# ============================================================
# UPLOAD DIRECTORY
# ============================================================

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True,
)


app.mount(
    "/uploads",
    StaticFiles(
        directory=UPLOAD_DIR,
    ),
    name="uploads",
)


# ============================================================
# CORS
# ============================================================

# Set FRONTEND_URL on Render to your deployed frontend URL.
#
# Example:
# FRONTEND_URL=https://your-frontend.onrender.com

FRONTEND_URL = os.environ.get(
    "FRONTEND_URL",
    "",
)


if FRONTEND_URL:

    ALLOWED_ORIGINS = [
        origin.strip().rstrip("/")
        for origin in FRONTEND_URL.split(",")
        if origin.strip()
    ]

else:

    # Local development fallback.
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


app.add_middleware(
    CORSMiddleware,

    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+|https://.*\.onrender\.com",

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


print(
    "Allowed frontend origins:",
    ALLOWED_ORIGINS,
)


# ============================================================
# CNN MODEL
# ============================================================

# Render may fail during startup if TensorFlow is not compatible with the runtime.
# Loading the model lazily prevents the service from crashing on boot while the
# deployment environment is still being validated.
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    "../road_damage_cnn.keras",
)

MODEL_PATH = os.path.abspath(
    MODEL_PATH,
)

MODEL_LOAD_ON_STARTUP = os.environ.get(
    "MODEL_LOAD_ON_STARTUP",
    "false",
).lower() in {"1", "true", "yes", "on"}

CLASS_NAMES = [
    "crack",
    "no_damage",
    "pothole",
]

model = None


def load_model():
    global model

    if model is not None:
        return model

    if tf is None:
        print(
            "TensorFlow is unavailable. "
            "Model loading skipped until a compatible runtime is configured."
        )
        return None

    if not os.path.exists(MODEL_PATH):
        print(
            f"CNN model not found at: {MODEL_PATH}. "
            "Model loading skipped."
        )
        return None

    try:
        print(
            "Loading CNN model from:",
            MODEL_PATH,
        )
        model = tf.keras.models.load_model(
            MODEL_PATH,
        )
        print(
            "CNN model loaded successfully."
        )
        print(
            "Classes:",
            CLASS_NAMES,
        )
        return model

    except Exception as exc:
        print(
            f"Failed to load CNN model from {MODEL_PATH}: {exc}"
        )
        return None


if MODEL_LOAD_ON_STARTUP:
    load_model()
else:
    print(
        "MODEL_LOAD_ON_STARTUP is disabled; model will be loaded lazily."
    )


# ============================================================
# DATABASE SESSION
# ============================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Backend is running",
        "database": DATABASE_TYPE,
        "model": "CNN",
        "classes": CLASS_NAMES,
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "database": DATABASE_TYPE,
        "model_loaded": model is not None,
    }


# ============================================================
# REGISTER
# ============================================================

@app.post("/register")
def register(
    background_tasks: BackgroundTasks,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db=Depends(get_db),
):

    username = username.strip()
    email = email.strip().lower()

    if not username:

        raise HTTPException(
            status_code=400,
            detail="Username cannot be empty",
        )

    if not email:

        raise HTTPException(
            status_code=400,
            detail="Email cannot be empty",
        )

    if len(password) == 0:

        raise HTTPException(
            status_code=400,
            detail="Password cannot be empty",
        )


    # Check email.

    existing_email = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if existing_email:

        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )


    # Check username.

    existing_username = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )

    if existing_username:

        raise HTTPException(
            status_code=400,
            detail="Username already taken",
        )


    new_user = User(
        username=username,
        email=email,
        password=hash_password(password),
        total_points=0,
    )


    db.add(new_user)

    db.commit()

    db.refresh(new_user)


    background_tasks.add_task(
        send_welcome_email,
        email,
        username,
    )


    return {
        "message": "User created successfully",
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db=Depends(get_db),
):

    email = email.strip().lower()


    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )


    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )


    if not user.password:

        raise HTTPException(
            status_code=401,
            detail=(
                "This account uses Google login. "
                "Please continue with Google."
            ),
        )


    if not verify_password(
        password,
        user.password,
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )


    token = create_token(
        {
            "sub": user.email,
        }
    )


    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
    }


# ============================================================
# GOOGLE AUTHENTICATION
# ============================================================

@app.post("/auth/google")
def google_auth(
    background_tasks: BackgroundTasks,
    token: str = Body(..., embed=True),
    db=Depends(get_db),
):

    if not GOOGLE_CLIENT_ID:

        raise HTTPException(
            status_code=500,
            detail=(
                "GOOGLE_CLIENT_ID is not configured"
            ),
        )


    try:

        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )

    except ValueError as e:

        print(
            f"Token validation error: {e}"
        )

        raise HTTPException(
            status_code=401,
            detail=(
                f"Invalid Google token: {str(e)}"
            ),
        )


    email = idinfo.get(
        "email",
        "",
    ).strip().lower()


    if not email:

        raise HTTPException(
            status_code=401,
            detail="Google account email not available",
        )


    name = idinfo.get(
        "name",
        email.split("@")[0],
    )


    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )


    # Create account automatically for
    # first-time Google users.

    if not user:

        username = name.strip()

        if not username:

            username = email.split("@")[0]


        existing_username = (
            db.query(User)
            .filter(
                User.username == username
            )
            .first()
        )


        if existing_username:

            username = (
                email.split("@")[0]
                + "_google"
            )


        user = User(
            username=username,
            email=email,
            password="",
            total_points=0,
        )


        db.add(user)

        db.commit()

        db.refresh(user)


        background_tasks.add_task(
            send_welcome_email,
            email,
            user.username,
        )


    access_token = create_token(
        {
            "sub": user.email,
        }
    )


    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
    }


# ============================================================
# UPLOAD + CNN PREDICTION
# ============================================================

@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    username: str = Form(...),
    latitude: float = Form(None),
    longitude: float = Form(None),
    db=Depends(get_db),
):

    username = username.strip()


    if not username:

        raise HTTPException(
            status_code=400,
            detail="Username is required",
        )


    # --------------------------------------------------------
    # Check user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )


    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )


    # --------------------------------------------------------
    # Validate file
    # --------------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected",
        )


    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }


    original_name = file.filename

    extension = os.path.splitext(
        original_name
    )[1].lower()


    if extension not in allowed_extensions:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported image format. "
                "Use JPG, JPEG, PNG or WEBP."
            ),
        )


    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    file_contents = await file.read()


    if not file_contents:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )


    # --------------------------------------------------------
    # Create hash
    # --------------------------------------------------------

    image_hash = hashlib.sha256(
        file_contents
    ).hexdigest()


    # --------------------------------------------------------
    # Prevent duplicate upload
    # --------------------------------------------------------

    existing = (
        db.query(Report)
        .filter(
            Report.username == username,
            Report.image_hash == image_hash,
        )
        .first()
    )


    if existing:

        raise HTTPException(
            status_code=400,
            detail=(
                "You have already uploaded this image."
            ),
        )


    # --------------------------------------------------------
    # Generate unique filename
    # --------------------------------------------------------

    safe_filename = (
        f"{image_hash[:16]}{extension}"
    )


    file_path = os.path.join(
        UPLOAD_DIR,
        safe_filename,
    ).replace(
        "\\",
        "/",
    )


    # --------------------------------------------------------
    # Save uploaded image
    # --------------------------------------------------------

    try:

        with open(
            file_path,
            "wb",
        ) as buffer:

            buffer.write(
                file_contents
            )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to save image: {str(e)}"
            ),
        )


    # --------------------------------------------------------
    # Prepare image for CNN
    #
    # IMPORTANT:
    # Same preprocessing as your working CNN.
    # NO /255.0 normalization here.
    # --------------------------------------------------------

    try:

        image = (
            Image.open(
                file_path
            )
            .convert("RGB")
        )


        image = image.resize(
            (128, 128)
        )


        image_array = np.array(
            image,
            dtype=np.float32,
        )


        image_array = np.expand_dims(
            image_array,
            axis=0,
        )


    except Exception as e:

        try:

            os.remove(
                file_path
            )

        except Exception:

            pass


        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid image: {str(e)}"
            ),
        )


    # --------------------------------------------------------
    # CNN prediction
    # --------------------------------------------------------

    if model is None:
        model = load_model()

    if model is None:
        try:
            os.remove(file_path)
        except Exception:
            pass

        raise HTTPException(
            status_code=503,
            detail=(
                "CNN model is not available on the server. "
                "Check the deployment environment and model path."
            ),
        )

    try:

        predictions = model.predict(
            image_array,
            verbose=0,
        )


    except Exception as e:

        try:

            os.remove(
                file_path
            )

        except Exception:

            pass


        raise HTTPException(
            status_code=500,
            detail=(
                f"CNN prediction failed: {str(e)}"
            ),
        )


    print(
        "CNN raw predictions:",
        predictions[0],
    )


    class_index = int(
        np.argmax(
            predictions[0]
        )
    )


    confidence = float(
        predictions[0][class_index]
    )


    predicted_class = (
        CLASS_NAMES[class_index]
    )


    print(
        "Predicted class:",
        predicted_class,
    )


    print(
        "Confidence:",
        confidence,
    )


    # --------------------------------------------------------
    # Points system
    # --------------------------------------------------------

    if predicted_class == "pothole":

        points = 100

    elif predicted_class == "crack":

        points = 50

    else:

        points = 0


    # --------------------------------------------------------
    # Detection result
    # --------------------------------------------------------

    detections = [
        {
            "damage_type": predicted_class,
            "confidence": round(
                confidence,
                4,
            ),
        }
    ]


    primary_detection = detections[0]


    # --------------------------------------------------------
    # Save report
    # --------------------------------------------------------

    report = Report(

        image_path=file_path,

        username=username,

        damage_type=(
            primary_detection[
                "damage_type"
            ]
        ),

        confidence=(
            primary_detection[
                "confidence"
            ]
        ),

        points=points,

        latitude=latitude,

        longitude=longitude,

        timestamp=(
            datetime.now(
                timezone.utc
            ).isoformat()
        ),

        image_hash=image_hash,
    )


    db.add(report)


    # --------------------------------------------------------
    # Update user score
    # --------------------------------------------------------

    user.total_points += points


    # --------------------------------------------------------
    # Commit database
    # --------------------------------------------------------

    try:

        db.commit()

        db.refresh(report)

    except Exception as e:

        db.rollback()

        try:

            os.remove(
                file_path
            )

        except Exception:

            pass


        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to save report: {str(e)}"
            ),
        )


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {

        "filename": original_name,

        "detections": detections,

        "points": points,

        "message": (
            "Upload saved successfully"
        ),
    }


# ============================================================
# MY UPLOADS
# ============================================================

@app.get("/myreports/{username}")
def get_my_reports(
    username: str,
    db=Depends(get_db),
):

    reports = (
        db.query(Report)
        .filter(
            Report.username == username
        )
        .order_by(
            Report.id.desc()
        )
        .all()
    )

    return reports


# ============================================================
# PUBLIC UPLOADS
# ============================================================

@app.get("/publicreports")
def get_public_reports(
    db=Depends(get_db),
):

    reports = (
        db.query(Report)
        .order_by(
            Report.id.desc()
        )
        .all()
    )

    return reports


# ============================================================
# LEADERBOARD
# ============================================================

@app.get("/leaderboard")
def leaderboard(
    db=Depends(get_db),
):

    users = (
        db.query(User)
        .order_by(
            User.total_points.desc()
        )
        .limit(5)
        .all()
    )


    result = []


    for user in users:

        result.append(
            {
                "username": user.username,
                "score": user.total_points,
            }
        )


    return result


# ============================================================
# ALL REPORTS
# ============================================================

@app.get("/reports")
def get_reports(
    db=Depends(get_db),
):

    reports = (
        db.query(Report)
        .order_by(
            Report.id.desc()
        )
        .all()
    )

    return reports


# ============================================================
# DELETE REPORT
# ============================================================

@app.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    db=Depends(get_db),
):

    report = (
        db.query(Report)
        .filter(
            Report.id == report_id
        )
        .first()
    )


    if not report:

        raise HTTPException(
            status_code=404,
            detail="Report not found",
        )


    # --------------------------------------------------------
    # IMPORTANT:
    # Remove points from the user when the report is deleted.
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.username == report.username
        )
        .first()
    )


    if user:

        user.total_points = max(
            0,
            user.total_points - (
                report.points or 0
            ),
        )


    # --------------------------------------------------------
    # Delete image
    # --------------------------------------------------------

    if (
        report.image_path
        and os.path.exists(
            report.image_path
        )
    ):

        try:

            os.remove(
                report.image_path
            )

        except Exception as e:

            print(
                f"Failed to delete image: {e}"
            )


    # --------------------------------------------------------
    # Delete database record
    # --------------------------------------------------------

    db.delete(report)

    db.commit()


    return {
        "message": (
            "Report deleted successfully"
        )
    }