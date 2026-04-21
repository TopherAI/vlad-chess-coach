export const askCoach = async (persona, userMessage) => {
  const gatewayUrl = import.meta.env.VITE_GATEWAY_URL;
  const gatewayKey = import.meta.env.VITE_GATEWAY_API_KEY;
  try {
    const response = await fetch(`${gatewayUrl}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': gatewayKey,
      },
      body: JSON.stringify({
        content: `${persona}\n\nUser: ${userMessage}`,
        role: 'user',
        task_type: 'chess_coaching',
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
