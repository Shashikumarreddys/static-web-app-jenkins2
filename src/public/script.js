async function checkHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        document.getElementById('status').innerHTML = `
            <strong>Status:</strong> ${data.status} 
            <br><strong>Time:</strong> ${new Date(data.timestamp).toLocaleTimeString()}
        `;
    } catch (error) {
        document.getElementById('status').innerHTML = `<strong style="color: red;">Error:</strong> ${error.message}`;
    }
}

async function fetchData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        document.getElementById('data').innerHTML = `
            <div>
                <strong>Message:</strong> ${data.message}<br>
                <strong>Version:</strong> ${data.version}<br>
                <strong>Features:</strong> ${data.features.join(', ')}
            </div>
        `;
    } catch (error) {
        document.getElementById('data').innerHTML = `<strong style="color: red;">Error:</strong> ${error.message}`;
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) {
        document.getElementById('response').innerHTML = '<strong style="color: red;">Please enter a message</strong>';
        return;
    }
    
    try {
        const response = await fetch('/api/echo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        document.getElementById('response').innerHTML = `
            <div>
                <strong>Echo:</strong> ${data.received}<br>
                <strong>Time:</strong> ${new Date(data.timestamp).toLocaleTimeString()}
            </div>
        `;
        messageInput.value = '';
    } catch (error) {
        document.getElementById('response').innerHTML = `<strong style="color: red;">Error:</strong> ${error.message}`;
    }
}

// Load data on page load
window.addEventListener('load', () => {
    checkHealth();
    fetchData();
});
