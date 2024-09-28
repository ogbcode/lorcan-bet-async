Syncalize Setup Instructions
1. Run ngrok on Port 3000
To expose your local application to the internet, run ngrok on port 3000:

bash
ngrok http 3000

2. Create a .env File
In your project root directory, create a file named .env and add the following content:

APP_NAME="Syncalize"
APP_DESCRIPTION="A seamless Google Calendar integration service enabling real-time event synchronization with scalable Kafka-powered background processing."
PORT=3000
APP_SERVER_LISTEN_IP='0.0.0.0'
API_VERSION="1.0"
GLOBAL_PREFIX="v1"

# Local Database Configuration
POSTGRES_USER="your postgress user"
POSTGRES_HOST="localhost"
POSTGRES_PASSWORD="Your postgress password"
POSTGRES_DATABASE="Ferocia"
POSTGRES_PORT="5432"

# Google Integration
GOOGLE_CLIENT_ID="Your client ID"
GOOGLE_CLIENT_SECRET="Your client Secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/backend/v1/auth/google/callback"

# Webhook URL for Google Calendar Events
WEBHOOKURL="<ngrok address>/backend/v1/calendar/event/webhook2"
Note: Replace <ngrok address> with the actual ngrok address generated, e.g., https://abcd1234.ngrok.io.


3. Start Kafka Service and PostgreSQL Database
Use Docker Compose to start the Kafka service and PostgreSQL database:
docker-compose up --build

4. Start the Application
Finally, start your application using npm:

bash
Copy code
npm run start

Important Note
The logic for handling wehook events may be incorrect due to google sending only headers and no payload data in the webhook request for some reason.Due to this, I had no correct data to develop with.


Code explanation
In this design, I chose NestJS for its modular architecture, which facilitates seamless integration with various libraries and promotes maintainability. For database management, TypeORM was utilized due to its simplicity and efficiency in managing interactions with the database.

To achieve robust error handling, I implemented a global error interceptor and filter, complemented by well-structured try-catch blocks. Additionally, Kafka was incorporated for asynchronous synchronization of calendars and events. I created two consumers: one for syncing a user's calendar and its events, and another for handling webhooks from Google Calendar events. This approach enhances performance and ensures reliable event processing.I also implemented the swagger for API documentation
