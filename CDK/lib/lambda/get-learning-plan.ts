import { APIGatewayProxyHandler } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Initialize the Bedrock client
const bedrockClient = new BedrockRuntimeClient({ region: process.env.REGION || 'us-west-2' });

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Event received:', JSON.stringify(event));

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
    const body = event.body ? JSON.parse(event.body) : {};
    const { topic = 'General', difficulty = 'intermediate', timeframe = '4 weeks' } = body;

    // Create the prompt for Bedrock
    // Create a simpler, more direct prompt for Bedrock
    const prompt = `Generate a JSON learning plan for ${topic} at ${difficulty} level for ${timeframe}.

    Return ONLY valid JSON with this exact structure:
    \`\`\`json
    {
      "title": "Learning Plan for ${topic}",
      "topic": "${topic}",
      "difficulty": "${difficulty}",
      "duration": "${timeframe}",
      "weeks": [
        {
          "week": number,
          "focus": "string",
          "activities": [
            {
              "name": "string",
              "description": "string",
              "resources": ["string"]
            }
          ]
        }
      ],
      "resources": [
        {
          "name": "string",
          "type": "string",
          "url": "string"
        }
      ]
    }
    \`\`\`
    Include ${timeframe.includes('week') ? timeframe.split(' ')[0] : '4'} weeks of content. Do not include any explanations or text outside the JSON.`;

    console.log('Prompt:', prompt);
    // Call Bedrock with Amazon Titan model (available by default with on-demand throughput)
    const modelId = 'amazon.titan-text-express-v1';
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: prompt,
          textGenerationConfig: {
            maxTokenCount: 2048,
            temperature: 0.1,
            topP: 0.9
          }
        }),
      })
    );

    // Parse the Bedrock response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Bedrock response:', responseBody);

    // Extract the JSON from the text response
    const jsonMatch = responseBody.results?.[0]?.outputText.match(/\{[\s\S]*\}/);
    let learningPlan = {
        title: `Learning Plan for ${topic}`,
        topic,
        difficulty,
        duration: timeframe,
        weeks: [{ week: 1, focus: 'Getting Started', activities: [{ name: 'Introduction', description: `Learn the basics of ${topic}`, resources: [] }] }],
        resources: []
      };

    if (jsonMatch) {
      try {
        learningPlan = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Error parsing JSON from Bedrock response:', parseError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(learningPlan)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};