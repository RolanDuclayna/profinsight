# ProfInsight - High Level Use Cases Analysis

## 1. PRIMARY ACTORS

### 1.1 Student
**Description:** College/university student actively selecting courses and professors
**Characteristics:**
- Uses university course registration systems
- Seeks information about professor quality and teaching styles
- Makes decisions about course enrollment
- Can be undergraduate or graduate level

### 1.2 Premium Subscriber (Student)
**Description:** Student who has upgraded to premium features
**Characteristics:**
- Pays $4.99/month or $39.99/year
- Requires advanced features like detailed comparisons and AI recommendations
- Higher engagement with the platform

---

## 2. SECONDARY ACTORS

### 2.1 Academic Advisor
**Description:** Professional who guides students through course selection
**Characteristics:**
- Needs aggregated professor performance data
- Makes recommendations to multiple students
- Interested in student success outcomes

### 2.2 University Administrator
**Description:** Institution representative managing educational programs
**Characteristics:**
- Monitors teaching quality and student satisfaction
- Makes data-driven decisions about curriculum
- Potential institutional license purchaser

### 2.3 Professor/Instructor
**Description:** Faculty member being rated by students
**Characteristics:**
- Subject of ratings and reviews
- May view and respond to feedback
- Interested in maintaining reputation

### 2.4 System Administrator
**Description:** Technical personnel maintaining ProfInsight platform
**Characteristics:**
- Manages backend infrastructure
- Ensures data accuracy and system performance
- Handles integrations with university systems

---

## 3. USE CASES BY ACTOR

### 3.1 Student Use Cases

#### UC-1: View Professor Ratings
**Actor:** Student  
**Description:** Student views comprehensive ratings and reviews for a professor while browsing the course catalog  
**Preconditions:** Extension installed, student is on university registration page  
**Postconditions:** Rating information displayed as overlay card  

#### UC-2: Compare Multiple Professors
**Actor:** Student  
**Description:** Student compares different professors teaching the same course section  
**Preconditions:** Multiple sections available, extension active  
**Postconditions:** Side-by-side comparison displayed with key metrics  

#### UC-3: View Grade Distribution
**Actor:** Student  
**Description:** Student examines historical grade distribution for a professor's course  
**Preconditions:** Grade data available in system  
**Postconditions:** Histogram chart displayed showing grade percentages  

#### UC-4: Submit Professor Review
**Actor:** Student  
**Description:** Student writes and submits a review for a professor they've taken  
**Preconditions:** Student account verified, enrolled in course previously  
**Postconditions:** Review published and contributes to aggregate ratings  

#### UC-5: Search for Specific Professor
**Actor:** Student  
**Description:** Student searches directly for a professor by name  
**Preconditions:** Extension installed  
**Postconditions:** Professor profile displayed with all available data  

#### UC-6: Set Personal Preferences
**Actor:** Student  
**Description:** Student configures learning style preferences and teaching attribute priorities  
**Preconditions:** User account created  
**Postconditions:** Preferences saved and used for personalized recommendations  

#### UC-7: Follow Professor
**Actor:** Student  
**Description:** Student subscribes to updates about a specific professor  
**Preconditions:** User account created  
**Postconditions:** Student receives notifications when professor teaches new courses  

#### UC-8: View AI Teaching Style Summary
**Actor:** Student  
**Description:** Student reads AI-generated summary of professor's teaching approach  
**Preconditions:** Sufficient reviews available for analysis  
**Postconditions:** Concise teaching style summary displayed  

---

### 3.2 Premium Subscriber Use Cases

#### UC-9: Access Advanced Comparisons
**Actor:** Premium Subscriber  
**Description:** Compare more than 3 professors simultaneously with detailed metrics  
**Preconditions:** Premium subscription active  
**Postconditions:** Comprehensive comparison table displayed  

#### UC-10: Use Schedule Optimizer
**Actor:** Premium Subscriber  
**Description:** Receive AI-powered recommendations for optimal semester schedule  
**Preconditions:** Premium subscription, course preferences set  
**Postconditions:** Optimized schedule suggestions with workload balance analysis  

#### UC-11: Access Historical Grade Data
**Actor:** Premium Subscriber  
**Description:** View multi-year grade distribution trends  
**Preconditions:** Premium subscription active  
**Postconditions:** Historical grade data and trends displayed  

#### UC-12: Filter Reviews by Demographics
**Actor:** Premium Subscriber  
**Description:** Filter reviews by student major, year, or other characteristics  
**Preconditions:** Premium subscription, demographic data available  
**Postconditions:** Filtered review list displayed  

#### UC-13: Receive Personalized Match Scores
**Actor:** Premium Subscriber  
**Description:** View compatibility scores between student preferences and professors  
**Preconditions:** Premium subscription, preferences configured  
**Postconditions:** Match scores calculated and displayed for each professor  

---

### 3.3 Academic Advisor Use Cases

#### UC-14: View Aggregated Professor Data
**Actor:** Academic Advisor  
**Description:** Access comprehensive professor performance metrics for advising purposes  
**Preconditions:** Advisor access granted  
**Postconditions:** Advisor dashboard displayed with key metrics  

#### UC-15: Generate Course Recommendations
**Actor:** Academic Advisor  
**Description:** Use platform data to recommend courses to advised students  
**Preconditions:** Student academic profile available  
**Postconditions:** Data-driven course recommendations provided  

#### UC-16: Track Student Success Patterns
**Actor:** Academic Advisor  
**Description:** Monitor correlation between professor selection and student outcomes  
**Preconditions:** Institutional data access  
**Postconditions:** Success pattern reports generated  

---

### 3.4 University Administrator Use Cases

#### UC-17: Access Administrative Dashboard
**Actor:** University Administrator  
**Description:** View usage analytics and student engagement metrics  
**Preconditions:** Institutional license active  
**Postconditions:** Dashboard displayed with key institutional metrics  

#### UC-18: Monitor Teaching Quality Trends
**Actor:** University Administrator  
**Description:** Analyze aggregate teaching effectiveness data across departments  
**Preconditions:** Sufficient data collected  
**Postconditions:** Quality trend reports generated  

#### UC-19: Export Data for Analysis
**Actor:** University Administrator  
**Description:** Download anonymized data for institutional research  
**Preconditions:** Institutional license, data partnership agreement  
**Postconditions:** CSV/JSON data exported  

#### UC-20: Configure Institution Branding
**Actor:** University Administrator  
**Description:** Customize platform appearance with university colors and logos  
**Preconditions:** Institutional license active  
**Postconditions:** Branded interface deployed for institution's students  

---

### 3.5 Professor/Instructor Use Cases

#### UC-21: View Own Ratings
**Actor:** Professor  
**Description:** Professor reviews their own ratings and student feedback  
**Preconditions:** Professor account created  
**Postconditions:** Personal rating dashboard displayed  

#### UC-22: Respond to Reviews
**Actor:** Professor  
**Description:** Professor provides context or responses to student reviews  
**Preconditions:** Review response feature enabled  
**Postconditions:** Response published alongside review  

#### UC-23: Track Rating Trends Over Time
**Actor:** Professor  
**Description:** Professor monitors changes in ratings across semesters  
**Preconditions:** Multiple semesters of data available  
**Postconditions:** Trend analysis displayed  

---

### 3.6 System Administrator Use Cases

#### UC-24: Maintain University Integration
**Actor:** System Administrator  
**Description:** Update web scraping patterns for university course catalogs  
**Preconditions:** Access to admin tools  
**Postconditions:** Integration maintained and functional  

#### UC-25: Monitor Data Quality
**Actor:** System Administrator  
**Description:** Review flagged reviews and detect anomalies  
**Preconditions:** Admin access granted  
**Postconditions:** Data quality maintained, suspicious content moderated  

#### UC-26: Manage User Accounts
**Actor:** System Administrator  
**Description:** Handle account issues, verification, and access control  
**Preconditions:** Admin privileges  
**Postconditions:** User accounts properly configured  

#### UC-27: Configure AI Models
**Actor:** System Administrator  
**Description:** Update and retrain machine learning models  
**Preconditions:** Access to ML infrastructure  
**Postconditions:** Improved model performance deployed  

---

## 4. SYSTEM INTERACTIONS

### External Systems
- **University Registration Systems**: Source of course and professor information
- **RateMyProfessors API**: External rating data source
- **Reddit/Forums**: Additional review data sources
- **University Course Evaluation Systems**: Institutional rating data
- **Payment Gateway**: Processes premium subscriptions
- **Email Service**: Verification and notifications
- **Analytics Platform**: Tracks usage and performance metrics

---

## 5. KEY SYSTEM FEATURES SUPPORTING USE CASES

### 5.1 Core Features
- Automatic professor name detection on course pages
- Multi-source rating aggregation
- AI-powered teaching style analysis
- Grade distribution visualization
- Real-time data synchronization

### 5.2 Premium Features
- Advanced multi-professor comparison
- Schedule optimization algorithms
- Historical trend analysis
- Demographic-filtered reviews
- Personalized matching algorithms

### 5.3 Administrative Features
- Usage analytics dashboard
- Data export capabilities
- Custom branding configuration
- Institutional reporting tools
- API access for integration

---

## 6. MAIN USE CASE RELATIONSHIPS

### Inheritance Relationships
- Premium Subscriber extends Student capabilities
- Academic Advisor has specialized access overlapping with Student features

### Include Relationships
- Most student use cases include "Authenticate User"
- Rating display includes "Aggregate Multi-Source Data"
- Premium features include "Verify Subscription Status"

### Extend Relationships
- "Submit Review" can extend "View Professor Ratings"
- "Follow Professor" can extend "View Professor Profile"
- "Filter Reviews" extends "View Reviews"
