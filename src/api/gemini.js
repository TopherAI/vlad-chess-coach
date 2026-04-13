export const askCoach = async (persona, userMessage) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${persona}\n\nUser: ${userMessage}`
      }),
    });
    
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Coach Communication Failure:", error);
    return "I've lost the connection to the analysis room. Check the logs.";
  }
};
