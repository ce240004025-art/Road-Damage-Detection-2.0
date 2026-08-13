🚧 Road Damage Reporting and Monitoring System

A full-stack intelligent web application for detecting, reporting, and monitoring road damage using a custom-trained Convolutional Neural Network (CNN). The system combines an AI-based image classification model with a React frontend, FastAPI backend, location-aware reporting, duplicate detection, and a community leaderboard.

📌 Project Overview

Road damage such as cracks and potholes can affect road safety and requires timely reporting and maintenance.

This project provides a web-based platform where users can:

Register and log in securely
Upload images of roads
Automatically classify road conditions using a custom-trained CNN
Detect whether an image contains a crack, pothole, or no damage
Store reports with geographic coordinates
Prevent duplicate image submissions
Award points for valid contributions
View personal and public reports
Visualize reported locations on a map
Compete through a community leaderboard
🚀 Features
🧠 AI-Based Road Damage Classification

The system uses a custom Convolutional Neural Network (CNN) trained using TensorFlow/Keras.

Unlike YOLO-based object detection, this project uses image classification. The complete image is provided to the CNN, which predicts the most likely road-condition class.

Detected Classes

The trained model currently classifies images into:

Crack
Pothole
No Damage

The model returns the predicted class along with a confidence score.

🔐 User Authentication

The application provides:

User registration
User login
Password hashing
JWT-based authentication
Protected user-specific reports
📤 Road Damage Reporting

Users can upload a road image through the web application.

The system:

Receives the uploaded image
Processes it using the CNN model
Predicts the road condition
Calculates the prediction confidence
Records the user's location
Stores the report
Awards contribution points
🛡️ Duplicate Upload Prevention

The backend uses image hashing to identify previously submitted images.

This helps prevent:

Duplicate reports
Repeated submissions
Spam submissions
Unnecessary duplicate point generation
📍 Geo-Tagged Reports

Each report can contain:

Username
Uploaded image
Damage type
Confidence score
Latitude
Longitude
Timestamp
Points earned

This allows reports to be associated with their real-world locations.

🏆 Leaderboard

The system includes a contribution-based leaderboard.

Users earn points for valid road-damage reports, encouraging community participation in road monitoring.

🖥️ Dashboard

The React dashboard provides different views for users.

My Uploads

Displays reports submitted by the logged-in user.

Public Uploads

Displays reports submitted by users across the platform.

Map Visualization

Reported locations can be visualized using geographic coordinates.

🧠 Machine Learning Model
Dataset

The model was trained using the RDD2022 (Road Damage Dataset 2022) as the source dataset.

The dataset contains road images representing different types of road conditions.

Dataset resources and training material are maintained separately in the project's Google Drive.

🏗️ Model Architecture

Instead of using a pre-trained  model, the project uses a custom Convolutional Neural Network (CNN) developed and trained using TensorFlow/Keras.

The CNN performs image classification rather than object detection.

Classification Pipeline
Road Image
     ↓
Image Preprocessing
     ↓
CNN Model
     ↓
Feature Extraction
     ↓
Classification Layers
     ↓
Predicted Class
     ↓
Confidence Score

The final classes used by the deployed model are:

crack
no_damage
pothole
⚙️ Model Training

Training was performed using GPU-enabled computing resources.

The RDD2022 images were prepared for classification and used to train the custom CNN.

The general training workflow was:

RDD2022 Dataset
       ↓
Dataset Preparation
       ↓
Image Preprocessing
       ↓
Training / Validation Split
       ↓
Custom CNN
       ↓
TensorFlow/Keras Training
       ↓
Model Evaluation
       ↓
Saved Trained Model

The trained model is then loaded by the FastAPI backend for predictions.

💻 Technology Stack
Frontend
React.js
JavaScript
HTML
CSS
React Router
Backend
Python
FastAPI
Uvicorn
SQLAlchemy
Python Multipart
Machine Learning
TensorFlow
Keras
NumPy
Pillow
Authentication
JWT
Passlib
Bcrypt
Python-JOSE
Database
SQLite
SQLAlchemy ORM
Deployment
GitHub
Render
Google Colab / GPU-enabled environment for model training
🏗️ System Architecture
                    ┌──────────────────────┐
                    │      React.js        │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                               │ HTTP Requests
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI         │
                    │       Backend        │
                    └───────┬───────┬──────┘
                            │       │
              ┌─────────────┘       └─────────────┐
              ▼                                   ▼
     ┌──────────────────┐               ┌──────────────────┐
     │ TensorFlow CNN   │               │ SQLite Database  │
     │ Classification   │               │    + SQLAlchemy  │
     └──────────────────┘               └──────────────────┘
              │                                   │
              ▼                                   ▼
       Prediction +                     Reports / Users /
       Confidence                       Leaderboard Data
⚙️ Local Installation
1️⃣ Clone the Repository
git clone https://github.com/ce240004025-art/Road-Damage-Detection-2.0.git
cd Road-Damage-Detection-2.0
2️⃣ Backend Setup

Navigate to the backend:

cd backend

Create and activate a virtual environment.

Windows
python -m venv .venv
.\.venv\Scripts\Activate.ps1

Install the required dependencies:

pip install -r requirements.txt
3️⃣ Start the Backend

From the backend directory:

uvicorn main:app --reload

The API will normally be available at:

http://127.0.0.1:8000

FastAPI documentation:

http://127.0.0.1:8000/docs
4️⃣ Frontend Setup

Open another terminal and navigate to the frontend:

cd frontend

Install dependencies:

npm install

Start the React development server:

npm start

The frontend will normally run at:

http://localhost:3000
🌐 Deployment

The project is deployed using Render.

Backend

The FastAPI backend is deployed as a Render Web Service.

Backend URL:

https://road-damage-detection-2-0.onrender.com

Frontend

The React frontend is deployed as a Render Static Site.

The frontend communicates with the deployed FastAPI backend through the Render backend URL.

Production Flow
User
 ↓
React Frontend
 ↓
Render Static Site
 ↓
FastAPI Backend
 ↓
TensorFlow CNN
 ↓
Prediction
 ↓
SQLite Database
 ↓
Dashboard / Reports / Leaderboard
📤 How to Use the Application
Step 1 — Register

Create an account using the registration page.

Step 2 — Login

Log into the application using your credentials.

Step 3 — Upload an Image

Upload an image containing a road surface.

Step 4 — AI Classification

The custom CNN processes the image and predicts:

Crack
Pothole
No Damage

along with its confidence score.

Step 5 — Location

The application can obtain the user's latitude and longitude for the report.

Step 6 — Report Storage

The backend stores the report in the database.

Step 7 — Points

Valid contributions are awarded points.

Step 8 — Dashboard

Users can view their own reports, public reports, locations, and leaderboard rankings.

📊 Project Workflow
                User
                  │
                  ▼
          Register / Login
                  │
                  ▼
          Upload Road Image
                  │
                  ▼
        Duplicate Image Check
                  │
                  ▼
       Image Preprocessing
                  │
                  ▼
        Custom CNN (TensorFlow)
                  │
                  ▼
       ┌──────────┼──────────┐
       ▼          ▼          ▼
     Crack     Pothole    No Damage
       │          │          │
       └──────────┼──────────┘
                  ▼
          Confidence Score
                  │
                  ▼
          Location Metadata
                  │
                  ▼
          Store Report
                  │
                  ▼
            Award Points
                  │
                  ▼
       Dashboard / Leaderboard
📁 Project Structure
Road-Damage-Detection-2.0/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── reports.db
│   └── uploads/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── Upload.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── Dashboard.js
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
│
├── runtime.txt
└── README.md
🗄️ Database

The backend uses SQLite with SQLAlchemy.

The database stores information related to:

Users
Road-damage reports
Prediction results
Confidence scores
Geographic coordinates
Timestamps
Contribution points
☁️ Model Training Environment

The machine-learning model was trained using GPU-enabled computing resources.

The training environment allowed the CNN to be trained efficiently on the RDD2022 image dataset.

The trained TensorFlow/Keras model is subsequently used by the FastAPI backend during inference.

⚠️ Challenges Faced
1. Limited Initial Training Data

An initial training attempt with a smaller subset of images produced unsatisfactory classification performance.

Solution

A larger portion of the RDD2022 dataset was used for training and validation.

2. Model Deployment

Deploying a TensorFlow-based model on a cloud platform introduced compatibility and dependency issues.

Solution

The backend environment was configured with a compatible Python version and TensorFlow dependencies.

The final backend was successfully deployed on Render.

3. Frontend–Backend Integration

During development, the frontend initially used a local backend URL.

The production frontend was updated to communicate with the deployed FastAPI backend.

Local:
http://127.0.0.1:8000

Production:
https://road-damage-detection-2-0.onrender.com
4. Duplicate Reports

Repeated uploads of the same image could result in duplicate reports.

Solution

Image hashing was implemented to identify duplicate images before creating a new report.

👨‍💻 Team Members
Name	Role	Roll Number	GitHub
Chunduri Abhiram	Team Leader	240041011	@abhi3233
Enakollu Mahidhar Reddy	Developer	240001030	@enakollu-mahi
Chunchu Santhosh Rushendra	Developer	240004013	@chunchusanthoshrushendra
Katammagari Manas Joel	Developer	240004025	@ce240004025-art
🙏 Acknowledgements

We sincerely thank:

🎓 Institution

Science & Technology Council (SnT), IIT Indore

for organizing the IITISoC 2026 program and providing the platform to develop this project.

🧑‍🏫 Mentor

Sourav Rai — @Souravrai2005

for his:

Guidance
Feedback
Technical direction
🤝 Special Contributions

We deeply appreciate:

Hanumanthu Yerukula Yeshwanth Kumar — @KIRITO-899
Dodda Rishik

for providing GPU-enabled laptops that were valuable during model training.

📂 Resources
Dataset, Model & Training Results

Google Drive Folder

🔮 Future Improvements

Potential future improvements include:

📱 Mobile application
⚡ Real-time road-condition detection
🗺️ Improved GIS-based road monitoring
🏛️ Government/municipal dashboard integration
🚧 Road severity estimation
🔔 Automated maintenance alerts
📊 Advanced road-damage analytics
🤖 Improved CNN architecture and model accuracy
☁️ Scalable cloud database
📈 Historical road-condition tracking
📜 License

This project was developed as part of IITISoC 2026 and is intended primarily for academic and research purposes.

⭐ Final Note

This project demonstrates the integration of Machine Learning, Web Development, Database Systems, Geolocation, Authentication, and Cloud Deployment to address a real-world civil infrastructure problem.

The key machine-learning component is a custom-trained TensorFlow/Keras CNN, trained using road-damage imagery from RDD2022, and integrated into a FastAPI backend that serves predictions to a React-based web application.

The system provides an end-to-end pipeline:

Road Image → CNN Classification → Geo-Tagged Report → Database → Dashboard → Community Monitoring