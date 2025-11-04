document.getElementById('backupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const backupName = document.getElementById('backupName').value.trim();
    const saveSlot = document.getElementById('saveSlot').value;

    if (!backupName) {
        showResult('Please enter a backup name.', 'error');
        return;
    }

    if (!saveSlot) {
        showResult('Please select a save slot.', 'error');
        return;
    }

    try {
        const response = await fetch('/create-backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backupName, saveSlot })
        });

        const data = await response.json();

        if (response.ok) {
            showResult(data.message, 'success');
            document.getElementById('backupName').value = '';
        } else {
            showResult(data.error || 'An error occurred', 'error');
        }
    } catch (error) {
        showResult('Network error: ' + error.message, 'error');
    }
});

function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = message;
    resultDiv.className = `result ${type}`;
    resultDiv.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 5000);
    }
}