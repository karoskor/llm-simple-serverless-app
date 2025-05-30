import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [timeframe, setTimeframe] = useState('4 weeks');
  const [loading, setLoading] = useState(false);
  const [learningPlan, setLearningPlan] = useState(null);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Fetch the config.json file on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/config.json');
        if (!response.ok) {
          throw new Error(`Failed to load config: ${response.status}`);
        }
        const configData = await response.json();
        console.log('Config loaded:', configData);
        setConfig(configData);
      } catch (err) {
        console.error('Error loading config:', err);
        setError('Failed to load application configuration. Please try again later.');
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!config || !config.apiUrl) {
      setError('Application not properly configured. Please try again later.');
      return;
    }

    setLoading(true);
    setError(null);
    setLearningPlan(null);

    try {
      const response = await fetch(`${config.apiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Remove the Origin header if you're testing locally
          // 'Origin': window.location.origin,
        },
        body: JSON.stringify({
          topic,
          difficulty,
          timeframe,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      setLearningPlan(data);
    } catch (err) {
      console.error('Error fetching learning plan:', err);
      setError('Failed to generate learning plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (configLoading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>AI Learning Plan Generator</h1>
        </header>
        <main>
          <div className="loading">
            <p>Loading application configuration...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Learning Plan Generator</h1>
        <p>Generate a personalized learning plan using Amazon Bedrock</p>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group">
            <label htmlFor="topic">What do you want to learn?</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Machine Learning, Web Development, AWS"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulty Level</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="timeframe">Timeframe</label>
            <select
              id="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="1 week">1 Week</option>
              <option value="2 weeks">2 Weeks</option>
              <option value="4 weeks">4 Weeks</option>
              <option value="8 weeks">8 Weeks</option>
              <option value="12 weeks">12 Weeks</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Learning Plan'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {loading && (
          <div className="loading">
            <p>Generating your personalized learning plan...</p>
          </div>
        )}

        {learningPlan && (
          <div className="learning-plan">
            <h2>{learningPlan.title}</h2>
            <div className="plan-meta">
              <p><strong>Topic:</strong> {learningPlan.topic}</p>
              <p><strong>Difficulty:</strong> {learningPlan.difficulty}</p>
              <p><strong>Duration:</strong> {learningPlan.duration}</p>
            </div>

            <h3>Weekly Plan</h3>
            {learningPlan.weeks.map((week) => (
              <div key={week.week} className="week-container">
                <h4>Week {week.week}: {week.focus}</h4>
                <div className="activities">
                  {week.activities.map((activity, index) => (
                    <div key={index} className="activity">
                      <h5>{activity.name}</h5>
                      <p>{activity.description}</p>
                      {activity.resources && activity.resources.length > 0 && (
                        <div className="activity-resources">
                          <strong>Resources:</strong>
                          <ul className="resources-list">
                            {activity.resources.map((resource, index) => (
                              <li key={index} className="resource-item">
                                <strong>{resource.name}</strong> ({resource.type})
                                {resource.url && (
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    {resource.url}
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {learningPlan.resources && learningPlan.resources.length > 0 && (
              <div className="resources-section">
                <h3>Additional Resources</h3>
                <ul className="resources-list">
                  {learningPlan.resources.map((resource, index) => (
                    <li key={index} className="resource-item">
                      <strong>{resource.name}</strong> ({resource.type})
                      {resource.url && (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          {resource.url}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
