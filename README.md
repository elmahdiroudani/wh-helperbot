# WH-HelperBot 🤖

A comprehensive WhatsApp AI University Assistant built with Node.js, TypeScript, Twilio, OpenAI, and LangChain.

## Features

- 📱 **WhatsApp Integration**: Seamless communication via Twilio WhatsApp API
- 🤖 **AI-Powered Responses**: Intelligent responses using OpenAI GPT and LangChain
- 🎓 **University Knowledge Base**: Comprehensive information about courses, faculty, schedules, and events
- 🔒 **Security**: Rate limiting, input validation, and secure webhook handling
- 📊 **Logging & Monitoring**: Comprehensive logging with Winston
- 🚀 **Production Ready**: Proper error handling, environment configuration, and deployment setup

## Architecture

```
├── src/
│   ├── config/           # Configuration management
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── models/          # TypeScript interfaces
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utilities and helpers
├── data/
│   └── mock/            # Mock university data
├── logs/                # Application logs
└── tests/               # Test files
```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Twilio Account with WhatsApp API access
- OpenAI API key

## Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd WH-HelperBot
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=whatsapp:+14155238886

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Build and Start**
   ```bash
   npm run build
   npm start
   ```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Available Scripts
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run dev:watch` - Development mode with file watching
- `npm run clean` - Clean build directory

## API Endpoints

### WhatsApp Webhook
- `POST /api/webhook` - Twilio WhatsApp webhook endpoint

### Data Endpoints
- `GET /api/courses` - Get courses (with optional search)
- `GET /api/faculty` - Get faculty information
- `GET /api/events` - Get upcoming university events
- `GET /api/stats` - Get system statistics

### Utility Endpoints
- `GET /api/health` - Health check
- `GET /` - API information

## WhatsApp Bot Capabilities

The bot can help with:

### 📚 Course Information
- Course schedules and details
- Prerequisites and credits
- Instructor information
- Room assignments

**Example**: "*Tell me about CS101*" or "*When is my Computer Science class?*"

### 👩‍🏫 Faculty Directory
- Professor contact information
- Office hours
- Department affiliations
- Specializations

**Example**: "*What are Dr. Johnson's office hours?*" or "*Who teaches Physics?*"

### 📅 Academic Calendar
- Important dates and deadlines
- Exam schedules
- Holiday information
- Upcoming events

**Example**: "*When is the final exam for Math 150?*" or "*What's coming up this week?*"

### ❓ General Help
- University policies
- Contact information
- Directions and assistance

**Example**: "*How can I contact the registrar?*" or "*Help me find information about...*"

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Yes |
| `TWILIO_PHONE_NUMBER` | WhatsApp Business Number | Yes |
| `OPENAI_API_KEY` | OpenAI API Key | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port | No |
| `LOG_LEVEL` | Logging level | No |

### Rate Limiting
- General API: 100 requests per 15 minutes per IP
- WhatsApp Webhook: 10 requests per minute per phone number

### Security Features
- Helmet.js for security headers
- CORS configuration
- Request validation with Joi
- Webhook signature verification
- Input sanitization

## Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start dist/server.js --name wh-helperbot
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
COPY data/ ./data/
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Environment Setup
1. Set environment variables on your server
2. Configure webhook URL in Twilio Console
3. Ensure HTTPS is enabled for webhook endpoint
4. Set up proper logging and monitoring

## Monitoring and Logging

### Log Files
- `logs/app.log` - Application logs
- `logs/error.log` - Error logs only

### Health Check
Access `/api/health` to verify system status.

### Statistics
Access `/api/stats` for system metrics including:
- Active WhatsApp sessions
- Message counts
- University data statistics
- System performance

## Customization

### Adding New University Data
1. Update JSON files in `data/mock/`
2. Modify interfaces in `src/models/index.ts`
3. Update data service methods in `src/services/dataService.ts`

### Extending AI Capabilities
1. Modify prompts in `src/services/aiService.ts`
2. Add new intent classification
3. Extend context gathering logic

### Adding New Endpoints
1. Add routes in `src/routes/index.ts`
2. Create controller methods in `src/controllers/`
3. Add validation schemas in `src/utils/validation.ts`

## Testing

### Manual Testing
1. Start the development server
2. Use tools like ngrok for webhook testing:
   ```bash
   ngrok http 3000
   ```
3. Configure Twilio webhook URL with ngrok URL

### API Testing
Use tools like Postman or curl to test endpoints:
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/courses?query=computer
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Verify Twilio webhook URL is correct
   - Check HTTPS configuration
   - Verify webhook signature validation

2. **AI responses not working**
   - Confirm OpenAI API key is valid
   - Check API rate limits
   - Review logs for errors

3. **Rate limiting issues**
   - Adjust rate limit configuration
   - Check if requests are properly distributed

### Debugging

Enable debug logging:
```env
LOG_LEVEL=debug
```

Check logs:
```bash
tail -f logs/app.log
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Check the logs for error details
- Review the documentation
- Create an issue in the repository

---

Built with ❤️ using Node.js, TypeScript, Twilio, OpenAI, and LangChain.
