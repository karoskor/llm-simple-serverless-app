import { APIGatewayProxyHandler } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Initialize the Bedrock client outside the handler for connection reuse
const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.REGION || 'us-west-2',
  maxAttempts: 3 // Add retry configuration
});

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Event received:', JSON.stringify(event));
  console.log('Event body received:', JSON.stringify(event.body));

  // Define CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Origin,Accept'
  };

  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse the request body if it exists
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    let topic, difficulty, timeframe;
    try {
      const requestBody = JSON.parse(event.body);
      topic = requestBody.topic;
      difficulty = requestBody.difficulty;
      timeframe = requestBody.timeframe;

      // Validate required fields
      if (!topic || !difficulty || !timeframe) {
        return {
          statusCode: 400, 
          headers,
          body: JSON.stringify({ error: 'Missing required fields: topic, difficulty, timeframe' })
        };
      }
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    // Create a more concise prompt for Bedrock
    const prompt = `Create a ${difficulty} ${timeframe} learning plan for ${topic}. Return only valid JSON with this exact structure:
    \`\`\`json
    {
      "title": "Learning Plan for ${topic}",
      "topic": "${topic}",
      "difficulty": "${difficulty}",
      "duration": "${timeframe}",
      "weeks": [{"week": 1, "focus": "", "activities": [{"name": "", "description": "", "resources": []}]}],
      "resources": [{"name": "", "type": "", "url": ""}]
    \`\`\`
    Include ${timeframe.includes('week') ? timeframe.split(' ')[0] : '4'} weeks of content.
    Do not include any explanations or text outside the JSON.`;

    console.log('Prompt:', prompt);

    // Set up timeout handling for Bedrock call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Bedrock request timed out')), 25000); // 25 second timeout
    });

    try {
      // Race the Bedrock call against the timeout
      const response = await Promise.race([
        bedrockClient.send(
          new InvokeModelCommand({
            modelId: 'amazon.titan-text-express-v1',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
              inputText: prompt,
              textGenerationConfig: {
                maxTokenCount: 1500,
                temperature: 0.4,    // Slightly higher for faster responses
                topP: 0.8,           // Slightly lower for more focused responses
              }
            }),
          })
        ),
        timeoutPromise
      ]) as any; // Type assertion to avoid TypeScript error

      // Parse the Bedrock response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      console.log('Bedrock response:', responseBody);

      // More robust JSON extraction
      let learningPlan = {
        title: `Learning Plan for ${topic}`,
        topic,
        difficulty,
        duration: timeframe,
        weeks: [{ week: 1, focus: 'Getting Started', activities: [{ name: 'Introduction', description: `Learn the basics of ${topic}`, resources: [] }] }],
        resources: []
      };

      const outputText = responseBody.results?.[0]?.outputText || '';

      try {
        // Try direct parsing first
        learningPlan = JSON.parse(outputText.trim());
      } catch (directParseError) {
        // Fall back to regex extraction if needed
        try {
          const jsonMatch = outputText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            learningPlan = JSON.parse(jsonMatch[0]);
          }
        } catch (regexParseError) {
          console.error('Error parsing JSON from Bedrock response:', regexParseError);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(learningPlan)
      };
    } catch (error: any) { // Type assertion for error
      if (error.message === 'Bedrock request timed out') {
        console.log('Bedrock request timed out, returning simplified response');
        // Return a simplified response instead of failing
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            title: `Learning Plan for ${topic}`,
            topic,
            difficulty,
            duration: timeframe,
            weeks: [{ 
              week: 1, 
              focus: 'Getting Started', 
              activities: [{ 
                name: 'Introduction', 
                description: `Learn the basics of ${topic}`, 
                resources: [] 
              }] 
            }],
            resources: []
          })
        };
      }
      
      throw error; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
