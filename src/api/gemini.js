export const askCoach = async (persona, userMessage) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${persona}\n\nUser: ${userMessage}`
      }),
    });
    
    if (!response.ok) throw new Error('Network response failure');
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Coach Communication Failure:", error);
    return "Connection lost to the analysis room. Check system logs.";
  }
};
